/* Becki's Birthday Getaway: ui. Public engine code only; all content, answers and keys live privately in Supabase. */
/* ---------- confetti ---------- */
const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], raf = 0;
function confetti(n = 140) {
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  const cols = ['#9caf88', '#7f9a72', '#e9b8a9', '#d9a94a', '#fffdf8', '#566f4c'];
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - .5) * .3, life: 0 });
  if (!raf) tick();
}
function tick() {
  cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.y < innerHeight + 30 && p.life < 240);
  for (const p of parts) { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life++; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
  if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
}


/* ---------- shell ---------- */
function render() {
  const app = $('#app'); app.innerHTML = ''; document.body.classList.toggle('test', TEST);
  if (window.JACK_MODE) { const jb = h(`<div class="jackbar"><span>👀 Jack's view of Becki's game</span><button data-jr>🔄 Refresh</button><button data-jp>🧔‍♂️ Jack panel</button></div>`); jb.querySelector('[data-jr]').onclick = () => window.CLOUD.refresh(); jb.querySelector('[data-jp]').onclick = () => jackCorner(true); app.appendChild(jb); }
  if (TEST) app.appendChild(h(`<div class="testbar">🔧 Jack's test mode: drafts shown${SEND ? ', posting to Discord' : ', nothing sent'} <button id="tReset">Reset</button><button id="tAll">Complete all</button></div>`));
  const w = h('<div class="wrap"></div>'); app.appendChild(w);
  ({ home: renderHome, prizes: renderPrizes, finale: renderFinale }[tab])(w);
  const nav = h(`<nav class="nav"><div class="navin">
    <button data-t="home" class="${tab === 'home' ? 'on' : ''}">🌿 Challenges</button>
    <button data-t="prizes" class="${tab === 'prizes' ? 'on' : ''}">🎟️ Coupons${S.prizes.some(p => !p.seen) ? `<span class="badge">${S.prizes.filter(p => !p.seen).length}</span>` : ''}</button>
    <button data-t="finale" class="${tab === 'finale' ? 'on' : ''}">✈️ Plan the trip</button></div></nav>`);
  nav.querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; buzz(8); render(); scrollTo(0, 0); });
  app.appendChild(nav);
  if (TEST) {
    $('#tReset').onclick = () => { try { localStorage.removeItem(KEY); } catch {} Object.keys(S).forEach(k => delete S[k]); S.done = {}; S.prizes = []; S.prefs = {}; S.plan = {}; tab = 'home'; cat = null; document.querySelectorAll('.sheet,.modal,.intro').forEach(x => x.remove()); document.body.style.overflow = ''; resetting = true; render(); intro(); setTimeout(() => { resetting = false; }, 0); try { location.reload(); } catch {} };
    $('#tAll').onclick = () => { scored().forEach(t => S.done[t.id] ||= { frac: 1, at: Date.now() }); save(); render(); };
  }
}

function header(w) {
  const top = h(`<div class="top"><div><div class="hello"><span id="leaf" style="cursor:pointer;padding:4px 2px">🌿</span> Happy birthday, ${esc(C.name)} 🎂</div><h1>${esc(poss(C.name))} Birthday <em>Getaway</em></h1></div></div>`);
  w.appendChild(top);
  top.querySelector('#leaf').onclick = () => { leafTaps++; buzz(5); if (leafTaps >= 5) { leafTaps = 0; jackCorner(); } };
}

function bigJar(w) {
  const pct = potPct();
  const el = h(`<div class="card potcard"><div class="jar gold big"><div class="liquid" data-h="${pct * 100}"></div><div class="jarq">£</div></div>
    <div style="flex:1"><div class="small muted" style="font-weight:700;letter-spacing:.06em">YOUR HOLIDAY POT</div><div class="serif" style="font-size:26px;margin:2px 0 4px">${money(earned())}</div>
    <div class="potbar"><i style="width:${pct * 100}%"></i></div><div class="small muted">${doneCount()} of ${scored().length} challenges done</div></div></div>`);
  w.appendChild(el);
  requestAnimationFrame(() => setTimeout(() => el.querySelector('.liquid').style.height = pct * 100 + '%', 60));
}

