/* ═══════════════════════════════════════════════════════════
   render.js — All DOM rendering functions
   ═══════════════════════════════════════════════════════════ */

import { renderChart } from './chart.js';
import { renderCalendar } from './calendar.js';

/* ── Tag colour map ── */
export const TAG_COLORS = {
  Design:  { bg: '#F3E8FF', text: '#7C3AED' },
  Work:    { bg: '#F5EAFF', text: '#B44AE8' },
  Home:    { bg: '#E8F8F0', text: '#059669' },
  Meeting: { bg: '#FFE8E6', text: '#DC2626' },
  Idea:    { bg: '#FFF9E6', text: '#D97706' },
  Urgent:  { bg: '#FFE4EC', text: '#E11D48' },
};
const DEFAULT_TAG = { bg: '#F3F4F6', text: '#6B7280' };

export const GROUP_COLORS = [
  '#B44AE8','#E86B9A','#34C37B','#F5A623','#C77DFF',
  '#06B6D4','#F43F5E','#84CC16','#FB923C','#A78BFA',
];

/* ════════════════════════════════════════
   renderGroups — sidebar group list
   ════════════════════════════════════════ */
/**
 * @param {import('./storage.js').Group[]} groups
 * @param {import('./storage.js').Task[]} tasks
 * @param {string} activeGroupId
 * @param {(id:string)=>void} onSelect
 * @param {(id:string)=>void} onEdit
 */
export function renderGroups(groups, tasks, activeGroupId, onSelect, onEdit) {
  const list = document.getElementById('group-list');
  if (!list) return;
  list.innerHTML = '';

  for (const g of groups) {
    const count = tasks.filter(t => t.groupId === g.id && t.status !== 'completed').length;
    const li = document.createElement('li');
    li.className = 'group-item' + (activeGroupId === g.id ? ' active' : '');
    li.dataset.id = g.id;
    li.innerHTML = `
      <span class="group-dot" style="background:${g.color}"></span>
      <span class="group-name">${escHtml(g.name)}</span>
      <span class="group-count">${count}</span>
      <button class="group-edit-btn icon-btn" title="Edit group" aria-label="Edit ${escHtml(g.name)}">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8.5 2L11 4.5 4.5 11H2V8.5L8.5 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </button>`;

    // Set CSS var for color accent strip
    li.style.setProperty('--group-color', g.color);

    li.querySelector('.group-edit-btn').addEventListener('click', e => {
      e.stopPropagation();
      onEdit(g.id);
    });
    li.addEventListener('click', () => onSelect(g.id));
    list.appendChild(li);
  }
}

/* ════════════════════════════════════════
   renderBadges — sidebar filter badges
   ════════════════════════════════════════ */
/**
 * @param {import('./storage.js').Task[]} tasks
 */
export function renderBadges(tasks) {
  const todayStr = todayISO();
  const tomorrowStr = tomorrowISO();

  setBadge('badge-all',      tasks.filter(t => t.status !== 'completed').length);
  setBadge('badge-today',    tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length);
  setBadge('badge-tomorrow', tasks.filter(t => t.dueDate === tomorrowStr && t.status !== 'completed').length);
  setBadge('badge-overdue',  tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'cancelled').length);
}

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  const prev = el.textContent;
  el.textContent = count;
  if (prev !== String(count)) {
    el.classList.remove('pulse');
    void el.offsetWidth; // reflow
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 400);
  }
}

/* ════════════════════════════════════════
   renderTagFilters — sidebar tag chips
   ════════════════════════════════════════ */
/**
 * @param {import('./storage.js').Task[]} tasks
 * @param {string|null} activeTag
 * @param {(tag:string|null)=>void} onTag
 */
export function renderTagFilters(tasks, activeTag, onTag) {
  const container = document.getElementById('tag-filter-list');
  if (!container) return;

  // Collect unique tags
  const tagSet = new Set();
  tasks.forEach(t => t.tags.forEach(tag => tagSet.add(tag)));

  // Hide the entire Tags section if no tags exist
  const tagsSection = container.closest('.sidebar-section');
  if (tagsSection) tagsSection.style.display = tagSet.size === 0 ? 'none' : '';

  container.innerHTML = '';

  for (const tag of [...tagSet].sort()) {
    const colors = TAG_COLORS[tag] ?? DEFAULT_TAG;
    const chip = document.createElement('button');
    chip.className = 'tag-filter-chip' + (activeTag === tag ? ' active' : '');
    chip.textContent = tag;
    chip.style.background   = colors.bg;
    chip.style.color        = colors.text;
    chip.style.borderColor  = colors.text + '44';
    chip.addEventListener('click', () => onTag(activeTag === tag ? null : tag));
    container.appendChild(chip);
  }
}

