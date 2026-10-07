// Core page-analysis logic. Pure functions: take page text + criteria, return
// per-criterion verdicts. Honest three-state results:
//   'yes'     — the page explicitly supports the criterion
//   'no'      — the page explicitly contradicts the criterion
//   'unknown' — the page doesn't say (NEVER guessed)
import { detectDestination } from './destinations.mjs';

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;|&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippet(text, index, len = 120) {
  const start = Math.max(0, index - 40);
  return '…' + text.slice(start, start + len).trim() + '…';
}

function findFirst(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return { match: m[0], index: m.index };
  }
  return null;
}

const RX = {
  oceanfrontYes: [
    /ocean\s?front/i, /beach\s?front/i, /direct(ly)? on the (beach|ocean|sand|gulf)/i,
    /on the beach/i, /private beach/i, /direct beach access/i, /gulf[- ]front/i,
    /steps? (from|to) the (beach|sand|ocean)/i, /sea\s?front/i, /lagoon[- ]?(side|front)/i,
    /water\s?front/i,
  ],
  oceanfrontNo: [
    /not (on the beach|beachfront|oceanfront)/i, /no beach access/i,
    /(short |a )?(drive|shuttle) to the beach/i, /miles? (from|to) the beach/i, /landlocked/i,
  ],
  poolYes: [
    /private (heated |saltwater |infinity |plunge |swimming )*pool/i,
    /(your|its) own (private )?(plunge |infinity )?pool/i,
    /pool (is )?(completely |fully )?private/i, /private pool/i,
  ],
  poolShared: [
    /community pool/i, /shared pool/i, /resort[- ]style pool(?!.{0,30}private)/i,
    /communal pool/i, /access to (the )?(community|resort) pool/i,
  ],
  poolNo: [/no pool/i, /pool not available/i],
  poolMention: [/\bpool\b/i, /plunge pool/i, /infinity pool/i],
  hotTubYes: [/hot ?tub/i, /jacuzzi/i, /whirlpool spa/i, /spa tub/i, /jetted (outdoor )?spa/i],
  hotTubNo: [/no hot ?tub/i],
  standaloneYes: [
    /stand[- ]?alone/i, /single[- ]family/i, /private (detached )?(home|house|residence|estate|retreat)/i,
    /detached (home|house|villa)/i, /entire (home|house|villa)/i, /private villa/i, /secluded (villa|home|estate)/i,
  ],
  standaloneNo: [
    /\bcondo(minium)?s?\b/i, /town\s?(house|home)s?\b/i, /\bapartment\b/i, /\bduplex\b/i,
    /hotel room/i, /resort (unit|suite|room)/i, /\bflat\b(?! screen| rate)/i, /high[- ]rise/i,
  ],
  adultsYes: [/adults?[- ]only/i, /adult[- ]exclusive/i, /\b(18|21)\s?\+\s?only\b/i, /no (children|kids)/i, /couples[- ]only/i],
  adultsNo: [
    /family[- ]friendly/i, /kid[- ]friendly/i, /child[- ]friendly/i, /(kids?|children) (are )?welcome/i,
    /kids['’]? club/i, /great for (families|kids)/i, /water\s?park/i, /perfect for famil/i,
  ],
  chefYes: [
    /private chef/i, /chef service/i, /chef (is )?(available|included|on request|upon request)/i,
    /in[- ]villa (chef|dining)/i, /fully staffed/i, /butler/i, /catering (service )?(is )?available/i, /personal chef/i,
  ],
  bedrooms: /(\d{1,2})[-\s]*(bed\s?room|br\b|bdrm)/gi,
};

export function analyzeText(rawText, criteria, meta = {}) {
  const text = rawText.slice(0, 400000);
  const checks = {};

  // --- Oceanfront ---
  {
    const yes = findFirst(text, RX.oceanfrontYes);
    const no = findFirst(text, RX.oceanfrontNo);
    checks.oceanfront = yes
      ? { status: 'yes', evidence: snippet(text, yes.index) }
      : no
        ? { status: 'no', evidence: snippet(text, no.index) }
        : { status: 'unknown', evidence: 'Page does not clearly state oceanfront/beachfront.' };
  }

  // --- Private pool ---
  {
    const priv = findFirst(text, RX.poolYes);
    const shared = findFirst(text, RX.poolShared);
    const no = findFirst(text, RX.poolNo);
    if (priv) checks.privatePool = { status: 'yes', evidence: snippet(text, priv.index) };
    else if (no) checks.privatePool = { status: 'no', evidence: snippet(text, no.index) };
    else if (shared) checks.privatePool = { status: 'no', evidence: 'Only a shared/community pool is mentioned: ' + snippet(text, shared.index) };
    else {
      const any = findFirst(text, RX.poolMention);
      checks.privatePool = any
        ? { status: 'unknown', evidence: 'A pool is mentioned but the page doesn\'t say whether it\'s private: ' + snippet(text, any.index) }
        : { status: 'unknown', evidence: 'No pool mentioned on the page.' };
    }
  }

  // --- Hot tub ---
  {
    const yes = findFirst(text, RX.hotTubYes);
    const no = findFirst(text, RX.hotTubNo);
    checks.hotTub = yes
      ? { status: 'yes', evidence: snippet(text, yes.index) }
      : no
        ? { status: 'no', evidence: snippet(text, no.index) }
        : { status: 'unknown', evidence: 'No hot tub mentioned — ask the property before booking.' };
  }

  // --- Bedrooms ---
  {
    let max = 0; let found = false; let m;
    const rx = new RegExp(RX.bedrooms.source, 'gi');
    while ((m = rx.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n <= 30) { found = true; if (n > max) max = n; }
    }
    if (found) {
      checks.bedrooms = max >= criteria.minBedrooms
        ? { status: 'yes', evidence: `Page mentions up to ${max} bedroom(s) (you need ${criteria.minBedrooms}+).`, value: max }
        : { status: 'no', evidence: `Largest mentioned is ${max} bedroom(s); you need ${criteria.minBedrooms}+.`, value: max };
    } else {
      checks.bedrooms = { status: 'unknown', evidence: 'Bedroom count not found on page.' };
    }
  }

  // --- Standalone residence ---
  {
    const yes = findFirst(text, RX.standaloneYes);
    const no = findFirst(text, RX.standaloneNo);
    if (yes && !no) checks.standalone = { status: 'yes', evidence: snippet(text, yes.index) };
    else if (no && !yes) checks.standalone = { status: 'no', evidence: 'Page mentions non-standalone units: ' + snippet(text, no.index) };
    else if (yes && no) checks.standalone = { status: 'unknown', evidence: 'Page mentions both standalone homes AND condos/townhouses — likely a mixed platform. Verify the specific property.' };
    else checks.standalone = { status: 'unknown', evidence: 'Property type not clearly stated.' };
  }

  // --- Adults only ---
  {
    const yes = findFirst(text, RX.adultsYes);
    const no = findFirst(text, RX.adultsNo);
    if (yes) checks.adultsOnly = { status: 'yes', evidence: snippet(text, yes.index) };
    else if (no) checks.adultsOnly = { status: 'no', evidence: snippet(text, no.index) };
    else checks.adultsOnly = { status: 'unknown', evidence: 'No adults-only policy stated. Private homes usually have no such policy — for a whole-house rental this may not matter; for a resort, ask.' };
  }

  // --- Chef ---
  {
    const yes = findFirst(text, RX.chefYes);
    checks.chef = yes
      ? { status: 'yes', evidence: snippet(text, yes.index) }
      : { status: 'unknown', evidence: 'No chef service mentioned — ask the property.' };
  }

  // --- Price ---
  {
    const prices = [];
    const priceRx = /\$\s?([\d,]{3,11})(?:\.\d{2})?\s*(?:usd)?\s*(?:\/|per\s*|a\s*)?\s*(night|nt\b|week|wk\b|day\b)?/gi;
    let m;
    while ((m = priceRx.exec(text)) !== null) {
      const amount = parseInt(m[1].replace(/,/g, ''), 10);
      if (amount >= 100 && amount <= 500000) {
        prices.push({ amount, unit: (m[2] || '').toLowerCase(), index: m.index });
      }
    }
    const nightly = prices.filter(p => p.unit.startsWith('n') || p.unit === 'day');
    const weekly = prices.filter(p => p.unit.startsWith('w'));
    let est = null; let basis = null; let evIdx = null;
    if (weekly.length) {
      est = Math.min(...weekly.map(p => p.amount)); basis = 'weekly rate shown on page';
      evIdx = weekly.find(p => p.amount === est).index;
    } else if (nightly.length) {
      const n = Math.min(...nightly.map(p => p.amount));
      est = n * 7; basis = `$${n.toLocaleString()}/night × 7 nights`;
      evIdx = nightly.find(p => p.amount === n).index;
    }
    if (est !== null) {
      checks.budget = {
        status: est <= criteria.maxWeeklyBudget ? 'yes' : 'no',
        evidence: `~$${est.toLocaleString()}/week (${basis}; from lowest price found — your dates may differ): ${snippet(text, evIdx)}`,
        value: est,
      };
    } else {
      checks.budget = { status: 'unknown', evidence: 'No price found on page — likely quote-on-request, or shown only in their booking calendar.' };
    }
  }

  // --- Destination / flights / April swim ---
  const destText = (meta.title || '') + ' ' + (meta.url || '') + ' ' + text.slice(0, 20000);
  const dest = detectDestination(destText);
  if (dest) {
    const bestHours = Math.min(dest.atl, dest.clt);
    if (!dest.nonstop || bestHours >= 900) {
      checks.flights = { status: 'no', evidence: `${dest.label}: no practical nonstop from ATL/CLT. ${dest.note || ''}`.trim(), dest: dest.label };
    } else {
      checks.flights = {
        status: bestHours <= criteria.maxFlightHours ? 'yes' : 'no',
        evidence: `${dest.label}: nonstop ~${dest.atl}h from ATL / ~${dest.clt}h from CLT (approximate — verify for your dates). ${dest.note || ''}`.trim(),
        dest: dest.label,
      };
    }
    checks.aprilSwim = dest.aprilSwim === 'yes'
      ? { status: 'yes', evidence: `${dest.label}: water is warm enough to swim in April.` }
      : dest.aprilSwim === 'borderline'
        ? { status: 'unknown', evidence: `${dest.label}: borderline in April. ${dest.note || 'Fine for August.'}`.trim() }
        : { status: 'no', evidence: `${dest.label}: too cold to swim in April. ${dest.note || ''}`.trim() };
  } else {
    checks.flights = { status: 'unknown', evidence: 'Couldn\'t determine the destination from the page — check flights manually.' };
    checks.aprilSwim = { status: 'unknown', evidence: 'Destination not identified.' };
  }

  return { checks, destination: dest ? dest.label : null };
}

export const CRITERIA_LABELS = {
  flights: { label: 'Nonstop flight within limit (ATL/CLT)', key: 'requireFlights' },
  oceanfront: { label: 'Oceanfront / beachfront', key: 'requireOceanfront' },
  privatePool: { label: 'Private pool', key: 'requirePrivatePool' },
  hotTub: { label: 'Hot tub', key: 'requireHotTub' },
  bedrooms: { label: 'Bedrooms', key: 'requireBedrooms' },
  standalone: { label: 'Standalone residence', key: 'requireStandalone' },
  budget: { label: 'Within budget', key: 'requireBudget' },
  adultsOnly: { label: 'Adults-only', key: 'requireAdultsOnly' },
  chef: { label: 'Chef service available', key: 'requireChef' },
  aprilSwim: { label: 'Warm enough to swim (April)', key: 'requireAprilSwim' },
};

export function overallVerdict(checks, criteria) {
  let anyFail = false;
  let anyUnknown = false;
  for (const [id, def] of Object.entries(CRITERIA_LABELS)) {
    if (!criteria[def.key]) continue; // criterion disabled
    const c = checks[id];
    if (!c) continue;
    if (c.status === 'no') anyFail = true;
    else if (c.status === 'unknown') anyUnknown = true;
  }
  if (anyFail) return 'FAIL';
  if (anyUnknown) return 'NEEDS REVIEW';
  return 'PASS';
}
