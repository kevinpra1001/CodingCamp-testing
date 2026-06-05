# Tech Stack

## Stack

- **HTML** — single `index.html` file, no templating engine
- **CSS** — single stylesheet (one `.css` file, no preprocessors)
- **JavaScript** — Vanilla JS only (one `.js` file, no frameworks, no libraries, no npm)

## Constraints

- Zero third-party dependencies — no CDN links, no npm packages, no inline vendored code
- Exactly one CSS file and one JS file; no additional stylesheets or scripts
- No build step, no bundler, no transpiler
- Must work over `file://` protocol and as a browser extension page
- No network requests after the HTML file finishes loading
- Must load and render within 1 second on a mid-range device

## Storage

- `localStorage` API only — Tasks and Quick Links each stored under their own consistent key as JSON arrays

## Commands

There is no build system. Open `index.html` directly in a browser or serve it with any static file server for development:

```bash
# Quick local dev server (Python, no install needed)
python -m http.server 8080

# Or Node-based
npx serve .
```

No test runner is configured. Manual browser testing across Chrome, Firefox, Edge, and Safari is required.
