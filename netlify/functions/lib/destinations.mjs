// Destination knowledge table: approximate nonstop flight times from ATL (Atlanta)
// and CLT (Charlotte), whether nonstops exist, and whether the water is warm
// enough to swim in April. Times are approximate gate-to-gate hours and should
// be verified before booking.
// aprilSwim: 'yes' | 'borderline' | 'no'

export const DESTINATIONS = [
  // --- Florida ---
  { names: ['30a', 'santa rosa beach', 'rosemary beach', 'watercolor', 'watersound', 'seacrest', 'inlet beach', 'grayton beach', 'alys beach', 'seaside, fl', 'panama city'], label: '30A / Panama City Beach, FL (ECP)', atl: 1.2, clt: 1.7, nonstop: true, aprilSwim: 'borderline', note: 'Gulf water ~70°F in April — swimmable for some, chilly for others. Heated pool recommended.' },
  { names: ['destin', 'miramar beach', 'fort walton', 'okaloosa'], label: 'Destin / Fort Walton, FL (VPS)', atl: 1.2, clt: 1.7, nonstop: true, aprilSwim: 'borderline', note: 'Gulf water ~70°F in April. Heated pool recommended.' },
  { names: ['fort lauderdale', 'ft lauderdale', 'ft. lauderdale', 'pompano', 'hollywood, fl', 'deerfield beach'], label: 'Fort Lauderdale, FL (FLL)', atl: 2.0, clt: 2.0, nonstop: true, aprilSwim: 'yes' },
  { names: ['miami', 'miami beach', 'key biscayne', 'aventura', 'sunny isles'], label: 'Miami, FL (MIA)', atl: 2.0, clt: 2.1, nonstop: true, aprilSwim: 'yes' },
  { names: ['key west'], label: 'Key West, FL (EYW)', atl: 2.1, clt: 2.5, nonstop: true, aprilSwim: 'yes', note: 'Nonstop service is seasonal on some airlines — verify for your dates.' },
  { names: ['florida keys', 'islamorada', 'marathon, fl', 'key largo'], label: 'Florida Keys (MTH/EYW or drive from MIA)', atl: 2.1, clt: 2.5, nonstop: false, aprilSwim: 'yes', note: 'Middle Keys usually require a connection or a drive from Miami.' },
  { names: ['naples, fl', 'marco island', 'fort myers', 'ft myers', 'sanibel', 'captiva', 'bonita springs', 'estero'], label: 'Naples / Fort Myers, FL (RSW)', atl: 1.7, clt: 2.0, nonstop: true, aprilSwim: 'yes' },
  { names: ['sarasota', 'siesta key', 'longboat key', 'anna maria', 'bradenton'], label: 'Sarasota / Bradenton, FL (SRQ)', atl: 1.5, clt: 1.9, nonstop: true, aprilSwim: 'borderline', note: 'Gulf ~72-75°F in April — usually fine.' },
  { names: ['tampa', 'clearwater', 'st pete', 'st. pete', 'treasure island, fl', 'indian rocks'], label: 'Tampa / Clearwater, FL (TPA)', atl: 1.5, clt: 1.8, nonstop: true, aprilSwim: 'borderline' },
  { names: ['orlando', 'kissimmee', 'davenport, fl'], label: 'Orlando, FL (MCO) — NOT beachfront', atl: 1.5, clt: 1.6, nonstop: true, aprilSwim: 'borderline', note: 'Orlando is inland — no oceanfront properties.' },
  { names: ['vero beach', 'melbourne, fl', 'cocoa beach', 'daytona'], label: 'Florida Space/Treasure Coast (MLB/DAB)', atl: 1.4, clt: 1.7, nonstop: true, aprilSwim: 'borderline' },
  { names: ['palm beach', 'west palm', 'jupiter, fl', 'boca raton', 'delray'], label: 'West Palm Beach, FL (PBI)', atl: 1.9, clt: 2.0, nonstop: true, aprilSwim: 'yes' },

  // --- Southeast US coast ---
  { names: ['hilton head', 'bluffton'], label: 'Hilton Head, SC (HHH/SAV)', atl: 1.0, clt: 1.2, nonstop: true, aprilSwim: 'no', note: 'Atlantic ~65°F in April — too cold for most swimmers.' },
  { names: ['charleston', 'isle of palms', 'kiawah', 'folly beach', 'sullivan'], label: 'Charleston, SC (CHS)', atl: 1.1, clt: 1.0, nonstop: true, aprilSwim: 'no', note: 'Ocean too cold to swim in April.' },
  { names: ['myrtle beach', 'garden city beach', 'pawleys'], label: 'Myrtle Beach, SC (MYR)', atl: 1.2, clt: 1.0, nonstop: true, aprilSwim: 'no' },
  { names: ['outer banks', 'corolla', 'duck, nc', 'nags head', 'kitty hawk', 'hatteras', 'kill devil'], label: 'Outer Banks, NC (ORF/drive)', atl: 999, clt: 999, nonstop: false, aprilSwim: 'no', note: 'No practical nonstop air service — typically a long drive.' },
  { names: ['topsail', 'wilmington, nc', 'wrightsville', 'holden beach', 'oak island', 'carolina beach'], label: 'Wilmington, NC (ILM)', atl: 1.3, clt: 1.0, nonstop: true, aprilSwim: 'no' },
  { names: ['virginia beach', 'sandbridge'], label: 'Virginia Beach, VA (ORF)', atl: 1.6, clt: 1.3, nonstop: true, aprilSwim: 'no' },
  { names: ['gulf shores', 'orange beach', 'fort morgan'], label: 'Gulf Shores / Orange Beach, AL (PNS)', atl: 1.3, clt: 1.8, nonstop: true, aprilSwim: 'borderline' },

  // --- Mexico ---
  { names: ['cancun', 'playa del carmen', 'riviera maya', 'tulum', 'puerto morelos', 'akumal', 'playa mujeres'], label: 'Cancun / Riviera Maya, Mexico (CUN)', atl: 2.7, clt: 3.0, nonstop: true, aprilSwim: 'yes' },
  { names: ['los cabos', 'cabo san lucas', 'san jose del cabo', 'cabo'], label: 'Los Cabos, Mexico (SJD)', atl: 4.0, clt: 4.5, nonstop: true, aprilSwim: 'yes', note: 'ATL-SJD nonstop ~4h — right at your limit. CLT may require a connection; verify for your dates.' },
  { names: ['puerto vallarta', 'punta mita', 'nuevo vallarta', 'nuevo nayarit', 'sayulita', 'flamingos'], label: 'Puerto Vallarta, Mexico (PVR)', atl: 3.5, clt: 3.8, nonstop: true, aprilSwim: 'yes', note: 'Verify nonstop service for your dates — some routes are seasonal.' },
  { names: ['troncones', 'zihuatanejo', 'ixtapa'], label: 'Zihuatanejo, Mexico (ZIH)', atl: 999, clt: 999, nonstop: false, aprilSwim: 'yes', note: 'No nonstops from ATL/CLT — 6+ hours with connections.' },

  // --- Caribbean ---
  { names: ['nassau', 'paradise island', 'bahamar', 'baha mar'], label: 'Nassau, Bahamas (NAS)', atl: 2.1, clt: 2.2, nonstop: true, aprilSwim: 'yes' },
  { names: ['exuma', 'staniel cay', 'great exuma', 'george town, bahamas'], label: 'Exuma, Bahamas (GGT)', atl: 2.4, clt: 2.6, nonstop: true, aprilSwim: 'yes', note: 'ATL-GGT nonstop is seasonal (Delta, usually Saturdays). Staniel Cay itself needs a short hop or boat from GGT/Nassau — verify the last leg.' },
  { names: ['eleuthera', 'harbour island'], label: 'Eleuthera, Bahamas (ELH)', atl: 2.3, clt: 2.5, nonstop: true, aprilSwim: 'yes', note: 'ATL-ELH nonstop is seasonal/limited — verify for your dates.' },
  { names: ['abaco', 'marsh harbour'], label: 'Abaco, Bahamas (MHH)', atl: 2.2, clt: 2.4, nonstop: false, aprilSwim: 'yes', note: 'Usually requires a connection from ATL/CLT.' },
  { names: ['grand cayman', 'cayman islands', 'seven mile beach'], label: 'Grand Cayman (GCM)', atl: 3.0, clt: 3.2, nonstop: true, aprilSwim: 'yes', note: 'CLT nonstop may be seasonal — verify.' },
  { names: ['montego bay', 'negril', 'ocho rios', 'jamaica'], label: 'Jamaica (MBJ)', atl: 2.9, clt: 3.1, nonstop: true, aprilSwim: 'yes' },
  { names: ['turks and caicos', 'turks & caicos', 'providenciales', 'grace bay'], label: 'Turks & Caicos (PLS)', atl: 3.1, clt: 3.3, nonstop: true, aprilSwim: 'yes' },
  { names: ['punta cana', 'cap cana', 'bavaro'], label: 'Punta Cana, DR (PUJ)', atl: 3.7, clt: 3.8, nonstop: true, aprilSwim: 'yes' },
  { names: ['la romana', 'casa de campo', 'bayahibe'], label: 'La Romana, DR (LRM)', atl: 999, clt: 999, nonstop: false, aprilSwim: 'yes', note: 'No nonstops from ATL/CLT.' },
  { names: ['aruba', 'palm beach, aruba', 'eagle beach'], label: 'Aruba (AUA)', atl: 4.2, clt: 4.3, nonstop: true, aprilSwim: 'yes', note: 'Slightly over 4 hours nonstop.' },
  { names: ['st thomas', 'st. thomas', 'st john', 'st. john', 'virgin islands'], label: 'US Virgin Islands (STT)', atl: 3.6, clt: 3.7, nonstop: true, aprilSwim: 'yes' },
  { names: ['puerto rico', 'san juan', 'dorado', 'rincon', 'vieques'], label: 'Puerto Rico (SJU)', atl: 3.5, clt: 3.6, nonstop: true, aprilSwim: 'yes' },
  { names: ['st maarten', 'st. maarten', 'sint maarten', 'st martin'], label: 'St. Maarten (SXM)', atl: 3.9, clt: 4.0, nonstop: true, aprilSwim: 'yes', note: 'Nonstop service may be seasonal — verify.' },
  { names: ['antigua'], label: 'Antigua (ANU)', atl: 4.1, clt: 4.2, nonstop: true, aprilSwim: 'yes', note: 'Right around your 4-hour limit; some service is seasonal.' },
  { names: ['st lucia', 'st. lucia', 'saint lucia'], label: 'St. Lucia (UVF)', atl: 4.4, clt: 4.5, nonstop: true, aprilSwim: 'yes', note: 'Over 4 hours nonstop.' },
  { names: ['barbados'], label: 'Barbados (BGI)', atl: 4.6, clt: 4.7, nonstop: true, aprilSwim: 'yes', note: 'Over 4 hours nonstop.' },
  { names: ['st eustatius', 'statia'], label: 'St. Eustatius', atl: 999, clt: 999, nonstop: false, aprilSwim: 'yes', note: 'Requires connections — 4+ hours total.' },

  // --- Central America / other ---
  { names: ['costa rica', 'manuel antonio', 'guanacaste', 'tamarindo', 'papagayo', 'nosara'], label: 'Costa Rica (SJO/LIR)', atl: 4.2, clt: 4.5, nonstop: true, aprilSwim: 'yes', note: 'Nonstops run ~4-4.5h — at or over your limit.' },
  { names: ['belize', 'ambergris', 'san pedro, belize', 'placencia'], label: 'Belize (BZE)', atl: 3.0, clt: 3.3, nonstop: true, aprilSwim: 'yes', note: 'Island transfers add a puddle-jumper or boat.' },
  { names: ['bermuda'], label: 'Bermuda (BDA)', atl: 2.5, clt: 2.3, nonstop: true, aprilSwim: 'no', note: 'Water ~66°F in April — too cold for most. August is great.' },
  { names: ['hawaii', 'maui', 'kailua kona', 'kona', 'oahu', 'kauai', 'honolulu'], label: 'Hawaii', atl: 999, clt: 999, nonstop: false, aprilSwim: 'yes', note: 'ATL-HNL nonstop exists but is ~9.5 hours — far beyond your limit.' },
  { names: ['las vegas'], label: 'Las Vegas, NV — landlocked', atl: 4.3, clt: 4.6, nonstop: true, aprilSwim: 'no', note: 'No ocean.' },
];

