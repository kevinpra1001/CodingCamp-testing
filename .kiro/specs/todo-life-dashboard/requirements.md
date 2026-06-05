# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side, single-page web application that serves as a personal productivity hub. It combines four core widgets — a contextual greeting with live clock, a focus (Pomodoro-style) timer, a persistent to-do list, and a customizable quick-links panel — into one clean, minimal interface. All data is stored in the browser's Local Storage so no backend server or account is required. The application must work as a standalone web page or as a browser extension in all modern browsers.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Widget**: A self-contained UI section within the Dashboard (Greeting, Focus Timer, To-Do List, Quick Links).
- **Task**: A user-created to-do item that has a text description and a completion state.
- **Quick Link**: A user-defined shortcut consisting of a label and a URL that opens in a new browser tab.
- **Focus Timer**: A countdown timer initialized to 25 minutes, used to support focused work sessions.
- **Local Storage**: The browser's `localStorage` API used for client-side persistent data storage.
- **Dashboard_App**: The overall JavaScript application managing all widgets and interactions.
- **Greeting_Widget**: The UI component responsible for displaying the current time, date, and greeting message.
- **Timer_Widget**: The UI component responsible for the Focus Timer functionality.
- **Todo_Widget**: The UI component responsible for managing the Task list.
- **QuickLinks_Widget**: The UI component responsible for managing Quick Links.
- **Theme**: The color scheme applied to the entire Dashboard interface; valid values are "light" and "dark".
- **Theme Toggle**: A UI control that switches the active Theme between light and dark.
- **Sort Order**: The criterion and direction by which the Task list is ordered for display (e.g., creation date ascending, alphabetical descending).
- **Duplicate Task**: A Task whose description, after trimming and case-insensitive comparison, is identical to the description of an already-existing Task in the list.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a greeting based on the time of day, so that I feel welcomed and oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in 24-hour HH:MM:SS format, updating every second.
2. THE Greeting_Widget SHALL display the current full date in English (e.g., "Monday, July 14, 2025").
3. WHEN the local time is between 05:00:00 and 11:59:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local time is between 12:00:00 and 17:59:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local time is between 18:00:00 and 20:59:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local time is between 21:00:00 and 23:59:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN the local time is between 00:00:00 and 04:59:59, THE Greeting_Widget SHALL display the greeting "Good Night".
8. WHEN the one-second update tick occurs and the local time has crossed a greeting boundary, THE Greeting_Widget SHALL update the displayed greeting automatically without requiring a page reload.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions directly from the Dashboard.

#### Acceptance Criteria

1. THE Timer_Widget SHALL initialize the countdown to exactly 25 minutes (25:00) on page load.
2. WHEN the user activates the Start control, THE Timer_Widget SHALL begin counting down in one-second intervals.
3. WHILE the timer is counting down, THE Timer_Widget SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control, THE Timer_Widget SHALL pause the countdown and retain the remaining time.
5. WHEN the user activates the Reset control, THE Timer_Widget SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop the countdown automatically and restore the display to 25:00, re-enabling the Start control so the user may begin a new session.
7. WHILE the timer is counting down, THE Timer_Widget SHALL disable the Start control to prevent duplicate intervals.
8. WHILE the timer is paused, reset, or expired, THE Timer_Widget SHALL disable the Stop control.
9. WHEN the user activates the Stop control and the timer is paused, THE Timer_Widget SHALL re-enable the Start control so the user may resume the countdown.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across browser sessions, so that I can track my daily responsibilities without losing data on refresh.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide an input field and an Add control for creating new Tasks.
2. WHEN the user submits a non-empty task description (up to 500 characters) via the Add control or by pressing the Enter key, THE Todo_Widget SHALL append the new Task to the task list and clear the input field.
3. IF the user submits an empty or whitespace-only task description, THEN THE Todo_Widget SHALL not create a Task and SHALL retain focus on the input field.
4. WHEN the user activates the completion toggle on a Task, THE Todo_Widget SHALL mark the Task as done and apply a strikethrough text style.
5. WHEN the user activates the completion toggle on an already-completed Task, THE Todo_Widget SHALL mark the Task as not done and remove the strikethrough text style.
6. WHEN the user activates the Edit control on a Task, THE Todo_Widget SHALL replace the task label with an editable input pre-filled with the current task description.
7. WHEN the user confirms an edit (via Enter key or Save control) with a non-empty value of up to 500 characters, THE Todo_Widget SHALL update the Task description and restore the display to the non-editing state.
8. IF the user confirms an edit with an empty or whitespace-only value, THEN THE Todo_Widget SHALL not update the Task and SHALL restore the original description in the non-editing display state.
9. WHEN the user cancels an edit via the Escape key or by moving focus away from the edit input, THE Todo_Widget SHALL discard any changes and restore the original task description in the non-editing display state.
10. WHEN the user activates the Delete control on a Task, THE Todo_Widget SHALL remove the Task from the list immediately.
11. WHEN any Task is created, updated, completed, uncompleted, or deleted, THE Todo_Widget SHALL write the updated task list to Local Storage.
12. IF writing the task list to Local Storage fails (e.g., storage quota exceeded), THEN THE Todo_Widget SHALL display an inline error message indicating that the change could not be saved.
13. WHEN the Dashboard loads, THE Todo_Widget SHALL read all Tasks from Local Storage and render each Task with its persisted description and completion state.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to add, display, and delete shortcut buttons for my favorite websites, so that I can navigate to frequently visited pages quickly from the Dashboard.

