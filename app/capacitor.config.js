// The aux iOS shell. Two ways to run the web app inside it:
//   live:    the shell loads the deployed site, so every push to GitHub Pages shows up in the app
//            without rebuilding in Xcode. The default while we build.
//   bundled: the shell carries a copy of ../sync (npx cap sync copies it in). For TestFlight and
//            the store, and for working offline. Flip MODE, then `npx cap sync ios`.
const MODE = process.env.AUX_MODE || 'live';
const LIVE_URL = 'https://amanda3947-carlito.github.io/synctest/sync/';

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'app.aux.sync',
  appName: 'aux',
  webDir: '../sync',
  backgroundColor: '#ffffff',
  ios: {
    contentInset: 'never',       // the page runs under the status bar and home indicator; CSS uses the safe-area insets
    scrollEnabled: false,        // the app scrolls its own panels, the web view itself never bounces
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK' },
  },
  ...(MODE === 'live' ? { server: { url: LIVE_URL, cleartext: false } } : {}),
};

module.exports = config;
