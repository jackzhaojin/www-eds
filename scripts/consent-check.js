let consentedLoaded = false;

/**
 * Consent, as decision 9 sets it: granted by default with no banner, as the site worked on
 * GitHub Pages, unless the browser sends a Global Privacy Control signal, which counts as a
 * decline. A real CMP (OneTrust, etc.) could replace this later.
 *
 * Only the production host gets that default. Previews, branch hosts, eds and the gate sweeps
 * would otherwise fill the GA4 property with test traffic, so they default to declined.
 *
 * The default can be overridden with a query parameter for testing, on any host:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent
 *
 * @returns {boolean} true if the user has consented
 */
function hasConsent() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent !== null) {
    return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
  }
  // Global Privacy Control counts as a decline
  if (navigator.globalPrivacyControl === true) return false;
  // default: granted on the production host only
  return window.location.hostname === 'www.jackzhaojin.com';
}

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

onConsentUpdate();
