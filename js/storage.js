/* ═══════════════════════════════════════════════════════════
   storage.js — localStorage CRUD layer
   All reads/writes go through this module.
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'taskflow_data';

/** @returns {{ groups: Group[], tasks: Task[] }} */
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const data = JSON.parse(raw);
    // Ensure both arrays exist
    if (!Array.isArray(data.groups)) data.groups = defaultData().groups;
    if (!Array.isArray(data.tasks))  data.tasks  = [];
    return data;
  } catch {
    return defaultData();
  }
}

/** @param {{ groups: Group[], tasks: Task[] }} data */
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Default seed data ── */
function defaultData() {
  return {
    groups: [
      { id: 'g1', name: 'General',  color: '#B44AE8' },
      { id: 'g2', name: 'Work',     color: '#E86B5F' },
      { id: 'g3', name: 'Personal', color: '#34C37B' },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Review project spec',
        description: 'Go through the full specification and take notes.',
        groupId: 'g1',
        tags: ['Work'],
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0,10), // tomorrow
        dueTime: '14:00',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't2',
        title: 'Buy groceries',
        description: '',
        groupId: 'g3',
        tags: ['Home'],
        priority: 'medium',
        status: 'pending',
        dueDate: new Date().toISOString().slice(0,10), // today
        dueTime: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't3',
        title: 'Team standup',
        description: 'Daily sync at 9am.',
        groupId: 'g2',
        tags: ['Meeting'],
        priority: 'low',
        status: 'completed',
        dueDate: new Date().toISOString().slice(0,10),
        dueTime: '09:00',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

/* ── Task operations ── */

/**
 * Add a new task.
 * @param {Partial<Task>} fields
 * @returns {Task}
 */
export function addTask(fields) {
  const data = loadData();
  const task = {
    id: uid(),
    title: fields.title || 'Untitled',
    description: fields.description || '',
    groupId: fields.groupId || (data.groups[0]?.id ?? 'g1'),
    tags: fields.tags || [],
    priority: fields.priority || 'medium',
    status: fields.status || 'pending',
    dueDate: fields.dueDate || '',
    dueTime: fields.dueTime || '',
    createdAt: new Date().toISOString(),
  };
  data.tasks.push(task);
  saveData(data);
  return task;
}

/**
 * Update an existing task by id.
 * @param {string} id
 * @param {Partial<Task>} fields
 * @returns {Task|null}
 */
export function updateTask(id, fields) {
  const data = loadData();
  const idx = data.tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  data.tasks[idx] = { ...data.tasks[idx], ...fields };
  saveData(data);
  return data.tasks[idx];
}

/**
 * Delete a task by id.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTask(id) {
  const data = loadData();
  const before = data.tasks.length;
  data.tasks = data.tasks.filter(t => t.id !== id);
  saveData(data);
  return data.tasks.length < before;
}

/* ── Group operations ── */

/**
 * Add a new group.
 * @param {{ name: string, color: string }} fields
 * @returns {Group}
 */
export function addGroup(fields) {
  const data = loadData();
  const group = {
    id: uid(),
    name: fields.name || 'New Group',
    color: fields.color || '#B44AE8',
  };
  data.groups.push(group);
  saveData(data);
  return group;
}

/**
 * Update a group by id.
 * @param {string} id
 * @param {{ name?: string, color?: string }} fields
 */
export function updateGroup(id, fields) {
  const data = loadData();
  const idx = data.groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  data.groups[idx] = { ...data.groups[idx], ...fields };
  saveData(data);
  return data.groups[idx];
}

/**
 * Delete a group and all its tasks.
 * @param {string} id
 */
export function deleteGroup(id) {
  const data = loadData();
  data.groups = data.groups.filter(g => g.id !== id);
  data.tasks  = data.tasks.filter(t => t.groupId !== id);
  saveData(data);
}

/* ── Notification tracking ── */
const NOTIFIED_KEY = 'taskflow_notified';

/** @returns {{ [taskId: string]: string }} — taskId → date notified */
export function loadNotified() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || {};
  } catch { return {}; }
}

export function saveNotified(notified) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}

/** Mark a task as notified today */
export function markNotified(taskId, type) {
  const notified = loadNotified();
  notified[`${taskId}_${type}`] = new Date().toISOString().slice(0, 10);
  saveNotified(notified);
}

/** Check if a task was already notified for a given type */
export function wasNotified(taskId, type) {
  const notified = loadNotified();
  return !!notified[`${taskId}_${type}`];
}

/** Clean up notification entries older than 2 days */
export function cleanNotified() {
  const notified = loadNotified();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const key of Object.keys(notified)) {
    if (notified[key] < cutoffStr) delete notified[key];
  }
  saveNotified(notified);
}

/* ── Helpers ── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * @typedef {{ id:string, name:string, color:string }} Group
 * @typedef {{ id:string, title:string, description:string, groupId:string, tags:string[], priority:'low'|'medium'|'high', status:'pending'|'ongoing'|'completed'|'cancelled', dueDate:string, dueTime:string, createdAt:string }} Task
 */
