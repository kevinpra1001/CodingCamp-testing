# Implementation Plan: Todo Life Dashboard

## Overview

Implement a client-side, single-page productivity dashboard using only vanilla HTML, CSS, and JavaScript. The implementation is delivered as three files (`index.html`, `style.css`, `app.js`) plus a standalone `test.html` for property-based tests. Each widget is a plain JS object with an `init()` method; the `Dashboard_App` coordinator bootstraps them on `DOMContentLoaded`. All persistent state goes directly to `localStorage` on every mutation.

---

## Tasks

- [x] 1. Scaffold static HTML and link assets
  - Create `index.html` with semantic landmark sections for each widget (`<section>` or `<div>` with IDs: `greeting-widget`, `timer-widget`, `todo-widget`, `quicklinks-widget`)
  - Add `<link>` to `style.css` and `<script src="app.js" defer>` — no other external resources
  - Add all static control markup: timer buttons (Start / Stop / Reset), task input + Add button, quick-links label/URL inputs + Add button
  - Verify the page loads cleanly over `file://` with no console errors
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 2. Implement `Dashboard_App` coordinator and storage helpers
  - [x] 2.1 Implement `Dashboard_App` object in `app.js`
    - Define `TASKS_KEY = 'tdl_tasks'` and `LINKS_KEY = 'tdl_links'` constants
    - Implement `loadJSON(key)`: wraps `JSON.parse(localStorage.getItem(key))` in try/catch; returns `[]` on any error, missing key, or non-array result
    - Implement `saveJSON(key, array)`: calls `localStorage.setItem`; catches `QuotaExceededError` and any other exception; returns `true` on success, `false` on failure
    - Implement `init()`: calls each widget's `init()` in order (Greeting → Timer → Todo → QuickLinks) inside a `DOMContentLoaded` listener
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_


- [x] 3. Implement `Greeting_Widget`
  - [x] 3.1 Implement `Greeting_Widget` core functions
    - Implement `_getGreeting(hours)`: pure function mapping hour (0–23) → one of the four greeting strings per the boundary table
    - Implement `_formatTime(date)`: pure function returning `"HH:MM:SS"` with zero-padding
    - Implement `_formatDate(date)`: pure function returning `"Weekday, Month DD, YYYY"` in English
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_


  - [x] 3.4 Implement `Greeting_Widget.init()` and `_tick()`
    - `init()` renders time, date, and greeting immediately into the DOM nodes, then starts a 1-second `setInterval` calling `_tick()`
    - `_tick()` updates the time, date, and greeting DOM nodes on every interval
    - Wire into `Dashboard_App.init()` call order
    - _Requirements: 1.1, 1.2, 1.8_

