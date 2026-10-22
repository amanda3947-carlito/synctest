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

## Deployment path (next step)

Same approach as the concept-lab app already in this repo: a single HTML
file plus `manifest.webmanifest`, `sw.js` and an icon, hosted on GitHub Pages
and added to the home screen.

- **Android**: full experience, including vibration and notifications.
- **iPhone**: installs the same way. Safari has no vibration API, so haptics
  are silent there; sound and the chime work. Web push works for installed
  apps on iOS 16.4+. If haptics matter on iPhone, the next step up is a thin
  native wrapper (Capacitor) around the same files.
