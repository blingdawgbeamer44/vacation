// Local tests for the analyzer against realistic property-page text.
import { analyzeText, overallVerdict, htmlToText } from '../netlify/functions/lib/analyzer.mjs';

const DEFAULT_CRITERIA = {
  maxFlightHours: 4,
  requireFlights: true,
  requireOceanfront: true,
  requirePrivatePool: true,
  requireHotTub: true,
  minBedrooms: 2,
  requireBedrooms: true,
  requireStandalone: true,
  maxWeeklyBudget: 12000,
  requireBudget: true,
  requireAdultsOnly: true,
  requireChef: true,
  requireAprilSwim: true,
};

let failures = 0;
function expect(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got "${actual}" expected "${expected}"`);
}

// --- Fixture 1: ideal villa (like a Lazy Bay villa page) ---
const villa = `Lazy Bay Villas, Staniel Cay, Exuma, Bahamas. Welcome to Cabernet Villa,
a private villa with 2 bedrooms and 2 bathrooms, beachfront on a turquoise lagoon.
Each villa features its own private plunge pool and hot tub on the terrace.
Private chef available on request. Fully staffed. Rates from $9,500 per week. Adults only retreat.`;
{
  const { checks } = analyzeText(villa, DEFAULT_CRITERIA, { title: 'Lazy Bay Villas Staniel Cay' });
  expect('villa oceanfront', checks.oceanfront.status, 'yes');
  expect('villa privatePool', checks.privatePool.status, 'yes');
  expect('villa hotTub', checks.hotTub.status, 'yes');
  expect('villa bedrooms', checks.bedrooms.status, 'yes');
  expect('villa standalone', checks.standalone.status, 'yes');
  expect('villa adultsOnly', checks.adultsOnly.status, 'yes');
  expect('villa chef', checks.chef.status, 'yes');
  expect('villa budget', checks.budget.status, 'yes');
  expect('villa flights', checks.flights.status, 'yes');
  expect('villa aprilSwim', checks.aprilSwim.status, 'yes');
  expect('villa verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'PASS');
}

// --- Fixture 2: family condo resort (should FAIL several) ---
const condo = `Beachside Condo at Grand Family Resort, Myrtle Beach SC. This 1 bedroom condo
in a high-rise tower offers access to the community pool and lazy river. Kids welcome!
Family-friendly water park on site. $1,200 per week.`;
{
  const { checks } = analyzeText(condo, DEFAULT_CRITERIA, {});
  expect('condo standalone', checks.standalone.status, 'no');
  expect('condo privatePool', checks.privatePool.status, 'no');
  expect('condo adultsOnly', checks.adultsOnly.status, 'no');
  expect('condo bedrooms', checks.bedrooms.status, 'no');
  expect('condo aprilSwim', checks.aprilSwim.status, 'no'); // Myrtle Beach in April
  expect('condo verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'FAIL');
}

// --- Fixture 3: vague page (should be NEEDS REVIEW, not guessed) ---
const vague = `Welcome to our beautiful vacation home. Book now for the trip of a lifetime.
Contact us for rates and availability.`;
{
  const { checks } = analyzeText(vague, DEFAULT_CRITERIA, {});
  expect('vague oceanfront', checks.oceanfront.status, 'unknown');
  expect('vague hotTub', checks.hotTub.status, 'unknown');
  expect('vague budget', checks.budget.status, 'unknown');
  expect('vague flights', checks.flights.status, 'unknown');
  expect('vague verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'NEEDS REVIEW');
}

// --- Fixture 4: over budget nightly price ---
const pricey = `Oceanfront estate in Grace Bay, Providenciales, Turks and Caicos. 5 bedrooms,
private infinity pool, hot tub, private chef included, standalone private home. $3,000 per night. Adults only.`;
{
  const { checks } = analyzeText(pricey, DEFAULT_CRITERIA, {});
  expect('pricey budget', checks.budget.status, 'no'); // 21k/week
  expect('pricey flights', checks.flights.status, 'yes'); // PLS 3.1h <= 4
  expect('pricey verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'FAIL');
}

// --- Fixture 5: no-nonstop destination ---
const zih = `Villa Milagro in Troncones, Mexico, near Zihuatanejo. Beachfront, private pool,
hot tub, 4 bedrooms, private chef, standalone villa, adults only, $8,000 per week.`;
{
  const { checks } = analyzeText(zih, DEFAULT_CRITERIA, {});
  expect('zih flights', checks.flights.status, 'no');
  expect('zih verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'FAIL');
}

// --- Fixture 6: criteria modified for family trip (adults-only off, chef off, oceanfront off) ---
const familyCriteria = { ...DEFAULT_CRITERIA, requireAdultsOnly: false, requireChef: false, requireOceanfront: false, requireAprilSwim: false };
const familyHome = `Private single-family home in Destin Florida with private heated pool and hot tub.
4 bedrooms. Kids welcome, family-friendly neighborhood. $4,900 per week.`;
{
  const { checks } = analyzeText(familyHome, familyCriteria, {});
  expect('family adultsOnly ignored', overallVerdict(checks, familyCriteria), 'PASS');
}

// --- Fixture 7: HTML stripping ---
{
  const html = `<html><head><title>Test</title><script>var x="no pool";</script>
  <style>.pool{color:red}</style></head>
  <body><h1>Oceanfront Villa</h1><p>Private&nbsp;pool &amp; hot tub. 3 bedrooms. Private home. Adults only. Private chef. In Cancun. $5,000/week</p></body></html>`;
  const text = htmlToText(html);
  if (text.includes('no pool')) { failures++; console.log('FAIL  html strip: script content leaked'); }
  else console.log('PASS  html strip: script/style removed');
  const { checks } = analyzeText(text, DEFAULT_CRITERIA, {});
  expect('html privatePool', checks.privatePool.status, 'yes');
  expect('html verdict', overallVerdict(checks, DEFAULT_CRITERIA), 'PASS');
}

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
