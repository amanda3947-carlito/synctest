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

- **First run, in three acts** (`onboard.js`, after the ":: essentials setup" frames):
  1. *Essentials, 1 of 6 to 6 of 6*: name, number and code, birthday, photos (2 × 2, drag to reorder,
     first is the card), the basics (an accordion: occupation, education, hometown, location, height,
     activity, kids, smoking), and what best describes you (one sticker, shown beside your name).
  2. *The celebration*: a sky with drifting stickers. "Get plugged in" opens act three.
  3. *Make it yours*: tap the field and the page goes quiet under white; pick a category (Tracks,
     Movies, Shows, Spots, GIFs, Books, each with its pastel) and the field reads "Searching tracks";
     results are rows with a 36px cover and a colour-matched tag. A pick lands on a ring of cards you
     spin with a sideways drag (the front one big and bright, the back ones small and dim; left alone
     it turns slowly and settles with one card facing you). Empty, the ring is a planet and four stars.
     A downward drag or a press lifts a card out to drop into Music, Vibes, Watching & Reading or
     Spots, which are squares. Ten on the ring is the cap. Then your profile, for real, with a way back.
     Sources: tracks and books from Apple's catalog; movies and shows from Wikipedia's search (Apple's
     film and show search answers almost nothing now), posters included; spots from the `places`
     table. The GIFs tile opens a keyboard to browse and narrow (the prototype's reel, or Giphy's
     trending and search once `giphyKey` is set in `config.js`). When a catalog comes up empty, and
     always for spots, an "Add a movie / show / book / spot" row adds it by name; it draws as a
     typographic card in its category colour.
- **Editor** from your avatar: every piece above, plus rotation, your line, lyrics, cover.
- **People** come from `feed()`; **profile** is the ":: profile view" frame (1092:13901), nothing
  more: Intro, Rotation, Details (120 × 68 chips with Phosphor icons), Vibes, Lyrics to live by, Spots,
  then "Not interested". A real person's profile shows only what they filled in; the three prototype
  names keep Damon's frame content. The sticker you picked sits beside your avatar and name; it is
  not a section. Reading & watching, Going to, Mutuals and Taste are off the profile for now (their
  tables and API stay). "You too" on shared spots
  and titles.
- **Make it a mixtape** sends real turns; the heart is love-as-is; "Not interested" is a pass. Realtime
  on `builds` lights the Builds dot and plays the toast on a match.

## Starting over
Open `sync/?reset` to sign out first and land on the first screen. Test numbers 555 000 0010 through
0019 take the code 123456; a number that has finished onboarding goes straight to the feed, so pick
an unused one for a full run (0010 and 0011 are used).

## Not yet

Text and voice prompts in the essentials (coming), Builds and Chats tabs (nothing designed for them yet),
plan / watchlist / dinner builds in the UI (the backend has them), push notifications, contact import on
iOS Safari (needs the installed app), the video requirement on photos (encouraged, not enforced).

## Testing

Test numbers from the Supabase setup accept the code 123456: 15550000010, 15550000011, 15550000012.
Two phones signed in with two of those can build with each other for real.
