# Sync, live

The designed Sync prototype (from `sync-prototype`) wired to the Supabase backend in `../supabase`.
Served by GitHub Pages from this branch:

- **App:** https://amanda3947-carlito.github.io/synctest/sync/
- **Backend check:** https://amanda3947-carlito.github.io/synctest/sync/check.html

```
sync/
  index.html, styles.css, main.js   the prototype, with the sign-in sheet and live states added
  config.js                         project URL and publishable key
  api.js                            supabase-js wrappers: auth, feed, profiles, the build verbs, realtime
  check.html                        runs the backend checks from the browser
  assets/                           the prototype's media; storage paths under demo/ map here
```

## What's live

- **Sign in** by phone and code, then first run (`onboard.js`): name and birthday, up to five photos in
  the Style bento, a rotation of four or more tracks, your intro line typed into the quote card, and the
  optional steps: taste stickers, your orbit (search places, add missing ones), going to (events),
  mutuals (contacts hashed on the phone where the browser allows), and a cover. Tapping your avatar
  opens the same steps as an editor.
- **People** come from `feed()`: everyone with a profile up whom you haven't passed, blocked, or built with.
  People you have a build in flight with come first, yours-to-move on top.
- **Profile** draws their intro, rotation, style, taste and spots from the database; Damon's frame content
  stands in for anything a person hasn't filled in yet. A spot in both orbits shows "you too".
- **Make it a mixtape** sends `start_build`. On your turn it sends `send_turn`, with "It's a mixtape" to agree.
  Someone who loved yours as is gets "match back" or a counter. The tile and the profile row read the state.
- **The heart** is "love it as is" on their mixtape: the note goes with it, they match back or counter.
- **Not interested** records a pass.
- **Realtime** on `builds`: your turn lights the Builds dot and the person's tile; a match plays the toast.

## Not yet

Builds and Chats tabs (nothing designed for them yet), Style photos and Lyrics beyond the editor, plan /
watchlist / dinner builds in the UI (the backend has them), push notifications, contact import on iOS
Safari (needs the installed app).

## Testing

Test numbers from the Supabase setup accept the code 123456: 15550000010, 15550000011, 15550000012.
Two phones signed in with two of those can build with each other for real.
