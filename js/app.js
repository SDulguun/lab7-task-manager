/* ═══════════════════════════════════════════════════════════
   app.js — Main controller: state + event wiring
   ═══════════════════════════════════════════════════════════ */

import {
  loadData, saveData,
  addTask, updateTask, deleteTask,
  addGroup, updateGroup, deleteGroup,
} from './storage.js';

import {
  renderAll, flyTaskCard, TAG_COLORS, GROUP_COLORS,
} from './render.js';

import {
  renderCalendar, prevWeek, nextWeek,
} from './calendar.js';

/* ════════════════════════════════════════
   STATE
   ════════════════════════════════════════ */
const state = {
  // Loaded from localStorage
  tasks:  [],
  groups: [],

  // Filters
  activeGroupId: null,   // null = show all groups
  activeFilter:  'all',  // 'all' | 'today' | 'tomorrow'
  activeTag:     null,   // null = no tag filter
  activeStatus:  'all',  // 'all' | 'pending' | 'ongoing' | 'completed' | 'cancelled'
  searchQuery:   '',

  // Modal state
  editingTaskId:  null,   // null = new task
  editingGroupId: null,

  // Mobile tab
  mobileTab: 'home',

  // Confirm dialog callback
  _confirmCb: null,
};

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
function init() {
  const data = loadData();
  state.tasks  = data.tasks;
  state.groups = data.groups;
  bindStaticEvents();
  rerender();
}

/* ════════════════════════════════════════
   RERENDER
   ════════════════════════════════════════ */
function rerender() {
  let tasks = applySearch(state.tasks, state.searchQuery);

  renderAll({
    tasks,
    groups:        state.groups,
    activeGroupId: state.activeGroupId,
    activeFilter:  state.activeFilter,
    activeTag:     state.activeTag,
    activeStatus:  state.activeStatus,
    onGroupSelect: handleGroupSelect,
    onGroupEdit:   openGroupModal,
    onTaskComplete: handleTaskComplete,
    onTaskEdit:    openTaskModal,
    onTaskDelete:  handleTaskDelete,
    onTagFilter:   handleTagFilter,
    onTaskClick:   openTaskModal,
  });

  updatePanelTitle();
  updateNavActive();
}

/* ════════════════════════════════════════
   SEARCH
   ════════════════════════════════════════ */
function applySearch(tasks, query) {
  if (!query) return tasks;
  const q = query.toLowerCase();
  return tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

/* ════════════════════════════════════════
   EVENT HANDLERS
   ════════════════════════════════════════ */

function handleGroupSelect(groupId) {
  state.activeGroupId = state.activeGroupId === groupId ? null : groupId;
  state.activeFilter  = 'all';
  rerender();
}

function handleTaskComplete(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (task.status !== 'completed') {
    // Fly animation, then update
    flyTaskCard(taskId, () => {
      updateTask(taskId, { status: 'completed' });
      refreshFromStorage();
    });
  } else {
    updateTask(taskId, { status: 'pending' });
    refreshFromStorage();
  }
}

function handleTaskDelete(taskId) {
  showConfirm('Delete this task? This cannot be undone.', () => {
    const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (card) {
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        deleteTask(taskId);
        refreshFromStorage();
      }, { once: true });
    } else {
      deleteTask(taskId);
      refreshFromStorage();
    }
  });
}

function handleTagFilter(tag) {
  state.activeTag = tag;
  rerender();
}

/* ════════════════════════════════════════
   TASK MODAL
   ════════════════════════════════════════ */
