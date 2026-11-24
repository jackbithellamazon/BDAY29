/* Becki's Birthday Getaway: cloud loader.
   The public site holds NO content, keys, URLs or PINs. Everything arrives from Supabase after login.
   Connection (Supabase URL + anon key + secret key) comes from the magic link's #hash, stored on the device. */
(() => {
if (window.GAME) return;                       // offline demo/test builds carry their own content: nothing to do

const QS = new URLSearchParams(location.search);
const MOCK = QS.has('mock') || window.__FORCE_MOCK === true;
const LS = {
  mem: {},
  get(k) { try { const v = localStorage.getItem(k); return v === null ? (this.mem[k] ?? null) : v; } catch { return this.mem[k] ?? null; } },
  set(k, v) { this.mem[k] = v; try { localStorage.setItem(k, v); } catch {} },
  del(k) { delete this.mem[k]; try { localStorage.removeItem(k); } catch {} },
};
const STATE_KEY = 'becki-getaway-v2';
const b64uDec = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/* ---------- 1. magic link: #c=<base64url {"u":url,"a":anon,"k":key,"r":role}> ---------- */
(() => {
  const m = location.hash.match(/[#&]c=([^&]+)/);
  if (!m) return;
  try {
    const o = JSON.parse(b64uDec(m[1]));
    if (o.u && o.a) LS.set('becki-conn', JSON.stringify({ u: o.u, a: o.a }));
    if (o.p) window.__ASK_PIN = true;                                          // the PIN link: always ask for a PIN (her game, show mode or Jack)
    if (o.k && o.r === 'show') { LS.set('becki-show-key', o.k); window.__SHOW_LINK = true; }      // mates' show QR: kept separate, never replaces her login
    else if (o.k) { LS.set('becki-key', o.k); if (o.r) LS.set('becki-role', o.r); else LS.del('becki-role'); }
  } catch {}
  try { history.replaceState(null, '', location.pathname + location.search); } catch { try { location.hash = ''; } catch {} }   // never leave secrets in the address bar
})();

/* ---------- 2. talking to Supabase (or the in-page mock) ---------- */
const conn = () => { try { return JSON.parse(LS.get('becki-conn') || 'null'); } catch { return null; } };
async function rpc(fn, args) {
  if (MOCK && window.__mockRpc) return window.__mockRpc(fn, args);
  const c = conn(); if (!c) throw new Error('not connected');
  const r = await fetch(`${c.u.replace(/\/+$/, '')}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: c.a, Authorization: `Bearer ${c.a}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const txt = await r.text(); let body = null; try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }
  if (!r.ok) throw new Error((body && (body.message || body.hint)) || `error ${r.status}`);
  return body;
}

/* ---------- 3. screens before the game ---------- */
const app = () => document.getElementById('app');
const screen = html => { app().innerHTML = `<div class="gate">${html}</div>`; return app().firstElementChild; };
const loading = (msg = 'Unwrapping your present…') => screen(`<div class="gate-card center"><div class="gate-spin">🌿</div><p class="muted" style="margin:14px 0 0">${esc(msg)}</p></div>`);

function needLinkScreen() {
  const el = screen(`<div class="gate-card center"><div style="font-size:46px">💌</div><h1 style="font-size:26px;margin:10px 0 8px">Open the link Jack sent you</h1>
    <p class="muted" style="line-height:1.5;margin:0 0 18px">Scan the QR code in your card, or tap the link Jack messaged you. After that, this device remembers you.</p>
    <button class="btn ghost block" data-jack>I'm Jack</button></div>`);
  el.querySelector('[data-jack]').onclick = jackSetupScreen;
}

function jackSetupScreen() {
  const el = screen(`<div class="gate-card"><h1 style="font-size:24px;margin:0 0 6px">Jack's setup 🔧</h1><p class="small muted" style="margin:0 0 14px">One-off on a new device. Your private details file has these.</p>
    <label class="small" style="font-weight:700">Supabase URL</label><input class="field" data-u placeholder="Your project URL (from your private file)" autocomplete="off" style="margin:6px 0 12px">
    <label class="small" style="font-weight:700">Anon key</label><input class="field" data-a placeholder="eyJ…" autocomplete="off" style="margin:6px 0 12px">
    <label class="small" style="font-weight:700">Jack's PIN</label><input class="field" data-p type="password" inputmode="numeric" maxlength="4" placeholder="••••" style="margin:6px 0 14px;text-align:center;letter-spacing:.4em;font-size:22px">
    <div class="small" data-err style="color:var(--red);min-height:18px;margin-bottom:8px"></div>
    <button class="btn block" data-go>Connect</button><button class="btn ghost block" data-back style="margin-top:8px">Back</button></div>`);
  el.querySelector('[data-back]').onclick = needLinkScreen;
  el.querySelector('[data-go]').onclick = async () => {
    const u = el.querySelector('[data-u]').value.trim(), a = el.querySelector('[data-a]').value.trim(), p = el.querySelector('[data-p]').value.trim();
    const err = el.querySelector('[data-err]');
    if (!/^https:\/\/.+\.supabase\.co\/?$/.test(u) || a.length < 40 || p.length !== 4) { err.textContent = 'Check the URL, key and PIN.'; return; }
    LS.set('becki-conn', JSON.stringify({ u, a }));
    try { const r = await rpc('becki_login', { p_pin: p }); if (r.role !== 'jack') throw new Error("That's not Jack's PIN"); LS.set('becki-key', r.key); LS.set('becki-role', 'jack'); start(); }
    catch (e) { err.textContent = e.message || 'Could not connect'; }
  };
}

function pinScreen() {
  let pin = '', wait = null;
  const el = screen(`<div class="gate-card center"><div class="small" style="font-weight:700;letter-spacing:.1em;color:var(--sage-3)">BECKI'S BIRTHDAY GETAWAY</div>
    <h1 style="font-size:26px;margin:8px 0 4px">Enter your PIN 🌿</h1><p class="small muted" style="margin:0 0 16px">The numbers Jack gave you</p>
    <div class="pin-dots"></div><div class="small" data-err style="color:var(--red);min-height:20px;margin:6px 0"></div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '✓', 0, '⌫'].map(k => `<button class="key" data-k="${k}" aria-label="${k === '✓' ? 'Enter' : k === '⌫' ? 'Delete' : k}">${k}</button>`).join('')}</div></div>`);
  const box = el.querySelector('.pin-dots'), err = el.querySelector('[data-err]');
  const paint = () => { const n = Math.max(4, pin.length); box.innerHTML = '<i></i>'.repeat(n); [...box.children].forEach((d, i) => d.classList.toggle('on', i < pin.length)); };
  const go = async () => {
    clearTimeout(wait); if (pin.length < 4) return;
    const tried = pin;
    try {
      const r = await rpc('becki_login', { p_pin: tried });
      buzz([20, 40, 20]);
      if (r.role === 'show') { LS.set('becki-show-key', r.key); window.__SHOW_LINK = true; return start(); }   // show mode never replaces her own login
      LS.set('becki-key', r.key); LS.set('becki-role', r.role); start();
    } catch (e) { buzz([40, 40, 40]); box.classList.add('shake'); setTimeout(() => box.classList.remove('shake'), 400); err.textContent = /too many/i.test(e.message) ? 'Too many tries. Wait 15 minutes and try again.' : /not connected/i.test(e.message) ? 'Open the link Jack sent you first.' : "That's not right. Try again!"; pin = ''; paint(); }
  };
  el.querySelectorAll('.key').forEach(b => b.onclick = () => { const k = b.dataset.k; buzz(6); err.textContent = ''; clearTimeout(wait);
    if (k === '⌫') pin = pin.slice(0, -1); else if (k === '✓') return go(); else if (pin.length < 6) pin += k;
    paint(); if (pin.length === 6) go(); else if (pin.length === 4) wait = setTimeout(go, 1300); });
  paint();
}

/* ---------- 4. content + state ---------- */
function swapImages(node, rows) {                // "images/x.jpg" -> data URI stored in its own row
  if (typeof node === 'string') return node.startsWith('images/') && rows['img:' + node] ? rows['img:' + node] : node;
  if (Array.isArray(node)) return node.map(x => swapImages(x, rows));
  if (node && typeof node === 'object') { for (const k in node) node[k] = swapImages(node[k], rows); }
  return node;
}

let key, role, lastCloudAt = 0, saveTimer = null, saving = false, pending = null;
function pill(txt, cls = '') { let p = document.getElementById('cloud-pill'); if (!p) { p = document.createElement('div'); p.id = 'cloud-pill'; document.body.appendChild(p); } p.className = cls; p.textContent = txt; clearTimeout(p._t); if (cls !== 'warn') p._t = setTimeout(() => p.classList.add('fade'), 1800); }

async function pushSave() {
  if (saving || !pending) return;
  saving = true; const job = pending; pending = null;
  try { const ts = await rpc('becki_save', { p_key: key, p_state: job.state, p_done: job.done, p_pot: job.pot }); lastCloudAt = Date.parse(ts) || Date.now(); pill('☁️ Saved'); }
  catch (e) { pending = pending || job; pill('⚠️ Offline: will save when back', 'warn'); setTimeout(pushSave, 10000); }
  saving = false; if (pending) setTimeout(pushSave, 300);
}
const shrinkData = f => new Promise(res => { if (!f || !/^image\//.test(f.type)) return res(null); const img = new Image(); img.onload = () => { const s = Math.min(1, 1400 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; img.onerror = () => res(null); img.src = URL.createObjectURL(f); });

window.CLOUD = {
  get role() { return role; },
  queueSave(S, done, pot) { pending = { state: JSON.parse(JSON.stringify(S)), done, pot }; clearTimeout(saveTimer); saveTimer = setTimeout(pushSave, 1200); },
  async notify(text, file) {
    try {
      if (file) { const data = await shrinkData(file); if (data) { await rpc('becki_upload', { p_key: key, p_kind: 'photo', p_caption: String(text || '').slice(0, 300), p_data: data }); text = `📸 New photo from Becki: ${String(text || '').slice(0, 300)}\n_(see it on your Jack page)_`; } }
      await rpc('becki_notify', { p_key: key, p_content: String(text || '') });
    } catch (e) { console.warn('notify failed', e); }
  },
  setWebhook: url => rpc('becki_set_webhook', { p_key: key, p_url: url }),
  status: () => rpc('becki_jack_view', { p_key: key }),
  listUploads: () => rpc('becki_list_uploads', { p_key: key }),
  getUpload: id => rpc('becki_get_upload', { p_key: key, p_id: id }),
  test: () => rpc('becki_notify', { p_key: key, p_content: '🧪 Test from your Jack page: Discord is connected. ✅' }),
  async refresh() { const c = await rpc('becki_load', { p_key: key }); if (c && c.state) { LS.set(STATE_KEY, JSON.stringify(c.state)); } location.reload(); },
  logout() { ['becki-key', 'becki-role'].forEach(k => LS.del(k)); location.reload(); },
  enterTest() { LS.set('becki-test-mode', '1'); location.reload(); },
  forget() { ['becki-key', 'becki-role', 'becki-conn', STATE_KEY].forEach(k => LS.del(k)); location.reload(); },
};

async function start() {
  key = LS.get('becki-key'); role = LS.get('becki-role');
  if (!MOCK && !conn()) return needLinkScreen();
  if (window.__ASK_PIN) { window.__ASK_PIN = false; return pinScreen(); }
  if (window.__SHOW_LINK || (!key && LS.get('becki-show-key'))) return startShow();
  if (!key) return pinScreen();
  if (!role) { try { await rpc('becki_jack_view', { p_key: key }); role = 'jack'; } catch (e) { role = 'becki'; } LS.set('becki-role', role); }
  loading(role === 'jack' ? 'Loading Becki\'s progress…' : 'Unwrapping your present…');
  let rows, cloud;
  try { [rows, cloud] = await Promise.all([rpc('becki_get_content', { p_key: key }), rpc('becki_load', { p_key: key })]); }
  catch (e) {
    if (/bad key/i.test(e.message)) { LS.del('becki-key'); return pinScreen(); }
    const el = screen(`<div class="gate-card center"><div style="font-size:40px">📶</div><h1 style="font-size:22px;margin:10px 0 6px">Can't connect right now</h1><p class="muted" style="margin:0 0 16px">Check your signal and try again.</p><button class="btn block">Try again</button></div>`);
    el.querySelector('.btn').onclick = start; return;
  }
  if (!rows || !rows.game) { screen(`<div class="gate-card center"><div style="font-size:40px">🌱</div><h1 style="font-size:22px;margin:10px 0 6px">Nearly ready…</h1><p class="muted" style="margin:0">Jack is still setting things up. Check back soon!</p></div>`); return; }
  window.GAME = swapImages(rows.game, rows);
  window.DEST = rows.dest || []; window.HOLS = rows.hols || { school: [], bank: [] };
  window.CONFIG = Object.assign({}, rows.config || {});
  window.STORE_KEY = STATE_KEY;
  // cloud vs this device: whichever is newer wins
  let local = null; try { local = JSON.parse(LS.get(STATE_KEY) || 'null'); } catch {}
  const cs = cloud && cloud.state;
  if (cs && (!local || (cs.savedAt || 0) >= (local.savedAt || 0))) local = cs;
  window.__INITIAL_STATE = local || {};
  lastCloudAt = cloud ? Date.parse(cloud.updated_at) || 0 : 0;
  window.JACK_MODE = role === 'jack';
  // 🧪 Jack's TEST MODE: play the real game in a sandbox. Separate local state, nothing saved to the cloud, nothing sent to Discord.
  const SANDBOX = role === 'jack' && LS.get('becki-test-mode') === '1';
  if (SANDBOX) {
    window.JACK_MODE = false; window.TEST_SANDBOX = true; window.STORE_KEY = 'becki-jack-test';
    let ts = {}; try { ts = JSON.parse(LS.get('becki-jack-test') || '{}') || {}; } catch {}
    window.__INITIAL_STATE = ts;
    window.CLOUD.queueSave = () => {};                                         // never touches her real save
    window.CLOUD.notify = (text) => { console.log('[test mode] would send to Discord:', text); return Promise.resolve(); };
    window.CLOUD.setWebhook = window.CLOUD.test = () => Promise.reject(new Error('Not available in test mode'));
    const bar = document.createElement('div'); bar.id = 'testbar-live';
    bar.innerHTML = '<span>🧪 TEST MODE: nothing is saved or sent</span><button data-r>Reset</button><button data-x>Exit test mode</button>';
    document.body.prepend(bar); document.body.classList.add('has-testbar');
    bar.querySelector('[data-r]').onclick = () => { if (confirm('Wipe your test progress?')) { LS.del('becki-jack-test'); location.reload(); } };
    bar.querySelector('[data-x]').onclick = () => { LS.del('becki-test-mode'); location.reload(); };
  }
  app().innerHTML = '';
  window.__startApp();
  if (!window.JACK_MODE && !SANDBOX) setInterval(pull, 60000), addEventListener('visibilitychange', () => document.visibilityState === 'visible' && pull());
}

// 👀 SHOW MODE (Becki's mates): the real game, read-only. Own local state, nothing saved to the cloud, nothing sent to Discord.
async function startShow() {
  key = LS.get('becki-show-key'); role = 'show';
  loading('Loading the show version…');
  let rows;
  try { rows = await rpc('becki_get_content', { p_key: key }); }
  catch (e) {
    if (/bad key/i.test(e.message)) { LS.del('becki-show-key'); screen(`<div class="gate-card center"><div style="font-size:40px">🔒</div><h1 style="font-size:22px;margin:10px 0 6px">Show version switched off</h1><p class="muted" style="margin:0">Ask Becki for a new code.</p></div>`); return; }
    const el = screen(`<div class="gate-card center"><div style="font-size:40px">📶</div><h1 style="font-size:22px;margin:10px 0 6px">Can't connect right now</h1><p class="muted" style="margin:0 0 16px">Check your signal and try again.</p><button class="btn block">Try again</button></div>`);
    el.querySelector('.btn').onclick = startShow; return;
  }
  if (!rows || !rows.game) return;
  window.GAME = swapImages(rows.game, rows);
  window.DEST = rows.dest || []; window.HOLS = rows.hols || { school: [], bank: [] };
  window.CONFIG = Object.assign({}, rows.config || {});
  window.STORE_KEY = 'becki-show'; window.JACK_MODE = false; window.TEST_SANDBOX = true; window.SHOW_MODE = true; window.SHOW_POT = 50;
  let ts = {}; try { ts = JSON.parse(LS.get('becki-show') || '{}') || {}; } catch {}
  if (!ts.opened) ts.opened = Date.now();                                      // skip the private birthday letter
  window.__INITIAL_STATE = ts;
  window.CLOUD.queueSave = () => {};
  window.CLOUD.notify = () => Promise.resolve();
  window.CLOUD.setWebhook = window.CLOUD.test = window.CLOUD.refresh = () => Promise.reject(new Error('Not available in show mode'));
  const bar = document.createElement('div'); bar.id = 'testbar-live';
  bar.innerHTML = '<span>👀 SHOW MODE: nothing is saved · £50 play money</span><button data-r>Start again</button>';
  document.body.prepend(bar); document.body.classList.add('has-testbar');
  bar.querySelector('[data-r]').onclick = () => { if (confirm('Wipe this demo and start again?')) { LS.del('becki-show'); location.reload(); } };
  app().innerHTML = '';
  window.__startApp();
}

// Becki's device picks up Jack's overrides (or her other device's progress) when it's newer than what it has
async function pull() {
  if (document.querySelector('.sheet,.modal,.intro') || pending || saving) return;
  try {
    const c = await rpc('becki_load', { p_key: key }); if (!c || !c.state) return;
    const mine = (window.__S && window.__S.savedAt) || 0;
    if ((c.state.savedAt || 0) > mine) { LS.set(STATE_KEY, JSON.stringify(c.state)); if (!MOCK) location.reload(); else window.__pulled = c.state; }
  } catch {}
}

let started = false; const go = () => { if (!started) { started = true; start(); } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
