/* Becki's Birthday Getaway: game state, money maths, notifications. Public engine code only; all content, answers and keys live privately in Supabase. */
let C, G, QS, TEST, SEND, KEY, S, DEST, HOLS;   // set by main.js once the private content has loaded
const CATS = { her: "🌸 Becki's Life", pets: '🐻 The Animals', us: '💚 Us', jack: '🙋‍♂️ Jack', work: '📦 Work', family: '👨‍👩‍👧 Family & Friends', dares: '🎯 Dares', hunt: '🔎 Finds & Mysteries', games: '🎲 Games', birthday: '🎂 Birthday ideas' };
const codeOf = (t, k = 'code') => { const c = dec(t.enc2 || '') || {}; return c[k] || ''; };
let tab = 'home', filter = 'todo', cat = null, leafTaps = 0;

/* ---------- state ---------- */
let resetting = false;
const save = () => { if (resetting) return; S.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} if (window.CLOUD) window.CLOUD.queueSave(S, doneCount(), earned()); };


/* ---------- game data ---------- */
setTimeout(() => { try { SECT.forEach(([k, em, name]) => { CATS[k] = em + ' ' + name; }); } catch {} }, 0);
const waiting = t => !!(t.after && t.after.some(id => !S.done[id] && G.tasks.some(x => x.id === id && !x.draft)));
const live = () => G.tasks.filter(t => TEST || !t.draft);
const scored = () => live().filter(t => !t.draft);
const doneCount = () => scored().filter(t => S.done[t.id]).length;
const finaleOpen = () => scored().every(t => S.done[t.id]);
const won = t => S.done[t.id] ? Math.floor((t.amount || 0) * S.done[t.id].frac * 2) / 2 : 0;
const earned = () => scored().reduce((a, t) => a + won(t), 0);
const potOpen = () => finaleOpen() || !!S.cashed;
const potPct = () => scored().length ? doneCount() / scored().length : 0;  // progress by challenges, never reveals the cap


/* ---------- Discord ---------- */
function discord(content, file) {
  if (window.CLOUD) { if (!window.JACK_MODE || /Jack (overrode|marked|reset)|Test/i.test(content)) window.CLOUD.notify(content, file); return; }
  if (!window.HOOK || !SEND) { console.log('[discord]', content); return; }
  const fd = new FormData();
  fd.append('payload_json', JSON.stringify({ content: (TEST ? '[TEST] ' : '') + content.slice(0, 1900), username: `${poss(C.name)} Birthday Quest`, allowed_mentions: { parse: [] } }));
  if (file) fd.append('files[0]', file, file.name || 'file');
  fetch(window.HOOK, { method: 'POST', body: fd, mode: 'no-cors' }).catch(() => {});
}

