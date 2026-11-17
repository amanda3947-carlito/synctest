# Sync backend

Postgres schema and rules for Sync, written for [Supabase](https://supabase.com). One backend serves
both clients: the web prototype in its Capacitor shell now, and the SwiftUI app later.

```
supabase/
  migrations/0001_init.sql   tables, row-level security, the build engine as SQL functions
  migrations/0002_reorder_and_media.sql   reorder counts as a change; photos show without review for now
  migrations/0003_onboarding.sql          onboarded flag, place/event search index, my_contact_count()
  migrations/0004_shelf.sql               reading & watching: profile_shelf and shared_shelf()
  migrations/0005_essentials.sql          last_name and the basics (details jsonb)
  seed.sql                   build types, Brooklyn places and events, three demo profiles
  storage.sql                the private `media` bucket and its upload/read policies
  tests/run.sh               runs migration + seed + an end-to-end scenario on a local Postgres
```

## Getting it live (about 20 minutes)

1. **Create the project.** supabase.com → New project. Pick the region nearest New York (`us-east-1`).
   Save the database password somewhere safe.
2. **Run the migrations.** Project → SQL Editor → paste `migrations/0001_init.sql` → Run, then
   `migrations/0002_reorder_and_media.sql` → Run. Then paste `seed.sql` → Run. (Or install the Supabase CLI, `supabase link`, `supabase db push`.)
3. **Turn on phone sign-in.** Authentication → Providers → Phone. Connect Twilio (or MessageBird) for
   the SMS codes. For testing, Authentication → Settings lets you add test numbers with fixed codes.
4. **Create the media bucket.** SQL Editor → paste `storage.sql` → Run. It makes a private `media`
   bucket where each person can upload only to a folder named after their own user id and anyone
   signed in can read. The seed's `demo/…` paths expect the prototype's assets uploaded under `media/demo/`.
5. **Copy the keys.** Project Settings → API: the project URL and the `anon` public key go in the
   clients. The `service_role` key never leaves the server.
6. **Push (later).** Database → Webhooks → on insert into `notifications`, call an Edge Function that
   sends the APNs push. The function and the Apple key come with the Xcode step.

## How the engine works

Every rule lives in the database, in `security definer` functions. Clients call them through
Supabase's RPC (`supabase.rpc('start_build', {...})`) and read tables through row-level security.
Nothing a client sends is trusted.

| Function | Who | What it enforces |
|---|---|---|
| `feed(limit)` | viewer | profiles up (≥1 build, ≥1 approved photo), not passed, not blocked, no build between you |
| `start_build(profile_build, items)` | viewer | 1 to `per_turn` changes vs the owner's build, one live build per pair (you can have builds going with several people) |
| `love_as_is(profile_build, note)` | viewer | note ≥ 3 chars; creates an `as_is` build waiting on the owner |
| `send_turn(build, items)` | whoever's turn | status open, your turn, 1 to `per_turn` changes; stamps `by` on new items; resets agreement |
| `agree_build(build)` | whoever's turn | build complete (`min_items`, `min_each` per side, or all slots filled); second agree creates the match |
| `match_back(build)` | owner | as-is → agreed; the note becomes the first chat message |
| `counter_as_is(build, items)` | owner | as-is → open build, starter's turn |
| `close_build(build)` | either | walk away |
| `pass_profile(id)` · `block_profile(id)` · `report_profile(id, reason)` | viewer | block also closes builds and ends matches between you |
| `send_message(match, body)` · `unmatch(match)` | participants | live matches only |
| `mutuals(id)` · `mutual_count(id)` · `shared_places(id)` · `sync_contacts(hashes)` | viewer | the About facets; contacts arrive as SHA-256 hashes, never numbers |

Build types are rows in `build_types`, so a new kind of build is a seed row, not a migration.
Items are JSON: list kinds hold `[{key, title, …, by}]`, slot kinds hold `{slot: {value, …, by}}`.
A swap counts as one change; so does a plain add or remove.

Realtime is enabled on `builds`, `matches`, `messages` and `notifications`; subscribe with the
client library and RLS scopes what each user receives.

## Running the tests locally

Needs Postgres 14+ and `psql` with superuser access.

```
sudo -u postgres supabase/tests/run.sh
```

`tests/auth_shim.sql` fakes Supabase's `auth.uid()` and roles so the real migration runs on a
plain Postgres. `tests/smoke.sql` plays the full story as signed-in users: Damon remixes Olivia's
mixtape, she adds two tracks, both agree, they chat; Theo loves Damon's plan as is and Damon matches
back; Olivia loves Theo's dinner, Theo counters, Olivia closes it and blocks him. Every rule
violation along the way is asserted to raise.

## Client wiring (next)

- **Web / Capacitor:** `@supabase/supabase-js`. Replace the constants in `main.js` (`PEOPLE`,
  `ROTATIONS`, `PROFILES`) with `feed()` plus the profile tables, and the simulated other side with
  `start_build` / `send_turn` / `agree_build` and a realtime subscription on `builds`.
- **SwiftUI:** `supabase-swift`, same calls.

## The demo: you as an established user, and stand-ins

`demo.sql` (after `seed.sql` and migration 0011) signs you in as someone who has been on aux a while:
+1 555 000 0010 is Amanda, onboarded, with a rotation, details and prompts, and five builds with five more
people from the ":: builds" frames (Felix and Justin remixed your mixtape and are waiting on you, Mariah loved
it as is, you made James's rotation a mixtape, and you and Kevin finished one, so that is a match with a
chat). The original six stay on the feed. `reset_demo.sql` puts it all back to that state.

Migration 0011 makes every seed person a **stand-in**. A pg_cron job runs `standins_tick()` every 30 seconds:
any build waiting on a stand-in who has let it sit for their pace (`standins.pace`, 45 seconds to 2.5
minutes) gets their move, made as them through the same `send_turn` / `agree_build` / `match_back` a phone
calls. On a mixtape they add one or two tracks from their own rotation on their first move, then agree once
it is complete or you already have; on a plan or a dinner they swap one slot, then agree; an as-is gets
matched back. Each move carries one of their lines (`standins.lines`) as its note, and a match gets a line
in the chat. A move that fails is logged as a warning and retried after their pace.

## Deleting an account

Apple requires any app with sign-up to let people delete their account in the app. Migration 0012 adds
`delete_my_account()`. It removes the caller's builds (along with their turns, matches and chats), then the
auth user. The profile, photos, places, shelf, blocks and reports go with it by cascade. Report and Block on
a profile call the existing `report_profile` and `block_profile`.
