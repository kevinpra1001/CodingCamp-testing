# Project Structure

## Expected File Layout

```
CodingCamp-testing/
├── index.html        # Single entry point — all markup lives here
├── style.css         # All styles — exactly one stylesheet
├── app.js            # All JavaScript — exactly one script file
└── README.md
```

## Architecture Conventions

The JS is organized around four widget objects that mirror the requirements:

| Object              | Responsibility                              |
|---------------------|---------------------------------------------|
| `Dashboard_App`     | Top-level init, localStorage read/write     |
| `Greeting_Widget`   | Clock, date display, time-of-day greeting   |
| `Timer_Widget`      | Focus countdown timer logic and controls    |
| `Todo_Widget`       | Task CRUD, completion state, persistence    |
| `QuickLinks_Widget` | Quick link CRUD, URL validation, persistence|

## Key Rules

- Each widget is self-contained — no widget should directly mutate another widget's state
- `localStorage` writes happen immediately on every state change, before the next user interaction
- Input validation (empty, whitespace-only, length limits, URL scheme checks) is enforced in the widget layer before any state mutation
- All UI feedback (error messages, visual state changes) must occur within 100ms of user interaction
- No global variables beyond the widget objects and the `Dashboard_App` coordinator

## Accessibility

- Minimum body font: 14px; widget headings: 18px
- All interactive controls need a visible focus indicator with ≥ 3:1 contrast ratio
- Color contrast must meet WCAG AA (4.5:1 normal text, 3:1 large text/UI components)
- Widget boundaries separated by at least 16px spacing
