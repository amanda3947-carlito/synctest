// Inside the iOS shell (Capacitor) the page runs under the real status bar and home indicator.
// This marks the document so styles can swap the drawn status bar for the safe-area inset, and keeps
// the real status bar's text readable: light over the feed and profiles, dark over the white panels.
(() => {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.classList.add('is-native');
  const StatusBar = cap.Plugins && cap.Plugins.StatusBar;
  const set = (style) => { if (StatusBar && StatusBar.setStyle) StatusBar.setStyle({ style }).catch(() => {}); };
  // the onboarding / your-profile root is white when shown; the feed and profiles are photos
  const sync = () => { const auth = document.querySelector('.device__auth'); set(auth && !auth.hidden ? 'LIGHT' : 'DARK'); };
  const start = () => {
    const auth = document.querySelector('.device__auth');
    if (auth) new MutationObserver(sync).observe(auth, { attributes: true, attributeFilter: ['hidden'] });
    sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
