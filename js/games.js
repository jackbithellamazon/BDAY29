/* Becki's Birthday Getaway: games. Public engine code only; all content, answers and keys live privately in Supabase. */
/* ---------- challenge types ---------- */
function gAnswer(t, g, done) {
  let cutTot = 0, used = 0, wrong = 0;
  const tries = t.tries || 1;
  const right = t.need ? t.need.map(n => n[0]).join(' + ') : (t.answers[0] || '');
  const nice = s => s.charAt(0).toUpperCase() + s.slice(1);
  g.innerHTML = `${qCard(t.q, t.image, t.video)}<input class="field" style="margin-top:16px" placeholder="Your answer…" autocomplete="off"><div class="after"></div><div class="row" style="margin-top:12px">${(t.hints || []).length ? `<button class="btn ghost" data-a="hint" style="flex:1">💡 Hint (${t.hints.length})</button>` : ''}<button class="btn" data-a="go" style="flex:1">Answer</button></div><p class="gonote" data-t>${tries === 1 ? 'One go only, so make it count!' + ((t.hints || []).length ? ' Hints help, but cost a little.' : '') + '' : `${tries} goes`}</p>`;
  const inp = g.querySelector('input'), after = g.querySelector('.after'); inp.focus();
  const go = () => {
    const v = inp.value.trim(); if (!v) return;
    if (t.need ? hasAll(v, t.need) : matches(v, t.answers)) { buzz(12); return done(Math.max(.35, 1 - cutTot), { text: `Answer: "${v}"${used ? ` (${used} hint${used > 1 ? 's' : ''})` : ''}`, msg: t.fun || undefined }); }
    const sp = (t.special || []).find(s => s.answers.some(x => squash(x) === squash(v)));
    if (sp && sp.count === false) { after.innerHTML = `<div class="fun">${esc(sp.msg)}</div>`; inp.value = ''; inp.focus(); return; }
    wrong++; shake(inp);
    const left = tries - wrong;
    if (left <= 0) return done(0, { wrong: true, text: `Wrong: "${v}" (answer: ${right})`, msg: `${sp ? sp.msg + ' ' : ''}Not this time! The answer was: ${nice(right)}.`, note: `You said "${v}". The answer was ${right}.` });
    const tt = g.querySelector('[data-t]'); if (tt) tt.textContent = `${left} ${left === 1 ? 'go' : 'goes'} left`;
    after.innerHTML = `<div class="fun">${sp ? esc(sp.msg) : '❌ Not quite.'} ${left} ${left === 1 ? 'go' : 'goes'} left${(t.hints || []).length > used ? ', or grab a hint' : ''}!</div>`;
    inp.value = ''; inp.focus();
  };
  g.querySelector('[data-a=go]').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  const hb = g.querySelector('[data-a=hint]');
  if (hb) hb.onclick = () => { if (used >= t.hints.length) return; after.innerHTML = `<div class="fun">💡 ${esc(t.hints[used])}</div>`; used++; cutTot += hintCut(); hb.textContent = `💡 Hint (${t.hints.length - used})`; if (used >= t.hints.length) hb.disabled = true; };
}

function gQuiz(t, g, done) {
  const qs = t.questions.map(q => { const o = shuffle(q.options.map((_, i) => i)); return { ...q, options: o.map(i => q.options[i]), answer: o.indexOf(q.answer) }; });
  let i = 0, score = 0;
  const step = () => {
    if (i >= qs.length) { g.innerHTML = `<div class="card center"><div class="countdown">${score} / ${qs.length}</div><p class="muted">${score === qs.length ? 'Flawless!' : score >= qs.length / 2 ? 'Solid!' : 'Tough round!'}</p><button class="btn block">Bank it</button></div>`; g.querySelector('.btn').onclick = () => done(score / qs.length, { wrong: score < qs.length, text: `Score ${score}/${qs.length}` }); return; }
    const q = qs[i];
    g.innerHTML = `<div class="prog"><i style="width:${i / qs.length * 100}%"></i></div><div class="small muted" style="font-weight:600">Question ${i + 1} of ${qs.length}</div><div class="q">${esc(q.q)}</div><div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="after"></div>`;
    g.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = +b.dataset.k === q.answer; if (ok) score++;
      g.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.answer) x.classList.add('right'); }); if (!ok) b.classList.add('wrong'); buzz(ok ? 12 : [30, 30, 30]);
      g.querySelector('.after').innerHTML = `<div class="fun">${ok ? '✅ ' : '❌ '}${esc(q.fun || (ok ? 'Correct!' : 'Not quite!'))}</div><button class="btn block" style="margin-top:12px">${i + 1 < qs.length ? 'Next' : 'See score'}</button>`;
      g.querySelector('.after .btn').onclick = () => { i++; step(); };
    });
  };
  step();
}

function gSearch(t, g, done) {
  const W = t.word.toUpperCase(), N = t.size || 9, dirs = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
  const count = grid => { let c = 0; for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) for (const [dr, dq] of dirs) { let ok = true; for (let k = 0; k < W.length; k++) { const rr = r + dr * k, qq = q + dq * k; if (rr < 0 || qq < 0 || rr >= N || qq >= N || grid[rr][qq] !== W[k]) { ok = false; break; } } if (ok) c++; } return c; };
  let grid, start, dir;
  for (let attempt = 0; attempt < 500; attempt++) {
    const pool = 'ABCDEFGHIJKLMNOPRSTUVWY' + 'PETALPETAL';                       // extra P/E/T/A/L = sneaky decoys
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => pool[Math.floor(Math.random() * pool.length)]));
    dir = dirs[Math.floor(Math.random() * dirs.length)];
    const rs = [], qs = []; for (let i = 0; i < N; i++) { const e1 = i + dir[0] * (W.length - 1), e2 = i + dir[1] * (W.length - 1); if (e1 >= 0 && e1 < N) rs.push(i); if (e2 >= 0 && e2 < N) qs.push(i); }
    start = [rs[Math.floor(Math.random() * rs.length)], qs[Math.floor(Math.random() * qs.length)]];
    for (let k = 0; k < W.length; k++) grid[start[0] + dir[0] * k][start[1] + dir[1] * k] = W[k];
    if (count(grid) === 1) break;
  }
  const end = [start[0] + dir[0] * (W.length - 1), start[1] + dir[1] * (W.length - 1)];
  let first = null, hinted = false, misses = 0, hc = 0;
  g.innerHTML = `<div class="wsgrid" style="grid-template-columns:repeat(${N},1fr)">${grid.map((row, r) => row.map((ch, q) => `<button class="wsc" data-r="${r}" data-q="${q}">${ch}</button>`).join('')).join('')}</div><p class="small muted center" data-msg style="margin:12px 0 0">Tap the first letter of the word…</p><button class="btn ghost block" data-a="hint" style="margin-top:10px">💡 Hint (costs a little)</button>`;
  const msg = g.querySelector('[data-msg]'), cell = (r, q) => g.querySelector(`.wsc[data-r="${r}"][data-q="${q}"]`);
  g.querySelector('[data-a=hint]').onclick = e => { hinted = true; hc = hintCut(.15, .35); cell(...start).classList.add('hint'); e.target.remove(); msg.textContent = 'It starts on the glowing letter…'; };
  g.querySelectorAll('.wsc').forEach(b => b.onclick = () => {
    const rc = [+b.dataset.r, +b.dataset.q]; buzz(6);
    if (!first) { first = rc; b.classList.add('sel'); msg.textContent = 'Now tap the last letter…'; return; }
    const same = (a, c) => a[0] === c[0] && a[1] === c[1];
    if (same(first, rc)) { b.classList.remove('sel'); first = null; msg.textContent = 'Tap the first letter of the word…'; return; }
    if ((same(first, start) && same(rc, end)) || (same(first, end) && same(rc, start))) {
      for (let k = 0; k < W.length; k++) cell(start[0] + dir[0] * k, start[1] + dir[1] * k).classList.add('found');
      g.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); confetti(90); buzz([20, 40, 20]); msg.textContent = `${W}! 🌸`;
      setTimeout(() => done(Math.max(.4, 1 - hc - misses * .05), { text: `🔍 Found ${W}${hinted ? ' (with hint)' : ''}` }), 900);
    } else { misses++; shake(g.querySelector('.wsgrid')); g.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); first = null; msg.textContent = 'Not that one! Tap the first letter again…'; }
  });
}

function gWordle(t, g, done) {
  const W = t.word.toUpperCase(), rows = [], max = 6; let cur = '';
  const score = guess => { const res = Array(5).fill('b'), pool = W.split(''); guess.split('').forEach((c, i) => { if (c === W[i]) { res[i] = 'g'; pool[i] = null; } }); guess.split('').forEach((c, i) => { if (res[i] !== 'g') { const k = pool.indexOf(c); if (k > -1) { res[i] = 'y'; pool[k] = null; } } }); return res; };
  const keyState = {};
  const draw = () => {
    g.innerHTML = `<div class="wgrid">${Array.from({ length: max }, (_, r) => { const word = rows[r] || (r === rows.length ? cur.padEnd(5) : '     '); const sc = rows[r] ? score(rows[r]) : null; return `<div class="wrow">${word.split('').map((c, i) => `<div class="wcell ${sc ? sc[i] : c.trim() ? 'typed' : ''}">${c.trim()}</div>`).join('')}</div>`; }).join('')}</div>
      <div class="wkeys">${['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'].map(r => `<div class="wkrow">${[...r].map(k => `<button class="wk ${keyState[k] || ''} ${'⏎⌫'.includes(k) ? 'wide' : ''}" data-k="${k}">${k === '⏎' ? 'ENTER' : k}</button>`).join('')}</div>`).join('')}</div><div class="after"></div>`;
    g.querySelectorAll('.wk').forEach(b => b.onclick = () => press(b.dataset.k));
  };
  const press = k => {
    if (rows.length >= max || rows.includes(W)) return;
    if (k === '⌫') cur = cur.slice(0, -1);
    else if (k === '⏎') { if (cur.length < 5) { shake(g.querySelector('.wgrid')); return; } rows.push(cur); score(cur).forEach((s, i) => { const c = cur[i], rank = { g: 3, y: 2, b: 1 }; if (!keyState[c] || rank[s] > rank[keyState[c][0]]) keyState[c] = s === 'g' ? 'g' : s === 'y' ? 'y' : 'bk'; }); cur = ''; buzz(10);
      if (rows[rows.length - 1] === W) { draw(); confetti(80); const frac = [1, 1, .9, .8, .7, .6][rows.length - 1]; setTimeout(() => done(frac, { text: `🟩 Got ${W} in ${rows.length}/6`, msg: `${W}! Got it in ${rows.length}. 🌸` }), 900); return; }
      if (rows.length >= max) { draw(); setTimeout(() => done(0, { wrong: true, text: `🟩 Missed the word (${W})`, msg: `The word was ${W}. 🌸` }), 700); return; } }
    else if (cur.length < 5 && /^[A-Z]$/.test(k)) cur += k;
    draw();
  };
  draw();
  const kd = e => { if (!document.body.contains(g)) return removeEventListener('keydown', kd); if (e.key === 'Enter') press('⏎'); else if (e.key === 'Backspace') press('⌫'); else if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase()); };
  addEventListener('keydown', kd);
}

function gMissing(t, g, done) {
  const rounds = 3, used = new Set(); let round = 0, score = 0;
  const start = async () => {
    if (round >= rounds) { g.innerHTML = `<div class="card center"><div class="countdown">${score} / ${rounds}</div><p class="muted">${score === rounds ? 'Memory of an elephant!' : 'Good effort!'}</p><button class="btn block">Bank it</button></div>`; g.querySelector('.btn').onclick = () => done(score / rounds, { wrong: score < rounds, text: `🧠 What's Missing: ${score}/${rounds}` }); return; }
    const items = shuffle(t.items); let gone; do { gone = Math.floor(Math.random() * items.length); } while (used.has(items[gone].l)); used.add(items[gone].l);
    const grid = hide => `<div class="mgrid">${items.map((it, i) => `<div class="mitem ${hide && i === gone ? 'gone' : ''}">${hide && i === gone ? '❓' : it.e}<span>${hide && i === gone ? '' : esc(it.l)}</span></div>`).join('')}</div>`;
    for (let s = 10; s > 0; s--) { g.innerHTML = `<div class="small muted center" style="font-weight:700">ROUND ${round + 1} OF ${rounds} · MEMORISE!</div><div class="countdown center">${s}</div>${grid(false)}`; await sleep(1000); if (!document.body.contains(g)) return; }
    g.innerHTML = `<div class="small muted center" style="font-weight:700">ROUND ${round + 1} OF ${rounds} · WHAT'S GONE?</div>${grid(true)}<input class="field" style="margin-top:12px" placeholder="What's missing?" autocomplete="off"><button class="btn block" style="margin-top:10px">Answer</button><div class="after"></div>`;
    const inp = g.querySelector('input'); inp.focus();
    const go = () => { if (!inp.value.trim()) return; const ok = matches(inp.value, items[gone].a); if (ok) score++; buzz(ok ? 12 : [30, 30, 30]); g.querySelector('.after').innerHTML = `<div class="fun">${ok ? '✅ Yes!' : '❌ It was the'} ${esc(items[gone].e + ' ' + items[gone].l)}</div><button class="btn block" style="margin-top:10px">${round + 1 < rounds ? 'Next round' : 'See score'}</button>`; inp.disabled = true; g.querySelector('.btn').remove(); g.querySelector('.after .btn').onclick = () => { round++; start(); }; };
    g.querySelector('.btn').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  };
  g.innerHTML = `<div class="card center"><p class="muted" style="margin:0 0 12px">You get 10 seconds to memorise 10 things. Ready?</p><button class="btn block">Go!</button></div>`;
  g.querySelector('.btn').onclick = () => start();
}

