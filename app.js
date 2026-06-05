/* ============================================================
   Todo Life Dashboard — app.js
   Stub — full implementation added in subsequent tasks
   ============================================================ */

'use strict';

// ── Dashboard_App ──────────────────────────────────────────
const Dashboard_App = {
  TASKS_KEY: 'tdl_tasks',
  LINKS_KEY:  'tdl_links',

  init() {
    if (typeof Greeting_Widget   !== 'undefined' && Greeting_Widget.init)   Greeting_Widget.init();
    if (typeof Timer_Widget      !== 'undefined' && Timer_Widget.init)      Timer_Widget.init();
    if (typeof Todo_Widget       !== 'undefined' && Todo_Widget.init)       Todo_Widget.init();
    if (typeof QuickLinks_Widget !== 'undefined' && QuickLinks_Widget.init) QuickLinks_Widget.init();
  },

  loadJSON(key) {
    try {
      const raw    = localStorage.getItem(key);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveJSON(key, array) {
    try {
      localStorage.setItem(key, JSON.stringify(array));
      return true;
    } catch (e) {
      return false;
    }
  },
};

// ── Greeting_Widget ────────────────────────────────────────
const Greeting_Widget = {
  _elGreeting: null,
  _elTime:     null,
  _elDate:     null,

  init() {
    this._elGreeting = document.getElementById('greeting-text');
    this._elTime     = document.getElementById('greeting-time');
    this._elDate     = document.getElementById('greeting-date');
    this._tick();
    setInterval(() => this._tick(), 1000);
  },

  _tick() {
    const now = new Date();
    this._elTime.textContent     = this._formatTime(now);
    this._elDate.textContent     = this._formatDate(now);
    this._elGreeting.textContent = this._getGreeting(now.getHours());
  },

  _getGreeting(hours) {
    if (hours >= 5  && hours <= 11) return 'Good Morning';
    if (hours >= 12 && hours <= 17) return 'Good Afternoon';
    if (hours >= 18 && hours <= 20) return 'Good Evening';
    return 'Good Night';
  },

  _formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  _formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
  },
};

// ── Timer_Widget ───────────────────────────────────────────
const Timer_Widget = {
  _seconds:    1500,   // 25 * 60
  _intervalId: null,

  init() {
    this._render();

    document.getElementById('timer-start').addEventListener('click', () => this._start());
    document.getElementById('timer-stop').addEventListener('click',  () => this._stop());
    document.getElementById('timer-reset').addEventListener('click', () => this._reset());
  },

  _start() {
    // Guard against double-start
    if (this._intervalId !== null) return;
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._render();
  },

  _stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._render();
  },

  _reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._seconds    = 1500;
    this._render();
  },

  _tick() {
    this._seconds -= 1;
    if (this._seconds === 0) {
      this._reset();   // auto-reset to 25:00
    } else {
      this._render();
    }
  },

  _render() {
    const display  = document.getElementById('timer-display');
    const btnStart = document.getElementById('timer-start');
    const btnStop  = document.getElementById('timer-stop');
    const btnReset = document.getElementById('timer-reset');

    display.textContent = this._formatTime(this._seconds);

    const running = this._intervalId !== null;
    // Button state matrix:
    //   Idle/reset : Start ✓  Stop ✗  Reset ✓
    //   Running    : Start ✗  Stop ✓  Reset ✓
    //   Paused     : Start ✓  Stop ✗  Reset ✓
    btnStart.disabled = running;
    btnStop.disabled  = !running;
    btnReset.disabled = false;
  },

  _formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },
};

