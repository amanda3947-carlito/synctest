// Inside the iOS shell (Capacitor) the page runs under the real status bar and home indicator.
// This marks the document so styles can swap the drawn status bar for the safe-area inset, and keeps
// the real status bar's text readable: light over the feed and profiles, dark over the white panels.
(() => {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.classList.add('is-native');
  // a screen much bigger than a phone (an unfolded foldable): draw aux at the 17 Pro's 402 × 874, centred, the way
  // it looks on a regular phone, instead of stretching to fill it. Folding it back (or any phone) fills the screen again.
  const FRAME_FROM = 480;   // no phone in portrait is this wide
  const frame = () => document.documentElement.classList.toggle('is-framed', window.innerWidth >= FRAME_FROM);
  frame();
  window.addEventListener('resize', frame);
  const StatusBar = cap.Plugins && cap.Plugins.StatusBar;
  let current = null;
  const set = (style) => { if (style === current) return; current = style; if (StatusBar && StatusBar.setStyle) StatusBar.setStyle({ style }).catch(() => {}); };
  // dark text over the white screens (onboarding, your profile, the Builds list); light over photos
  // (the feed, a person's card, a build pushed in from the Builds tab)
  const sync = () => {
    const auth = document.querySelector('.device__auth'); const dev = document.querySelector('.device');
    // your profile in View, still on its cover: light text over the photo, as the frame draws it; once the cover
    // scrolls away (is-light) it's the white page again
    const onCover = !!(auth && !auth.hidden && auth.querySelector('.auth--mine-view:not(.is-light)'));
    const onWhite = ((auth && !auth.hidden) && !onCover) || (dev && dev.classList.contains('is-tab-builds') && !dev.classList.contains('is-push-in'));
    // framed, the real status bar sits over the dark backdrop around the phone, so its text stays light
    const framed = document.documentElement.classList.contains('is-framed');
    set(!framed && onWhite ? 'LIGHT' : 'DARK');
  };
  const start = () => {
    const auth = document.querySelector('.device__auth'); const dev = document.querySelector('.device');
    if (auth) new MutationObserver(sync).observe(auth, { attributes: true, attributeFilter: ['hidden', 'class'], subtree: true, childList: true });
    if (dev) new MutationObserver(sync).observe(dev, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
