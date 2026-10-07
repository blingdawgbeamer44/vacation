// Client-side API + storage helpers.
// Primary storage: server (Netlify Blobs) so data survives year to year and
// across devices. localStorage is a local cache/fallback so the app still
// works if the server call hiccups.

export const DEFAULT_CRITERIA = {
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

export const CRITERIA_DISPLAY = [
  { id: 'flights', key: 'requireFlights', label: 'Nonstop flight within limit (ATL/CLT)' },
  { id: 'oceanfront', key: 'requireOceanfront', label: 'Oceanfront / beachfront' },
  { id: 'privatePool', key: 'requirePrivatePool', label: 'Private pool' },
  { id: 'hotTub', key: 'requireHotTub', label: 'Hot tub' },
  { id: 'bedrooms', key: 'requireBedrooms', label: 'Enough bedrooms' },
  { id: 'standalone', key: 'requireStandalone', label: 'Standalone residence' },
  { id: 'budget', key: 'requireBudget', label: 'Within budget' },
  { id: 'adultsOnly', key: 'requireAdultsOnly', label: 'Adults-only' },
  { id: 'chef', key: 'requireChef', label: 'Chef service available' },
  { id: 'aprilSwim', key: 'requireAprilSwim', label: 'Warm enough to swim (April)' },
];

export const REJECTION_REASONS = [
  'No nonstop flights from ATL/CLT',
  'Flights over 4 hours',
  'Not oceanfront/beachfront',
  'No private pool',
  'No hot tub',
  'Not a standalone residence',
  'Over budget',
  'Not adults-only',
  'No chef service available',
  'Mixed property types',
  'Poor reviews or outdated info',
  'Platform requires manual searching',
];

const LS = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('vpv_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('vpv_' + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

export const localCache = LS;

export async function apiStatus() {
  const r = await fetch('/api/data?action=status');
  return r.json();
}

export async function apiSetPin(pin) {
  const r = await fetch('/api/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'setpin', pin }),
  });
  return r.json();
}

export async function apiGetAll(pin) {
  const r = await fetch('/api/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'get', pin }),
  });
  return r.json();
}

export async function apiSave(pin, partial) {
  const r = await fetch('/api/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'save', pin, ...partial }),
  });
  return r.json();
}

export async function apiAnalyze(url, criteria) {
  const r = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, criteria }),
  });
  return r.json();
}

export function domainOf(url) {
  try {
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}
