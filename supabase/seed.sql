-- Sync seed: the four build types, Brooklyn places and events, and three demo profiles
-- (the people from the designed prototype) with fully filled builds.
-- Safe to re-run: everything upserts on fixed ids.

insert into public.build_types (key, name, verb, kind, unit, capacity, min_items, min_each, per_turn, slots, position) values
  ('mixtape',   'Mixtape',   'Remix',  'list',  'track', 8, 3, 2, 2, '[]', 1),
  ('watchlist', 'Watchlist', 'Curate', 'list',  'title', 6, 4, 2, 2, '[]', 2),
  ('plan',      'The Plan',  'Plan',   'slots', null, null, null, null, 2,
     '[{"id":"when","label":"When"},{"id":"vibe","label":"Vibe"},{"id":"place","label":"Where"},{"id":"do","label":"What we''ll do"}]', 3),
  ('dinner',    'Dinner',    'Cook',   'slots', null, null, null, null, 2,
     '[{"id":"beverage","label":"Beverage"},{"id":"appetizer","label":"Appetizer"},{"id":"main","label":"Main"},{"id":"sides","label":"Sides"},{"id":"dessert","label":"Dessert"}]', 4)
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

-- the owners' builds, fully filled (the prototype's rotations as mixtapes, plus a plan and a dinner)
insert into public.profile_builds (id, profile_id, type_key, items, position) values
  ('00000000-0000-4000-8000-00000000d101', '00000000-0000-4000-8000-000000000001', 'mixtape', '[
     {"key":"drake-classic-pt2","artist":"Drake","title":"Classic PT2","art":"demo/rot-damon-1.jpg"},
     {"key":"jhene-break","artist":"Jhené Aiko","title":"Break","art":"demo/rot-damon-2.jpg"},
     {"key":"lacy-nothing","artist":"Steve Lacy","title":"nothing","art":"demo/rot-damon-3.jpg"},
     {"key":"sza-sos","artist":"SZA","title":"SOS","art":"demo/rot-damon-4.jpg"},
     {"key":"pnd-padre","artist":"PARTYNEXTDOOR & Drake","title":"MEET YOUR PADRE","art":"demo/rot-damon-5.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d102', '00000000-0000-4000-8000-000000000001', 'plan', '{
     "when":{"value":"Golden hour"}, "vibe":{"value":"Low-key, a little nerdy"},
     "place":{"value":"Public Records","place_id":"00000000-0000-4000-8000-00000000b001"},
     "do":{"value":"Dig through the listening-room shelves, then the back patio"}}', 1),
  ('00000000-0000-4000-8000-00000000d201', '00000000-0000-4000-8000-000000000002', 'mixtape', '[
     {"key":"rodrigo-maggots","artist":"Olivia Rodrigo","title":"maggots for brains","art":"demo/rot-imani-1.jpg"},
     {"key":"grande-petal","artist":"Ariana Grande","title":"petal","art":"demo/rot-imani-2.jpg"},
     {"key":"dean-intro","artist":"Olivia Dean","title":"The Art of Loving (Intro)","art":"demo/rot-imani-3.jpg"},
     {"key":"swift-patient-zero","artist":"Taylor Swift","title":"Patient Zero","art":"demo/rot-imani-4.jpg"},
     {"key":"styles-american-girls","artist":"Harry Styles","title":"American Girls","art":"demo/rot-imani-5.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d202', '00000000-0000-4000-8000-000000000002', 'watchlist', '[
     {"key":"past-lives","title":"Past Lives","meta":"Film · 2023"},
     {"key":"the-bear","title":"The Bear","meta":"TV · FX"},
     {"key":"frances-ha","title":"Frances Ha","meta":"Film · 2012"},
     {"key":"fleabag","title":"Fleabag","meta":"TV · BBC"}]', 1),
  ('00000000-0000-4000-8000-00000000d301', '00000000-0000-4000-8000-000000000003', 'mixtape', '[
     {"key":"kahan-divide","artist":"Noah Kahan","title":"The Great Divide","art":"demo/rot-theo-1.jpg"},
     {"key":"bryan-lodi","artist":"Zach Bryan","title":"Lodi When","art":"demo/rot-theo-2.jpg"},
     {"key":"bunny-nuevayol","artist":"Bad Bunny","title":"NUEVAYoL","art":"demo/rot-theo-3.jpg"},
     {"key":"karol-bby","artist":"KAROL G","title":"BbY WOW","art":"demo/rot-theo-4.jpg"},
     {"key":"wallen-just-in-case","artist":"Morgan Wallen","title":"Just In Case","art":"demo/rot-theo-5.jpg"}]', 0),
  ('00000000-0000-4000-8000-00000000d302', '00000000-0000-4000-8000-000000000003', 'dinner', '{
     "beverage":{"value":"Mezcal palomas"}, "appetizer":{"value":"Grilled street corn"},
     "main":{"value":"Birria tacos, the long way"}, "sides":{"value":"Charred scallion rice"},
     "dessert":{"value":"Churros from the cart on Knickerbocker"}}', 1)
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