// ── Todo_Widget ────────────────────────────────────────────
const Todo_Widget = {
  _tasks: [],

  // ── ID generation ────────────────────────────────────────
  _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString();
  },

  // ── Task creation ─────────────────────────────────────────
  // Req 3.1, 3.2, 3.3, 3.11
  _addTask(description) {
    const trimmed = (description || '').trim();

    // Reject empty / whitespace-only input — no state change, retain focus (Req 3.3)
    if (trimmed === '') {
      const input = document.getElementById('todo-input');
      if (input) input.focus();
      return;
    }

    // Build task object (Req 3.2, 3.11)
    const task = {
      id:          this._generateId(),
      description: trimmed,
      done:        false,
      createdAt:   Date.now(),
    };

    this._tasks.push(task);
    this._save();
    this._renderList();
  },

  // ── Toggle completion ─────────────────────────────────────
  // Req 3.4, 3.5, 3.11
  _toggleTask(id) {
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;
    this._save();

    // Re-render just the affected item in the DOM if it exists;
    // falls back gracefully when _renderList is a no-op stub.
    const item = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (item) {
      const label    = item.querySelector('.todo-label');
      const checkbox = item.querySelector('.todo-toggle');

      if (label) {
        if (task.done) {
          label.classList.add('done');
        } else {
          label.classList.remove('done');
        }
      }
      if (checkbox) {
        checkbox.checked = task.done;
        checkbox.setAttribute('aria-checked', String(task.done));
      }
    } else {
      // DOM node not found — fall back to full re-render
      this._renderList();
    }
  },

  // ── Begin edit ────────────────────────────────────────────
  // Req 3.6
  _beginEdit(id) {
    const item = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (!item) return;

    const label = item.querySelector('.todo-label');
    if (!label) return;

    // Prevent opening a second edit input if one is already open
    if (item.querySelector('.todo-edit-input')) return;

    const originalText = label.textContent;

    // Build the edit input pre-filled with current description
    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'todo-edit-input';
    input.value     = originalText;
    input.maxLength = 500;
    input.setAttribute('aria-label', 'Edit task description');

    // Hide the label and insert the input in its place
    label.hidden = true;
    label.after(input);
    input.focus();
    // Place cursor at end of text
    input.setSelectionRange(input.value.length, input.value.length);

    // Confirm on Enter, cancel on Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._confirmEdit(id, input.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this._cancelEdit(id);
      }
    });

    // Cancel on blur (focus leaving the input without confirmation)
    input.addEventListener('blur', () => {
      // Use a short timeout so that a simultaneous Enter key press can
      // call _confirmEdit before blur fires and removes the input.
      setTimeout(() => {
        // Only cancel if the input is still in the DOM (not already handled)
        if (item.querySelector('.todo-edit-input')) {
          this._cancelEdit(id);
        }
      }, 0);
    });
  },

  // ── Confirm edit ──────────────────────────────────────────
  // Req 3.7, 3.8
  _confirmEdit(id, newText) {
    const trimmed = (newText || '').trim();

    // Reject empty/whitespace-only — restore original without saving
    if (trimmed === '') {
      this._cancelEdit(id);
      return;
    }

    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    // Update only .description; id, done, createdAt are untouched
    task.description = trimmed;
    this._save();
    this._renderList();
  },

  // ── Cancel edit ───────────────────────────────────────────
  // Req 3.9
  _cancelEdit(id) {
    const item = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (!item) return;

    const input = item.querySelector('.todo-edit-input');
    const label = item.querySelector('.todo-label');

    if (input) input.remove();
    if (label) label.hidden = false;
  },

  // ── Delete task ───────────────────────────────────────────
  // Req 3.10, 3.11
  _deleteTask(id) {
    const index = this._tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    this._tasks.splice(index, 1);
    this._save();

    // Remove the corresponding DOM node (identified by data-id)
    const item = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (item) {
      item.remove();
    }
  },

  // ── Persistence ───────────────────────────────────────────
  // Req 3.11, 3.12
  _save() {
    const ok = Dashboard_App.saveJSON(Dashboard_App.TASKS_KEY, this._tasks);
    if (!ok) {
      this._showStorageError();
    } else {
      // Clear any previous error on successful save
      const errorEl = document.getElementById('todo-error');
      if (errorEl) errorEl.textContent = '';
    }
  },

  // ── Storage error display ─────────────────────────────────
  // Req 3.12
  _showStorageError() {
    const errorEl = document.getElementById('todo-error');
    if (errorEl) {
      errorEl.textContent = 'Could not save. Storage may be full.';
    }
  },

  // ── Render a single task item ─────────────────────────────
  // Req 3.4, 3.5
  _renderItem(task) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = task.id;

    // Checkbox toggle
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-toggle';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-checked', String(task.done));
    checkbox.setAttribute('aria-label', 'Toggle task completion');

    // Task label
    const label = document.createElement('span');
    label.className = 'todo-label' + (task.done ? ' done' : '');
    label.textContent = task.description;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'todo-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'todo-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  },

  // ── Full list re-render ───────────────────────────────────
  // Req 3.4, 3.5
  _renderList() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Clear existing items
    list.innerHTML = '';

    // Re-render all tasks
    this._tasks.forEach(task => {
      list.appendChild(this._renderItem(task));
    });
  },

  // ── Init ──────────────────────────────────────────────────
  // Req 3.1, 3.13
  init() {
    // Load persisted tasks from storage
    this._tasks = Dashboard_App.loadJSON(Dashboard_App.TASKS_KEY);

    // Render the initial list
    this._renderList();

    // ── Add task: button click ────────────────────────────
    const addBtn = document.getElementById('todo-add-btn');
    const input  = document.getElementById('todo-input');

    if (addBtn && input) {
      addBtn.addEventListener('click', () => {
        this._addTask(input.value);
        input.value = '';
      });

      // Add task: Enter key in the input field
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._addTask(input.value);
          input.value = '';
        }
      });
    }

    // ── Task list delegation (toggle / edit / delete) ─────
    const list = document.getElementById('todo-list');
    if (list) {
      list.addEventListener('change', (e) => {
        // Checkbox toggle
        if (e.target.classList.contains('todo-toggle')) {
          const item = e.target.closest('[data-id]');
          if (item) this._toggleTask(item.dataset.id);
        }
      });

      list.addEventListener('click', (e) => {
        const item = e.target.closest('[data-id]');
        if (!item) return;

        const id = item.dataset.id;

        if (e.target.classList.contains('todo-edit-btn')) {
          this._beginEdit(id);
        } else if (e.target.classList.contains('todo-delete-btn')) {
          this._deleteTask(id);
        }
      });
    }
  },
};

