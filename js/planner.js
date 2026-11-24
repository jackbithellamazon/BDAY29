/* Becki's Birthday Getaway: planner. Public engine code only; all content, answers and keys live privately in Supabase. */
/* ---------- trip planner v3 ---------- */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return ymd(x); };
const nights = P => P.from && P.to ? Math.round((new Date(P.to + 'T12:00') - new Date(P.from + 'T12:00')) / 864e5) : 0;
const dayName = d => new Date(d + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long' });
const fmtD = d => d ? new Date(d + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '?';
const fmtS = d => d ? new Date(d + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '?';
const PARTS = [['flights', '✈️', 'Flights'], ['stay', '🏨', 'Stay'], ['activity', '🎟️', 'Activity']];
const spent = P => PARTS.reduce((a, [k]) => a + (parseFloat(P[k + 'Price']) || 0), 0);
const destOf = P => DEST.find(d => d.city === P.dest);
const schoolOn = d => HOLS.school.find(x => d >= x.start && d <= x.end);
const bankOn = d => HOLS.bank.find(x => x.date === d);
const seasonOf = d => { const m = new Date(d + 'T12:00').getMonth(); return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; };
const enc = encodeURIComponent;
const isDirect = d => /direct/i.test(d.fromMAN || '') && !/no direct|not direct/i.test(d.fromMAN || '');
const links = P => {
  const d = destOf(P), city = enc(P.dest || ''), ad = P.adults || 2, iata = d?.iata || '', dated = P.from && P.to;
  return {
    sky: iata && dated ? `https://www.skyscanner.net/transport/flights/man/${iata.toLowerCase()}/${P.from.slice(2).replace(/-/g, '')}/${P.to.slice(2).replace(/-/g, '')}/?adultsv2=${ad}&adults=${ad}&rtn=1` : `https://www.skyscanner.net/transport/flights/man/${iata ? iata.toLowerCase() : 'anywhere'}/`,
    gfl: `https://www.google.com/travel/flights?q=${enc(`Flights from MAN to ${iata || P.dest || ''}${dated ? ` on ${P.from} through ${P.to}` : ''}`)}`,
    booking: `https://www.booking.com/searchresults.en-gb.html?ss=${city}${dated ? `&checkin=${P.from}&checkout=${P.to}` : ''}&group_adults=${ad}&no_rooms=1&group_children=0`,
    airbnb: `https://www.airbnb.co.uk/s/${city}/homes?${dated ? `checkin=${P.from}&checkout=${P.to}&` : ''}adults=${ad}`,
    gyg: `https://www.getyourguide.co.uk/s/?q=${city}`,
    trip: `https://www.tripadvisor.co.uk/Search?q=${city}%20things%20to%20do`,
    goog: `https://www.google.com/search?q=${enc('things to do in ' + (P.dest || ''))}`,
  };
};
const extBtn = (href, label, cls = '') => `<a class="btn ext ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label} ↗</a>`;

function placePage(d, onChoose) {
  const P = S.plan;
  const sh = h(`<div class="sheet place"><div class="phero"><button class="back">←</button><div class="pflag">${d.flag || '🌍'}</div><h1>${esc(d.city)}</h1><div class="pcountry">${esc(d.country)}</div></div><div class="wrap" style="padding-top:0"></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  let closed = false;
  const close = () => { if (closed) return; closed = true; sh.remove(); document.body.style.overflow = ''; removeEventListener('popstate', onPop); if (history.state?.place) history.back(); };
  const onPop = () => { if (!closed) { closed = true; sh.remove(); document.body.style.overflow = ''; } };
  history.pushState({ place: 1 }, ''); addEventListener('popstate', onPop);
  sh.querySelector('.back').onclick = close;
  const w = sh.querySelector('.wrap');
  const L = links({ dest: d.city, adults: P.adults });
  const W = d.weather || {};
  w.appendChild(h(`<div class="card pcard"><p style="margin:0 0 12px;line-height:1.55">${esc(d.blurb || '')}</p><div class="facts">
    <div><span>✈️</span><b>Getting there</b><small>${esc(d.getThere || d.fromMAN || 'Check Skyscanner')}</small></div>
    <div><span>🗓️</span><b>Best time</b><small>${esc(d.best || '–')}</small></div>
    <div><span>💷</span><b>Cost level</b><small>${esc(d.budget || '–')}</small></div>
    ${d.busy ? `<div><span>🔥</span><b>Busy times</b><small>${esc(d.busy)}</small></div>` : ''}</div>
    ${Object.keys(W).length ? `<div class="wx">${['spring', 'summer', 'autumn', 'winter'].filter(k => W[k]).map(k => `<div><small>${{ spring: '🌷 Spring', summer: '☀️ Summer', autumn: '🍂 Autumn', winter: '❄️ Winter' }[k]}</small><b>${esc(W[k])}</b></div>`).join('')}</div>` : ''}
    ${d.visited ? '<div class="fun" style="margin:12px 0 0">👀 You two have been here before. Fine to go back, but you\'ll need to tell Jack why!</div>' : ''}</div>`));
  const tabsDef = [['do', '⭐ Things to do'], ['parks', `🎢 Theme parks${d.themeParks?.length ? ` (${d.themeParks.length})` : ''}`], ['food', '🍔 Food'], ['love', '💕 Romantic']];
  const tb = h(`<div class="ptabs">${tabsDef.map(([k, l], i) => `<button data-k="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>`); w.appendChild(tb);
  const body = h('<div class="card pbody"></div>'); w.appendChild(body);
  const show = k => {
    tb.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    if (k === 'do') body.innerHTML = `<ol class="toplist">${(d.top || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol><div class="row" style="margin-top:12px">${extBtn(L.trip, 'Tripadvisor', 'flex1 sm')}${extBtn(L.goog, 'Google', 'flex1 sm blushx')}</div>`;
    if (k === 'parks') body.innerHTML = d.themeParks?.length ? d.themeParks.map(p => `<div class="park"><b>🎢 ${esc(p.name)}</b><div class="small muted">${esc(p.travel || '')}</div><div class="small">${esc(p.note || '')}</div></div>`).join('') + '<p class="small muted" style="margin:10px 0 0">Jack has already started packing. 🎢</p>' : '<p style="margin:0">No theme parks nearby. 😢 Jack will survive… probably.</p>';
    if (k === 'food') body.innerHTML = `${d.burger ? `<div class="park"><b>🍔 Burger mission</b><div class="small">${esc(d.burger)}</div></div>` : ''}${d.italian ? `<div class="park"><b>🍕 Italian fix</b><div class="small">${esc(d.italian)}</div></div>` : ''}<b class="small">🍴 Local must-eats</b><ul style="margin:6px 0 0;padding-left:18px;line-height:1.6">${(d.eats || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (k === 'love') body.innerHTML = `${d.romantic ? `<p style="margin:0 0 10px">💕 ${esc(d.romantic)}</p>` : ''}<div class="fun" style="margin:0">💡 ${esc(d.tip || '')}</div>`;
  };
  tb.querySelectorAll('button').forEach(b => b.onclick = () => { buzz(5); show(b.dataset.k); }); show('do');
  const cta = h(`<div class="pcta"><button class="btn block">${P.dest === d.city ? `✓ ${esc(d.city)} is chosen` : `Let's go to ${esc(d.city)} ${d.flag || ''}`}</button></div>`); sh.appendChild(cta);
  cta.querySelector('.btn').onclick = () => { close(); onChoose(d); };
}

function calendar(P, onChange) {
  const el = h('<div class="cal"></div>');
  let view = P.from ? new Date(P.from + 'T12:00') : new Date(); view.setDate(1);
  const today = ymd(new Date());
  const draw = () => {
    const y = view.getFullYear(), m = view.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let dd = 1; dd <= days; dd++) {
      const d = ymd(new Date(y, m, dd)), wd = (first + dd - 1) % 7;
      const cls = [d < today ? 'past' : '', wd > 4 ? 'wkend' : '', schoolOn(d) ? 'school' : '', bankOn(d) ? 'bank' : '', d === P.from ? 'start' : '', d === P.to ? 'end' : '', P.from && P.to && d > P.from && d < P.to ? 'in' : ''].join(' ');
      cells += `<button class="${cls}" data-d="${d}" ${d < today ? 'disabled' : ''}>${dd}</button>`;
    }
    el.innerHTML = `<div class="calhead"><button data-m="-1">‹</button><b>${view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b><button data-m="1">›</button></div><div class="calgrid dow">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => `<span>${x}</span>`).join('')}</div><div class="calgrid">${cells}</div><div class="legend"><span><i class="lg sel"></i>Your trip</span><span><i class="lg school"></i>School hols</span><span><i class="lg bank"></i>Bank hol</span><span><i class="lg wkend-sw"></i>Weekend</span></div>`;
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { view.setMonth(view.getMonth() + +b.dataset.m); buzz(5); draw(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      const d = b.dataset.d; buzz(6);
      if (!P.from || P.to || d <= P.from) { P.from = d; P.to = null; } else P.to = d;
      P.datesTBD = false; save(); draw(); onChange();
    });
  };
  draw();
  el.goto = d => { view = new Date(d + 'T12:00'); view.setDate(1); draw(); };
  return el;
}

function partBox(P, k, ph, onUpd) {
  const box = h(`<div class="card plan" style="margin-top:12px"><label>${k === 'flights' ? 'Which flights?' : k === 'stay' ? 'Where are we staying?' : 'The activity'}</label><input class="field" data-k="${k}Name" placeholder="${esc(ph)}" autocomplete="off">
    <div class="two"><div><label>Total price (£)</label><input class="field" data-k="${k}Price" type="number" inputmode="decimal" min="0" placeholder="0"></div><div><label>Link</label><input class="field" data-k="${k}Link" type="url" placeholder="Paste it here"></div></div>
    <label>Screenshot</label><div class="shot"><label class="btn ghost shotbtn">📸 ${P[k + 'Thumb'] ? 'Change' : 'Add a'} screenshot<input type="file" accept="image/*" hidden></label>${P[k + 'Thumb'] ? `<img src="${P[k + 'Thumb']}">` : '<span class="small muted">So Jack can see exactly what you picked</span>'}</div></div>`);
  box.querySelectorAll('[data-k]').forEach(i => { i.value = P[i.dataset.k] ?? ''; i.oninput = () => { P[i.dataset.k] = i.value; save(); onUpd(); }; });
  box.querySelector('input[type=file]').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const big = await shrinkTo(f, 1200, .82), thumb = await shrinkTo(f, 240, .7);
    P[k + 'Thumb'] = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(thumb); }); save();
    discord(`📸 **${C.name}**'s ${k} screenshot for ${P.dest || 'the trip'}${P[k + 'Name'] ? `: ${P[k + 'Name']}` : ''}`, new File([big], `${k}.jpg`, { type: 'image/jpeg' }));
    const shot = box.querySelector('.shot'); shot.querySelector('img')?.remove(); shot.querySelector('span')?.remove(); shot.insertAdjacentHTML('beforeend', `<img src="${P[k + 'Thumb']}">`); buzz(10); onUpd();
  };
  return box;
}
function shrinkTo(f, max, q) { return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => res(b || f), 'image/jpeg', q); }; img.onerror = () => res(f); img.src = URL.createObjectURL(f); }); }

