/* ═══════════════════════════════════════════════════════════
   chart.js — Progress donut chart (CSS conic-gradient)
   ═══════════════════════════════════════════════════════════ */

/**
 * Render the progress donut chart.
 * @param {import('./storage.js').Task[]} tasks   — all visible tasks
 * @param {import('./storage.js').Group[]} groups  — all groups (for legend colours)
 */
export function renderChart(tasks, groups) {
  const ring    = document.getElementById('donut-ring');
  const pctEl   = document.getElementById('donut-pct');
  const legendEl = document.getElementById('chart-legend');

  if (!ring || !pctEl || !legendEl) return;

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  /* ── Update donut ring via conic-gradient ── */
  const pctDeg = (pct / 100) * 360;
  ring.style.background =
    `conic-gradient(var(--primary) 0deg ${pctDeg}deg, var(--border) ${pctDeg}deg 360deg)`;

  pctEl.textContent = `${pct}%`;

  /* ── Legend: per-group completion ── */
  legendEl.innerHTML = '';

  // Overall row
  const overallItem = makeLegendItem('All Tasks', '#4A6CF7', completed, total);
  legendEl.appendChild(overallItem);

  // Per-group rows
  for (const g of groups) {
    const gTasks = tasks.filter(t => t.groupId === g.id);
    if (gTasks.length === 0) continue;
    const gDone = gTasks.filter(t => t.status === 'completed').length;
    legendEl.appendChild(makeLegendItem(g.name, g.color, gDone, gTasks.length));
  }
}

function makeLegendItem(label, color, done, total) {
  const el = document.createElement('div');
  el.className = 'legend-item';
  el.style.animationDelay = '0ms';

  const dot = document.createElement('span');
  dot.className = 'legend-dot';
  dot.style.background = color;

  const txt = document.createElement('span');
  txt.textContent = `${label} — ${done}/${total}`;

  el.appendChild(dot);
  el.appendChild(txt);
  return el;
}
