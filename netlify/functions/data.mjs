// Persistent storage for criteria, blocklist, and evaluation history,
// backed by Netlify Blobs (durable, survives year to year, shared across
// Mike's devices). PIN-protected.
import { getStore } from '@netlify/blobs';

const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' };

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers });
}

export default async function handler(req) {
  try {
    const store = getStore('validator-data');

    // Accept params from POST body or GET query (GET support makes the API testable end-to-end)
    let p = {};
    if (req.method === 'POST') {
      p = await req.json();
    } else {
      const u = new URL(req.url);
      for (const [k, v] of u.searchParams.entries()) p[k] = v;
      if (typeof p.payload === 'string') {
        try { Object.assign(p, JSON.parse(p.payload)); } catch { /* ignore */ }
      }
    }

    const action = p.action || 'get';
    const settingsRaw = await store.get('settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : null;
    const pinSet = !!(settings && settings.pinHash);

    if (action === 'status') {
      return json({ ok: true, pinSet });
    }

    if (action === 'setpin') {
      if (pinSet) return json({ error: 'A PIN is already set.' }, 403);
      if (!p.pin || String(p.pin).length < 4) return json({ error: 'PIN must be at least 4 digits.' }, 400);
      const pinHash = await sha256(String(p.pin));
      await store.set('settings', JSON.stringify({ ...(settings || {}), pinHash }));
      return json({ ok: true, pinSet: true });
    }

    // Everything below requires the correct PIN
    if (!pinSet) return json({ error: 'No PIN set yet.', pinSet: false }, 403);
    const givenHash = await sha256(String(p.pin || ''));
    if (givenHash !== settings.pinHash) return json({ error: 'Wrong PIN.' }, 403);

    if (action === 'get') {
      const [criteriaRaw, blocklistRaw, historyRaw] = await Promise.all([
        store.get('criteria'), store.get('blocklist'), store.get('history'),
      ]);
      return json({
        ok: true,
        pinSet: true,
        criteria: criteriaRaw ? JSON.parse(criteriaRaw) : null,
        blocklist: blocklistRaw ? JSON.parse(blocklistRaw) : [],
        history: historyRaw ? JSON.parse(historyRaw) : [],
      });
    }

    if (action === 'save') {
      const saved = [];
      if (p.criteria !== undefined) {
        const c = typeof p.criteria === 'string' ? JSON.parse(p.criteria) : p.criteria;
        await store.set('criteria', JSON.stringify(c)); saved.push('criteria');
      }
      if (p.blocklist !== undefined) {
        const b = typeof p.blocklist === 'string' ? JSON.parse(p.blocklist) : p.blocklist;
        await store.set('blocklist', JSON.stringify(b)); saved.push('blocklist');
      }
      if (p.history !== undefined) {
        const h = typeof p.history === 'string' ? JSON.parse(p.history) : p.history;
        await store.set('history', JSON.stringify(h.slice(0, 200))); saved.push('history');
      }
      return json({ ok: true, saved });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Storage error: ' + e.message }), { status: 500, headers });
  }
}
