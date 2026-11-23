/* Becki's Birthday Getaway: helpers + answer checking. Public engine code only; all content, answers and keys live privately in Supabase. */
/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const ICONS = { merc: '<svg viewBox="0 0 100 100" width="1em" height="1em" style="vertical-align:-0.12em"><circle cx="50" cy="50" r="46" fill="none" stroke="#2f3a2c" stroke-width="6"/><path d="M50 8 L57 50 L50 54 L43 50 Z M50 54 L86 72 L82 78 L46 58 Z M50 54 L14 72 L18 78 L54 58 Z" fill="#2f3a2c"/></svg>' };
const ico = e => ICONS[String(e || '').replace(/^svg:/, '')] && String(e).startsWith('svg:') ? ICONS[String(e).slice(4)] : esc(e);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const poss = n => n + (/s$/i.test(n) ? "'" : "'s");
const money = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const buzz = (p = 15) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dec = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.split('').reverse().join(''))))); } catch { return null; } };


/* ---------- smart answer checking ---------- */
// lower-case, strip accents/punctuation/spaces, squash stretched letters ("pooooo" -> "po", "poo" -> "po")
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const squash = s => norm(s).replace(/([a-z])\1+/g, '$1');
const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); } return d[m][n]; };
function matches(guess, answers, strict) {
  const words = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').split(/[^a-z0-9]+/).map(w => w.replace(/([a-z])\1+/g, '$1')).filter(Boolean);
  const g = squash(guess), gs = ' ' + words(guess).join(' ') + ' ';
  if (!g) return false;
  return answers.some(a => {
    const n = squash(a); if (!n) return false;
    if (n === g) return true;
    const num = /\d/.test(n + g);                            // numbers get no typo leeway (25 is not 5)
    if (!strict && !num && n.length >= 5 && lev(n, g) <= 1) return true;        // small typo
    if (!strict && !num && n.length >= 9 && lev(n, g) <= 2) return true;        // longer answers, 2 typos
    const ns = ' ' + words(a).join(' ') + ' ';
    if (ns.trim().length >= 2 && gs.includes(ns)) return true; // whole words inside a sentence: "she likes it cold", not "25" for "5"
    return false;
  });
}
const hasAll = (guess, groups) => groups.every(grp => matches(guess, grp) || grp.some(w => squash(guess).includes(squash(w))));

