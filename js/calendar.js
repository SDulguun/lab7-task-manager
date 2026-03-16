/* ═══════════════════════════════════════════════════════════
   calendar.js — Weekly calendar (right panel) + week strip
   ═══════════════════════════════════════════════════════════ */

const DAYS  = ['Mon','Tue','Wed','Thu','Fri'];
const HOURS = [8,9,10,11,12,13,14,15,16,17]; // 8am–5pm

/** Tracks the currently displayed week offset (0 = current week) */
let weekOffset = 0;

/**
 * Render the desktop weekly calendar.
 * @param {import('./storage.js').Task[]}  tasks
 * @param {import('./storage.js').Group[]} groups
 * @param {(taskId:string)=>void}          onTaskClick
 */
export function renderCalendar(tasks, groups, onTaskClick) {
  const container = document.getElementById('calendar-view');
  if (!container) return;

  const { weekStart, weekEnd, days } = getWeekDays(weekOffset);

  // Update title
  const title = document.getElementById('calendar-title');
  if (title) {
    title.textContent = formatWeekTitle(weekStart, weekEnd);
  }

  // Tasks that have due dates and fall in this week
  const weekTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });

  const todayStr = today();

  container.innerHTML = '';

  /* ── Day headers ── */
  const headers = document.createElement('div');
  headers.className = 'cal-day-headers';
  for (const { label, dateStr } of days) {
    const h = document.createElement('div');
    h.className = 'cal-day-header' + (dateStr === todayStr ? ' today' : '');
    h.innerHTML = `<div>${label}</div><div style="font-size:.82rem;font-weight:800;color:inherit">${new Date(dateStr+'T00:00:00').getDate()}</div>`;
    headers.appendChild(h);
  }
  container.appendChild(headers);

  /* ── Grid: time labels + day columns ── */
  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  container.appendChild(grid);

  // Time column
  const timeCol = document.createElement('div');
  timeCol.className = 'cal-time-col';
  for (const h of HOURS) {
    const slot = document.createElement('div');
    slot.className = 'cal-time-slot';
    slot.textContent = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;
    timeCol.appendChild(slot);
  }
  grid.appendChild(timeCol);

  // Day columns
  const dayCols = document.createElement('div');
  dayCols.className = 'cal-day-cols';

  for (const { dateStr } of days) {
    const col = document.createElement('div');
    col.className = 'cal-day-col' + (dateStr === todayStr ? ' today' : '');

    const dayTasks = weekTasks.filter(t => t.dueDate === dateStr);

    for (const h of HOURS) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';

      // Place tasks that "belong" to this hour slot
      // Since tasks only have a date (no time), distribute them across slots sequentially
      const slotTask = dayTasks.find(t => {
        // Assign each task to a distinct hour based on its index
        const idx = dayTasks.indexOf(t);
        return HOURS[idx % HOURS.length] === h;
      });

      if (slotTask) {
        const group = groups.find(g => g.id === slotTask.groupId);
        const ev = document.createElement('div');
        ev.className = 'cal-event';
        ev.style.background = group?.color ?? '#4A6CF7';
        ev.textContent = slotTask.title;
        ev.title = slotTask.title;
        ev.addEventListener('click', () => onTaskClick(slotTask.id));
        cell.appendChild(ev);
      }

      col.appendChild(cell);
    }

    dayCols.appendChild(col);
  }

  grid.appendChild(dayCols);
}

/**
 * Render a compact week strip (used on mobile calendar view).
 * @param {string} selectedDate  — 'YYYY-MM-DD'
 * @param {(date:string)=>void}  onDayClick
 */
export function renderWeekStrip(selectedDate, onDayClick) {
  const container = document.getElementById('week-strip');
  if (!container) return;

  const { days } = getWeekDays(weekOffset);
  const todayStr = today();
  container.innerHTML = '';

  for (const { label, dateStr } of days) {
    const day = document.createElement('div');
    day.className = 'week-strip-day' +
      (dateStr === todayStr ? ' today' : '') +
      (dateStr === selectedDate ? ' selected' : '');

    const dayNum = new Date(dateStr + 'T00:00:00').getDate();
    day.innerHTML =
      `<span class="week-strip-day-label">${label}</span>
       <span class="week-strip-day-num">${dayNum}</span>`;

    day.addEventListener('click', () => onDayClick(dateStr));
    container.appendChild(day);
  }
}

/* ── Week navigation ── */
export function prevWeek() { weekOffset--; }
export function nextWeek() { weekOffset++; }
export function resetWeek() { weekOffset = 0; }

/* ── Internal helpers ── */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDays(offset = 0) {
  const now = new Date();
  // Monday of the current week
  const dayOfWeek = now.getDay() || 7; // Sunday → 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const days = DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, dateStr: d.toISOString().slice(0, 10) };
  });

  return { weekStart: monday, weekEnd: friday, days };
}

function formatWeekTitle(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}
