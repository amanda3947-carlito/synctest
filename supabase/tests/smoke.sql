-- End-to-end scenario against the seeded demo profiles. Each block runs as a signed-in user
-- (role authenticated + a JWT subject), the way PostgREST does it, so RLS and the rules both apply.
\set ON_ERROR_STOP on
\set damon  '00000000-0000-4000-8000-000000000001'
\set olivia '00000000-0000-4000-8000-000000000002'
\set theo   '00000000-0000-4000-8000-000000000003'

create or replace function pg_temp.expect_error(sql text, needle text) returns text language plpgsql as $$
begin
  execute sql; raise exception 'expected an error containing "%", got none', needle;
exception when others then
  if sqlerrm not like '%' || needle || '%' then raise exception 'wrong error: % (wanted "%")', sqlerrm, needle; end if;
  return 'ok: ' || needle;
end $$;
create or replace function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true), set_config('request.jwt.claim.sub', u::text, true) $$;

begin;
\echo '--- feed: Damon sees Olivia and Theo, not himself'
select pg_temp.as_user(:'damon');
select name from public.feed() order by name;
select count(*) = 2 as feed_ok from public.feed();

\echo '--- about facets'
select mutual_count(:'olivia') as shared_contacts;                     -- 2
select name from mutuals(:'olivia');                                   -- Theo
select name from shared_places(:'olivia');                             -- Books Are Magic
select title from shared_shelf(:'olivia');                              -- Past Lives

\echo '--- rules: own build, too many changes, no changes'
select pg_temp.expect_error($$select start_build('00000000-0000-4000-8000-00000000d101', '[]')$$, 'your own build');
select pg_temp.expect_error($$select start_build('00000000-0000-4000-8000-00000000d201',
  '[{"key":"a","title":"A"},{"key":"b","title":"B"},{"key":"c","title":"C"},{"key":"rodrigo-maggots","title":"x"}]')$$, 'at most 2 changes');
select pg_temp.expect_error($$select start_build('00000000-0000-4000-8000-00000000d201',
  (select items from profile_builds where id = '00000000-0000-4000-8000-00000000d201'))$$, 'change something');

\echo '--- Damon remixes Olivia''s mixtape: swaps one, adds one (2 changes)'
select id as build_id, status, round, turn_id = :'olivia' as olivias_turn from start_build('00000000-0000-4000-8000-00000000d201', '[
  {"key":"rodrigo-maggots","artist":"Olivia Rodrigo","title":"maggots for brains"},
  {"key":"grande-petal","artist":"Ariana Grande","title":"petal"},
  {"key":"dean-intro","artist":"Olivia Dean","title":"The Art of Loving (Intro)"},
  {"key":"swift-patient-zero","artist":"Taylor Swift","title":"Patient Zero"},
  {"key":"sza-sos","artist":"SZA","title":"SOS"},
  {"key":"lacy-nothing","artist":"Steve Lacy","title":"nothing"}]') \gset
-- a second build with someone else is allowed while this one is in flight: the only complaint left is the change count
select pg_temp.expect_error($$select start_build('00000000-0000-4000-8000-00000000d301', '[{"key":"a","title":"A"},{"key":"b","title":"B"},{"key":"c","title":"C"},{"key":"d","title":"D"}]')$$, 'at most 2 changes');
select pg_temp.expect_error(format($$select send_turn(%L, '[]')$$, :'build_id'), 'not your turn');
select count(*) as olivia_notices from notifications where profile_id = :'olivia';   -- Damon cannot see these: 0
select pg_temp.as_user(:'olivia');
select count(*) as olivia_notices from notifications where profile_id = :'olivia';   -- 1

\echo '--- Olivia tries to agree too early (she has not added anything yet)'
select pg_temp.expect_error(format($$select agree_build(%L)$$, :'build_id'), 'not there yet');

\echo '--- a pure reorder counts as one change'
select public.build_changes('list', '[{"key":"a"},{"key":"b"}]', '[{"key":"b"},{"key":"a"}]') as reorder_changes;   -- 1
select public.build_changes('list', '[{"key":"a"},{"key":"b"}]', '[{"key":"a"},{"key":"b"}]') as same_changes;      -- 0
select pg_temp.expect_error($$insert into profile_media (profile_id, kind, path, approved) values ('00000000-0000-4000-8000-000000000002', 'photo', 'x', false)$$, 'permission denied');

