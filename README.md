# Sync Concept Lab

A phone app for testing a dating app concept before you build the real thing.
Hand your phone to a tester, they see a pitch, swipe through profiles, maybe
get a match, and answer a short survey. You get like rates, decision times,
feature engagement and survey scores, split by variant, exportable as JSON or CSV.

It is a single HTML file plus a manifest and service worker, so it runs in
any phone browser and installs to the home screen like a native app. No build
step, no backend, no app store.

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
   records each choice, how long it took, whether the tester expanded the
   profile, revealed the photo (prompt-first variant) or tapped the Sync score.
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

"Sync" (match on how you spend your week) is a placeholder that exercises every
part of the tool. Replace it in Setup:

- **Basics**: name, tagline, profiles per session, match chance, how variants
  are assigned.
- **Full configuration** (JSON): pitch slides, variants and survey questions.

Variant fields:

| field | values | what it changes |
|---|---|---|
| `cardStyle` | `photo-first`, `prompt-first` | whether the photo or the written prompt leads the card |
| `showSyncScore` | `true`, `false` | shows the compatibility score and weekday overlap strip |
| `openerStyle` | `plan`, `blank` | suggested first message on match, or an empty box |

Survey question types: `likert` (1 to 5), `nps` (0 to 10), `text`.

To add a mechanic that isn't covered by these toggles, edit `index.html`:
`buildCard()` renders a card from a variant, `renderMatch()` handles the match
moment, and `decide()` records what gets stored per swipe. Sample profiles are
in the `PROFILES` array near the top of the script.

## Data

Everything is stored in the phone browser's local storage. Nothing leaves the
device unless you export it. Clearing site data or switching phones loses
sessions, so export after each round of testing.

Export formats:

- **JSON**: full bundle, including config, variants, survey definitions and
  every session with its event log.
- **CSV**: one row per swipe decision, ready for a spreadsheet.
