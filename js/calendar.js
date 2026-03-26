/* ═══════════════════════════════════════════════════════════
   calendar.js — Weekly calendar (right panel) + week strip
   Enhanced: time-positioned events, all-day row, hover preview
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
  if (title) title.textContent = formatWeekTitle(weekStart, weekEnd);

  const todayStr = today();

  // Tasks with due dates that fall in Mon–Fri this week
  const weekTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = localDate(t.dueDate);
    return d >= weekStart && d <= weekEnd;
  });

  container.innerHTML = '';

  /* ── Day header row ── */
  const headers = document.createElement('div');
  headers.className = 'cal-day-headers';
  for (const { label, dateStr } of days) {
    const isToday = dateStr === todayStr;
    const num = localDate(dateStr).getDate();
    const h = document.createElement('div');
    h.className = 'cal-day-header' + (isToday ? ' today' : '');
    h.innerHTML = `<div style="font-size:.68rem">${label}</div>
      <div style="font-size:.95rem;font-weight:800;margin-top:2px">${num}</div>`;
    headers.appendChild(h);
  }
  container.appendChild(headers);

  /* ── All-day strip: tasks without a time (all tasks with due date) ── */
  const allDayStrip = document.createElement('div');
  allDayStrip.className = 'cal-allday-strip';

  const allDayDays = document.createElement('div');
  allDayDays.className = 'cal-day-cols';

  for (const { dateStr } of days) {
    const dayTasks = weekTasks.filter(t => t.dueDate === dateStr && !t.dueTime);
    const col = document.createElement('div');
    col.className = 'cal-allday-col';

    for (const task of dayTasks.slice(0, 3)) { // cap at 3 in all-day strip
      const group = groups.find(g => g.id === task.groupId);
      const dot = document.createElement('div');
      dot.className = 'cal-allday-event';
      dot.style.background = group?.color ?? '#B44AE8';
      dot.textContent = task.title;
      dot.title = task.title;
      dot.addEventListener('click', () => onTaskClick(task.id));
      col.appendChild(dot);
    }
    if (dayTasks.length > 3) {
      const more = document.createElement('div');
      more.className = 'cal-more';
      more.textContent = `+${dayTasks.length - 3}`;
      col.appendChild(more);
    }
    allDayDays.appendChild(col);
  }

  // Labels col
  const allDayLabel = document.createElement('div');
  allDayLabel.className = 'cal-time-col';
  const lbl = document.createElement('div');
  lbl.className = 'cal-time-slot';
  lbl.innerHTML = '<span style="font-size:.6rem;color:var(--text-muted)">Tasks</span>';
  allDayLabel.appendChild(lbl);

  allDayStrip.appendChild(allDayLabel);
  allDayStrip.appendChild(allDayDays);
  allDayStrip.className = 'cal-grid';
  container.appendChild(allDayStrip);

  /* ── Time-slot grid ── */
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
    const isToday = dateStr === todayStr;
    const col = document.createElement('div');
    col.className = 'cal-day-col' + (isToday ? ' today' : '');

    // Get timed tasks for this day
    const timedTasks = weekTasks.filter(t => t.dueDate === dateStr && t.dueTime);

    for (const h of HOURS) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';

      // Current time indicator
      if (isToday && h === new Date().getHours()) {
        const now = document.createElement('div');
        const mins = new Date().getMinutes();
        const topPct = (mins / 60) * 100;
        now.className = 'cal-now-line';
        now.style.top = `${topPct}%`;
        cell.appendChild(now);
      }

      // Place timed tasks in their corresponding hour cells
      for (const task of timedTasks) {
        const hour = parseInt(task.dueTime.split(':')[0], 10);
        if (hour === h) {
          const group = groups.find(g => g.id === task.groupId);
          const evt = document.createElement('div');
          evt.className = 'cal-event';
          evt.style.background = group?.color ?? 'var(--primary)';
          evt.textContent = task.title;
          evt.title = `${task.title} (${formatTime12(task.dueTime)})`;
          evt.addEventListener('click', () => onTaskClick(task.id));
          cell.appendChild(evt);
        }
      }

      col.appendChild(cell);
    }

    dayCols.appendChild(col);
  }

  grid.appendChild(dayCols);

  /* ── Upcoming tasks list below grid ── */
  if (weekTasks.length > 0) {
    const upcoming = buildUpcomingList(weekTasks, groups, days, todayStr, onTaskClick);
    container.appendChild(upcoming);
  }
}

/* ── Upcoming mini list ── */
function buildUpcomingList(weekTasks, groups, days, todayStr, onTaskClick) {
  const section = document.createElement('div');
  section.style.cssText = 'margin-top:12px';

  const lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:6px;padding:0 2px';
  lbl.textContent = 'This Week';
  section.appendChild(lbl);

  // Sort by date then title
  const sorted = [...weekTasks].sort((a,b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));

  for (const task of sorted.slice(0, 8)) {
    const group = groups.find(g => g.id === task.groupId);
    const isToday = task.dueDate === todayStr;
    const row = document.createElement('div');
    row.className = 'upcoming-item';
    row.style.cssText = `
      display:flex;align-items:center;gap:6px;
      padding:6px 4px;border-bottom:1px solid var(--border-light);
      cursor:pointer;font-size:.78rem;
      ${isToday ? 'color:var(--primary);font-weight:600' : 'color:var(--text-secondary)'}
    `;
    row.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;background:${group?.color ?? '#B44AE8'};flex-shrink:0"></span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(task.title)}</span>
      <span style="font-size:.68rem;color:var(--text-muted)">${formatShortDate(task.dueDate)}</span>
    `;
    row.addEventListener('click', () => onTaskClick(task.id));
    section.appendChild(row);
  }

  return section;
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

    const dayNum = localDate(dateStr).getDate();
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

function localDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getWeekDays(offset = 0) {
  const now = new Date();
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

function formatShortDate(iso) {
  const todayStr = today();
  if (iso === todayStr) return 'Today';
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function formatTime12(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')}${period}`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