function gScramble(t, g, done) {
  let i = 0, score = 0;
  const step = () => {
    if (i >= t.words.length) { g.innerHTML = `<div class="card center"><div class="countdown">${score} / ${t.words.length}</div><button class="btn block">Bank it</button></div>`; g.querySelector('.btn').onclick = () => done(score / t.words.length, { wrong: score < t.words.length, text: `🔀 Unscrambled ${score}/${t.words.length}` }); return; }
    const w = t.words[i], A = w.answer.toUpperCase().split(''), dec = (t.decoys || 0) ? Array.from({ length: t.decoys }, () => 'BCDGHKMNRSTUVY'[Math.floor(Math.random() * 14)]) : [], L = [...A, ...dec]; let order; do { order = shuffle(L.map((_, k) => k)); } while (order.every((v, k) => L[v] === L[k])); let picked = [], hinted = false;
    const draw = () => {
      g.innerHTML = `<div class="prog"><i style="width:${i / t.words.length * 100}%"></i></div><div class="small muted center" style="font-weight:600">${i + 1} of ${t.words.length}</div><div class="slots" style="margin:18px 0 6px">${A.map((_, k) => `<div class="slot">${picked[k] != null ? L[picked[k]] : ''}</div>`).join('')}</div><div class="tiles">${order.map(k => `<button class="tile ${picked.includes(k) ? 'used' : ''}" data-k="${k}">${L[k]}</button>`).join('')}</div>${hinted ? `<div class="fun">💡 ${esc(w.hint)}</div>` : ''}<div class="row" style="margin-top:12px"><button class="btn ghost" data-a="undo" style="flex:1">⌫</button><button class="btn ghost" data-a="hint" style="flex:1" ${hinted ? 'disabled' : ''}>💡 Hint</button><button class="btn ghost" data-a="skip" style="flex:1">Skip</button></div>`;
      g.querySelectorAll('.tile').forEach(b => b.onclick = () => { picked.push(+b.dataset.k); buzz(6); if (picked.length === A.length) { if (picked.map(k => L[k]).join('') === A.join('')) { score += hinted ? 1 - hintCut(.25, .5) : 1; buzz(15); g.querySelector('.slots').classList.add('win'); setTimeout(() => { i++; step(); }, 600); draw(); } else { draw(); shake(g.querySelector('.slots')); setTimeout(() => { picked = []; draw(); }, 600); } } else draw(); });
      g.querySelector('[data-a=undo]').onclick = () => { picked.pop(); draw(); };
      g.querySelector('[data-a=hint]').onclick = () => { hinted = true; draw(); };
      g.querySelector('[data-a=skip]').onclick = () => { i++; step(); };
    };
    draw();
  };
  step();
}

function gTap(t, g, done) {
  g.innerHTML = `<div class="card center"><p class="muted" style="margin:0 0 12px">Tap ${t.target} leaves in ${t.secs} seconds. Ready?</p><button class="btn block">Start!</button></div>`;
  g.querySelector('.btn').onclick = () => {
    let hits = 0, left = t.secs, over = false;
    g.innerHTML = `<div class="row" style="justify-content:space-between;font-weight:700"><span>🍃 <span id="th">0</span> / ${t.target}</span><span>⏱ <span id="tl">${left}</span>s</span></div><div class="tapzone"></div>`;
    const zone = g.querySelector('.tapzone');
    const spawn = () => { if (over) return; const b = h(`<button class="leaf">🍃</button>`); const r = zone.getBoundingClientRect(); b.style.left = Math.random() * (r.width - 56) + 'px'; b.style.top = Math.random() * (r.height - 56) + 'px'; b.onclick = () => { hits++; buzz(8); b.classList.add('pop'); setTimeout(() => b.remove(), 150); g.querySelector('#th').textContent = hits; if (hits >= t.target) end(); }; zone.appendChild(b); setTimeout(() => b.remove(), 1300); };
    const iv = setInterval(spawn, 420), tick = setInterval(() => { left--; const el = g.querySelector('#tl'); if (el) el.textContent = left; if (left <= 0) end(); }, 1000);
    const end = () => { if (over) return; over = true; clearInterval(iv); clearInterval(tick); const frac = Math.min(1, hits / t.target); setTimeout(() => done(frac, { text: `🍃 Caught ${hits}/${t.target} leaves`, msg: hits >= t.target ? 'Lightning fingers! ⚡' : `You caught ${hits}!` }), 300); };
    spawn();
  };
}

function gMulti(t, g, done) {
  const order = shuffle(t.options.map((_, i) => i)), picked = new Set();
  g.innerHTML = `${qCard(t.q, t.image, t.video)}<div class="opts" style="margin-top:14px">${order.map(i => `<button class="opt" data-k="${i}">${esc(t.options[i])}</button>`).join('')}</div><button class="btn block" data-a="go" style="margin-top:12px" disabled>Pick ${t.pick}</button><div class="after"></div>`;
  const go = g.querySelector('[data-a=go]');
  g.querySelectorAll('.opt').forEach(b => b.onclick = () => { const k = +b.dataset.k; if (picked.has(k)) { picked.delete(k); b.classList.remove('picked'); } else if (picked.size < t.pick) { picked.add(k); b.classList.add('picked'); } buzz(6); go.disabled = picked.size !== t.pick; go.textContent = picked.size === t.pick ? 'Lock it in' : `Pick ${t.pick - picked.size} more`; });
  go.onclick = () => {
    const right = [...picked].filter(k => t.answers.includes(k)).length, ok = right === t.pick;
    g.querySelectorAll('.opt').forEach(x => { x.disabled = true; const k = +x.dataset.k; if (t.answers.includes(k)) x.classList.add('right'); else if (picked.has(k)) x.classList.add('wrong'); });
    go.remove(); buzz(ok ? 12 : [30, 30, 30]);
    g.querySelector('.after').innerHTML = `<div class="fun">${ok ? '✅ ' : '❌ '}${esc(t.fun || '')}</div><button class="btn block" style="margin-top:12px">Continue</button>`;
    g.querySelector('.after .btn').onclick = () => done(ok ? 1 : 0, { wrong: !ok, text: `Picked: ${[...picked].map(k => t.options[k]).join(', ')}` });
  };
}

function gChoice(t, g, done) {
  const order = shuffle(t.options.map((_, i) => i));
  let hinted = false, hc = 0;
  g.innerHTML = `${qCard(t.q, t.image, t.video)}<div class="opts" style="margin-top:14px">${order.map(i => `<button class="opt" data-k="${i}">${esc(t.options[i])}</button>`).join('')}</div>${t.hint ? '<button class="btn ghost block" data-a="hint" style="margin-top:10px">💡 Hint (costs a little)</button>' : ''}<div class="after"></div>`;
  const hb = g.querySelector('[data-a=hint]'); if (hb) hb.onclick = () => { hinted = true; hc = hintCut(.15, .35); hb.outerHTML = `<div class="fun">💡 ${esc(t.hint)}</div>`; };
  g.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const ok = +b.dataset.k === t.answer;
    g.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === t.answer) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    buzz(ok ? 12 : [30, 30, 30]);
    g.querySelector('.after').innerHTML = `<div class="fun">${ok ? '✅ ' : '❌ '}${esc(t.fun || (ok ? 'Correct!' : 'Not this time!'))}</div><button class="btn block" style="margin-top:12px">Continue</button>`;
    g.querySelector('.after .btn').onclick = () => done(ok ? 1 - hc : 0, { wrong: !ok, text: `Picked "${t.options[+b.dataset.k]}"${hinted ? ' (used hint)' : ''}`, note: `You picked ${t.options[+b.dataset.k]}.` });
  });
}

function gOpen(t, g, done) {
  if (t.picks) return gPicks(t, g, done);
  if (t.fields) {
    const prev = S.prefs[t.id]?.parts || [];
    g.innerHTML = `${qCard(t.q, t.image, t.video)}<div style="display:grid;gap:10px;margin-top:14px">${t.fields.map((f, i) => `<div><label class="small" style="font-weight:600;display:block;margin-bottom:6px">${esc(f)}</label><textarea class="field" style="min-height:${i ? 90 : 60}px">${esc(prev[i] || '')}</textarea></div>`).join('')}</div><button class="btn block" style="margin-top:12px" disabled>Save my answer</button><button class="btn ghost block" data-a="skip" style="margin-top:8px">Skip this one</button>`;
    const tas = [...g.querySelectorAll('textarea')], b = g.querySelector('.btn');
    const upd = () => b.disabled = !tas[0].value.trim(); upd(); tas.forEach(x => x.oninput = upd);
    b.onclick = () => { const parts = tas.map(x => x.value.trim()); done(1, { raw: t.fields.map((f, i) => `${f} ${parts[i] || '–'}`).join('\n'), parts, msg: 'Saved for Jack. Thank you! 💚' }); };
    g.querySelector('[data-a=skip]').onclick = () => done(0, { skipped: true });
    return;
  }
  const min = t.minChars || 2, prev = S.prefs[t.id];
  g.innerHTML = `${qCard(t.q, t.image, t.video)}${t.choices ? `<div class="chips">${t.choices.map(c => `<button class="chip">${esc(c)}</button>`).join('')}</div>` : ''}<textarea class="field" style="margin-top:14px" placeholder="${t.choices ? 'Tap one, or write your own (add details!)…' : 'Write away…'}"></textarea><button class="btn block" style="margin-top:10px" disabled>${t.pref ? 'Save my answer' : `Send it to ${esc(C.from)}`}</button>${t.pref ? '<button class="btn ghost block" data-a="skip" style="margin-top:8px">Skip this one</button>' : ''}`;
  const ta = g.querySelector('textarea'), b = g.querySelector('.btn');
  if (prev && !prev.skipped) ta.value = prev.answer;
  const upd = () => b.disabled = ta.value.trim().length < min; upd();
  ta.oninput = upd;
  g.querySelectorAll('.chip').forEach(c => c.onclick = () => { c.classList.toggle('on'); const picked = [...g.querySelectorAll('.chip.on')].map(x => x.textContent); const extra = ta.value.split('\n').filter(l => !t.choices.includes(l.replace(/^• /, ''))).join('\n').trim(); ta.value = picked.map(p => '• ' + p).join('\n') + (extra ? '\n' + extra : ''); upd(); });
  b.onclick = () => done(1, { raw: ta.value.trim(), text: `📝 ${t.q}\n> ${ta.value.trim().replace(/\n/g, '\n> ')}`, msg: t.reveal || (t.pref ? 'Saved for Jack. Thank you! 🎂' : undefined) });
  const sk = g.querySelector('[data-a=skip]'); if (sk) sk.onclick = () => done(0, { skipped: true });
}

// photo + big pick buttons, any pick wins (Head or Cup?)
function gPicks(t, g, done) {
  g.innerHTML = `${t.image ? `<img class="pickimg" alt="" src="${esc(t.image)}">` : ''}<div class="q center" style="margin:12px 0 14px">${esc(t.q)}</div>
    <div class="pickbig">${t.picks.filter(p => !p.small).map((p, i) => `<button class="pickb" data-i="${t.picks.indexOf(p)}"><span>${p.e}</span>${esc(p.l)}</button>`).join('')}</div>
    ${t.picks.filter(p => p.small).map(p => `<button class="btn ghost block sm" style="margin-top:10px" data-i="${t.picks.indexOf(p)}">${esc(p.l)} ${p.e}</button>`).join('')}<div class="after"></div>`;
  const im = g.querySelector('.pickimg'); if (im) im.onerror = () => im.remove();
  g.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    const p = t.picks[+b.dataset.i]; g.querySelectorAll('[data-i]').forEach(x => { x.disabled = true; x.classList.toggle('pick', x === b); }); buzz([20, 40, 20]); confetti(60);
    g.querySelector('.after').innerHTML = `<div class="fun" style="text-align:center;margin-top:14px;font-size:17px">${esc(p.line)}</div><button class="btn block" style="margin-top:12px">Bank it</button>`;
    g.querySelector('.after .btn').onclick = () => done(1, { raw: p.l, text: `${t.emoji} ${t.title.replace(/\?$/, '')}: ${C.name} says **${p.l}** ${p.e}`, msg: p.line });
  });
}

function gParcel(t, g, done) {
  const key = dec(t.enc) || { need: [['?']], near: [] };
  const hints = t.hints.filter(x => !/DRAFT/.test(x));
  let tier = 0, misses = 0;
  const draw = () => {
    g.innerHTML = `<div class="card center"><div style="font-size:64px" class="wobble">📦</div><div class="q" style="margin:8px 0 4px">${esc(t.q)}</div><p class="small muted" style="margin:0">Reward available now: <b>${Math.round(t.tiers[tier] * 100)}%</b> of this challenge</p></div>
      <div class="hints">${hints.slice(0, tier).map((x, i) => `<div class="fun">💡 Hint ${i + 1}: ${esc(x)}</div>`).join('')}</div>
      <input class="field" style="margin-top:14px" placeholder="I think it's…" autocomplete="off"><div class="after"></div>
      <div class="row" style="margin-top:12px">${tier < hints.length ? `<button class="btn ghost" data-a="hint" style="flex:1">💡 Hint (−reward)</button>` : ''}<button class="btn" data-a="go" style="flex:1">Guess</button></div>`;
    const inp = g.querySelector('input'), after = g.querySelector('.after');
    const go = () => {
      const v = inp.value.trim(); if (!v) return;
      if (hasAll(v, key.need)) { buzz([30, 60, 30]); return done(t.tiers[tier], { text: `📦 Parcel guess: "${v}" after ${tier} hint(s)`, msg: 'YES! Now you can open it! 🎉', note: 'You guessed it. Enjoy!' }); }
      if (key.near.some(n => squash(v).includes(squash(n)))) { after.innerHTML = `<div class="fun">🔥 ${esc(t.nearMsg)}</div>`; return; }
      misses++; shake(inp); after.innerHTML = `<div class="fun">❌ Nope! ${tier < hints.length ? 'Keep guessing, or take a hint.' : 'Keep guessing!'}</div>`;
      if (tier >= hints.length && misses >= 6) { after.innerHTML += '<button class="btn ghost block" data-a="give" style="margin-top:10px">I give up, can I open it?</button>'; g.querySelector('[data-a=give]').onclick = () => done(.1, { wrong: true, text: `📦 Gave up on the parcel (last guess "${v}")`, msg: 'Go on then, open it! 🎁' }); }
    };
    g.querySelector('[data-a=go]').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    const hb = g.querySelector('[data-a=hint]'); if (hb) hb.onclick = () => { tier++; misses = 0; buzz(10); draw(); };
  };
  draw();
}

