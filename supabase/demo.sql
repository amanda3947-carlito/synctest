-- Sync demo: you as someone who has been on aux for a while, five more people you are building with
-- (from the ":: builds" frames), and every seed person as a stand-in who takes their turn.
-- Run after seed.sql and migration 0011. Safe to re-run: it clears your builds and lays them down again.
-- Sign in as +1 555 000 0010 (code 123456 is a Supabase test number on this project).

-- ───────────── you ─────────────
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token)
values ('00000000-0000-4000-8000-0000000000a0', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  '15550000010', now() - interval '40 days', '{"provider":"phone","providers":["phone"]}', '{}',
  now() - interval '40 days', now(), '', '', '', '', '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000001a0', '00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-0000000000a0',
  '{"sub":"00000000-0000-4000-8000-0000000000a0","phone":"15550000010","phone_verified":true,"email_verified":false}',
  'phone', now(), now() - interval '40 days', now())
on conflict do nothing;

insert into public.profiles (id, phone_hash, name, last_name, birthdate, neighborhood, cover, avatar_path, intro_quote, lyric_quote,
  taste, style_paths, seeking, details, prompts, onboarded, created_at)
values ('00000000-0000-4000-8000-0000000000a0', encode(sha256('+15550000010'::bytea), 'hex'), 'Amanda', 'Smith', '1997-09-09',
  'Fort Greene', 'holo', 'demo/avatar-me.png', 'Vinyl on Sundays, karaoke on Thursdays.', 'This is the part where you find out who you are.',
  '{audiophile}', '{demo/gifs/disco.gif,demo/stickers/heart.png,demo/album-2.png,demo/stickers/sticker-coffee.png}', 'serious',
  '{"hometown":"Chicago","location":"Fort Greene","gender":"Woman","occupation":"Product designer","education":"Undergrad","height":"5′6","activity":"Active","kids":"Not sure yet","drinking":"Socially","smoking":"Doesn’t smoke"}',
  '{"intro":{"text":"Vinyl on Sundays, karaoke on Thursdays."},"lyrics":{"text":"This is the part where you find out who you are."},"dealbreakers":{"text":"Skipping songs halfway."},"obsession":{"text":"Making the perfect playlist for a long drive."}}',
  true, now() - interval '40 days')
on conflict (id) do update set name = excluded.name, last_name = excluded.last_name, birthdate = excluded.birthdate,
  neighborhood = excluded.neighborhood, cover = excluded.cover, avatar_path = excluded.avatar_path, intro_quote = excluded.intro_quote,
  lyric_quote = excluded.lyric_quote, taste = excluded.taste, style_paths = excluded.style_paths, seeking = excluded.seeking,
  details = excluded.details, prompts = excluded.prompts, onboarded = true;

insert into public.profile_media (id, profile_id, kind, path, poster_path, position, approved) values
  ('00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-0000000000a0', 'photo', 'demo/avatar-me.png', null, 0, true)
on conflict (id) do nothing;

