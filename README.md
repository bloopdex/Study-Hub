# Study Hub

A static study website: 9 hubs, 90 topic pages, and a printable prep sheet. Every topic page teaches with a worked example first, then gives Quick Recall checkpoints, self-check questions, a Feynman timer, a notes box and a review schedule.

There is no backend, no build step and no tracking. Nothing you type leaves your browser.

## Open the site

- **Double-click `index.html`.** Everything works from `file://`.
- **Or serve the folder** with any static server:

  ```bash
  python -m http.server 8080
  # then open http://localhost:8080
  ```

## Offline use

CSS and JavaScript (Tailwind, KaTeX, Prism, Mermaid, Google Fonts) are loaded from CDNs, so the first visit needs an internet connection. After that, the browser cache serves them. All images are local SVG files in `assets/images/`.

## Layout

```
index.html              dashboard: 4 groups of hub cards
prep-sheet.html         one compact block per topic page, printable (A4)
topics/<hub>.html       9 hubs: sorting, searching, linear-structures, trees, graphs,
                        paradigms, ml-foundations, ml-algorithms, dl
topics/<page>.html      90 topic pages
assets/css/style.css    custom styles on top of Tailwind
assets/js/main.js       theme toggle, table of contents, Mixed Review
assets/js/mdx-runtime.js KaTeX, Prism and Mermaid rendering
assets/js/feynman.js    timer, checklist, notes, review schedule, due badges
assets/js/review-bank.js Mixed Review questions (10 per hub)
assets/images/          one SVG diagram per topic page
```

## Add a new topic page

1. Copy an existing page in the same hub, for example `topics/sorting-bubble-sort.html`, to `topics/<new-slug>.html`.
2. Change `<title>`, `data-slug="<new-slug>"` on `<body>` (this key stores the notes, timer and review data), and the hub link in the header.
3. Replace the content but keep the section order:
   - summary card;
   - prerequisites, then the analogy;
   - How it works, which runs: worked example, rule, Quick Recall, code, Definition, Mermaid diagram, then How fast;
   - common mistakes, then Try it yourself;
   - Did you know?, key points;
   - self-check questions (6 to 10, the last one about what to leave out);
   - resources.
4. Add a card for the page to its hub (`topics/<hub>.html`). The `data-review-slugs` attribute on the card's `<h3>` turns on the "due for review" badge.
5. Optionally add questions to the hub's list in `assets/js/review-bank.js`.

## Add an image

Put the file in `assets/images/`, named `<slug>-<n>.svg` or `.png`. Reference it with a relative path from the page:

```html
<figure>
  <img src="../assets/images/my-topic-1.svg" alt="What the picture shows" width="600" height="300">
  <figcaption>One sentence on what to notice.</figcaption>
</figure>
```

## Where your data is stored

Everything lives in your browser's `localStorage`, under these keys:

| Key | Contents |
|---|---|
| `theme` | `light` or `dark` |
| `notes:<slug>` | the text of the notes box |
| `feynman:<slug>` | timer state and checklist ticks (a running timer survives a reload) |
| `review:<slug>` | `lastStudied`, `nextReview` and `stage` (reviews after 3, 7, 14, then 30 days) |

This data never leaves your machine and is not shared between browsers or devices. Clearing the site data in your browser erases it.