function gMemory5(t, g, done) {
  g.innerHTML = `<div class="card center"><p class="muted" style="margin:0 0 12px">Ready? You get 5 seconds.</p><button class="btn block">Show me!</button></div>`;
  g.querySelector('.btn').onclick = async () => {
    for (let s = 5; s > 0; s--) { g.innerHTML = `<div class="card center"><div class="bigemoji" style="font-size:44px">${t.items.join(' ')}</div><div class="countdown">${s}</div></div>`; await sleep(1000); }
    const pool = shuffle(t.pool); const picked = new Set();
    g.innerHTML = `<p class="center muted">Which 5 did you see? Tap them.</p><div class="mem">${pool.map(p => `<button class="pk">${p}</button>`).join('')}</div><button class="btn block" style="margin-top:14px" disabled>Check (0/5)</button>`;
    const b = g.querySelector('.btn');
    g.querySelectorAll('.pk').forEach(x => x.onclick = () => { const v = x.textContent; if (picked.has(v)) { picked.delete(v); x.classList.remove('on'); } else if (picked.size < 5) { picked.add(v); x.classList.add('on'); } buzz(5); b.textContent = `Check (${picked.size}/5)`; b.disabled = picked.size !== 5; });
    b.onclick = () => { const hits = [...picked].filter(p => t.items.includes(p)).length; g.querySelectorAll('.pk').forEach(x => { if (t.items.includes(x.textContent)) x.classList.add('right'); else if (picked.has(x.textContent)) x.classList.add('wrong'); }); b.disabled = true; setTimeout(() => done(hits / 5, { text: `Memory: ${hits}/5` }), 1200); };
  };
}

function gListing(t, g, done) {
  let tries = 0;
  g.innerHTML = `<div class="listing"><div class="lhead"><div class="limg">🌿👩🏼‍🦰🌿</div><div><b class="serif" style="font-size:19px;line-height:1.2;display:block">${esc(t.product)}</b><div class="stars">★★★★★ <span class="small muted">${t.reviews.length} reviews</span></div><div class="lprice">${esc(t.price)}</div><div class="small" style="color:var(--red);font-weight:600">${esc(t.stock)}</div></div></div><ul>${t.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
    <p class="center" style="font-weight:600;margin:16px 0 8px">Tap the FAKE review 👇</p><div class="revs">${t.reviews.map((r, i) => `<button class="rev2" data-i="${i}"><b>${esc(r.by)}</b> <span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span><div>${esc(r.text)}</div><span class="small muted">Verified animal purchase</span></button>`).join('')}</div>`;
  g.querySelectorAll('.rev2').forEach(b => b.onclick = () => {
    const r = t.reviews[+b.dataset.i]; tries++;
    if (r.fake) { b.classList.add('right'); buzz(15); setTimeout(() => done(tries === 1 ? 1 : .5, { wrong: tries > 1, text: `Spotted the fake review in ${tries} tr${tries === 1 ? 'y' : 'ies'}`, msg: `Busted! ${r.by} would NEVER say that.` }), 700); }
    else { b.classList.add('wrong'); b.disabled = true; shake(b); }
  });
}

function gNaughtyNice(t, g, done) {
  g.innerHTML = `<div class="tot"><button class="totc" data-k="nice">${esc(t.nice.label)}<br><span class="small muted" style="font-family:'DM Sans'">smaller reward</span></button><button class="totc" data-k="naughty">${esc(t.naughty.label)}<br><span class="small muted" style="font-family:'DM Sans'">big reward</span></button></div>`;
  g.querySelectorAll('.totc').forEach(b => b.onclick = () => {
    const k = b.dataset.k, o = t[k];
    if (k === 'nice') { g.innerHTML = `${qCard(o.q)}<textarea class="field" style="margin-top:14px"></textarea><button class="btn block" style="margin-top:10px" disabled>Send</button>`; const ta = g.querySelector('textarea'), sb = g.querySelector('.btn'); ta.oninput = () => sb.disabled = ta.value.trim().length < (o.minChars || 3); sb.onclick = () => done(o.frac, { text: `😇 Chose NICE: ${ta.value.trim()}` }); }
    else { g.innerHTML = qCard(o.q); codePad(g, { __codes: { code: codeOf(t, 'naughty') } }, () => done(o.frac, { text: '😈 Chose NAUGHTY, code accepted' })); }
  });
}

function gList(t, g, done0) {
  let cutTot = 0; const done = (f, d) => done0(Math.max(0, f * (1 - cutTot)), d);   // footballer hints cost a random slice
  const found = new Set(); let wrongs = 0; const maxG = t.maxGuesses || 0;
  const draw = () => { g.querySelector('.slots2').innerHTML = t.items.map((it, i) => `<div class="slot2 ${found.has(i) ? 'on' : ''}">${found.has(i) ? '✓ ' + esc(it.label) : '?'}</div>`).join(''); g.querySelector('.cnt').textContent = `${found.size} / ${t.items.length} found` + (maxG ? ` · ${Math.max(0, maxG - wrongs - found.size)} guesses left` : ` · ${t.items.length - found.size} left`); };
  g.innerHTML = `${qCard(t.q, t.image, t.video)}<div class="cnt center" style="font-weight:700;margin:14px 0 8px"></div><div class="slots2"></div><input class="field" style="margin-top:12px" placeholder="Type an item, press Enter…" autocomplete="off"><div class="after"></div><div class="row" style="margin-top:10px">${maxG ? '' : '<button class="btn ghost" data-a="give" style="flex:1">' + (t.partial ? 'I\'m done' : 'I\'m stuck, finish') + '</button>'}<button class="btn" data-a="go" style="flex:1">Add</button></div>${t.items.some(x => x.hint) ? '<button class="btn ghost block" data-a="fhint" style="margin-top:8px">⚽ Footballer hint</button><div class="fhints"></div>' : ''}`;
  const inp = g.querySelector('input'), after = g.querySelector('.after'); draw(); inp.focus();
  const fh = g.querySelector('[data-a=fhint]'), shownH = new Set(); if (fh) fh.onclick = () => { const left = t.items.map((x, i) => i).filter(i => !found.has(i) && !shownH.has(i)); if (!left.length) { fh.disabled = true; fh.textContent = 'No hints left'; return; } const k = left[Math.floor(Math.random() * left.length)]; shownH.add(k); cutTot += hintCut(.03, .08); g.querySelector('.fhints').insertAdjacentHTML('beforeend', `<div class="fun">⚽ ${esc(t.items[k].hint)}</div>`); buzz(6); };
  const go = () => { const v = inp.value.trim(); if (!v) return; let hits = t.items.map((it, i) => [it, i]).filter(([it, i]) => !found.has(i) && matches(v, it.accept, true)); if (!hits.length && !t.items.some(it => matches(v, it.accept, true))) hits = t.items.map((it, i) => [it, i]).filter(([it, i]) => !found.has(i) && matches(v, it.accept)).slice(0, 1); if (hits.length) { hits.forEach(([, i]) => found.add(i)); buzz(12); after.innerHTML = `<div class="fun">✅ ${hits.map(([it]) => esc(it.label)).join(', ')}</div>`; draw(); if (found.size === t.items.length) setTimeout(() => done(1, { text: `🧺 Named all ${t.items.length}!` }), 600); } else { wrongs++; shake(inp); after.innerHTML = `<div class="fun">❌ ${maxG ? 'Nope!' : t.partial ? 'Nope (or you already got that one)!' : 'Not in the hamper (or already found)!'}</div>`; draw(); } inp.value = ''; inp.focus(); if (maxG && found.size < t.items.length && wrongs + found.size >= maxG) setTimeout(() => done(found.size / t.items.length, { wrong: true, text: `Got ${found.size}/${t.items.length} in ${maxG} guesses`, msg: `Out of guesses! It was ${t.items.map(x => x.label).join(' and ')}.` }), 500); };
  g.querySelector('[data-a=go]').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  const gv = g.querySelector('[data-a=give]'); if (gv) gv.onclick = () => { if (t.partial) { if (!confirm(`Finish with ${found.size} of ${t.items.length}?`)) return; return done(found.size / t.items.length, { wrong: found.size < t.items.length, text: `Got ${found.size}/${t.items.length}. Missed: ${t.items.filter((_, i) => !found.has(i)).map(x => x.label).join(', ') || 'none'}`, msg: `You got ${found.size} of ${t.items.length}! Missed: ${t.items.filter((_, i) => !found.has(i)).map(x => x.label).join(', ') || 'none'}` }); } if (!confirm(`Finish with ${found.size} of ${t.items.length}? You need ALL of them to win the money.`)) return; done(0, { wrong: true, text: `🧺 Stopped at ${found.size}/${t.items.length}. Missed: ${t.items.filter((_, i) => !found.has(i)).map(x => x.label).join(', ')}`, msg: `So close! You found ${found.size} of ${t.items.length}.` }); };
}

function gDone(t, g, done) {
  const hunt = t.cat === 'hunt';
  g.innerHTML = qCard(t.q, t.image, t.video) + `<p class="small muted center" style="margin:12px 0 0">${hunt ? '🕵️‍♀️ The code is written on a hidden note. Find it!' : '🚶 Real-world task. When it\'s done, Jack gives you a secret code.'}</p>`;
  codePad(g, t, () => done(1, { text: `✅ Code accepted: ${t.title}` }), hunt ? 'FOUND IT? TYPE THE CODE' : undefined);
  if (t.optional) { const s = h(`<button class="btn ghost block" style="margin-top:10px">Not feeling this one? Swap it</button>`); g.appendChild(s); s.onclick = () => { g.innerHTML = `${qCard('Swap question: tell Jack one of your favourite memories of him.')}<textarea class="field" style="margin-top:14px"></textarea><button class="btn block" style="margin-top:10px" disabled>Send</button>`; const ta = g.querySelector('textarea'), sb = g.querySelector('.btn'); ta.oninput = () => sb.disabled = ta.value.trim().length < 10; sb.onclick = () => done(1, { text: `🔄 Swapped "${t.title}": ${ta.value.trim()}` }); }; }
}
function gPin(t, g, done) {
  g.innerHTML = qCard(t.q, t.image, t.video);
  pinPad(g, null, () => done(1, { text: '✅ Confirmed with Jack\'s PIN' }));
  if (t.optional) { const s = h(`<button class="btn ghost block" style="margin-top:10px">Not feeling this one? Swap it</button>`); g.appendChild(s); s.onclick = () => { g.innerHTML = `${qCard('Swap question: tell Jack one of your favourite memories of him.')}<textarea class="field" style="margin-top:14px"></textarea><button class="btn block" style="margin-top:10px" disabled>Send</button>`; const ta = g.querySelector('textarea'), sb = g.querySelector('.btn'); ta.oninput = () => sb.disabled = ta.value.trim().length < 10; sb.onclick = () => done(1, { text: `🔄 Swapped "${t.title}": ${ta.value.trim()}` }); }; }
}

function gReverse(t, g, done) {
  const n = t.clues || 1;
  g.innerHTML = `${qCard(t.q, t.image, t.video)}<div style="display:grid;gap:8px;margin-top:14px">${Array.from({ length: n }, (_, k) => `<input class="field" placeholder="${esc(t.clueLabel || `Clue ${k + 1}`)}${n > 1 && k > 0 ? ' (optional)' : ''}">`).join('')}</div><button class="btn block" style="margin-top:12px" disabled>Send to Jack</button>`;
  const ins = [...g.querySelectorAll('input')], b = g.querySelector('.btn');
  ins.forEach(i => i.oninput = () => b.disabled = !ins[0].value.trim());
  b.onclick = () => {
    const txt = ins.map(i => i.value.trim()).filter(Boolean);
    discord(`🔄 **${C.name}** has set you a challenge: **${t.title}**\n${txt.map((x, k) => `${n > 1 ? `Clue ${k + 1}: ` : ''}${x}`).join('\n')}`);
    g.innerHTML = `<div class="card center"><div style="font-size:40px">📨</div><p>Sent to Jack! When it's over, hand him your phone to settle it.</p></div>`;
    codePad(g, { __codes: { win: codeOf(t, 'win'), lose: codeOf(t, 'lose') } }, k => { const o = t.outcomes.find(x => x.key === k); done(o.frac, { text: `Result: ${o.label}`, msg: k === 'win' ? 'You WIN! 😈' : 'Jack won this one… but you still earned something!' }); }, 'WHEN IT\'S SETTLED, JACK GIVES YOU A CODE');
  };
}

