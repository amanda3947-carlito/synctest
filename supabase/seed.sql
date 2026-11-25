-- Sync seed: the build type (the mixtape), Brooklyn places and events, and six demo profiles
-- (the people from the designed prototype and the home feed frame) with fully filled builds.
-- Safe to re-run: everything upserts on fixed ids.

insert into public.build_types (key, name, verb, kind, unit, capacity, min_items, min_each, per_turn, slots, position) values
  ('mixtape', 'Mixtape',            'Remix', 'list', 'track', 8, 3, 0, 2, '[]', 1)
on conflict (key) do update set name = excluded.name, verb = excluded.verb, kind = excluded.kind, unit = excluded.unit,
  capacity = excluded.capacity, min_items = excluded.min_items, min_each = excluded.min_each, per_turn = excluded.per_turn,
  slots = excluded.slots, position = excluded.position;

-- demo accounts. On hosted Supabase run this from the SQL editor (service role); these users never sign in.
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000001', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000002', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000003', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, phone_hash, name, birthdate, neighborhood, cover, avatar_path, intro_quote, lyric_quote, taste, style_paths) values
  ('00000000-0000-4000-8000-000000000001', encode(sha256('+15550000001'::bytea), 'hex'), 'Damon',  '1996-04-12', 'Gowanus',      'vinyl',     'demo/avatar-damon.png', 'Jazz on vinyl. Rap in the kitchen.', 'This may be the night that my dreams might let me know / All the stars are closer.', '{collector,nostalgic,audiophile,throwback}', '{demo/style-1.png,demo/style-2.png,demo/style-3.png,demo/style-4.png}'),
  ('00000000-0000-4000-8000-000000000002', encode(sha256('+15550000002'::bytea), 'hex'), 'Olivia', '1998-09-03', 'Fort Greene',  'holo', 'demo/imani-4.png',      'Sunday records, Tuesday karaoke.', 'I was enchanted to meet you.', '{nostalgic,throwback}', '{}'),
  ('00000000-0000-4000-8000-000000000003', encode(sha256('+15550000003'::bytea), 'hex'), 'Theo',   '1995-01-27', 'Bushwick',     'waveform',      'demo/theo-4.png',       'Will trade tacos for a good opener.', 'Northern attitude, I was raised on little light.', '{audiophile,collector}', '{}')
on conflict (id) do update set name = excluded.name, neighborhood = excluded.neighborhood, cover = excluded.cover, avatar_path = excluded.avatar_path,
  intro_quote = excluded.intro_quote, lyric_quote = excluded.lyric_quote, taste = excluded.taste, style_paths = excluded.style_paths;

insert into public.profile_media (id, profile_id, kind, path, poster_path, position, approved) values
  ('00000000-0000-4000-8000-00000000a101', '00000000-0000-4000-8000-000000000001', 'photo', 'demo/bg-damon.png', null, 0, true),
  ('00000000-0000-4000-8000-00000000a102', '00000000-0000-4000-8000-000000000001', 'photo', 'demo/damon-2.png', null, 1, true),
  ('00000000-0000-4000-8000-00000000a103', '00000000-0000-4000-8000-000000000001', 'video', 'demo/damon-3.webm', 'demo/damon-3.png', 2, true),
  ('00000000-0000-4000-8000-00000000a201', '00000000-0000-4000-8000-000000000002', 'photo', 'demo/bg-imani.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a202', '00000000-0000-4000-8000-000000000002', 'video', 'demo/imani-3.webm', 'demo/imani-3.png', 1, true),
  ('00000000-0000-4000-8000-00000000a301', '00000000-0000-4000-8000-000000000003', 'photo', 'demo/bg-theo.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a302', '00000000-0000-4000-8000-000000000003', 'video', 'demo/theo-3.webm', 'demo/theo-3.png', 1, true)
on conflict (id) do nothing;

