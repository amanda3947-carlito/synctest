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
  async function createProfile({ name, birthdate }) {
    const id = await userId();
    const { data, error } = await sb.from('profiles').insert({ id, name, birthdate, intro_quote: null }).select().single();
    if (error) throw error;
    return data;
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
    const [media, builds, places, events, mutuals, shared] = await Promise.all([
      sb.from('profile_media').select('kind,path,poster_path,position').eq('profile_id', p.id).order('position'),
      sb.from('profile_builds').select('id,type_key,items,position').eq('profile_id', p.id).order('position'),
      sb.from('profile_places').select('position,places(id,name,kind,neighborhood,image_path)').eq('profile_id', p.id).order('position'),
      sb.from('profile_events').select('events(id,title,venue,starts_at)').eq('profile_id', p.id),
      rpc('mutuals', { p_profile: p.id }),
      rpc('shared_places', { p_profile: p.id }),
    ]);
    const mixtape = (builds.data || []).find((b) => b.type_key === 'mixtape');
    const paths = [
      ...(media.data || []).flatMap((m) => [m.path, m.poster_path]),
      ...(mixtape ? mixtape.items.map((t) => t.art) : []),
      p.avatar_path, ...(p.style_paths || []),
      ...(places.data || []).map((r) => r.places && r.places.image_path),
    ].filter(Boolean);
    const url = await mediaUrls(paths);
    const u = (x) => (x ? url[x] || x : null);
    return {
      id: p.id,
      name: p.name,
      disc: 'assets/disc.png',
      items: (media.data || []).map((m) => (m.kind === 'video'
        ? { type: 'video', src: u(m.path), poster: u(m.poster_path) }
        : { type: 'photo', src: u(m.path) })),
      rotation: mixtape ? mixtape.items.map((t) => ({ key: t.key, art: u(t.art), artist: t.artist, title: t.title, by: t.by })) : [],
      builds: (builds.data || []),
      mixtapeBuildId: mixtape ? mixtape.id : null,
      profile: {
        cover: p.cover, avatar: u(p.avatar_path) || 'assets/avatar-damon.png',
        intro: { quote: p.intro_quote, prompt: p.intro_prompt || 'Say something witty back' },
        lyric: { quote: p.lyric_quote, prompt: p.lyric_prompt || 'Name the artist' },
        taste: p.taste || [],
        style: (p.style_paths || []).map(u),
        spots: (places.data || []).filter((r) => r.places).map((r) => ({ img: u(r.places.image_path), name: r.places.name, meta: `${r.places.kind || 'Spot'} • ${r.places.neighborhood || ''}`, shared: (shared || []).some((s) => s.id === r.places.id) })),
        events: (events.data || []).filter((r) => r.events).map((r) => r.events),
        mutuals: mutuals || [],
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

  return { sb, session, userId, sendCode, verifyCode, signOut, myProfile, createProfile, uploadPhoto, saveMyBuild,
           feed, peopleForFeed, hydrate, myBuilds, startBuild, sendTurn, agree, loveAsIs, matchBack, counterAsIs, closeBuild, pass,
           watchBuilds, mediaUrls, trackItem };
})();