// Quiz Ladder: questions get harder, each right answer climbs the prize ladder. Cash out any time, or go double-or-nothing on the next one.
function gLadder(t, g, done) {
  const L = t.ladder || [0.5, 1, 2, 3, 5, 8, 12, 16, 20, 25], Q = t.questions.slice(0, L.length), max = L[L.length - 1];
  let i = 0, locked = false;
  const fin = (amt, wrong, why) => done(Math.min(1, amt / (t.amount || max)), { wrong, text: `🪜 ${t.title}: ${why}`, msg: why });
  const ladder = () => `<div class="lad">${L.map((v, k) => `<span class="${k < i ? 'ok' : k === i ? 'now' : ''}">${money(v)}</span>`).reverse().join('')}</div>`;
  const step = () => {
    const q = Q[i], have = i ? L[i - 1] : 0;
    g.innerHTML = `<div class="rbtop"><span>Question ${i + 1} of ${Q.length}</span><b>${have ? money(have) + ' banked so far' : 'Nothing on the line yet'}</b></div>
      <div class="ladwrap">${ladder()}<div class="ladq"><div class="small muted" style="margin-bottom:4px">For ${money(L[i])}${i ? ' (wrong = lose the lot!)' : ''}</div><p class="qtext" style="margin:0 0 10px">${esc(q.q)}</p><div class="ladopts">${q.options.map((o, k) => `<button class="btn ghost block" data-k="${k}">${esc(o)}</button>`).join('')}</div>${i ? `<button class="btn block" data-a="cash" style="margin-top:10px">💰 Cash out ${money(have)}</button>` : ''}</div></div>`;
    g.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      if (locked) return; locked = true; const k = +b.dataset.k, ok = k === q.answer;
      g.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (+x.dataset.k === q.answer) x.classList.add('right'); });
      if (!ok) { b.classList.add('wrongpick'); buzz([40, 30, 40]); return setTimeout(() => fin(0, true, `wrong on question ${i + 1} (${money(L[i])} question), lost ${money(have)} 😈`), 1300); }
      buzz(15); i++;
      if (i >= Q.length) { confetti(200); return setTimeout(() => fin(max, false, `ALL ${Q.length} right! ${money(max)} 🏆`), 900); }
      setTimeout(() => { locked = false; step(); }, 800);
    });
    const c = g.querySelector('[data-a=cash]'); if (c) c.onclick = () => { if (locked) return; if (!confirm(`Cash out with ${money(have)}? The next question was worth ${money(L[i])}.`)) return; locked = true; fin(have, have < max, `cashed out at ${money(have)} after ${i} right`); };
  };
  step();
}
function gRisk(t, g, done) {
  const pool = shuffle(t.pool || []), R = Math.min(t.rounds || 10, pool.length), share = 1 / R; let i = 0, banked = 0, safeN = 0, riskW = 0, riskL = 0;
  // crypto-random order
  for (let k = pool.length - 1; k > 0; k--) { const j = rnd(k + 1); [pool[k], pool[j]] = [pool[j], pool[k]]; }
  const bar = () => `<div class="rbtop"><span>Round ${Math.min(i + 1, R)} of ${R}</span><b>${Math.round(banked / 1 * 100)}% banked</b></div><div class="prog"><i style="width:${banked * 100}%"></i></div>`;
  const round = () => {
    if (i >= R) return done(banked, { wrong: banked < 1, text: `🎲 Risk It: ${riskW} risks won, ${riskL} lost, ${safeN} safe → ${Math.round(banked * 100)}%`, msg: `${riskW} risk${riskW === 1 ? '' : 's'} won, ${safeN} played safe!` });
    const q = pool[i];
    g.innerHTML = `${bar()}<div class="tot" style="margin-top:12px"><button class="totc" data-k="safe">🛟 Play it safe<br><span class="small muted">bank a little</span></button><button class="totc" data-k="risk">🎲 Risk it<br><span class="small muted">answer for the full round</span></button></div>`;
    g.querySelector('[data-k=safe]').onclick = () => { banked += share * .4; safeN++; i++; buzz(8); round(); };
    g.querySelector('[data-k=risk]').onclick = () => {
      g.innerHTML = `${bar()}${qCard(q.q)}<input class="field" style="margin-top:14px" placeholder="One shot…" autocomplete="off"><button class="btn block" style="margin-top:10px">Lock it in</button><div class="after"></div>`;
      const inp = g.querySelector('input'); let over = false;
      const go = () => { if (over || !inp.value.trim()) return; over = true; const ok = matches(inp.value, q.answers); if (ok) { banked += share; riskW++; confetti(40); buzz([20, 40, 20]); } else { riskL++; buzz([40, 30, 40]); }
        g.querySelector('.after').innerHTML = `<div class="fun">${ok ? '✅ Yes! Full round banked.' : `❌ It was ${esc(String(q.answers[0]).replace(/\b\w/g, c => c.toUpperCase()))}.`}</div><button class="btn block" style="margin-top:10px">${i + 1 < R ? 'Next round →' : 'See my total'}</button>`;
        g.querySelector('.after .btn').onclick = () => { i++; round(); }; };
      g.querySelector('.btn').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    };
  };
  round();
}

function gMemory(t, g, done) {
  const cards = shuffle([...t.theme, ...t.theme]); let open = [], matched = 0, moves = 0, lock = false;
  g.innerHTML = `<div class="small muted center" style="font-weight:600;margin-bottom:10px">Moves: <span id="mv">0</span></div><div class="mem">${cards.map((c, k) => `<button class="mc" data-k="${k}"><div class="in"><div class="f">🌿</div><div class="b">${c}</div></div></button>`).join('')}</div>`;
  g.querySelectorAll('.mc').forEach(b => b.onclick = () => {
    if (lock || b.classList.contains('flip')) return;
    b.classList.add('flip'); buzz(5); open.push(b);
    if (open.length === 2) {
      moves++; g.querySelector('#mv').textContent = moves;
      const [a, c] = open;
      if (cards[a.dataset.k] === cards[c.dataset.k]) { a.classList.add('match'); c.classList.add('match'); open = []; matched++; if (matched === t.theme.length) setTimeout(() => done(1, { text: `Finished in ${moves} moves` }), 600); }
      else { lock = true; setTimeout(() => { a.classList.remove('flip'); c.classList.remove('flip'); open = []; lock = false; }, 800); }
    }
  });
}

function gScratch(t, g, done) {
  if (t.panels) return gScratch3(t, g, done);
  g.innerHTML = `<div class="scratch"><div class="under"><div style="font-size:40px">✨</div><b>${esc(t.reveal)}</b></div><canvas></canvas></div><p class="small muted center" style="margin-top:12px">Scratch with your finger</p><div class="after"></div>`;
  const c = g.querySelector('canvas'), ctx = c.getContext('2d');
  const r = c.getBoundingClientRect(); c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
  const grd = ctx.createLinearGradient(0, 0, r.width, r.height); grd.addColorStop(0, '#b7c4ab'); grd.addColorStop(.5, '#d8dfcf'); grd.addColorStop(1, '#9caf88');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, r.width, r.height);
  ctx.fillStyle = '#566f4c'; ctx.font = '600 20px "DM Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌿 Scratch me 🌿', r.width / 2, r.height / 2);
  ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 52; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let down = false, finished = false, n = 0, last = null;
  const pt = e => { const b = c.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return [p.clientX - b.left, p.clientY - b.top]; };
  const checkDone = () => { const d = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0; for (let k = 3; k < d.length; k += 64) if (d[k] === 0) clear++; if (clear / (d.length / 64) > .45) { finished = true; c.style.transition = 'opacity .6s'; c.style.opacity = 0; confetti(90); buzz([20, 40, 20]); const b = h('<button class="btn block" style="margin-top:6px">Claim it</button>'); g.querySelector('.after').appendChild(b); b.onclick = () => done(1); } };
  const draw = e => { if (!down || finished) return; e.preventDefault(); const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(...(last || [x, y])); ctx.lineTo(x, y); ctx.stroke(); last = [x, y]; if (++n % 6 === 0) checkDone(); };
  c.addEventListener('pointerdown', e => { down = true; last = null; draw(e); }); c.addEventListener('pointermove', draw); addEventListener('pointerup', () => { down = false; last = null; if (!finished) checkDone(); });
  c.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
}

function gEmoji(t, g, done) {
  const P = t.puzzles; let i = 0, score = 0;
  const step = () => {
    if (i >= P.length) { g.innerHTML = `<div class="card center"><div class="countdown">${score % 1 ? score.toFixed(2).replace(/0$/, '') : score} / ${P.length}</div><p class="muted">${score >= P.length ? 'Emoji genius! 🧠' : score >= P.length / 2 ? 'Nice work!' : 'Tricky ones!'}</p><button class="btn block">Bank it</button></div>`; g.querySelector('.btn').onclick = () => done(score / P.length, { wrong: score < P.length, text: `🧳 Emoji trips ${score}/${P.length}` }); return; }
    const p = P[i]; let hinted = false;
    g.innerHTML = `<div class="prog"><i style="width:${i / P.length * 100}%"></i></div><div class="small muted center" style="font-weight:700">${i + 1} of ${P.length}</div><div class="bigemoji">${esc(p.emoji)}</div><input class="field" placeholder="Your guess…" autocomplete="off"><div class="after"></div><div class="row" style="margin-top:12px"><button class="btn ghost" data-a="hint" style="flex:1">💡 Hint</button><button class="btn ghost" data-a="skip" style="flex:1">Skip</button></div><button class="btn block" data-a="go" style="margin-top:10px">Guess</button><p class="gonote">One go per puzzle</p>`;
    const inp = g.querySelector('input'), after = g.querySelector('.after'); inp.focus();
    const next = (ok, txt) => { inp.disabled = true; g.querySelectorAll('[data-a]').forEach(b => b.remove()); g.querySelector('.gonote')?.remove(); after.innerHTML = `<div class="fun">${ok ? '✅ Yes! ' : '👉 It was: '}<b>${esc(p.answer)}</b>${txt ? ' ' + txt : ''}</div><button class="btn block" style="margin-top:12px">${i + 1 < P.length ? 'Next' : 'See score'}</button>`; after.querySelector('.btn').onclick = () => { i++; step(); }; };
    const go = () => { const v = inp.value.trim(); if (!v) return; const ok = matches(v, [p.answer, ...(p.accept || [])]); if (ok) { score += hinted ? 1 - hintCut(.15, .35) : 1; buzz(12); } else buzz([30, 30, 30]); next(ok); };
    g.querySelector('[data-a=go]').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    g.querySelector('[data-a=hint]').onclick = e => { hinted = true; after.innerHTML = `<div class="fun">💡 ${esc(p.hint || '')}</div>`; e.target.disabled = true; };
    g.querySelector('[data-a=skip]').onclick = () => next(false);
  };
  step();
}

function gWhois(t, g, done) {
  const S2 = t.statements, picks = []; let i = 0;
  const step = () => {
    if (i >= S2.length) {
      const me = picks.filter(p => p === 'Becki').length, jk = picks.length - me;
      const line = me > jk ? 'Well, at least you\'re honest. 😂' : jk > me ? 'Blaming Jack for everything, as usual. 🙄' : 'Perfectly balanced. As all things should be.';
      g.innerHTML = `<div class="card center"><div style="font-size:40px">⚖️</div><h2 style="margin:6px 0">You: ${me} · Jack: ${jk}</h2><p class="muted">${line}</p><button class="btn block">Bank it</button></div>`;
      g.querySelector('.btn').onclick = () => done(1, { text: 'Who\'s more likely:\n' + S2.map((s, k) => `${s} → ${picks[k]}`).join('\n') });
      return;
    }
    g.innerHTML = `<div class="prog"><i style="width:${i / S2.length * 100}%"></i></div><div class="small muted center" style="font-weight:700">${i + 1} of ${S2.length} · WHO'S MORE LIKELY TO…</div><div class="card center" style="margin-top:10px"><div class="q" style="margin:0">${esc(S2[i])}</div></div><div class="tot" style="margin-top:14px"><button class="totc" data-p="Becki">🙋‍♀️<br>Me</button><button class="totc" data-p="Jack">🙋‍♂️<br>Jack</button></div>`;
    g.querySelectorAll('.totc').forEach(b => b.onclick = () => { b.classList.add('pick'); buzz(8); picks.push(b.dataset.p); setTimeout(() => { i++; step(); }, 240); });
  };
  step();
}