export function detectDestination(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestPos = Infinity;
  for (const dest of DESTINATIONS) {
    for (const name of dest.names) {
      const pos = lower.indexOf(name);
      if (pos !== -1 && pos < bestPos) {
        best = dest;
        bestPos = pos;
      }
    }
  }
  return best;
}

// ---- Regions ----
export const REGION_LABELS = {
  florida: 'Florida',
  southeast: 'Southeast US coast (SC / NC / VA / AL)',
  mexico: 'Mexico',
  bahamas: 'Bahamas',
  caribbean: 'Caribbean islands',
  centralamerica: 'Central America (Costa Rica / Belize)',
  hawaii: 'Hawaii',
  otherus: 'Other US (inland)',
};

function labelToRegion(l) {
  if (/, FL\b| FL \(|Florida/.test(l)) return 'florida';
  if (/, SC\b|, NC\b|, VA\b|, AL\b/.test(l)) return 'southeast';
  if (/Mexico/.test(l)) return 'mexico';
  if (/Bahamas/.test(l)) return 'bahamas';
  if (/Costa Rica|Belize/.test(l)) return 'centralamerica';
  if (/Hawaii/.test(l)) return 'hawaii';
  if (/Las Vegas/.test(l)) return 'otherus';
  return 'caribbean';
}
for (const d of DESTINATIONS) d.region = labelToRegion(d.label);

// Count DISTINCT destinations mentioned — a storefront/marketplace homepage
// mentions many different places; a single property's page mentions one or two.
export function countDistinctDestinations(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const dest of DESTINATIONS) {
    if (dest.names.some(n => lower.includes(n))) count++;
  }
  return count;
}
