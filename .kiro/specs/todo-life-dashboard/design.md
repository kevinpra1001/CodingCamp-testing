# Design Document — Todo Life Dashboard

## Overview

The Todo Life Dashboard is a fully client-side, single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It requires no server, no build step, and no third-party dependencies. The application delivers four self-contained widgets — Greeting, Focus Timer, To-Do List, and Quick Links — in one minimal interface. All persistent state (tasks and quick links) lives in the browser's `localStorage`.

The architecture is intentionally flat: a single coordinator object (`Dashboard_App`) bootstraps and wires four widget objects at page load. Each widget owns its own DOM mutations, state, and `localStorage` interactions. No widget reads or writes another widget's data.

**Key design decisions:**

- **Zero dependencies** — The constraint of one HTML file, one CSS file, and one JS file with no bundler makes dependency injection impractical. All code lives in `app.js` as a set of plain object literals.
- **Immediate persistence** — Every state-mutating operation writes to `localStorage` synchronously before returning, ensuring no data is lost on a sudden tab close.
- **Module-like widget objects** — Each widget is an object with an `init()` method and private-by-convention state (prefixed `_`). This gives encapsulation without ES modules.
- **No framework for reactivity** — DOM updates are triggered directly after state mutations, keeping the execution path linear and debuggable.

---

## Architecture

The application follows a simple layered model:

```
┌─────────────────────────────────────────────────┐
│                  index.html                     │
│  (static markup scaffold + link to app.js/css)  │
└───────────────────┬─────────────────────────────┘
                    │ DOMContentLoaded
                    ▼
┌─────────────────────────────────────────────────┐
│               Dashboard_App                     │
│  - reads localStorage on init                   │
│  - calls widget.init() for each widget          │
│  - provides shared storage helpers              │
└──────┬──────────┬───────────┬───────────────────┘
       │          │           │           │
       ▼          ▼           ▼           ▼
Greeting_  Timer_    Todo_    QuickLinks_
Widget     Widget    Widget   Widget
```

**Execution flow:**

1. Browser parses `index.html` and loads `style.css` and `app.js`.
2. `app.js` defines all widget objects and `Dashboard_App`, then calls `Dashboard_App.init()` inside a `DOMContentLoaded` listener.
3. `Dashboard_App.init()` calls each widget's `init()` in order: Greeting → Timer → Todo → QuickLinks.
4. Each widget reads its own state from `localStorage`, renders its initial DOM, and attaches event listeners.
5. The Greeting widget starts a `setInterval` (1 s). The Timer widget manages its own interval only while counting down.
6. From that point, all further updates are purely event-driven.

**Concurrency:** None. Single-threaded browser JS; no Web Workers, no async I/O after init.

---

## Components and Interfaces

### Dashboard_App

Coordinator object. Responsible for bootstrapping and providing shared storage helpers to widgets.

```js
Dashboard_App = {
  TASKS_KEY: 'tdl_tasks',        // localStorage key for tasks
  LINKS_KEY:  'tdl_links',       // localStorage key for quick links

  init(),                        // Called on DOMContentLoaded
  loadJSON(key),                 // Returns parsed array or [] on any error
  saveJSON(key, array),          // Returns true on success, false on QuotaExceededError
}
```

`loadJSON` swallows parse errors and type mismatches, always returning a valid array.  
`saveJSON` catches `QuotaExceededError` and returns `false`; widgets decide how to surface that to the user.

---

### Greeting_Widget

Owns the live clock, date display, and time-of-day greeting. Stateless after `init()` — all values are derived from `Date` at each tick.

```js
Greeting_Widget = {
  init(),                        // Renders immediately, starts 1-second interval
  _tick(),                       // Updates time, date, and greeting DOM nodes
  _getGreeting(hours),           // Pure function: number → greeting string
  _formatTime(date),             // Pure function: Date → "HH:MM:SS"
  _formatDate(date),             // Pure function: Date → "Weekday, Month DD, YYYY"
}
```

