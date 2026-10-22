# PT-25 — a pomodoro timer that feels like an object

Working name: **PT-25** (pomodoro timer, 25 minutes), in the spirit of Braun
model numbers (ET 66, T 3) and Teenage Engineering's (OP-1, TX-6). Rename at
will.

## The idea

One screen. One device face. Everything you need is printed on it, nothing
you don't. Two things to touch: the **dial** sets how long the block in front
of you is, and the **program** sets the pattern of focus and breaks around it.
The same dial unwinds while the block runs. Buttons are keys with travel.
Every touch clicks.

Design references:

- **Dieter Rams / Braun**: a single accent (orange) used only for the thing
  that is on or the thing you press; a dial with one dot; small engraved
  labels under controls instead of text on them; warm off-white or black
  body; a grid where everything lines up; no ornament.
- **Teenage Engineering**: chunky keys with real travel and a click; a
  three-position slide switch; LED dots for state; monospaced numerals; labels
  in tiny caps printed on the panel; sounds synthesised, not sampled.

## Features

### v1 (what the prototype does today)

| Feature | How it feels |
|---|---|
| Program | A strip across the top shows the whole stretch as blocks: solid for focus, outlined for breaks, orange for the one you are in, filling as time passes. The header reads the pattern and total, e.g. `40 / 20 × 4 · 4 h`. |
| Templates | Tap the strip. Classic (25/5 ×4, long 15, 2 h 10), Forty twenty (4 h), Fifty ten (4 h), One timer (no breaks). A template is a starting point, not a mode. |
| Custom program | Below the templates, four steppers: focus, break, rounds, long break. Break 0 means no breaks. Long break replaces the last break. |
| Set the duration | Turn the dial. It edits the block in front of you (focus or break) and that change applies to every block of that kind in the program. Sixty tick marks, one per minute, a detent per minute with a click and a buzz, hard stops at 1 and 60. |
| Run the block | The big orange key. Label under it reads START, then PAUSE. Lit ticks go out one minute at a time; the orange dot sweeps continuously. |
| Reset and skip | Reset reloads the current block. Skip jumps to the next block without counting it. Restart program lives in the program sheet. |
| End of block | A two-note chime and a vibration pattern, then the next block loads. End of program: three chimes and the strip resets. Auto-start is a setting. |
| Where you are | Spec line at the bottom: `block 3 of 8 · ends 14:40` while running, `2 h 20 left` when stopped. |
| Today's count | "Today 3" on the nameplate: focus blocks that ran to zero. Resets at midnight. |
| Sound and haptics | Synthesised with Web Audio: key click, dial detent, chime, optional per-second tick. Haptics via the vibration API (Android; see deployment notes). Both have switches in settings. |
| Survives the background | The timer stores an end timestamp, not a countdown, so it is correct after the phone sleeps or the app is switched away. |
| Screen stays on | Wake lock while a block runs. |
| Light and black editions | Follows the phone's appearance setting. Cream body with dark keys, or black body with grey keys. Orange in both. |
| Remembers everything | Program, settings, current block, remaining time and today's count persist locally. No account, no server. |

### v1.1 (after it is on your phone)

- Notification when a session ends and the app is in the background.
- Home-screen icon and splash, offline shell (manifest + service worker).
- Optional ambient tick while focusing (already a switch; tune the sound).
- A seven-day strip of completed sessions in the settings sheet.
- Blocks longer than 60 minutes (a 90/20 ultradian template). The dial is
  one revolution = 60 minutes today; a second revolution or 2-minute detents
  is the open design question.
- Saving your own programs as templates.

### Not planned

Accounts, sync, task lists, charts, integrations, streaks, gamification.
Weniger, aber besser.

## Interaction rules

- The dial turns only when the timer is idle. While running it is read-only.
- The dial edits the block in front of you and every block of the same kind.
  Stopped before a break, it sets the break length.
- Templates and steppers are locked while running. Pause first.
- Changing the program stops the timer and reloads the current block.
- Skip never counts a focus block. Only a block that runs to zero does.
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
