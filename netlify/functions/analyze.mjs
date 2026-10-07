// Fetches a property page server-side (no CORS limits) and analyzes it.
// Accepts GET ?url=... or POST {url, criteria}.
import { analyzeText, htmlToText, overallVerdict } from './lib/analyzer.mjs';

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
  allowedRegions: [],
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export default async function handler(req) {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' };
  try {
    let url = null;
    let criteria = DEFAULT_CRITERIA;
    if (req.method === 'POST') {
      const body = await req.json();
      url = body.url;
      if (body.criteria && typeof body.criteria === 'object') {
        criteria = { ...DEFAULT_CRITERIA, ...body.criteria };
      }
    } else {
      const u = new URL(req.url);
      url = u.searchParams.get('url');
    }
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers });
    }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'That doesn\'t look like a valid link.' }), { status: 400, headers });
    }

    // Fetch the page with a timeout
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let html = '';
    let fetched = false;
    let fetchError = null;
    let finalUrl = url;
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: {
          'user-agent': UA,
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
      finalUrl = res.url || url;
      if (res.ok) {
        html = await res.text();
        fetched = true;
      } else {
        fetchError = `The site responded with status ${res.status}. It may be blocking automated reading.`;
      }
    } catch (e) {
      fetchError = e.name === 'AbortError'
        ? 'The site took too long to respond (20s timeout).'
        : `Couldn't reach the site (${e.message}).`;
    } finally {
      clearTimeout(timer);
    }

    if (!fetched) {
      return new Response(JSON.stringify({
        fetched: false,
        url: finalUrl,
        domain: parsed.hostname.replace(/^www\./, ''),
        error: fetchError,
        advice: 'This site couldn\'t be read automatically. You can still evaluate it yourself against your criteria, or add the site to your Do-Not-Search list.',
      }), { status: 200, headers });
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? htmlToText(titleMatch[1]) : '';
    const text = htmlToText(html);
    const thin = text.length < 400;

    criteria.requireRegion = Array.isArray(criteria.allowedRegions) && criteria.allowedRegions.length > 0;
    const { checks, destination, marketplace } = analyzeText(text, criteria, { title, url: finalUrl });
    const verdict = overallVerdict(checks, criteria);

    return new Response(JSON.stringify({
      fetched: true,
      url: finalUrl,
      domain: parsed.hostname.replace(/^www\./, ''),
      title,
      destination,
      checks,
      verdict,
      marketplace: !!marketplace,
      textLength: text.length,
      thin,
      thinWarning: thin ? 'This page loaded almost no readable text — it probably builds its content with JavaScript (common on big platforms like Airbnb/VRBO). Results below are unreliable; treat everything as unverified.' : null,
    }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Analyzer error: ' + e.message }), { status: 500, headers });
  }
}
