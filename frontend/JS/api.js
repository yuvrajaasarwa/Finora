const Auth = {
  get token() {
    return localStorage.getItem('finora_token');
  },
  get user() {
    const userStr = localStorage.getItem('finora_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },
  set(token, user) {
    if (token) localStorage.setItem('finora_token', token);
    if (user) localStorage.setItem('finora_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('finora_token');
    localStorage.removeItem('finora_user');
  },
  logout() {
    this.clear();
    window.location.href = '/login.html';
  },
  requireLogin() {
    if (!this.token) {
      window.location.href = '/login.html';
    }
  }
};

async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (Auth.token) {
    headers['Authorization'] = `Bearer ${Auth.token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
      Auth.clear();
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

if (typeof window !== 'undefined') {
  window.Auth = Auth;
  window.api = api;
}