function gMatch3(t, g, done, ctx) {
  const okP = p => !p.lose && !p.again && (!t.only || p.size === t.only || p.forfeit);
  const PZ = [...POOL().filter(okP), { e: '🌿', l: 'JACKPOT', jackpot: true }], JP = PZ.length - 1;
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const makeCard = winIdx => { for (let tries = 0; tries < 3000; tries++) { const c = Array.from({ length: 9 }, () => rnd(PZ.length)); let line = null; if (winIdx != null) { line = LINES[rnd(LINES.length)]; line.forEach(i => c[i] = winIdx); } const found = LINES.filter(l => c[l[0]] === c[l[1]] && c[l[1]] === c[l[2]]); if ((winIdx == null && !found.length) || (winIdx != null && found.length === 1)) return { c, line }; } return { c: [0,1,2,3,4,5,6,7,0], line: null }; };
  // ~40% per card; on her FIRST play the last card always wins if nothing has (birthday rule). Replays: no guarantee.
  const cards = t.cards || 3, plan = []; let anyWin = false;
  for (let k = 0; k < cards; k++) { const win = (k === cards - 1 && !anyWin) || rnd(100) < 40; if (win) anyWin = true; plan.push(makeCard(win ? (rnd(100) < 12 ? JP : PZ.indexOf(pickPool(p => okP(p) && !p.money))) : null)); }   // every play wins at least once
  let k = 0; const won = [];
  const show = () => {
    if (k >= plan.length) return finish();
    const { c, line } = plan[k];
    g.innerHTML = `${ctx ? `<div class="replaybar">🔁 Replay ${ctx.left === Infinity ? '' : `· ${ctx.left} left`}</div>` : ''}<div class="small muted center" style="font-weight:700;letter-spacing:.06em">CARD ${k + 1} OF ${plan.length}</div><div class="m3wrap"><div class="m3">${c.map((p, i) => `<div class="m3c" data-i="${i}"><span>${PZ[p].e}</span><small>${esc(PZ[p].l)}</small></div>`).join('')}</div><canvas></canvas></div><p class="small muted center" data-msg style="margin:10px 0 0">Scratch the whole card with your finger</p><div class="after"></div>`;
    const cv = g.querySelector('canvas'), cx2 = cv.getContext('2d'), msg = g.querySelector('[data-msg]'); let down = false, last = null, n = 0, done_ = false;
    requestAnimationFrame(() => { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio; cx2.scale(devicePixelRatio, devicePixelRatio); const gr = cx2.createLinearGradient(0, 0, r.width, r.height); gr.addColorStop(0, '#b7c4ab'); gr.addColorStop(.5, '#e1e8d8'); gr.addColorStop(1, '#9caf88'); cx2.fillStyle = gr; cx2.fillRect(0, 0, r.width, r.height); cx2.fillStyle = '#566f4c'; cx2.font = '800 18px "DM Sans", sans-serif'; cx2.textAlign = 'center'; cx2.fillText('🌿 SCRATCH ME 🌿', r.width / 2, r.height / 2 + 6); cx2.globalCompositeOperation = 'destination-out'; cx2.lineWidth = 46; cx2.lineCap = 'round'; cx2.lineJoin = 'round'; });
    const reveal = () => { if (done_) return; done_ = true; cv.style.transition = 'opacity .5s'; cv.style.opacity = 0; cv.style.pointerEvents = 'none';
      if (line) { line.forEach(i => g.querySelector(`.m3c[data-i="${i}"]`).classList.add('hit')); const pz = PZ[c[line[0]]];
        if (pz.jackpot) { const p1 = pickPool(q => !q.lose && !q.again && !q.forfeit), p2 = p1.money ? p1 : pickPool(q => !q.lose && !q.again && !q.forfeit); won.push(p1, p2); confetti(220); buzz([20, 40, 20, 40, 20]); msg.innerHTML = `<b>🌿🌿🌿 JACKPOT! DOUBLE WIN:</b><br>${[p1, p2].map(p => esc(p.money ? '£5 for your pot 💷' : p.prize || p.l)).join(' + ')}`; }
        else { won.push(pz); confetti(110); buzz([20, 40, 20]); msg.innerHTML = `<b>3 in a row! ${pz.forfeit ? 'Uh oh…' : 'You win:'} ${esc(pz.money ? '£5 for your pot 💷' : pz.prize)}</b>`; } }
      else { buzz([30, 30, 30]); msg.textContent = 'No match this time…'; }
      const b = h(`<button class="btn block" style="margin-top:10px">${k + 1 < plan.length ? 'Next card →' : 'See my winnings'}</button>`); g.querySelector('.after').appendChild(b); b.onclick = () => { k++; show(); }; };
    const check = () => { const d = cx2.getImageData(0, 0, cv.width, cv.height).data; let cl = 0; for (let i = 3; i < d.length; i += 64) if (d[i] === 0) cl++; if (cl / (d.length / 64) > .55) reveal(); };
    const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', e => { down = true; last = null; e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!down || done_) return; e.preventDefault(); const [x, y] = pt(e); cx2.beginPath(); cx2.moveTo(...(last || [x, y])); cx2.lineTo(x, y); cx2.stroke(); last = [x, y]; if (++n % 6 === 0) check(); });
    addEventListener('pointerup', () => { if (down) { down = false; last = null; check(); } });
    cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    const sk = h(`<button class="btn ghost block sm" style="margin-top:8px">Reveal it all</button>`); g.querySelector('.after').appendChild(sk); sk.onclick = () => { sk.remove(); reveal(); };
  };
  const finish = () => {
    if (ctx) { const lines = won.map(p => awardPool(p, t.title) || (p.money ? 'Not a winner (pot bonus maxed out)' : null)); save(); return ctx.finish(lines.filter(x => x && !/maxed/.test(x)), `${won.length} win${won.length === 1 ? '' : 's'}`); }
    const money_ = won.some(p => p.money);
    g.innerHTML = `<div class="card center"><div style="font-size:40px">🎉</div><h2 style="margin:6px 0">Your winnings</h2>${won.length ? won.map(p => `<div class="coupon" style="text-align:center"><b>${esc(p.money ? 'Cash for your holiday pot 💷' : p.prize || p.l)}</b></div>`).join('') : '<p class="muted">No luck this time!</p>'}<p class="small muted" style="margin:8px 0 0">${t.replay && t.replay.max ? `You've got ${t.replay.max - 1} more goes 🔁` : 'Come back and play again 🔁'}</p><button class="btn block" style="margin-top:10px">Bank it</button></div>`;
    g.querySelector('.btn').onclick = () => { const got = won.filter(p => !p.money).map(p => awardPool(p, t.title)); save(); done(money_ ? 1 : 0, { text: `🎟️ Scratchcards: ${won.map(p => p.money ? 'cash' : p.prize || p.l).join(', ') || 'nothing'}`, msg: got.length ? `${got.length} coupon${got.length > 1 ? 's' : ''} saved in your Coupons tab 🎟️` : 'Come back and play again any time! 🔁' }); };
  };
  show();
}

function gScratch3(t, g, done) {
  const panels = shuffle(t.panels); let tries = 0, over = false;
  g.innerHTML = `<div class="s3">${panels.map((p, i) => `<div class="s3p" data-i="${i}"><div class="s3u ${p.kind}">${esc(p.label)}</div><canvas></canvas></div>`).join('')}</div><p class="small muted center" data-msg style="margin-top:12px">Pick a panel and scratch it with your finger</p><div class="after"></div>`;
  const msg = g.querySelector('[data-msg]');
  const finish = p => {
    over = true; g.querySelectorAll('.s3p canvas').forEach(c => { c.style.transition = 'opacity .6s'; c.style.opacity = 0; c.style.pointerEvents = 'none'; });
    const b = h(`<button class="btn block" style="margin-top:10px">Claim it</button>`); g.querySelector('.after').appendChild(b);
    msg.textContent = p.kind === 'money' ? 'Cash for the pot! Here\'s what else was hiding…' : 'Ooh la la. Here\'s what else was hiding…';
    b.onclick = () => done(p.kind === 'money' ? 1 : 0, p.kind === 'coupon' ? { prize: p.prize, text: `🎟️ Scratch card: ${p.prize}`, msg: 'Coupon saved in your Coupons tab 😏' } : { text: '🎟️ Scratch card: money for the pot' });
  };
  g.querySelectorAll('.s3p').forEach(el => {
    const p = panels[+el.dataset.i], c = el.querySelector('canvas'), ctx = c.getContext('2d');
    requestAnimationFrame(() => {
      const r = c.getBoundingClientRect(); c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
      const grd = ctx.createLinearGradient(0, 0, r.width, r.height); grd.addColorStop(0, '#b7c4ab'); grd.addColorStop(.5, '#dfe6d6'); grd.addColorStop(1, '#9caf88');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, r.width, r.height); ctx.fillStyle = '#566f4c'; ctx.font = '700 15px "DM Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌿 Scratch', r.width / 2, r.height / 2 + 5);
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    });
    let down = false, last = null, n = 0, revealed = false;
    const pt = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const check = () => { const d = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0; for (let k = 3; k < d.length; k += 64) if (d[k] === 0) clear++; if (clear / (d.length / 64) > .45) reveal(); };
    const reveal = () => { if (revealed || over) return; revealed = true; tries++; c.style.transition = 'opacity .4s'; c.style.opacity = 0; c.style.pointerEvents = 'none'; buzz(p.kind === 'lose' ? [30, 30, 30] : [20, 40, 20]);
      if (p.kind === 'lose') { msg.textContent = 'Not a winner! Scratch another one 👇'; el.classList.add('dud'); }
      else { confetti(110); el.classList.add('win'); finish(p); } };
    c.addEventListener('pointerdown', e => { if (over || revealed) return; down = true; last = null; e.preventDefault(); });
    c.addEventListener('pointermove', e => { if (!down || over || revealed) return; e.preventDefault(); const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(...(last || [x, y])); ctx.lineTo(x, y); ctx.stroke(); last = [x, y]; if (++n % 6 === 0) check(); });
    addEventListener('pointerup', () => { if (down) { down = false; last = null; check(); } });
    c.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  });
}

function gCrossword(t, g, done) {
  const cw = t.grid, W = cw.w, H = cw.h, words = cw.words;
  const cells = {}; words.forEach((w, wi) => { for (let k = 0; k < w.answer.length; k++) { const r = w.row + (w.dir === 'D' ? k : 0), c = w.col + (w.dir === 'A' ? k : 0), key = r + ',' + c; (cells[key] ||= { r, c, ch: w.answer[k], words: [] }).words.push(wi); } });
  const nums = {}; words.forEach(w => nums[w.row + ',' + w.col] = w.num);
  const val = {}; let cur = 0, pos = 0, reveals = 0, revCut = 0, checked = false;
  const wcells = wi => { const w = words[wi]; return Array.from({ length: w.answer.length }, (_, k) => (w.row + (w.dir === 'D' ? k : 0)) + ',' + (w.col + (w.dir === 'A' ? k : 0))); };
  const wordOk = wi => wcells(wi).every(k => val[k] === cells[k].ch);
  g.innerHTML = `<div class="cwclue"></div><div class="cwgrid" style="grid-template-columns:repeat(${W},1fr)">${Array.from({ length: H }, (_, r) => Array.from({ length: W }, (_, c) => { const k = r + ',' + c; return cells[k] ? `<button class="cwc" data-k="${k}">${nums[k] ? `<i>${nums[k]}</i>` : ''}<b></b></button>` : '<span class="cwx"></span>'; }).join('')).join('')}</div>
    <input class="cwin" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="crossword letter">
    <div class="row" style="margin-top:12px"><button class="btn ghost" data-a="rev" style="flex:1">💡 Reveal a letter</button><button class="btn ghost" data-a="chk" style="flex:1">Check</button></div>
    <button class="btn block" data-a="fin" style="margin-top:10px">Finish &amp; bank it</button>
    <div class="cwlist">${['A', 'D'].map(d => `<div class="small" style="font-weight:800;margin:12px 0 4px">${d === 'A' ? 'ACROSS' : 'DOWN'}</div>` + words.map((w, wi) => w.dir === d ? `<button class="cwli" data-w="${wi}"><b>${w.num}</b> ${esc(w.clue)} (${w.answer.length})</button>` : '').join('')).join('')}</div>`;
  const inp = g.querySelector('.cwin');
  const draw = () => {
    const act = new Set(wcells(cur)), ck = wcells(cur)[pos];
    g.querySelectorAll('.cwc').forEach(b => { const k = b.dataset.k; b.querySelector('b').textContent = val[k] || ''; b.classList.toggle('on', act.has(k)); b.classList.toggle('cur', k === ck);
      const ws = cells[k].words; b.classList.toggle('ok', checked && ws.some(wi => wordOk(wi))); b.classList.toggle('bad', checked && !!val[k] && val[k] !== cells[k].ch); });
    const w = words[cur]; g.querySelector('.cwclue').innerHTML = `<b>${w.num} ${w.dir === 'A' ? 'Across' : 'Down'}</b> ${esc(w.clue)} (${w.answer.length})`;
    g.querySelectorAll('.cwli').forEach(b => { b.classList.toggle('on', +b.dataset.w === cur); b.classList.toggle('done', wordOk(+b.dataset.w)); });
  };
  const focus = () => { try { inp.focus({ preventScroll: true }); } catch { inp.focus(); } };
  g.querySelectorAll('.cwc').forEach(b => b.onclick = () => { const k = b.dataset.k, ws = cells[k].words; if (ws.includes(cur) && wcells(cur)[pos] === k && ws.length > 1) cur = ws.find(x => x !== cur); else if (!ws.includes(cur)) cur = ws[0]; pos = wcells(cur).indexOf(k); buzz(5); draw(); focus(); });
  g.querySelectorAll('.cwli').forEach(b => b.onclick = () => { cur = +b.dataset.w; pos = 0; draw(); focus(); g.querySelector('.cwclue').scrollIntoView({ block: 'nearest' }); });
  const put = ch => { const ks = wcells(cur); val[ks[pos]] = ch; if (pos < ks.length - 1) pos++; checked = false; draw(); if (words.every((_, wi) => wordOk(wi))) { confetti(90); buzz([20, 40, 20]); } };
  inp.addEventListener('input', () => { const v = inp.value.toUpperCase().replace(/[^A-Z]/g, ''); inp.value = ''; for (const ch of v) put(ch); });
  inp.addEventListener('keydown', e => { if (e.key === 'Backspace') { e.preventDefault(); const ks = wcells(cur); if (val[ks[pos]]) val[ks[pos]] = ''; else if (pos > 0) { pos--; val[ks[pos]] = ''; } checked = false; draw(); } });
  g.querySelector('[data-a=rev]').onclick = () => { const ks = wcells(cur); const k = ks.find(x => val[x] !== cells[x].ch) ; if (!k) return; val[k] = cells[k].ch; reveals++; revCut += hintCut(.02, .05); pos = Math.min(ks.indexOf(k) + 1, ks.length - 1); buzz(8); draw(); };
  g.querySelector('[data-a=chk]').onclick = () => { checked = true; draw(); const n = words.filter((_, wi) => wordOk(wi)).length; buzz(n === words.length ? [20, 40, 20] : 10); };
  g.querySelector('[data-a=fin]').onclick = () => { const n = words.filter((_, wi) => wordOk(wi)).length; if (n < words.length && !confirm(`Finish with ${n} of ${words.length} words right?`)) return; const frac = Math.max(0, n / words.length - revCut); done(frac, { wrong: frac < 1, text: `📝 Crossword: ${n}/${words.length} words${reveals ? `, ${reveals} letters revealed` : ''}`, msg: n === words.length ? 'Every single word! 📝🎉' : `${n} of ${words.length} words right!` }); };
  draw();
}