function openTaskModal(taskId = null) {
  state.editingTaskId = taskId;
  const modal  = document.getElementById('task-modal');
  const title  = document.getElementById('modal-title');
  const delBtn = document.getElementById('btn-delete-task');

  // Populate group <select>
  populateGroupSelect();

  // Reset / populate form
  if (taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    title.textContent = 'Edit Task';
    delBtn.classList.remove('hidden');
    setField('task-title',    task.title);
    setField('task-desc',     task.description);
    setField('task-group',    task.groupId);
    setField('task-priority', task.priority);
    setField('task-status',   task.status);
    setField('task-due',      task.dueDate);
    renderTagPicker(task.tags);
  } else {
    title.textContent = 'New Task';
    delBtn.classList.add('hidden');
    document.getElementById('task-form').reset();
    // Default group
    const groupSel = document.getElementById('task-group');
    if (groupSel && state.groups.length) {
      groupSel.value = state.activeGroupId ?? state.groups[0].id;
    }
    renderTagPicker([]);
  }

  modal.classList.remove('hidden');
  document.getElementById('task-title').focus();
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.add('hidden');
  state.editingTaskId = null;
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  if (!title) {
    document.getElementById('task-title').focus();
    return;
  }

  const fields = {
    title,
    description: document.getElementById('task-desc').value.trim(),
    groupId:     document.getElementById('task-group').value,
    priority:    document.getElementById('task-priority').value,
    status:      document.getElementById('task-status').value,
    dueDate:     document.getElementById('task-due').value,
    tags:        getSelectedTags(),
  };

  if (state.editingTaskId) {
    updateTask(state.editingTaskId, fields);
  } else {
    const newTask = addTask(fields);
    // Animate new task after re-render
    state._pendingNewTaskId = newTask.id;
  }

  closeTaskModal();
  refreshFromStorage();

  // Add slide-in class to new card
  if (state._pendingNewTaskId) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`.task-card[data-id="${state._pendingNewTaskId}"]`);
      if (card) {
        card.classList.add('new-task');
        card.addEventListener('animationend', () => card.classList.remove('new-task'), { once: true });
      }
      state._pendingNewTaskId = null;
    });
  }
}

/* ── Tag Picker ── */
const DEFAULT_TAGS = Object.keys(TAG_COLORS);

function renderTagPicker(selectedTags) {
  const container = document.getElementById('tag-picker');
  if (!container) return;

  // Collect custom tags from existing tasks
  const allTags = new Set([...DEFAULT_TAGS]);
  state.tasks.forEach(t => t.tags.forEach(tag => allTags.add(tag)));

  container.innerHTML = '';
  for (const tag of [...allTags]) {
    const colors = TAG_COLORS[tag] ?? { bg: '#F3F4F6', text: '#6B7280' };
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-option' + (selectedTags.includes(tag) ? ' selected' : '');
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.style.background = colors.bg;
    btn.style.color      = colors.text;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
    container.appendChild(btn);
  }
}

function getSelectedTags() {
  return [...document.querySelectorAll('.tag-option.selected')].map(b => b.dataset.tag);
}

function handleAddCustomTag() {
  const input = document.getElementById('tag-custom-input');
  const val = input.value.trim();
  if (!val) return;

  const container = document.getElementById('tag-picker');
  // Check if already exists
  const existing = container.querySelector(`[data-tag="${val}"]`);
  if (existing) { existing.classList.add('selected'); input.value = ''; return; }

  const colors = { bg: '#F3F4F6', text: '#6B7280' };
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tag-option selected';
  btn.textContent = val;
  btn.dataset.tag = val;
  btn.style.background = colors.bg;
  btn.style.color      = colors.text;
  btn.addEventListener('click', () => btn.classList.toggle('selected'));
  container.appendChild(btn);
  input.value = '';
}

/* ── Group <select> ── */
function populateGroupSelect() {
  const sel = document.getElementById('task-group');
  if (!sel) return;
  sel.innerHTML = '';
  for (const g of state.groups) {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  }
}

/* ════════════════════════════════════════
   GROUP MODAL
   ════════════════════════════════════════ */