const SECT = [
  ['games', '🎮', 'Games', 'Scratch cards, wheels, quizzes and puzzles'],
  ['pets', '🐻', 'The Animals', 'How well do you know the furry family?'],
  ['us', '💞', 'Us Two', 'Our memories, trips and firsts'],
  ['jack', '🧔‍♂️', 'Jack', 'How well do you REALLY know me?'],
  ['work', '📦', 'Work', 'Questions from the unit'],
  ['family', '🏡', 'Family & Friends', 'A bit of banter about the people we love'],
  ['her', '🌸', "Becki's Life", 'You, your family and your favourite things (I keep your answers)'],
  ['dares', '🔥', 'Dares', 'Do it, then I give you a code. Swap any you like'],
  ['hunt', '🗝️', 'Finds & Mysteries', 'Hidden notes, secret codes and a mystery parcel'],
  ['birthday', '🎂', 'Dream Birthday', 'Help me plan your 30th (any answer wins)'],
];
function lockBanner(w) {
  if (!S.locked) return;
  const b = h(`<div class="card lockban"><div class="row" style="gap:12px;align-items:flex-start"><span style="font-size:28px">🔒</span><div style="flex:1"><b>You cashed out with ${money(earned())}</b><div class="small muted" style="margin-top:2px">Challenges are locked while you plan. Need more budget? Reopen them and keep earning.</div></div></div><button class="btn ghost block" style="margin-top:10px">Reopen challenges to earn more</button></div>`);
  b.querySelector('.btn').onclick = () => { if (!confirm('Reopen the challenges? Your trip plan stays saved, and anything you win gets added to your pot.')) return; S.locked = false; save(); discord(`🔓 **${C.name}** reopened the challenges to earn more (pot ${money(earned())})`); render(); };
  w.appendChild(b);
}
function renderHome(w) {
  header(w); bigJar(w); lockBanner(w);
  const tasks = live();
  if (cat) {
    const S0 = SECT.find(x => x[0] === cat) || ['', '', cat, ''];
    const ts = tasks.filter(t => t.cat === cat).sort((x, y) => ((!!S.done[x.id]) - (!!S.done[y.id])) || ((!!x.last) - (!!y.last)));
    const back = h(`<button class="crumb">← All sections</button>`); back.onclick = () => { cat = null; render(); scrollTo(0, 0); }; w.appendChild(back);
    w.appendChild(h(`<div class="sechead"><span class="sem">${S0[1]}</span><div><h2>${esc(S0[2])}</h2><div class="small muted">${ts.filter(t => S.done[t.id]).length} of ${ts.length} done · ${esc(S0[3])}</div></div></div>`));
    const list = h('<div class="rows"></div>');
    ts.forEach(t => {
      const d = S.done[t.id], wait = waiting(t), rw = ['done', 'reverse', 'code', 'qr', 'naughtynice'].includes(t.type), big = (t.amount || 0) >= 25;
      const b = h(`<button class="trow ${d ? 'done' : ''}"><span class="em">${ico(t.emoji)}</span><span class="tt"><b>${esc(t.title)}</b><span class="tags">${t.draft ? '<i class="tag dark">DRAFT</i>' : ''}${wait ? `<i class="tag">${esc(t.afterNote || '🔒 Unlocks after the others')}</i>` : ''}${rw ? '<i class="tag">🚶 Real world</i>' : ''}${d ? `<i class="tag gold">+${money(won(t))}</i>` : ''}${t.optional ? '<i class="tag">Optional</i>' : ''}</span></span><span class="st">${d ? '✓' : '›'}</span></button>`);
      b.onclick = () => { if ((S.locked || wait) && !d) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; } openTask(t); }; if ((S.locked || wait) && !d) b.classList.add('locked'); list.appendChild(b);
    });
    w.appendChild(list);
    return;
  }
  const pool = tasks.filter(t => !S.done[t.id] && !t.draft && !waiting(t));
  if (pool.length && !S.locked) { const sp = h(`<button class="surprise">🎲 Surprise me: pick a random challenge</button>`); sp.onclick = () => { buzz(10); openTask(pool[Math.floor(Math.random() * pool.length)]); }; w.appendChild(sp); }
  w.appendChild(h(`<div class="sect" style="margin-top:6px">Pick a section</div>`));
  const grid = h('<div class="secs2"></div>');
  SECT.forEach(([k, em, name, desc], i) => {
    const ts = tasks.filter(t => t.cat === k); if (!ts.length) return;
    const dn = ts.filter(t => S.done[t.id]).length, all = dn === ts.length, got = ts.reduce((x, t) => x + won(t), 0);
    const b = h(`<button class="sec2 sc-${k} ${all ? 'done' : ''}"><span class="sem2">${em}</span><b>${esc(name)}</b><span class="sdesc">${esc(desc)}</span><span class="sfoot"><span class="ring" style="--p:${dn / ts.length * 100}"><i>${all ? '✓' : dn + '/' + ts.length}</i></span>${got ? `<span class="sgot">+${money(got)}</span>` : `<span class="sgot muted">${ts.length} to do</span>`}</span></button>`);
    b.onclick = () => { cat = k; buzz(6); render(); scrollTo(0, 0); }; grid.appendChild(b);
  });
  w.appendChild(grid);
  if (finaleOpen()) { const f = h(`<button class="card center" style="margin-top:18px;background:var(--sage-3);color:#fff;width:100%"><h2>Every challenge done 🎉</h2><p style="opacity:.85;margin:6px 0 0">Your pot is ready to open. Tap here.</p></button>`); f.onclick = () => { tab = 'finale'; render(); scrollTo(0, 0); }; w.appendChild(f); }
}


