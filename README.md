# Sync Concept Lab

A phone app for testing a dating app concept before you build the real thing.
Hand your phone to a tester, they see a pitch, swipe through profiles, maybe
get a match, and answer a short survey. You get like rates, decision times,
feature engagement and survey scores, split by variant, exportable as JSON or CSV.

It is a single HTML file plus a manifest and service worker, so it runs in
any phone browser and installs to the home screen like a native app. No build
step, no backend, no app store.

## Design source

The UI is built on the **Spades Design System** Figma file
(`Qrx7kdcMXnddTjPytlIF9x`). The CSS custom properties at the top of
`index.html` mirror Spades variables one to one:

- **Color**: `Background/Text/Border/Brand/Positive/Danger/Warning` in both the
  `SDS Light` and `SDS Dark` modes, plus the `Special/Accent` colours.
- **Size**: `Space/100..1200`, `Radius/100..800 + Full`, `Stroke/Border`.
- **Effects**: `Drop Shadow/100, 200, 400`, the Liquid glass treatment.
- **Typography**: DM Sans body scale (Body, Body Strong, Heading, Title Page),
  DM Mono for captions, Bricolage Grotesque for the Title Hero.

Components follow their Spades counterparts: Button (Primary / Neutral /
Subtle), Icon Button, Tag and Tag Toggle, Input Field, Textarea, Stats Card,
Avatar. The swipe deck implements the **Feed Card** family from the Cards
page (`profile card types`): card header 1 (centered) and card header 2
(leading with inline UFI), the UFI reaction / heart / save buttons, and the
seven card modules: Most listened to, Just played, Now playing, Going to,
Mutuals, In your orbit (places) and the voice-note Audio Widget. Feed Card 2's
light "shared artists" footer is the `sharedFooter` variant option.

Photos are tinted placeholders because this environment cannot download Figma
assets. Add a `photo` URL to any profile in Setup to use a real image.

## Run it on your phone

Pick whichever is easiest:

1. **GitHub Pages.** In the repository settings, enable Pages from this branch
   (root). Open the Pages URL on your phone.
2. **Any static host.** Upload `index.html`, `manifest.webmanifest`, `icon.svg`
   and `sw.js` to Netlify, Vercel, S3 or similar.
3. **Local network.** On a laptop on the same Wi-Fi:

   ```sh
   python3 -m http.server 8080
   ```

   then open `http://<laptop-ip>:8080` on the phone. (The home-screen install
   and offline mode need HTTPS, so use options 1 or 2 for those.)

Once open: Share → **Add to Home Screen**. It launches full screen and works
offline after the first load.

## How a test session works

1. **Test tab.** Type the tester's name, pick a variant or leave it on
   auto-assign, tap Start, hand the phone over.
2. **Pitch.** The tester reads the concept slides. Time spent is recorded.
3. **Deck.** Swipe right to like, left to pass, or use the buttons. The app
   records each choice, how long it took, which card module was showing, and
   whether the tester expanded the profile, waved, saved, or tapped the module.
4. **Match.** Some likes turn into a match. Depending on the variant the
   tester gets a suggested plan or a blank box. Whether they send, edit or skip
   is recorded.
5. **Survey.** Likert statements, an NPS question and two free-text prompts.
6. **Save.** The tester hands the phone back; you tap Save session.

**Results tab** shows aggregate and per-variant numbers, survey averages,
like rate by profile (a flat spread means the concept, not the sample people,
is driving decisions), tester quotes, and every session with a delete button.
Export copies or downloads JSON and CSV.

**Setup tab** is where you make it your concept.

## Making it your concept

"Sync" (match on what you listen to) is the default concept, built from the
profile cards in the Spades Figma file. Replace it in Setup:

- **Basics**: name, tagline, profiles per session, match chance, how variants
  are assigned.
- **Full configuration** (JSON): pitch slides, variants and survey questions.

Variant fields:

| field | values | what it changes |
|---|---|---|
| `layout` | `"01"`, `"02"` | centered header with actions at the bottom, or leading header with actions on top |
| `showSharedCount` | `true`, `false` | shows the "N shared artists" signal |
| `sharedFooter` | `true`, `false` | Feed Card 2 style: light footer under the photo |
| `openerStyle` | `track`, `blank` | suggested opener built from a shared artist, or an empty box |

Profile fields: `name`, `age`, `hood`, `dist`, `hue` (placeholder tint),
`photo` (optional URL), `shared` (shared artist count), `bio`, and `module`
with a `type` of `mostListened` (`artists`), `justPlayed` / `nowPlaying`
(`track`, `artist`), `event` (`month`, `day`, `title`, `place`), `mutuals`
(`count`, `names`), `places` (`places: [{name, note, shared}]`) or `voice`
(`seconds`).

Survey question types: `likert` (1 to 5), `nps` (0 to 10), `text`.

Results include **like rate by card module**, so you can see which listening
signal (now playing, going to, mutuals, ...) actually moves people.

To add a mechanic that isn't covered by these toggles, edit `index.html`:
`buildCard()` and `moduleEl()` render a card from a variant and a profile,
`renderMatch()` handles the match moment, and `decide()` records what gets
stored per swipe.

## Data

Everything is stored in the phone browser's local storage. Nothing leaves the
device unless you export it. Clearing site data or switching phones loses
sessions, so export after each round of testing.

Export formats:

- **JSON**: full bundle, including config, variants, survey definitions and
  every session with its event log.
- **CSV**: one row per swipe decision, ready for a spreadsheet.
