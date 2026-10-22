# PT-25 — a pomodoro timer that feels like an object

Working name: **PT-25** (pomodoro timer, 25 minutes), in the spirit of Braun
model numbers (ET 66, T 3) and Teenage Engineering's (OP-1, TX-6). Rename at
will.

## The idea

One screen. One device face. Everything you need is printed on it, nothing
you don't. The time is a dial you turn with your thumb; the same dial unwinds
while the session runs. Buttons are keys with travel. Every touch clicks.

Design references:

- **Dieter Rams / Braun**: a single accent (orange) used only for the thing
  that is on or the thing you press; a dial with one dot; small engraved
  labels under controls instead of text on them; warm off-white body; a grid
  where everything lines up; no ornament.
- **Teenage Engineering**: chunky keys with real travel and a click; a
  three-position slide switch; LED dots for state; monospaced numerals; labels
  in tiny caps printed on the panel; sounds synthesised, not sampled.

## Features

### v1 (what the prototype does today)

| Feature | How it feels |
|---|---|
| Focus / short break / long break | A three-position slide switch at the top. Tap a position and the cap slides over. |
| The cycle | Focus, short, focus, short, focus, short, focus, **long**. Four focus rounds, three short breaks, one long break, then the set resets. The LEDs count the focus rounds; the long break comes when the last one lights. |
| Set the duration | Pick a mode with the switch, then turn the dial. Sixty tick marks, one per minute. Each minute is a detent: a click and a short buzz. Stops at 1 and 60. |
| Run the session | The big orange key. Label under it reads START, then PAUSE. The dial's lit ticks go out one minute at a time, the orange dot sweeps continuously. |
| Reset and skip | Two dark keys either side of the main key. Reset reloads the mode's time. Skip jumps to the next phase without counting it. |
| Rounds | A row of LEDs (default four). One lights per finished focus session. The row clears when the long break ends. |
| End of session | A two-note chime (three at the end of a set), a vibration pattern, the switch moves itself to the next mode and loads its time. Auto-start is a setting. |
| Today's count | "Today 3" printed on the nameplate. Resets at midnight. |
| Sound and haptics | Synthesised with Web Audio: key click, dial detent, chime, optional per-second tick. Haptics via the vibration API (Android; see deployment notes). Both have switches in settings. |
| Settings | A sheet that slides up from the bottom edge: rounds per set, auto-start, sound, haptics, ticking. Durations are set with the dial, not here. |
| Survives the background | The timer stores an end timestamp, not a countdown, so it is correct after the phone sleeps or the app is switched away. |
| Screen stays on | Wake lock while a session runs. |
| Light edition | Cream body, dark keys, one orange. Always, regardless of the phone's dark mode setting. (A black edition was tried and set aside.) |
| Remembers everything | Settings, mode, remaining time and today's count persist locally. No account, no server. |

### Two faces, one timer

A **Face** switch in settings picks how the time is shown. Both faces share
the same timer, so you can flip mid-session. Everything else (the mode
switch, keys, cycle, settings, sounds) is identical.

**Analog** is the dial described above. **Digital** is inspired by the Ulanzi
TC001 pixel clock: a black glass front with a 32 × 8 grid of square LEDs.

| Digital element | On the matrix |
|---|---|
| Time | MM:SS in a 4 × 7 pixel font, warm white. The colon blinks once a second while running. Paused digits dim. |
| Mode icon | 7 × 7 pixel art at the left: a tomato with a green leaf for focus, a cup with steam for the short break, a moon for the long break. |
| Progress | The bottom row, 31 orange pixels, one goes out per 1/31 of the session. |
| Rounds | The right-hand column: one orange pixel per finished focus round. (The LED row under the display is hidden on this face; the matrix shows it.) |
| Set the duration | Swipe left or right across the glass while idle. One minute per step, a detent click and buzz each, stops at 1 and 60. |

**Landscape.** Rotate the phone and both faces reflow. Digital becomes a
nightstand clock: nameplate, switch and settings in one row, the display as
wide as the screen, status at the left and keys at the right. Analog puts
the dial on the left and stacks the switch, status and keys on the right.

### v1.1 (after it is on your phone)

- Notification when a session ends and the app is in the background.
- Home-screen icon and splash, offline shell (manifest + service worker).
- Optional ambient tick while focusing (already a switch; tune the sound).
- A seven-day strip of completed sessions in the settings sheet.
- Programs: templates for longer stretches such as 40/20 ×4 (4 h), shown as
  a strip of blocks. Prototyped once and set aside in favour of the switch;
  easy to bring back as a settings option.
- Blocks longer than 60 minutes. The dial is one revolution = 60 minutes
  today; a second revolution or 2-minute detents is the open question.

### Not planned

Accounts, sync, task lists, charts, integrations, streaks, gamification.
Weniger, aber besser.

## Interaction rules

- The dial turns only when the timer is idle. While running it is read-only.
- The mode switch is locked while running. Paused or idle, switching resets
  the time to that mode's duration.
- Skip never counts a focus session. Only a session that runs to zero does.
- Nothing asks "are you sure". Reset is one tap; so is starting again.

## Install on your iPhone

The app lives in this folder as a home-screen web app: `index.html`,
`manifest.webmanifest`, `sw.js` and the icons. GitHub Pages serves it from
this branch.

**URL:** https://amanda3947-carlito.github.io/synctest/pomodoro/

1. If Pages is not on yet: GitHub → repo **Settings → Pages → Build and
   deployment → Source: Deploy from a branch**, pick this branch and `/ (root)`,
   Save. The first build takes a minute or two.
2. Open the URL above in **Safari** on the iPhone (it has to be Safari for the
   next step).
3. Tap **Share → Add to Home Screen → Add**. The icon is the orange key on a
   cream dial.
4. Open it from the home screen. It runs full-screen without the Safari bars,
   rotates into landscape, and works offline after the first load.

### What iPhone does and doesn't do

- **Sound and chime:** work, but iPhone only lets a web app make sound after
  you have tapped something. Tap any key once after opening and the
  end-of-session chime is unlocked for that session.
- **Screen stays on** while a session runs (wake lock, iOS 16.4+). Keep the
  app in the foreground; if you switch away or lock the phone, the timer keeps
  correct time but cannot play the chime until you come back. A background
  alert needs push notifications, which is the v1.1 item.
- **Haptics:** iPhone Safari has no vibration API, so every buzz is silent. The
  settings row says so. Everything else is identical. If you want real
  haptics on iPhone, the next step is a thin native wrapper (Capacitor) around
  these same files, which also unlocks background notifications.
- **Updating:** push a change, then bump `CACHE` in `sw.js`. The installed app
  picks it up on the second launch.
- **Where your data lives:** only on the phone, in the app's local storage.
  Deleting the home-screen icon deletes it.