/* ---------- task sheet ---------- */
function openTask(t) {
  if (window.JACK_MODE) return jackTaskInfo(t);
  const sh = h(`<div class="sheet"><div class="wrap"><div class="sheethead"><button class="back" aria-label="Back">←</button><span class="pill">${CATS[t.cat] || ''}</span></div>
    <div class="taskhero"><div class="emwrap sc-${t.cat}"><span class="em">${ico(t.emoji)}</span></div><h2>${esc(t.title)}</h2>${t.intro ? `<p>${esc(t.intro)}</p>` : ''}${t.pref ? `<p class="prefnote">${esc(C.prefNote)}</p>` : ''}</div><div class="game"></div></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  let closed = false;
  const close = () => { if (closed) return; closed = true; sh.remove(); document.body.style.overflow = ''; removeEventListener('popstate', onPop); if (history.state?.sheet) history.back(); render(); };
  const onPop = () => { if (!closed) { closed = true; sh.remove(); document.querySelector('.modal')?.remove(); document.body.style.overflow = ''; render(); } };
  history.pushState({ sheet: 1 }, ''); addEventListener('popstate', onPop);
  sh.querySelector('.back').onclick = close;
  const g = sh.querySelector('.game');
  const prev = S.done[t.id];
  if (prev && !t.pref) { g.innerHTML = `<div class="card center"><div style="font-size:40px">✅</div><h3 style="margin:8px 0">Already completed</h3><p class="muted">${prev.note ? esc(prev.note) : 'Nice work. This one is banked.'}</p><button class="btn block">Back</button></div>`; g.querySelector('.btn').onclick = close; return; }
  const done = (frac, detail) => complete(t, frac, detail || {}, close);
  const fn = { emoji: gEmoji, whois: gWhois, match3: gMatch3, search: gSearch, wordle: gWordle, missing: gMissing, scramble: gScramble, tap: gTap, multi: gMulti, list: gList, done: gDone, quiz: gQuiz, answer: gAnswer, choice: gChoice, open: gOpen, parcel: gParcel, memory5: gMemory5, listing: gListing, naughtynice: gNaughtyNice, pin: gPin, reverse: gReverse, risk: gRisk, memory: gMemory, wheel: gWheel, 'this-or-that': gTot, scratch: gScratch, code: gCode, qr: gQr, photo: gPhoto, reveal: gReveal, order: gOrder }[t.type];
  if (!fn) { g.innerHTML = '<p class="center muted">Coming soon.</p>'; return; }
  fn(t, g, done);
}

function complete(t, frac, detail, close) {
  frac = Math.max(0, Math.min(1, frac));
  const first = !S.done[t.id];
  S.done[t.id] = { frac: Math.max(frac, S.done[t.id]?.frac || 0), at: Date.now(), note: detail.note || '', text: String(detail.text || detail.raw || '').slice(0, 1500) };
  let gotPrize = null;
  if (first && t.prize) { gotPrize = t.prize; S.prizes.push({ id: t.id, text: t.prize, from: t.title, used: false }); }
  if (detail.prize) { gotPrize = detail.prize; S.prizes.push({ id: t.id + '-x', text: detail.prize, from: t.title, used: false }); }
  if (t.pref) S.prefs[t.id] = { q: t.q || t.title, tag: t.tag || 'style', answer: detail.raw ?? '', parts: detail.parts, skipped: !!detail.skipped, at: new Date().toISOString() };
  save();
  const amt = Math.floor((t.amount || 0) * frac * 2) / 2;
  const pctTxt = frac < 1 && !detail.skipped ? ` (${Math.round(frac * 100)}%)` : '';
  if (t.pref) discord(`🔒 **${t.cat === 'her' ? 'ALL ABOUT BECKI' : 'BIRTHDAY IDEA'} (Jack only)** · ${t.tag || ''}\n**${t.q || t.title}**\n${detail.skipped ? '_skipped_' : '> ' + String(detail.raw || '').replace(/\n/g, '\n> ')}\n_(+${money(amt)} · pot now ${money(earned())})_`);
  else discord(`${first ? '✅' : '🔁'} **${C.name}** completed **${t.title}**${pctTxt} → +${money(amt)}${detail.text ? `\n${detail.text}` : ''}\n_Pot: ${money(earned())} of ${money(C.cap)} · ${doneCount()}/${scored().length} done (hidden from her)_`, detail.file);
  if (first && !t.pref && doneCount() % 5 === 0) autoBackup(`${doneCount()} done`);
  if (t.pref && (!S.lastPrefBackup || Date.now() - S.lastPrefBackup > 10 * 60 * 1000)) { S.lastPrefBackup = Date.now(); save(); autoBackup('new answers'); }
  if (detail.skipped) { close(); return; }
  buzz([20, 40, 20]); confetti(frac >= .99 ? 140 : 70);
  const coins = Math.max(1, Math.min(10, Math.round(frac * 8)));
  const msg = frac >= .99 ? 'Perfect! Every coin dropped in.' : frac >= .6 ? 'Nice one. Most of the coins dropped in.' : frac > 0 ? 'Some coins dropped in. Every bit counts!' : 'Not this time, but every one you try gets you closer to the trip. On to the next!';
  const m = h(`<div class="modal"><div class="card ${frac > 0 ? 'win' : 'lose'}">
    <div class="coins">${frac > 0 ? Array.from({ length: coins }, (_, i) => `<span style="animation-delay:${i * .08}s">🪙</span>`).join('') : '🌿'}</div>
    <h2 style="margin:6px 0 8px">${frac >= .99 ? 'Brilliant! 🎉' : frac > 0 ? 'Nice one! ✨' : 'So close! 💚'}</h2>
    <p class="muted" style="margin:0 0 6px">${esc(detail.msg || msg)}</p>
    ${frac > 0 ? `<div class="won">+${money(amt)}</div><p style="margin:0;font-weight:600">🍯 Your pot: ${money(earned())}</p>` : `<p style="margin:0" class="muted">This one was worth ${money(t.amount || 0)}.</p>`}
    ${gotPrize ? `<div class="coupon"><span class="small muted">🎁 PRIZE UNLOCKED</span><b>${esc(gotPrize)}</b><span class="small muted">Saved in your Coupons tab</span></div>` : ''}
    <button class="btn block" style="margin-top:14px">${finaleOpen() && first ? 'Something big just unlocked…' : 'Back to the challenges'}</button></div></div>`);
  document.body.appendChild(m);
  m.querySelector('.btn').onclick = () => { m.remove(); if (finaleOpen() && first) tab = 'finale'; close(); };
  if (frac < 1 && !t.pref && !detail.skipped && detail.wrong) {
    const ask = h(`<div class="askjack"><button class="btn ghost block sm">🤔 Think you were right? Ask Jack</button></div>`);
    m.querySelector('.card').insertBefore(ask, m.querySelector('.card > .btn'));
    ask.querySelector('button').onclick = () => {
      ask.innerHTML = '';
      pinPad(ask, 'JACK: PIN TO GIVE FULL MARKS', () => {
        S.done[t.id].frac = 1; S.done[t.id].note = 'Jack overrode this one: full marks ✓'; save();
        discord(`✏️ Jack overrode: **${t.title}** → full ${money(t.amount || 0)} (pot now ${money(earned())})`);
        buzz([20, 40, 20]); confetti(120);
        ask.innerHTML = `<div class="won">+${money(t.amount || 0)}</div><p style="margin:0 0 6px;font-weight:600">Jack says you were right! 🍯 Your pot: ${money(earned())}</p>`;
      });
    };
  }
}


/* ---------- reusable bits ---------- */
const qCard = (q, img, vid) => `<div class="card">${vid ? `<video class="photoprev" style="margin:0 0 12px" src="${esc(vid)}" autoplay loop muted playsinline controls></video>` : ''}${img ? `<img class="photoprev" style="margin:0 0 12px" src="${esc(img)}">` : ''}<div class="q" style="margin:0">${esc(q)}</div></div>`;
const shake = el => { el.classList.add('shake'); buzz([30, 30, 30]); setTimeout(() => el.classList.remove('shake'), 400); };
function codePad(g, t, onOk, label) {
  const box = h(`<div class="pinbox"><div class="small muted center" style="font-weight:700;letter-spacing:.06em">${esc(label || 'DONE IT? ASK JACK FOR THE CODE')}</div><input class="field codein" maxlength="6" inputmode="numeric" placeholder="••••••" autocomplete="off"><button class="btn block">Unlock</button></div>`);
  g.appendChild(box);
  const inp = box.querySelector('input'), go = () => { const v = norm(inp.value); const hit = Object.entries(t.__codes || { code: codeOf(t) }).find(([, c]) => c && norm(c) === v); if (hit) { buzz(20); box.remove(); onOk(hit[0]); } else { shake(inp); } };
  box.querySelector('.btn').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  return box;
}
function pinPad(g, label, onOk) {
  const box = h(`<div class="pinbox"><div class="small muted center" style="font-weight:700;letter-spacing:.06em">${esc(label || 'JACK: TYPE YOUR PIN TO CONFIRM')}</div><input class="field pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"><button class="btn block">Confirm</button></div>`);
  g.appendChild(box);
  const inp = box.querySelector('input'), go = () => { if (inp.value === C.pin) { buzz(20); box.remove(); onOk(); } else { shake(inp); inp.value = ''; } };
  box.querySelector('.btn').onclick = go; inp.oninput = () => inp.value.length === 4 && go();
  return box;
}


/* ---------- prizes ---------- */
function renderPrizes(w) {
  header(w);
  w.appendChild(h('<div class="sect">🎟️ Your coupons</div>'));
  w.appendChild(h(`<p class="small muted" style="margin:-4px 2px 12px;line-height:1.5">Win these from scratchcards, the wheel and a few challenges. When you want to cash one in, tap <b>Redeem</b> and ${esc(C.from)} gets a ping. 😉</p>`));
  if (!S.prizes.length) w.appendChild(h('<div class="empty">No coupons yet. The scratchcards and the wheel are a good place to start! 🎟️</div>'));
  S.prizes.forEach(p => {
    const el = h(`<div class="tkt ${p.used ? 'used' : ''}"><div class="l"><b>${esc(p.text)}</b><span class="small muted">From: ${esc(p.from)}</span></div><div class="r">${p.used ? '<span class="small" style="font-weight:600;color:var(--sage-3)">Redeemed ✓</span>' : '<button>Redeem</button>'}</div></div>`);
    const b = el.querySelector('button');
    if (b) b.onclick = () => { if (!confirm(`Redeem "${p.text}" now? ${C.from} gets a notification.`)) return; p.used = true; save(); discord(`🎁 **${C.name}** is redeeming: **${p.text}**. Pay up! 😄`); confetti(50); render(); };
    w.appendChild(el);
  });
  S.prizes.forEach(p => p.seen = true); save();
  const sv = h(`<div class="card savecard"><div class="row" style="gap:12px;align-items:flex-start"><span style="font-size:26px">💾</span><div style="flex:1"><b>Save &amp; move devices</b><div class="small muted" style="margin-top:3px;line-height:1.45">Playing on another phone or laptop? Export here, import there.${S.lastBackup ? `<br>Last saved to ${esc(C.from)}: ${esc(new Date(S.lastBackup).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}` : ''}</div></div></div><button class="btn ghost block" style="margin-top:12px">Open save options</button></div>`);
  sv.querySelector('.btn').onclick = () => saveSheet();
  w.appendChild(sv);
}


/* ---------- save & move devices ---------- */
const b64u = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const bin = atob(str); return Uint8Array.from(bin, c => c.charCodeAt(0)); };
const pipeBytes = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
async function makeSave() {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, at: Date.now(), S }));
  if (typeof CompressionStream !== 'undefined') { try { return 'BECKI1:z:' + b64u(await pipeBytes(bytes, new CompressionStream('deflate-raw'))); } catch {} }
  return 'BECKI1:p:' + b64u(bytes);
}
async function readSave(code) {
  code = String(code || '').trim(); const m = code.match(/^BECKI1:([zp]):([A-Za-z0-9_-]+)$/);
  if (!m) throw new Error("That doesn't look like a save code. It should start with BECKI1:");
  let bytes = unb64u(m[2]);
  if (m[1] === 'z') { if (typeof DecompressionStream === 'undefined') throw new Error("This browser can't open compressed saves. Try Chrome or Safari."); bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw')); }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || !data.S || typeof data.S.done !== 'object') throw new Error('That save looks broken.');
  return data;
}
async function autoBackup(why) {
  try {
    const code = await makeSave(), sum = saveSummary(S), day = new Date().toISOString().slice(0, 10);
    discord(`💾 Auto-backup${why ? ` (${why})` : ''}: ${sum.n}/${scored().length} done · pot ${money(sum.pot)}`, new File([code], `becki-save-${day}.txt`, { type: 'text/plain' }));
    S.lastBackup = Date.now(); save();
  } catch {}
}
const saveSummary = st => { const ids = Object.keys(st.done || {}); const pot = scored().reduce((x, t) => x + (st.done?.[t.id] ? Math.floor((t.amount || 0) * st.done[t.id].frac * 2) / 2 : 0), 0); return { n: ids.filter(id => scored().some(t => t.id === id)).length, pot }; };
function saveSheet() {
  const sh = h(`<div class="sheet"><div class="wrap"><div class="sheethead"><button class="back">←</button><span class="pill">💾 Save &amp; move devices</span></div>
    <div class="card"><b>1. Export from this device</b><p class="small muted" style="margin:6px 0 12px;line-height:1.5">Makes a save code with everything: challenges done, your pot, coupons, answers and your trip plan. A backup copy goes to ${esc(C.from)} too.</p>
      <button class="btn block" data-a="make">Make my save code</button><div data-out style="margin-top:10px"></div></div>
    <div class="card" style="margin-top:12px"><b>2. Import on the new device</b><p class="small muted" style="margin:6px 0 10px;line-height:1.5">Paste the code, or choose the save file.</p>
      <textarea class="field" data-in placeholder="BECKI1:…" style="min-height:90px;font-size:14px"></textarea>
      <div class="row" style="margin-top:10px"><label class="btn ghost" style="flex:1">📄 Choose file<input type="file" accept=".txt,text/plain" hidden data-file></label><button class="btn" data-a="imp" style="flex:1">Import</button></div>
      <div data-msg class="small" style="margin-top:8px"></div></div></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  const close = () => { sh.remove(); document.body.style.overflow = ''; render(); };
  sh.querySelector('.back').onclick = close;
  const out = sh.querySelector('[data-out]'), msg = sh.querySelector('[data-msg]'), ta = sh.querySelector('[data-in]');
  sh.querySelector('[data-a=make]').onclick = async () => {
    const code = await makeSave(), day = new Date().toISOString().slice(0, 10), name = `becki-save-${day}.txt`, sum = saveSummary(S);
    out.innerHTML = `<textarea class="field" readonly style="min-height:80px;font-size:12px">${esc(code)}</textarea><div class="row" style="margin-top:8px"><button class="btn ghost" data-a="copy" style="flex:1">📋 Copy code</button><button class="btn ghost" data-a="dl" style="flex:1">⬇️ Download</button></div>`;
    const box = out.querySelector('textarea');
    out.querySelector('[data-a=copy]').onclick = async e => { try { await navigator.clipboard.writeText(code); e.target.textContent = '✅ Copied!'; } catch { box.focus(); box.select(); e.target.textContent = 'Selected: press Copy'; } };
    out.querySelector('[data-a=dl]').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); l.download = name; l.click(); };
    discord(`💾 **${C.name}** saved her progress: ${sum.n}/${scored().length} done, pot ${money(sum.pot)}`, new File([code], name, { type: 'text/plain' }));
    S.lastBackup = Date.now(); save(); buzz(15);
  };
  sh.querySelector('[data-file]').onchange = async e => { const f = e.target.files[0]; if (f) { ta.value = (await f.text()).trim(); msg.textContent = `Loaded ${f.name}. Tap Import.`; } };
  sh.querySelector('[data-a=imp]').onclick = async () => {
    try {
      const data = await readSave(ta.value), sum = saveSummary(data.S);
      if (!confirm(`This will replace progress on this device with ${sum.n} done / ${money(sum.pot)}. Continue?`)) return;
      Object.keys(S).forEach(k => delete S[k]); Object.assign(S, data.S); S.done ||= {}; S.prizes ||= []; S.prefs ||= {}; S.plan ||= {}; save();
      msg.innerHTML = '<span style="color:var(--sage-3);font-weight:700">✅ Imported! Welcome back.</span>'; buzz([20, 40, 20]); setTimeout(close, 700);
    } catch (err) { msg.innerHTML = `<span style="color:var(--red);font-weight:600">${esc(err.message || 'Could not import that.')}</span>`; shake(ta); }
  };
}