-- Brooklyn places ("in their orbit")
insert into public.places (id, name, kind, neighborhood) values
  ('00000000-0000-4000-8000-00000000b001', 'Public Records',   'Restaurant', 'Gowanus'),
  ('00000000-0000-4000-8000-00000000b002', 'Hidden Rivers',    'Bar',        'Gowanus'),
  ('00000000-0000-4000-8000-00000000b003', 'Books Are Magic',  'Store',      'Cobble Hill'),
  ('00000000-0000-4000-8000-00000000b004', 'Nitehawk Prospect Park', 'Cinema', 'Park Slope'),
  ('00000000-0000-4000-8000-00000000b005', 'Fort Greene Park', 'Park',       'Fort Greene'),
  ('00000000-0000-4000-8000-00000000b006', 'Roberta''s',       'Restaurant', 'Bushwick'),
  ('00000000-0000-4000-8000-00000000b007', 'Elsewhere',        'Venue',      'Bushwick'),
  ('00000000-0000-4000-8000-00000000b008', 'Brooklyn Bridge Park, Pier 1', 'Park', 'DUMBO'),
  ('00000000-0000-4000-8000-00000000b009', 'Human Head Records', 'Store',    'Bushwick'),
  ('00000000-0000-4000-8000-00000000b010', 'Barboncino',       'Restaurant', 'Crown Heights')
on conflict (id) do nothing;

insert into public.profile_places (profile_id, place_id, position) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000b001', 0),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000b002', 1),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000b003', 2),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000b005', 0),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000b003', 1),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000b004', 2),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000b006', 0),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000b007', 1),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000b009', 2)
on conflict do nothing;

-- the seed places' pins (so a picture can be found near each)
update public.places set lat = 40.6823, lng = -73.9869 where id = '00000000-0000-4000-8000-00000000b001' and lat is null;
update public.places set lat = 40.6762, lng = -73.989 where id = '00000000-0000-4000-8000-00000000b002' and lat is null;
update public.places set lat = 40.6866, lng = -73.9924 where id = '00000000-0000-4000-8000-00000000b003' and lat is null;
update public.places set lat = 40.6619, lng = -73.9796 where id = '00000000-0000-4000-8000-00000000b004' and lat is null;
update public.places set lat = 40.6915, lng = -73.9744 where id = '00000000-0000-4000-8000-00000000b005' and lat is null;
update public.places set lat = 40.705, lng = -73.9336 where id = '00000000-0000-4000-8000-00000000b006' and lat is null;
update public.places set lat = 40.7097, lng = -73.9238 where id = '00000000-0000-4000-8000-00000000b007' and lat is null;
update public.places set lat = 40.7017, lng = -73.9961 where id = '00000000-0000-4000-8000-00000000b008' and lat is null;
update public.places set lat = 40.7066, lng = -73.9339 where id = '00000000-0000-4000-8000-00000000b009' and lat is null;
update public.places set lat = 40.6719, lng = -73.9573 where id = '00000000-0000-4000-8000-00000000b010' and lat is null;

-- events ("going to")
insert into public.events (id, title, venue, starts_at) values
  ('00000000-0000-4000-8000-00000000c001', 'Khruangbin', 'Brooklyn Paramount', now() + interval '12 days'),
  ('00000000-0000-4000-8000-00000000c002', 'Smorgasburg', 'Marsha P. Johnson State Park', now() + interval '5 days'),
  ('00000000-0000-4000-8000-00000000c003', 'Nitehawk Midnite: Stop Making Sense', 'Nitehawk Prospect Park', now() + interval '8 days'),
  ('00000000-0000-4000-8000-00000000c004', 'Bushwick Open Studios', 'Bushwick', now() + interval '20 days')
on conflict (id) do nothing;

insert into public.profile_events (profile_id, event_id) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000c001'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000c001'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000c003'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000c004')
on conflict do nothing;