Greeting boundary logic:

| Hours (24 h) | Greeting         |
|-------------|------------------|
| 05–11       | Good Morning     |
| 12–17       | Good Afternoon   |
| 18–20       | Good Evening     |
| 21–23, 0–4  | Good Night       |

---

### Timer_Widget

Owns the 25-minute countdown. Internal state: `_seconds` (remaining), `_intervalId` (null when idle).

```js
Timer_Widget = {
  _seconds:    1500,             // 25 * 60
  _intervalId: null,

  init(),                        // Renders 25:00, attaches button listeners
  _start(),                      // Guards against double-start, sets interval
  _stop(),                       // Clears interval, updates button states
  _reset(),                      // Clears interval, restores _seconds = 1500
  _tick(),                       // Decrements _seconds, checks for 0, renders
  _render(),                     // Updates MM:SS display and button enable states
  _formatTime(seconds),          // Pure function: number → "MM:SS"
}
```

Button state matrix:

| State       | Start   | Stop    | Reset   |
|-------------|---------|---------|---------|
| Idle/reset  | enabled | disabled| enabled |
| Running     | disabled| enabled | enabled |
| Paused      | enabled | disabled| enabled |

---

### Todo_Widget

Owns task CRUD and persistence. Internal state: `_tasks` — array of `Task` objects.

```js
Todo_Widget = {
  _tasks: [],                    // Array<Task>

  init(),                        // Loads from storage, renders list, attaches listeners
  _addTask(description),         // Validates, pushes, saves, renders
  _toggleTask(id),               // Flips .done, saves, re-renders item
  _beginEdit(id),                // Swaps label → input in DOM
  _confirmEdit(id, newText),     // Validates, updates, saves, renders
  _cancelEdit(id),               // Restores original text, no save
  _deleteTask(id),               // Splices array, saves, removes DOM node
  _save(),                       // Calls Dashboard_App.saveJSON; shows error banner on false
  _renderList(),                 // Full re-render of task list
  _renderItem(task),             // Creates/updates a single task DOM node
  _showStorageError(),           // Renders inline error message
}
```

---

### QuickLinks_Widget

Owns quick link CRUD and persistence. Internal state: `_links` — array of `QuickLink` objects.

```js
QuickLinks_Widget = {
  _links: [],                    // Array<QuickLink>
  MAX_LINKS: 20,

  init(),                        // Loads from storage, renders panel, attaches listeners
  _addLink(label, url),          // Validates all rules, pushes, saves, renders
  _deleteLink(id),               // Splices, saves, removes DOM node
  _save(),                       // Calls Dashboard_App.saveJSON
  _validate(label, url),         // Returns { valid: bool, message: string }
  _renderPanel(),                // Full re-render of links panel
  _showValidationError(message), // Renders inline validation message
}
```

URL validation rules (applied in order, first failure wins):
1. Label must not be empty or whitespace-only, and ≤ 50 chars.
2. URL must not be empty or whitespace-only, and ≤ 2048 chars.
3. URL must begin with `http://` or `https://`.

---

## Data Models

### Task

```js
{
  id:          string,   // crypto.randomUUID() or Date.now().toString() fallback
  description: string,   // 1–500 characters, trimmed
  done:        boolean,  // false on creation
  createdAt:   number,   // Date.now() timestamp
}
```

Stored as a JSON array under `localStorage` key `tdl_tasks`.