function openGroupModal(groupId = null) {
  state.editingGroupId = groupId;
  const modal  = document.getElementById('group-modal');
  const title  = document.getElementById('group-modal-title');
  const delBtn = document.getElementById('btn-delete-group');

  let selectedColor = GROUP_COLORS[0];

  if (groupId) {
    const g = state.groups.find(g => g.id === groupId);
    if (!g) return;
    title.textContent = 'Edit Group';
    delBtn.classList.remove('hidden');
    setField('group-name', g.name);
    selectedColor = g.color;
  } else {
    title.textContent = 'New Group';
    delBtn.classList.add('hidden');
    document.getElementById('group-form').reset();
  }

  renderColorPicker(selectedColor);
  modal.classList.remove('hidden');
  document.getElementById('group-name').focus();
}

function closeGroupModal() {
  document.getElementById('group-modal').classList.add('hidden');
  state.editingGroupId = null;
}

function renderColorPicker(selectedColor) {
  const container = document.getElementById('group-color-picker');
  if (!container) return;
  container.innerHTML = '';
  for (const color of GROUP_COLORS) {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'color-swatch' + (color === selectedColor ? ' selected' : '');
    sw.style.background = color;
    sw.dataset.color = color;
    sw.title = color;
    sw.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
    container.appendChild(sw);
  }
}

function getSelectedColor() {
  const sw = document.querySelector('.color-swatch.selected');
  return sw ? sw.dataset.color : GROUP_COLORS[0];
}

function handleGroupFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('group-name').value.trim();
  if (!name) { document.getElementById('group-name').focus(); return; }
  const color = getSelectedColor();

  if (state.editingGroupId) {
    updateGroup(state.editingGroupId, { name, color });
  } else {
    const g = addGroup({ name, color });
    state.activeGroupId = g.id;
  }

  closeGroupModal();
  refreshFromStorage();
}

function handleDeleteGroup() {
  if (!state.editingGroupId) return;
  const g = state.groups.find(g => g.id === state.editingGroupId);
  showConfirm(
    `Delete group "${g?.name}"? All tasks in this group will also be deleted.`,
    () => {
      deleteGroup(state.editingGroupId);
      if (state.activeGroupId === state.editingGroupId) state.activeGroupId = null;
      closeGroupModal();
      refreshFromStorage();
    }
  );
}

/* ════════════════════════════════════════
   CONFIRM DIALOG
   ════════════════════════════════════════ */
function showConfirm(msg, onConfirm) {
  const dialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-msg').textContent = msg;
  state._confirmCb = onConfirm;
  dialog.classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirm-dialog').classList.add('hidden');
  state._confirmCb = null;
}

/* ════════════════════════════════════════
   MOBILE BOTTOM NAV
   ════════════════════════════════════════ */
function handleTabSwitch(tab) {
  state.mobileTab = tab;

  const sidebar   = document.getElementById('sidebar');
  const rightPanel = document.getElementById('right-panel');

  // Close overlays first
  sidebar?.classList.remove('mobile-active');
  rightPanel?.classList.remove('mobile-active');

  if (tab === 'home') {
    // Nothing extra, center panel is default
  } else if (tab === 'calendar') {
    rightPanel?.classList.add('mobile-active');
  } else if (tab === 'add') {
    openTaskModal(null);
    return; // don't change active tab indicator
  } else if (tab === 'stats') {
    sidebar?.classList.add('mobile-active');
  }

  // Update active indicator
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
    if (btn.dataset.tab === tab) {
      btn.classList.add('bounce');
      btn.querySelector('svg')?.addEventListener('animationend', () => btn.classList.remove('bounce'), { once: true });
    }
  });
}