- [x] 4. Implement `Timer_Widget`
  - [x] 4.1 Implement `Timer_Widget` pure helper and state
    - Define `_seconds = 1500` and `_intervalId = null` as widget-private state
    - Implement `_formatTime(seconds)`: pure function returning `"MM:SS"` with zero-padding for any integer in [0, 1500]
    - Implement `_render()`: updates the MM:SS display and sets button `disabled` states per the button state matrix (Idle: Start ✓ / Stop ✗ / Reset ✓; Running: Start ✗ / Stop ✓ / Reset ✓; Paused: Start ✓ / Stop ✗ / Reset ✓)
    - _Requirements: 2.1, 2.3, 2.7, 2.8_


  - [x] 4.3 Implement `Timer_Widget._start()`, `_stop()`, `_reset()`, `_tick()`
    - `_start()`: guards `_intervalId !== null` (double-start prevention); sets interval calling `_tick()` every 1 s; calls `_render()`
    - `_stop()`: clears interval, sets `_intervalId = null`, calls `_render()`
    - `_reset()`: clears interval, sets `_intervalId = null`, restores `_seconds = 1500`, calls `_render()`
    - `_tick()`: decrements `_seconds` by 1; when `_seconds === 0` calls `_reset()` (auto-reset to 25:00); otherwise calls `_render()`
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.9_


  - [x] 4.5 Implement `Timer_Widget.init()`
    - Render initial "25:00" display; attach click listeners to Start, Stop, and Reset buttons
    - Wire into `Dashboard_App.init()` call order
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 5. Checkpoint — Core widgets verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `Todo_Widget` — data layer and CRUD
  - [x] 6.1 Implement `Todo_Widget` task creation helpers
    - Define `_tasks = []` as widget-private state
    - Implement ID generation: `crypto.randomUUID()` with `Date.now().toString()` fallback
    - Implement `_addTask(description)`: trims input; rejects empty/whitespace-only (no state change, retain focus); creates a `Task` object `{ id, description, done: false, createdAt: Date.now() }`; pushes to `_tasks`; calls `_save()`; calls `_renderList()`
    - _Requirements: 3.1, 3.2, 3.3, 3.11_


  - [x] 6.4 Implement `_toggleTask(id)`, `_deleteTask(id)`
    - `_toggleTask(id)`: finds task by id; flips `.done`; calls `_save()`; re-renders the affected item in DOM
    - `_deleteTask(id)`: splices task from `_tasks`; calls `_save()`; removes the corresponding DOM node
    - _Requirements: 3.4, 3.5, 3.10, 3.11_



  - [x] 6.6 Implement `_beginEdit(id)`, `_confirmEdit(id, newText)`, `_cancelEdit(id)`
    - `_beginEdit(id)`: replaces the task label with a pre-filled `<input>` in the DOM
    - `_confirmEdit(id, newText)`: trims input; rejects empty/whitespace-only (restores original label, no save); updates only `.description` on the matching task; calls `_save()`; calls `_renderList()`
    - `_cancelEdit(id)`: restores original label without saving (Escape key or blur)
    - _Requirements: 3.6, 3.7, 3.8, 3.9_

 

- [x] 7. Implement `Todo_Widget` — rendering, persistence, and error handling
  - [x] 7.1 Implement `_renderList()`, `_renderItem(task)`, `_save()`, `_showStorageError()`
    - `_renderItem(task)`: creates a task DOM node with checkbox toggle, label (strikethrough when `done`), Edit button, Delete button, and `data-id` attribute
    - `_renderList()`: clears the task list container and re-renders all items using `_renderItem`
    - `_save()`: calls `Dashboard_App.saveJSON(TASKS_KEY, _tasks)`; on `false` return calls `_showStorageError()`
    - `_showStorageError()`: renders an inline error message in the widget's error container; clears it on next successful save
    - _Requirements: 3.4, 3.5, 3.11, 3.12_

  - [x] 7.2 Implement `Todo_Widget.init()`
    - Loads `_tasks` from `Dashboard_App.loadJSON(TASKS_KEY)`; calls `_renderList()`; attaches all event listeners (add form submit/Enter, task list delegation for toggle/edit/delete)
    - Wire into `Dashboard_App.init()` call order
    - _Requirements: 3.1, 3.13_

- [x] 8. Implement `QuickLinks_Widget` — validation and CRUD
  - [x] 8.1 Implement `QuickLinks_Widget._validate(label, url)`
    - Validates in order (first failure wins): label non-empty after trim AND ≤ 50 chars; url non-empty after trim AND ≤ 2048 chars; url begins with `http://` or `https://`
    - Returns `{ valid: true }` when all rules pass; `{ valid: false, message: <string> }` on first failure
    - _Requirements: 4.3, 4.4_


  - [x] 8.3 Implement `_addLink(label, url)`, `_deleteLink(id)`
    - `_addLink(label, url)`: calls `_validate`; on failure calls `_showValidationError` and returns; rejects if `_links.length >= MAX_LINKS (20)`; creates `QuickLink { id, label: trimmed, url: trimmed }`; pushes to `_links`; calls `_save()`; calls `_renderPanel()`
    - `_deleteLink(id)`: splices link from `_links`; calls `_save()`; removes the corresponding DOM node
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7, 4.8_


