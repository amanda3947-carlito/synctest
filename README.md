# Sync Concept Lab

A phone app for testing a dating app concept before you build the real thing.

The concept under test: **you build something together before you match**.
Every profile shows one to three of the person's builds in full: their ideal
mixtape, watchlist, plan for a day out, or dinner. There is no like button. To
show interest you put your own spin on one of them (swap in your picks, add to
it, counter a course) and send it back. The two of you go back and forth, and
when you both agree it's done, that's the match. Only then does the chat open.

Alongside the builds, every profile has an about section with three facets
instead of prompts: **Going to** (events, user-entered), **In their orbit**
(places, user-entered, with the ones in your orbit marked) and **Mutuals**
(from contacts). Each one does a job: events and places feed The Plan's
"what we'll do" and "where" pickers, and mutuals are the trust signal.

Four build types ship, all driven by one engine:

| build | kind | slots / rules |
|---|---|---|
| **Mixtape** | list | up to 8 tracks, at least 2 from each person, 2 changes a turn |
| **Watchlist** | list | up to 6 films or shows, at least 2 each, 2 changes a turn |
| **The Plan** | slots | When, Vibe, Where, What we'll do. Where draws from both people's orbit (places) |
| **Dinner** | slots | Beverage, Appetizer, Main, Sides, Dessert |

Slot builds are done when every slot is filled and both people filled at
least one. List builds are done at the minimum length with the minimum from
each side. Either way both people have to say it's done before it aligns.

Hand your phone to a tester. They read a short pitch, go through people one at
a time (full profile, global Pass), start a build or pass, get simulated
replies in Builds, align, and chat. Results give you the funnel, which builds
people choose and finish, rounds and edits per build, the effect of how many
starters a profile has, and survey scores, split by variant.

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
Toggle, Input Field, Textarea, Stats Card, Avatar. Profiles use the Feed Card modules from the Cards page (Most listened to,
Just played, Now playing, Going to, Mutuals, In your orbit, voice note). The
build editor follows the `playlist full` frame (rows with cover, title,
artist, and the "shared" / "yours" micro badges), and the starter cards and
slot chips use Tag and Card.

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
3. **People.** One full profile at a time: photo, bio, the about section
   (going to, in their orbit, mutuals), shared counts, and their builds shown
   in full. **Pass** moves on. Each build ends with the Figma remix bar: "Put
   your own spin on it and send it back" and the verb (Remix, Curate, Plan,
   Cook).
4. **Editor sheet.** The verb opens a bottom sheet over the profile. Swap or
   add on list builds, counter any slot on slot builds, within the per-turn
   limit. Picking a value swaps the sheet to the library view and back.
   **Send it back** creates the build and moves to the next person. One build
   per person at a time.
5. **Builds.** The other person replies after a delay: fills slots, adds
   items, occasionally counters. The tester makes changes and sends another
   round, or says **It's done** once the rules are met. When both agree, it
   aligns.
6. **Chats.** Aligned builds live here with the finished artifact and an open
   chat. The tester can send a message.
7. **Survey** and **Save session**.

Variant B adds a classic like button on profiles. Likes match with a
configurable chance and open chat directly, so the build path can be measured
against the path everyone already knows.

**Results tab** shows build rate, started-to-sent conversion, aligned rate,
message rate, the funnel, a table of which builds are offered, chosen, sent and
aligned (with median rounds and edits), build rate by number of starters on
the profile, a per-variant table, survey averages, quotes, and every session.

## Configuration

Everything is editable in Setup, as a form for the basics and JSON for the rest.

Build types (`buildTypes`): `kind` is `list` (`capacity`, `min`, `minEach`,
`perTurn`, `unit`) or `slots` (`slots: [{id, label}]`, `perTurn`), plus
`name`, `verb`, `icon`, `startHint`, `editTitle`, `doneTitle`. Add a type here
and give profiles starters of that type and it works end to end.

`library` is what the tester can add: `tracks`, `titles`, `plan.{when, vibe,
place, do}`, `dinner.{beverage, appetizer, main, sides, dessert}`. The Plan's
Where picker also offers the other person's `orbit`, grouped by whose orbit
it is. `otherPools` is what the simulated other side replies with.

Profiles carry `name`, `age`, `hood`, `dist`, `hue`, optional `photo`, `bio`,
`events` (`{month, day, title, place}`), `orbit` (places), `mutuals` (names)
and `builds`: one to three, each `{type, items}` for lists or
`{type, slots: {id: value}}` for slot builds, filled out in full. The
tester's own `library.events` show up in The Plan's picker as "Bring them
to"; the other person's events as "Go with them to".

Variant fields: `likeButton`, `agreeChance` (0 to 1), `replyDelayMs`, optional
`pitch`. Session fields: `peoplePerSession`, `likeMatchChance`, `assignVariant`.

Survey question types: `likert` (1 to 5), `nps` (0 to 10), `text`.

## Data

Everything is stored in the phone browser's local storage. Nothing leaves the
device unless you export it. Export after each round of testing.

- **JSON**: full bundle, including config, every session's interactions,
  builds (every slot or item and who contributed it, by round) and the event
  log.
- **CSV**: one row per person the tester saw, with starters offered, time on
  profile, passed, liked, build type, started, time to start, sends, edits,
  rounds, replies, ready, aligned, aligned via, time to align, messaged.
