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

- **The splash** (the "animation frames" storyboard, 1107:14029, read as one motion): the chrome
  letters come forward, then fall back into a pop of colour that swells behind them until it owns the
  screen and fades off fast onto the title screen: "Pass the aux", a "Let's build" button that starts
  act one, and behind them an orbit of pieces (photos, covers, stickers) that keeps turning the way the
  board's ring does: seventeen pieces on their own tilted ellipses, a turn in about 30 s, with depth driving
  size (a front piece is about five times its back self), opacity, softness and stacking together, all
  continuous. A tap skips to the title; reduced motion goes straight there.
- **Every step's chrome** (1105:5031): a thin chevron before the title walks back a step (from the
  first step, back to the splash), the step pill sits right, and under the mint Next an outlined
  Cancel leaves the run: what is saved stays with the account, and the splash comes back. While
  editing from your profile, Cancel returns to the profile without saving.
- **First run, in three acts** (`onboard.js`, after the ":: essentials setup" frames):
  1. *Essentials, 1 of 8 to 8 of 8*: name, number and code (a focused pill goes white with its label on
     the border), birthday (MM / DD / YYYY with a calendar picker: month and year menus, a 7-wide grid),
     what you are looking for on aux (one pick of five, each with its charm: cool new friends, a new crush, fun casual
     dates, something serious, long term relationship; saved as `profiles.seeking`),
     photos (2 × 2, drag to reorder, first is the card, × top right), the basics (an accordion, in order: hometown, location, gender, occupation,
     education, height, activity, kids, drinking, smoking; hometown, location, occupation and height are typed; education,
     activity, drinking and smoking are one pick; kids takes several; gender is Man / Woman / Non-binary / Something else, and
     "Something else" opens an iOS-style glass menu with the finer answers in groups, whose pick fills the row like any other), the prompts ("Let's learn more
     about you": Intro, Lyrics to Live By, Deal-breakers, Current Obsession as four tiles; tapping one
     opens a card over the keyboard with the emoji row and a field; the waveform records a voice note
     instead; two or more to go on; migration 0006 adds `profiles.prompts`), and what best describes you
     (one sticker, shown beside your name).
  2. *The celebration*: a sky with drifting stickers. "Get plugged in" opens the cover pick (":: making it
     you._cover selection": eight covers in two columns, the pick lifted), then act three.
  3. *Make it yours*: tap the field (a surface pill) and the page goes quiet under white; pick a category
     (Tracks, Movies, Shows, Spots, GIFs, Books, each with its pastel) and it sits in the field as a chip
     with an × to clear;
     results are rows with a 36px cover and a colour-matched tag. A pick lands on a ring of cards you
     spin with a sideways drag (the front one big and bright, the back ones small and dim; left alone
     it turns slowly and settles with one card facing you). Empty, the ring is a planet and four stars.
     A downward drag or a press lifts a card out to drop into Music, Vibes, Watching & Reading or
     Spots, which are squares. Ten on the ring is the cap. Music needs three tracks before the board
     lets you on; the folder counts down. Then your profile, for real, with a way back.
     Sources: tracks and books from Apple's catalog; movies and shows from Wikipedia's search (Apple's
     film and show search answers almost nothing now), posters included; spots from OpenStreetMap
     through Photon (free, no key; the search is biased to where the phone is, Brooklyn until it
     says otherwise, and bounded to about 80 km before it tries the whole map), merged with the
     spots people here have already added. A picked spot only becomes a `places` row when you save. The GIFs tile opens a keyboard to browse and narrow (the prototype's reel, or Giphy's
     trending and search once `giphyKey` is set in `config.js`). When a catalog comes up empty, and
     always for spots, an "Add a movie / show / book / spot" row adds it by name; it draws as a
     typographic card in its category colour.
- **Your profile** from your avatar (1110:2745): an Edit | View control under the status bar, Edit
  first. Edit is the page as the frame stands now: your avatar with its badge, Photos as the first run's grid
  live on the page (add, drag to reorder and × save straight away; the first photo is your avatar), Essentials
  as the details accordion inline (each change saves on its own; the pencil opens the full step), the rows that
  still open a step (cover, badge, looking for, prompts, rotation, vibes, shelf, spots), and The basics folded
  to one line until its pencil opens name, number and birthday. The nav stays on over the page; a tab tap
  closes it.
- **The feed** (":: home feed", 1098:27924): the aux wordmark, the name with its badge; a sideways swipe opens the
  profile. A reply or a note from the profile can be typed, a GIF, or a voice note recorded in the
  field ("on select audio": bars and seconds while recording, then play and send); a voice note goes
  into the note's text as `Voice note · 7s [voice:<path>]` until Chats can play it. On your own
  profile (the real view in first run) the shelf's add card and "Suggest a spot" open a sheet that
  follows the mixtape's: search, reorder, delete, save.
- **People** come from `feed()`; **profile** is the ":: profile view" frame (1092:13901), nothing
  more: Intro, Rotation, Details (120 × 68 chips with Phosphor icons), Vibes, Lyrics to live by,
  Watching and Reading (133 × 202 covers with the kind's tag), Spots, then "Not interested". The
  frame's Controversial take (a voice note) waits for the prompts pass. A real person's profile shows only what they filled in; the three prototype
  names keep Damon's frame content. The sticker you picked sits beside your avatar and name; it is
  not a section. Going to, Mutuals and Taste are off the profile for now (their tables and API stay). "You too" on shared spots
  and titles.
- **A spot's picture** is looked up the first time a spot without one is shown: the nearest photo on
  Wikimedia Commons within 120 m of its pin (no key), skipping maps, logos and drawings, then kept on the
  place through `set_place_image` so it is fetched once. Parks, venues and landmarks mostly have one; a
  quiet bar often does not and keeps the pin. Spots picked from the map carry their pin; the seed spots have theirs.
- **What they're looking for** sits over the name on the feed card as a glass pill with the onboarding charm
  (the ":: home feed" frame, 1103:4663). The seed has six people: Damon, Olivia, Theo, Mohammad, Oliver and
  Veronica, each with photos, details, prompts, a rotation, a second build, a shelf and spots.
- **The Builds tab** (":: builds", 1100:36558 and 36445) is a white plane over the feed with its own header
  (your avatar with its badge, Builds, faders) and four chips. Highlights shows the build that most wants you
  as one big card (their photo, their looking-for pill, name and badge, what moved last) with the rest in a
  grid under it; New is what waits on you; Recently active is everything by last movement; Sent is what you
  started and they still hold. Each card says what happened last ("Added 2 tracks", "You made it a mixtape",
  "It's a mixtape"), with a mint dot when it is your move. A tap pushes that person's card in from the right
  with their profile open on the build; the profile's back slides it out. Realtime refreshes the list.
- **Make it a mixtape** sends real turns; the heart is love-as-is; "Not interested" is a pass. A send or a
  note takes the person off the feed (a build in flight lives on the Builds tab, coming). You can have builds
  going with several people at once; only one live build per pair. Realtime on `builds` lights the Builds dot and plays the toast on a
  match. The charm beside a name is the taste badge (`assets/badges`, a white disc with the sticker, from
  the "taste badges" frame). A shelf row saved without a cover gets one looked up when it is shown.

## The iOS app (Xcode)

The web app runs as-is inside an iOS shell (Capacitor) that lives in `app/`. The shell has two
modes, set in `app/capacitor.config.js`:

- **live** (the default while we build): the shell loads the deployed site, so every push to GitHub
  Pages shows up in the app with no rebuild. Open the app, pull to nothing: it is just the site.
- **bundled**: `npx cap sync ios` copies `sync/` into the app, for TestFlight, the store and offline.
  Set `AUX_MODE=bundled` (or flip `MODE` in the config) before syncing.

On a Mac with Xcode and Node installed:

```
cd app
npm install
npx cap sync ios
npx cap open ios
```

In Xcode pick the `App` target, set your team under Signing & Capabilities, choose your iPhone and
press Run. The bundle id is `app.aux.sync`; change it there if you need another. Info.plist already
carries the camera, photo library, microphone and location usage strings, portrait only, and the
status bar settings. The icon is the aux mark on the brand gradient (one 1024 image in
`Assets.xcassets`).

Inside the shell the page runs edge to edge: `native.js` marks the document `is-native`, the drawn
"9:41" status bar gives way to the real one (the safe-area inset takes its height), the panel tops
and the nav follow the insets, and the real status bar's text goes dark over the white panels and
light over the feed. Everything else is the same code as the website.

For TestFlight: Product → Archive in Xcode, then Distribute App → App Store Connect. That needs an
Apple Developer account ($99/yr) with the app registered in App Store Connect under the same bundle
id. Switch to bundled mode first so reviewers get a copy that does not depend on GitHub Pages.

## Starting over
Open `sync/?reset` to sign out first and land on the first screen. Signed in, `sync/?go=photos` (or
`prompts`, `basics`, `describes`, `board`, `rotation`, `cover`, `name`, `seeking`) opens that step of the editor straight away. Test numbers 555 000 0010, 0011 and
0012 take the code 123456 (more can be added under Authentication → Phone → Test phone numbers in
Supabase); a number that has finished onboarding goes straight to the feed, so pick an unused one for
a full run (0010 and 0011 are used).

## Not yet

Builds and Chats tabs (nothing designed for them yet),
plan / watchlist / dinner builds in the UI (the backend has them), push notifications, contact import on
iOS Safari (needs the installed app), the video requirement on photos (encouraged, not enforced).

## Testing

Test numbers from the Supabase setup accept the code 123456: 15550000010, 15550000011, 15550000012.
Two phones signed in with two of those can build with each other for real.
