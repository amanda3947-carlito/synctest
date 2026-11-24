// Sync: where the app talks to. The publishable key is meant to ship in clients; row-level
// security in the database decides what it can do. The secret key never goes here.
window.SYNC_CONFIG = {
  supabaseUrl: 'https://akqnkoowfhoobzcooriv.supabase.co',
  supabaseKey: 'sb_publishable_NNfJdNqNg_YRK_-BKrFvTA_c0XtiCDm',
  // local media in the prototype's assets folder stands in for storage paths under demo/
  demoAssets: 'assets/',
  // GIPHY (developers.giphy.com, app "aux"): GIF trending and search. Like the publishable key above, it ships
  // in the client. A beta key is capped at about 100 calls an hour; request a production key before launch.
  giphyKey: 'oGEIYrwWEkyUCxhgxImAfoN064TjCvvQ',
};