- [x] 9. Implement `QuickLinks_Widget` — rendering, persistence, and init
  - [x] 9.1 Implement `_renderPanel()`, `_save()`, `_showValidationError(message)`, `init()`
    - `_renderPanel()`: clears the links container; re-renders all `_links` as `<button>` elements with `target="_blank"` anchor or click handler; adds a Delete control per link
    - `_save()`: calls `Dashboard_App.saveJSON(LINKS_KEY, _links)`
    - `_showValidationError(message)`: renders the message in the widget's validation error container; clears it on next valid submission
    - `init()`: loads `_links` from `Dashboard_App.loadJSON(LINKS_KEY)`; calls `_renderPanel()`; attaches listeners for the Add control and link panel delegation (open/delete)
    - Wire into `Dashboard_App.init()` call order
    - _Requirements: 4.2, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [ ] 10. Checkpoint — All widget logic verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Apply visual design and accessibility styles in `style.css`
  - [x] 11.1 Implement layout and widget separation
    - Grid or flexbox layout placing all four widgets in a clean, separated layout
    - Minimum 16px spacing between widget boundaries
    - _Requirements: 7.1_

  - [x] 11.2 Implement typography and color contrast
    - Minimum body font size 14px; minimum widget heading font size 18px
    - All foreground/background color pairs meet WCAG AA (4.5:1 normal text, 3:1 large text and UI components)
    - _Requirements: 7.2, 7.4_

  - [x] 11.3 Implement focus indicators and interactive responsiveness
    - Visible focus outline on all buttons and inputs with ≥ 3:1 contrast ratio against adjacent background
    - CSS transitions or instant DOM updates ensure all visual feedback within 100ms
    - Apply strikethrough style to completed tasks via a `.done` class
    - _Requirements: 7.3, 7.5_

- [x] 12. Wire everything together and final integration pass
  - [x] 12.1 Verify full initialization sequence in `app.js`
    - Confirm `Dashboard_App.init()` is the sole entry point called inside `DOMContentLoaded`
    - Confirm Greeting → Timer → Todo → QuickLinks init order
    - Confirm no widget reads or writes another widget's storage keys
    - _Requirements: 5.7, 5.8, 6.1, 6.2_

  - [x] 12.2 Verify `file://` and browser-extension compatibility
    - Open `index.html` directly via `file://` in Chrome, Firefox, Edge, and Safari; confirm all four widgets render with no console errors
    - Confirm no network requests are issued after HTML finishes loading (use DevTools Network tab)
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 12.3 Write integration smoke tests in `test.html`
    - Cover: timer initializes to "25:00"; add task with exactly 500 chars succeeds, 501 chars rejected; add quick link with 20 links succeeds, 21st rejected; corrupt `tdl_tasks` does not affect Quick Links widget; corrupt `tdl_links` does not affect Todo widget
    - _Requirements: 2.1, 3.2, 4.1, 5.5, 5.6_

- [ ] 13. Final checkpoint — All tests pass and spec complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `test.html` is never linked from `index.html` and is not part of the production build — it exists solely for running property-based and integration tests in-browser
- The PBT harness in `test.html` uses a hand-rolled generator loop (≥ 100 iterations per property) — no CDN or npm dependency required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate universal correctness properties; unit/integration tests validate specific examples and edge cases
- All `localStorage` writes must happen synchronously before returning from any state-mutating method

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "4.1", "6.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "4.2", "6.2", "6.3", "8.2"] },
    { "id": 3, "tasks": ["3.4", "4.3", "6.4", "8.3"] },
    { "id": 4, "tasks": ["4.4", "6.5", "8.4"] },
    { "id": 5, "tasks": ["4.5", "6.6", "9.1"] },
    { "id": 6, "tasks": ["6.7", "6.8", "7.1", "7.2", "11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3", "12.1"] },
    { "id": 8, "tasks": ["12.2", "12.3"] }
  ]
}
```