/* ---------- finale ---------- */
function renderFinale(w) {
  header(w);
  if (!potOpen()) {
    const left = scored().length - doneCount();
    bigJar(w);
    const c = h(`<div class="card lockcard"><div class="big">🍯</div><h2 style="margin-top:8px">${doneCount() ? 'Ready to plan?' : 'Your pot is empty… for now'}</h2>${doneCount() ? '' : `<p class="muted" style="line-height:1.5">Do a few challenges first. Every one you finish adds money to your holiday pot. Then come back here to plan the trip. ✈️</p>`}<div style="${doneCount() ? '' : 'display:none'}"><p class="muted" style="line-height:1.5">You've done <b>${doneCount()}</b> of <b>${scored().length}</b> challenges. You've won <b>${money(earned())}</b> so far. Keep going to fill it up, or cash out now and plan a trip with what you've won.</p><p class="small muted">If your trip ends up costing more than your pot, you can always come back and do more challenges to top it up.</p><button class="btn block" data-a="cash" style="margin-top:8px" ${doneCount() ? '' : 'disabled'}>Cash out ${money(earned())} and plan the trip</button></div></div>`);
    w.appendChild(c);
    c.querySelector('[data-a=cash]').onclick = () => { if (!confirm(`Cash out with ${money(earned())} and start planning? You can still do the other ${left} challenges later to add more.`)) return; S.cashed = Date.now(); S.revealed = true; setTimeout(() => autoBackup('cashed out'), 50); S.locked = true; save(); discord(`💰 **${C.name}** cashed out early with ${doneCount()}/${scored().length} done: **${money(earned())}**`); render(); };
    return;
  }
  const total = earned();
  lockBanner(w);
  w.appendChild(h(`<div class="dayhead"><h2>${S.submitted ? 'Your trip 💚' : 'Time to plan 🎉'}</h2>${finaleOpen() ? '<p>Every single challenge done. Legend.</p>' : ''}</div>`));
  const rv = h(`<button class="rev ${S.revealed ? '' : 'sealed'}" style="padding:26px 20px"><span class="ic">🍯</span><div><b class="serif" style="font-size:20px">Your holiday pot</b><div class="small muted">Flights, stay and one big activity</div></div><span class="amt">${S.revealed ? money(total) : 'Tap to open'}</span></button>`);
  w.appendChild(rv);
  if (!S.revealed) {
    rv.onclick = () => { S.revealed = true; save(); buzz([20, 40, 60]); rv.classList.remove('sealed'); const a = rv.querySelector('.amt'); const t0 = performance.now(); const run = now => { const k = Math.min(1, (now - t0) / 2400); a.textContent = money(total * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(run); else { a.textContent = money(total); confetti(220); discord(`🎉 **${C.name}** opened the pot: **${money(total)}**`); setTimeout(render, 1200); } }; requestAnimationFrame(run); };
    return;
  }
  if (S.submitted && !S.editing) return boardingPass(w, total);
  planner(w, total);
}


/* letter: paragraphs, a heading for lines ending in ":", emoji-led lines as a neat list */
function letterHtml(txt) {
  const out = []; let list = [];
  const flush = () => { if (list.length) { out.push(`<ul class="lrules">${list.map(([e, t]) => `<li><span class="le">${e}</span><span>${esc(t)}</span></li>`).join('')}</ul>`); list = []; } };
  txt.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(line => {
    const m = line.match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u);
    if (m) { list.push([m[1], m[2]]); return; }
    flush();
    if (/:$/.test(line)) out.push(`<h3 class="lhead">${esc(line.replace(/:$/, ''))}</h3>`);
    else out.push(`<p>${esc(line)}</p>`);
  });
  flush();
  return out.join('');
}