// ── QuickLinks_Widget ──────────────────────────────────────
const QuickLinks_Widget = {
  _links:    [],
  MAX_LINKS: 20,

  // ── Validation ────────────────────────────────────────────
  // Req 4.3, 4.4
  // Rules applied in order; first failure wins.
  _validate(label, url) {
    const trimmedLabel = (label || '').trim();
    const trimmedUrl   = (url   || '').trim();

    // Rule 1: label non-empty after trim AND ≤ 50 chars
    if (trimmedLabel === '') {
      return { valid: false, message: 'Label is required.' };
    }
    if (trimmedLabel.length > 50) {
      return { valid: false, message: 'Label must be 50 characters or fewer.' };
    }

    // Rule 2: url non-empty after trim AND ≤ 2048 chars
    if (trimmedUrl === '') {
      return { valid: false, message: 'URL is required.' };
    }
    if (trimmedUrl.length > 2048) {
      return { valid: false, message: 'URL must be 2048 characters or fewer.' };
    }

    // Rule 3: url must begin with http:// or https://
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return { valid: false, message: 'URL must begin with http:// or https://.' };
    }

    return { valid: true };
  },

  // ── Add link ──────────────────────────────────────────────
  // Req 4.1, 4.2, 4.7
  _addLink(label, url) {
    const result = this._validate(label, url);
    if (!result.valid) {
      this._showValidationError(result.message);
      return;
    }

    // Enforce 20-link cap (Req 4.1)
    if (this._links.length >= this.MAX_LINKS) {
      this._showValidationError('Maximum of 20 quick links reached.');
      return;
    }

    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();

    // Generate ID (same pattern as Todo_Widget)
    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString();

    const link = { id, label: trimmedLabel, url: trimmedUrl };

    this._links.push(link);
    this._save();
    this._renderPanel();
  },

  // ── Delete link ───────────────────────────────────────────
  // Req 4.6, 4.8
  _deleteLink(id) {
    const index = this._links.findIndex(l => l.id === id);
    if (index === -1) return;

    this._links.splice(index, 1);
    this._save();

    // Remove the corresponding DOM node (identified by data-id)
    const item = document.querySelector(`#quicklinks-panel [data-id="${id}"]`);
    if (item) {
      item.remove();
    }
  },

  // ── Persistence ───────────────────────────────────────────
  // Req 4.7, 4.8
  _save() {
    Dashboard_App.saveJSON(Dashboard_App.LINKS_KEY, this._links);
  },

  // ── Render panel ──────────────────────────────────────────
  // Req 4.2, 4.5, 4.6
  _renderPanel() {
    const panel = document.getElementById('quicklinks-panel');
    if (!panel) return;

    // Clear existing content
    panel.innerHTML = '';

    this._links.forEach(link => {
      // Container element for each link entry
      const item = document.createElement('div');
      item.className = 'quicklinks-item';
      item.dataset.id = link.id;

      // Anchor wrapped in a button-style element that opens in a new tab (Req 4.5)
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'quicklinks-btn';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', `Open ${link.label} in new tab`);

      // Delete control per link (Req 4.6)
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'quicklinks-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete ${link.label}`);
      deleteBtn.dataset.id = link.id;

      item.appendChild(anchor);
      item.appendChild(deleteBtn);
      panel.appendChild(item);
    });
  },

  // ── Validation error display ──────────────────────────────
  // Req 4.3, 4.4
  _showValidationError(message) {
    const errorEl = document.getElementById('quicklinks-error');
    if (errorEl) {
      errorEl.textContent = message;
    }
  },

  // ── Init ──────────────────────────────────────────────────
  // Req 4.9, 4.10
  init() {
    // Load persisted links from storage (Req 4.9, 4.10)
    this._links = Dashboard_App.loadJSON(Dashboard_App.LINKS_KEY);

    // Render the initial panel
    this._renderPanel();

    // ── Add link: button click ────────────────────────────
    const addBtn    = document.getElementById('quicklinks-add-btn');
    const labelInput = document.getElementById('quicklinks-label-input');
    const urlInput   = document.getElementById('quicklinks-url-input');

    if (addBtn && labelInput && urlInput) {
      addBtn.addEventListener('click', () => {
        // Clear previous validation error on new submission attempt
        const errorEl = document.getElementById('quicklinks-error');
        if (errorEl) errorEl.textContent = '';

        this._addLink(labelInput.value, urlInput.value);

        // Clear inputs only on successful add (detected by no error message)
        if (errorEl && errorEl.textContent === '') {
          labelInput.value = '';
          urlInput.value   = '';
        }
      });
    }

    // ── Link panel delegation (delete) ────────────────────
    const panel = document.getElementById('quicklinks-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        if (e.target.classList.contains('quicklinks-delete-btn')) {
          const item = e.target.closest('[data-id]');
          if (item) this._deleteLink(item.dataset.id);
        }
      });
    }
  },
};

// ── Entry point ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  Dashboard_App.init();
});
