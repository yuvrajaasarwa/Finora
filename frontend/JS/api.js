// api.js - Central API client for the Financial Habit Builder
// Works when frontend is served by the same Express server on the same origin.
// Override by setting window.API_BASE = 'https://your-backend.onrender.com' before app.js loads.

const API_BASE = window.API_BASE || '';
const TOKEN_KEY = 'fhb_token';
const USER_KEY = 'fhb_user';

const Auth = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  requireLogin() {
    if (!this.token) { window.location.href = '/login.html'; }
  },
  requireAdmin() {
    if (!this.token) return window.location.href = '/login.html';
    if (!this.user || this.user.role !== 'admin') window.location.href = '/dashboard.html';
  },
  logout() {
    this.clear();
    window.location.href = '/login.html';
  },
};

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (Auth.token) headers['Authorization'] = `Bearer ${Auth.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await res.json();

  if (res.status === 401) {
    Auth.clear();
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/login.html';
    }
  }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const fmtMoney = (n, currency = (Auth.user && Auth.user.currency) || 'INR') => {
  const value = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const todayISO = () => new Date().toISOString().slice(0, 10);
