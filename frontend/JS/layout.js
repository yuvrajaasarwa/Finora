// layout.js - Renders the unified navigation sidebar, top bar, user profile, and theme manager for WealthPulse

// Initialize theme immediately on load (Dark or Light ONLY)
(function initTheme() {
  let savedTheme = localStorage.getItem('wealthpulse_theme');
  if (savedTheme !== 'dark' && savedTheme !== 'light') {
    savedTheme = 'light'; // Default to light mode
  }
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

function getCurrentTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  return current === 'light' ? 'light' : 'dark';
}

function toggleTheme() {
  const current = getCurrentTheme();
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('wealthpulse_theme', nextTheme);
  
  // Update toggle button text/icon
  const btn = document.getElementById('topbar-theme-toggle');
  if (btn) {
    btn.innerHTML = nextTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
    btn.setAttribute('data-theme', nextTheme);
  }
}

function exportUserData() {
  if (!Auth.token) return;
  window.location.href = `${API_BASE || ''}/api/auth/export-data`;
}

function deleteUserAccount() {
  if (!confirm('⚠️ Are you sure you want to permanently delete your Finora account and all personal financial records? This action cannot be undone.')) {
    return;
  }
  api('/api/auth/delete-account', { method: 'DELETE' })
    .then(() => {
      alert('Account deleted successfully.');
      Auth.logout();
    })
    .catch((err) => alert(`Deletion failed: ${err.message}`));
}

function renderTopBar(pageTitle = '') {
  const main = document.querySelector('.main');
  if (!main) return;

  const existing = document.getElementById('app-topbar');
  if (existing) existing.remove();

  const user = Auth.user || { name: 'User', email: 'user@finora.app' };
  const currentTheme = getCurrentTheme();
  const themeLabel = currentTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';

  const topbar = document.createElement('div');
  topbar.id = 'app-topbar';
  topbar.className = 'app-topbar';
  topbar.innerHTML = `
    <div class="topbar-left">
      <span class="topbar-breadcrumb">Finora / ${pageTitle || 'Dashboard'}</span>
    </div>
    <div class="topbar-right">
      <button class="btn btn-ghost btn-sm" id="download-pdf-btn" onclick="generateFinancialReportPDF()" title="Export 3-Page Financial Report PDF">
        📄 Download Report (PDF)
      </button>
      <button class="btn btn-ghost btn-sm" onclick="exportUserData()" title="Export your account data as JSON (GDPR)">
        📥 Export Data
      </button>
      <button class="btn btn-ghost btn-sm theme-topbar-toggle" id="topbar-theme-toggle" onclick="toggleTheme()" data-theme="${currentTheme}">
        ${themeLabel}
      </button>
      <div class="topbar-user-badge" title="${user.name} (${user.email})">
        <span class="avatar-dot"></span>
        <span class="user-name">${user.name ? user.name.split(' ')[0] : 'Member'}</span>
      </div>
    </div>
  `;

  main.prepend(topbar);
}

function renderSidebar(active) {
  const el = document.getElementById('app-sidebar');
  if (!el) return;
  const user = Auth.user || { name: 'User', email: 'user@finora.app', role: 'user' };
  const isAdmin = user.role === 'admin';

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'F';

  const links = [
    { href: '/dashboard.html', label: 'Dashboard', icon: '📊', key: 'dashboard' },
    { href: '/expenses.html', label: 'Income & Expenses', icon: '💳', key: 'expenses' },
    { href: '/habits.html', label: 'Habit Builder', icon: '⚡', key: 'habits' },
    { href: '/goals.html', label: 'Savings Goals', icon: '🎯', key: 'goals' },
    { href: '/investments.html', label: 'Investments & Assets', icon: '📈', key: 'investments' },
    { href: '/analytics.html', label: 'Wealth Analytics', icon: '📉', key: 'analytics' },
    { href: '/settings.html', label: 'Settings', icon: '⚙️', key: 'settings' },
  ];
  if (isAdmin) {
    links.push({ href: '/admin.html', label: 'Admin Command', icon: '🛡️', key: 'admin' });
  }

  el.innerHTML = `
    <div class="brand-row">
      <div class="brand-mark">F</div>
      <div>
        <div class="brand-title">Finora</div>
        <div class="brand-subtitle">Habit & Wealth Intelligence</div>
      </div>
    </div>
    <nav>
      ${links.map(l => `
        <a class="nav-link ${l.key === active ? 'active' : ''}" href="${l.href}" data-testid="nav-${l.key}">
          <span style="font-size: 15px;">${l.icon}</span>
          <span>${l.label}</span>
        </a>
      `).join('')}
    </nav>
    
    <div class="user-block">
      <div class="user-card-inner">
        <div class="user-avatar-badge">${initials}</div>
        <div class="user-info-text">
          <strong>${user.name}</strong>
          <span class="user-email">${user.email}</span>
        </div>
      </div>
      <div class="flex between" style="align-items: center; margin-bottom: 8px;">
        <span class="badge ${isAdmin ? 'amber' : 'blue'}">${user.role ? user.role.toUpperCase() : 'MEMBER'}</span>
      </div>

      <div class="sidebar-legal-links" style="font-size: 11px; margin-top: 8px; margin-bottom: 10px; display: flex; gap: 8px;">
        <a href="/privacy.html" target="_blank" style="color: var(--text-muted);">Privacy</a> · 
        <a href="/terms.html" target="_blank" style="color: var(--text-muted);">Terms</a>
      </div>

      <button class="btn btn-ghost btn-block mt-8" data-testid="logout-btn" onclick="Auth.logout()">Log out</button>
    </div>
  `;

  // Automatically render Top Bar with active section title
  const activeLink = links.find(l => l.key === active);
  renderTopBar(activeLink ? activeLink.label : '');
}
