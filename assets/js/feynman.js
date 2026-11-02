// Feynman timer + checklist (localStorage "feynman:<slug>"), notes ("notes:<slug>")
// and review schedule ("review:<slug>"). The slug comes from <body data-slug="...">. Nothing leaves the browser.

// --- Review schedule: each "I studied this today" moves to the next interval, then stays at 30 days.
const REVIEW_DAYS = [3, 7, 14, 30];
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function getReview(slug) {
  try { return JSON.parse(localStorage.getItem('review:' + slug)); } catch { return null; }
}
function saveReview(slug) {
  const prev = getReview(slug), now = new Date();
  if (prev?.lastStudied === isoDate(now)) return prev; // one step per day
  const stage = Math.min((prev?.stage ?? 0) + 1, REVIEW_DAYS.length);
  const next = new Date(now);
  next.setDate(next.getDate() + REVIEW_DAYS[stage - 1]);
  const r = { lastStudied: isoDate(now), nextReview: isoDate(next), stage };
  try { localStorage.setItem('review:' + slug, JSON.stringify(r)); return r; } catch { return null; }
}
const isDue = slug => { const r = getReview(slug); return !!r && r.nextReview <= isoDate(new Date()); };

document.addEventListener('DOMContentLoaded', () => {
  // Badges on dashboard and hub cards: <h3 data-review-slugs="slug-a slug-b">.
  document.querySelectorAll('[data-review-slugs]').forEach(el => {
    const n = el.dataset.reviewSlugs.split(/\s+/).filter(isDue).length;
    if (n) el.insertAdjacentHTML('beforeend', ` <span class="review-badge">${n > 1 ? n + ' due' : 'Due for review'}</span>`);
  });

  const slug = document.body.dataset.slug;
  const box = document.getElementById('feynman');
  if (!slug || !box) return;

  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };

  // --- Review box and due banner
  const banner = document.getElementById('review-banner');
  const reviewStatus = document.getElementById('review-status');
  function showReview(extra = '') {
    const r = getReview(slug);
    banner.hidden = !isDue(slug);
    reviewStatus.textContent = (r
      ? `Last studied ${r.lastStudied} · next review ${r.nextReview} (step ${r.stage} of ${REVIEW_DAYS.length}).`
      : 'Not studied yet. Click the button after your first study session.') + extra;
  }
  document.getElementById('review-done').onclick = () => {
    const before = getReview(slug)?.lastStudied;
    const r = saveReview(slug);
    if (!r) return showReview(' Could not save: browser storage is blocked.');
    showReview(before === r.lastStudied ? ' Already logged today.' : '');
  };
  showReview();

  // --- Timer: while running we store the end time, so a refresh keeps counting.
  const KEY = 'feynman:' + slug, FULL = 25 * 60 * 1000;
  let s = { remaining: FULL, endsAt: null, checks: [] };
  try { s = { ...s, ...JSON.parse(get(KEY)) }; } catch {}
  const save = () => set(KEY, JSON.stringify(s));
  const left = () => (s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remaining);

  const display = box.querySelector('[data-timer]');
  const btn = a => box.querySelector(`[data-action="${a}"]`);
  let tick = null;

  function render() {
    const ms = left();
    if (s.endsAt && ms === 0) { s = { ...s, remaining: 0, endsAt: null }; save(); clearInterval(tick); }
    const sec = Math.ceil(ms / 1000);
    display.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    btn('start').disabled = !!s.endsAt;
    btn('pause').disabled = !s.endsAt;
    box.querySelector('[data-done]').hidden = ms !== 0;
  }
  function run() { clearInterval(tick); tick = setInterval(render, 250); }

  btn('start').onclick = () => { if (left() === 0) s.remaining = FULL; s.endsAt = Date.now() + s.remaining; save(); run(); render(); };
  btn('pause').onclick = () => { s.remaining = left(); s.endsAt = null; save(); clearInterval(tick); render(); };
  btn('reset').onclick = () => { s.remaining = FULL; s.endsAt = null; save(); clearInterval(tick); render(); };
  if (s.endsAt) run();
  render();

  box.querySelectorAll('input[type="checkbox"]').forEach((c, i) => {
    c.checked = !!s.checks[i];
    c.onchange = () => { s.checks[i] = c.checked; save(); };
  });

  // --- Notes
  const area = document.getElementById('notes');
  if (!area) return;
  const NKEY = 'notes:' + slug, status = document.getElementById('notes-status');
  let saved = area.value = get(NKEY) ?? '';
  const say = t => { status.textContent = t; };
  document.getElementById('notes-save').onclick = () => {
    if (set(NKEY, area.value)) { saved = area.value; say('Saved.'); } else say('Could not save: browser storage is blocked.');
  };
  document.getElementById('notes-clear').onclick = () => {
    if (!confirm('Clear your notes for this topic?')) return;
    area.value = saved = '';
    try { localStorage.removeItem(NKEY); } catch {}
    say('Cleared.');
  };
  area.oninput = () => say(area.value === saved ? '' : 'Unsaved changes');
  addEventListener('beforeunload', e => { if (area.value !== saved) e.preventDefault(); });
});
