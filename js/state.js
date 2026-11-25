/* Becki's Birthday Getaway: game state, money maths, notifications. Public engine code only; all content, answers and keys live privately in Supabase. */
let C, G, QS, TEST, SEND, KEY, S, DEST, HOLS;   // set by main.js once the private content has loaded
const CATS = { her: "🌸 Becki's Life", pets: '🐻 The Animals', us: '💚 Us', jack: '🙋‍♂️ Jack', work: '📦 Work', family: '👨‍👩‍👧 Family & Friends', dares: '🎯 Dares', hunt: '🔎 Finds & Mysteries', games: '🎲 Games', birthday: '🎂 Birthday ideas' };
const codeOf = (t, k = 'code') => { const c = dec(t.enc2 || '') || {}; return c[k] || ''; };
let tab = 'home', filter = 'todo', cat = null, leafTaps = 0;

/* ---------- state ---------- */
const LOCAL = () => (window.NO_LOCAL ? sessionStorage : localStorage);   // PIN-link sessions never write to the phone's permanent storage
let resetting = false;
const save = () => { if (resetting) return; S.savedAt = Date.now(); try { LOCAL().setItem(KEY, JSON.stringify(S)); } catch {} if (window.CLOUD) window.CLOUD.queueSave(S, doneCount(), earned()); };


/* ---------- game data ---------- */
setTimeout(() => { try { SECT.forEach(([k, em, name]) => { CATS[k] = em + ' ' + name; }); } catch {} }, 0);
const waiting = t => !!(t.after && t.after.some(id => !S.done[id] && G.tasks.some(x => x.id === id && !x.draft)));
const live = () => G.tasks.filter(t => TEST || !t.draft);
const scored = () => live().filter(t => !t.draft && !t.casino);
const doneCount = () => scored().filter(t => S.done[t.id]).length;
const finaleOpen = () => scored().every(t => S.done[t.id]);
const won = t => S.done[t.id] ? Math.floor((t.amount || 0) * S.done[t.id].frac * 2) / 2 : 0;
function rnd(n) { const b = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; let x; do { crypto.getRandomValues(b); x = b[0]; } while (x >= lim); return x % n; }  // unbiased 0..n-1
const BONUS_CAP = 30;
const hintCut = (lo = .08, hi = .22) => lo + rnd(1001) / 1000 * (hi - lo);   // each hint knocks a random 8-22% off that challenge
const rawEarned = () => scored().reduce((a, t) => a + won(t), 0) + Math.min(BONUS_CAP, S.bonus || 0) + ((S.casino && S.casino.net) || 0) + (window.SHOW_POT || 0);
const OVER = () => (C.overCap ?? 100);   // casino profit can push her past the budget, up to this much (super rare: she'd need to finish nearly everything AND be ahead at the casino)
const potLimit = () => C.cap + Math.max(0, Math.min(OVER(), (S.casino && S.casino.net) || 0));
const earned = () => Math.max(0, Math.min(potLimit(), rawEarned()));   // casino wins and losses included
const POOL = () => (G && G.prizePool) || [];
const pickPool = (filter = p => !p.lose && !p.again) => { const L = POOL().filter(p => !(window.SHOW_MODE && p.spicy)).filter(filter), w = L.map(p => p.rare ? 1 : 6), tot = w.reduce((x, y) => x + y, 0); let r = rnd(tot); for (let i = 0; i < L.length; i++) { if ((r -= w[i]) < 0) return L[i]; } return L[0]; };
// give her a pool prize: coupons go to Coupons, £5 goes to the pot (until the £30 bonus cap). Returns text, or null = not a winner.
function awardPool(p, from) {
  if (!p || p.lose || p.again) return null;
  if (p.money) { if ((S.bonus || 0) + p.money > BONUS_CAP) return null; S.bonus = (S.bonus || 0) + p.money; if (p.money < 0) discord(`💸 **${C.name}** lost ${money(-p.money)} on ${from} 😈`); return p.money < 0 ? `−${money(-p.money)} from your holiday pot 😈` : `+${money(p.money)} for your holiday pot 💷`; }
  const text = p.prize || p.l, mystery = !p.forfeit && rnd(100) < 15;
  S.prizes.push({ id: from + '-' + Date.now() + '-' + rnd(1000000), text, e: p.e || '', from, used: false, owed: !!p.forfeit, jack: !!p.jack, size: p.size || '', mystery, at: Date.now() });
  if (mystery) discord(`🎁 **${C.name}** won a sealed Mystery coupon: **${text}** (she finds out when she redeems it)`);
  checkCollect();
  return mystery ? '🎁 Mystery coupon (open it in your Coupons tab)' : text;
}
// collect-a-bonus: every 3 small coupons she owns unlocks a bonus BIG coupon (she keeps everything)
function checkCollect() {
  const due = Math.floor(S.prizes.filter(x => x.size === 'small').length / 3);
  S.collected ||= 0;
  while (S.collected < due) {
    S.collected++; const big = pickPool(q => q.size === 'big'); if (!big) return;
    const text = big.prize || big.l;
    S.prizes.push({ id: 'collect-' + S.collected + '-' + Date.now(), text, e: big.e || '', from: 'Collect-a-bonus 🎉', used: false, size: 'bonus', at: Date.now() });
    discord(`🎉 **${C.name}** collected ${S.collected * 3} small coupons → bonus unlocked: **${text}**`);
    setTimeout(() => { const m = h(`<div class="modal"><div class="card center"><div style="font-size:44px">🎉</div><h2 style="margin:6px 0">Collect-a-bonus!</h2><p class="muted" style="margin:0 0 10px">3 more little coupons collected, so you've unlocked a BIG one. You keep the others too!</p><div class="coupon" style="text-align:center"><b>${esc(text)}</b></div><button class="btn block" style="margin-top:12px">Yay! 🎟️</button></div></div>`); document.body.appendChild(m); confetti(150); buzz([20, 40, 20, 40]); m.querySelector('.btn').onclick = () => m.remove(); }, 1200);
  }
}
const replayMax = t => t.replay ? (t.replay.max || Infinity) : 0;
const playsUsed = t => S.done[t.id] ? (S.plays[t.id] || 1) : 0;
const playsLeft = t => Math.max(0, replayMax(t) - playsUsed(t));
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

