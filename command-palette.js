/**
 * command-palette.js - Ctrl+K Command Palette
 * Searchable command menu with keyboard navigation
 */

const CommandPalette = (() => {
  const RECENT_KEY = 'stock_sphere_recent_cmds';

  const COMMANDS = [
    { id: 'dashboard',   label: 'Go to Dashboard',       icon: 'fa-chart-line',    action: () => window.location.href = 'index.html' },
    { id: 'inventory',   label: 'Go to Inventory',       icon: 'fa-warehouse',     action: () => window.location.href = 'inventory.html' },
    { id: 'suppliers',   label: 'Go to Suppliers',       icon: 'fa-truck',         action: () => window.location.href = 'suppliers.html' },
    { id: 'reports',     label: 'Go to Reports',         icon: 'fa-file-invoice',  action: () => window.location.href = 'reports.html' },
    { id: 'add-item',    label: 'Add New Item',          icon: 'fa-plus',          action: () => { window.location.href = 'inventory.html'; setTimeout(() => document.getElementById('addItemModal')?.classList.add('active'), 500); } },
    { id: 'theme',       label: 'Toggle Theme',          icon: 'fa-palette',       action: () => window.ThemeManager?.cycleTheme() },
    { id: 'achievements',label: 'View Achievements',     icon: 'fa-trophy',        action: () => window.GamificationManager?.renderAchievementsModal() },
    { id: 'feed',        label: 'View Activity Feed',    icon: 'fa-stream',        action: () => window.ActivityFeed?.renderFeedModal() },
    { id: 'logout',      label: 'Logout',                icon: 'fa-sign-out-alt',  action: () => window.logout?.() }
  ];

  let selectedIdx = 0;
  let filteredCmds = [];
  let overlay = null;

  function getRecent() {
    const r = localStorage.getItem(RECENT_KEY);
    return r ? JSON.parse(r) : [];
  }

  function addRecent(cmdId) {
    let recent = getRecent();
    recent = [cmdId, ...recent.filter(id => id !== cmdId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  function fuzzyScore(query, text) {
    query = query.toLowerCase(); text = text.toLowerCase();
    if (text.startsWith(query)) return 3;
    if (text.includes(query)) return 2;
    let score = 0, qi = 0;
    for (let i = 0; i < text.length && qi < query.length; i++) {
      if (text[i] === query[qi]) { score++; qi++; }
    }
    return qi === query.length ? score / text.length : 0;
  }

  function open() {
    if (overlay) { overlay.style.display = 'flex'; focusInput(); return; }
    overlay = document.createElement('div');
    overlay.id = 'cmd-palette-overlay';
    overlay.className = 'cmd-overlay';
    overlay.innerHTML = `
      <div class="cmd-palette">
        <div class="cmd-search-row">
          <i class="fas fa-terminal cmd-prompt-icon"></i>
          <input id="cmd-input" class="cmd-input" placeholder="Type a command..." autocomplete="off" spellcheck="false" aria-label="Command palette search">
          <kbd class="cmd-esc-hint">ESC</kbd>
        </div>
        <div id="cmd-results" class="cmd-results" role="listbox"></div>
        <div class="cmd-footer">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Execute</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#cmd-input');
    input.addEventListener('input', (e) => render(e.target.value));
    input.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    render('');
    focusInput();
  }

  function focusInput() {
    setTimeout(() => overlay?.querySelector('#cmd-input')?.focus(), 50);
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
  }

  function render(query) {
    const resultsEl = overlay?.querySelector('#cmd-results');
    if (!resultsEl) return;
    const recent = getRecent();
    let cmds;
    if (!query.trim()) {
      // Show recent first, then all
      const recentCmds = recent.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
      const rest = COMMANDS.filter(c => !recent.includes(c.id));
      cmds = [...recentCmds, ...rest];
    } else {
      cmds = COMMANDS.map(c => ({ ...c, score: fuzzyScore(query, c.label) }))
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);
    }
    filteredCmds = cmds;
    selectedIdx = 0;
    resultsEl.innerHTML = cmds.length === 0 ? '<div class="cmd-empty">No matching commands found 💀</div>' :
      cmds.map((c, i) => `
        <div class="cmd-item ${i === 0 ? 'selected' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}" onclick="CommandPalette.execute(${i})">
          <i class="fas ${c.icon} cmd-item-icon"></i>
          <span>${highlightMatch(c.label, query)}</span>
          ${recent.includes(c.id) && !query ? '<span class="cmd-recent-badge">recent</span>' : ''}
        </div>
      `).join('');

    // Click selection
    resultsEl.querySelectorAll('.cmd-item').forEach((el, i) => {
      el.addEventListener('mouseenter', () => setSelected(i));
    });
  }

  function highlightMatch(label, query) {
    if (!query) return label;
    const idx = label.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return label;
    return label.slice(0, idx) + `<mark>${label.slice(idx, idx + query.length)}</mark>` + label.slice(idx + query.length);
  }

  function setSelected(idx) {
    const items = overlay?.querySelectorAll('.cmd-item');
    if (!items) return;
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
      el.setAttribute('aria-selected', i === idx);
    });
    selectedIdx = idx;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(Math.min(selectedIdx + 1, filteredCmds.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(Math.max(selectedIdx - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); execute(selectedIdx); }
  }

  function execute(idx) {
    const cmd = filteredCmds[idx];
    if (!cmd) return;
    addRecent(cmd.id);
    close();
    setTimeout(() => cmd.action(), 100);
  }

  function init() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (overlay?.style.display === 'flex' || overlay?.style.display === '') open();
        else open();
      }
    });
  }

  return { open, close, execute, init };
})();

CommandPalette.init();