#### Acceptance Criteria

1. THE QuickLinks_Widget SHALL provide an input field for a label (up to 50 characters) and an input field for a URL (up to 2048 characters), and an Add control, and SHALL accept a maximum of 20 Quick Links total.
2. WHEN the user submits a non-empty label and a non-empty URL via the Add control and the total Quick Links count is below 20, THE QuickLinks_Widget SHALL render a clickable button for the new Quick Link.
3. IF the user submits a missing label or a missing URL, THEN THE QuickLinks_Widget SHALL not create a Quick Link and SHALL display an inline validation message indicating which field is missing.
4. IF the user submits a label or URL that contains only whitespace, a label exceeding 50 characters, a URL exceeding 2048 characters, or a URL that does not begin with http:// or https://, THEN THE QuickLinks_Widget SHALL not create a Quick Link and SHALL display an inline validation message describing the data quality issue.
5. WHEN the user activates a Quick Link button, THE QuickLinks_Widget SHALL open the associated URL in a new browser tab.
6. WHEN the user activates the Delete control on a Quick Link, THE QuickLinks_Widget SHALL remove that Quick Link from the panel within 100 ms.
7. WHEN a Quick Link is successfully added and rendered as a button, THE QuickLinks_Widget SHALL write the updated Quick Links list to Local Storage.
8. WHEN a Quick Link is deleted, THE QuickLinks_Widget SHALL write the updated Quick Links list to Local Storage.
9. WHEN the Dashboard loads, THE QuickLinks_Widget SHALL read all Quick Links from Local Storage and render them as clickable buttons.
10. IF reading Quick Links from Local Storage fails on load (e.g., data is corrupt or unavailable), THEN THE QuickLinks_Widget SHALL initialize the Quick Links collection as empty and display the panel without buttons, without affecting other widgets.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want all my tasks and quick links to survive page refreshes and browser restarts, so that I do not have to re-enter data every time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard_App SHALL store all Tasks in Local Storage under a single, consistent key.
2. THE Dashboard_App SHALL store all Quick Links in Local Storage under a single, consistent key.
3. WHEN Local Storage contains a valid JSON array for the Tasks key on load, THE Dashboard_App SHALL deserialize and restore the full task list, preserving all task fields.
4. WHEN Local Storage contains a valid JSON array for the Quick Links key on load, THE Dashboard_App SHALL deserialize and restore the full Quick Links list, preserving all Quick Link fields.
5. IF Local Storage contains malformed JSON, a non-array value, or a missing entry for the Tasks key, THEN THE Dashboard_App SHALL initialize the Tasks collection as empty without affecting the Quick Links collection.
6. IF Local Storage contains malformed JSON, a non-array value, or a missing entry for the Quick Links key, THEN THE Dashboard_App SHALL initialize the Quick Links collection as empty without affecting the Tasks collection.
7. WHEN both collections contain valid data on load, THE Dashboard_App SHALL restore both independently and the Dashboard SHALL render all widgets without a blank screen or missing section.
8. WHEN any Task or Quick Link is created, updated, or deleted, THE Dashboard_App SHALL immediately write the affected collection to Local Storage before the next user interaction is processed.

---

### Requirement 6: Technical Constraints

**User Story:** As a developer, I want the Dashboard to be built with HTML, CSS, and Vanilla JavaScript only, so that it can be deployed as a simple static file with no build step or server dependency.

#### Acceptance Criteria