\echo '--- Olivia adds two of her own'
select round, turn_id = :'damon' as damons_turn, jsonb_array_length(items) as tracks from send_turn(:'build_id', (
  select items || '[{"key":"dean-nice","artist":"Olivia Dean","title":"Nice to Each Other"},{"key":"sza-kill-bill","artist":"SZA","title":"Kill Bill"}]'::jsonb
  from builds where id = :'build_id'));

\echo '--- Damon agrees, then Olivia agrees: match'
select pg_temp.as_user(:'damon');
select status, agreed_by = array[:'damon'::uuid] as damon_agreed from agree_build(:'build_id');
select pg_temp.as_user(:'olivia');
select status, via, agreed_at is not null as has_time from agree_build(:'build_id');
select count(*) = 1 as matched from matches where build_id = :'build_id';
select id as match_id from matches where build_id = :'build_id' \gset

\echo '--- chat'
select body from send_message(:'match_id', 'ok that SZA swap was correct');
select pg_temp.as_user(:'theo');
select count(*) as theo_sees_messages from messages where match_id = :'match_id';   -- 0, RLS
select pg_temp.expect_error(format($$select send_message(%L, 'hi')$$, :'match_id'), 'match not found');

\echo '--- feed after the match: Olivia and Damon no longer see each other'
select pg_temp.as_user(:'damon');
select name from feed();   -- Theo only

\echo '--- love as is: Theo loves Damon''s plan with a note; Damon matches back'
select pg_temp.as_user(:'theo');
select pg_temp.expect_error($$select love_as_is('00000000-0000-4000-8000-00000000d102', 'ok')$$, 'say something');
select id as asis_id, status, as_is_note from love_as_is('00000000-0000-4000-8000-00000000d102', 'Public Records at golden hour is exactly my speed.') \gset
select pg_temp.as_user(:'damon');
select status, via from match_back(:'asis_id');
select body from messages m join matches x on x.id = m.match_id where x.build_id = :'asis_id';   -- the note opens the chat

\echo '--- counter an as-is: Olivia loves Theo''s dinner, Theo changes dessert, it becomes a build'
select pg_temp.as_user(:'olivia');
select id as asis2, status from love_as_is('00000000-0000-4000-8000-00000000d302', 'Birria the long way. Say less.') \gset
select pg_temp.as_user(:'theo');
select status, round, turn_id = :'olivia' as olivias_turn from counter_as_is(:'asis2', (
  select jsonb_set(items, '{dessert,value}', '"Flan from Tortilleria Mexicana Los Hermanos"') from builds where id = :'asis2'));
select changes, items->'dessert'->>'by' = :'theo' as stamped from build_turns where build_id = :'asis2' and action = 'counter';

\echo '--- pass, block, report'
select pg_temp.as_user(:'olivia');
select (close_build(:'asis2')).status as closed;
select block_profile(:'theo');
select count(*) as theo_visible from profiles where id = :'theo';   -- 0: blocked profiles vanish
select report_profile(:'theo', 'spam', 'test only');

\echo '--- profile builds guard'
select pg_temp.as_user(:'damon');
select pg_temp.expect_error($$insert into profile_builds (profile_id, type_key, items) values ('00000000-0000-4000-8000-000000000001', 'dinner', '{"main":{"value":"x"}}')$$, 'filled in');
select pg_temp.expect_error($$insert into profile_builds (profile_id, type_key, items) values ('00000000-0000-4000-8000-000000000001', 'watchlist', '[{"key":"a","title":"A"},{"key":"b","title":"B"},{"key":"c","title":"C"},{"key":"d","title":"D"},{"key":"e","title":"E"},{"key":"f","title":"F"},{"key":"g","title":"G"}]')$$, 'at most 6');

\echo '--- unauthenticated: nothing'
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select * from feed()$$, 'not signed in');
rollback;
\echo ALL GOOD
