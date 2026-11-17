// Inside the iOS shell (Capacitor) the page runs under the real status bar and home indicator.
// This marks the document so styles can swap the drawn status bar for the safe-area inset, and keeps
// the real status bar's text readable: light over the feed and profiles, dark over the white panels.
(() => {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.classList.add('is-native');
  const StatusBar = cap.Plugins && cap.Plugins.StatusBar;
  const set = (style) => { if (StatusBar && StatusBar.setStyle) StatusBar.setStyle({ style }).catch(() => {}); };
  // dark text over the white screens (onboarding, your profile, the Builds list); light over photos
  // (the feed, a person's card, a build pushed in from the Builds tab)
  const sync = () => {
    const auth = document.querySelector('.device__auth'); const dev = document.querySelector('.device');
    const onWhite = (auth && !auth.hidden) || (dev && dev.classList.contains('is-tab-builds') && !dev.classList.contains('is-push-in'));
    set(onWhite ? 'LIGHT' : 'DARK');
  };
  const start = () => {
    const auth = document.querySelector('.device__auth'); const dev = document.querySelector('.device');
    if (auth) new MutationObserver(sync).observe(auth, { attributes: true, attributeFilter: ['hidden'] });
    if (dev) new MutationObserver(sync).observe(dev, { attributes: true, attributeFilter: ['class'] });
    sync();
  };
  // the keyboard: the shell shrinks the web view to the space above it (capacitor.config.js), and tells the page
  // so the bottom bars drop their home-indicator padding while it's up
  const Keyboard = cap.Plugins && cap.Plugins.Keyboard;
  if (Keyboard && Keyboard.addListener) {
    const root = document.documentElement;
    const kb = (open) => () => { root.dataset.kb = open ? 'open' : ''; root.classList.toggle('is-kb-open', open); };
    Keyboard.addListener('keyboardWillShow', kb(true));
    Keyboard.addListener('keyboardWillHide', kb(false));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
