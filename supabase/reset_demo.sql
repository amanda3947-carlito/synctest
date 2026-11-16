-- Back to the demo state: clears every account on a 555 000 001x test number (and what it touched),
-- then lays down demo.sql again. The seed people and the stand-ins stay.
with u as (select id from auth.users where phone like '1555000001%') delete from public.build_turns where actor_id in (select id from u);
with u as (select id from auth.users where phone like '1555000001%') delete from public.builds where starter_id in (select id from u) or owner_id in (select id from u);
delete from auth.users where phone like '1555000001%';
\i demo.sql