function funRules(P, total) {
  const d = destOf(P), city = P.dest || 'wherever we go', park = d?.themeParks?.[0];
  return [
    ['💷', `The whole lot fits in your pot (${money(total)}). Flights can go a bit over if the hotel's cheaper, it's one big budget.`],
    ['🔗', 'Real prices, real links and screenshots, so Jack can book exactly what you picked.'],
    park ? ['🎢', `Jack may or may not be dragging you to ${park.name}. (He will.)`] : ['🚫', 'Jack is NOT allowed to drag you to a theme park. Promise. 🤞'],
    ['🍔', `We HAVE to find the best burger in ${city}${d?.burger ? `. Rumour says it's ${d.burger.split(/[(,–-]/)[0].trim()}` : ''}.`],
    ['😏', 'Holiday sex is mandatory. Non-negotiable.'],
    ['🧳', 'Jack carries all the bags. Every single one.'],
    ...(P.been === 'yes' ? [['🔁', 'You\'ve told Jack why we\'re going back.']] : []),
  ];
}

function planner(w, total) {
  const P = S.plan; P.step ||= 1; P.adults ||= 2;
  const STEPS = [['Where', '📍'], ['When', '🗓️'], ['Flights', '✈️'], ['Stay', '🏨'], ['Activity', '🎟️'], ['Book it', '🎫']];
  const go = n => { P.step = n; save(); render(); setTimeout(() => document.querySelector('.wiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  const done = [!!P.dest, !!(P.from && P.to) || P.datesTBD, !!(P.flightsName && +P.flightsPrice > 0), !!(P.stayName && +P.stayPrice > 0), !!(P.activityName && +P.activityPrice > 0), !!S.submitted];
  w.appendChild(h(`<div class="sect">🗺️ Plan the getaway</div>`));
  if (P.dest || P.from) w.appendChild(h(`<div class="tripline">${P.dest ? `<b>${destOf(P)?.flag || '📍'} ${esc(P.dest)}</b>` : '<span class="muted">Place: not picked yet</span>'}<span class="dot">·</span>${P.from && P.to ? `<b>${fmtS(P.from)} → ${fmtS(P.to)}</b>` : '<span class="muted">Dates: not picked yet</span>'}</div>`));
  const wz = h(`<div class="wiz"><div class="steps">${STEPS.map(([s, e], i) => `<button data-s="${i + 1}" class="${P.step === i + 1 ? 'on' : ''} ${done[i] ? 'past' : ''}"><i>${done[i] ? '✓' : e}</i><span>${s}</span></button>`).join('')}</div><div class="wbody"></div></div>`);
  w.appendChild(wz);
  wz.querySelectorAll('.steps button').forEach(b => b.onclick = () => { buzz(5); go(+b.dataset.s); });
  const body = wz.querySelector('.wbody');
  const budgetBar = () => { const sp = spent(P), left = total - sp; return h(`<div class="budgetbar"><div class="row" style="justify-content:space-between"><span class="small muted" style="font-weight:700">YOUR POT ${money(total)}</span><b style="${left < 0 ? 'color:var(--red)' : 'color:var(--sage-3)'}">${left < 0 ? `${money(-left)} over` : `${money(left)} left`}</b></div><div class="segbar">${PARTS.map(([k], i) => `<i class="s${i}" style="width:${Math.min(100, (parseFloat(P[k + 'Price']) || 0) / (total || 1) * 100)}%"></i>`).join('')}</div><div class="small muted">${PARTS.map(([k, e]) => `${e} ${P[k + 'Price'] ? money(+P[k + 'Price']) : '–'}`).join(' · ')}</div></div>`); };
  let bb = null; const refreshBudget = () => { if (!bb) return; const n = budgetBar(); bb.replaceWith(n); bb = n; };
  const nav = (ok, why) => {
    const n = h(`<div class="wnav"><div class="row">${P.step > 1 ? '<button class="btn ghost" data-a="b" style="flex:1">← Back</button>' : ''}<button class="btn" data-a="n" style="flex:2">Next →</button></div><div class="why small"></div></div>`);
    body.appendChild(n);
    const nb = n.querySelector('[data-a=n]'), wy = n.querySelector('.why');
    const upd = () => { const r = ok(); nb.disabled = !r; wy.innerHTML = r ? '' : `${esc(why)} · <a href="#" data-a="skip">Skip for now</a>`; const sk = wy.querySelector('[data-a=skip]'); if (sk) sk.onclick = e => { e.preventDefault(); go(P.step + 1); }; };
    nb.onclick = () => go(P.step + 1); const b = n.querySelector('[data-a=b]'); if (b) b.onclick = () => go(P.step - 1);
    upd(); return upd;
  };

  if (P.step === 1) {
    if (P.dest) { const d = destOf(P); const c = h(`<div class="chosen"><span class="cf">${d?.flag || '📍'}</span><div style="flex:1"><span class="small muted" style="font-weight:700">YOU PICKED</span><b>${esc(P.dest)}</b>${d ? `<span class="small muted">${esc(d.country)}</span>` : ''}</div>${d ? '<button class="btn ghost sm" data-a="more">See it</button>' : ''}</div>`); body.appendChild(c); const m = c.querySelector('[data-a=more]'); if (m) m.onclick = () => placePage(d, pick); }
    body.appendChild(h(`<div class="card"><p style="margin:0 0 10px;line-height:1.5">Anywhere in the world. Search a city or country, or tap a vibe, then tap a place to see what's there. <span class="muted">Not sure yet? Skip to dates and come back.</span></p><input class="field" data-q placeholder="🔎 Lisbon, Italy, beach, theme parks…" autocomplete="off"><div class="chips" data-v>${[['theme-parks', '🎢 Theme parks'], ['city', '🏙️ City'], ['beach', '🏖️ Beach'], ['food', '🍝 Food'], ['romantic', '💕 Romantic'], ['nature', '🏔️ Nature'], ['snow', '❄️ Snow'], ['longhaul', '🌏 Long-haul']].map(([k, l]) => `<button class="chip ${P.vibe === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div></div>`));
    const list = h('<div class="dgrid"></div>'); body.appendChild(list);
    function pick(d) { P.dest = d.city; P.country = d.country; save(); confetti(60); buzz([20, 30]); go(P.from && P.to ? 3 : 2); }
    const draw = () => {
      const q = squash(P.q || ''), v = P.vibe;
      let L = DEST.filter(d => (!q || squash(d.city + d.country).includes(q) || (d.vibes || []).some(x => squash(x).includes(q)) || (d.top || []).some(x => squash(x).includes(q)) || (d.themeParks || []).some(p => squash(p.name).includes(q))) && (!v || (v === 'longhaul' ? d.region === 'longhaul' : v === 'theme-parks' ? d.themeParks?.length : (d.vibes || []).includes(v))));
      list.innerHTML = '';
      if (P.q && P.q.trim().length > 1 && !DEST.some(d => squash(d.city) === q)) { const own = h(`<button class="dcard2 own"><span class="flag">🌍</span><b>Plan "${esc(P.q.trim())}"</b><span class="small muted">Not in the guide, but you can still go!</span></button>`); own.onclick = () => { P.dest = P.q.trim(); P.country = ''; save(); go(P.from && P.to ? 3 : 2); }; list.appendChild(own); }
      if (!L.length && !P.q) list.appendChild(h('<div class="empty">Nothing matches that vibe.</div>'));
      L.slice(0, 40).forEach(d => {
        const c = h(`<button class="dcard2 ${P.dest === d.city ? 'chosen' : ''}"><span class="flag">${d.flag || '🌍'}</span><b>${esc(d.city)}</b><span class="small muted">${esc(d.country)}</span><span class="badges">${isDirect(d) ? '<i>✈️ Direct</i>' : '<i>🔁 1 stop</i>'}${d.themeParks?.length ? '<i class="g">🎢 Parks</i>' : ''}<i>${esc(d.budget || '')}</i>${d.visited ? '<i class="b">Been!</i>' : ''}</span></button>`);
        c.onclick = () => { buzz(6); placePage(d, pick); };
        list.appendChild(c);
      });
    };
    const qi = body.querySelector('[data-q]'); qi.value = P.q || '';
    qi.oninput = () => { P.q = qi.value; P.vibe = null; body.querySelectorAll('[data-v] .chip').forEach(x => x.classList.remove('on')); save(); draw(); };
    body.querySelectorAll('[data-v] .chip').forEach(c => c.onclick = () => { P.vibe = P.vibe === c.dataset.k ? null : c.dataset.k; save(); body.querySelectorAll('[data-v] .chip').forEach(x => x.classList.toggle('on', x.dataset.k === P.vibe)); draw(); });
    draw();
    nav(() => !!P.dest, 'Pick a place to carry on');
  }

  if (P.step === 2) {
    const d = destOf(P);
    body.appendChild(h(`<div class="card"><p style="margin:0;line-height:1.5">When are we going${P.dest ? ` to <b>${esc(P.dest)}</b>` : ''}? Tap the day we fly out, then the day we fly back.</p><p class="small muted" style="margin:6px 0 0">We usually do Friday to Monday or Tuesday (4–5 days), but it's totally your call.${d?.best ? ` Best time for ${esc(d.city)}: ${esc(d.best)}.` : ''}</p></div>`));
    const sum = h('<div class="datesum"></div>');
    let upd = () => {};
    const cal = calendar(P, () => { drawSum(); upd(); });
    const wrap = h('<div class="card" style="margin-top:12px;padding:14px"></div>'); wrap.appendChild(cal);
    const chips = h(`<div class="chips" style="margin-top:12px">${[[3, 1, 'Fri → Mon'], [4, 1, 'Fri → Tue'], [4, 0, '4 nights'], [5, 0, '5 nights'], [7, 0, 'A week']].map(([n, fri, l]) => `<button class="chip" data-n="${n}" data-fri="${fri}">${l}</button>`).join('')}</div>`);
    wrap.appendChild(chips); wrap.appendChild(sum); body.appendChild(wrap);
    chips.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      let f = P.from || ymd(new Date(Date.now() + 14 * 864e5));
      if (+b.dataset.fri) { const x = new Date(f + 'T12:00'); x.setDate(x.getDate() + ((5 - x.getDay() + 7) % 7)); f = ymd(x); }
      P.from = f; P.to = addDays(f, +b.dataset.n); P.datesTBD = false; save(); buzz(8); cal.goto(P.from); drawSum(); upd();
    });
    function drawSum() {
      if (!P.from) { sum.innerHTML = '<p class="small muted center" style="margin:12px 0 0">Tap a fly-out day to start.</p>'; return; }
      if (!P.to) { sum.innerHTML = `<p class="small center" style="margin:12px 0 0">Flying out <b>${dayName(P.from)} ${fmtS(P.from).replace(/^\S+\s/, '')}</b>. Now tap the day we come home (or use a button above).</p>`; return; }
      const n = nights(P), notes = [];
      const days = []; for (let x = P.from; x <= P.to; x = addDays(x, 1)) days.push(x);
      const sh = [...new Set(days.map(schoolOn).filter(Boolean).map(x => x.name))], bh = days.map(bankOn).filter(Boolean).map(x => x.name);
      if (sh.length) notes.push(`<div class="note warn">🏫 Overlaps the ${esc(sh.join(' & '))}. Flights and hotels are usually pricier.</div>`);
      if (bh.length) notes.push(`<div class="note">🏦 Includes ${esc(bh.join(', '))}.</div>`);
      if (d?.weather) { const se = seasonOf(P.from); if (d.weather[se]) notes.push(`<div class="note">🌡️ ${esc(d.city)} in ${se}: around ${esc(String(d.weather[se]).replace(/^~\s*/, ''))}.</div>`); }
      if (d?.busy) notes.push(`<div class="note">🔥 ${esc(d.busy)}</div>`);
      sum.innerHTML = `<div class="dsum"><div><small>OUT</small><b>${dayName(P.from)}</b><span>${fmtS(P.from).replace(/^\S+\s/, '')}</span></div><div class="nn">${n} night${n === 1 ? '' : 's'}</div><div><small>BACK</small><b>${dayName(P.to)}</b><span>${fmtS(P.to).replace(/^\S+\s/, '')}</span></div></div>${notes.join('')}`;
    }
    drawSum();
    const ppl = h(`<div class="card plan" style="margin-top:12px"><div class="two"><div><label>How many of us?</label><input class="field" type="number" min="1" max="8" data-k="adults"></div><div><label>Who's coming?</label><input class="field" data-k="who" placeholder="Just us two?"></div></div></div>`);
    ppl.querySelectorAll('[data-k]').forEach(i => { i.value = P[i.dataset.k] ?? ''; i.oninput = () => { P[i.dataset.k] = i.value; save(); }; });
    body.appendChild(ppl);
    const tbd = h(`<button class="btn ghost block" style="margin-top:12px">🤷‍♀️ Not sure on dates yet</button>`); tbd.onclick = () => { P.datesTBD = true; P.from = P.to = null; save(); go(3); }; body.appendChild(tbd);
    upd = nav(() => !!(P.from && P.to && nights(P) > 0), 'Pick a fly-out and a fly-back day');
  }

  if (P.step === 3) {
    const L = links(P), d = destOf(P);
    body.appendChild(h(`<div class="card"><div class="route2"><div><small>FROM</small><b>MAN</b><span>Manchester</span></div><div class="pl">✈️</div><div style="text-align:right"><small>TO</small><b>${esc(d?.iata || '???')}</b><span>${esc(P.dest || 'Not picked')}</span></div></div>${d?.getThere || d?.fromMAN ? `<div class="note" style="margin-top:10px">🧭 ${esc(d.getThere || d.fromMAN)}</div>` : ''}<p class="small muted" style="margin:10px 0">${P.from && P.to ? `${fmtS(P.from)} → ${fmtS(P.to)} · ${P.adults} people. Both open with this filled in:` : 'No dates yet, so these open the route and you can browse the cheapest days:'}</p><div class="row">${extBtn(L.sky, 'Skyscanner', 'flex1')}${extBtn(L.gfl, 'Google Flights', 'flex1 gfl')}</div><p class="small muted" style="margin:10px 0 0">💡 Midweek is often cheaper. Return flights for everyone = one total price.</p></div>`));
    body.appendChild(partBox(P, 'flights', 'e.g. Jet2, Fri 07:10 → Tue 19:40', () => { refreshBudget(); upd(); }));
    bb = budgetBar(); body.appendChild(bb);
    const upd = nav(() => !!(P.flightsName && +P.flightsPrice > 0), 'Add the flight name and price to carry on');
  }

  if (P.step === 4) {
    const L = links(P), d = destOf(P);
    body.appendChild(h(`<div class="card"><p style="margin:0 0 10px;line-height:1.5">${P.from && P.to ? `${nights(P)} night${nights(P) === 1 ? '' : 's'} in <b>${esc(P.dest || '?')}</b> for ${P.adults}.` : `Somewhere to stay in <b>${esc(P.dest || '?')}</b>.`} These open with everything filled in:</p><div class="row">${extBtn(L.booking, 'Booking.com', 'flex1')}${extBtn(L.airbnb, 'Airbnb', 'flex1 blushx')}</div>${d?.tip ? `<div class="note" style="margin-top:12px">💡 ${esc(d.tip)}</div>` : ''}</div>`));
    body.appendChild(partBox(P, 'stay', 'e.g. Casa do Sol, Alfama', () => { refreshBudget(); upd(); }));
    bb = budgetBar(); body.appendChild(bb);
    const upd = nav(() => !!(P.stayName && +P.stayPrice > 0), 'Add where we\'re staying and the price');
  }

  if (P.step === 5) {
    const L = links(P), d = destOf(P);
    const ideas = d ? [...(d.themeParks || []).map(p => ['🎢', p.name]), ...(d.top || []).map(t => ['⭐', t])] : [];
    body.appendChild(h(`<div class="card"><p style="margin:0 0 10px;line-height:1.5">One big activity, Jack's treat. ${ideas.length ? `Tap an idea for ${esc(P.dest)} or find your own:` : 'Find something amazing:'}</p>${ideas.length ? `<div class="ideas">${ideas.map(([e, x]) => `<button class="idea"><span>${e}</span>${esc(x)}</button>`).join('')}</div>` : ''}<div class="row" style="margin-top:12px">${extBtn(L.gyg, 'GetYourGuide', 'flex1')}${extBtn(L.trip, 'Tripadvisor', 'flex1 blushx')}</div></div>`));
    const pb = partBox(P, 'activity', 'e.g. Sunset sailing trip', () => { refreshBudget(); upd(); }); body.appendChild(pb);
    body.querySelectorAll('.idea').forEach(b => b.onclick = () => { P.activityName = b.textContent.slice(b.querySelector('span').textContent.length).trim(); save(); pb.querySelector('[data-k=activityName]').value = P.activityName; body.querySelectorAll('.idea').forEach(x => x.classList.toggle('on', x === b)); buzz(6); upd(); });
    bb = budgetBar(); body.appendChild(bb);
    const upd = nav(() => !!(P.activityName && +P.activityPrice > 0), 'Add the activity and its price');
  }

  if (P.step === 6) {
    const sp = spent(P), left = total - sp, d = destOf(P);
    const miss = []; if (!P.dest) miss.push(['place', 1]); if (!(P.from && P.to && nights(P) > 0)) miss.push(['dates', 2]); PARTS.forEach(([k, , l], i) => { if (!P[k + 'Name'] || !(+P[k + 'Price'] > 0)) miss.push([l.toLowerCase(), i + 3]); });
    if (!P.been) miss.push(['been before?', 6]); if (P.been === 'yes' && !(P.beenWhy || '').trim()) miss.push(['why we\'re going back', 6]);
    body.appendChild(h(`<div class="card summary"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><span class="small muted" style="font-weight:700">THE PLAN</span><h3 class="serif" style="font-size:26px;margin:2px 0">${esc(P.dest || '?')}</h3><div class="small muted">${P.from && P.to ? `${dayName(P.from)} ${fmtS(P.from).replace(/^\S+\s/, '')} → ${dayName(P.to)} ${fmtS(P.to).replace(/^\S+\s/, '')} · ${nights(P)} nights` : 'No dates yet'}</div></div><span style="font-size:40px">${d?.flag || '🌍'}</span></div>
      <div class="revlist">${PARTS.map(([k, e, l]) => `<div class="rl">${P[k + 'Thumb'] ? `<img src="${P[k + 'Thumb']}">` : `<span class="ri">${e}</span>`}<span style="flex:1">${esc(P[k + 'Name'] || l)}</span><b>${P[k + 'Price'] ? money(+P[k + 'Price']) : '–'}</b></div>`).join('')}<div class="rl tot"><span style="flex:1"><b>Total</b></span><b>${money(sp)}</b></div></div></div>`));
    body.appendChild(budgetBar());
    const been = h(`<div class="card" style="margin-top:12px"><b>Have either of us been to ${esc(P.dest || 'this place')} before?</b><div class="seg"><button data-v="no" class="${P.been === 'no' ? 'on' : ''}">Nope, brand new 🆕</button><button data-v="yes" class="${P.been === 'yes' ? 'on' : ''}">Yes, one or both 🔁</button></div>${P.been === 'yes' ? `<label class="small" style="font-weight:600;display:block;margin:12px 0 6px">Why are we going back? Sell it to Jack 😄</label><textarea class="field" data-k="beenWhy" placeholder="e.g. You've never been and you'd love it because…" style="min-height:90px"></textarea>` : ''}</div>`);
    been.querySelectorAll('.seg button').forEach(b => b.onclick = () => { P.been = b.dataset.v; save(); render(); });
    const bw = been.querySelector('[data-k=beenWhy]'); if (bw) { bw.value = P.beenWhy || ''; bw.oninput = () => { P.beenWhy = bw.value; save(); subUpd(); }; }
    body.appendChild(been);
    body.appendChild(h(`<div class="card rules"><b class="serif" style="font-size:19px">📜 The holiday rules</b>${funRules(P, total).map(([e, t]) => `<div class="rule"><span>${e}</span><p>${esc(t)}</p></div>`).join('')}</div>`));
    if (left < 0) { const more = scored().length - doneCount(); const o = h(`<div class="card" style="margin-top:12px;border:2px solid var(--red)"><b style="color:var(--red)">You're ${money(-left)} over your pot.</b><p class="small muted" style="margin:6px 0 10px">${more ? `Swap something for a cheaper option, or go and win more: there are ${more} challenges left.` : 'Swap something for a cheaper option to bring it under.'}</p>${more ? '<button class="btn ghost block">Reopen challenges and win more 💪</button>' : ''}</div>`); if (more) o.querySelector('.btn').onclick = () => { S.locked = false; save(); tab = 'home'; cat = null; render(); scrollTo(0, 0); }; body.appendChild(o); }
    const mm = h('<div class="fun" style="margin-top:12px"></div>'); body.appendChild(mm);
    const sb = h(`<button class="btn block blush big" style="margin-top:12px">✈️ Book my boarding pass</button>`); body.appendChild(sb);
    function subUpd() {
      const m2 = miss.filter(([m]) => !(m === 'why we\'re going back' && (P.beenWhy || '').trim()));
      mm.style.display = m2.length ? '' : 'none';
      mm.innerHTML = `Still needed: ${m2.map(([m, s]) => s === 6 ? `<b>${m}</b>` : `<a href="#" data-go="${s}">${m}</a>`).join(', ')}`;
      mm.querySelectorAll('[data-go]').forEach(a => a.onclick = e => { e.preventDefault(); go(+a.dataset.go); });
      sb.disabled = m2.length > 0 || left < 0;
    }
    subUpd();
    sb.onclick = () => {
      S.submitted = true; S.editing = false; save(); setTimeout(() => autoBackup('trip booked'), 50);
      const Lk = k => `${P[k + 'Link'] ? `\n   ${P[k + 'Link']}` : ''}${P[k + 'Thumb'] ? ' (screenshot sent)' : ''}`;
      discord(`✈️ **${poss(C.name).toUpperCase()} GETAWAY PLAN IS IN!** (pot ${money(total)}, spent ${money(sp)}, ${money(left)} spare)\n📍 **${P.dest}**${P.country ? `, ${P.country}` : ''}\n📅 ${fmtD(P.from)} → ${fmtD(P.to)} (${nights(P)} nights) · ${P.adults} people${P.who ? ` · ${P.who}` : ''}\n✈️ ${P.flightsName}: **${money(+P.flightsPrice)}**${Lk('flights')}\n🏨 ${P.stayName}: **${money(+P.stayPrice)}**${Lk('stay')}\n🎟️ ${P.activityName}: **${money(+P.activityPrice)}**${Lk('activity')}\n${P.been === 'yes' ? `🔁 Been before. Why we're going back: ${P.beenWhy}` : '🆕 Somewhere new'}`);
      confetti(240); buzz([30, 60, 30, 60, 90]); render(); scrollTo(0, 0);
    };
  }
}

function boardingPass(w, total) {
  const P = S.plan, d = destOf(P), code = s => (s || '???').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '???';
  w.appendChild(h(`<div class="sect">🎫 Your boarding pass</div>`));
  w.appendChild(h(`<div class="pass"><div class="ph"><b>🌿 Birthday Air</b><span class="small" style="opacity:.85">Flight BDAY-23</span></div>
    <div class="route"><div class="rc"><small>From</small><div class="c">MAN</div><div class="small muted">Manchester</div></div><div class="pl">✈️</div><div class="rc" style="text-align:right"><small>To</small><div class="c">${esc(d?.iata || code(P.dest))}</div><div class="small muted">${esc(P.dest)}</div></div></div>
    <div class="grid"><div><small>Passengers</small><b>${esc(C.name)} + ${esc(C.from)}${P.who && !/^just us/i.test(P.who) ? ' + ' + esc(P.who) : ''}</b></div><div><small>Gate</small><b>B-DAY</b></div><div><small>Departs</small><b>${esc(fmtD(P.from))}</b></div><div><small>Returns</small><b>${esc(fmtD(P.to))}</b></div><div><small>Seat</small><b>TBC (window seat for the birthday girl)</b></div><div><small>Nights</small><b>${nights(P)}</b></div><div><small>Staying at</small><b>${esc(P.stayName)}</b></div><div><small>The big activity</small><b>${esc(P.activityName)}</b></div><div><small>Luggage</small><b>${esc(poss(C.from))} problem</b></div><div><small>Status</small><b style="color:var(--sage-3)">Sent to ${esc(C.from)} ✓</b></div></div>
    <div class="tear"></div><div class="stamp">${funRules(P, total).slice(2, 5).map(([e]) => e).join(' ')} Rules accepted</div><div class="bars"></div></div>`));
  w.appendChild(h(`<p class="small muted center" style="margin-top:14px">Screenshot it, frame it, wave it at ${esc(C.from)}. 💚</p>`));
  const e = h(`<button class="btn ghost block" style="margin-top:6px">Change my plan</button>`); w.appendChild(e);
  e.onclick = () => { S.editing = true; S.plan.step = 6; save(); render(); };
}

// ===== 🗺️ Dream Trip Quiz: Becki's big data-farm. Saves every answer to S.tq (her cloud save), so she can stop and come back.
// Stages run activities -> stay -> holiday type -> places -> getting there (last) -> dream big. Then an "analysing" screen scores every destination.
const TQ = () => (G && G.tripQuiz) || null;
const tqA = () => (S.tq ||= {});
const tqAll = () => (TQ() ? TQ().stages.flatMap(s => s.qs) : []);
const tqDone = q => { const v = tqA()[q.id]; return v != null && v !== '' && !(Array.isArray(v) && !v.length); };
const tqCount = s => { const qs = s ? s.qs : tqAll(); return [qs.filter(tqDone).length, qs.length]; };
function tripQuizCard(w) {
  if (!TQ()) return;
  const [n, N] = tqCount(), pct = N ? Math.round(n / N * 100) : 0;
  const c = h(`<div class="card tqcard"><div class="row" style="gap:12px;align-items:center"><span style="font-size:34px">🗺️</span><div style="flex:1;min-width:0"><b class="serif" style="font-size:19px">Your Dream Trip Quiz</b><div class="small muted">${n ? `${n} of ${N} answered · it saves as you go` : `${N} quick questions so Jack (and I!) can find your perfect trip`}</div></div></div><div class="potbar" style="margin:10px 0"><i style="width:${pct}%"></i></div><div class="row" style="gap:8px"><button class="btn" style="flex:1" data-a="go">${n ? 'Carry on ✨' : 'Start the quiz ✨'}</button>${n >= 40 ? '<button class="btn ghost" style="flex:1" data-a="res">🔍 My matches</button>' : ''}</div></div>`);
  c.querySelector('[data-a=go]').onclick = () => openTripQuiz();
  const r = c.querySelector('[data-a=res]'); if (r) r.onclick = () => openTripQuiz('results');
  w.appendChild(c);
}
function openTripQuiz(start) {
  const sh = h(`<div class="sheet"><div class="wrap"><div class="sheethead"><button class="back" aria-label="Back">←</button><span class="pill">🗺️ Dream Trip Quiz</span></div><div class="tq"></div></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  const box = sh.querySelector('.tq'); let view = 'stages', st = null, idx = 0;
  const close = () => { sh.remove(); document.body.style.overflow = ''; render(); };
  sh.querySelector('.back').onclick = () => { if (view === 'q' || view === 'results') { view = 'stages'; draw(); } else close(); };
  const stages = TQ().stages;
  const drawStages = () => {
    const [n, N] = tqCount();
    box.innerHTML = `<div class="taskhero"><h2>Find your perfect trip</h2><p>Answer as many as you like, in any order. It all saves, so come back whenever. Activities first, flights last!</p></div><div class="small muted center" style="margin:-6px 0 12px">${n} of ${N} answered</div><div class="tqstages"></div>${n >= 40 ? '<button class="btn block" data-a="res" style="margin-top:14px">🔍 Find my matches</button>' : `<p class="small muted center" style="margin-top:14px">Answer 40+ to unlock your matches (${Math.max(0, 40 - n)} to go)</p>`}`;
    const list = box.querySelector('.tqstages');
    stages.forEach((s, k) => { const [a, b] = tqCount(s); const btn = h(`<button class="tqstage ${a === b ? 'done' : ''}"><span class="em">${s.e}</span><span class="tt"><b>${k + 1}. ${esc(s.title)}</b><span class="small muted">${a === b ? 'All done ✓' : `${a} of ${b}`}</span></span><span class="st">${a === b ? '✓' : '›'}</span></button>`);
      btn.onclick = () => { st = s; idx = Math.max(0, s.qs.findIndex(q => !tqDone(q))); view = 'q'; draw(); }; list.appendChild(btn); });
    const r = box.querySelector('[data-a=res]'); if (r) r.onclick = () => { view = 'results'; draw(); };
  };
  const answer = (q, v) => {
    tqA()[q.id] = v; save(); buzz(8);
    const next = st.qs.findIndex((x, k) => k > idx && !tqDone(x));
    if (next >= 0) idx = next; else if (st.qs.every(tqDone)) { stageDone(st); view = 'stages'; } else idx = Math.min(st.qs.length - 1, idx + 1);
    draw();
  };
  const stageDone = s => {
    const loves = s.qs.filter(q => ['love', 'want'].includes(tqA()[q.id])).map(q => q.t).slice(0, 15);
    const texts = s.qs.filter(q => q.k === 'text' && tqA()[q.id]).map(q => `> ${q.t}\n> **${String(tqA()[q.id]).slice(0, 300)}**`);
    discord(`${s.id === 'g' ? '🔒 **30TH DATA (Jack only)** · ' : ''}🗺️ **${C.name}** finished Trip Quiz stage **${s.title}**${loves.length ? `\n💚 Loves: ${loves.join(' · ')}` : ''}${texts.length ? '\n' + texts.join('\n') : ''}`);
    const m = h(`<div class="modal"><div class="card center"><div style="font-size:44px">${s.e}</div><h2 style="margin:6px 0">${esc(s.title)}: done!</h2><p class="muted" style="margin:0 0 10px">Saved. Pick another stage whenever you're ready.</p><button class="btn block">Nice 🙌</button></div></div>`);
    document.body.appendChild(m); confetti(70); m.querySelector('.btn').onclick = () => m.remove();
  };
  const drawQ = () => {
    const q = st.qs[idx], v = tqA()[q.id], [a, b] = tqCount(st);
    let body = '';
    if (q.k === 'swipe') body = `<div class="tqbtns">${[['love', '😍', 'Love it'], ['meh', '🤷', 'Maybe'], ['no', '🙅', 'Not for me']].map(([k, e, l]) => `<button class="tqb ${v === k ? 'on' : ''}" data-v="${k}"><span>${e}</span><small>${l}</small></button>`).join('')}</div>`;
    else if (q.k === 'country') body = `<div class="tqbtns four">${[['want', '🤩', 'Want to go'], ['loved', '✅', 'Been, loved it'], ['been', '👍', 'Been, once is enough'], ['no', '🙅', 'Not for me']].map(([k, e, l]) => `<button class="tqb ${v === k ? 'on' : ''}" data-v="${k}"><span>${e}</span><small>${l}</small></button>`).join('')}</div>`;
    else if (q.k === 'pick') body = `<div class="tqopts">${q.o.map(o => `<button class="opt ${v === o ? 'on' : ''}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    else if (q.k === 'multi') body = `<div class="chips">${q.o.map(o => `<button class="chip ${(v || []).includes(o) ? 'on' : ''}" data-m="${esc(o)}">${esc(o)}</button>`).join('')}</div><button class="btn block" data-a="mnext" style="margin-top:14px">Next →</button>`;
    else body = `<textarea class="field" rows="4" placeholder="Type here…">${esc(v || '')}</textarea><button class="btn block" data-a="tnext" style="margin-top:10px">Save →</button>`;
    box.innerHTML = `<div class="rbtop"><span>${st.e} ${esc(st.title)}</span><b>${a} / ${b}</b></div><div class="prog"><i style="width:${a / b * 100}%"></i></div>
      <div class="card tqq">${q.flag ? `<div style="font-size:30px">${q.flag}</div>` : ''}<h3>${esc(q.t)}</h3>${q.s ? `<p class="muted">${esc(q.s)}</p>` : ''}${q.info ? `<div class="small muted">${q.info.map(esc).join(' · ')}</div>` : ''}${q.k === 'multi' && q.max && q.max < 12 ? `<div class="small muted">Pick up to ${q.max}</div>` : ''}</div>
      ${body}<div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost sm" style="flex:1" data-a="prev" ${idx ? '' : 'disabled'}>← Back</button><button class="btn ghost sm" style="flex:1" data-a="skip">Skip</button><button class="btn ghost sm" style="flex:1" data-a="out">Save & exit</button></div>`;
    box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => answer(q, b.dataset.v));
    const sel = new Set(v || []);
    box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const o = b.dataset.m; if (sel.has(o)) sel.delete(o); else { if (q.max && sel.size >= q.max) return buzz([30, 30]); sel.add(o); } b.classList.toggle('on', sel.has(o)); buzz(5); });
    const mn = box.querySelector('[data-a=mnext]'); if (mn) mn.onclick = () => answer(q, [...sel]);
    const tn = box.querySelector('[data-a=tnext]'); if (tn) tn.onclick = () => { const t = box.querySelector('textarea').value.trim(); if (t) answer(q, t); else box.querySelector('[data-a=skip]').click(); };
    box.querySelector('[data-a=prev]').onclick = () => { idx = Math.max(0, idx - 1); draw(); };
    box.querySelector('[data-a=skip]').onclick = () => { idx = (idx + 1) % st.qs.length; draw(); };
    box.querySelector('[data-a=out]').onclick = () => { view = 'stages'; draw(); };
  };
  const drawResults = () => {
    box.innerHTML = `<div class="tqload"><div class="tqspin">🗺️</div><h2>Analysing your answers…</h2><p class="muted" data-l></p></div>`;
    const lines = [`Reading your ${tqCount()[0]} answers…`, 'Matching 120 destinations…', 'Checking the weather by month…', 'Adding Jack\'s two pence… 🧔', 'Picking your top matches…'];
    let k = 0; const el = box.querySelector('[data-l]'); el.textContent = lines[0];
    const t = setInterval(() => { k++; if (k < lines.length) el.textContent = lines[k]; else { clearInterval(t); showResults(); } }, 900);
  };
  const showResults = () => {
    const res = tqScore().slice(0, 6);
    S.tqResults = { at: Date.now(), top: res.map(r => ({ city: r.d.city, pct: r.pct })) }; save();
    discord(`🔍 **${C.name}** ran her Trip Quiz matches:\n${res.map((r, i) => `${i + 1}. ${r.d.flag} ${r.d.city} (${r.pct}%)`).join('\n')}`);
    box.innerHTML = `<div class="taskhero"><h2>Your top matches 💚</h2><p>Based on everything you've told me so far. Answer more and these get sharper.</p></div><div class="tqres"></div><button class="btn ghost block" data-a="more" style="margin-top:12px">Answer more questions</button>`;
    const list = box.querySelector('.tqres');
    res.forEach((r, i) => list.appendChild(h(`<div class="card tqhit"><div class="row" style="gap:10px;align-items:center"><span style="font-size:30px">${r.d.flag}</span><div style="flex:1;min-width:0"><b>${i + 1}. ${esc(r.d.city)}</b><div class="small muted">${esc(r.d.country)} · ${esc(r.d.fromMAN || '')}</div></div><span class="tqpct">${r.pct}%</span></div><p class="small" style="margin:8px 0 0">${esc(r.d.blurb || '')}</p>${r.why.length ? `<div class="small muted" style="margin-top:6px">Why: ${esc(r.why.join(', '))}</div>` : ''}${r.jack ? `<div class="fun" style="margin-top:8px">🧔 Jack's take: ${esc(r.jack)}</div>` : ''}</div>`)));
    box.querySelector('[data-a=more]').onclick = () => { view = 'stages'; draw(); };
  };
  const draw = () => { if (view === 'stages') drawStages(); else if (view === 'q') drawQ(); else drawResults(); sh.scrollTo && sh.scrollTo(0, 0); };
  if (start === 'results') view = 'results';
  draw();
}
// Scoring: every answer nudges tag weights; each destination scores on its vibes, parks, months, flight time, and her direct swipes.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function tqMonths(best) {
  const out = new Set(); String(best || '').toLowerCase().split(',').forEach(p => { const m = p.match(/([a-z]{3})[a-z]*\s*[–-]\s*([a-z]{3})/); if (m) { let a = MONTHS.indexOf(m[1]), b = MONTHS.indexOf(m[2]); if (a >= 0 && b >= 0) { let k = a; do { out.add(k); k = (k + 1) % 12; } while (k !== (b + 1) % 12); } } else { const s = p.match(/([a-z]{3})/); if (s && MONTHS.indexOf(s[1]) >= 0) out.add(MONTHS.indexOf(s[1])); } });
  return out;
}
function tqScore() {
  const A = tqA(), all = tqAll(), W = {}, add = (t, n) => { W[t] = (W[t] || 0) + n; };
  const val = { love: 2, meh: .4, no: -1.5 };
  all.forEach(q => { const v = A[q.id]; if (q.k === 'swipe' && v in val && !q.dest) q.tags.forEach(t => add(t, val[v])); });
  const topMap = { 'Theme parks': 'themepark', 'Zoos & animals': 'zoo', 'Spa & baths': 'spa', 'Beach & pool': 'beach', 'Food & drink': 'food', 'History & sightseeing': 'culture', 'Nature & views': 'nature', 'Nightlife': 'nightlife', 'Adventure': 'adventure', 'Shopping': 'shopping' };
  all.forEach(q => { if (q.k === 'multi' && Array.isArray(A[q.id])) A[q.id].forEach(o => topMap[o] && add(topMap[o], 3)); });
  const pick = t => { const q = all.find(x => x.t === t); return q ? A[q.id] : null; };
  if (pick('City break or Beach holiday?') === 'City break') add('city', 3); if (pick('City break or Beach holiday?') === 'Beach holiday') add('beach', 3);
  if (pick('Theme park on the trip or No theme parks this time?') === 'Theme park on the trip') add('themepark', 3);
  if (pick('Theme park on the trip or No theme parks this time?') === 'No theme parks this time') add('themepark', -3);
  if (pick('Warm and sunny or Cold and cosy?') === 'Cold and cosy') add('snow', 3);
  add('culture', (W.history || 0) * .8); add('romantic', 0);
  const wantNew = pick('Somewhere new or Somewhere we loved?') === 'Somewhere new';
  const monthsQ = all.find(q => q.k === 'multi' && /months/.test(q.t)), months = (A[monthsQ?.id] || []).map(m => MONTHS.indexOf(m.toLowerCase()));
  const maxFlight = { 'Up to 2 hours': 2.2, 'Up to 3 hours': 3.2, 'Up to 4 hours': 4.3, 'Up to 5–6 hours': 6.3 }[pick('Longest flight you\'d happily do for this trip?')] || 99;
  const country = {}; all.forEach(q => { if (q.k === 'country' && A[q.id]) country[q.country] = A[q.id]; });
  const dswipe = {}; all.forEach(q => { if (q.dest && A[q.id]) dswipe[q.dest] = A[q.id]; });
  const jack = (TQ().jack || {});
  const kw = { zoo: /zoo|aquarium|safari|loro|bioparc|wildlife/i, spa: /spa|bath|therm|hammam|lagoon/i, waterpark: /water ?park|aqua|siam/i };
  const scored = (window.DEST || []).filter(d => d.region === 'europe').map(d => {
    let s = 0; const why = [];
    (d.vibes || []).forEach(v => { const k = v === 'theme-parks' ? 'themepark' : v; s += W[k] || 0; if ((W[k] || 0) >= 2) why.push(k.replace('themepark', 'theme parks')); });
    if ((d.themeParks || []).length) s += (W.themepark || 0) * .6;
    const top = (d.top || []).join(' ') + ' ' + (d.themeParks || []).map(p => p.name + ' ' + (p.note || '')).join(' ');
    for (const k in kw) if (kw[k].test(top) && (W[k] || 0) > 0) { s += W[k] * .8; why.push(k === 'waterpark' ? 'water park' : k); }
    if (months.length) { const bm = tqMonths(d.best); if ([...bm].some(m => months.includes(m))) { s += 2; why.push('good in your months'); } else s -= 2; }
    const fh = (String(d.fromMAN || '').match(/~?(\d+)h(\d+)?/) || []); const hrs = fh[1] ? +fh[1] + (+fh[2] || 0) / 60 : 3; if (hrs > maxFlight) s -= 25;
    const c = country[d.country]; if (c === 'want') { s += 4; why.push(`you want to go to ${d.country}`); } else if (c === 'loved') s += wantNew ? -1 : 2; else if (c === 'been') s -= wantNew ? 3 : 1; else if (c === 'no') s -= 8;
    const sw = dswipe[d.city]; if (sw === 'love') { s += 7; why.unshift('you loved it'); } else if (sw === 'meh') s += 1; else if (sw === 'no') s -= 10;
    if (d.visited) s += wantNew ? -6 : 1;
    if (jack[d.city]) s += 1.5;
    return { d, s, why: [...new Set(why)].slice(0, 4), jack: jack[d.city] || '' };
  }).sort((a, b) => b.s - a.s);
  const best = Math.max(1, scored[0]?.s || 1);
  scored.forEach(r => r.pct = Math.max(30, Math.min(99, Math.round(60 + 39 * r.s / best))));
  return scored;
}

