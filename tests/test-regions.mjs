import { analyzeText, overallVerdict } from '../netlify/functions/lib/analyzer.mjs';

const BASE = {
  maxFlightHours: 4, requireFlights: true, requireOceanfront: true, requirePrivatePool: true,
  requireHotTub: true, minBedrooms: 2, requireBedrooms: true, requireStandalone: true,
  maxWeeklyBudget: 12000, requireBudget: true, requireAdultsOnly: true, requireChef: true,
  requireAprilSwim: true, allowedRegions: [],
};

let failures = 0;
function expect(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got "${actual}" expected "${expected}"`);
}

const villa = `Private villa in Cancun, Mexico. Beachfront, 3 bedrooms, private pool, hot tub,
private chef, adults only, standalone home, $7,000 per week.`;

// Region filter OFF: no region check at all
{
  const { checks } = analyzeText(villa, BASE, {});
  expect('no-filter: region check absent', checks.region === undefined, true);
}

// Region filter ON, matching region
{
  const criteria = { ...BASE, allowedRegions: ['mexico', 'bahamas'], requireRegion: true };
  const { checks } = analyzeText(villa, criteria, {});
  expect('mexico allowed: region yes', checks.region.status, 'yes');
  expect('mexico allowed: verdict', overallVerdict(checks, criteria), 'PASS');
}

// Region filter ON, non-matching region
{
  const criteria = { ...BASE, allowedRegions: ['florida'], requireRegion: true };
  const { checks } = analyzeText(villa, criteria, {});
  expect('florida only: region no', checks.region.status, 'no');
  expect('florida only: verdict', overallVerdict(checks, criteria), 'FAIL');
}

// Region filter ON, unknown destination
{
  const criteria = { ...BASE, allowedRegions: ['florida'], requireRegion: true };
  const { checks } = analyzeText('A lovely home somewhere nice. 3 bedrooms.', criteria, {});
  expect('unknown dest: region unknown', checks.region.status, 'unknown');
}

// Marketplace detection: many destinations on one page
{
  const storefront = `Featured stays: House in Kailua Kona Hawaii. Condo in Isle of Palms near Charleston.
  Cabin in Las Vegas. Apartment in Puerto Vallarta. Beach home in Destin Florida. Villa in Cancun. $200 night`;
  const { marketplace } = analyzeText(storefront, BASE, {});
  expect('storefront: marketplace flag', marketplace, true);
}
{
  const { marketplace } = analyzeText(villa, BASE, {});
  expect('single property: not marketplace', marketplace, false);
}

console.log(failures === 0 ? '\nALL REGION TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