/* ════════════════════════════════════════
   renderTasks — center panel task cards
   ════════════════════════════════════════ */
/**
 * @param {import('./storage.js').Task[]} tasks
 * @param {import('./storage.js').Group[]} groups
 * @param {{ onComplete:(id:string)=>void, onEdit:(id:string)=>void, onDelete:(id:string)=>void }} handlers
 */
export function renderTasks(tasks, groups, handlers) {
  const list     = document.getElementById('task-list');
  const doneList = document.getElementById('done-list');
  const doneSection = document.getElementById('done-section');
  const emptyState  = document.getElementById('empty-state');
  if (!list || !doneList) return;

  const active    = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  list.innerHTML = '';
  doneList.innerHTML = '';

  if (active.length === 0 && completed.length === 0) {
    emptyState?.classList.remove('hidden');
  } else {
    emptyState?.classList.add('hidden');
  }

  for (const task of active) {
    list.appendChild(buildCard(task, groups, handlers, false));
  }

  if (completed.length > 0) {
    doneSection?.classList.remove('hidden');
    for (const task of completed) {
      doneList.appendChild(buildCard(task, groups, handlers, true));
    }
  } else {
    doneSection?.classList.add('hidden');
  }
}

/* ── Build a single task card ── */
function buildCard(task, groups, handlers, isDone) {
  const group = groups.find(g => g.id === task.groupId);
  const todayStr = todayISO();
  const nowTimeStr = new Date().toTimeString().slice(0, 5);
  const isOverdue = task.dueDate && task.status !== 'completed' && task.status !== 'cancelled' && (
    task.dueDate < todayStr ||
    (task.dueDate === todayStr && task.dueTime && task.dueTime < nowTimeStr)
  );

  const card = document.createElement('div');
  const todayISOVal    = todayISO();
  const tomorrowISOVal = tomorrowISO();
  const dueAttr = task.dueDate === todayISOVal ? 'today'
                : task.dueDate === tomorrowISOVal ? 'tomorrow' : '';

  card.className = 'task-card' + (isDone ? ' completed' : '') + (isOverdue ? ' overdue' : '');
  card.dataset.id       = task.id;
  card.dataset.priority = task.priority;
  if (dueAttr) card.dataset.due = dueAttr;

  // Checkbox
  const check = document.createElement('button');
  check.className = 'task-check';
  check.title = isDone ? 'Mark as pending' : 'Mark as complete';
  check.innerHTML = `<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
    <path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  check.addEventListener('click', e => {
    e.stopPropagation();
    // Ripple
    check.classList.add('rippling');
    setTimeout(() => check.classList.remove('rippling'), 400);
    handlers.onComplete(task.id);
  });

  // Body
  const body = document.createElement('div');
  body.className = 'task-body';

  const titleRow = document.createElement('div');
  titleRow.className = 'task-title';
  titleRow.innerHTML = `<span class="prio-dot" style="background:var(--prio-${task.priority})"></span>${escHtml(task.title)}`;

  body.appendChild(titleRow);

  if (task.description) {
    const desc = document.createElement('div');
    desc.className = 'task-desc';
    desc.textContent = task.description;
    body.appendChild(desc);
  }

  // Meta row (tags + due date)
  const meta = document.createElement('div');
  meta.className = 'task-meta';

  // Tags
  if (task.tags.length > 0) {
    const tags = document.createElement('div');
    tags.className = 'task-tags';
    for (const tag of task.tags) {
      const colors = TAG_COLORS[tag] ?? DEFAULT_TAG;
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = tag;
      pill.style.background = colors.bg;
      pill.style.color      = colors.text;
      tags.appendChild(pill);
    }
    meta.appendChild(tags);
  }

  // Due date + time
  if (task.dueDate) {
    const timeStr = task.dueTime ? ` ${formatTime(task.dueTime)}` : '';
    const due = document.createElement('div');
    due.className = 'task-due' + (isOverdue ? ' overdue' : '');
    due.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
      <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>${formatDate(task.dueDate)}${timeStr}`;
    meta.appendChild(due);
  }

  body.appendChild(meta);

  // Group badge
  if (group) {
    const gbadge = document.createElement('div');
    gbadge.style.cssText = `font-size:.65rem;font-weight:700;color:${group.color};margin-top:3px`;
    gbadge.textContent = group.name;
    body.appendChild(gbadge);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.innerHTML = `
    <button class="task-action-btn" title="Edit" aria-label="Edit task">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M8.5 2L11 4.5 4.5 11H2V8.5L8.5 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="task-action-btn danger" title="Delete" aria-label="Delete task">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 4h9M5 4V2.5h3V4M5.5 6v4M7.5 6v4M3 4l.7 7h5.6l.7-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

  actions.querySelector('button:first-child').addEventListener('click', e => {
    e.stopPropagation();
    handlers.onEdit(task.id);
  });
  actions.querySelector('button:last-child').addEventListener('click', e => {
    e.stopPropagation();
    handlers.onDelete(task.id);
  });

  // Click card → edit
  card.addEventListener('click', () => handlers.onEdit(task.id));

  card.appendChild(check);
  card.appendChild(body);
  card.appendChild(actions);
  return card;
}

/* ════════════════════════════════════════
   renderAll — convenience: full re-render
   ════════════════════════════════════════ */
/**
 * @param {{ tasks, groups, activeGroupId, activeFilter, activeTag, activeStatus, onGroupSelect, onGroupEdit, onTaskComplete, onTaskEdit, onTaskDelete, onTagFilter, onTaskClick }} state
 */
export function renderAll(state) {
  const {
    tasks, groups,
    activeGroupId, activeFilter, activeTag, activeStatus,
    onGroupSelect, onGroupEdit,
    onTaskComplete, onTaskEdit, onTaskDelete,
    onTagFilter, onTaskClick,
  } = state;

  /* Filter tasks */
  let visible = [...tasks];

  // Group filter
  if (activeGroupId) {
    visible = visible.filter(t => t.groupId === activeGroupId);
  }

  // Quick filter
  const todayStr    = todayISO();
  const tomorrowStr = tomorrowISO();
  if (activeFilter === 'today') {
    visible = visible.filter(t => t.dueDate === todayStr);
  } else if (activeFilter === 'tomorrow') {
    visible = visible.filter(t => t.dueDate === tomorrowStr);
  } else if (activeFilter === 'overdue') {
    visible = visible.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'cancelled');
  }

  // Tag filter
  if (activeTag) {
    visible = visible.filter(t => t.tags.includes(activeTag));
  }

  // Status filter
  if (activeStatus && activeStatus !== 'all') {
    if (activeStatus === 'completed') {
      visible = visible.filter(t => t.status === 'completed');
    } else {
      visible = visible.filter(t => t.status === activeStatus && t.status !== 'completed');
    }
  }

  // Sort: overdue first, then status, then priority, then due date
  const PRIO = { high: 0, medium: 1, low: 2 };
  const STATUS_ORDER = { ongoing: 0, pending: 1, cancelled: 2, completed: 3 };
  visible.sort((a, b) => {
    // Overdue tasks float to top
    const aOverdue = a.dueDate && a.dueDate < todayStr && a.status !== 'completed' && a.status !== 'cancelled' ? 0 : 1;
    const bOverdue = b.dueDate && b.dueDate < todayStr && b.status !== 'completed' && b.status !== 'cancelled' ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const so = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (so !== 0) return so;
    const po = (PRIO[a.priority] ?? 9) - (PRIO[b.priority] ?? 9);
    if (po !== 0) return po;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  renderGroups(groups, tasks, activeGroupId, onGroupSelect, onGroupEdit);
  renderBadges(tasks);
  renderTagFilters(tasks, activeTag, onTagFilter);
  renderTasks(visible, groups, { onComplete: onTaskComplete, onEdit: onTaskEdit, onDelete: onTaskDelete });
  renderChart(visible, groups);
  renderCalendar(tasks, groups, onTaskClick);
}

/* ════════════════════════════════════════
   Fly animation
   ════════════════════════════════════════ */
/**
 * Clone a task card, fly it to the done section, then callback.
 * @param {string}     taskId
 * @param {()=>void}   onDone
 */
export function flyTaskCard(taskId, onDone) {
  const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
  if (!card) { onDone(); return; }

  const rect = card.getBoundingClientRect();
  const clone = card.cloneNode(true);
  clone.className = 'task-fly-clone';
  clone.style.cssText += `
    left: ${rect.left}px;
    top:  ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: var(--bg-card);
  `;
  document.body.appendChild(clone);

  // Confetti burst
  spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  clone.addEventListener('animationend', () => {
    clone.remove();
    onDone();
  }, { once: true });
}

function spawnConfetti(cx, cy) {
  const colors = ['#B44AE8','#34C37B','#F5A623','#E86B9A','#C77DFF'];
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.cssText = `
      left: ${cx + (Math.random() - .5) * 60}px;
      top:  ${cy + (Math.random() - .5) * 40}px;
      background: ${colors[i % colors.length]};
      animation-delay: ${i * 40}ms;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }
}

/* ── Helpers ── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function todayISO()    { return new Date().toISOString().slice(0, 10); }
function tomorrowISO() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const todayStr = todayISO();
  const tomorrowStr = tomorrowISO();
  if (iso === todayStr)     return 'Today';
  if (iso === tomorrowStr)  return 'Tomorrow';
  return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`;
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')}${period}`;
}
