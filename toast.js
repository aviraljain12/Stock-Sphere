/**
 * toast.js - Toast Notification Manager
 * Provides showable toast notifications with types: success, error, warning, info, achievement
 */

const ToastManager = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle', achievement: 'fa-trophy' };
    toast.innerHTML = `
      <i class="fas ${icons[type] || 'fa-info-circle'} toast-icon"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">&times;</button>
    `;
    c.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => { toast.classList.add('toast-show'); });
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  return { show };
})();