/* ════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════ */
function refreshFromStorage() {
  const data  = loadData();
  state.tasks  = data.tasks;
  state.groups = data.groups;
  rerender();
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function updatePanelTitle() {
  const el = document.getElementById('panel-title');
  if (!el) return;
  if (state.activeGroupId) {
    const g = state.groups.find(g => g.id === state.activeGroupId);
    el.textContent = g ? g.name : 'Tasks';
  } else if (state.activeFilter === 'today') {
    el.textContent = 'Today';
  } else if (state.activeFilter === 'tomorrow') {
    el.textContent = 'Tomorrow';
  } else {
    el.textContent = 'All Tasks';
  }
}

function updateNavActive() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    const f = btn.dataset.filter;
    const isActive = (f === 'all' && !state.activeGroupId && state.activeFilter === 'all') ||
      (f === state.activeFilter && !state.activeGroupId);
    btn.classList.toggle('active', isActive);
  });
}

/* ════════════════════════════════════════
   BIND STATIC EVENTS
   ════════════════════════════════════════ */
function bindStaticEvents() {
  /* ── Sidebar nav filters ── */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeFilter  = btn.dataset.filter;
      state.activeGroupId = null;
      state.activeTag     = null;
      rerender();
    });
  });

  /* ── Status filter chips ── */
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeStatus = btn.dataset.status;
      rerender();
    });
  });

  /* ── Search ── */
  document.getElementById('search-input')?.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    rerender();
  });

  /* ── Add Task button ── */
  document.getElementById('btn-add-task')?.addEventListener('click', () => openTaskModal(null));

  /* ── New Group button ── */
  document.getElementById('btn-new-group')?.addEventListener('click', () => openGroupModal(null));

  /* ── Task Modal ── */
  document.getElementById('task-form')?.addEventListener('submit', handleTaskFormSubmit);
  document.getElementById('close-task-modal')?.addEventListener('click', closeTaskModal);
  document.getElementById('btn-delete-task')?.addEventListener('click', () => handleTaskDelete(state.editingTaskId));
  document.querySelector('#task-modal .modal-cancel')?.addEventListener('click', closeTaskModal);
  document.querySelector('#task-modal .modal-backdrop')?.addEventListener('click', closeTaskModal);

  /* ── Custom tag ── */
  document.getElementById('btn-add-custom-tag')?.addEventListener('click', handleAddCustomTag);
  document.getElementById('tag-custom-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); }
  });

  /* ── Group Modal ── */
  document.getElementById('group-form')?.addEventListener('submit', handleGroupFormSubmit);
  document.getElementById('close-group-modal')?.addEventListener('click', closeGroupModal);
  document.getElementById('btn-delete-group')?.addEventListener('click', handleDeleteGroup);
  document.querySelector('#group-modal .modal-cancel')?.addEventListener('click', closeGroupModal);
  document.querySelector('#group-modal .modal-backdrop')?.addEventListener('click', closeGroupModal);

  /* ── Clear Done ── */
  document.getElementById('btn-clear-done')?.addEventListener('click', () => {
    showConfirm('Clear all completed tasks?', () => {
      const data = loadData();
      data.tasks = data.tasks.filter(t => t.status !== 'completed');
      saveData(data);
      refreshFromStorage();
    });
  });

  /* ── Confirm Dialog ── */
  document.getElementById('confirm-ok')?.addEventListener('click', () => {
    state._confirmCb?.();
    closeConfirm();
  });
  document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirm);
  document.querySelector('#confirm-dialog .modal-backdrop')?.addEventListener('click', closeConfirm);

  /* ── Calendar nav ── */
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    prevWeek();
    const data = loadData();
    renderCalendar(data.tasks, data.groups, openTaskModal);
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    nextWeek();
    const data = loadData();
    renderCalendar(data.tasks, data.groups, openTaskModal);
  });

  /* ── Mobile bottom nav ── */
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => handleTabSwitch(btn.dataset.tab));
  });

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeGroupModal();
      closeConfirm();
      document.getElementById('sidebar')?.classList.remove('mobile-active');
      document.getElementById('right-panel')?.classList.remove('mobile-active');
    }
    // Ctrl/Cmd + N → new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openTaskModal(null);
    }
  });
}

/* ════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