/* ---------- intro ---------- */
function intro() {
  const el = h(`<div class="intro"><div class="small" style="font-weight:700;letter-spacing:.1em;color:var(--sage-3)">A LITTLE SOMETHING FOR</div><h1 style="font-size:44px;margin-top:6px">${esc(C.name)} <span style="font-size:36px">🌿</span></h1><div class="envelope"><div class="body"></div><div class="flap"></div><div class="seal">💚</div><div class="to">Open me</div></div><p class="muted small">Tap the envelope</p></div>`);
  document.body.appendChild(el);
  el.querySelector('.envelope').onclick = function () {
    this.classList.add('open'); buzz([20, 40, 20]);
    const showLetter = () => {
      el.scrollTop = 0;
      el.innerHTML = `<div class="letter"><h1>Happy birthday, <span style="white-space:nowrap"><em>${esc(C.name)}</em> 🎂</span></h1>${letterHtml(C.intro)}<p class="sig">${esc(C.signoff || ('Love, ' + C.from + ' x'))}</p><button class="btn block" style="margin-top:6px">Let the games begin 🌿</button></div>`;
      confetti(200);
      el.querySelector('.btn').onclick = () => { S.opened = Date.now(); save(); el.remove(); discord(`💌 **${C.name}** just opened her birthday quest!`); render(); };
    };
    setTimeout(() => {
      if (!C.card) return showLetter();
      el.innerHTML = `<div class="letter card-note"><div class="small" style="font-weight:700;letter-spacing:.1em;color:var(--sage-3)">BEFORE ANYTHING ELSE…</div><h1>For you, <span style="white-space:nowrap"><em>${esc(C.name)}</em> 💚</span></h1>${letterHtml(C.card)}<p class="sig">${esc(C.signoff || ('Love, ' + C.from + ' x'))}</p><button class="btn block" style="margin-top:6px">Keep reading →</button></div>`;
      el.querySelector('.btn').onclick = () => { buzz(10); showLetter(); };
    }, 650);
  };
}

let lastTouch = 0; addEventListener('pointerdown', () => { lastTouch = Date.now(); }, true);
addEventListener('focusin', e => { if (Date.now() - lastTouch > 800) return; const el = e.target; if (el && el.matches && el.matches('input:not([type=file]):not([type=checkbox]),textarea') && el.closest('.sheet,.wiz,.plan')) setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {} }, 320); });
