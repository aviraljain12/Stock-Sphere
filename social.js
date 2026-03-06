/**
 * social.js - Activity Feed & Social Features
 * Tracks all inventory actions, renders timeline feed
 */

const ActivityFeed = (() => {
  const FEED_KEY = 'stock_sphere_feed';
  const MAX_FEED = 100;

  const ACTION_META = {
    addItem:    { icon: 'fa-plus-circle',    color: '#00c897', label: 'Added' },
    editItem:   { icon: 'fa-pen',           color: '#6d5dfc', label: 'Edited' },
    deleteItem: { icon: 'fa-trash',         color: '#ff4d4d', label: 'Deleted' },
    addSupplier:{ icon: 'fa-truck',         color: '#ffb800', label: 'New Supplier' },
    login:      { icon: 'fa-sign-in-alt',   color: '#9288f8', label: 'Logged In' },
    report:     { icon: 'fa-chart-bar',     color: '#00c897', label: 'Generated Report' }
  };

  function getFeed() {
    const f = localStorage.getItem(FEED_KEY);
    return f ? JSON.parse(f) : [];
  }

  function logAction(actionType, details = {}) {
    const feed = getFeed();
    const entry = {
      id: Date.now(),
      type: actionType,
      details,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    };
    feed.unshift(entry);
    if (feed.length > MAX_FEED) feed.length = MAX_FEED;
    localStorage.setItem(FEED_KEY, JSON.stringify(feed));
    // Notify gamification
    if (window.GamificationManager) GamificationManager.recordAction(actionType);
    // Refresh feed UI if open
    renderFeedIfVisible();
  }

  function timeAgo(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function renderFeedIfVisible() {
    const container = document.getElementById('activity-feed-list');
    if (container) renderFeed(container);
  }

  function renderFeed(container) {
    if (!container) return;
    const feed = getFeed();
    if (feed.length === 0) {
      container.innerHTML = '<p class="feed-empty">No activity yet. Start adding items! 🚀</p>';
      return;
    }
    container.innerHTML = feed.map(entry => {
      const meta = ACTION_META[entry.type] || ACTION_META.addItem;
      return `
        <div class="feed-item" data-type="${entry.type}">
          <div class="feed-icon" style="background:${meta.color}20; color:${meta.color}">
            <i class="fas ${meta.icon}"></i>
          </div>
          <div class="feed-content">
            <p class="feed-action"><strong>${entry.user}</strong> ${meta.label}
              ${entry.details.name ? `<span class="feed-item-name">${entry.details.name}</span>` : ''}
            </p>
            ${entry.details.category ? `<p class="feed-meta">${entry.details.category} • ${entry.details.quantity || ''} ${entry.details.unit || ''}</p>` : ''}
          </div>
          <span class="feed-time">${timeAgo(entry.timestamp)}</span>
        </div>
      `;
    }).join('');
  }

  function renderFeedModal() {
    const existing = document.getElementById('activity-feed-modal');
    if (existing) { existing.classList.add('active'); renderFeedIfVisible(); return; }
    const modal = document.createElement('div');
    modal.id = 'activity-feed-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box feed-modal-box">
        <button class="modal-close" onclick="document.getElementById('activity-feed-modal').classList.remove('active')">&times;</button>
        <h2><i class="fas fa-stream"></i> Activity Feed</h2>
        <div class="feed-filters">
          <button class="feed-filter-btn active" data-filter="all" onclick="ActivityFeed.filterFeed(this, 'all')">All</button>
          <button class="feed-filter-btn" data-filter="addItem" onclick="ActivityFeed.filterFeed(this, 'addItem')">Added</button>
          <button class="feed-filter-btn" data-filter="editItem" onclick="ActivityFeed.filterFeed(this, 'editItem')">Edited</button>
          <button class="feed-filter-btn" data-filter="deleteItem" onclick="ActivityFeed.filterFeed(this, 'deleteItem')">Deleted</button>
        </div>
        <div id="activity-feed-list" class="feed-list"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    modal.classList.add('active');
    renderFeedIfVisible();
  }

  function filterFeed(btn, type) {
    document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const container = document.getElementById('activity-feed-list');
    if (!container) return;
    const feed = type === 'all' ? getFeed() : getFeed().filter(e => e.type === type);
    const fakeContainer = { innerHTML: '' };
    // Re-render with filtered data
    const fullFeed = getFeed();
    localStorage.setItem(FEED_KEY + '_filter_temp', JSON.stringify(feed));
    renderFeed(container);
    // Restore but refilter manually
    if (type !== 'all') {
      const filtered = getFeed().filter(e => e.type === type);
      container.innerHTML = filtered.length === 0 ? '<p class="feed-empty">No activity of this type.</p>' :
        filtered.map(entry => {
          const meta = ACTION_META[entry.type] || ACTION_META.addItem;
          return `
            <div class="feed-item">
              <div class="feed-icon" style="background:${meta.color}20; color:${meta.color}"><i class="fas ${meta.icon}"></i></div>
              <div class="feed-content">
                <p class="feed-action"><strong>${entry.user}</strong> ${meta.label} ${entry.details.name ? `<span class="feed-item-name">${entry.details.name}</span>` : ''}</p>
                ${entry.details.category ? `<p class="feed-meta">${entry.details.category}</p>` : ''}
              </div>
              <span class="feed-time">${timeAgo(entry.timestamp)}</span>
            </div>`;
        }).join('');
    }
  }

  return { logAction, renderFeedModal, renderFeed, filterFeed };
})();