### QuickLink

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString() fallback
  label: string,   // 1–50 characters, trimmed
  url:   string,   // 1–2048 characters, must start with http:// or https://
}
```

Stored as a JSON array under `localStorage` key `tdl_links`.

### localStorage Schema

| Key         | Type         | Widget         | Max Size (approx.)              |
|-------------|--------------|----------------|---------------------------------|
| `tdl_tasks` | JSON array   | Todo_Widget    | Unbounded (user-controlled)     |
| `tdl_links` | JSON array   | QuickLinks_Widget | ≤ 20 × ~2.1 KB ≈ 42 KB      |

No other keys are written. Both keys are independent: failure to read one does not affect the other.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

> **Prework reflection:** Properties P1 (boundary coverage) and an initial P2 (boundary exhaustiveness) were merged into a single comprehensive property — the full-range test over all 24 hours subsumes boundary pair checks. All other properties were reviewed for redundancy: task deletion (P7) and quick link deletion (P10) test distinct widgets and are kept separate; persistence round-trips for tasks (P6) and links (P9) test different storage keys and are kept separate.

---

### Property 1: Greeting correctness for all hours

*For any* integer hour in [0, 23], `_getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`, consistent with the defined time ranges, and SHALL never return `undefined`, `null`, or an empty string. Additionally, for each boundary pair (hours 4→5, 11→12, 17→18, 20→21), the function SHALL return different strings on either side of the boundary.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**

---

### Property 2: Time format correctness

*For any* `Date` object, `_formatTime(date)` SHALL return a string matching the pattern `HH:MM:SS` where HH ∈ [00, 23], MM ∈ [00, 59], and SS ∈ [00, 59], with all components zero-padded to two digits.

**Validates: Requirements 1.1**

---

### Property 3: Task addition correctness

*For any* non-empty, non-whitespace-only string of up to 500 characters, calling `_addTask(description)` SHALL increase `_tasks.length` by exactly 1 and the newly added task SHALL have `description` equal to the trimmed input, `done` equal to `false`, and a non-empty `id`.

**Validates: Requirements 3.2, 3.11**

---

### Property 4: Whitespace and empty task rejection

*For any* string that is empty or composed entirely of whitespace characters (spaces, tabs, newlines), calling `_addTask(description)` SHALL leave `_tasks` completely unchanged — same length and same contents.

**Validates: Requirements 3.3**

---

### Property 5: Task toggle round-trip

*For any* task with any initial `done` value, calling `_toggleTask(id)` twice SHALL return the task to its original `done` state, and calling it once SHALL flip `done` to the opposite boolean value.

**Validates: Requirements 3.4, 3.5**

---

### Property 6: Edit confirmation field isolation

*For any* task and any valid non-empty replacement description of up to 500 characters, calling `_confirmEdit(id, newText)` SHALL update only the `description` field of the matching task while leaving `id`, `done`, and `createdAt` exactly unchanged, and all other tasks in `_tasks` SHALL be unaffected.

**Validates: Requirements 3.7**

---

### Property 7: Whitespace edit rejection

*For any* task and any string that is empty or composed entirely of whitespace, calling `_confirmEdit(id, text)` SHALL leave the entire `_tasks` array unchanged — no field of any task is modified.

**Validates: Requirements 3.8**

---

### Property 8: Task persistence round-trip

*For any* array of `Task` objects written via `Dashboard_App.saveJSON(TASKS_KEY, tasks)` and immediately read back via `Dashboard_App.loadJSON(TASKS_KEY)`, the result SHALL be deeply equal to the original array, with all fields (`id`, `description`, `done`, `createdAt`) preserved on every item.

**Validates: Requirements 3.11, 5.1, 5.3**

---

### Property 9: Quick link validation correctness

*For any* (label, url) pair, `_validate(label, url)` SHALL return `{ valid: true }` if and only if all of the following hold: label is non-empty after trimming AND label length ≤ 50 characters, AND url is non-empty after trimming AND url length ≤ 2048 characters, AND url begins with `http://` or `https://`. For any input that violates at least one rule, `_validate` SHALL return `{ valid: false, message: <non-empty string> }`.

**Validates: Requirements 4.3, 4.4**

---

### Property 10: Quick link cap enforcement

*For any* sequence of valid add-link calls that attempts to exceed 20 links, `_links.length` SHALL never exceed 20. The 21st and any subsequent additions SHALL be rejected without mutating `_links`.

**Validates: Requirements 4.1**

---

### Property 11: Quick link persistence round-trip

