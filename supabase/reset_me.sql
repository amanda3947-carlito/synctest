-- Reset the live demo account (+1 555 000 0010, Amanda) to the designed starting state, keeping the account:
-- clears her passes, notices and builds, then lays down demo.sql's five builds with her live ids.
-- Run it in the Supabase SQL editor (or ask Claude to). It is demo.sql's builds section with the ids swapped in.
-- reset the demo account's interactions: no passes, no notices, the designed builds laid down fresh
delete from public.passes where profile_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69' or passed_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69';
delete from public.notifications where profile_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69' or from_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69';
delete from public.builds where starter_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69' or owner_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69';
-- ───────────── your builds, laid down fresh ─────────────
delete from public.builds where starter_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69' or owner_id = '73427451-a88f-4fdd-ae5f-d58ea03a1e69';

-- the people on each side, for brevity
-- you (a0) · Felix (07) · Justin (08) · Mariah (09) · James (10) · Kevin (11)
insert into public.builds (id, type_key, profile_build_id, starter_id, owner_id, items, turn_id, round, status, agreed_by, as_is_note, via, agreed_at, created_at, updated_at) values
  -- Felix remixed your mixtape and sent a note: your move
  ('00000000-0000-4000-8000-0000000be001', 'mixtape', '23651bff-3ceb-4bb1-9e37-f27ec344b8ab', '00000000-0000-4000-8000-000000000007', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '[
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"ocean-pink-white","artist":"Frank Ocean","title":"Pink + White","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000007"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"caesar-get-you","artist":"Daniel Caesar","title":"Get You","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b6/cd/1a/b6cd1a5b-83af-a1e2-0ad7-ea530fcf2522/859722261219.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000007"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"}]',
   '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 1, 'open', '{}', null, null, null, now() - interval '2 hours', now() - interval '2 hours'),
  -- Justin did the same: your move
  ('00000000-0000-4000-8000-0000000be002', 'mixtape', '23651bff-3ceb-4bb1-9e37-f27ec344b8ab', '00000000-0000-4000-8000-000000000008', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '[
     {"key":"tame-let-it-happen","artist":"Tame Impala","title":"Let It Happen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000008"},
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"demarco-chamber","artist":"Mac DeMarco","title":"Chamber of Reflection","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e0/04/eb/e004eb2b-754f-4a76-9ecc-87d4eea2a327/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000008"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"}]',
   '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 1, 'open', '{}', null, null, null, now() - interval '5 hours', now() - interval '5 hours'),
  -- Mariah loved your mixtape as it is: match back or not
  ('00000000-0000-4000-8000-0000000be003', 'mixtape', '23651bff-3ceb-4bb1-9e37-f27ec344b8ab', '00000000-0000-4000-8000-000000000009', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '[
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"}]',
   '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 1, 'as_is', '{}', 'Okay this rotation is unreal. Record store, then coffee?', null, null, now() - interval '9 hours', now() - interval '9 hours'),
  -- you made James's rotation a mixtape just now: his move (he answers in a couple of minutes)
  ('00000000-0000-4000-8000-0000000be004', 'mixtape', '00000000-0000-4000-8000-00000000de01', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '00000000-0000-4000-8000-000000000010', '[
     {"key":"fred-again-delilah","artist":"Fred again..","title":"Delilah (pull me out of this)","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b0/9c/b7/b09cb72c-cca9-5d66-bc9d-a9b5e5f86b22/5054197236389.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"kaytranada-glowed","artist":"KAYTRANADA","title":"Glowed Up","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"disclosure-latch","artist":"Disclosure","title":"Latch","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/93/e0/5793e0d6-4877-e015-ef54-3fd4eff87344/14UMGIM12348.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"jamie-xx-gosh","artist":"Jamie xx","title":"Gosh","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/dc/ce/b9dcce9c-8cf8-4105-0fab-fb048702bce2/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"four-tet-two-thousand","artist":"Four Tet","title":"Two Thousand and Seventeen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/aa/99/b5/aa99b504-2656-85c4-965a-3bc80e52d0f2/666017319728_cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"}]',
   '00000000-0000-4000-8000-000000000010', 1, 'open', '{}', null, null, null, now() - interval '1 minute', now() - interval '1 minute'),
  -- you and Kevin finished one: a match
  ('00000000-0000-4000-8000-0000000be005', 'mixtape', '00000000-0000-4000-8000-00000000df01', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '00000000-0000-4000-8000-000000000011', '[
     {"key":"lacy-dark-red","artist":"Steve Lacy","title":"Dark Red","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6d/c2/86/6dc286d1-057e-c014-e42f-dbf4e829867b/5054526102712.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"paak-come-down","artist":"Anderson .Paak","title":"Come Down","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/04/f0/3204f09c-4580-3880-7f5f-254dfa4d258f/888915184455_cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"thundercat-them-changes","artist":"Thundercat","title":"Them Changes","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0a/e8/0c/0ae80cc1-e4c2-5e14-4dc2-3dfefb013896/5054429007756.png/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"73427451-a88f-4fdd-ae5f-d58ea03a1e69"},
     {"key":"tyler-see-you-again","artist":"Tyler, The Creator","title":"See You Again","art":"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c6/3d/3b/c63d3b44-d74b-9b79-be7d-aeb714146378/5052917021727_CookinCovers.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"gambino-summer","artist":"Childish Gambino","title":"Feels Like Summer","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/26/22/6b262212-325b-4971-2c47-51ae443aa78d/886447212882.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"ocean-pink-white","artist":"Frank Ocean","title":"Pink + White","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"}]',
   null, 3, 'agreed', '{73427451-a88f-4fdd-ae5f-d58ea03a1e69,00000000-0000-4000-8000-000000000011}', null, 'build', now() - interval '30 hours', now() - interval '50 hours', now() - interval '30 hours');

insert into public.build_turns (build_id, actor_id, action, items, changes, note, created_at) values
  ('00000000-0000-4000-8000-0000000be001', '00000000-0000-4000-8000-000000000007', 'start', null, 2, 'Those lyrics are forever stuck in my head. Nice taste 🔥', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-0000000be002', '00000000-0000-4000-8000-000000000008', 'start', null, 2, 'Tame Impala over Diplo any damn day', now() - interval '5 hours'),
  ('00000000-0000-4000-8000-0000000be003', '00000000-0000-4000-8000-000000000009', 'love_as_is', null, null, 'Okay this rotation is unreal. Record store, then coffee?', now() - interval '9 hours'),
  ('00000000-0000-4000-8000-0000000be004', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 'start', null, 2, 'Delilah on repeat. Added two for the late part of the night.', now() - interval '1 minute'),
  ('00000000-0000-4000-8000-0000000be005', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 'start', null, 2, null, now() - interval '50 hours'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-000000000011', 'turn', null, 1, 'Had to put one more on there.', now() - interval '40 hours'),
  ('00000000-0000-4000-8000-0000000be005', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', 'agree', null, null, null, now() - interval '32 hours'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-000000000011', 'agree', null, null, null, now() - interval '30 hours');

insert into public.matches (build_id, a_id, b_id, created_at)
  values ('00000000-0000-4000-8000-0000000be005', '73427451-a88f-4fdd-ae5f-d58ea03a1e69', '00000000-0000-4000-8000-000000000011', now() - interval '30 hours');
insert into public.messages (match_id, sender_id, body, created_at)
select m.id, x.sender::uuid, x.body, now() - x.ago
  from public.matches m,
       (values ('00000000-0000-4000-8000-000000000011', 'Okay that Isiaah Falls track was the move.', interval '29 hours'),
               ('73427451-a88f-4fdd-ae5f-d58ea03a1e69', 'Right?? Friday at Elsewhere?', interval '28 hours'),
               ('00000000-0000-4000-8000-000000000011', 'Say less.', interval '27 hours')) x(sender, body, ago)
 where m.build_id = '00000000-0000-4000-8000-0000000be005';
