import React, { useEffect, useState } from 'react';
import {
  DEFAULT_CRITERIA, CRITERIA_DISPLAY, REJECTION_REASONS,
  apiStatus, apiSetPin, apiGetAll, apiSave, apiAnalyze, domainOf, localCache,
} from './api.js';

const MARKS = { yes: { cls: 'yes', text: '✅ YES' }, no: { cls: 'no', text: '❌ NO' }, unknown: { cls: 'unknown', text: '❓ CHECK' } };

export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | setpin | enterpin | ready
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinInput2, setPinInput2] = useState('');
  const [pinError, setPinError] = useState('');
  const [serverOk, setServerOk] = useState(true);

  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [blocklist, setBlocklist] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('check');

  // ---------- boot ----------
  useEffect(() => {
    (async () => {
      try {
        const st = await apiStatus();
        if (!st.pinSet) { setPhase('setpin'); return; }
        const savedPin = localCache.get('pin', null);
        if (savedPin) {
          const ok = await loadAll(savedPin);
          if (ok) return;
        }
        setPhase('enterpin');
      } catch {
        // Server unreachable — fall back to local cache so the app still works
        setServerOk(false);
        setCriteria(localCache.get('criteria', DEFAULT_CRITERIA));
        setBlocklist(localCache.get('blocklist', []));
        setHistory(localCache.get('history', []));
        setPhase('ready');
      }
    })();
  }, []);

  async function loadAll(usePin) {
    try {
      const data = await apiGetAll(usePin);
      if (data.ok) {
        setPin(usePin);
        localCache.set('pin', usePin);
        setCriteria(data.criteria || localCache.get('criteria', DEFAULT_CRITERIA));
        setBlocklist(data.blocklist || []);
        setHistory(data.history || []);
        setPhase('ready');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function persist(partial) {
    // Always mirror locally first so nothing is lost
    if (partial.criteria) localCache.set('criteria', partial.criteria);
    if (partial.blocklist) localCache.set('blocklist', partial.blocklist);
    if (partial.history) localCache.set('history', partial.history);
    try {
      const r = await apiSave(pin, partial);
      setServerOk(!!r.ok);
    } catch {
      setServerOk(false);
    }
  }

  // ---------- PIN screens ----------
  if (phase === 'loading') {
    return <Shell><div className="card"><p><span className="spin">⏳</span> Loading…</p></div></Shell>;
  }

  if (phase === 'setpin') {
    return (
      <Shell>
        <div className="card pin-screen">
          <h2>Create your PIN</h2>
          <p className="muted">First-time setup. Pick a PIN (4+ digits). You'll use it to open the app; this device will remember it.</p>
          <label className="field">PIN
            <input type="password" inputMode="numeric" value={pinInput} onChange={e => setPinInput(e.target.value)} />
          </label>
          <label className="field">Type it again
            <input type="password" inputMode="numeric" value={pinInput2} onChange={e => setPinInput2(e.target.value)} />
          </label>
          {pinError && <div className="alert error">{pinError}</div>}
          <button className="primary" onClick={async () => {
            setPinError('');
            if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits.'); return; }
            if (pinInput !== pinInput2) { setPinError('The two PINs don\'t match.'); return; }
            const r = await apiSetPin(pinInput);
            if (r.ok) {
              // save default criteria on first setup
              setPin(pinInput);
              localCache.set('pin', pinInput);
              try { await apiSave(pinInput, { criteria: DEFAULT_CRITERIA, blocklist: [], history: [] }); } catch { /* ignore */ }
              setCriteria(DEFAULT_CRITERIA);
              setPhase('ready');
            } else {
              setPinError(r.error || 'Something went wrong — try again.');
            }
          }}>Save PIN &amp; start</button>
        </div>
      </Shell>
    );
  }

  if (phase === 'enterpin') {
    return (
      <Shell>
        <div className="card pin-screen">
          <h2>Enter your PIN</h2>
          <label className="field">PIN
            <input type="password" inputMode="numeric" value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={async e => { if (e.key === 'Enter') { const ok = await loadAll(pinInput); if (!ok) setPinError('Wrong PIN — try again.'); } }} />
          </label>
          {pinError && <div className="alert error">{pinError}</div>}
          <button className="primary" onClick={async () => {
            setPinError('');
            const ok = await loadAll(pinInput);
            if (!ok) setPinError('Wrong PIN — try again.');
          }}>Open</button>
        </div>
      </Shell>
    );
  }

  // ---------- main app ----------
  return (
    <Shell>
      {!serverOk && (
        <div className="alert warn">
          ⚠️ Couldn't reach cloud storage just now — your changes are saved on this device and will sync when the connection returns.
        </div>
      )}
      <nav className="tabs">
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>🔍 Check a Property</button>
        <button className={tab === 'criteria' ? 'active' : ''} onClick={() => setTab('criteria')}>⚙️ Modify Criteria</button>
        <button className={tab === 'blocklist' ? 'active' : ''} onClick={() => setTab('blocklist')}>🚫 Do-Not-Search List ({blocklist.length})</button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>📋 History ({history.length})</button>
      </nav>

      {tab === 'check' && (
        <CheckTab criteria={criteria} blocklist={blocklist}
          onBlock={entry => { const next = [entry, ...blocklist.filter(b => b.domain !== entry.domain)]; setBlocklist(next); persist({ blocklist: next }); }}
          onHistory={h => { const next = [h, ...history].slice(0, 200); setHistory(next); persist({ history: next }); }} />
      )}
      {tab === 'criteria' && (
        <CriteriaTab criteria={criteria} onSave={c => { setCriteria(c); persist({ criteria: c }); }} />
      )}
      {tab === 'blocklist' && (
        <BlocklistTab blocklist={blocklist}
          onRemove={dom => { const next = blocklist.filter(b => b.domain !== dom); setBlocklist(next); persist({ blocklist: next }); }}
          onClear={() => { setBlocklist([]); persist({ blocklist: [] }); }} />
      )}
      {tab === 'history' && (
        <HistoryTab history={history}
          onRemove={i => { const next = history.filter((_, idx) => idx !== i); setHistory(next); persist({ history: next }); }} />
      )}
      <div className="footer-note">
        Flight times and April water temperatures are approximations built into the app — always verify flights for your exact dates before booking.
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <>
      <header className="app-header">
        <h1>🏝️ Vacation Property Validator</h1>
        <p>Paste a rental link — get an honest check against your criteria.</p>
      </header>
      <div className="container">{children}</div>
    </>
  );
}

// ================= Check tab =================
function CheckTab({ criteria, blocklist, onBlock, onHistory }) {
  const [url, setUrl] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [blockedHit, setBlockedHit] = useState(null); // blocklist entry matching pasted url
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showReject, setShowReject] = useState(false);

  function startCheck(force = false) {
    setError('');
    setResult(null);
    setShowReject(false);
    const dom = domainOf(url);
    if (!dom) { setError('That doesn\'t look like a valid link. Paste the full address, like https://www.example.com/villa'); return; }
    if (!force) {
      const hit = blocklist.find(b => dom === b.domain || dom.endsWith('.' + b.domain));
      if (hit) { setBlockedHit(hit); return; }
    }
    setBlockedHit(null);
    runAnalysis(dom);
  }

  async function runAnalysis(dom) {
    setAnalyzing(true);
    try {
      const r = await apiAnalyze(url, criteria);
      setResult(r);
      if (r && !r.error) {
        onHistory({
          url, domain: r.domain || dom, title: r.title || '', destination: r.destination || null,
          verdict: r.fetched ? r.verdict : 'UNREADABLE',
          date: new Date().toISOString().slice(0, 10),
          checkin, checkout,
        });
      }
    } catch (e) {
      setError('The check failed: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Check a property</h2>
        <label className="field">Property link
          <span className="hint">Paste the link from Facebook, Google, or anywhere else.</span>
          <input type="url" placeholder="https://..." value={url} onChange={e => { setUrl(e.target.value); setBlockedHit(null); setResult(null); }} />
        </label>
        <div className="row">
          <label className="field">Check-in (optional)
            <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} />
          </label>
          <label className="field">Check-out (optional)
            <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} />
          </label>
        </div>
        <button className="primary" disabled={analyzing || !url.trim()} onClick={() => startCheck(false)}>
          {analyzing ? <><span className="spin">⏳</span> Reading the page…</> : 'Check this property'}
        </button>
        {error && <div className="alert error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {blockedHit && (
        <div className="alert warn">
          <h3>🚫 You've blocked this site before</h3>
          <p>You marked <strong>{blockedHit.domain}</strong> as not worth searching on <strong>{blockedHit.date}</strong>.</p>
          <p><strong>Your reason(s):</strong> {blockedHit.reasons.join('; ')}{blockedHit.note ? ` — "${blockedHit.note}"` : ''}</p>
          <div className="actions">
            <button className="secondary" onClick={() => { setUrl(''); setBlockedHit(null); }}>Skip this one</button>
            <button className="danger" onClick={() => { setBlockedHit(null); runAnalysis(domainOf(url)); }}>Evaluate anyway</button>
          </div>
        </div>
      )}

      {result && result.fetched === false && (
        <UnreadableResult result={result} onReject={() => setShowReject(true)} />
      )}
      {result && result.fetched === undefined && result.error && (
        <div className="alert error"><h3>Couldn't check this one</h3><p>{result.error}</p></div>
      )}

      {result && result.fetched && (
        <ResultPanel result={result} criteria={criteria} checkin={checkin} checkout={checkout} onReject={() => setShowReject(true)} />
      )}

      {showReject && result && (
        <RejectForm domain={result.domain || domainOf(url)} onCancel={() => setShowReject(false)}
          onSave={entry => { onBlock(entry); setShowReject(false); }} />
      )}
    </>
  );
}

