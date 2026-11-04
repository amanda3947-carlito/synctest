/* sync — first run and profile editing.
   One flow, two entries: run() takes a new person from phone number to a profile that is
   up (number → code → name and birthday → photos → rotation → intro, then the optional
   steps: taste, orbit, going to, mutuals, cover); edit() opens the same steps from the
   avatar, one at a time, with Save. Everything is drawn in the profile's own language:
   white page, the sheet's type, surface cards, dashed add tiles, the stickers. */

window.SyncOnboard = (() => {
  const api = () => window.SyncAPI;
  let deps = null;   // { device, openSheet, focusSearch, notice, errText }
  let me = null;     // the profile row, once there is one

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const root = () => deps.device.querySelector('.device__auth');
  const panel = () => root().querySelector('.auth');
  const $ = (sel) => panel().querySelector(sel);
  const $$ = (sel) => [...panel().querySelectorAll(sel)];

  // the steps that count toward "up", in order; the progress strip shows these
  const TRACK = ['about', 'photos', 'rotation', 'intro', 'taste', 'orbit', 'events', 'mutuals', 'cover'];
  const REQUIRED = new Set(['about', 'photos', 'rotation', 'intro']);

  const COVERS = [
    { id: 'reeded', src: 'assets/cover-damon.png', name: 'Reeded' }, { id: 'holo', src: 'assets/cover-opt-1.jpg', name: 'Holo' },
    { id: 'grain', src: 'assets/cover-opt-2.jpg', name: 'Grain' }, { id: 'cyan', src: 'assets/cover-opt-3.jpg', name: 'Cyan' },
    { id: 'vinyl', src: 'assets/cover-opt-4.jpg', name: 'Vinyl' }, { id: 'iridescent', src: 'assets/cover-opt-5.jpg', name: 'Iridescent' },
    { id: 'reeded-warm', src: 'assets/cover-opt-6.jpg', name: 'Warm' }, { id: 'waveform', src: 'assets/cover-opt-7.jpg', name: 'Waveform' },
    { id: 'dusk', src: 'assets/cover-opt-8.jpg', name: 'Dusk' },
  ];
  const TASTE = {
    collector: { label: 'Collector', art: `<img class="ptile__art" src="assets/taste-collector.png" width="52" height="58" alt="" style="left:7px;top:0">` },
    nostalgic: { label: 'Nostalgic', art: `<img class="ptile__art" src="assets/taste-nostalgic.png" width="56" height="43" alt="" style="left:5px;top:7px">` },
    audiophile: { label: 'Audiophile', art: `<div class="ptile__crop" style="left:6.67px;top:2px;width:52px;height:51px"><img src="assets/disc-source.png" alt="" style="width:480.75%;height:486.46%;left:-46.01%;top:-42.76%"></div>` },
    throwback: { label: 'Throwback', art: `<div class="ptile__crop" style="left:7.5px;top:3px;width:51px;height:51px"><img src="assets/sticker-sheet-2.png" alt="" style="width:511.91%;height:286.36%;left:-105.03%;top:-22.66%"></div>` },
  };
  const KINDS = ['Bar', 'Restaurant', 'Café', 'Venue', 'Store', 'Park', 'Cinema', 'Gallery'];
  const HOODS = ['Bed-Stuy', 'Bushwick', 'Carroll Gardens', 'Clinton Hill', 'Cobble Hill', 'Crown Heights', 'DUMBO', 'Fort Greene', 'Gowanus', 'Greenpoint', 'Park Slope', 'Prospect Heights', 'Red Hook', 'Williamsburg', 'Elsewhere'];

  // ── the frame every step sits in: progress strip, title, body, one main button, an optional skip
  function frame(step, { title, sub, body, cta, skip, back, editing }) {
    const i = TRACK.indexOf(step);
    const strip = editing || i < 0 ? '' : `<div class="ob__strip" aria-hidden="true">${TRACK.map((s, k) => `<span class="ob__seg${k < i ? ' is-done' : k === i ? ' is-now' : ''}"></span>`).join('')}</div>`;
    const top = `<div class="ob__top">${back ? '<button class="ob__back" type="button" data-back aria-label="Back"><img src="assets/caret-left-dark.svg" width="24" height="24" alt=""></button>' : '<span></span>'}${strip}${skip ? `<button class="ob__skip" type="button" data-skip>${esc(skip)}</button>` : '<span></span>'}</div>`;
    panel().innerHTML = `${top}
      <div class="ob__head"><h2 class="ob__h">${esc(title)}</h2>${sub ? `<p class="ob__p">${sub}</p>` : ''}</div>
      <div class="ob__body">${body}</div>
      <p class="ob__err" aria-live="polite"></p>
      <div class="ob__foot"><button class="ob__cta" type="button" data-next>${esc(cta || 'Next')}</button></div>`;
    root().hidden = false;
    root().scrollTop = 0;
    const first = $('.ob__body input:not([type=file]):not([type=date]), .ob__body textarea');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }
  const err = (text) => { const el = $('.ob__err'); if (el) el.textContent = text || ''; };
  const busy = (on) => { const b = $('[data-next]'); if (b) { b.disabled = on; b.classList.toggle('is-busy', on); } };

  // runs a step: `submit` returns true to move on, false to stay (after showing an error).
  // Resolves 'next', 'skip' or 'back'.
  function step(fn) {
    return new Promise((resolve) => {
      const onClick = async (e) => {
        if (e.target.closest('[data-skip]')) { panel().removeEventListener('click', onClick); resolve('skip'); return; }
        if (e.target.closest('[data-back]')) { panel().removeEventListener('click', onClick); resolve('back'); return; }
        if (!e.target.closest('[data-next]')) return;
        busy(true);
        let ok = false;
        try { ok = await fn(); } catch (ex) { err(deps.errText(ex)); }
        busy(false);
        if (ok) { panel().removeEventListener('click', onClick); resolve('next'); }
      };
      panel().addEventListener('click', onClick);
      panel().addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); $('[data-next]').click(); } });
    });
  }

  // ── steps ───────────────────────────────────────────────────────────────

  async function stepPhone() {
    let phone = '';
    while (true) {
      frame('phone', { title: 'Your number', sub: 'We text you a code. That’s the whole sign-in.', cta: 'Text me a code',
        body: `<input class="ob__input" id="ob-phone" type="tel" inputmode="tel" placeholder="+1 555 000 0010" autocomplete="tel" value="${esc(phone)}">` });
      await step(async () => {
        phone = $('#ob-phone').value;
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) { err('That number looks short.'); return false; }
        const r = await api().sendCode(digits);
        if (r.error) { err(r.error.message); return false; }
        return true;
      });
      const digits = phone.replace(/\D/g, '');
      frame('code', { title: 'The code', sub: `Texted to +${esc(digits)}`, cta: 'Sign in', back: true,
        body: `<input class="ob__input ob__input--code" id="ob-code" type="text" inputmode="numeric" placeholder="123456" autocomplete="one-time-code" maxlength="6">` });
      const r = await step(async () => {
        const v = await api().verifyCode(digits, $('#ob-code').value.trim());
        if (v.error) { err(v.error.message); return false; }
        return true;
      });
      if (r === 'next') return;
    }
  }

  async function stepAbout(editing) {
    frame('about', { title: editing ? 'Your name' : 'You, briefly', sub: 'Just enough to put a name on your card.', cta: editing ? 'Save' : 'Next', editing,
      body: `<label class="ob__label" for="ob-name">First name</label><input class="ob__input" id="ob-name" type="text" autocomplete="given-name" maxlength="40" value="${esc(me && me.name)}">
             <label class="ob__label" for="ob-bday">Birthday</label><input class="ob__input" id="ob-bday" type="date" value="${esc(me && me.birthdate)}">
             <p class="ob__fine">Sync is 18 and up. Your birthday stays private; your card shows nothing but your name.</p>` });
    return step(async () => {
      const name = $('#ob-name').value.trim(), birthdate = $('#ob-bday').value;
      if (!name) { err('A first name, at least.'); return false; }
      if (!birthdate) { err('Your birthday, so we know you’re 18.'); return false; }
      try {
        me = me ? await api().updateProfile({ name, birthdate }) : await api().createProfile({ name, birthdate });
      } catch (e) { err(/birthdate/.test(deps.errText(e)) ? 'Sync is 18 and up.' : deps.errText(e)); return false; }
      return true;
    });
  }

  // photos: five slots in the Style bento (2 + 1 / 1 + 2); the first is the card
  async function stepPhotos(editing) {
    const existing = await api().myMedia();                 // [{id, kind, path, poster_path, position, url}]
    const slots = existing.slice(0, 5).map((m) => ({ saved: m }));
    const draw = () => {
      $('#ob-grid').innerHTML = [0, 1, 2, 3, 4].map((i) => {
        const s = slots[i];
        const cls = i === 0 || i === 3 ? 'span-2' : '';
        if (!s) return `<button class="ob__slot ob__slot--empty ${cls}" type="button" data-slot="${i}"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt="">${i === 0 ? '<span>Your card</span>' : ''}</button>`;
        const src = s.file ? s.preview : (s.saved.kind === 'video' ? (s.saved.posterUrl || s.saved.url) : s.saved.url);
        const isVideo = s.file ? s.file.type.startsWith('video') : s.saved.kind === 'video';
        return `<div class="ob__slot ${cls}" data-slot="${i}">${isVideo && s.file ? `<video src="${src}" muted playsinline></video>` : `<img src="${src}" alt="">`}${i === 0 ? '<span class="ob__slot-tag">Your card</span>' : ''}<button class="ob__slot-x" type="button" data-remove="${i}" aria-label="Remove"><img src="assets/x-16.svg" width="16" height="16" alt=""></button></div>`;
      }).join('');
    };
    frame('photos', { title: 'Photos', sub: 'One is enough to start; five tells the story. The first one is your card.', cta: editing ? 'Save' : 'Next', editing,
      body: `<div class="ob__grid" id="ob-grid"></div><input type="file" id="ob-file" accept="image/*,video/*" multiple hidden>` });
    draw();
    const file = $('#ob-file');
    let fillFrom = 0;
    panel().addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) { slots.splice(Number(rm.dataset.remove), 1); draw(); return; }
      const slot = e.target.closest('.ob__slot--empty');
      if (slot) { fillFrom = Number(slot.dataset.slot); file.click(); }
    });
    file.addEventListener('change', () => {
      for (const f of file.files) { if (slots.length >= 5) break; slots.push({ file: f, preview: URL.createObjectURL(f) }); }
      file.value = '';
      draw();
    });
    return step(async () => {
      if (!slots.length) { err('Pick at least one to go on.'); return false; }
      const keep = slots.filter((s) => s.saved).map((s) => s.saved.id);
      const removed = existing.filter((m) => !keep.includes(m.id));
      for (const m of removed) await api().removeMedia(m.id);
      let n = 0;
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.file) { n += 1; $('[data-next]').textContent = `Uploading ${n}…`; s.saved = await api().uploadMedia(s.file, i); }
        else if (s.saved.position !== i) await api().setMediaPosition(s.saved.id, i);
      }
      const first = slots[0].saved;
      if (first.kind === 'photo') me = await api().updateProfile({ avatar_path: first.path });
      return true;
    });
  }

  async function stepRotation(editing) {
    const current = await api().myBuild('mixtape');
    frame('rotation', { title: 'Your rotation', sub: 'Four or more tracks you’d put on for someone. People remix it to say hi.', cta: current ? 'Change it' : 'Pick tracks', editing,
      body: current ? `<div class="ob__tracks">${current.items.map((t) => `<div class="ob__track"><img src="${esc(t.art || 'assets/prof-rot-1.png')}" alt=""><div><p class="t-body-sm">${esc(t.artist)}</p><p class="t-sub">${esc(t.title)}</p></div></div>`).join('')}</div>` : `<div class="ob__tracks ob__tracks--empty">${'<div class="ob__track ob__track--ghost"><span></span><div><i></i><i></i></div></div>'.repeat(4)}</div>`,
      skip: current && !editing ? 'Keep it' : null });
    const r = await step(() => new Promise((res) => {
      root().hidden = true;
      const draft = { name: me.name, sheetItems: current ? current.items.map((t) => ({ ...t, added: false })) : [] };
      deps.openSheet(draft, () => { root().hidden = false; res(false); }, async (items) => {
        try { await api().saveMyBuild('mixtape', items.map(api().trackItem)); root().hidden = false; res(true); }
        catch (e) { root().hidden = false; err(deps.errText(e)); res(false); }
      }, { title: 'Your rotation', sub: 'Four or more tracks. Search to add.', sendLabel: 'Save', addLimit: Infinity, minItems: 4 });
      if (!current) setTimeout(deps.focusSearch, 400);
    }));
    return r;
  }

  // intro and lyric: typed into the quote card itself, so what you write is what they see
  function quoteStep(key, editing, { title, sub, placeholder, promptDefault, promptOptions, required }) {
    const quoteCol = key === 'intro' ? 'intro_quote' : 'lyric_quote', promptCol = key === 'intro' ? 'intro_prompt' : 'lyric_prompt';
    const cur = (me && me[quoteCol]) || '';
    const curPrompt = (me && me[promptCol]) || promptDefault;
    frame(key, { title, sub, cta: editing ? 'Save' : 'Next', editing, skip: required ? null : 'Skip for now',
      body: `<div class="pbento-wide ob__quote"><div class="pquote"><div class="pquote__text">
               <textarea class="t-quote ob__quote-in" id="ob-quote" rows="3" maxlength="140" placeholder="${esc(placeholder)}">${esc(cur)}</textarea>
               <div class="preply"><div class="preply__field"><span class="preply__ph" id="ob-prompt-ph">${esc(curPrompt)}</span></div></div>
             </div></div></div>
             <p class="ob__label">What they reply to</p>
             <div class="ob__chips">${promptOptions.map((p) => `<button class="ob__chip${p === curPrompt ? ' is-on' : ''}" type="button" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}</div>` });
    panel().addEventListener('click', (e) => {
      const c = e.target.closest('[data-prompt]'); if (!c) return;
      $$('[data-prompt]').forEach((b) => b.classList.toggle('is-on', b === c));
      $('#ob-prompt-ph').textContent = c.dataset.prompt;
    });
    return step(async () => {
      const q = $('#ob-quote').value.trim();
      if (required && q.length < 3) { err('A line, at least.'); return false; }
      const prompt = ($('[data-prompt].is-on') || {}).dataset ? $('[data-prompt].is-on').dataset.prompt : promptDefault;
      me = await api().updateProfile({ [quoteCol]: q || null, [promptCol]: prompt });
      return true;
    });
  }
  const stepIntro = (editing) => quoteStep('intro', editing, { title: 'Your line', sub: 'The first thing on your profile, in quotes. Make it yours.', placeholder: 'Jazz on vinyl. Rap in the kitchen.', promptDefault: 'Say something witty back', promptOptions: ['Say something witty back', 'Agree or disagree?', 'Your version?'], required: true });
  const stepLyric = (editing) => quoteStep('lyric', editing, { title: 'Lyrics to live by', sub: 'A line from a song. They guess the artist.', placeholder: 'This may be the night that my dreams might let me know…', promptDefault: 'Name the artist', promptOptions: ['Name the artist', 'Finish the line', 'What’s it from?'], required: false });

  async function stepTaste(editing) {
    const picked = new Set((me && me.taste) || []);
    frame('taste', { title: 'Taste', sub: 'Tap the ones that are you.', cta: editing ? 'Save' : 'Next', editing, skip: editing ? null : 'Skip for now',
      body: `<div class="ob__stickers">${Object.entries(TASTE).map(([k, t]) => `<button class="ptile ob__sticker${picked.has(k) ? ' is-on' : ''}" type="button" data-taste="${k}"><div class="ptile__box">${t.art}<span class="ptile__label">${esc(t.label)}</span></div></button>`).join('')}</div>` });
    panel().addEventListener('click', (e) => { const b = e.target.closest('[data-taste]'); if (!b) return; b.classList.toggle('is-on'); });
    return step(async () => {
      const taste = $$('[data-taste].is-on').map((b) => b.dataset.taste);
      me = await api().updateProfile({ taste });
      return true;
    });
  }

  // orbit: search the shared places table; what's missing you add, and it's there for the next person
  async function stepOrbit(editing) {
    const mine = await api().myPlaces();   // [{id,name,kind,neighborhood}]
    const chosen = [...mine];
    const drawChosen = () => { $('#ob-chosen').innerHTML = chosen.length ? chosen.map((p) => `<div class="prow ob__row"><div class="prow__details"><p class="t-sub">${esc(p.name)}</p><p class="t-body-sm">${esc(p.kind || 'Spot')} • ${esc(p.neighborhood || '')}</p></div><button class="ob__row-x" type="button" data-unpick="${p.id}" aria-label="Remove"><img src="assets/x-16.svg" width="16" height="16" alt=""></button></div>`).join('') : '<p class="ob__fine">Nothing yet. Search for a place you keep going back to.</p>'; };
    frame('orbit', { title: 'Your orbit', sub: 'Places you actually go. Someone with the same spot sees “you too”.', cta: editing ? 'Save' : 'Next', editing, skip: editing ? null : 'Skip for now',
      body: `<div class="sheet__search ob__search"><img class="sheet__glass" src="assets/magnifying-glass.svg" width="20" height="20" alt=""><input class="sheet__input" id="ob-q" type="text" placeholder="Search a bar, park, store…" autocomplete="off"></div>
             <div class="ob__results" id="ob-results"></div>
             <div class="ob__chosen" id="ob-chosen"></div>` });
    drawChosen();
    const q = $('#ob-q'); let timer = 0;
    const search = async () => {
      const text = q.value.trim();
      const box = $('#ob-results');
      if (!text) { box.innerHTML = ''; return; }
      const hits = (await api().searchPlaces(text)).filter((p) => !chosen.some((c) => c.id === p.id));
      box.innerHTML = hits.map((p) => `<button class="prow ob__row" type="button" data-pick="${p.id}"><div class="prow__details"><p class="t-sub">${esc(p.name)}</p><p class="t-body-sm">${esc(p.kind || 'Spot')} • ${esc(p.neighborhood || '')}</p></div><span class="pplus"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt=""></span></button>`).join('')
        + `<div class="ob__new"><p class="t-sub">Add “${esc(text)}”</p><div class="ob__new-row"><select id="ob-kind" class="ob__select">${KINDS.map((k) => `<option>${k}</option>`).join('')}</select><select id="ob-hood" class="ob__select">${HOODS.map((h) => `<option>${h}</option>`).join('')}</select><button class="ob__mini" type="button" data-add-place>Add</button></div></div>`;
      box._hits = hits;
    };
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 220); });
    panel().addEventListener('click', async (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) { const p = $('#ob-results')._hits.find((h) => h.id === pick.dataset.pick); if (p && chosen.length < 5) { chosen.push(p); drawChosen(); q.value = ''; $('#ob-results').innerHTML = ''; } return; }
      const un = e.target.closest('[data-unpick]');
      if (un) { const i = chosen.findIndex((c) => c.id === un.dataset.unpick); if (i >= 0) chosen.splice(i, 1); drawChosen(); return; }
      if (e.target.closest('[data-add-place]')) {
        try { const p = await api().addPlace({ name: q.value.trim(), kind: $('#ob-kind').value, neighborhood: $('#ob-hood').value }); if (chosen.length < 5) chosen.push(p); drawChosen(); q.value = ''; $('#ob-results').innerHTML = ''; }
        catch (ex) { err(deps.errText(ex)); }
      }
    });
    return step(async () => { await api().setMyPlaces(chosen.map((p) => p.id)); return true; });
  }

  async function stepEvents(editing) {
    const mine = await api().myEvents();
    const chosen = [...mine];
    const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const draw = () => { $('#ob-events').innerHTML = chosen.length ? chosen.map((ev) => `<div class="prow ob__row"><div class="ob__date"><span>${esc(fmt(ev.starts_at).split(' ')[1] || '')}</span><b>${esc(fmt(ev.starts_at).split(' ')[2] || '')}</b></div><div class="prow__details"><p class="t-sub">${esc(ev.title)}</p><p class="t-body-sm">${esc(ev.venue || '')}</p></div><button class="ob__row-x" type="button" data-unpick="${ev.id}" aria-label="Remove"><img src="assets/x-16.svg" width="16" height="16" alt=""></button></div>`).join('') : '<p class="ob__fine">Nothing on the calendar yet.</p>'; };
    frame('events', { title: 'Going to', sub: 'Shows, markets, screenings. Anything with a date.', cta: editing ? 'Save' : 'Next', editing, skip: editing ? null : 'Skip for now',
      body: `<div class="ob__chosen" id="ob-events"></div>
             <div class="ob__new ob__new--open"><input class="ob__input" id="ob-ev-title" type="text" placeholder="What" maxlength="80"><input class="ob__input" id="ob-ev-venue" type="text" placeholder="Where" maxlength="80"><div class="ob__new-row"><input class="ob__input" id="ob-ev-date" type="date"><button class="ob__mini" type="button" data-add-event>Add</button></div></div>` });
    draw();
    panel().addEventListener('click', async (e) => {
      const un = e.target.closest('[data-unpick]');
      if (un) { const i = chosen.findIndex((c) => c.id === un.dataset.unpick); if (i >= 0) chosen.splice(i, 1); draw(); return; }
      if (e.target.closest('[data-add-event]')) {
        const title = $('#ob-ev-title').value.trim(), venue = $('#ob-ev-venue').value.trim(), date = $('#ob-ev-date').value;
        if (!title || !date) { err('A what and a when, at least.'); return; }
        try { const ev = await api().addEvent({ title, venue, starts_at: new Date(date + 'T20:00:00').toISOString() }); chosen.push(ev); draw(); err(''); $('#ob-ev-title').value = ''; $('#ob-ev-venue').value = ''; $('#ob-ev-date').value = ''; }
        catch (ex) { err(deps.errText(ex)); }
      }
    });
    return step(async () => { await api().setMyEvents(chosen.map((ev) => ev.id)); return true; });
  }

  // mutuals: the phone's contacts, hashed here, so only hashes ever leave the device
  async function stepMutuals(editing) {
    const can = !!(navigator.contacts && navigator.contacts.select);
    const count = await api().myContactCount();
    frame('mutuals', { title: 'Mutuals', sub: 'Pick contacts to share. We keep a scrambled fingerprint of each number, never the number, and show you people you both know.', cta: can ? 'Choose contacts' : 'Next', editing, skip: editing ? null : 'Skip for now',
      body: `<div class="ob__mutuals">${count ? `<p class="t-sub">${count} contacts shared</p><p class="ob__fine">Choose again to replace them.</p>` : can ? '<p class="ob__fine">Your phone will ask which contacts to share. Pick as many as you like.</p>' : '<p class="ob__fine">Contact import isn’t available in this browser yet. It comes with the installed app. Skip for now.</p>'}</div>` });
    return step(async () => {
      if (!can) return true;
      let picked;
      try { picked = await navigator.contacts.select(['tel'], { multiple: true }); } catch (e) { err('Nothing chosen.'); return false; }
      const numbers = picked.flatMap((c) => c.tel || []).map(normalizePhone).filter(Boolean);
      const hashes = await Promise.all(numbers.map(sha256));
      await api().syncContacts(hashes);
      return true;
    });
  }
  const normalizePhone = (t) => { const d = String(t).replace(/\D/g, ''); if (d.length < 10) return null; return '+' + (d.length === 10 ? '1' + d : d); };
  const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

  async function stepCover(editing) {
    let pick = (me && me.cover) || 'reeded';
    frame('cover', { title: 'Your cover', sub: 'The header on your profile. Abstract and musical.', cta: editing ? 'Save' : 'Finish', editing,
      body: `<div class="ob__cover-preview"><img id="ob-cover-img" src="${COVERS.find((c) => c.id === pick).src}" alt=""><div class="pcover__grad"></div><img class="ob__cover-avatar" src="${esc((me && me.avatarUrl) || 'assets/avatar-damon.png')}" alt=""></div>
             <div class="ob__covers">${COVERS.map((c) => `<button class="tile ob__cover${c.id === pick ? ' is-on' : ''}" type="button" data-cover="${c.id}" aria-label="${esc(c.name)}"><img src="${c.src}" alt=""></button>`).join('')}</div>` });
    panel().addEventListener('click', (e) => { const b = e.target.closest('[data-cover]'); if (!b) return; pick = b.dataset.cover; $$('[data-cover]').forEach((x) => x.classList.toggle('is-on', x === b)); $('#ob-cover-img').src = COVERS.find((c) => c.id === pick).src; });
    return step(async () => { me = await api().updateProfile({ cover: pick }); return true; });
  }

  async function stepDone() {
    frame('done', { title: `You’re up, ${me.name}.`, sub: 'People see your card, your rotation and your line. Everything else you can add from your avatar, any time.', cta: 'See who’s around',
      body: `<div class="ob__done"><div class="pavatar ob__done-avatar"><img src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""></div><img class="pavatar-disc ob__done-disc" src="assets/disc.png" alt=""></div>` });
    await step(async () => true);
  }

  // ── entries ─────────────────────────────────────────────────────────────

  async function run() {
    const a = api();
    if (!(await a.session())) await stepPhone();
    me = await a.myProfile();
    if (me && me.avatar_path) { const u = await a.mediaUrls([me.avatar_path]); me.avatarUrl = u[me.avatar_path]; }
    const state = await a.myState();   // { photos, mixtape, intro } booleans
    const order = [
      ['about', !me, () => stepAbout(false)],
      ['photos', !state.photos, () => stepPhotos(false)],
      ['rotation', !state.mixtape, () => stepRotation(false)],
      ['intro', !state.intro, () => stepIntro(false)],
      ['taste', !me || !(me.taste || []).length, () => stepTaste(false)],
      ['orbit', !state.places, () => stepOrbit(false)],
      ['events', !state.events, () => stepEvents(false)],
      ['mutuals', !state.contacts, () => stepMutuals(false)],
      ['cover', !me || !me.onboarded, () => stepCover(false)],
    ];
    const todo = order.filter(([, need]) => need);
    if (!todo.length) { root().hidden = true; return me; }
    let i = 0;
    while (i < todo.length) {
      const [name, , fn] = todo[i];
      const r = await fn();
      if (r === 'back' && i > 0) { i -= 1; continue; }
      if (r === 'next' || r === 'skip' || r === true) { i += 1; continue; }
      if (r === false) continue;   // stayed (sheet cancelled): draw it again
      i += 1;
    }
    if (me && me.avatar_path && !me.avatarUrl) { const u = await a.mediaUrls([me.avatar_path]); me.avatarUrl = u[me.avatar_path]; }
    try { me = await a.updateProfile({ onboarded: true }); } catch (e) { /* column arrives with the next migration; harmless */ }
    await stepDone();
    root().hidden = true;
    return me;
  }

  // the editor: a list of sections, each opens its step with Save
  async function edit() {
    const a = api();
    me = await a.myProfile();
    const sections = [
      ['about', 'Name and birthday', () => stepAbout(true)], ['photos', 'Photos', () => stepPhotos(true)], ['rotation', 'Your rotation', () => stepRotation(true)],
      ['intro', 'Your line', () => stepIntro(true)], ['lyric', 'Lyrics to live by', () => stepLyric(true)], ['taste', 'Taste', () => stepTaste(true)],
      ['orbit', 'Your orbit', () => stepOrbit(true)], ['events', 'Going to', () => stepEvents(true)], ['mutuals', 'Mutuals', () => stepMutuals(true)], ['cover', 'Cover', () => stepCover(true)],
    ];
    while (true) {
      frame('account', { title: me ? me.name : 'You', sub: 'Everything on your profile, one piece at a time.', cta: 'Done', editing: true,
        body: `<div class="ob__menu">${sections.map(([k, label]) => `<button class="prow ob__row" type="button" data-section="${k}"><div class="prow__details"><p class="t-sub">${esc(label)}</p></div><img src="assets/caret-left-dark.svg" width="24" height="24" alt="" style="opacity:.45;transform:scaleX(-1)"></button>`).join('')}<button class="prow ob__row ob__row--quiet" type="button" data-signout><div class="prow__details"><p class="t-sub">Sign out</p></div></button></div>` });
      const choice = await new Promise((res) => {
        const h = (e) => {
          const s = e.target.closest('[data-section]'); if (s) { panel().removeEventListener('click', h); res(s.dataset.section); return; }
          if (e.target.closest('[data-signout]')) { panel().removeEventListener('click', h); res('signout'); return; }
          if (e.target.closest('[data-next]')) { panel().removeEventListener('click', h); res('done'); }
        };
        panel().addEventListener('click', h);
      });
      if (choice === 'done') break;
      if (choice === 'signout') { await a.signOut(); location.reload(); return; }
      const fn = sections.find(([k]) => k === choice)[2];
      await fn();
    }
    root().hidden = true;
    return me;
  }

  return { init(d) { deps = d; }, run, edit, get me() { return me; } };
})();
