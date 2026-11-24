-- Sync, migration 0014: send it back as is.
-- A build no longer needs a minimum from each person before it can be agreed. Whoever's turn it is can
-- agree to it as it stands ("Send it back as is"), and once both of you have agreed it's the match.
-- A turn that changes the list still has to change something (1 to per_turn changes), and a profile's own
-- builds still need their minimum (3 tracks on a mixtape, 3 picks on a featured build) to go up.
update public.build_types set min_each = 0;