1. THE Dashboard_App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no third-party frameworks, libraries, CDN resources, npm packages, or inline vendored code.
2. THE Dashboard_App SHALL use exactly one CSS file and exactly one JavaScript file, with no additional stylesheets or scripts.
3. THE Dashboard_App SHALL meet all acceptance criteria behaviors in the latest stable versions of Chrome, Firefox, Edge, and Safari without polyfills.
4. THE Dashboard_App SHALL meet all acceptance criteria behaviors when opened via the `file://` protocol directly in a browser and when served as a browser extension page.
5. THE Dashboard_App SHALL load and render all widgets within 1 second on a device scoring ≥ 1000 on Speedometer 2.0 with 8 GB RAM, with no network requests issued after the HTML file finishes loading.

---

### Requirement 7: Visual Design and Accessibility

**User Story:** As a user, I want a clean, visually organized interface with clear hierarchy and readable text, so that I can use the Dashboard comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard_App SHALL present all four widgets in a clearly separated layout with consistent spacing of at least 16px between widget boundaries.
2. THE Dashboard_App SHALL use a minimum body font size of 14px and a minimum widget heading font size of 18px for readability.
3. THE Dashboard_App SHALL provide a visible focus indicator (e.g., outline or highlight) with a minimum 3:1 contrast ratio against the adjacent background on all interactive controls (buttons, inputs) to support keyboard navigation.
4. THE Dashboard_App SHALL use color contrast ratios meeting WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text and UI components) between foreground text or icon and background colors.
5. WHEN the user interacts with any control (button click, task toggle), THE Dashboard_App SHALL reflect the result visually within 100ms to maintain a responsive feel.

---

### Requirement 8: Light / Dark Mode

**User Story:** As a user, I want to toggle between a light and dark color theme, so that I can use the Dashboard comfortably in different lighting conditions and preserve my preference across sessions.

#### Acceptance Criteria

1. THE Dashboard_App SHALL provide a Theme Toggle control that is persistently visible in the Dashboard header without requiring any navigation or menu interaction to reach it.
2. WHEN the user activates the Theme Toggle control while the light theme is active, THE Dashboard_App SHALL switch the interface to the dark theme within 100ms.
3. WHEN the user activates the Theme Toggle control while the dark theme is active, THE Dashboard_App SHALL switch the interface to the light theme within 100ms.
4. WHEN the theme is switched, THE Dashboard_App SHALL write the selected theme identifier to Local Storage under a single, consistent key within 100ms of the switch.
5. WHEN the Dashboard loads, THE Dashboard_App SHALL read the theme preference from Local Storage and apply it before any widget is rendered, so that no flash of the wrong theme is visible.
6. IF no theme preference is stored in Local Storage, THEN THE Dashboard_App SHALL apply the light theme as the default.
7. WHILE the light theme is active, THE Dashboard_App SHALL maintain WCAG AA color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components) across all widgets.
8. WHILE the dark theme is active, THE Dashboard_App SHALL maintain WCAG AA color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components) across all widgets.
9. WHEN the theme is switched, THE Dashboard_App SHALL update all widget backgrounds, text colors, border colors, and button colors within the same 100ms window, with no element remaining in the previous theme's style after that window.

---

### Requirement 9: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting addresses me personally (e.g., "Good Morning, Alex"), and I want that name saved so I do not have to re-enter it.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide an editable name input field allowing the user to enter a personal name of up to 50 characters.
2. WHEN the user enters a non-empty, non-whitespace-only name and confirms the input (via Enter key or by moving focus away), THE Greeting_Widget SHALL update the greeting to include the trimmed name in the format "[Greeting], [Name]" (e.g., "Good Morning, Alex").
3. WHEN the user clears the name field or submits a whitespace-only value, THE Greeting_Widget SHALL revert the greeting to the default format without a name (e.g., "Good Morning").
4. WHEN the name is updated or cleared, THE Greeting_Widget SHALL write the trimmed name value (or an empty string) to Local Storage under a single, consistent key within 100ms of the confirming interaction.
5. WHEN the Dashboard loads, THE Greeting_Widget SHALL read the stored name from Local Storage and apply it to the greeting before any greeting text is rendered to the user.
6. IF no name is stored in Local Storage, THEN THE Greeting_Widget SHALL display the greeting in the default format without a name.
7. THE Greeting_Widget SHALL accept any printable characters in the name field and SHALL NOT restrict input to letters only.
8. IF the user attempts to input beyond the 50th character, THEN THE Greeting_Widget SHALL reject any input beyond the 50th character at the input level and SHALL not update the stored name to a value longer than 50 characters.
9. IF Local Storage is unavailable when the name is confirmed, THEN THE Greeting_Widget SHALL continue to display the confirmed name for the current session without surfacing a storage error to the user.

---

### Requirement 10: Custom Pomodoro Duration

