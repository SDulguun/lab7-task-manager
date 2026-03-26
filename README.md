# TaskFlow — Browser-Based Task Manager

A beautiful, fully offline-capable task manager built with **vanilla HTML/CSS/JS** and **localStorage** — no framework, no build tools, just open `index.html` in any browser.

---

## Setup

```bash
# Clone or download the repo, then simply open:
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

> **PWA Install:** On iOS Safari or Android Chrome, tap "Share → Add to Home Screen" (or the install prompt in Chrome) to install TaskFlow as a native-like app with full offline support.

---

## Features

| Feature | Description |
|---------|-------------|
| **Task CRUD** | Create, edit, complete, and delete tasks. All data persists across browser refreshes via `localStorage`. |
| **Task Groups** | Organize tasks into color-coded groups (General, Work, Personal, …). Create and delete groups with a color picker. |
| **Tags** | Label tasks with multi-color tags (Design, Work, Home, Meeting, Idea, Urgent, or custom). Filter by tag in the sidebar. |
| **Priority** | High / Medium / Low priority with color-coded left border and dot on each task card. |
| **Status** | Pending → Ongoing → Completed → Cancelled. Filter by status with the chip bar. |
| **Due Dates** | Set due dates per task. Overdue tasks are highlighted in red. |
| **Progress Donut** | CSS `conic-gradient` donut chart shows overall and per-group completion percentage — updates live with smooth transitions. |
| **Weekly Calendar** | Right panel shows a Mon–Fri grid (8am–5pm) with tasks plotted by due date. Navigate weeks with ← / → arrows. Click a task block to edit. |
| **Fly Animation** | Completing a task triggers a fly-and-shrink animation. Confetti particles burst at the card position. |
| **Search** | Real-time search across task title, description, and tags. |
| **Mobile Layout** | Responsive design for phones with bottom navigation (Home, Calendar, Add, Stats) and a 2×2 stats grid. |
| **PWA** | `manifest.json` + service worker → installable on iOS/Android, works fully offline. |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + N` | New task |
| `Escape` | Close any open modal |

---

## File Structure

```
├── index.html          # App shell (semantic HTML5)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline cache)
├── css/
│   ├── style.css       # Layout, components, CSS variables
│   ├── mobile.css      # Responsive overrides (<768px)
│   └── animations.css  # Keyframe animations (fly, fade, slide)
├── js/
│   ├── storage.js      # localStorage CRUD (addTask, updateTask, …)
│   ├── app.js          # State + event wiring (main controller)
│   ├── render.js       # All DOM rendering functions
│   ├── calendar.js     # Weekly calendar + week strip
│   └── chart.js        # Progress donut chart
├── icons/              # SVG icons for PWA manifest
│
│   (Lab 7 Phase 1 — Python CLI, kept as history)
├── src/
├── tests/
├── SPEC.md
├── IMPLEMENTATION_PLAN.md
└── spec.json
```

---

## Data Model

All data lives in `localStorage` under the key `taskflow_data`:

```json
{
  "groups": [
    { "id": "g1", "name": "General", "color": "#4A6CF7" }
  ],
  "tasks": [
    {
      "id": "t1",
      "title": "Buy groceries",
      "description": "",
      "groupId": "g1",
      "tags": ["Home"],
      "priority": "high",
      "status": "pending",
      "dueDate": "2026-03-20",
      "createdAt": "2026-03-16T10:00:00Z"
    }
  ]
}
```

---

## Screenshots

> *(Add screenshots here after first run)*

| Desktop | Mobile |
|---------|--------|
| ![Desktop view](screenshots/desktop.png) | ![Mobile view](screenshots/mobile.png) |

---

## Tech Stack

- **HTML5** — semantic markup, `<dialog>`-style modals, `aria-*` attributes
- **CSS3** — custom properties, `conic-gradient` donut, `@keyframes` animations, CSS Grid + Flexbox
- **Vanilla JavaScript (ES6 modules)** — no framework, no build step
- **localStorage** — full CRUD persistence
- **PWA** — `manifest.json` + service worker, works offline, installable on any device

---

## Development Notes

- Open directly in browser — no server or build step required
- All JS files use ES6 `import`/`export` modules (requires a modern browser or a local server for `file://` protocol; Chrome/Edge work directly, Firefox may need `http://`)
- To serve locally: `python3 -m http.server 8080` then open `http://localhost:8080`

---

*Phase 1 Python CLI implementation preserved in `src/` and `tests/` as Lab 7 history.*
