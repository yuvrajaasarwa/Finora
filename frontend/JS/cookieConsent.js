// cookieConsent.js - GDPR Cookie Notice & Preference Manager
(function initCookieConsent() {
  const CONSENT_KEY = 'fhb_cookie_consent';
  const savedConsent = localStorage.getItem(CONSENT_KEY);

  if (savedConsent) return; // Consent already provided or rejected

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cookie-consent-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner-content">
        <div class="cookie-text">
          <strong>🍪 Cookie & Privacy Notice</strong>
          <p>We use essential cookies and local storage to keep you authenticated and preserve your theme preferences. No third-party ad trackers.</p>
        </div>
        <div class="cookie-actions">
          <a href="/privacy.html" class="cookie-link">Privacy Policy</a>
          <button id="cookie-reject-btn" class="btn btn-ghost btn-sm">Reject Non-Essential</button>
          <button id="cookie-accept-btn" class="btn btn-primary btn-sm">Accept Cookies</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      banner.remove();
    });

    document.getElementById('cookie-reject-btn')?.addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'essential_only');
      banner.remove();
    });
  });
})();
