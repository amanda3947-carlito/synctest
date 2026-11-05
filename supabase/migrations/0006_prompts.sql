-- Sync, migration 0006: prompts.
-- "Let's learn more about you" (6 of 7): Intro, Lyrics to live by, Deal-breakers, Current obsession,
-- each typed or spoken. One JSON object keyed by prompt: { text, voice (a path in the media bucket),
-- seconds }. intro_quote and lyric_quote stay as mirrors of the two the profile has always shown.
alter table public.profiles add column if not exists prompts jsonb not null default '{}'::jsonb;