**User Story:** As a user, I want to set my own focus timer duration instead of being locked to 25 minutes, so that I can adapt the timer to my preferred work rhythm, and I want my chosen duration saved for future sessions.

#### Acceptance Criteria

1. THE Timer_Widget SHALL provide a duration input field that accepts integer values representing minutes, with a minimum of 1 minute and a maximum of 60 minutes.
2. WHEN the user enters a valid integer in [1, 60] and confirms the input (via Enter key or by moving focus away from the duration field), THE Timer_Widget SHALL update the countdown starting value to the specified number of minutes, converted to seconds, and SHALL update the display to MM:SS for the new duration.
3. WHILE the timer is actively counting down, THE Timer_Widget SHALL disable the duration input field to prevent changes mid-session.
4. WHEN the timer is stopped or reset, THE Timer_Widget SHALL re-enable the duration input field.
5. WHEN the user activates the Reset control, THE Timer_Widget SHALL restore the display to the currently configured custom duration (not necessarily 25:00), and SHALL re-enable the duration input field.
6. IF the user enters a value outside [1, 60] or a non-integer value in the duration field, THEN THE Timer_Widget SHALL not update the timer duration and SHALL display an inline validation message indicating the valid range.
7. WHEN a valid custom duration is confirmed, THE Timer_Widget SHALL write the duration value (in minutes) to Local Storage under a single, consistent key immediately.
8. WHEN the Dashboard loads, THE Timer_Widget SHALL read the stored custom duration from Local Storage and initialize the countdown to that value.
9. IF no custom duration is stored in Local Storage, THEN THE Timer_Widget SHALL initialize the countdown to 25 minutes (the default).
10. WHEN the countdown reaches 00:00 with a custom duration active, THE Timer_Widget SHALL auto-reset to the currently configured custom duration, not to 25:00.

---

### Requirement 11: Prevent Duplicate Tasks

**User Story:** As a user, I want the to-do list to reject tasks with the same description as an existing task, so that I do not accidentally clutter my list with duplicates.

#### Acceptance Criteria

1. WHEN the user submits a task description that, after trimming and case-insensitive comparison, matches the description of any existing Task in the list, THE Todo_Widget SHALL not create the new Task and SHALL display an inline duplicate error message.
2. THE Todo_Widget SHALL perform duplicate detection case-insensitively so that "Buy Milk", "buy milk", and "BUY MILK" are all treated as equivalent to an existing task with the description "buy milk".
3. WHEN a duplicate submission is rejected, THE Todo_Widget SHALL retain the submitted text in the input field so the user can modify it.
4. WHEN the user edits an existing Task, THE Todo_Widget SHALL apply the same case-insensitive duplicate check against all other Tasks (excluding the Task being edited) before confirming the edit.
5. IF the edited description matches another existing Task (case-insensitively), THEN THE Todo_Widget SHALL not update the Task and SHALL display an inline duplicate error message.
6. WHEN a non-duplicate task is successfully added or a duplicate check passes on edit, THE Todo_Widget SHALL clear any previously displayed duplicate error message.

---

### Requirement 12: Sort Tasks

**User Story:** As a user, I want to sort my task list by different criteria, so that I can quickly find and prioritize tasks according to my current needs.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide a sort control that allows the user to select one of the following sort orders: by creation date ascending (oldest first, which is the default), by creation date descending (newest first), alphabetically ascending (A → Z), alphabetically descending (Z → A), by completion status (incomplete tasks first), and by completion status reversed (completed tasks first).
2. WHEN the user selects a sort order, THE Todo_Widget SHALL re-render the task list in the chosen order within 100ms, without adding, removing, or modifying any Task data.
3. WHEN the task list is sorted, THE Todo_Widget SHALL preserve all task data (id, description, done, createdAt) — no field of any Task SHALL be altered by a sort operation.
4. WHEN a new Task is added while a non-default sort order is active, THE Todo_Widget SHALL insert the new Task in the correct position according to the active sort order.
5. WHEN a Task is completed, uncompleted, edited, or deleted while a sort order is active, THE Todo_Widget SHALL re-apply the active sort order to the updated task list immediately after the state change.
6. WHEN the user selects a sort order, THE Todo_Widget SHALL write the selected sort key to Local Storage under a single, consistent key immediately.
7. WHEN the Dashboard loads, THE Todo_Widget SHALL read the stored sort preference from Local Storage and apply it before rendering the task list.
8. IF no sort preference is stored in Local Storage, THEN THE Todo_Widget SHALL default to creation date ascending order.
9. WHILE alphabetical sorting is active, THE Todo_Widget SHALL compare task descriptions case-insensitively so that capitalisation differences do not affect sort position.
