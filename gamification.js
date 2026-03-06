/**
 * gamification.js - Stock-Sphere Gamification Engine
 * XP System, Leveling, Achievements, Toast Notifications
 */

const GamificationManager = (() => {
  const GAME_KEY = 'stock_sphere_game';

  // Default game state
  const defaultState = {
    xp: 0,
    level: 0,
    totalActions: 0,
    streak: 0,
    lastLoginDate: null,
    achievements: {},
    sessionActions: 0,
    lowStockFixed: 0,
    itemsAdded: 0
  };

  // XP values per action
  const XP_VALUES = {
    addItem: 10,
    editItem: 5,
    deleteItem: 3,
    loginStreak: 20,
    fixLowStock: 5
  };

  // Achievement definitions
  const ACHIEVEMENTS = [
    { id: 'first_steps', title: 'First Steps', description: 'Add your first inventory item', icon: 'fa-baby', xp: 5, check: (s) => s.itemsAdded >= 1 },
    { id: 'century_club', title: 'Century Club', description: 'Add 100 inventory items total', icon: 'fa-hundred-points', xp: 100, check: (s) => s.itemsAdded >= 100 },
    { id: 'speed_demon', title: 'Speed Demon', description: 'Process 10 actions in one session', icon: 'fa-bolt', xp: 150, check: (s) => s.sessionActions >= 10 },
    { id: 'low_stock_hero', title: 'Low Stock Hero', description: 'Fix 20 low-stock alerts', icon: 'fa-shield', xp: 75, check: (s) => s.lowStockFixed >= 20 },
    { id: 'streak_5', title: 'On Fire!', description: 'Login 5 days in a row', icon: 'fa-fire', xp: 50, check: (s) => s.streak >= 5 },
    { id: 'streak_30', title: 'Accuracy Expert', description: 'Maintain a 30-day streak', icon: 'fa-star', xp: 200, check: (s) => s.streak >= 30 },
    { id: 'level_5', title: 'Rising Star', description: 'Reach Level 5', icon: 'fa-rocket', xp: 50, check: (s) => s.level >= 5 },
    { id: 'level_10', title: 'Stock Legend', description: 'Reach Level 10', icon: 'fa-crown', xp: 150, check: (s) => s.level >= 10 }
  ];

  function getState() {
    const saved = localStorage.getItem(GAME_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  }

  function saveState(state) {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  }

  function calcLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100));
  }

  function xpForLevel(level) {
    return level * level * 100;
  }

  function addXP(amount, reason = '') {
    const state = getState();
    const oldLevel = state.level;
    state.xp += amount;
    state.level = calcLevel(state.xp);
    saveState(state);
    updateXPBar(state);

    // Level up!
    if (state.level > oldLevel) {
      onLevelUp(state.level);
    }

    // Check achievements
    checkAchievements(state);
    return state;
  }

  function recordAction(actionType) {
    const state = getState();
    state.totalActions = (state.totalActions || 0) + 1;
    state.sessionActions = (state.sessionActions || 0) + 1;

    if (actionType === 'addItem') state.itemsAdded = (state.itemsAdded || 0) + 1;
    if (actionType === 'fixLowStock') state.lowStockFixed = (state.lowStockFixed || 0) + 1;

    saveState(state);
    const xpGain = XP_VALUES[actionType] || 0;
    if (xpGain > 0) addXP(xpGain, actionType);
  }

  function checkLoginStreak() {
    const state = getState();
    const today = new Date().toDateString();
    if (state.lastLoginDate === today) return; // Already logged today

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastLoginDate === yesterday) {
      state.streak = (state.streak || 0) + 1;
    } else if (state.lastLoginDate !== today) {
      state.streak = 1; // Reset streak
    }
    state.lastLoginDate = today;
    saveState(state);
    if (state.streak > 1) {
      addXP(XP_VALUES.loginStreak, 'streak');
      ToastManager.show(`🔥 ${state.streak}-day streak! +${XP_VALUES.loginStreak} XP`, 'success');
    }
  }

  function checkAchievements(state) {
    ACHIEVEMENTS.forEach(ach => {
      if (!state.achievements[ach.id] && ach.check(state)) {
        state.achievements[ach.id] = { unlockedAt: Date.now() };
        saveState(state);
        onAchievementUnlocked(ach);
        addXP(ach.xp);
      }
    });
  }

  function onLevelUp(newLevel) {
    ToastManager.show(`🎉 Level Up! You're now Level ${newLevel}!`, 'achievement');
    // Fire confetti
    if (window.confetti) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#00f5ff', '#b537ff', '#ff006e', '#ffb800'] });
    }
  }

  function onAchievementUnlocked(ach) {
    ToastManager.show(`🏆 Achievement Unlocked: ${ach.title}!`, 'achievement');
    if (window.confetti) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#ffb800', '#00c897'] });
    }
  }

  function updateXPBar(state) {
    const bar = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const levelText = document.getElementById('level-badge');
    if (!bar) return;

    const currentLevelXP = xpForLevel(state.level);
    const nextLevelXP = xpForLevel(state.level + 1);
    const progress = ((state.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    bar.style.width = `${Math.min(100, progress)}%`;
    if (xpText) xpText.textContent = `${state.xp} XP`;
    if (levelText) levelText.textContent = `Lv.${state.level}`;
  }

  function injectXPWidget() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile || document.getElementById('xp-widget')) return;
    const state = getState();
    const widget = document.createElement('div');
    widget.id = 'xp-widget';
    widget.className = 'xp-widget';
    widget.setAttribute('title', 'Your XP Progress');
    widget.innerHTML = `
      <span id="level-badge" class="level-badge">Lv.${state.level}</span>
      <div class="xp-bar-track" title="${state.xp} XP">
        <div id="xp-bar-fill" class="xp-bar-fill"></div>
      </div>
      <span id="xp-text" class="xp-text">${state.xp} XP</span>
    `;
    userProfile.prepend(widget);
    updateXPBar(state);
  }

  function renderAchievementsModal() {
    const state = getState();
    const existing = document.getElementById('achievements-modal');
    if (existing) { existing.classList.add('active'); return; }

    const modal = document.createElement('div');
    modal.id = 'achievements-modal';
    modal.className = 'modal-overlay active';
    const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]);
    const locked = ACHIEVEMENTS.filter(a => !state.achievements[a.id]);
    modal.innerHTML = `
      <div class="modal-box achievements-box">
        <button class="modal-close" onclick="document.getElementById('achievements-modal').classList.remove('active')">&times;</button>
        <h2><i class="fas fa-trophy"></i> Achievements (${unlocked.length}/${ACHIEVEMENTS.length})</h2>
        <div class="achievements-grid">
          ${ACHIEVEMENTS.map(ach => {
            const done = state.achievements[ach.id];
            return `<div class="achievement-card ${done ? 'unlocked' : 'locked'}">
              <div class="ach-icon"><i class="fas ${ach.icon}"></i></div>
              <div class="ach-info">
                <h4>${ach.title}</h4>
                <p>${ach.description}</p>
                <span class="ach-xp">+${ach.xp} XP</span>
              </div>
              ${done ? '<span class="ach-check"><i class="fas fa-check-circle"></i></span>' : '<span class="ach-lock"><i class="fas fa-lock"></i></span>'}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }

  function init() {
    document.addEventListener('DOMContentLoaded', () => {
      injectXPWidget();
      checkLoginStreak();
    });
  }

  return { init, recordAction, addXP, getState, renderAchievementsModal, ACHIEVEMENTS };
})();

GamificationManager.init();
