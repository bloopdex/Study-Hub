// Loaded in <head> (not deferred) so the theme is set before first paint.
// The `dark` class drives Tailwind's dark: variants, data-theme drives the CSS tokens.
const root = document.documentElement;
const setTheme = dark => { root.classList.toggle('dark', dark); root.dataset.theme = dark ? 'dark' : 'light'; };
try { setTheme(localStorage.getItem('theme') !== 'light'); } catch { setTheme(true); }

// Print in light colours, then restore the user's theme.
let wasDark = false;
addEventListener('beforeprint', () => { wasDark = root.classList.contains('dark'); setTheme(false); });
addEventListener('afterprint', () => setTheme(wasDark));

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const dark = !root.classList.contains('dark');
    setTheme(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
    document.dispatchEvent(new Event('themechange'));
  }));

  // Reading progress bar: only pages that include .progress-bar (individual topic pages).
  const bar = document.querySelector('.progress-bar');
  if (bar) addEventListener('scroll', () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.setProperty('--progress', max > 0 ? Math.min(scrollY / max, 1) : 0);
  }, { passive: true });

  // Cards fade in as they enter the viewport. Skipped entirely under reduced motion.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('fade-in'); io.unobserve(e.target); }
    }));
    document.querySelectorAll('.card, .callout, .quick-recall').forEach(el => { el.classList.add('fade-in'); io.observe(el); });
  }

  // Mixed review on hub pages (<body data-hub="...">): 5 random questions from window.REVIEW_BANK[hub].
  const bank = window.REVIEW_BANK?.[document.body.dataset.hub];
  const reviewBtn = document.getElementById('mixed-review');
  if (bank && reviewBtn) reviewBtn.onclick = () => {
    const pool = [...bank];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const ol = document.getElementById('mixed-review-list');
    ol.replaceChildren(...pool.slice(0, 5).map(({ q, a }) => {
      const li = document.createElement('li');
      li.innerHTML = '<strong></strong><details><summary class="cursor-pointer text-accent">Sample answer</summary><p class="mt-1"></p></details>';
      li.querySelector('strong').textContent = q;
      li.querySelector('p').textContent = a;
      return li;
    }));
    window.renderMath?.(ol);
    document.getElementById('mixed-review-panel').hidden = false;
    reviewBtn.textContent = 'Shuffle again';
  };

  // Table of contents built from the h2/h3 headings of #content.
  const list = document.getElementById('toc-list');
  if (!list) return;
  document.querySelectorAll('#content h2, #content h3').forEach(h => {
    h.id ||= h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = 'block py-1 toc-link ' + (h.tagName === 'H3' ? 'pl-4 text-soft' : 'font-medium');
    li.append(a);
    list.append(li);
  });
  if (matchMedia('(min-width: 1024px)').matches) document.getElementById('toc').open = true;
});