insert into public.profile_builds (id, profile_id, type_key, items, position) values
  ('00000000-0000-4000-8000-00000000dd01', '00000000-0000-4000-8000-0000000000a0', 'mixtape', '[
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg"}]', 0)
on conflict (id) do update set items = excluded.items;

insert into public.profile_places (profile_id, place_id, position) values
  ('00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-00000000b005', 0),
  ('00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-00000000b003', 1),
  ('00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-00000000b007', 2)
on conflict do nothing;
insert into public.profile_shelf (profile_id, kind, key, title, meta, position) values
  ('00000000-0000-4000-8000-0000000000a0', 'show', 'seed:the-bear', 'The Bear', 'FX', 0),
  ('00000000-0000-4000-8000-0000000000a0', 'film', 'seed:past-lives', 'Past Lives', '2023 · Celine Song', 1),
  ('00000000-0000-4000-8000-0000000000a0', 'book', 'seed:intermezzo', 'Intermezzo', 'Sally Rooney', 2)
on conflict (profile_id, key) do nothing;

-- ───────────── five people you are building with ─────────────
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('00000000-0000-4000-8000-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       '+155500010' || n, now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now()
  from unnest(array['07','08','09','10','11']) n
on conflict (id) do nothing;

insert into public.profiles (id, phone_hash, name, birthdate, neighborhood, cover, avatar_path, intro_quote, lyric_quote, taste, style_paths, seeking, details, prompts, onboarded) values
  ('00000000-0000-4000-8000-000000000007', encode(sha256('+15550001007'::bytea), 'hex'), 'Felix', '1995-03-14', 'Midtown', 'reeded', 'demo/people/felix-avatar.jpg',
   'Times Square at 2am is underrated.', 'I want to be your Sunday morning.', '{collector,live_shows}',
   '{demo/gifs/dancing-men.gif,demo/stickers/sticker-sneakers.png,demo/album-1.png,demo/gifs/heart.gif}', 'serious',
   '{"hometown":"Toronto","location":"Midtown","gender":"Man","occupation":"Photographer","education":"Undergrad","height":"6′1","activity":"Active","kids":"Wants kids","drinking":"Socially","smoking":"Doesn’t smoke"}',
   '{"intro":{"text":"Times Square at 2am is underrated."},"lyrics":{"text":"I want to be your Sunday morning."},"dealbreakers":{"text":"No music in the car."},"obsession":{"text":"Film cameras from the 70s."}}', true),
  ('00000000-0000-4000-8000-000000000008', encode(sha256('+15550001008'::bytea), 'hex'), 'Justin', '1998-07-02', 'Bushwick', 'stripes', 'demo/people/justin-avatar.jpg',
   'Tame Impala over Diplo any damn day.', 'Let it happen.', '{nostalgic,collector}',
   '{demo/gifs/dj-caveman.gif,demo/stickers/headphones.png,demo/album-3.png,demo/stickers/sticker-clapper.png}', 'casual',
   '{"hometown":"Perth","location":"Bushwick","gender":"Man","occupation":"Sound designer","education":"Graduate","height":"5′10","activity":"Sometimes active","kids":"Not sure yet","drinking":"Drinks","smoking":"Socially"}',
   '{"intro":{"text":"Tame Impala over Diplo any damn day."},"lyrics":{"text":"Let it happen."},"dealbreakers":{"text":"Talking during the drop."},"obsession":{"text":"Synths I cannot afford."}}', true),
  ('00000000-0000-4000-8000-000000000009', encode(sha256('+15550001009'::bytea), 'hex'), 'Mariah', '1997-12-20', 'Greenpoint', 'rain', 'demo/people/mariah-avatar.jpg',
   'Record stores, then coffee. In that order.', 'My love, mine all mine.', '{nostalgic,classics}',
   '{demo/gifs/black-cat.gif,demo/stickers/sticker-coffee.png,demo/album-4.png,demo/stickers/note.png}', 'longterm',
   '{"hometown":"Portland","location":"Greenpoint","gender":"Woman","occupation":"Illustrator","education":"Undergrad","height":"5′5","activity":"Moderately active","kids":"Wants kids","drinking":"Socially","smoking":"Doesn’t smoke"}',
   '{"intro":{"text":"Record stores, then coffee. In that order."},"lyrics":{"text":"My love, mine all mine."},"dealbreakers":{"text":"Not reading the book first."},"obsession":{"text":"Mitski live recordings."}}', true),
  ('00000000-0000-4000-8000-000000000010', encode(sha256('+15550001010'::bytea), 'hex'), 'James', '1996-05-08', 'Crown Heights', 'waveform', 'demo/people/james-avatar.jpg',
   'Dance floor first, small talk later.', 'Delilah, pull me out of this.', '{live_shows,audiophile}',
   '{demo/gifs/disco.gif,demo/stickers/sticker-cocktail.png,demo/album-5.png,demo/gifs/spinning-dancer.gif}', 'casual',
   '{"hometown":"Manchester","location":"Crown Heights","gender":"Man","occupation":"Software engineer","education":"Graduate","height":"5′11","activity":"Active","kids":"No kids","drinking":"Drinks","smoking":"Doesn’t smoke"}',
   '{"intro":{"text":"Dance floor first, small talk later."},"lyrics":{"text":"Delilah, pull me out of this."},"dealbreakers":{"text":"Leaving before the last song."},"obsession":{"text":"Boiler Room sets."}}', true),
  ('00000000-0000-4000-8000-000000000011', encode(sha256('+15550001011'::bytea), 'hex'), 'Kevin', '1999-10-11', 'Bed-Stuy', 'discs', 'demo/people/kevin-avatar.jpg',
   'Will cook if you pick the record.', 'Them changes, them changes.', '{all_around,live_shows}',
   '{demo/gifs/thumbs-up.gif,demo/stickers/pizza.png,demo/album-1.png,demo/stickers/sticker-cloche.png}', 'crush',
   '{"hometown":"Atlanta","location":"Bed-Stuy","gender":"Man","occupation":"Chef","education":"High school","height":"6′0","activity":"Moderately active","kids":"Has kids","drinking":"Socially","smoking":"Doesn’t smoke"}',
   '{"intro":{"text":"Will cook if you pick the record."},"lyrics":{"text":"Them changes, them changes."},"dealbreakers":{"text":"Cold fries."},"obsession":{"text":"Perfecting jerk chicken."}}', true)
on conflict (id) do update set name = excluded.name, neighborhood = excluded.neighborhood, cover = excluded.cover, avatar_path = excluded.avatar_path,
  intro_quote = excluded.intro_quote, lyric_quote = excluded.lyric_quote, taste = excluded.taste, style_paths = excluded.style_paths,
  seeking = excluded.seeking, details = excluded.details, prompts = excluded.prompts, onboarded = true;

insert into public.profile_media (id, profile_id, kind, path, poster_path, position, approved) values
  ('00000000-0000-4000-8000-00000000a701', '00000000-0000-4000-8000-000000000007', 'photo', 'demo/people/felix.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a801', '00000000-0000-4000-8000-000000000008', 'photo', 'demo/people/justin.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a901', '00000000-0000-4000-8000-000000000009', 'photo', 'demo/people/mariah.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000ab01', '00000000-0000-4000-8000-000000000010', 'photo', 'demo/people/james.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000ac01', '00000000-0000-4000-8000-000000000011', 'photo', 'demo/people/kevin.jpg', null, 0, true)
on conflict (id) do nothing;

insert into public.profile_builds (id, profile_id, type_key, items, position) values
  ('00000000-0000-4000-8000-00000000d701', '00000000-0000-4000-8000-000000000007', 'mixtape', '[
     {"key":"ocean-pink-white","artist":"Frank Ocean","title":"Pink + White","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg"},
     {"key":"kendrick-luther","artist":"Kendrick Lamar & SZA","title":"luther","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/c2/cc/50c2cc95-3658-9417-0d4b-831abde44ba1/24UM1IM28978.rgb.jpg/600x600bb.jpg"},
     {"key":"caesar-get-you","artist":"Daniel Caesar","title":"Get You","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b6/cd/1a/b6cd1a5b-83af-a1e2-0ad7-ea530fcf2522/859722261219.jpg/600x600bb.jpg"},
     {"key":"faiyaz-dead-man","artist":"Brent Faiyaz","title":"Dead Man Walking","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/30/1b/30/301b30ef-9bb5-8fbd-6bdc-30552aefd0c6/8DrDvnuaSqqztj1vOGwY_Wasteland-Final6.jpg/600x600bb.jpg"},
     {"key":"giveon-heartbreak","artist":"Giveon","title":"Heartbreak Anniversary","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/51/89/1b/51891b63-e1cd-bda7-9473-31fb6b473040/886448298816.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d801', '00000000-0000-4000-8000-000000000008', 'mixtape', '[
     {"key":"tame-let-it-happen","artist":"Tame Impala","title":"Let It Happen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/600x600bb.jpg"},
     {"key":"mgmt-electric-feel","artist":"MGMT","title":"Electric Feel","art":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/29/7c/40/297c40a2-fc65-ad81-12d4-e28c8043b600/888880646842.jpg/600x600bb.jpg"},
     {"key":"phoenix-lisztomania","artist":"Phoenix","title":"Lisztomania","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/28/8d/ab/288dabdd-f8de-80f6-1aab-40a24cb1b33f/00892038002190_Cover.jpg/600x600bb.jpg"},
     {"key":"demarco-chamber","artist":"Mac DeMarco","title":"Chamber of Reflection","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e0/04/eb/e004eb2b-754f-4a76-9ecc-87d4eea2a327/cover.jpg/600x600bb.jpg"},
     {"key":"beach-house-space-song","artist":"Beach House","title":"Space Song","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d901', '00000000-0000-4000-8000-000000000009', 'mixtape', '[
     {"key":"mitski-my-love","artist":"Mitski","title":"My Love Mine All Mine","art":"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/8f/4b/40/8f4b4044-d02b-dc25-7d01-7d9d225fdce4/40240.jpg/600x600bb.jpg"},
     {"key":"bridgers-motion-sickness","artist":"Phoebe Bridgers","title":"Motion Sickness","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/20/4c/6e/204c6ef3-8e95-4cee-2256-202ca62aebed/60220.jpg/600x600bb.jpg"},
     {"key":"boygenius-not-strong","artist":"boygenius","title":"Not Strong Enough","art":"https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/ad/fc/81/adfc819e-00b2-3cb5-deb2-931a5b6da3fa/22UM1IM44998.rgb.jpg/600x600bb.jpg"},
     {"key":"clairo-sofia","artist":"Clairo","title":"Sofia","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f2/47/06/f24706bc-a90c-f730-bd8a-586ddde8af3e/829299184631.jpg/600x600bb.jpg"},
     {"key":"lana-norman","artist":"Lana Del Rey","title":"Norman Fucking Rockwell"}]', 0),
  ('00000000-0000-4000-8000-00000000de01', '00000000-0000-4000-8000-000000000010', 'mixtape', '[
     {"key":"fred-again-delilah","artist":"Fred again..","title":"Delilah (pull me out of this)","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b0/9c/b7/b09cb72c-cca9-5d66-bc9d-a9b5e5f86b22/5054197236389.jpg/600x600bb.jpg"},
     {"key":"kaytranada-glowed","artist":"KAYTRANADA","title":"Glowed Up"},
     {"key":"disclosure-latch","artist":"Disclosure","title":"Latch","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/93/e0/5793e0d6-4877-e015-ef54-3fd4eff87344/14UMGIM12348.rgb.jpg/600x600bb.jpg"},
     {"key":"jamie-xx-gosh","artist":"Jamie xx","title":"Gosh","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/dc/ce/b9dcce9c-8cf8-4105-0fab-fb048702bce2/cover.jpg/600x600bb.jpg"},
     {"key":"four-tet-two-thousand","artist":"Four Tet","title":"Two Thousand and Seventeen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/aa/99/b5/aa99b504-2656-85c4-965a-3bc80e52d0f2/666017319728_cover.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000df01', '00000000-0000-4000-8000-000000000011', 'mixtape', '[
     {"key":"lacy-dark-red","artist":"Steve Lacy","title":"Dark Red","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6d/c2/86/6dc286d1-057e-c014-e42f-dbf4e829867b/5054526102712.jpg/600x600bb.jpg"},
     {"key":"paak-come-down","artist":"Anderson .Paak","title":"Come Down","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/04/f0/3204f09c-4580-3880-7f5f-254dfa4d258f/888915184455_cover.jpg/600x600bb.jpg"},
     {"key":"thundercat-them-changes","artist":"Thundercat","title":"Them Changes","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0a/e8/0c/0ae80cc1-e4c2-5e14-4dc2-3dfefb013896/5054429007756.png/600x600bb.jpg"},
     {"key":"tyler-see-you-again","artist":"Tyler, The Creator","title":"See You Again","art":"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c6/3d/3b/c63d3b44-d74b-9b79-be7d-aeb714146378/5052917021727_CookinCovers.jpg/600x600bb.jpg"},
     {"key":"gambino-summer","artist":"Childish Gambino","title":"Feels Like Summer","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/26/22/6b262212-325b-4971-2c47-51ae443aa78d/886447212882.jpg/600x600bb.jpg"}]', 0)
on conflict (id) do update set items = excluded.items;

insert into public.profile_places (profile_id, place_id, position) values
  ('00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-00000000b008', 0), ('00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-00000000b001', 1),
  ('00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-00000000b007', 0), ('00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-00000000b009', 1),
  ('00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-00000000b003', 0), ('00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-00000000b005', 1),
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-00000000b007', 0), ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-00000000b006', 1),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-00000000b010', 0), ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-00000000b002', 1)
on conflict do nothing;

-- ───────────── everyone seeded is a stand-in: their pace and the lines they send ─────────────
insert into public.standins (profile_id, pace, lines) values
  ('00000000-0000-4000-8000-000000000001', '90 seconds',  '{"This one goes straight to the kitchen speaker.","Okay, your turn to top that.","Added a couple I play on repeat."}'),
  ('00000000-0000-4000-8000-000000000002', '45 seconds',  '{"Ahh I love this already.","Put my karaoke song on, no judgment.","This is giving Sunday."}'),
  ('00000000-0000-4000-8000-000000000003', '120 seconds', '{"Swapped one, trust me on it.","This needs more heartbreak.","Good bones. Added some grit."}'),
  ('00000000-0000-4000-8000-000000000004', '60 seconds',  '{"Rooftop approved.","Turned it up a notch.","This one is for the walk home."}'),
  ('00000000-0000-4000-8000-000000000005', '75 seconds',  '{"No skips. Respect.","Added the one I always come back to.","This is a whole vibe."}'),
  ('00000000-0000-4000-8000-000000000006', '100 seconds', '{"For the late part of the night.","Couldn’t help myself.","This one sounds better with the lights off."}'),
  ('00000000-0000-4000-8000-000000000007', '75 seconds',  '{"Those lyrics are forever stuck in my head. Nice taste 🔥","Okay, this is getting good.","Added two for the drive."}'),
  ('00000000-0000-4000-8000-000000000008', '60 seconds',  '{"Tame Impala over Diplo any damn day","Put a synth on it.","This is the one."}'),
  ('00000000-0000-4000-8000-000000000009', '90 seconds',  '{"Record store, then coffee?","Okay this rotation is unreal.","Added something soft."}'),
  ('00000000-0000-4000-8000-000000000010', '150 seconds', '{"Delilah on repeat. Swapped in a couple for the late part of the night.","Dance floor approved.","This is the 2am section."}'),
  ('00000000-0000-4000-8000-000000000011', '60 seconds',  '{"Okay that Isiaah Falls track was the move.","I’ll cook to this.","Them changes, but better."}')
on conflict (profile_id) do update set pace = excluded.pace, lines = excluded.lines;

-- ───────────── your builds, laid down fresh ─────────────
delete from public.builds where starter_id = '00000000-0000-4000-8000-0000000000a0' or owner_id = '00000000-0000-4000-8000-0000000000a0';

-- the people on each side, for brevity
-- you (a0) · Felix (07) · Justin (08) · Mariah (09) · James (10) · Kevin (11)
insert into public.builds (id, type_key, profile_build_id, starter_id, owner_id, items, turn_id, round, status, agreed_by, as_is_note, via, agreed_at, created_at, updated_at) values
  -- Felix remixed your mixtape and sent a note: your move
  ('00000000-0000-4000-8000-0000000be001', 'mixtape', '00000000-0000-4000-8000-00000000dd01', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-0000000000a0', '[
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"ocean-pink-white","artist":"Frank Ocean","title":"Pink + White","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000007"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"caesar-get-you","artist":"Daniel Caesar","title":"Get You","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b6/cd/1a/b6cd1a5b-83af-a1e2-0ad7-ea530fcf2522/859722261219.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000007"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"}]',
   '00000000-0000-4000-8000-0000000000a0', 1, 'open', '{}', null, null, null, now() - interval '2 hours', now() - interval '2 hours'),
  -- Justin did the same: your move
  ('00000000-0000-4000-8000-0000000be002', 'mixtape', '00000000-0000-4000-8000-00000000dd01', '00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-0000000000a0', '[
     {"key":"tame-let-it-happen","artist":"Tame Impala","title":"Let It Happen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000008"},
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"demarco-chamber","artist":"Mac DeMarco","title":"Chamber of Reflection","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e0/04/eb/e004eb2b-754f-4a76-9ecc-87d4eea2a327/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000008"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"}]',
   '00000000-0000-4000-8000-0000000000a0', 1, 'open', '{}', null, null, null, now() - interval '5 hours', now() - interval '5 hours'),
  -- Mariah loved your mixtape as it is: match back or not
  ('00000000-0000-4000-8000-0000000be003', 'mixtape', '00000000-0000-4000-8000-00000000dd01', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-0000000000a0', '[
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"harnett-let-me","artist":"Sinead Harnett","title":"If You Let Me","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/5d/99/7d/5d997de6-f6ae-3561-ed2e-9cc40c067b92/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"}]',
   '00000000-0000-4000-8000-0000000000a0', 1, 'as_is', '{}', 'Okay this rotation is unreal. Record store, then coffee?', null, null, now() - interval '9 hours', now() - interval '9 hours'),
  -- you made James's rotation a mixtape just now: his move (he answers in a couple of minutes)
  ('00000000-0000-4000-8000-0000000be004', 'mixtape', '00000000-0000-4000-8000-00000000de01', '00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-000000000010', '[
     {"key":"fred-again-delilah","artist":"Fred again..","title":"Delilah (pull me out of this)","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b0/9c/b7/b09cb72c-cca9-5d66-bc9d-a9b5e5f86b22/5054197236389.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"kaytranada-glowed","artist":"KAYTRANADA","title":"Glowed Up","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"walker-body","artist":"Summer Walker","title":"Body","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b2/44/8b/b2448b3b-e882-d5d3-6042-2477e354e72e/19UMGIM85342.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"disclosure-latch","artist":"Disclosure","title":"Latch","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/93/e0/5793e0d6-4877-e015-ef54-3fd4eff87344/14UMGIM12348.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"jamie-xx-gosh","artist":"Jamie xx","title":"Gosh","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/dc/ce/b9dcce9c-8cf8-4105-0fab-fb048702bce2/cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"},
     {"key":"sza-snooze","artist":"SZA","title":"Snooze","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"four-tet-two-thousand","artist":"Four Tet","title":"Two Thousand and Seventeen","art":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/aa/99/b5/aa99b504-2656-85c4-965a-3bc80e52d0f2/666017319728_cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000010"}]',
   '00000000-0000-4000-8000-000000000010', 1, 'open', '{}', null, null, null, now() - interval '1 minute', now() - interval '1 minute'),
  -- you and Kevin finished one: a match
  ('00000000-0000-4000-8000-0000000be005', 'mixtape', '00000000-0000-4000-8000-00000000df01', '00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-000000000011', '[
     {"key":"lacy-dark-red","artist":"Steve Lacy","title":"Dark Red","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6d/c2/86/6dc286d1-057e-c014-e42f-dbf4e829867b/5054526102712.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"falls-butterflies","artist":"Isiaah Falls","title":"Butterflies","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"paak-come-down","artist":"Anderson .Paak","title":"Come Down","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/04/f0/3204f09c-4580-3880-7f5f-254dfa4d258f/888915184455_cover.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"thundercat-them-changes","artist":"Thundercat","title":"Them Changes","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0a/e8/0c/0ae80cc1-e4c2-5e14-4dc2-3dfefb013896/5054429007756.png/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"jhene-triggered","artist":"Jhené Aiko","title":"Triggered","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b5/35/84/b535844b-6fe5-f659-4ba2-217c8e8b5e8a/20UMGIM38482.rgb.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-0000000000a0"},
     {"key":"tyler-see-you-again","artist":"Tyler, The Creator","title":"See You Again","art":"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c6/3d/3b/c63d3b44-d74b-9b79-be7d-aeb714146378/5052917021727_CookinCovers.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"gambino-summer","artist":"Childish Gambino","title":"Feels Like Summer","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/26/22/6b262212-325b-4971-2c47-51ae443aa78d/886447212882.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"},
     {"key":"ocean-pink-white","artist":"Frank Ocean","title":"Pink + White","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg","by":"00000000-0000-4000-8000-000000000011"}]',
   null, 3, 'agreed', '{00000000-0000-4000-8000-0000000000a0,00000000-0000-4000-8000-000000000011}', null, 'build', now() - interval '30 hours', now() - interval '50 hours', now() - interval '30 hours');

insert into public.build_turns (build_id, actor_id, action, items, changes, note, created_at) values
  ('00000000-0000-4000-8000-0000000be001', '00000000-0000-4000-8000-000000000007', 'start', null, 2, 'Those lyrics are forever stuck in my head. Nice taste 🔥', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-0000000be002', '00000000-0000-4000-8000-000000000008', 'start', null, 2, 'Tame Impala over Diplo any damn day', now() - interval '5 hours'),
  ('00000000-0000-4000-8000-0000000be003', '00000000-0000-4000-8000-000000000009', 'love_as_is', null, null, 'Okay this rotation is unreal. Record store, then coffee?', now() - interval '9 hours'),
  ('00000000-0000-4000-8000-0000000be004', '00000000-0000-4000-8000-0000000000a0', 'start', null, 2, 'Delilah on repeat. Added two for the late part of the night.', now() - interval '1 minute'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-0000000000a0', 'start', null, 2, null, now() - interval '50 hours'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-000000000011', 'turn', null, 1, 'Had to put one more on there.', now() - interval '40 hours'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-0000000000a0', 'agree', null, null, null, now() - interval '32 hours'),
  ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-000000000011', 'agree', null, null, null, now() - interval '30 hours');

insert into public.matches (build_id, a_id, b_id, created_at)
  values ('00000000-0000-4000-8000-0000000be005', '00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-000000000011', now() - interval '30 hours');
insert into public.messages (match_id, sender_id, body, created_at)
select m.id, x.sender::uuid, x.body, now() - x.ago
  from public.matches m,
       (values ('00000000-0000-4000-8000-000000000011', 'Okay that Isiaah Falls track was the move.', interval '29 hours'),
               ('00000000-0000-4000-8000-0000000000a0', 'Right?? Friday at Elsewhere?', interval '28 hours'),
               ('00000000-0000-4000-8000-000000000011', 'Say less.', interval '27 hours')) x(sender, body, ago)
 where m.build_id = '00000000-0000-4000-8000-0000000be005';
