// Flashcard session for <body data-slug>: flip, rate, repeat "Again" cards, then export to Anki.
// Load with `defer` after flashcards.js and mdx-runtime.js. Mounts into [data-flashcards].
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.querySelector('[data-flashcards]');
  const slug = document.body.dataset.slug;
  const cards = window.FLASHCARDS?.[slug];
  if (!mount || !cards?.length) return;

  // History survives reloads: last rating per card and one summary per finished session.
  const key = 'flashcards:' + slug;
  const load = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
  const save = s => { try { localStorage.setItem(key, JSON.stringify(s)); } catch {} };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  mount.innerHTML = `
    <p class="fc-progress text-center text-sm text-soft" aria-live="polite"></p>
    <button class="flashcard" aria-label="Flashcard: press to flip">
      <span class="fc-inner">
        <span class="fc-face fc-front"><span class="fc-text"></span><span class="fc-hint">Click or press Space to flip</span></span>
        <span class="fc-face fc-back"><span class="fc-text"></span></span>
      </span>
    </button>
    <div class="fc-rate" hidden>
      <button class="btn" data-rate="again">Again</button>
      <button class="btn" data-rate="hard">Hard</button>
      <button class="btn" data-rate="good">Good</button>
      <button class="btn" data-rate="easy">Easy</button>
    </div>
    <p class="fc-summary text-center font-medium" role="status" hidden></p>
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <button class="btn btn-sm fc-restart" hidden>Start a new session</button>
      <button class="btn btn-sm fc-export">Export these cards to Anki</button>
    </div>
    <dialog class="fc-dialog card" aria-labelledby="fc-dialog-title">
      <h3 id="fc-dialog-title" class="text-lg">Export to Anki</h3>
      <p class="mt-2 text-sm text-soft">Copy the text and save it as a <code>.txt</code> file. Then open Anki → File → Import → choose that file → choose Tab as separator → map column 1 to Front, column 2 to Back.</p>
      <label class="sr-only" for="fc-export-text">Flashcards, tab-separated</label>
      <textarea id="fc-export-text" class="field mt-3" rows="8" readonly wrap="off"></textarea>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button class="btn btn-primary fc-copy">Copy to clipboard</button>
        <form method="dialog"><button class="btn">Close</button></form>
        <span class="fc-copied text-sm text-soft" aria-live="polite"></span>
      </div>
    </dialog>`;

  const $ = s => mount.querySelector(s);
  const card = $('.flashcard'), rate = $('.fc-rate'), progress = $('.fc-progress');
  const summary = $('.fc-summary'), restart = $('.fc-restart');
  let queue, again, pos, round, first;

  function start() {
    queue = shuffle(cards.map((_, i) => i)); again = []; pos = 0; round = 1; first = {};
    summary.hidden = restart.hidden = true; card.hidden = false;
    show();
  }

  function show() {
    const c = cards[queue[pos]];
    $('.fc-front .fc-text').textContent = c.front;
    $('.fc-back .fc-text').textContent = c.back;
    window.renderMath?.(card);
    card.classList.remove('is-flipped');
    rate.hidden = true;
    progress.textContent = (round > 1 ? 'Again round: ' : '') + (pos + 1) + ' / ' + queue.length;
  }

  function finish() {
    const n = { again: 0, hard: 0, good: 0, easy: 0 };
    Object.values(first).forEach(r => n[r]++);  // first rating of each card in this session
    const s = load();
    (s.sessions ??= []).push({ at: new Date().toISOString(), ...n });
    save(s);
    summary.textContent = `You rated ${n.good + n.easy} Good or Easy` + (n.hard ? `, ${n.hard} Hard` : '') + `, ${n.again} Again.`;
    card.hidden = rate.hidden = true;
    summary.hidden = restart.hidden = false;
    progress.textContent = 'Session complete';
  }

  // The card is a <button>, so Space and Enter flip it natively once it has focus.
  card.onclick = () => { card.classList.toggle('is-flipped'); rate.hidden = false; };

  rate.onclick = e => {
    const r = e.target.dataset.rate;
    if (!r) return;
    const i = queue[pos];
    first[i] ??= r;
    // "Again" always comes back; in the repeat rounds a card stays until it is Good or Easy.
    if (r === 'again' || (round > 1 && r === 'hard')) again.push(i);
    const s = load(), day = new Date().toLocaleDateString('en-CA');  // local YYYY-MM-DD, read by the dashboard
    (s.ratings ??= {})[cards[i].front] = r;
    (s.daily ??= {})[day] = (s.daily[day] || 0) + 1;
    save(s);
    if (++pos >= queue.length) {
      if (!again.length) return finish();
      queue = shuffle(again); again = []; pos = 0; round++;
    }
    show();
    card.focus({ preventScroll: true });
  };

  restart.onclick = start;

  // Anki export: front TAB back per line, KaTeX $..$ turned into Anki's MathJax \(..\).
  const dialog = $('.fc-dialog'), text = $('#fc-export-text'), copied = $('.fc-copied');
  const anki = s => s.replace(/\$([^$]+)\$/g, '\\($1\\)');
  text.value = cards.map(c => anki(c.front) + '\t' + anki(c.back)).join('\n');
  $('.fc-export').onclick = () => { copied.textContent = ''; dialog.showModal(); };
  $('.fc-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(text.value); }
    catch { text.select(); document.execCommand('copy'); }
    copied.textContent = 'Copied.';
  };

  start();
});
