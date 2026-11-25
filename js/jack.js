/* Becki's Birthday Getaway: jack. Public engine code only; all content, answers and keys live privately in Supabase. */
/* ---------- Jack mode: what she did on one challenge (view only) ---------- */
function jackTaskInfo(t) {
  const d = S.done[t.id], p = S.prefs[t.id], c = t.enc2 ? dec(t.enc2) : null;
  const sh = h(`<div class="sheet"><div class="wrap"><div class="sheethead"><button class="back" aria-label="Back">←</button><span class="pill">👀 View only</span></div>
    <div class="taskhero"><div class="emwrap sc-${t.cat}"><span class="em">${ico(t.emoji)}</span></div><h2>${esc(t.title)}</h2>${t.q || t.prompt ? `<p>${esc(t.q || t.prompt)}</p>` : ''}</div>
    <div class="card" style="line-height:1.6">${d ? `<b>✅ Done</b> · won <b>${money(won(t))}</b> of ${money(t.amount || 0)}<div class="small muted">${new Date(d.at).toLocaleString('en-GB')}</div>` : '<b>Not done yet</b>'}
      ${p ? `<div style="margin-top:10px;white-space:pre-line">${p.skipped ? '<i class="muted">She skipped this one</i>' : esc(p.answer)}</div>` : d && d.text ? `<div style="margin-top:10px;white-space:pre-line">${esc(d.text)}</div>` : ''}
      ${d && d.note ? `<div class="small muted" style="margin-top:6px">${esc(d.note)}</div>` : ''}
      ${c ? `<div class="small" style="margin-top:10px">🔑 Code: <b>${Object.entries(c).map(([k, v]) => (k === 'code' ? '' : k + ' ') + v).join(' · ')}</b></div>` : ''}</div></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  sh.querySelector('.back').onclick = () => { sh.remove(); document.body.style.overflow = ''; };
}


/* ---------- Jack panel extras (cloud): Discord settings, her photos, everything she answered ---------- */
function cloudPanel(g) {
  jackTripBox(g);
  const box = h(`<div><div class="sect">🔔 Discord</div><div class="card" data-dc style="line-height:1.5"><div class="small muted">Checking…</div></div>
    <div class="sect">📸 Her photos</div><div class="card" data-up><div class="small muted">Loading…</div></div>
    <div class="sect">📝 Everything she's answered</div><div class="card small" style="line-height:1.55">${scored().filter(t => S.done[t.id] && (S.done[t.id].text || S.prefs[t.id])).sort((x, y) => S.done[y.id].at - S.done[x.id].at).map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(t.title)}</b> <span class="muted">+${money(won(t))}</span><div style="white-space:pre-line">${esc(S.prefs[t.id] ? (S.prefs[t.id].skipped ? '(skipped)' : S.prefs[t.id].answer) : S.done[t.id].text)}</div></div>`).join('') || '<span class="muted">Nothing yet.</span>'}</div>
    <div class="sect">📱 This device</div><div class="card small"><button class="btn ghost block" data-out>Log out of Jack's view on this device</button></div></div>`);
  g.appendChild(box);
  const dc = box.querySelector('[data-dc]');
  const drawDc = st => {
    dc.innerHTML = `${st.webhook_set ? '<b style="color:var(--sage-3)">✅ Discord connected</b>' : '<b style="color:var(--red)">⚠️ No Discord link yet</b>'}<div class="small muted" style="margin:4px 0 10px">${st.webhook_set ? 'Paste a new link below to replace it.' : 'Discord → channel settings → Integrations → Webhooks → New Webhook → Copy URL.'} The link is stored privately in Supabase and never shown again.</div>
      <input class="field" data-hook placeholder="Paste the Discord webhook link" autocomplete="off"><div class="small" data-msg style="min-height:18px;margin:6px 0"></div>
      <div class="row"><button class="btn" data-save style="flex:1">Save link</button><button class="btn ghost" data-test style="flex:1" ${st.webhook_set ? '' : 'disabled'}>Send test</button></div>
      <div class="small muted" style="margin-top:8px">Last save from Becki: ${st.last_save ? new Date(st.last_save).toLocaleString('en-GB') : 'none yet'}</div>`;
    const msg = dc.querySelector('[data-msg]');
    dc.querySelector('[data-save]').onclick = async () => { const u = dc.querySelector('[data-hook]').value.trim(); if (!u) return; try { await window.CLOUD.setWebhook(u); msg.style.color = 'var(--sage-3)'; msg.textContent = 'Saved ✓'; drawDc(await window.CLOUD.status()); } catch (e) { msg.style.color = 'var(--red)'; msg.textContent = /discord/i.test(e.message) ? "That doesn't look like a Discord webhook link." : 'Could not save: ' + e.message; } };
    dc.querySelector('[data-test]').onclick = async () => { try { await window.CLOUD.test(); msg.style.color = 'var(--sage-3)'; msg.textContent = 'Test sent, check Discord 👀'; } catch (e) { msg.style.color = 'var(--red)'; msg.textContent = 'Failed: ' + e.message; } };
  };
  window.CLOUD.status().then(drawDc).catch(e => dc.innerHTML = `<span class="small" style="color:var(--red)">${esc(e.message)}</span>`);
  const up = box.querySelector('[data-up]');
  window.CLOUD.listUploads().then(list => {
    if (!list.length) { up.innerHTML = '<div class="small muted">No photos yet.</div>'; return; }
    up.innerHTML = `<div class="upgrid">${list.map(x => `<button class="upitem" data-id="${x.id}"><span>📸</span><b>${esc(x.caption || 'Photo')}</b><small>${new Date(x.at).toLocaleString('en-GB')}</small></button>`).join('')}</div>`;
    up.querySelectorAll('.upitem').forEach(b => b.onclick = async () => { b.querySelector('span').textContent = '⏳'; const data = await window.CLOUD.getUpload(+b.dataset.id); b.outerHTML = `<img class="upimg" src="${esc(data)}" alt="">`; });
  }).catch(e => up.innerHTML = `<span class="small" style="color:var(--red)">${esc(e.message)}</span>`);
  box.querySelector('[data-out]').onclick = () => { if (confirm('Log out of Jack\'s view on this device?')) window.CLOUD.logout(); };
}


/* ---------- Jack's corner (PIN) ---------- */
function jackCorner(unlocked) {
  const sh = h(`<div class="sheet"><div class="wrap"><div class="sheethead"><button class="back">←</button><span class="pill">🔒 Jack's corner</span></div><div class="game"></div></div></div>`);
  document.body.appendChild(sh); document.body.style.overflow = 'hidden';
  const close = () => { sh.remove(); document.body.style.overflow = ''; render(); };
  sh.querySelector('.back').onclick = close;
  const g = sh.querySelector('.game');
  g.innerHTML = `<p class="center muted">Jack only. Becki, no peeking! 👀</p>`;
  const showCorner = () => {
    const prefs = Object.entries(S.prefs);
    const md = `# ${poss(C.name)} birthday ideas\n_Exported ${new Date().toLocaleString('en-GB')}_\n\n` + prefs.map(([id, p]) => `## ${p.q}\n_${p.tag} · ${new Date(p.at).toLocaleString('en-GB')}_\n\n${p.skipped ? '_(skipped)_' : p.answer.split('\n').map(l => '> ' + l).join('\n')}\n`).join('\n');
    g.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><b>Pot so far</b><b>${money(earned())} / ${money(C.cap)}</b></div><div class="small muted">${doneCount()} of ${scored().length} challenges done${S.casino && S.casino.goes ? ` · 🎰 casino ${S.casino.net >= 0 ? '+' : '−'}${money(Math.abs(S.casino.net))} over ${S.casino.goes} goes (won ${money(S.casino.won || 0)}, lost ${money(S.casino.lost || 0)})` : ''}</div></div>
      <div class="sect">🎂 Birthday ideas (${prefs.length})</div>${prefs.length ? prefs.map(([, p]) => `<div class="clue" style="background:var(--card)"><b>${esc(p.q)}</b><div style="margin-top:6px;white-space:pre-line">${p.skipped ? '<i class="muted">skipped</i>' : esc(p.answer)}</div></div>`).join('') : '<div class="empty">None answered yet.</div>'}
      <div class="sect">✏️ Her answers (override)</div><div class="card small" data-ov style="line-height:1.5">${scored().filter(t => S.done[t.id] && !t.pref).sort((x, y) => S.done[y.id].at - S.done[x.id].at).map(t => `<div class="ovrow"><div style="flex:1;min-width:0"><b>${esc(t.title)}</b><div class="muted">${S.done[t.id].note ? esc(S.done[t.id].note) + ' · ' : ''}won ${money(won(t))} of ${money(t.amount || 0)}</div></div><div class="ovbtns">${S.done[t.id].frac < 1 ? `<button class="btn sm" data-full="${t.id}">Mark correct</button>` : '<span class="tag gold">Full £</span>'}<button class="btn ghost sm" data-reset="${t.id}">Let her retry</button></div></div>`).join('') || '<div class="muted">Nothing completed yet.</div>'}</div>
      <div class="sect">🔑 Codes to give her</div><div class="card small" style="line-height:1.9">${G.tasks.filter(t => t.enc2).map(t => { const c = dec(t.enc2); return `<div class="row" style="justify-content:space-between"><span>${esc(t.title)}${S.done[t.id] ? ' ✓' : ''}</span><b>${Object.entries(c).map(([k, v]) => (k === 'code' ? '' : k + ': ') + v).join(' · ')}</b></div>`; }).join('')}</div>
      <button class="btn block" data-a="dl" style="margin-top:12px">⬇️ Download as a file</button><button class="btn ghost block" data-a="dc" style="margin-top:8px">Send the file to Discord</button>
      <div class="sect">💾 Restore her progress</div><div class="card small" style="line-height:1.5">Got a <b>becki-save</b> file from Discord? Restore it on this device.<button class="btn ghost block" data-a="restore" style="margin-top:10px">Import save</button></div>`;
    g.querySelectorAll('[data-full]').forEach(b => b.onclick = () => { const t = G.tasks.find(x => x.id === b.dataset.full); S.done[t.id].frac = 1; S.done[t.id].note = 'Jack marked this correct ✓'; save(); discord(`✏️ Jack marked **${t.title}** as correct → full ${money(t.amount || 0)} (pot now ${money(earned())})`); buzz(15); sh.remove(); document.body.style.overflow = ''; render(); jackCorner(true); });
    g.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { const t = G.tasks.find(x => x.id === b.dataset.reset); if (!confirm(`Reset "${t.title}" so she can try again? Whatever she won on it comes off the pot.`)) return; delete S.done[t.id]; save(); discord(`↩️ Jack reset **${t.title}** so ${C.name} can retry (pot now ${money(earned())})`); sh.remove(); document.body.style.overflow = ''; render(); jackCorner(true); });
    g.querySelector('[data-a=dl]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })); a.download = 'becki-birthday-ideas.md'; a.click(); };
    g.querySelector('[data-a=restore]').onclick = () => { sh.remove(); document.body.style.overflow = ''; saveSheet(); };
    g.querySelector('[data-a=dc]').onclick = () => { discord(`🔒 Birthday ideas export (${prefs.length} answers)`, new File([md], 'becki-birthday-ideas.md', { type: 'text/markdown' })); alert('Sent!'); };
    if (window.CLOUD && window.JACK_MODE) cloudPanel(g);
  };
  if (unlocked) showCorner(); else pinPad(g, 'PIN', showCorner);
}

