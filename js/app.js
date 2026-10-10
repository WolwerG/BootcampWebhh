/* ════════════════════════════════════════════
   Dashboard — app.js
   Vanilla JS · LocalStorage · No frameworks
   ════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   Utility: localStorage helpers
   ────────────────────────────────────────── */
const store = {
  get:    (key, fallback = null) => { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove: (key) => localStorage.removeItem(key),
};

/* ──────────────────────────────────────────
   Utility: toast notification
   ────────────────────────────────────────── */
const toastEl = document.getElementById('toast');
let toastTimer;
function showToast(msg, duration = 2200) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* ══════════════════════════════════════════
   1. THEME (Dark Mode)
   ══════════════════════════════════════════ */
const themeToggle = document.getElementById('themeToggle');
let currentTheme = store.get('theme', 'light');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.setAttribute('aria-label', themeToggle.getAttribute('title'));
  store.set('theme', theme);
}

applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  showToast(currentTheme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
});

/* ══════════════════════════════════════════
   2. GREETING, CLOCK & DATE
   ══════════════════════════════════════════ */
const greetingMsg  = document.getElementById('greetingMsg');
const greetingSub  = document.getElementById('greetingName');
const clockDisplay = document.getElementById('clockDisplay');
const dateDisplay  = document.getElementById('dateDisplay');
const nameEditor   = document.getElementById('nameEditor');
const nameInput    = document.getElementById('nameInput');
const nameSaveBtn  = document.getElementById('nameSaveBtn');
const nameCancelBtn= document.getElementById('nameCancelBtn');
const editNameBtn  = document.getElementById('editNameBtn');

let userName = store.get('userName', '');

function getGreeting(hour) {
  if (hour <  5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();
  clockDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  dateDisplay.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const greeting = getGreeting(h);
  greetingMsg.textContent = userName ? `${greeting}, ${userName}!` : `${greeting}!`;
  greetingSub.textContent = userName ? `Welcome back 👋` : `Set your name below ↓`;
}

updateClock();
setInterval(updateClock, 1000);

// Name editing
editNameBtn.addEventListener('click', () => {
  nameInput.value = userName;
  nameEditor.classList.add('open');
  nameInput.focus();
  editNameBtn.style.display = 'none';
});

function saveName() {
  const val = nameInput.value.trim();
  userName = val;
  store.set('userName', userName);
  nameEditor.classList.remove('open');
  editNameBtn.style.display = '';
  updateClock();
  showToast(userName ? `👋 Hello, ${userName}!` : 'Name cleared.');
}

nameSaveBtn.addEventListener('click', saveName);
nameCancelBtn.addEventListener('click', () => {
  nameEditor.classList.remove('open');
  editNameBtn.style.display = '';
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') nameCancelBtn.click();
});

/* ══════════════════════════════════════════
   3. FOCUS TIMER
   ══════════════════════════════════════════ */
const timerDisplay  = document.getElementById('timerDisplay');
const timerStart    = document.getElementById('timerStart');
const timerStop     = document.getElementById('timerStop');
const timerReset    = document.getElementById('timerReset');
const timerStatus   = document.getElementById('timerStatus');
const modeButtons   = document.querySelectorAll('.mode-btn');

let timerSeconds    = 25 * 60;
let timerInterval   = null;
let timerRunning    = false;
let timerDuration   = 25 * 60; // current mode default

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
  document.title = timerRunning ? `${formatTime(timerSeconds)} — Dashboard` : 'Dashboard';
}

function setMode(minutes, btn) {
  stopTimer();
  timerDuration = minutes * 60;
  timerSeconds  = timerDuration;
  modeButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  timerStatus.textContent = '';
  updateTimerDisplay();
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => setMode(Number(btn.dataset.minutes), btn));
});

function startTimer() {
  if (timerRunning) return;
  if (timerSeconds === 0) { timerSeconds = timerDuration; }
  timerRunning = true;
  timerStart.disabled = true;
  timerStop.disabled  = false;
  timerStatus.textContent = 'Focus! 🔥';

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStart.disabled = false;
      timerStop.disabled  = true;
      timerStatus.textContent = '🎉 Time\'s up! Great job.';
      document.title = 'Dashboard';
      showToast('⏰ Timer finished!', 3000);
      // Simple audio cue using Web Audio API
      playBeep();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStart.disabled = false;
  timerStop.disabled  = true;
  if (timerSeconds > 0 && timerSeconds < timerDuration) {
    timerStatus.textContent = 'Paused ⏸';
  }
  document.title = 'Dashboard';
}

function resetTimer() {
  stopTimer();
  timerSeconds = timerDuration;
  timerStatus.textContent = '';
  updateTimerDisplay();
}

timerStart.addEventListener('click', startTimer);
timerStop.addEventListener('click', stopTimer);
timerReset.addEventListener('click', resetTimer);

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + .8);
  } catch { /* AudioContext not available */ }
}

updateTimerDisplay();

/* ══════════════════════════════════════════
   4. TO-DO LIST
   ══════════════════════════════════════════ */
