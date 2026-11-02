// Renders KaTeX math, Prism code and Mermaid diagrams. Load with `defer` after the KaTeX and Prism scripts.
let mermaid;

// Also used by main.js for content added later (Mixed Review).
window.renderMath = el => window.renderMathInElement?.(el, {
  delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
  throwOnError: false,
});

async function renderMermaid() {
  const nodes = [...document.querySelectorAll('.mermaid')];
  if (!nodes.length) return;
  mermaid ??= (await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')).default;
  // Keep the source so the diagram can be redrawn when the theme changes.
  nodes.forEach(n => { n.dataset.src ??= n.textContent; n.removeAttribute('data-processed'); n.textContent = n.dataset.src; });
  mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default' });
  await mermaid.run({ nodes });
}

document.addEventListener('DOMContentLoaded', () => {
  window.renderMath(document.body);
  window.Prism?.highlightAll();
  renderMermaid();
});
document.addEventListener('themechange', renderMermaid);