*For any* array of `QuickLink` objects written via `Dashboard_App.saveJSON(LINKS_KEY, links)` and immediately read back via `Dashboard_App.loadJSON(LINKS_KEY)`, the result SHALL be deeply equal to the original array, with all fields (`id`, `label`, `url`) preserved on every item.

**Validates: Requirements 4.7, 4.8, 5.2, 5.4**

---

### Property 12: Corrupt storage resilience

*For any* string value (including malformed JSON, non-array JSON, empty string, or random bytes) stored under either `tdl_tasks` or `tdl_links`, `Dashboard_App.loadJSON` SHALL return an empty array `[]` and SHALL NOT throw any exception.

**Validates: Requirements 4.10, 5.5, 5.6**

---

### Property 13: Timer display format correctness

*For any* integer number of seconds in [0, 1500], `Timer_Widget._formatTime(seconds)` SHALL return a string matching the pattern `MM:SS` where MM ∈ [00, 25] and SS ∈ [00, 59], with both components zero-padded to two digits.

**Validates: Requirements 2.3**

---

### Property 14: Timer countdown monotonicity

*For any* starting `_seconds` value in [1, 1500], each call to `_tick()` while the timer is running SHALL decrease `_seconds` by exactly 1, and `_seconds` SHALL never decrease below 0. When `_seconds` reaches 0, the next state SHALL be `_seconds === 1500` (auto-reset).

**Validates: Requirements 2.2, 2.6**

---

## Error Handling

### localStorage write failure (QuotaExceededError)

`Dashboard_App.saveJSON` catches `QuotaExceededError` (and any other exception thrown by `localStorage.setItem`) and returns `false`. The calling widget checks this return value and renders an inline error message in its own section. No global error state is shared between widgets.

**Design choice:** Inline, localized error messages rather than a global toast — this avoids coupling widgets together and keeps the failure visible near the affected data.

### localStorage read failure (corrupt / missing)

`Dashboard_App.loadJSON` wraps `JSON.parse` in a try/catch. Any exception, a non-array result, or a missing key all produce the same safe default: an empty array `[]`. Each widget then renders an empty initial state and operates normally. No error is shown to the user on load (silent degradation).

**Design choice:** Silent fallback on load is preferred to an error banner. The user simply sees an empty list, which is a valid and recoverable state.

### Input validation errors

Input validation is handled synchronously inside each widget's add/edit methods before any state mutation. Invalid input results in:
- No state change.
- An inline validation message rendered in the widget's own error container.
- Focus returned to the relevant input field (Todo_Widget) or the invalid field (QuickLinks_Widget).

The error container is cleared on the next valid submission.

### Timer: double-start guard

