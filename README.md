# TaskFlow — Browser-Based Task Manager

A beautiful, fully offline-capable task manager built with **vanilla HTML/CSS/JS** and **localStorage** — no framework, no build tools, just open `index.html` in any browser.

---

## Setup

```bash
# Clone or download the repo, then serve locally:
python3 -m http.server 8080
# Open http://localhost:8080

# Or simply open index.html directly (Chrome/Edge):
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
| **Due Dates & Time Scheduling** | Set due dates and optional times per task. Timed tasks appear positioned in calendar hour cells. |
| **Overdue Detection** | Time-aware overdue detection with glowing card indicators, overdue badges, and priority sorting (overdue tasks float to top). Dedicated "Overdue" filter in the sidebar. |
| **Due Date Reminders** | Desktop notifications 1 day before a task is due. In-app toast reminders on the day a task is due (within 15 minutes of scheduled time). Notification tracking prevents duplicates across page reloads. |
| **Progress Donut** | CSS `conic-gradient` donut chart shows overall and per-group completion percentage — updates live with smooth animated counter. Collapsible chart section. |
| **Weekly Calendar** | Overlay panel with Mon–Fri grid (8am–5pm). Timed tasks positioned in hour cells, all-day tasks in a strip. Navigate weeks with ← / → arrows. Click a task to edit. |
| **Fly Animation** | Completing a task triggers a fly-and-shrink animation. Confetti particles burst at the card position. All animations tuned for smooth, visible motion. |
| **Search** | Real-time search across task title, description, and tags. |
| **Purple/Pink Theme** | Custom purple (#B44AE8) and pink (#E86B9A) gradient palette with cohesive styling across all components. |
| **Simplified Layout** | Clean 2-column layout with calendar as a slide-in overlay instead of a fixed panel. |
| **Mobile Layout** | Responsive design for phones with bottom navigation (Home, Calendar, Add, Stats) and a 2x2 stats grid. |
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
│   └── animations.css  # Keyframe animations (fly, fade, slide, glow)
├── js/
│   ├── storage.js      # localStorage CRUD + notification tracking
│   ├── app.js          # State, events, calendar overlay, reminders
│   ├── render.js       # All DOM rendering (cards, badges, overdue)
│   ├── calendar.js     # Weekly calendar with timed task positioning
│   └── chart.js        # Progress donut chart with animated counter
└── icons/              # SVG icons for PWA manifest
```

---

## Data Model

All data lives in `localStorage` under the key `taskflow_data`:

```json
{
  "groups": [
    { "id": "g1", "name": "General", "color": "#B44AE8" }
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
      "dueTime": "14:00",
      "createdAt": "2026-03-16T10:00:00Z"
    }
  ]
}
```

Notification tracking is stored separately under `taskflow_notified` to avoid duplicate reminders across reloads.

---

## Tech Stack

- **HTML5** — semantic markup, `<dialog>`-style modals, `aria-*` attributes
- **CSS3** — custom properties, `conic-gradient` donut, `@keyframes` animations, CSS Grid + Flexbox
- **Vanilla JavaScript (ES6 modules)** — no framework, no build step
- **localStorage** — full CRUD persistence
- **Browser Notifications API** — desktop reminder notifications
- **PWA** — `manifest.json` + service worker, works offline, installable on any device

---

## Development Notes

- All JS files use ES6 `import`/`export` modules (requires a modern browser or a local server for `file://` protocol; Chrome/Edge work directly, Firefox may need `http://`)
- To serve locally: `python3 -m http.server 8080` then open `http://localhost:8080`
- Service worker cache is versioned (`taskflow-v4`); bump the version in `sw.js` when deploying changes
- Desktop notifications require user permission — the app prompts on first load
