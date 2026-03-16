/* ═══════════════════════════════════════════════════════════
   chart.js — Progress donut chart (CSS conic-gradient)
   Enhanced: multi-segment gradient, animated pct counter,
   per-group completion bars
   ═══════════════════════════════════════════════════════════ */

// Track previous pct for smooth counter animation
let _prevPct = 0;

/**
 * Render the progress donut chart.
 * @param {import('./storage.js').Task[]} tasks   — all visible tasks
 * @param {import('./storage.js').Group[]} groups  — all groups
 */
export function renderChart(tasks, groups) {
  const ring     = document.getElementById('donut-ring');
  const pctEl    = document.getElementById('donut-pct');
  const legendEl = document.getElementById('chart-legend');
  if (!ring || !pctEl || !legendEl) return;

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const ongoing   = tasks.filter(t => t.status === 'ongoing').length;
  const cancelled = tasks.filter(t => t.status === 'cancelled').length;
  const pending   = total - completed - ongoing - cancelled;

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  /* ── Multi-segment conic-gradient ── */
  const segments = buildSegments(total, completed, ongoing, cancelled, pending);
  ring.style.background = segments;

  /* ── Animated percentage counter ── */
  animateCounter(pctEl, _prevPct, pct);
  _prevPct = pct;

  /* ── Legend ── */
  legendEl.innerHTML = '';

  // Overall completion
  const overallRow = makeProgressRow('All Tasks', '#4A6CF7', completed, total, 0);
  legendEl.appendChild(overallRow);

  // Per-group rows
  groups.forEach((g, i) => {
    const gTasks = tasks.filter(t => t.groupId === g.id);
    if (gTasks.length === 0) return;
    const gDone = gTasks.filter(t => t.status === 'completed').length;
    legendEl.appendChild(makeProgressRow(g.name, g.color, gDone, gTasks.length, i + 1));
  });

  // Status breakdown row
  if (total > 0) {
    legendEl.appendChild(makeStatusRow({ completed, ongoing, pending, cancelled, total }));
  }
}

/* ── Build conic-gradient string for 4 status segments ── */
function buildSegments(total, completed, ongoing, cancelled, pending) {
  if (total === 0) {
    return 'conic-gradient(var(--border) 0deg 360deg)';
  }
  const toAngle = n => Math.round((n / total) * 360);

  let cur = 0;
  const stops = [];

  const push = (color, count) => {
    if (count === 0) return;
    const end = cur + toAngle(count);
    stops.push(`${color} ${cur}deg ${end}deg`);
    cur = end;
  };

  push('var(--status-completed)', completed);
  push('var(--status-ongoing)',   ongoing);
  push('var(--status-cancelled)', cancelled);
  push('var(--border)',           pending + (360 - cur > 358 ? 1 : 0)); // remainder

  // Ensure full 360
  if (cur < 360) stops.push(`var(--border) ${cur}deg 360deg`);

  return `conic-gradient(${stops.join(', ')})`;
}

/* ── Smooth counter from prev→target ── */
function animateCounter(el, from, to) {
  const duration = 500;
  const start = performance.now();
  const diff = to - from;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    el.textContent = `${Math.round(from + diff * eased)}%`;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ── Legend row: name + mini progress bar ── */
function makeProgressRow(label, color, done, total, animDelay) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const row = document.createElement('div');
  row.className = 'legend-item legend-progress-row';
  row.style.animationDelay = `${animDelay * 60}ms`;
  row.style.cssText += 'display:flex;flex-direction:column;gap:3px;width:100%';

  row.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;font-size:.75rem">
      <span style="display:flex;align-items:center;gap:5px">
        <span class="legend-dot" style="background:${color}"></span>
        <span style="color:var(--text-secondary)">${escHtml(label)}</span>
      </span>
      <span style="color:var(--text-muted);font-weight:700">${done}/${total}</span>
    </div>
    <div class="legend-bar-bg">
      <div class="legend-bar-fill" style="width:0%;background:${color}" data-pct="${pct}"></div>
    </div>`;

  // Animate bar fill after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      const fill = row.querySelector('.legend-bar-fill');
      if (fill) fill.style.width = `${pct}%`;
    }, 50 + animDelay * 60);
  });

  return row;
}

/* ── Status breakdown chips ── */
function makeStatusRow({ completed, ongoing, pending, cancelled, total }) {
  const row = document.createElement('div');
  row.className = 'legend-item';
  row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;width:100%';

  const items = [
    { label: 'Done',    count: completed, color: 'var(--status-completed)' },
    { label: 'Going',   count: ongoing,   color: 'var(--status-ongoing)' },
    { label: 'Pending', count: pending,   color: 'var(--status-pending)' },
    { label: 'Cancel',  count: cancelled, color: 'var(--status-cancelled)' },
  ];

  for (const item of items) {
    const chip = document.createElement('div');
    chip.style.cssText = `
      display:flex;align-items:center;gap:3px;
      font-size:.68rem;font-weight:700;
      color:var(--text-secondary);
      background:var(--bg);padding:2px 7px;border-radius:100px;
      border:1px solid var(--border);
    `;
    chip.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${item.color};display:inline-block"></span>${item.count} ${item.label}`;
    row.appendChild(chip);
  }

  return row;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