function gRedBlack(t, g, done, ctx) {
  const N = 13, amt = t.amount || 0, step = .2, rounds = ctx ? 1 : 5; let frac = .5, round = 0, busy = false, rot = 0, wins = 0;
  const col = k => k === 0 ? 'green' : (k % 2 ? 'red' : 'black');
  const R = 140, wheel = Array.from({ length: N }, (_, k) => { const a0 = (k / N) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / N) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2; const x0 = 150 + R * Math.cos(a0), y0 = 150 + R * Math.sin(a0), x1 = 150 + R * Math.cos(a1), y1 = 150 + R * Math.sin(a1), tx = 150 + R * .78 * Math.cos(am), ty = 150 + R * .78 * Math.sin(am); const fill = { green: '#2f8a4c', red: '#c0392b', black: '#22261f' }[col(k)]; return `<path d="M150,150 L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z" fill="${fill}" stroke="#d9a94a" stroke-width="2"/><text x="${tx}" y="${ty}" transform="rotate(${am * 180 / Math.PI + 90} ${tx} ${ty})" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="800" fill="#fff" font-family="DM Sans">${k}</text>`; }).join('');
  const table = () => money(Math.floor(amt * frac * 2) / 2);
  const draw = msg => {
    g.innerHTML = `${ctx ? `<div class="replaybar">🔁 Replay · win a spin, win a prize${ctx.left === Infinity ? '' : ` · ${ctx.left} left`}</div>` : `<div class="rbtop"><span>Spin ${Math.min(round + 1, rounds)} of ${rounds}</span><b>${table()} on the table</b></div>`}
      <div class="roul"><div class="roulptr"></div><svg viewBox="0 0 300 300" style="transform:rotate(${rot}deg)"><circle cx="150" cy="150" r="146" fill="#7a5a2b"/>${wheel}<circle cx="150" cy="150" r="46" fill="#7a5a2b" stroke="#d9a94a" stroke-width="3"/><text x="150" y="152" text-anchor="middle" dominant-baseline="middle" font-size="26">🎰</text></svg></div>
      <p class="center muted" data-msg style="min-height:22px;margin:10px 0">${msg || 'Red or black? (Green 0 loses!)'}</p>
      <div class="row"><button class="btn rbred" data-c="red" style="flex:1">🔴 Red</button><button class="btn rbblack" data-c="black" style="flex:1">⚫ Black</button></div>
      ${ctx ? '' : `<button class="btn ghost block" data-a="cash" style="margin-top:10px">Cash out with ${table()}</button>`}`;
    g.querySelectorAll('[data-c]').forEach(b => b.onclick = () => pick(b.dataset.c));
    const cb = g.querySelector('[data-a=cash]'); if (cb) cb.onclick = () => finish();
  };
  const pick = c => {
    if (busy) return; busy = true; g.querySelectorAll('[data-c],[data-a]').forEach(b => b.disabled = true);
    const k = rnd(N), res = col(k), svg = g.querySelector('.roul svg');
    rot = rot - (rot % 360) + 360 * 5 + (360 - (k + .5) * (360 / N));
    svg.style.transition = 'transform 3.2s cubic-bezier(.12,.75,.12,1)'; svg.style.transform = `rotate(${rot}deg)`; buzz(10);
    setTimeout(() => {
      const ok = c === res; round++; if (ok) wins++;
      if (!ctx) frac = Math.max(0, Math.min(1, frac + (ok ? step : -step)));
      buzz(ok ? [20, 40, 20] : [40, 30, 40]); if (ok) confetti(50);
      const msg = res === 'green' ? `0, green! The house wins. ❌` : ok ? `${k}, ${res}! Nice call. ✅` : `${k}, ${res}. Ouch. ❌`;
      busy = false;
      if (ctx) { draw(msg); return setTimeout(() => { const lines = ok ? [awardPool(pickPool(p => !p.lose && !p.again), t.title)] : []; save(); ctx.finish(lines.filter(Boolean), `${k} ${res} (picked ${c}) → ${ok ? 'won' : 'lost'}`); }, 900); }
      if (round >= rounds || frac <= 0) { draw(msg); setTimeout(finish, 900); } else draw(msg);
    }, 3300);
  };
  const finish = () => done(frac, { text: `🎰 Roulette: cashed out at ${Math.round(frac * 100)}% after ${round} spin${round === 1 ? '' : 's'}`, msg: 'Come back for more spins! Replays win prizes 🔁' });
  draw();
}

function gRps(t, g, done) {
  const amt = t.amount || 0, step = .2; let frac = .5, me = 0, him = 0, played = 0, busy = false;
  const E = { rock: '✊', paper: '✋', scissors: '✌️' }, beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  const talk = {
    rock: ['Jack went rock.', 'Rock from Jack. Solid choice.', 'Jack threw rock.', 'Rock! Jack looks smug.', 'Jack picked rock this time.'],
    paper: ['Jack went paper.', 'Paper from Jack.', 'Jack threw paper. Sneaky.', 'Paper! Jack is acting like he planned it.', 'Jack picked paper this time.'],
    scissors: ['Jack went scissors.', 'Scissors from Jack.', 'Jack threw scissors. Snip snip.', 'Scissors! Jack thinks he is clever.', 'Jack picked scissors this time.'] };
  const draw = msg => {
    g.innerHTML = `<div class="rbtop"><span>You ${me} · Jack ${him}</span><b>${money(Math.floor(amt * frac * 2) / 2)} at stake</b></div>
      <div class="rpsarena"><div class="rpshand" data-me>❔</div><span class="muted" style="font-weight:800">VS</span><div class="rpshand" data-him>❔</div></div>
      <p class="center muted" data-msg style="min-height:44px;margin:8px 0">${msg || 'First to 3. Pick your weapon!'}</p>
      <div class="rpsbtns">${Object.keys(E).map(k => `<button class="rpsb" data-p="${k}">${E[k]}<small>${k}</small></button>`).join('')}</div>`;
    g.querySelectorAll('[data-p]').forEach(b => b.onclick = () => play(b.dataset.p));
  };
  const play = p => {
    if (busy) return; busy = true; const j = Object.keys(E)[rnd(3)];
    const mh = g.querySelector('[data-me]'), jh = g.querySelector('[data-him]'); mh.classList.add('shakeh'); jh.classList.add('shakeh'); buzz(10);
    setTimeout(() => {
      mh.classList.remove('shakeh'); jh.classList.remove('shakeh'); mh.textContent = E[p]; jh.textContent = E[j];
      let msg = talk[j][rnd(talk[j].length)];
      if (p === j) msg += ' Tie! Go again.';
      else if (beats[p] === j) { me++; played++; frac = Math.min(1, frac + step); msg += ' You win the round! ✅'; confetti(40); buzz([20, 40, 20]); }
      else { him++; played++; frac = Math.max(0, frac - step); msg += ' Jack takes it. ❌'; buzz([40, 30, 40]); }
      g.querySelector('[data-msg]').textContent = msg; busy = false;
      if (me >= 3 || him >= 3 || played >= 5) setTimeout(() => done(frac, { wrong: frac < 1, text: `✊ RPS vs Jack: ${me}-${him}`, msg: me > him ? `You beat Jack ${me}-${him}! 🏆` : `Jack won ${him}-${me}… this time.` }), 1100);
      else setTimeout(() => { const keep = g.querySelector('[data-msg]').textContent; draw(keep); g.querySelector('[data-me]').textContent = E[p]; g.querySelector('[data-him]').textContent = E[j]; }, 900);
    }, 700);
  };
  draw();
}

function gWheel(t, g, done, ctx) {
  const segs = t.segments.map(s => typeof s === 'string' ? { e: '', l: s, prize: s, again: /spin again/i.test(s) } : s), n = segs.length, cols = ['#9caf88', '#e9b8a9', '#d9a94a', '#7f9a72', '#f2cfc4', '#b9c9a8', '#ecc777', '#c9d6bb'];
  const R = 150, paths = segs.map((s, k) => {
    const a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
    const x0 = R + R * Math.cos(a0), y0 = R + R * Math.sin(a0), x1 = R + R * Math.cos(a1), y1 = R + R * Math.sin(a1);
    const tx = R + R * .6 * Math.cos(am), ty = R + R * .6 * Math.sin(am);
    const lab = `${s.e ? s.e + ' ' : ''}${s.l}`;
    return `<path d="M${R},${R} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z" fill="${s.lose ? '#d8d6cc' : s.again ? '#566f4c' : cols[k % cols.length]}" stroke="#fffdf8" stroke-width="3"/><text x="${tx}" y="${ty}" transform="rotate(${am * 180 / Math.PI} ${tx} ${ty})" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" fill="${s.again ? '#fff' : '#2f3a2c'}" font-family="DM Sans">${esc(lab.length > 20 ? lab.slice(0, 19) + '…' : lab)}</text>`;
  }).join('');
  const left = ctx ? ctx.left : replayMax(t);
  g.innerHTML = `<div class="replaybar">🎡 ${left === Infinity ? '' : `${left} spin${left === 1 ? '' : 's'} left`}${ctx ? '' : ' · this is your first'}</div><div class="wheelwrap"><div class="pointer"></div><svg viewBox="0 0 300 300">${paths}<circle cx="150" cy="150" r="22" fill="#fffdf8"/><text x="150" y="152" text-anchor="middle" dominant-baseline="middle" font-size="20">🎂</text></svg></div><button class="btn block">Spin!</button><div class="after"></div>`;
  const svg = g.querySelector('svg'), b = g.querySelector('.btn'); let rot = 0;
  b.onclick = () => {
    b.disabled = true; const k = rnd(n), s = segs[k];
    rot = rot - (rot % 360) + 360 * 6 + (360 - (k + .5) * (360 / n)); svg.style.transform = `rotate(${rot}deg)`; buzz(10);
    setTimeout(() => {
      if (s.again) { b.disabled = false; b.textContent = 'Spin again! 🎡 (free spin)'; buzz(15); g.querySelector('.after').innerHTML = '<div class="fun" style="text-align:center">🔁 Spin again! This one doesn\'t count.</div>'; return; }
      const got = awardPool(s, t.title); save();
      const label = got || (s.money ? 'Not a winner (pot bonus maxed out)' : 'Not a winner ❌');
      if (got && !(s.money < 0)) { buzz([20, 40, 20]); confetti(80); } else buzz([30, 30, 30]);
      g.querySelector('.after').innerHTML = `<div class="coupon" style="text-align:center"><span class="small muted">THE WHEEL HAS SPOKEN</span><b style="font-size:20px">${esc(label)}</b></div><button class="btn block">${ctx ? 'Done' : 'Claim it'}</button>`; b.remove();
      g.querySelector('.after .btn').onclick = () => ctx ? ctx.finish(got ? [got] : [], `${s.e || ''} ${s.l}`) : done(1, { text: `🎡 Wheel spin 1/${replayMax(t)}: **${s.l}**`, msg: got ? `You won: ${got}. You've got ${replayMax(t) - 1} more spins! 🔁` : `Not a winner this time… but you've got ${replayMax(t) - 1} more spins! 🔁` });
    }, 4700);
  };
}

function gTot(t, g, done) {
  const picks = []; let i = 0;
  const step = () => {
    if (i >= t.pairs.length) return finish();
    const [a, b] = t.pairs[i];
    g.innerHTML = `<div class="prog"><i style="width:${i / t.pairs.length * 100}%"></i></div><div class="small muted center" style="font-weight:600;margin-bottom:12px">${i + 1} of ${t.pairs.length} · tap one</div><div class="tot"><button class="totc">${esc(a)}</button><button class="totc">${esc(b)}</button></div>`;
    g.querySelectorAll('.totc').forEach(btn => btn.onclick = () => { btn.classList.add('pick'); buzz(8); picks.push(btn.textContent); setTimeout(() => { i++; step(); }, 260); });
  };
  const finish = () => {
    const win = t.results.map(r => ({ r, n: picks.filter(p => r.picks.includes(p)).length })).sort((x, y) => y.n - x.n)[0].r;
    g.innerHTML = `<div class="card center"><div class="small muted" style="font-weight:700;letter-spacing:.06em">YOUR HOLIDAY PERSONALITY</div><h2 style="font-size:30px;margin:10px 0">${esc(win.label)}</h2><p class="muted" style="line-height:1.5">${esc(win.description)}</p><button class="btn block">Lock it in</button></div>`;
    g.querySelector('.btn').onclick = () => done(1, { raw: `${win.label}. Picks: ${picks.join(', ')}` });
  };
  step();
}

