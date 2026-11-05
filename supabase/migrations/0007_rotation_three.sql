-- Sync, migration 0007: a rotation goes up at three tracks.
-- Getting started asks for three, not four; the mixtape's own agree rule (two from each of you)
-- still needs four in the build between two people.
update public.build_types set min_items = 3 where key = 'mixtape';
