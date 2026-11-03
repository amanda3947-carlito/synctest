// Sync: where the app talks to. The publishable key is meant to ship in clients; row-level
// security in the database decides what it can do. The secret key never goes here.
window.SYNC_CONFIG = {
  supabaseUrl: 'https://akqnkoowfhoobzcooriv.supabase.co',
  supabaseKey: 'sb_publishable_NNfJdNqNg_YRK_-BKrFvTA_c0XtiCDm',
  // local media in the prototype's assets folder stands in for storage paths under demo/
  demoAssets: 'assets/',
};