-- the owners' builds: each person's mixtape
insert into public.profile_builds (id, profile_id, type_key, items, position) values
  ('00000000-0000-4000-8000-00000000d101', '00000000-0000-4000-8000-000000000001', 'mixtape', '[
     {"key":"drake-classic-pt2","artist":"Drake","title":"Classic PT2","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/45/62/bb4562a3-45a2-539c-b557-a18ea060a476/26UMGIM63616.rgb.jpg/600x600bb.jpg"},
     {"key":"jhene-break","artist":"Jhené Aiko","title":"Break","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5f/51/9f/5f519f49-44c1-6aeb-f289-5b14c677abb1/26UM1IM17017.rgb.jpg/600x600bb.jpg"},
     {"key":"lacy-nothing","artist":"Steve Lacy","title":"nothing","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1c/b2/46/1cb246db-afae-a599-d377-44a7ea7267fa/196874346976.jpg/600x600bb.jpg"},
     {"key":"sza-sos","artist":"SZA","title":"SOS","art":"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg"},
     {"key":"pnd-padre","artist":"PARTYNEXTDOOR & Drake","title":"MEET YOUR PADRE","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/65/a1/d8/65a1d809-dede-adf4-d85e-964070e77f58/808391285897.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d201', '00000000-0000-4000-8000-000000000002', 'mixtape', '[
     {"key":"rodrigo-maggots","artist":"Olivia Rodrigo","title":"maggots for brains","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/1b/f9/1d1bf9b1-44c6-9a6c-6ffb-c158488c06ce/26UMGIM39303.rgb.jpg/600x600bb.jpg"},
     {"key":"grande-petal","artist":"Ariana Grande","title":"petal","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/56/f4/96/56f49612-02dd-83f4-44fe-d2118cc70707/26UMGIM51129.rgb.jpg/600x600bb.jpg"},
     {"key":"dean-intro","artist":"Olivia Dean","title":"The Art of Loving (Intro)","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/08/e2/21/08e22164-7c0b-1522-818f-e0e74f62dc49/25UMGIM69703.rgb.jpg/600x600bb.jpg"},
     {"key":"swift-patient-zero","artist":"Taylor Swift","title":"Patient Zero","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg"},
     {"key":"styles-american-girls","artist":"Harry Styles","title":"American Girls","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/41/6a/07416a78-38b9-2d47-7ce8-8a52a44c510f/196874010112.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d301', '00000000-0000-4000-8000-000000000003', 'mixtape', '[
     {"key":"kahan-divide","artist":"Noah Kahan","title":"The Great Divide","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e0/53/5b/e0535bb5-a269-8cc4-e12f-589e26809569/26UMGIM02802.rgb.jpg/600x600bb.jpg"},
     {"key":"bryan-lodi","artist":"Zach Bryan","title":"Lodi When","art":"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ea/98/f2/ea98f2b8-5131-29ae-2064-997234ef13bc/093624812647.jpg/600x600bb.jpg"},
     {"key":"bunny-nuevayol","artist":"Bad Bunny","title":"NUEVAYoL","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/600x600bb.jpg"},
     {"key":"karol-bby","artist":"KAROL G","title":"BbY WOW","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2b/66/b2/2b66b26c-ab23-faa1-c4ee-06fa2cce8f76/26UM1IM00558.rgb.jpg/600x600bb.jpg"},
     {"key":"wallen-just-in-case","artist":"Morgan Wallen","title":"Just In Case","art":"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fa/60/fe/fa60fe4a-4329-a0bb-eb7c-3b6094a4d831/25UMGIM46049.rgb.jpg/600x600bb.jpg"}]', 0)
on conflict (id) do update set items = excluded.items, position = excluded.position;

-- Damon and Olivia share two contacts; one of them (Theo) is on Sync
insert into public.contact_hashes (profile_id, phone_hash) values
  ('00000000-0000-4000-8000-000000000001', encode(sha256('+15550000003'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000001', encode(sha256('+15550009999'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000002', encode(sha256('+15550000003'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000002', encode(sha256('+15550009999'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000002', encode(sha256('+15550008888'::bytea), 'hex'))
on conflict do nothing;

-- reading & watching (covers come from the catalog when a person picks them; seed rows draw typographic covers)
insert into public.profile_shelf (profile_id, kind, key, title, meta, position) values
  ('00000000-0000-4000-8000-000000000001', 'film', 'seed:past-lives',  'Past Lives',   '2023 · Celine Song', 0),
  ('00000000-0000-4000-8000-000000000001', 'show', 'seed:the-bear',    'The Bear',     'FX', 1),
  ('00000000-0000-4000-8000-000000000001', 'book', 'seed:the-argonauts', 'The Argonauts', 'Maggie Nelson', 2),
  ('00000000-0000-4000-8000-000000000002', 'show', 'seed:fleabag',     'Fleabag',      'BBC', 0),
  ('00000000-0000-4000-8000-000000000002', 'book', 'seed:intermezzo',  'Intermezzo',   'Sally Rooney', 1),
  ('00000000-0000-4000-8000-000000000002', 'film', 'seed:past-lives',  'Past Lives',   '2023 · Celine Song', 2),
  ('00000000-0000-4000-8000-000000000003', 'film', 'seed:aftersun',    'Aftersun',     '2022 · Charlotte Wells', 0),
  ('00000000-0000-4000-8000-000000000003', 'show', 'seed:severance',   'Severance',    'Apple TV+', 1),
  ('00000000-0000-4000-8000-000000000003', 'book', 'seed:trust',       'Trust',        'Hernan Diaz', 2)
on conflict (profile_id, key) do nothing;

-- ───────────── three more people, from the ":: home feed" frame (Mohammad, Oliver, Veronica), filled in full ─────────────
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000004', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000005', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+15550000006', now(), '{"provider":"phone","providers":["phone"]}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, phone_hash, name, birthdate, neighborhood, cover, avatar_path, intro_quote, lyric_quote, taste, style_paths, seeking, details, prompts) values
  ('00000000-0000-4000-8000-000000000004', encode(sha256('+15550000004'::bytea), 'hex'), 'Mohammad', '1997-06-18', 'Clinton Hill', 'discs', 'demo/avatar-mohammad.jpg',
     'Rooftop sunsets and a speaker that’s too loud.', 'Started from the bottom, now we’re here.', '{collector,live_shows}',
     '{demo/gifs/dj-caveman.gif,demo/stickers/sticker-sneakers.png,demo/album-3.png,demo/stickers/sticker-coffee.png}', 'friends',
     '{"hometown":"Casablanca","location":"Clinton Hill","gender":"Man","occupation":"Architect at SHoP","education":"Graduate","height":"6′0","activity":"Active","kids":"No kids","drinking":"Socially","smoking":"Doesn’t smoke"}',
     '{"intro":{"text":"Rooftop sunsets and a speaker that’s too loud."},"lyrics":{"text":"Started from the bottom, now we’re here."},"dealbreakers":{"text":"Skipping the opener."},"obsession":{"text":"Grilled halloumi, every day this week."}}'),
  ('00000000-0000-4000-8000-000000000005', encode(sha256('+15550000005'::bytea), 'hex'), 'Oliver', '1999-02-09', 'Williamsburg', 'stripes', 'demo/avatar-oliver.jpg',
     'Fitted cap, no plan, good playlist.', 'If you don’t know, now you know.', '{collector,nostalgic}',
     '{demo/gifs/disco.gif,demo/stickers/sticker-cocktail.png,demo/album-5.png,demo/stickers/sticker-clapper.png}', 'casual',
     '{"hometown":"Atlanta","location":"Williamsburg","gender":"Man","occupation":"Sneaker designer","education":"Undergrad","height":"5′11","activity":"Moderately active","kids":"Not sure yet","drinking":"Drinks","smoking":"Socially"}',
     '{"intro":{"text":"Fitted cap, no plan, good playlist."},"lyrics":{"text":"If you don’t know, now you know."},"dealbreakers":{"text":"Ketchup on a hot dog."},"obsession":{"text":"Court-side clips at 2am."}}'),
  ('00000000-0000-4000-8000-000000000006', encode(sha256('+15550000006'::bytea), 'hex'), 'Veronica', '1996-11-30', 'Greenpoint', 'rain', 'demo/avatar-veronica.jpg',
     'Late sets, early coffee.', 'I’m only happy when it rains.', '{audiophile,classics}',
     '{demo/gifs/black-cat.gif,demo/stickers/headphones.png,demo/album-1.png,demo/gifs/spinning-dancer.gif}', 'longterm',
     '{"hometown":"Kraków","location":"Greenpoint","gender":"Woman","occupation":"Sound engineer","education":"Graduate","height":"5′7","activity":"Sometimes active","kids":"Wants kids","drinking":"Socially","smoking":"Smokes"}',
     '{"intro":{"text":"Late sets, early coffee."},"lyrics":{"text":"I’m only happy when it rains."},"dealbreakers":{"text":"Talking through the quiet part."},"obsession":{"text":"Field recordings of the G train."}}')
on conflict (id) do update set name = excluded.name, neighborhood = excluded.neighborhood, cover = excluded.cover, avatar_path = excluded.avatar_path,
  intro_quote = excluded.intro_quote, lyric_quote = excluded.lyric_quote, taste = excluded.taste, style_paths = excluded.style_paths,
  seeking = excluded.seeking, details = excluded.details, prompts = excluded.prompts;

-- the first three get the new fields too, so everyone on the feed is complete
update public.profiles set seeking = 'serious',
  details = '{"hometown":"Baltimore","location":"Gowanus","gender":"Man","occupation":"Designer at RG/A","education":"Undergrad","height":"5′10","activity":"Active","kids":"No kids","drinking":"Socially","smoking":"Doesn’t smoke"}',
  prompts = '{"intro":{"text":"Jazz on vinyl. Rap in the kitchen."},"lyrics":{"text":"This may be the night that my dreams might let me know / All the stars are closer."},"dealbreakers":{"text":"Phone on the table, face up."},"obsession":{"text":"A good tomato sandwich."}}'
  where id = '00000000-0000-4000-8000-000000000001';
update public.profiles set seeking = 'crush',
  details = '{"hometown":"London","location":"Fort Greene","gender":"Woman","occupation":"Pastry chef","education":"Higher education","height":"5′5","activity":"Moderately active","kids":"Not sure yet","drinking":"Drinks","smoking":"Doesn’t smoke"}',
  prompts = '{"intro":{"text":"Sunday records, Tuesday karaoke."},"lyrics":{"text":"I was enchanted to meet you."},"dealbreakers":{"text":"Not singing in the car."},"obsession":{"text":"Cardamom buns from the place on Dekalb."}}'
  where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set seeking = 'casual',
  details = '{"hometown":"Austin","location":"Bushwick","gender":"Man","occupation":"Line cook","education":"High school","height":"6′1","activity":"Sometimes active","kids":"Wants kids","drinking":"Drinks","smoking":"Socially"}',
  prompts = '{"intro":{"text":"Will trade tacos for a good opener."},"lyrics":{"text":"Northern attitude, I was raised on little light."},"dealbreakers":{"text":"Leaving before the encore."},"obsession":{"text":"Birria, the long way."}}'
  where id = '00000000-0000-4000-8000-000000000003';

insert into public.profile_media (id, profile_id, kind, path, poster_path, position, approved) values
  ('00000000-0000-4000-8000-00000000a401', '00000000-0000-4000-8000-000000000004', 'photo', 'demo/bg-mohammad.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a501', '00000000-0000-4000-8000-000000000005', 'photo', 'demo/bg-oliver.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a502', '00000000-0000-4000-8000-000000000005', 'photo', 'demo/oliver-2.jpg', null, 1, true),
  ('00000000-0000-4000-8000-00000000a601', '00000000-0000-4000-8000-000000000006', 'photo', 'demo/bg-veronica.jpg', null, 0, true),
  ('00000000-0000-4000-8000-00000000a602', '00000000-0000-4000-8000-000000000006', 'photo', 'demo/veronica-2.jpg', null, 1, true)
on conflict (id) do nothing;

insert into public.profile_places (profile_id, place_id, position) values
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-00000000b005', 0),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-00000000b001', 1),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-00000000b008', 2),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-00000000b007', 0),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-00000000b010', 1),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-00000000b002', 2),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000b009', 0),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000b004', 1),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000b006', 2)
on conflict do nothing;

insert into public.profile_events (profile_id, event_id) values
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-00000000c001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-00000000c002'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-00000000c002'),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000c001'),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000c003')
on conflict do nothing;