const todoForm    = document.getElementById('todoForm');
const todoInput   = document.getElementById('todoInput');
const todoList    = document.getElementById('todoList');
const todoEmpty   = document.getElementById('todoEmpty');
const sortSelect  = document.getElementById('sortSelect');
const clearDoneBtn= document.getElementById('clearDoneBtn');

let todos = store.get('todos', []);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function saveTodos() {
  store.set('todos', todos);
}

function getSortedTodos() {
  const sorted = [...todos];
  const mode   = sortSelect.value;
  switch (mode) {
    case 'newest':  return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':  return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'az':      return sorted.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':      return sorted.sort((a, b) => b.text.localeCompare(a.text));
    case 'pending': return sorted.sort((a, b) => Number(a.done) - Number(b.done));
    case 'done':    return sorted.sort((a, b) => Number(b.done) - Number(a.done));
    default:        return sorted;
  }
}

function renderTodos() {
  todoList.innerHTML = '';
  const sorted = getSortedTodos();

  if (sorted.length === 0) {
    todoEmpty.hidden = false;
    return;
  }
  todoEmpty.hidden = true;

  sorted.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked = todo.done;
    cb.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.done ? 'pending' : 'done'}`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // Text (contenteditable for inline editing)
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.setAttribute('role', 'textbox');
    span.setAttribute('aria-label', 'Task text');
    // Double-click to edit
    span.addEventListener('dblclick', () => startEditTodo(span, todo.id));
    span.addEventListener('keydown', (e) => {
      if (!span.isContentEditable) return;
      if (e.key === 'Enter') { e.preventDefault(); finishEditTodo(span, todo.id); }
      if (e.key === 'Escape') { span.textContent = todo.text; span.contentEditable = 'false'; }
    });
    span.addEventListener('blur', () => {
      if (span.isContentEditable) finishEditTodo(span, todo.id);
    });

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-btn';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => startEditTodo(span, todo.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-btn del';
    delBtn.textContent = '🗑';
    delBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    todoList.appendChild(li);
  });
}

function startEditTodo(span, id) {
  span.contentEditable = 'true';
  span.focus();
  // Move caret to end
  const range = document.createRange();
  range.selectNodeContents(span);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function finishEditTodo(span, id) {
  const newText = span.textContent.trim();
  span.contentEditable = 'false';
  if (!newText) {
    const todo = todos.find(t => t.id === id);
    span.textContent = todo ? todo.text : '';
    return;
  }
  const todo = todos.find(t => t.id === id);
  if (todo && todo.text !== newText) {
    todo.text = newText;
    saveTodos();
    showToast('✏️ Task updated.');
  }
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
    if (todo.done) showToast('✅ Task completed!');
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  showToast('🗑 Task deleted.');
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: genId(), text, done: false, createdAt: Date.now() });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
  showToast('📝 Task added!');
});

sortSelect.addEventListener('change', renderTodos);

clearDoneBtn.addEventListener('click', () => {
  const count = todos.filter(t => t.done).length;
  if (count === 0) { showToast('No completed tasks to clear.'); return; }
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
  showToast(`🗑 Cleared ${count} completed task${count > 1 ? 's' : ''}.`);
});

renderTodos();

/* ══════════════════════════════════════════
   5. QUICK LINKS
   ══════════════════════════════════════════ */
const linkForm  = document.getElementById('linkForm');
const linkName  = document.getElementById('linkName');
const linkUrl   = document.getElementById('linkUrl');
const linksList = document.getElementById('linksList');
const linkError = document.getElementById('linkError');

let links = store.get('quickLinks', []);

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return '';
  }
}

function saveLinks() {
  store.set('quickLinks', links);
}

function renderLinks() {
  linksList.innerHTML = '';
  if (links.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-hint';
    li.textContent = 'No links yet. Add your favourites below!';
    linksList.appendChild(li);
    return;
  }
  links.forEach((link, idx) => {
    const li = document.createElement('li');
    li.className = 'link-item';

    const img = document.createElement('img');
    img.className = 'link-favicon';
    img.src = getFaviconUrl(link.url);
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name;
    a.title  = link.url;

    const del = document.createElement('button');
    del.className = 'link-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', `Remove ${link.name}`);
    del.title = 'Remove';
    del.addEventListener('click', () => {
      links.splice(idx, 1);
      saveLinks();
      renderLinks();
      showToast(`🔗 "${link.name}" removed.`);
    });

    li.append(img, a, del);
    linksList.appendChild(li);
  });
}

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  linkError.textContent = '';

  const name = linkName.value.trim();
  const url  = linkUrl.value.trim();

  if (!name) { linkError.textContent = 'Please enter a label.'; linkName.focus(); return; }
  if (!url)  { linkError.textContent = 'Please enter a URL.';   linkUrl.focus();  return; }
  if (!isValidUrl(url)) { linkError.textContent = 'Please enter a valid URL (include https://).'; linkUrl.focus(); return; }

  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkName.value = '';
  linkUrl.value  = '';
  linkName.focus();
  showToast(`🔗 "${name}" added!`);
});

// Clear error on input
[linkName, linkUrl].forEach(inp => inp.addEventListener('input', () => { linkError.textContent = ''; }));

renderLinks();
