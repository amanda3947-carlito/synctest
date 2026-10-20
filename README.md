# Sync Concept Lab

A phone app for testing a dating app concept before you build the real thing.

The concept under test: **profiles are playlists**. There is no like button.
To show interest you remix someone's playlist (add a track from your library,
or swap one of theirs for yours) and send it back. The two of you go back and
forth, and when you both agree it's ready it becomes a **mixtape**. Only then
does the chat unlock. The hypothesis is that interactivity through music
builds mutual interest *before* a match, so conversations start warmer.

Hand your phone to a tester. They read a short pitch, browse a feed of profile
cards, open profiles, remix playlists, get simulated replies, agree on a
mixtape, send a first message, and answer a short survey. You get the funnel
(seen → opened → remixed → replied → ready → mixtape → messaged), edit counts,
rounds, timings and survey scores, split by variant and exportable as JSON or
CSV.

It is a single HTML file plus a manifest and service worker, so it runs in any
phone browser and installs to the home screen like a native app. No build
step, no backend, no app store.

## Design source

The UI is built on the **Spades Design System** Figma file
(`Qrx7kdcMXnddTjPytlIF9x`). The CSS custom properties at the top of
`index.html` mirror Spades variables one to one: Color (SDS Light and SDS Dark
modes, plus the Special accents), Size (Space, Radius, Stroke), Effects (Drop
Shadow, Liquid glass) and Typography (DM Sans scale, DM Mono captions,
Bricolage Grotesque for the Title Hero).

Components follow their Spades counterparts: Button, Icon Button, Tag and Tag
Toggle, Input Field, Textarea, Stats Card, Avatar. The feed uses the **Feed
Card** family from the Cards page (card header, UFI wave / remix / save
buttons, and the seven modules: Most listened to, Just played, Now playing,
Going to, Mutuals, In your orbit, voice note). The playlist and its Remix
button follow the `playlist full` frame ("Put your own spin on it and send it
back"), and the "shared" / "you added" badges follow `badge micro`.

Photos are tinted placeholders because this environment cannot download Figma
assets. Add a `photo` URL to any profile in Setup to use a real image.

## Run it on your phone

1. **GitHub Pages.** Enable Pages from this branch (root) and open the URL on
   your phone.
2. **Any static host.** Upload `index.html`, `manifest.webmanifest`, `icon.svg`
   and `sw.js`.
3. **Local network.** `python3 -m http.server 8080` on a laptop, then open
   `http://<laptop-ip>:8080` on the phone (home-screen install and offline
   mode need HTTPS, so use 1 or 2 for those).

Then Share → **Add to Home Screen**.

## How a test session works

1. **Test tab.** Type the tester's name, pick a variant or leave it on
   auto-assign, tap Start, hand the phone over.
2. **Pitch.** Three slides. Time spent is recorded.
3. **Feed.** A scrolling list of Feed Cards. Cards count as seen when half
   visible. Tapping a card, or its remix button, opens the full profile.
4. **Profile.** Photo, bio, listening module, shared-artist count, and the
   playlist. **Remix** turns the playlist editable: add a track from the
   tester's library, or swap one of theirs. **Send it back** creates a mix.
5. **Mixes.** The other person replies after a configurable delay, adding one
   or two tracks of their own. The tester can add more and send another round,
   or say **It's ready**. When both agree, it's a mixtape and the chat unlocks.
   The tester can send one message.
6. **Survey** and **Save session**.

Variant B adds a classic like button on cards and profiles. Likes match with a
configurable chance and unlock chat directly, so you can compare the remix path
against the path everyone already knows.

**Results tab** shows remix rate, edits per remix, mixtape rate, message rate,
the funnel, a per-variant table (open, remix, like, match, message rates,
median rounds, NPS, and the "I already knew something about them" score), open
rate by card module, the tracks testers reach for most, survey averages,
quotes, and every session with a delete button.

## Configuration

Everything is editable in Setup, as a form for the basics and JSON for the rest.

Variant fields:

| field | what it does |
|---|---|
| `likeButton` | `true` adds a classic like to cards and profiles |
| `readyAfterRounds` | replies needed before "It's ready" unlocks (default 1) |
| `agreeChance` | 0 to 1, how often the other person agrees once asked |
| `replyDelayMs` | how long the other person takes to send the mix back |
| `pitch` | optional pitch override for this variant |

Session fields: `cardsPerSession` (feed length), `likeMatchChance` (like
variants), `assignVariant` (`alternate` or `random`).

Profiles carry `name`, `age`, `hood`, `dist`, `hue`, optional `photo`, `bio`,
a `module` for the card, a `playlist` (the four tracks on their profile) and
`more` (the tracks they add in replies). `library` is the tester's own tracks,
which is what the Add and Swap sheets offer.

Survey question types: `likert` (1 to 5), `nps` (0 to 10), `text`.

## Data

Everything is stored in the phone browser's local storage. Nothing leaves the
device unless you export it. Export after each round of testing.

- **JSON**: full bundle, including config, every session's interactions,
  threads (each round's tracks and who added them) and the event log.
- **CSV**: one row per profile the tester saw, with viewed / opened / open
  source / time in profile / liked / sends / tracks added / swapped / rounds /
  replies / ready / matched / match via / time to match / messaged.
