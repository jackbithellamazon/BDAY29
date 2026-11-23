/* Becki's Birthday Getaway: start-up. Public engine code only; all content, answers and keys live privately in Supabase. */
window.__startApp = () => {
C = window.CONFIG, G = window.GAME;
QS = new URLSearchParams(location.search);
TEST = QS.has('jack') || window.FORCE_TEST === true;
SEND = !TEST || QS.has('post');
KEY = window.STORE_KEY || (TEST ? 'becki-getaway-test' : 'becki-getaway-v2');
S = window.__INITIAL_STATE || (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
window.__S = S;
S.done ||= {}; S.prizes ||= []; S.prefs ||= {}; S.plan ||= {};
if (TEST) window.__t = { matches: (g, a, s) => matches(g, a, s), hasAll: (g, n) => hasAll(g, n), S: () => S };
DEST = (window.DEST || []).slice().sort((x, y) => (y.popularity || 0) - (x.popularity || 0) || (/direct/i.test(y.fromMAN) - /direct/i.test(x.fromMAN)));
HOLS = window.HOLS || { school: [], bank: [] };
const unlock = QS.get('unlock');
render();
if (window.JACK_MODE) { jackCorner(true); }
else if (unlock) {
  history.replaceState(null, '', location.pathname);
  const t = G.tasks.find(x => x.type === 'qr' && codeOf(x) && norm(codeOf(x)) === norm(unlock));
  const after = () => { render(); if (!S.opened) intro(); };   // never skip the birthday letter
  if (t && !S.done[t.id]) setTimeout(() => complete(t, 1, { text: '📱 Scanned the secret QR', msg: 'You found the secret QR code! 🕵️‍♀️' }, after), 300);
  else if (!S.opened) intro();
} else if (!S.opened) intro();
};
if (window.GAME) window.__startApp();