`Timer_Widget._start()` checks `_intervalId !== null` before setting a new interval. This prevents duplicate intervals if the Start button were somehow activated while already running (belt-and-suspenders beyond the button's `disabled` state).

### Unrecognized event targets

All event delegation uses `event.target.closest('[data-id]')` or direct button selectors. If no matching target is found, the handler returns early — no exceptions thrown.

---

## Testing Strategy

Given the tech stack constraints (no npm, no build step, no test runner), the testing strategy is split into:

1. **Property-based unit tests** — run in a lightweight in-browser test harness (a single self-contained `test.html` file, not part of the production build) using a minimal PBT library such as [fast-check](https://github.com/dubzzz/fast-check) loaded from a local copy, OR a hand-rolled generator loop.
2. **Manual cross-browser smoke tests** — systematic checklist across Chrome, Firefox, Edge, and Safari.

> **Note on PBT library:** Because the tech stack forbids CDN links and npm in production, the PBT library (e.g., a local copy of `fast-check.umd.js`) is used **only** in `test.html`, which is never loaded by `index.html`. This satisfies the constraint that the production app has zero external dependencies.

### Property Tests

Each property maps to a test that runs ≥ 100 iterations with randomly generated inputs.

Tag format: `Feature: todo-life-dashboard, Property {N}: {property_title}`

| Property | Test Focus | Generator Inputs |
|----------|-----------|-----------------|
| P1 — Greeting correctness for all hours | `_getGreeting(h)` for all h in 0–23 + boundary pairs | All 24 integer hours; boundary pairs (4→5, 11→12, 17→18, 20→21) |
| P2 — Time format correctness | `_formatTime(date)` matches HH:MM:SS | Random Date objects spanning all hours/minutes/seconds |
| P3 — Task addition correctness | `_addTask` grows list, sets correct fields | Random valid strings 1–500 chars |
| P4 — Whitespace and empty task rejection | `_addTask` leaves `_tasks` unchanged | Random empty/whitespace-only strings |
| P5 — Task toggle round-trip | Toggle twice restores original `done` | Random tasks with random initial `done` |
| P6 — Edit confirmation field isolation | `_confirmEdit` updates only `description` | Random tasks × random valid strings |
| P7 — Whitespace edit rejection | `_confirmEdit` leaves `_tasks` unchanged | Random tasks × whitespace strings |
| P8 — Task persistence round-trip | saveJSON → loadJSON deep equality | Random task arrays (0–50 items) |
| P9 — Quick link validation correctness | `_validate` returns correct `valid` flag | Random (label, url) pairs covering all rule violations |
| P10 — Quick link cap enforcement | `_links.length` never exceeds 20 | Sequences of 21–30 valid add-link calls |
| P11 — Quick link persistence round-trip | saveJSON → loadJSON deep equality | Random link arrays (0–20 items) |
| P12 — Corrupt storage resilience | `loadJSON` returns `[]` and never throws | Random malformed strings, valid JSON non-arrays, empty string |
| P13 — Timer display format correctness | `_formatTime(s)` matches MM:SS | Random integers 0–1500 |
| P14 — Timer countdown monotonicity | Each `_tick` decrements by 1, resets at 0 | Random start seconds 1–1500 |

### Unit / Example Tests

| Scenario | What to verify |
|----------|---------------|
| Greeting renders immediately on init | DOM node contains non-empty text within 50 ms |
| Timer initializes to "25:00" | Display equals "25:00" on page load |
| Start → tick → Stop retains time | Remaining seconds after stop = initial − ticks |
| Start → Reset restores "25:00" | Display equals "25:00" after reset during countdown |
| Timer stops at 00:00 | No further ticks after natural expiry |
| Add task with exactly 500 chars | Task created; add task with 501 chars rejected |
| Add quick link with exactly 50-char label | Link created; 51-char label rejected |
| Add quick link with URL not starting http(s) | Validation error shown, link not created |
| Delete task removes from DOM and storage | Task absent from DOM and `_tasks` after delete |
| Delete quick link removes from DOM and storage | Link absent from panel and `_links` after delete |
| Corrupt `tdl_tasks` in storage | Dashboard loads, empty task list, Quick Links unaffected |
| Corrupt `tdl_links` in storage | Dashboard loads, empty links panel, Tasks unaffected |

### Manual Cross-Browser Smoke Tests

Run the following checklist on Chrome, Firefox, Edge, and Safari (latest stable):

- [ ] Open `index.html` via `file://` — all four widgets render, no console errors.
- [ ] Clock ticks every second and greeting updates at hour boundaries.
- [ ] Timer starts, counts down, stops, resets correctly; button states match the matrix.
- [ ] Timer reaches 00:00, auto-resets to 25:00.
- [ ] Add, complete, edit, and delete tasks; reload page and verify tasks persist.
- [ ] Add 20 quick links; 21st is rejected with a validation message.
- [ ] Quick link buttons open correct URLs in a new tab.
- [ ] Delete a quick link; reload and verify it is gone.
- [ ] All interactive controls are keyboard-navigable with visible focus indicators.
- [ ] Text meets minimum font sizes (14 px body, 18 px headings).
- [ ] Page loads and renders all widgets within 1 second on a standard laptop.