function UnreadableResult({ result, onReject }) {
  return (
    <div className="card">
      <div className="verdict REVIEW">❓ COULDN'T READ THIS SITE
        <small>{result.error || 'The site blocked automated reading.'}</small>
      </div>
      <p className="muted">{result.advice || 'You can still review it yourself, or block the site so you don\'t come back to it.'}</p>
      <button className="danger" onClick={onReject}>🚫 Add {result.domain} to Do-Not-Search list</button>
    </div>
  );
}

function ResultPanel({ result, criteria, checkin, checkout, onReject }) {
  const v = result.verdict === 'NEEDS REVIEW' ? 'REVIEW' : result.verdict;
  const vText = result.verdict === 'PASS' ? '✅ PASS — meets everything we could verify'
    : result.verdict === 'FAIL' ? '❌ FAIL — breaks at least one of your requirements'
    : '❓ NEEDS REVIEW — nothing failed, but some items couldn\'t be verified from the page';
  return (
    <div className="card">
      <div className={`verdict ${v}`}>{vText}
        {result.destination && <small>📍 {result.destination}</small>}
        {(checkin || checkout) && <small>🗓️ Your dates: {checkin || '?'} → {checkout || '?'} (availability/price for these dates must be confirmed with the property)</small>}
      </div>
      {result.thinWarning && <div className="alert warn">{result.thinWarning}</div>}
      {CRITERIA_DISPLAY.map(def => {
        const c = result.checks[def.id];
        if (!c) return null;
        const required = !!criteria[def.key];
        const mark = MARKS[c.status] || MARKS.unknown;
        return (
          <div className={`criterion ${required ? '' : 'skipped'}`} key={def.id}>
            <div className={`mark ${mark.cls}`}>{mark.text}</div>
            <div className="body">
              <strong>{def.label}{required ? '' : ' (not required right now)'}</strong>
              <div className="evidence">{c.evidence}</div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 14 }}>
        <button className="danger" onClick={onReject}>🚫 Add {result.domain} to Do-Not-Search list</button>
      </div>
    </div>
  );
}

function RejectForm({ domain, onSave, onCancel }) {
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  function toggle(r) {
    setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r]);
  }
  return (
    <div className="card">
      <h2>🚫 Block {domain}</h2>
      <p className="muted">Pick every reason that applies — next time you paste a link from this site, the app will remind you why you skipped it.</p>
      <div className="reason-grid">
        {REJECTION_REASONS.map(r => (
          <label key={r} className={`reason-option ${selected.includes(r) ? 'checked' : ''}`}>
            <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} />
            {r}
          </label>
        ))}
      </div>
      <label className="field">Other / notes (optional)
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Anything else to remember about this site" />
      </label>
      <div className="row">
        <button className="primary" disabled={selected.length === 0 && !note.trim()} onClick={() => onSave({
          domain, reasons: selected.length ? selected : ['Other'], note: note.trim(),
          date: new Date().toISOString().slice(0, 10),
        })}>Save to Do-Not-Search list</button>
        <button className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ================= Criteria tab =================
function CriteriaTab({ criteria, onSave }) {
  const [c, setC] = useState(criteria);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setC(criteria); }, [criteria]);
  function upd(k, v) { setC(prev => ({ ...prev, [k]: v })); setSaved(false); }

  const toggles = [
    ['requireFlights', 'Nonstop flight within limit', 'From Atlanta (ATL) or Charlotte (CLT)'],
    ['requireOceanfront', 'Oceanfront / beachfront', 'Turn OFF for family trips where beach doesn\'t matter'],
    ['requirePrivatePool', 'Private pool', ''],
    ['requireHotTub', 'Hot tub', ''],
    ['requireBedrooms', 'Minimum bedrooms', ''],
    ['requireStandalone', 'Standalone residence only', 'No condos, townhouses, or resort units'],
    ['requireBudget', 'Within budget', ''],
    ['requireAdultsOnly', 'Adults-only', 'Turn OFF when traveling with the kids'],
    ['requireChef', 'Chef service available', ''],
    ['requireAprilSwim', 'Warm enough to swim in April', 'Turn OFF for August trips — everywhere is warm'],
  ];

  return (
    <div className="card">
      <h2>⚙️ Modify Criteria</h2>
      <p className="muted">These are your saved defaults. Toggle items off for a different kind of trip (like a family trip), change the numbers, then press Save.</p>
      {toggles.map(([key, label, hint]) => (
        <div className="toggle-row" key={key}>
          <div className="t-label">{label}{hint && <span className="hint">{hint}</span>}</div>
          <label className="switch">
            <input type="checkbox" checked={!!c[key]} onChange={e => upd(key, e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>
      ))}
      <h3>Numbers</h3>
      <div className="row">
        <label className="field">Max flight time (hours)
          <input type="number" value={c.maxFlightHours} onChange={e => upd('maxFlightHours', Number(e.target.value) || 0)} />
        </label>
        <label className="field">Minimum bedrooms
          <input type="number" value={c.minBedrooms} onChange={e => upd('minBedrooms', Number(e.target.value) || 0)} />
        </label>
        <label className="field">Max budget ($ per week)
          <input type="number" value={c.maxWeeklyBudget} onChange={e => upd('maxWeeklyBudget', Number(e.target.value) || 0)} />
        </label>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="primary" onClick={() => { onSave(c); setSaved(true); }}>Save criteria</button>
        <button className="secondary" onClick={() => { setC(DEFAULT_CRITERIA); setSaved(false); }}>Reset to your couples-trip defaults</button>
      </div>
      {saved && <div className="alert info" style={{ marginTop: 12 }}>✅ Saved. Every new check will use these settings.</div>}
    </div>
  );
}

// ================= Blocklist tab =================
function BlocklistTab({ blocklist, onRemove, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="card">
      <h2>🚫 Do-Not-Search List</h2>
      {blocklist.length === 0 && <p className="muted">Nothing blocked yet. When a property fails a check, you'll get a button to add its site here.</p>}
      {blocklist.map(b => (
        <div className="block-item" key={b.domain}>
          <div>
            <div className="dom">{b.domain}</div>
            <div className="meta">Blocked {b.date} — {b.reasons.join('; ')}{b.note ? ` — "${b.note}"` : ''}</div>
          </div>
          <button className="secondary" onClick={() => onRemove(b.domain)}>Unblock</button>
        </div>
      ))}
      {blocklist.length > 0 && (
        !confirmClear
          ? <button className="danger" onClick={() => setConfirmClear(true)}>Clear entire list…</button>
          : <div className="alert warn">
              <p>Delete all {blocklist.length} blocked site(s)? This can't be undone.</p>
              <div className="actions">
                <button className="danger" onClick={() => { onClear(); setConfirmClear(false); }}>Yes, clear everything</button>
                <button className="secondary" onClick={() => setConfirmClear(false)}>No, keep the list</button>
              </div>
            </div>
      )}
    </div>
  );
}

// ================= History tab =================
function HistoryTab({ history, onRemove }) {
  return (
    <div className="card">
      <h2>📋 Evaluation History</h2>
      {history.length === 0 && <p className="muted">No checks yet.</p>}
      {history.map((h, i) => {
        const v = h.verdict === 'NEEDS REVIEW' ? 'REVIEW' : (h.verdict === 'UNREADABLE' ? 'REVIEW' : h.verdict);
        return (
          <div className="hist-item" key={i}>
            <div className="top">
              <strong>{h.domain}</strong>
              <span className={`badge ${v}`}>{h.verdict}</span>
            </div>
            <div className="muted">
              {h.title && <>{h.title}<br /></>}
              {h.destination && <>📍 {h.destination} · </>}
              Checked {h.date}{h.checkin ? ` · for ${h.checkin} → ${h.checkout || '?'}` : ''}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <a href={h.url} target="_blank" rel="noreferrer"><button className="secondary">Open listing</button></a>
              <button className="danger" onClick={() => onRemove(i)}>Remove</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