function gCode(t, g, done) {
  g.innerHTML = `<div class="card"><div class="small muted" style="font-weight:700;letter-spacing:.06em">🗝️ YOUR CLUE</div><div class="q" style="margin:8px 0 0;white-space:pre-line;font-style:italic">${esc(t.prompt)}</div></div><p class="small muted center" style="margin:16px 0 8px">Found it? Type the secret word.</p><input class="field" style="text-align:center;text-transform:uppercase;letter-spacing:.15em;font-weight:700" placeholder="SECRET WORD" autocomplete="off"><button class="btn block" style="margin-top:12px">Unlock</button>`;
  const inp = g.querySelector('input'), go = () => norm(inp.value) === norm(t.code) ? done(1, { text: `🗝️ Found the code ${t.code}` }) : shake(inp);
  g.querySelector('.btn').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
}
function gQr(t, g, done) { g.innerHTML = `<div class="card"><div class="q" style="margin:0">${esc(t.prompt)}</div><p class="small muted" style="margin:10px 0 0">Scanning it with your camera unlocks this challenge automatically. (Camera playing up? The code's printed under it.)</p></div>`; codePad(g, t, () => done(1, { text: '📱 Secret QR found' }), 'OR TYPE THE CODE UNDER THE QR'); }

function gPhoto(t, g, done) {
  g.innerHTML = `${qCard(t.prompt)}<label class="btn block ghost" style="margin-top:16px">📸 Take or choose a photo<input type="file" accept="image/*" hidden></label><img class="photoprev hide"><button class="btn block hide" data-a="send">Send it to ${esc(C.from)}</button>`;
  let blob = null;
  g.querySelector('input').onchange = async e => { const f = e.target.files[0]; if (!f) return; blob = await shrink(f); const img = g.querySelector('img'); img.src = URL.createObjectURL(blob); img.classList.remove('hide'); g.querySelector('[data-a=send]').classList.remove('hide'); };
  g.querySelector('[data-a=send]').onclick = () => blob && done(1, { text: `📸 ${t.prompt}`, file: new File([blob], 'photo.jpg', { type: 'image/jpeg' }) });
}
function shrink(f) { return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => res(b || f), 'image/jpeg', .85); }; img.onerror = () => res(f); img.src = URL.createObjectURL(f); }); }

function gReveal(t, g, done) {
  const zooms = [4.2, 3, 2.1, 1.45, 1], pay = [1, .8, .6, .4, .25]; let step = 0, over = false;
  g.innerHTML = `<div class="zoombox"><img src="${esc(t.image)}" style="transform-origin:${esc(t.zoomAt || '50% 58%')};transform:scale(${zooms[0]})" alt=""></div><div class="zsteps">${zooms.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div><div class="q" style="margin:10px 0 0">${esc(t.q)}</div><input class="field" style="margin-top:12px" placeholder="Your guess…" autocomplete="off"><div class="after"></div><button class="btn block" data-a="go" style="margin-top:10px">Guess</button>`;
  const inp = g.querySelector('input'), img = g.querySelector('img'), after = g.querySelector('.after');
  const setStep = () => { img.style.transform = `scale(${zooms[step]})`; g.querySelectorAll('.zsteps i').forEach((x, i) => x.classList.toggle('on', i <= step)); };
  const go = () => {
    if (over) return; const v = inp.value.trim(); if (!v) return;
    if (matches(v, t.answers)) { over = true; img.style.transform = 'scale(1)'; buzz(15); after.innerHTML = '<div class="fun">✅ Yes!</div>'; return setTimeout(() => done(pay[step], { wrong: step > 0, text: `🔎 Guessed "${v}" after ${step} zoom-out${step === 1 ? '' : 's'}` }), 1100); }
    const sp = (t.special || []).find(s => s.answers.some(x => squash(x) === squash(v)));
    if (sp) { after.innerHTML = `<div class="fun">🔥 ${esc(sp.msg)}</div>`; inp.value = ''; return; }
    shake(inp); inp.value = '';
    if (step < zooms.length - 1) { step++; setStep(); after.innerHTML = `<div class="fun">❌ Nope! Zooming out a bit… (${zooms.length - 1 - step} zoom${zooms.length - 1 - step === 1 ? '' : 's'} left)</div>`; return; }
    over = true; after.innerHTML = `<div class="fun">❌ Out of guesses! It was ${esc(t.answers[0].replace(/\b\w/g, c => c.toUpperCase()))}.</div>`;
    setTimeout(() => done(0, { wrong: true, text: `🔎 Didn't get it (last guess "${v}")`, msg: `It was ${t.answers[0].replace(/\b\w/g, c => c.toUpperCase())}!` }), 1200);
  };
  g.querySelector('[data-a=go]').onclick = go; inp.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } };
}

function gOrder(t, g, done) {
  const n = t.images.length, idx = shuffle(t.images.map((_, i) => i)); let picked = [];
  const draw = () => {
    g.innerHTML = `${qCard(t.q, t.image, t.video)}<div class="ordgrid">${idx.map(i => `<button class="ord" data-i="${i}"><img src="${esc(t.images[i])}">${picked.includes(i) ? `<span class="onum">${picked.indexOf(i) + 1}</span>` : ''}</button>`).join('')}</div><p class="small muted center" style="margin:8px 0 0">${picked.length}/${n} picked · tap a numbered one to undo it</p><div class="row" style="margin-top:12px"><button class="btn ghost" data-a="reset" style="flex:1">Start again</button><button class="btn" data-a="go" style="flex:1" ${picked.length === n ? '' : 'disabled'}>Lock it in</button></div><div class="after"></div>`;
    g.querySelectorAll('.ord').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (picked.includes(i)) picked = picked.slice(0, picked.indexOf(i)); else picked.push(i); buzz(6); draw(); });
    g.querySelector('[data-a=reset]').onclick = () => { picked = []; draw(); };
    g.querySelector('[data-a=go]').onclick = () => {
      const right = picked.filter((v, k) => v === k).length;
      g.innerHTML = `${qCard(right === n ? 'Perfect timeline! 💚' : `You got ${right} of ${n} in the right spot. Here's how it really went:`)}<div class="timeline">${t.images.map((src, i) => `<div class="tl ${picked[i] === i ? 'ok' : 'no'}"><img src="${esc(src)}"><div><b>${esc((t.dates || [])[i] || '#' + (i + 1))}</b><span>${picked[i] === i ? '✅ You had this right' : `❌ You put this ${['1st','2nd','3rd'][picked.indexOf(i)] || (picked.indexOf(i) + 1) + 'th'}`}</span></div></div>`).join('')}</div><button class="btn block" style="margin-top:12px">Bank it</button>`;
      g.querySelector('.btn').onclick = () => done(right / n, { wrong: right < n, text: `📸 Our Story: ${right}/${n} in the right place` });
    };
  };
  draw();
}