insert into public.profile_builds (id, profile_id, type_key, items, position) values
  ('00000000-0000-4000-8000-00000000d401', '00000000-0000-4000-8000-000000000004', 'mixtape', '[
     {"key":"levant-deira","artist":"Saint Levant","title":"Deira","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/e3/01/63/e301635c-5d1b-8f38-d1a1-bc90b5d7b1c7/196922854101_Cover.jpg/600x600bb.jpg"},
     {"key":"nas-ny-state","artist":"Nas","title":"N.Y. State of Mind","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d0/88/20/d0882040-a591-c85e-fa24-87a6edbf6a39/074646975329.jpg/600x600bb.jpg"},
     {"key":"toto-mghayer","artist":"ElGrandeToto","title":"Mghayer"},
     {"key":"khruangbin-time","artist":"Khruangbin","title":"Time (You and I)","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/94/a7/44/94a74465-1fe9-b897-a1ed-99b2e5b3b497/656605149363.jpg/600x600bb.jpg"},
     {"key":"ocean-nights","artist":"Frank Ocean","title":"Nights"}]', 0),
  ('00000000-0000-4000-8000-00000000d501', '00000000-0000-4000-8000-000000000005', 'mixtape', '[
     {"key":"outkast-atliens","artist":"Outkast","title":"ATLiens","art":"https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/fb/1a/a0/fb1aa0c5-9f37-0a77-4044-9b1bd165660e/730082603225.jpg/600x600bb.jpg"},
     {"key":"future-march-madness","artist":"Future","title":"March Madness","art":"https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b0/ca/34/b0ca349f-d3ce-3734-a97f-31578f0b214e/886445475784.jpg/600x600bb.jpg"},
     {"key":"tyler-new-magic-wand","artist":"Tyler, The Creator","title":"NEW MAGIC WAND"},
     {"key":"gambino-redbone","artist":"Childish Gambino","title":"Redbone"},
     {"key":"metro-creepin","artist":"Metro Boomin","title":"Creepin’","art":"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/c3/ef/1d/c3ef1dfc-e1f5-e885-8be7-f3155581ddf8/22UM1IM40165.rgb.jpg/600x600bb.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d601', '00000000-0000-4000-8000-000000000006', 'mixtape', '[
     {"key":"garbage-only-happy","artist":"Garbage","title":"Only Happy When It Rains","art":"https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/81/8e/64/818e6487-df77-bb60-7245-7f87c40d6f2d/00602547364890.rgb.jpg/600x600bb.jpg"},
     {"key":"portishead-glory-box","artist":"Portishead","title":"Glory Box","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c1/71/93/c1719342-df7d-e9c5-c87c-53dae5afb289/00042282855329.rgb.jpg/600x600bb.jpg"},
     {"key":"four-tet-baby","artist":"Four Tet","title":"Baby","art":"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/5a/ee/e0/5aeee0ff-c8ea-1b18-62f5-5df25aa06e76/3663729107213_cover.jpg/600x600bb.jpg"},
     {"key":"jamie-xx-loud-places","artist":"Jamie xx","title":"Loud Places","art":"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/dc/ce/b9dcce9c-8cf8-4105-0fab-fb048702bce2/cover.jpg/600x600bb.jpg"},
     {"key":"bjork-hyperballad","artist":"Björk","title":"Hyperballad","art":"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7f/b0/6e/7fb06eee-ad5b-2071-4497-7dda15e1fd50/075596278768.jpg/600x600bb.jpg"}]', 0)
on conflict (id) do update set items = excluded.items, position = excluded.position;

insert into public.profile_shelf (profile_id, kind, key, title, meta, position) values
  ('00000000-0000-4000-8000-000000000004', 'film', 'seed:dune-part-two', 'Dune: Part Two', '2024 · Denis Villeneuve', 0),
  ('00000000-0000-4000-8000-000000000004', 'show', 'seed:slow-horses',   'Slow Horses',    'Apple TV+', 1),
  ('00000000-0000-4000-8000-000000000004', 'book', 'seed:the-sympathizer', 'The Sympathizer', 'Viet Thanh Nguyen', 2),
  ('00000000-0000-4000-8000-000000000005', 'show', 'seed:atlanta',       'Atlanta',        'FX', 0),
  ('00000000-0000-4000-8000-000000000005', 'film', 'seed:challengers',   'Challengers',    '2024 · Luca Guadagnino', 1),
  ('00000000-0000-4000-8000-000000000005', 'book', 'seed:sneaker-wars',  'Sneaker Wars',   'Barbara Smit', 2),
  ('00000000-0000-4000-8000-000000000006', 'film', 'seed:aftersun',      'Aftersun',       '2022 · Charlotte Wells', 0),
  ('00000000-0000-4000-8000-000000000006', 'book', 'seed:a-little-life', 'A Little Life',  'Hanya Yanagihara', 1),
  ('00000000-0000-4000-8000-000000000006', 'show', 'seed:severance',     'Severance',      'Apple TV+', 2)
on conflict (profile_id, key) do nothing;

-- Mohammad and Oliver know each other; Veronica has Theo in her phone
insert into public.contact_hashes (profile_id, phone_hash) values
  ('00000000-0000-4000-8000-000000000004', encode(sha256('+15550000005'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000005', encode(sha256('+15550000004'::bytea), 'hex')),
  ('00000000-0000-4000-8000-000000000006', encode(sha256('+15550000003'::bytea), 'hex'))
on conflict do nothing;
