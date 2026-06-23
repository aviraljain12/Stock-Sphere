# Stock-Sphere

> A browser-based Inventory Management System. No backend, no frameworks — just HTML, CSS, and vanilla JavaScript.

---

## What It Solves

Small businesses and workshops often manage stock with spreadsheets or even pen-and-paper. Transitions between inward and outward stock, supplier tracking, and reporting get messy fast. Stock-Sphere was built to give a lightweight, self-contained alternative that runs entirely in the browser — nothing to install, no server to configure.

The core idea: give someone a laptop, open the app, and they have a working inventory system with dashboards, CRUD operations, and reports — all backed by localStorage.

---

## How It Works

The system is split across 5 HTML pages, each wired to a central application logic file (`app.js`) that handles all CRUD operations and authentication:

| Page | Purpose |
|------|---------|
| `index.html` | Dashboard with stats, charts, and recent activity |
| `inventory.html` | Add, edit, delete, and search inventory items |
| `suppliers.html` | Manage supplier contacts and payment terms |
| `reports.html` | Category-wise bar charts and low-stock tables |
| `login.html` | Simple auth gate (credentials stored in localStorage) |

### Data Storage

Everything persists in `localStorage` under a single key. The app ships with seed data (4 inventory items, 2 suppliers, 2 transactions) so it's usable immediately.

### Auth

Session is tracked via a `localStorage` flag. The hardcoded credentials (`admin` / `admin123`) are intentionally minimal — this is not production auth, just a guard to keep casual visitors out.

---

## Features

- **CRUD Operations** — Create, read, update, delete inventory items and suppliers with form validation
- **Dashboard** — Real-time stat cards (total products, low stock count, total suppliers, inventory value) + doughnut chart
- **Search & Filter** — Filter inventory by name, SKU, category, or supplier; filter suppliers by name, email, or contact
- **Low Stock Alerts** — Items with quantity below 20 are auto-flagged with a visual badge
- **Reports** — Category-wise bar chart + low-stock summary table with print support
- **Activity Feed** — Timeline of all user actions (add, edit, delete, login, report generation)
- **Command Palette** — `Ctrl+K` to open a searchable command menu for quick navigation
- **Gamification** — XP system with leveling, achievements, login streaks, and confetti on milestones
- **PWA Support** — Installable as a progressive web app with offline capability via service worker
- **Dark Theme** — Purple-toned UI with CSS custom properties for consistent theming

## Additional Modules

| File | Purpose |
|------|---------|
| `ai-predictions.js` | Fuzzy NLP search + stockout date prediction with confidence scoring |
| `gamification.js` | XP/leveling engine, achievement tracking, confetti effects |
| `command-palette.js` | Keyboard-driven command palette (`Ctrl+K`) |
| `social.js` | Activity timeline with action tracking and filters |
| `toast.js` | Toast notification manager |
| `themes.js` | Theme toggler (dark mode) |
| `sw.js` | Service worker for PWA offline caching |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| HTML | HTML5 (semantic markup) |
| Styling | CSS3 with custom properties (CSS variables) |
| Scripting | Vanilla JavaScript (ES6+) — no build step, no framework |
| Charts | Chart.js (CDN) |
| Icons | Font Awesome 6 (CDN) |
| Storage | `localStorage` API |
| PWA | Service Worker + manifest.json |
| UI Components | Native modals + custom toast notifications |

---

## Running It

No setup required. Clone the repo or grab the files, then open `login.html` in any modern browser.

```bash
# Clone
git clone https://github.com/aviraljain12/Stock-Sphere.git

# That’s it. Open login.html directly.
```

Or use it live: [GitHub Pages](https://aviraljain12.github.io/Stock-Sphere/)

---

## Limitations

I’m going to be upfront here — this is not production software. It was built to solve a specific problem (a working inventory demo without the overhead of setting up a backend) and it does that well. But there are real constraints:

- **No multi-user support** — localStorage is browser-scoped and user-specific. Two people on the same machine would share data. No cloud sync.
- **No server-side validation** — all validation happens client-side. A user with DevTools access can bypass anything.
- **Hardcoded credentials** — the auth system is a UX gate, not a security boundary. Anyone with the credentials has full access.
- **Data loss on cache clear** — clearing browser data or localStorage wipes everything. No export/import (yet).
- **Single device only** — data doesn’t sync across devices. What you enter here stays here.
- **No real-time collaboration** — the “real-time” label in the original description was aspirational. localStorage updates are instant within a session, but not across users.

These aren’t bugs — they’re trade-offs. The goal was to ship something functional without a backend, and that means accepting these boundaries.

---

## What I Learned

Building this was a reset — going back to vanilla JavaScript after working with React and Node forced me to think about how things actually work under the hood. Specifically:

- **Event delegation** — instead of attaching listeners to every row, I learned to bind a single handler on the table and use `e.target` to figure out what was clicked. It’s cleaner and more performant.
- **localStorage as a database** — sounds fun until you realize the 5MB limit and the lack of relational queries. I ended up doing all joins in JavaScript, which taught me the value of a real database.
- **Modular IIFEs** — the `ai-predictions.js`, `gamification.js`, and `social.js` modules are all wrapped in IIFEs to avoid polluting the global scope. This is how “namespaces” worked before ES6 modules became standard.
- **Service workers are unintuitive** — getting the PWA to cache assets correctly took several iterations. The caching strategy (cache-first for static assets, network-first for nothing since there’s no API) is simple but the lifecycle management is tricky.
- **CSS variables over preprocessors** — no Sass needed. CSS custom properties handle theming and spacing consistently, and they’re native to the browser.

---

## Acknowledgments

Thanks to [Aditya Srivastava](https://github.com/adityasrivastava1005) for contributing to this project.

---

## License

This project is for educational and portfolio purposes only. All rights reserved — © 2026 Aviral Jain.
|