// ===== Jack's Casino: she bets from her pot (max £10 a go). Stake comes off when the go starts, winnings go on when it ends.
const CHIPS = [1, 2, 5, 10];
const half = n => Math.floor(n * 2 + 1e-9) / 2;                       // whole £ or 50p, always rounded down
function casinoStart(t, stake) {
  S.casino ||= { net: 0, goes: 0, won: 0, lost: 0 };
  S.casino.net -= stake; S.casino.goes++; save();
}
// payout = what comes back (0 = lost the stake). Returns what was actually paid (the pot never goes past the cap).
function casinoEnd(t, stake, payout, what) {
  const room = Math.max(0, C.cap + OVER() - rawEarned());
  const paid = Math.min(half(payout), room);
  S.casino.net += paid; const d = paid - stake;
  if (d > 0) S.casino.won += d; else S.casino.lost += -d;
  S.casino.log = [{ at: Date.now(), g: t.title, stake, paid, what }, ...(S.casino.log || [])].slice(0, 60);
  save();
  const sign = d > 0 ? `won **+${money(d)}** 🤑` : d === 0 ? 'got her stake back 😅' : `lost **${money(-d)}** 😈`;
  discord(`🎰 **${C.name}** bet ${money(stake)} on **${t.title}** and ${sign}${what ? ` (${what})` : ''}\n_Casino overall: ${S.casino.net >= 0 ? '+' : '−'}${money(Math.abs(S.casino.net))} over ${S.casino.goes} goes · pot ${money(earned())}_`);
  return paid;
}
const CTYPES = { cups: cCups, double: cDouble, hilo: cHilo, cscratch: cScratch, cwheel: cWheel, slots: cSlots };
function gCasino(t, g, close) {
  let stake = 0, inGo = false, leave = null;
  const sheet = g.closest('.sheet'); if (sheet) sheet._leave = () => { if (inGo && leave) leave(); };
  const top = h(`<div class="cbar"><div><span class="small muted">YOUR POT</span><b class="cpot"></b></div><div style="text-align:right"><span class="small muted">CASINO SO FAR</span><b class="cnet"></b></div></div>`);
  const pick = h(`<div class="card"><b>Pick your bet</b><div class="small muted" style="margin:2px 0 8px">Max £10 a go. Anything you lose here isn't gone: it goes back into the other games for you to win back. 😉</div><div class="cchips"></div><button class="btn block" data-a="go" disabled style="margin-top:12px">Choose a bet</button></div>`);
  const area = h('<div class="carea"></div>');
  g.append(top, pick, area);
  const refresh = () => {
    const n = (S.casino && S.casino.net) || 0;
    top.querySelector('.cpot').textContent = money(earned());
    top.querySelector('.cnet').textContent = (n > 0 ? '+' : n < 0 ? '−' : '') + money(Math.abs(n));
    top.querySelector('.cnet').style.color = n > 0 ? 'var(--sage-3)' : n < 0 ? 'var(--red)' : '';
    const cc = pick.querySelector('.cchips'); cc.innerHTML = '';
    (t.chips || CHIPS).forEach(v => { const b = h(`<button class="cchip ${stake === v ? 'on' : ''}">£${v}</button>`); b.disabled = v > earned(); b.onclick = () => { stake = v; buzz(6); refresh(); }; cc.appendChild(b); });
    if (stake > earned()) stake = 0;
    const go = pick.querySelector('[data-a=go]'); go.disabled = !stake; go.textContent = stake ? `Bet £${stake} ${t.verb || "Let's go"} 🎲` : (earned() < 1 ? 'Your pot needs at least £1' : 'Choose a bet');
  };
  const again = (msg, good) => {
    refresh();
    const a = h(`<div class="card center cres ${good ? 'good' : ''}"><div class="cresmsg">${msg}</div><div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost" style="flex:1" data-a="out">Leave the casino</button><button class="btn" style="flex:1" data-a="more">Play again 🎲</button></div></div>`);
    area.appendChild(a); a.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    a.querySelector('[data-a=out]').onclick = close;
    a.querySelector('[data-a=more]').onclick = () => { area.innerHTML = ''; pick.style.display = ''; refresh(); scrollTo(0, 0); g.closest('.sheet')?.scrollTo(0, 0); };
  };
  pick.querySelector('[data-a=go]').onclick = () => {
    if (!stake || stake > earned()) return;
    casinoStart(t, stake); inGo = true; leave = null; pick.style.display = 'none'; area.innerHTML = ''; refresh(); buzz(10);
    CTYPES[t.type](t, area, stake, (payout, what, extra) => {
      if (!inGo) return; inGo = false;
      const paid = casinoEnd(t, stake, payout, what), d = paid - stake;
      if (d > 0) { confetti(d >= stake * 3 ? 160 : 80); buzz([20, 40, 20]); } else if (d < 0) buzz([40, 30, 40]);
      if (!sheet || !sheet.isConnected) return;
      again(`${extra ? `<div style="margin-bottom:8px">${extra}</div>` : ''}${d > 0 ? `<div class="won">+${money(d)}</div><p style="margin:0">You turned £${stake} into ${money(paid)}! 🤑</p>` : d === 0 ? `<b>Stake back, no harm done 😅</b>` : `<div class="lost">−${money(-d)}</div><p style="margin:0" class="muted">${extra && extra.includes('🎟️') ? 'Swapped for a coupon. Worth it? 😏' : paid > 0 ? `You got ${money(paid)} back.` : 'Jack takes it. 😈'}</p>`}`, d > 0);
    }, fn => { leave = fn; });
  };
  refresh();
}
// --- Pick a Cup / Lucky Dip: each cup (or envelope) hides a different multiplier of the bet. She picks one, then sees them all.
function cCups(t, a, stake, end, onLeave) {
  const prizes = shuffle((t.prizes || [2, 0.6, 0.25]).slice()), n = prizes.length, ic = t.icon || '🥤';
  const val = m => money(Math.floor(stake * m * 2) / 2);
  onLeave(() => end(stake, `left before picking (stake back)`));
  a.innerHTML = `<div class="card center"><b>${n > 3 ? 'Pick an envelope' : 'Watch the cups… then pick one'}</b><div class="small muted" style="margin-top:2px">Inside: ${[...prizes].sort((x, y) => y - x).map(val).join(' · ')}</div><div class="cups ${n > 3 ? 'many' : ''}">${prizes.map(() => `<button class="cup">${ic}</button>`).join('')}</div></div>`;
  const cups = [...a.querySelectorAll('.cup')]; cups.forEach(c => c.disabled = true);
  let k = 0; const shuf = setInterval(() => { cups.forEach(c => c.classList.remove('jig')); cups[rnd(n)].classList.add('jig'); buzz(4); if (++k > 7) { clearInterval(shuf); cups.forEach(c => { c.classList.remove('jig'); c.disabled = false; }); } }, 240);
  cups.forEach((c, i) => c.onclick = () => {
    cups.forEach(x => x.disabled = true); const m = prizes[i];
    onLeave(() => end(stake * m, `picked ×${m}`));
    cups.forEach((x, j) => { x.classList.add('up'); x.innerHTML = `${ic}<span>${val(prizes[j])}</span>`; if (j === i) x.classList.add('mine'); });
    setTimeout(() => end(stake * m, `picked ×${m}`), 1100);
  });
}
// --- Double or Nothing: flip to double what's on the line, or bank it. 4% chance the coin lands on its edge = Jack wins.
function cDouble(t, a, stake, end, onLeave) {
  const MAX = t.maxFlips || 5, EDGE = t.edge ?? 4; let line = stake, flips = 0;
  onLeave(() => end(line, flips ? `left the table, banked ${money(line)}` : 'left before flipping (stake back)'));
  const draw = msg => {
    a.innerHTML = `<div class="card center"><div class="small muted">ON THE LINE</div><div class="won" style="margin:2px 0">${money(line)}</div><div class="coin">${msg || '🪙'}</div><p class="small muted" style="margin:6px 0 10px">Call it. Win and it doubles to ${money(line * 2)}. Lose and it's gone. ${flips ? `Flip ${flips + 1} of ${MAX}.` : ''}</p><div class="row" style="gap:8px"><button class="btn" style="flex:1" data-c="h">🌿 Heads</button><button class="btn" style="flex:1" data-c="t">🧔 Tails</button></div>${flips ? `<button class="btn ghost block" style="margin-top:8px" data-a="bank">Bank ${money(line)} 💰</button>` : ''}<p class="small muted" style="margin:10px 0 0">House rule: if the coin lands on its edge (or Jack sneezes), Jack wins. 🙃</p></div>`;
    a.querySelectorAll('[data-c]').forEach(b => b.onclick = () => flip(b.dataset.c));
    const bk = a.querySelector('[data-a=bank]'); if (bk) bk.onclick = () => end(line, `banked after ${flips} flip${flips === 1 ? '' : 's'}`);
  };
  const flip = call => {
    a.querySelectorAll('button').forEach(b => b.disabled = true); const coin = a.querySelector('.coin'); coin.classList.add('spin'); buzz(8);
    let landed = false; const resolve = () => { if (landed) return; landed = true; onLeave(() => end(line, `left the table, banked ${money(line)}`));
      const r = rnd(100), side = r < EDGE ? 'edge' : (r % 2 ? 'h' : 't');
      if (side === call) { line *= 2; flips++; buzz(15); if (flips >= MAX) return end(line, `${flips} flips in a row! 🔥`, '🔥 Max flips! Banked automatically.'); draw(side === 'h' ? '🌿' : '🧔'); }
      else end(stake * (t.consolation || 0), side === 'edge' ? 'coin landed on its EDGE' : `lost on flip ${flips + 1}`, side === 'edge' ? '😱 It landed on its EDGE. Jack wins!' : `It was ${side === 'h' ? '🌿 Heads' : '🧔 Tails'}.`);
    };
    onLeave(resolve); setTimeout(resolve, 900);
  };
  draw();
}
// --- Higher or Lower: each right call multiplies what's on the line by fair odds minus 5%. Same card = Jack wins.
function cHilo(t, a, stake, end, onLeave) {
  const NM = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SU = ['♥', '♦', '♣', '♠'], MAX = t.maxCards || 8;
  let v = 1 + rnd(13), su = rnd(4), mult = 1, calls = 0;
  onLeave(() => end(stake * mult, calls ? `left the table, banked ×${Math.round(mult * 100) / 100}` : 'left before playing (stake back)'));
  const card = (x, s) => `<div class="hcard ${s < 2 ? 'red' : ''}"><b>${NM[x]}</b><span>${SU[s]}</span></div>`;
  const odds = up => { const p = (up ? 13 - v : v - 1) / 13; return p ? Math.round((t.factor || 0.95) / p * 100) / 100 : 0; };
  const draw = (prev) => {
    const hi = odds(true), lo = odds(false), cash = half(stake * mult);
    a.innerHTML = `<div class="card center"><div class="hrow">${prev || ''}${card(v, su)}</div><div class="small muted" style="margin:8px 0 2px">ON THE LINE</div><div class="won" style="margin:0">${money(cash)}</div><p class="small muted" style="margin:4px 0 10px">Will the next card be higher or lower? Same card = Jack wins.</p><div class="row" style="gap:8px"><button class="btn" style="flex:1" data-u="1" ${hi ? '' : 'disabled'}>⬆️ Higher<br><small>×${hi || '–'}</small></button><button class="btn" style="flex:1" data-u="0" ${lo ? '' : 'disabled'}>⬇️ Lower<br><small>×${lo || '–'}</small></button></div>${calls ? `<button class="btn ghost block" style="margin-top:8px" data-a="bank">Bank ${money(cash)} 💰</button>` : ''}</div>`;
    a.querySelectorAll('[data-u]').forEach(b => b.onclick = () => go(b.dataset.u === '1'));
    const bk = a.querySelector('[data-a=bank]'); if (bk) bk.onclick = () => end(stake * mult, `banked after ${calls} right call${calls === 1 ? '' : 's'} (×${Math.round(mult * 100) / 100})`);
  };
  const go = up => {
    const m = odds(up), n = 1 + rnd(13), ns = rnd(4), ok = up ? n > v : n < v, prev = card(v, su), ov = v;
    v = n; su = ns; buzz(8);
    if (!ok) return end(stake * (t.consolation || 0), `wrong call on card ${calls + 2}`, `<div class="hrow">${prev}${card(n, ns)}</div><div style="margin-top:6px">${n === ov ? 'Same card. Jack wins! 😈' : 'Wrong call!'}</div>`);
    mult *= m; calls++;
    if (calls >= MAX - 1) return end(stake * mult, `${calls} right calls in a row 🔥`, `<div class="hrow">${prev}${card(n, ns)}</div><div style="margin-top:6px">🔥 ${calls} right in a row! Banked automatically.</div>`);
    draw(`<div class="hcard old">${prev.replace(/^<div class="hcard[^"]*">/, '').replace(/<\/div>$/, '')}</div>`);
  };
  draw();
}
// --- Fruit Machine: 3 reels. The result is drawn from t.table first (so the odds are exact), then the reels are dressed to show it.
function cSlots(t, a, stake, end, onLeave) {
  const tab = t.table, tot = tab.reduce((x, r) => x + r.w, 0); let r = rnd(tot), res = tab[tab.length - 1];
  for (const row of tab) { if ((r -= row.w) < 0) { res = row; break; } }
  const SY = ['🍒', '🍋', '🍇', '🔔', '🌿', '⭐'], pick = ex => { let s; do { s = SY[rnd(SY.length)]; } while (ex.includes(s)); return s; };
  let reels;
  if (res.kind === 'three') reels = [res.sym, res.sym, res.sym];
  else if (res.kind === 'pair') { const s = pick(['🍒']), o = pick([s]); reels = shuffle([s, s, o]); }
  else if (res.kind === 'cherry') { const x = pick(['🍒']), y = pick(['🍒', x]); reels = shuffle(['🍒', x, y]); }
  else { const x = pick(['🍒']), y = pick(['🍒', x]), z = pick(['🍒', x, y]); reels = [x, y, z]; }
  a.innerHTML = `<div class="card center"><div class="slots3">${[0, 1, 2].map(() => `<div class="reel"><span>🎰</span></div>`).join('')}</div><button class="btn block" style="margin-top:12px">Pull the lever! 🎰</button><div class="ctable small muted">${tab.filter(x => x.label).map(x => `<span>${x.label} ×${x.m}</span>`).join('')}</div></div>`;
  const b = a.querySelector('.btn'), els = [...a.querySelectorAll('.reel span')];
  onLeave(() => end(stake, 'left before pulling (stake back)'));
  b.onclick = () => {
    b.disabled = true; let done_ = false; const land = () => { if (done_) return; done_ = true; clearInterval(spin); els.forEach((e, i) => e.textContent = reels[i]); b.remove(); end(stake * res.m, `${reels.join('')} ×${res.m}`); };
    onLeave(land);
    let stopped = 0; buzz(8);
    const spin = setInterval(() => els.slice(stopped).forEach(e => e.textContent = SY[rnd(SY.length)]), 90);
    setTimeout(() => { stopped = 1; els[0].textContent = reels[0]; buzz(6); }, 900);
    setTimeout(() => { stopped = 2; els[1].textContent = reels[1]; buzz(6); }, 1400);
    setTimeout(() => { clearInterval(spin); land(); }, 1950);
  };
}
// --- paid scratchcard: the result is drawn first (from the card's prize table), then the card is built to show it.
function cScratch(t, a, stake, end, onLeave) {
  const tab = t.table, tot = tab.reduce((x, r) => x + r.w, 0); let r = rnd(tot), res = tab[0];
  for (const row of tab) { if ((r -= row.w) < 0) { res = row; break; } }
  const syms = tab.filter(x => x.sym).map(x => x.sym), grid = [];
  if (res.sym) { grid.push(res.sym, res.sym, res.sym); }
  const pool = syms.filter(s => s !== res.sym); const cnt = {};
  while (grid.length < 9) { const s = pool[rnd(pool.length)]; if ((cnt[s] || 0) < 2) { cnt[s] = (cnt[s] || 0) + 1; grid.push(s); } }
  for (let i = grid.length - 1; i > 0; i--) { const j = rnd(i + 1); [grid[i], grid[j]] = [grid[j], grid[i]]; }
  a.innerHTML = `<div class="card center"><b>${esc(t.cardName || 'Scratch 3 the same to win')}</b><div class="small muted" style="margin:2px 0 8px">Tap each square to scratch it</div><div class="cscr">${grid.map((s, i) => `<button class="cs" data-i="${i}"><span>${s}</span></button>`).join('')}</div><button class="btn ghost block" data-a="all" style="margin-top:10px">Scratch them all</button><div class="ctable small muted">${tab.filter(x => x.sym && x.w).map(x => `<span>${x.sym}${x.sym}${x.sym} ${x.coupon ? '🎟️ coupon' : '×' + x.m}</span>`).join('')}</div></div>`;
  let left = 9, fin = false;
  onLeave(() => finish(true));
  const finish = now => {
    if (fin) return; fin = true;
    let what = res.sym ? `${res.sym}${res.sym}${res.sym}` : 'no match', extra = '';
    if (res.coupon) { const got = awardPool(pickPool(p => !p.lose && !p.again && !p.money), t.title); save(); extra = got ? `🎟️ Plus a coupon: <b>${esc(got)}</b>` : ''; what += got ? ` + coupon: ${got}` : ''; }
    if (now === true) end(stake * (res.m || 0), what + ' (left before scratching it all)', extra); else setTimeout(() => end(stake * (res.m || 0), what, extra), 500);
  };
  const scr = b => { if (b.classList.contains('off')) return; b.classList.add('off'); buzz(4); if (--left === 0) finish(); };
  a.querySelectorAll('.cs').forEach(b => b.onclick = () => scr(b));
  a.querySelector('[data-a=all]').onclick = () => a.querySelectorAll('.cs').forEach(scr);
}
// --- paid wheel: equal slices, so what you see is the real odds.
function cWheel(t, a, stake, end, onLeave) {
  onLeave(() => end(stake, 'left before spinning (stake back)'));
  const segs = t.segs, n = segs.length, R = 150, cols = ['#9caf88', '#e9b8a9', '#d9a94a', '#7f9a72', '#f2cfc4', '#b9c9a8', '#ecc777', '#c9d6bb'];
  const lab = s => s.coupon ? '🎟️ Coupon' + (s.m ? ` +×${s.m}` : '') : s.m ? `${s.e || ''}×${s.m}` : '❌';
  const paths = segs.map((s, k) => {
    const a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
    const x0 = R + R * Math.cos(a0), y0 = R + R * Math.sin(a0), x1 = R + R * Math.cos(a1), y1 = R + R * Math.sin(a1), tx = R + R * .64 * Math.cos(am), ty = R + R * .64 * Math.sin(am);
    return `<path d="M${R},${R} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z" fill="${!s.m && !s.coupon ? '#d8d6cc' : s.m >= 10 ? '#566f4c' : cols[k % cols.length]}" stroke="#fffdf8" stroke-width="2"/><text x="${tx}" y="${ty}" transform="rotate(${am * 180 / Math.PI} ${tx} ${ty})" text-anchor="middle" dominant-baseline="middle" font-size="${n > 14 ? 10 : 12}" font-weight="800" fill="${s.m >= 10 ? '#fff' : '#2f3a2c'}" font-family="DM Sans">${esc(lab(s))}</text>`;
  }).join('');
  a.innerHTML = `<div class="card center"><div class="small muted">Stake ${money(stake)} · ×2 = ${money(stake * 2)} back</div><div class="wheelwrap"><div class="pointer"></div><svg viewBox="0 0 300 300">${paths}<circle cx="150" cy="150" r="22" fill="#fffdf8"/><text x="150" y="152" text-anchor="middle" dominant-baseline="middle" font-size="20">🎰</text></svg></div><button class="btn block">Spin! 🎡</button></div>`;
  const svg = a.querySelector('svg'), b = a.querySelector('.btn');
  b.onclick = () => {
    b.disabled = true; const k = rnd(n), s = segs[k];
    svg.style.transform = `rotate(${360 * 6 + (360 - (k + .5) * (360 / n))}deg)`; buzz(10);
    let doneW = false; const land = () => { if (doneW) return; doneW = true;
      let extra = '', what = lab(s);
      if (s.coupon) { const got = awardPool(pickPool(p => !p.lose && !p.again && !p.money), t.title); save(); if (got) { extra = `🎟️ You won a coupon: <b>${esc(got)}</b>`; what += `: ${got}`; } }
      b.remove(); end(stake * (s.m || 0), what, extra);
    };
    onLeave(land); setTimeout(land, 4700);
  };
}

