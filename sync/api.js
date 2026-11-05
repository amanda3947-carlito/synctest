/* sync — the client's side of the backend.
   Thin wrappers over supabase-js: sign in by phone, the feed and profiles, the build
   engine's verbs, and a realtime feed of your builds. Every rule lives in the database;
   this file only shapes rows into what the screens draw. */

window.SyncAPI = (() => {
  const cfg = window.SYNC_CONFIG;
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  // ── media paths → URLs. demo/… lives in the prototype's assets; everything else is in the private bucket.
  const urlCache = new Map();
  const isRemote = (p) => /^https?:\/\//.test(p);
  async function mediaUrls(paths) {
    const out = {};
    const need = [];
    for (const p of paths) {
      if (!p) continue;
      if (isRemote(p)) out[p] = p;
      else if (p.startsWith('demo/')) out[p] = cfg.demoAssets + p.slice(5);
      else if (p.startsWith('assets/')) out[p] = p;
      else if (urlCache.has(p)) out[p] = urlCache.get(p);
      else need.push(p);
    }
    if (need.length) {
      const { data, error } = await sb.storage.from('media').createSignedUrls(need, 60 * 60);
      if (!error) for (const row of data) if (row.signedUrl) { urlCache.set(row.path, row.signedUrl); out[row.path] = row.signedUrl; }
    }
    return out;
  }

  // ── auth
  const session = async () => (await sb.auth.getSession()).data.session;
  const userId = async () => (await session())?.user?.id || null;
  const sendCode = (phone) => sb.auth.signInWithOtp({ phone });
  const verifyCode = (phone, token) => sb.auth.verifyOtp({ phone, token, type: 'sms' });
  const signOut = () => sb.auth.signOut();

  // ── me
  async function myProfile() {
    const id = await userId();
    if (!id) return null;
    const { data } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
    return data;
  }
  async function createProfile({ name, last_name, birthdate }) {
    const id = await userId();
    const { data, error } = await sb.from('profiles').insert({ id, name, last_name: last_name || null, birthdate, intro_quote: null }).select().single();
    if (error) throw error;
    return data;
  }
  // a photo for the Style bento ("Vibes"): uploaded to the person's own folder, path kept on the profile
  async function uploadStyle(file) {
    const id = await userId();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/vibe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const up = await sb.storage.from('media').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (up.error) throw up.error;
    return path;
  }
  async function uploadVoice(key, blob) {
    const id = await userId();
    const ext = /ogg/.test(blob.type) ? 'ogg' : /mp4|aac|m4a/.test(blob.type) ? 'm4a' : 'webm';
    const path = `${id}/voice-${key}-${Date.now()}.${ext}`;
    const up = await sb.storage.from('media').upload(path, blob, { contentType: blob.type || 'audio/webm' });
    if (up.error) throw up.error;
    return path;
  }
  // one kind at a time, the way the board asks
  const GIFS = [['hello-ladies.png', 'Hello ladies'], ['spinning-dancer.gif', 'Spinning dancer'], ['black-cat.gif', 'Black cat'], ['dj-caveman.gif', 'Caveman DJ'], ['disco.gif', 'Disco'], ['heart.gif', 'Heart'], ['horse.gif', 'Galloping horse'], ['thumbs-up.gif', 'Thumbs up'], ['dancing-men.gif', 'Dancing']];
  // the GIF keyboard: an empty query is the reel to browse; typing narrows it. With a Giphy key
  // in config.js it's trending + search from Giphy; without one it's the local reel.
  async function searchGifs(term) {
    const key = window.SYNC_CONFIG && window.SYNC_CONFIG.giphyKey;
    if (key) {
      try {
        const u = term ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(term)}&limit=24&rating=pg-13` : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=pg-13`;
        const { data } = await fetch(u).then((r) => r.json());
        if (Array.isArray(data) && data.length) return data.map((g) => ({ kind: 'gif', key: 'giphy:' + g.id, title: g.title || 'GIF', meta: null, art: (g.images.fixed_width || g.images.original).url, thumb: (g.images.fixed_width_small || g.images.fixed_width).url }));
      } catch (e) { /* fall through to the reel */ }
    }
    const t = term.toLowerCase();
    return GIFS.filter(([, name]) => !t || name.toLowerCase().includes(t)).map(([file, name]) => ({ kind: 'gif', key: 'gif:' + file, title: name, meta: null, art: 'assets/gifs/' + file }));
  }
  async function searchKind(kind, q) {
    const term = q.trim();
    if (kind === 'track') {
      const d = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&country=us`).then((r) => r.json());
      return d.results.map((r) => ({ kind: 'track', key: 'itunes:song:' + r.trackId, title: r.trackName, meta: r.artistName, art: (r.artworkUrl100 || '').replace('100x100bb', '300x300bb') }));
    }
    if (kind === 'place') return (await searchPlaces(term)).map((x) => ({ kind: 'place', key: 'place:' + x.id, id: x.id, title: x.name, meta: [x.kind, x.neighborhood].filter(Boolean).join(' \u2022 '), art: null }));
    if (kind === 'gif') return searchGifs(term);
    return searchShelf(kind, term);
  }
  // "search anything": tracks, films, shows, books and places, together
  async function searchAll(q) {
    const term = q.trim();
    const tracks = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=us`).then((r) => r.json())
      .then((d) => d.results.map((r) => ({ kind: 'track', key: 'itunes:song:' + r.trackId, title: r.trackName, meta: r.artistName, art: (r.artworkUrl100 || '').replace('100x100bb', '300x300bb') }))).catch(() => []);
    const [t, f, s, b, p] = await Promise.all([tracks, searchShelf('film', term).catch(() => []), searchShelf('show', term).catch(() => []), searchShelf('book', term).catch(() => []), searchPlaces(term).catch(() => [])]);
    const places = p.map((x) => ({ kind: 'place', key: 'place:' + x.id, id: x.id, title: x.name, meta: [x.kind, x.neighborhood].filter(Boolean).join(' • '), art: null }));
    // interleave so no one kind hogs the list
    const buckets = [t.slice(0, 4), places.slice(0, 3), f.slice(0, 3), s.slice(0, 3), b.slice(0, 3)];
    const out = [];
    for (let i = 0; i < 5; i++) for (const bk of buckets) if (bk[i]) out.push(bk[i]);
    return out.slice(0, 14);
  }
  async function uploadPhoto(file) {
    const id = await userId();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/${Date.now()}.${ext}`;
    const up = await sb.storage.from('media').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (up.error) throw up.error;
    const { count } = await sb.from('profile_media').select('id', { count: 'exact', head: true }).eq('profile_id', id);
    const ins = await sb.from('profile_media').insert({ profile_id: id, kind: file.type.startsWith('video') ? 'video' : 'photo', path, position: count || 0 });
    if (ins.error) throw ins.error;
    urlCache.delete(path);
    return path;
  }
  async function updateProfile(patch) {
    const id = await userId();
    const { data, error } = await sb.from('profiles').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  // what first run still needs from this person
  async function myState() {
    const id = await userId();
    const [media, builds, places, events, contacts, prof, shelf] = await Promise.all([
      sb.from('profile_media').select('id').eq('profile_id', id).limit(1),
      sb.from('profile_builds').select('id').eq('profile_id', id).eq('type_key', 'mixtape').limit(1),
      sb.from('profile_places').select('place_id').eq('profile_id', id).limit(1),
      sb.from('profile_events').select('event_id').eq('profile_id', id).limit(1),
      sb.rpc('my_contact_count').then((r) => r.data || 0, () => 0),
      sb.from('profiles').select('intro_quote').eq('id', id).maybeSingle(),
      sb.from('profile_shelf').select('id').eq('profile_id', id).limit(1),
    ]);
    return { photos: !!(media.data || []).length, mixtape: !!(builds.data || []).length, places: !!(places.data || []).length,
             events: !!(events.data || []).length, contacts: contacts > 0, intro: !!(prof.data && prof.data.intro_quote), shelf: !!(shelf.data || []).length };
  }
  async function myMedia() {
    const id = await userId();
    const { data } = await sb.from('profile_media').select('id,kind,path,poster_path,position').eq('profile_id', id).order('position');
    const rows = data || [];
    const url = await mediaUrls(rows.flatMap((m) => [m.path, m.poster_path]).filter(Boolean));
    return rows.map((m) => ({ ...m, url: url[m.path], posterUrl: m.poster_path ? url[m.poster_path] : null }));
  }
  async function uploadMedia(file, position) {
    const id = await userId();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/${Date.now()}-${position}.${ext}`;
    const up = await sb.storage.from('media').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (up.error) throw up.error;
    const kind = file.type.startsWith('video') ? 'video' : 'photo';
    const { data, error } = await sb.from('profile_media').insert({ profile_id: id, kind, path, position }).select().single();
    if (error) throw error;
    return data;
  }
  const removeMedia = async (mediaId) => { const { error } = await sb.from('profile_media').delete().eq('id', mediaId); if (error) throw error; };
  const setMediaPosition = async (mediaId, position) => { const { error } = await sb.from('profile_media').update({ position }).eq('id', mediaId); if (error) throw error; };
  async function myBuild(typeKey) {
    const id = await userId();
    const { data } = await sb.from('profile_builds').select('*').eq('profile_id', id).eq('type_key', typeKey).maybeSingle();
    return data;
  }
  // orbit
  async function searchPlaces(q) {
    const { data, error } = await sb.from('places').select('id,name,kind,neighborhood').ilike('name', `%${q.replace(/[%_]/g, '')}%`).order('name').limit(8);
    if (error) throw error;
    return data || [];
  }
  async function addPlace({ name, kind, neighborhood }) {
    const id = await userId();
    const { data, error } = await sb.from('places').upsert({ name, kind, neighborhood, created_by: id }, { onConflict: 'name,neighborhood' }).select('id,name,kind,neighborhood').single();
    if (error) throw error;
    return data;
  }
  async function myPlaces() {
    const id = await userId();
    const { data } = await sb.from('profile_places').select('position,places(id,name,kind,neighborhood)').eq('profile_id', id).order('position');
    return (data || []).filter((r) => r.places).map((r) => r.places);
  }
  async function setMyPlaces(ids) {
    const id = await userId();
    await sb.from('profile_places').delete().eq('profile_id', id);
    if (ids.length) { const { error } = await sb.from('profile_places').insert(ids.map((place_id, position) => ({ profile_id: id, place_id, position }))); if (error) throw error; }
  }
  // going to
  async function addEvent({ title, venue, starts_at }) {
    const id = await userId();
    const { data, error } = await sb.from('events').insert({ title, venue, starts_at, created_by: id }).select('id,title,venue,starts_at').single();
    if (error) throw error;
    return data;
  }
  async function myEvents() {
    const id = await userId();
    const { data } = await sb.from('profile_events').select('events(id,title,venue,starts_at)').eq('profile_id', id);
    return (data || []).filter((r) => r.events).map((r) => r.events).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  async function setMyEvents(ids) {
    const id = await userId();
    await sb.from('profile_events').delete().eq('profile_id', id);
    if (ids.length) { const { error } = await sb.from('profile_events').insert(ids.map((event_id) => ({ profile_id: id, event_id }))); if (error) throw error; }
  }
  // reading & watching. Apple's catalog has gone quiet on films and most shows (zero results for
  // "Barbie" or "Inception"), so films and shows come from Wikipedia's search, which answers
  // cross-origin and hands back the poster; books still come from Apple, with covers.
  const WIKI = {
    film: { suffix: ' film', ok: /\bfilms?\b/i, bad: /soundtrack|film score|film series|franchise|^list of|filmography|director|actor|actress|producer|screenwriter|studio|festival|award/i },
    show: { suffix: ' television series', ok: /television|tv series|miniseries|web series|sitcom|anime|docuseries/i, bad: /episode|season \d|^list of|character|actor|actress|soundtrack|network|channel|presenter|host/i },
  };
  async function searchWiki(kind, q) {
    const c = WIKI[kind];
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q + c.suffix)}&gsrlimit=10&gsrnamespace=0&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=400&pilicense=any&format=json&formatversion=2&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('catalog unavailable');
    const pages = (((await res.json()).query || {}).pages || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
    const out = [];
    for (const pg of pages) {
      const desc = pg.description || '';
      if (!c.ok.test(desc) || c.bad.test(desc)) continue;
      const title = pg.title.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const year = (desc.match(/\b(19|20)\d{2}\b/) || [])[0];
      const by = (desc.match(/\bby ([^,;(]+)/) || [])[1];
      const meta = [year, by && by.trim()].filter(Boolean).join(' · ') || desc.replace(/\b(19|20)\d{2}\b/, '').replace(/\s+/g, ' ').trim();
      out.push({ kind, key: 'wiki:' + pg.pageid, title, meta, art: pg.thumbnail ? pg.thumbnail.source : null });
      if (out.length >= 8) break;
    }
    return out;
  }
  // Apple's catalog, as the second opinion for films and shows and the only one for books
  const APPLE = { film: 'media=movie&entity=movie', show: 'media=tvShow&entity=tvSeason', book: 'media=ebook&entity=ebook' };
  async function searchApple(kind, q) {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&${APPLE[kind]}&limit=12&country=us`);
    if (!res.ok) throw new Error('catalog unavailable');
    const { results } = await res.json();
    const art = (r) => (r.artworkUrl100 || '').replace('100x100bb', '400x600bb') || null;
    const season = (name) => (name || '').replace(/,?\s*(season|series|vol\.?)\s*\d+.*$/i, '').trim();
    const seen = new Set();
    const out = [];
    for (const r of results) {
      let item;
      if (kind === 'film') item = { key: 'itunes:' + r.trackId, title: r.trackName, meta: [r.releaseDate && r.releaseDate.slice(0, 4), r.artistName].filter(Boolean).join(' · '), art: art(r) };
      else if (kind === 'show') item = { key: 'itunes:' + r.artistId + ':' + season(r.collectionName).toLowerCase(), title: season(r.collectionName), meta: r.artistName, art: art(r) };
      else item = { key: 'itunes:' + r.trackId, title: r.trackName, meta: r.artistName, art: art(r) };
      if (!item.title || seen.has(item.key)) continue;
      seen.add(item.key);
      out.push({ kind, ...item });
      if (out.length >= 8) break;
    }
    return out;
  }
  async function searchShelf(kind, q) {
    if (kind === 'book') return searchApple(kind, q);
    let hits = [];
    try { hits = await searchWiki(kind, q); } catch (e) { hits = []; }
    if (hits.length) return hits;
    try { return await searchApple(kind, q); } catch (e) { return []; }
  }
  async function myShelf() {
    const id = await userId();
    const { data } = await sb.from('profile_shelf').select('id,kind,key,title,meta,art,position').eq('profile_id', id).order('position');
    return data || [];
  }
  async function setMyShelf(items) {
    const id = await userId();
    await sb.from('profile_shelf').delete().eq('profile_id', id);
    if (items.length) { const { error } = await sb.from('profile_shelf').insert(items.map((it, position) => ({ profile_id: id, kind: it.kind, key: it.key, title: it.title, meta: it.meta || null, art: it.art || null, position }))); if (error) throw error; }
  }
  const syncContacts = async (hashes) => { const { data, error } = await sb.rpc('sync_contacts', { p_hashes: hashes }); if (error) throw error; return data; };
  const myContactCount = async () => { const { data } = await sb.rpc('my_contact_count'); return data || 0; };

  async function saveMyBuild(typeKey, items) {
    const id = await userId();
    const { data, error } = await sb.from('profile_builds').upsert({ profile_id: id, type_key: typeKey, items }, { onConflict: 'profile_id,type_key' }).select().single();
    if (error) throw error;
    return data;
  }

  // ── people
  const rpc = async (fn, args) => { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; };

  // one person, with everything the card and the profile sheet draw
  async function hydrate(p, me) {
    const [media, builds, places, events, mutuals, shared, shelf, sharedShelf] = await Promise.all([
      sb.from('profile_media').select('kind,path,poster_path,position').eq('profile_id', p.id).order('position'),
      sb.from('profile_builds').select('id,type_key,items,position').eq('profile_id', p.id).order('position'),
      sb.from('profile_places').select('position,places(id,name,kind,neighborhood,image_path)').eq('profile_id', p.id).order('position'),
      sb.from('profile_events').select('events(id,title,venue,starts_at)').eq('profile_id', p.id),
      rpc('mutuals', { p_profile: p.id }),
      rpc('shared_places', { p_profile: p.id }),
      sb.from('profile_shelf').select('kind,key,title,meta,art,position').eq('profile_id', p.id).order('position'),
      rpc('shared_shelf', { p_profile: p.id }).catch(() => []),
    ]);
    const mixtape = (builds.data || []).find((b) => b.type_key === 'mixtape');
    const paths = [
      ...(media.data || []).flatMap((m) => [m.path, m.poster_path]),
      ...(mixtape ? mixtape.items.map((t) => t.art) : []),
      p.avatar_path, ...(p.style_paths || []),
      ...Object.values(p.prompts || {}).map((x) => x && x.voice),
      ...(places.data || []).map((r) => r.places && r.places.image_path),
      ...(mutuals || []).map((m) => m.avatar_path),
    ].filter(Boolean);
    const url = await mediaUrls(paths);
    const u = (x) => (x ? url[x] || x : null);
    const STICKER = { collector: 'assets/taste-collector.png', nostalgic: 'assets/taste-nostalgic.png', audiophile: 'assets/stickers/headphones.png', classics: 'assets/stickers/guitar.png', live_shows: 'assets/stickers/ticket-sm.png', all_around: 'assets/stickers/note.png' };
    return {
      id: p.id,
      name: p.name,
      disc: STICKER[(p.taste || [])[0]] || 'assets/disc.png',
      details: p.details || {},
      items: (media.data || []).map((m) => (m.kind === 'video'
        ? { type: 'video', src: u(m.path), poster: u(m.poster_path) }
        : { type: 'photo', src: u(m.path) })),
      rotation: mixtape ? mixtape.items.map((t) => ({ key: t.key, art: u(t.art), artist: t.artist, title: t.title, by: t.by })) : [],
      builds: (builds.data || []),
      mixtapeBuildId: mixtape ? mixtape.id : null,
      profile: {
        cover: p.cover, avatar: u(p.avatar_path) || 'assets/avatar-damon.png',
        intro: { quote: (p.prompts && p.prompts.intro && p.prompts.intro.text) || p.intro_quote, prompt: p.intro_prompt || 'Say something witty back', voice: u(p.prompts && p.prompts.intro && p.prompts.intro.voice), seconds: p.prompts && p.prompts.intro && p.prompts.intro.seconds },
        lyric: { quote: (p.prompts && p.prompts.lyrics && p.prompts.lyrics.text) || p.lyric_quote, prompt: p.lyric_prompt || 'Name the artist', voice: u(p.prompts && p.prompts.lyrics && p.prompts.lyrics.voice), seconds: p.prompts && p.prompts.lyrics && p.prompts.lyrics.seconds },
        dealbreakers: p.prompts && p.prompts.dealbreakers ? { quote: p.prompts.dealbreakers.text, prompt: 'Fair or not?', voice: u(p.prompts.dealbreakers.voice), seconds: p.prompts.dealbreakers.seconds } : null,
        obsession: p.prompts && p.prompts.obsession ? { quote: p.prompts.obsession.text, prompt: 'Tell me yours', voice: u(p.prompts.obsession.voice), seconds: p.prompts.obsession.seconds } : null,
        taste: p.taste || [],
        style: (p.style_paths || []).map(u),
        spots: (places.data || []).filter((r) => r.places).map((r) => ({ img: u(r.places.image_path), name: r.places.name, meta: `${r.places.kind || 'Spot'} • ${r.places.neighborhood || ''}`, shared: (shared || []).some((s) => s.id === r.places.id) })),
        events: (events.data || []).filter((r) => r.events).map((r) => r.events).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
        mutuals: (mutuals || []).map((m) => ({ ...m, avatar: u(m.avatar_path) })),
        shelf: (shelf.data || []).map((s) => ({ ...s, shared: (sharedShelf || []).some((x) => x.key === s.key) })),
      },
    };
  }
  async function feed(limit = 20) {
    const me = await userId();
    const rows = await rpc('feed', { p_limit: limit });
    return Promise.all(rows.map((p) => hydrate(p, me)));
  }
  // the feed as the screen shows it: people with a build in flight first (yours to move on
  // top), then everyone new. The feed() rule itself hides anyone you already have a build with.
  async function peopleForFeed(limit = 20) {
    const me = await userId();
    const active = await myBuilds();
    const ids = Object.keys(active);
    let inFlight = [];
    if (ids.length) {
      const { data } = await sb.from('profiles').select('*').in('id', ids);
      inFlight = await Promise.all((data || []).map((p) => hydrate(p, me)));
      inFlight.forEach((p) => { p.activeBuild = active[p.id]; });
      inFlight.sort((a, b) => Number(b.activeBuild.mine) - Number(a.activeBuild.mine));
    }
    const fresh = await feed(limit);
    return [...inFlight, ...fresh];
  }

  // ── builds I'm part of, keyed by the other person
  async function myBuilds() {
    const me = await userId();
    const { data } = await sb.from('builds').select('*').in('status', ['open', 'as_is', 'agreed']).order('updated_at', { ascending: false });
    const byOther = {};
    for (const b of data || []) {
      const other = b.starter_id === me ? b.owner_id : b.starter_id;
      if (!byOther[other]) byOther[other] = { ...b, mine: b.turn_id === me, iStarted: b.starter_id === me };
    }
    return byOther;
  }
  const startBuild = (profileBuildId, items) => rpc('start_build', { p_profile_build: profileBuildId, p_items: items });
  const sendTurn = (buildId, items) => rpc('send_turn', { p_build: buildId, p_items: items });
  const agree = (buildId) => rpc('agree_build', { p_build: buildId });
  const loveAsIs = (profileBuildId, note) => rpc('love_as_is', { p_profile_build: profileBuildId, p_note: note });
  const matchBack = (buildId) => rpc('match_back', { p_build: buildId });
  const counterAsIs = (buildId, items) => rpc('counter_as_is', { p_build: buildId, p_items: items });
  const closeBuild = (buildId) => rpc('close_build', { p_build: buildId });
  const pass = (profileId) => rpc('pass_profile', { p_profile: profileId });

  // ── realtime: any change to a build I'm in
  function watchBuilds(onChange) {
    const ch = sb.channel('my-builds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'builds' }, (payload) => onChange(payload.new || payload.old))
      .subscribe();
    return () => sb.removeChannel(ch);
  }

  // a track from the mixtape sheet, in the shape the database keeps
  const trackItem = (t) => ({ key: t.key || (t.artist + '|' + t.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), artist: t.artist, title: t.title, art: t.art });

  return { sb, session, userId, sendCode, verifyCode, signOut, myProfile, createProfile, updateProfile, myState, myMedia, uploadMedia, removeMedia, setMediaPosition, myBuild,
           searchPlaces, addPlace, myPlaces, setMyPlaces, uploadVoice, addEvent, myEvents, setMyEvents, syncContacts, myContactCount, searchShelf, myShelf, setMyShelf, searchAll, searchKind, uploadStyle, uploadPhoto, saveMyBuild,
           feed, peopleForFeed, hydrate, myBuilds, startBuild, sendTurn, agree, loveAsIs, matchBack, counterAsIs, closeBuild, pass,
           watchBuilds, mediaUrls, trackItem };
})();
