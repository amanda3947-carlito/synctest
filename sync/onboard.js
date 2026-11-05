/* sync — first run, in three acts, and the profile editor.
   1. Essentials (1 of 6 … 6 of 6): name, number, birthday, photos, the basics, what describes you.
   2. The celebration: the core profile is complete; the stickers drift.
   3. Make it yours: search anything or upload anything, let it float in your orbit, drag it
      into Music, Vibes, Watching & Reading or Spots. Then the profile, for real, to keep editing.
   edit() opens the same pieces from the avatar. Drawn in the profile's own language. */

window.SyncOnboard = (() => {
  const api = () => window.SyncAPI;
  let deps = null;   // { device, openSheet, focusSearch, notice, errText, profileHTML }
  let me = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const root = () => deps.device.querySelector('.device__auth');
  const panel = () => root().querySelector('.auth');
  const $ = (sel) => panel().querySelector(sel);
  const $$ = (sel) => [...panel().querySelectorAll(sel)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const COVERS = [
    { id: 'reeded', src: 'assets/cover-damon.png' }, { id: 'holo', src: 'assets/cover-opt-1.jpg' }, { id: 'grain', src: 'assets/cover-opt-2.jpg' },
    { id: 'cyan', src: 'assets/cover-opt-3.jpg' }, { id: 'vinyl', src: 'assets/cover-opt-4.jpg' }, { id: 'iridescent', src: 'assets/cover-opt-5.jpg' },
    { id: 'reeded-warm', src: 'assets/cover-opt-6.jpg' }, { id: 'waveform', src: 'assets/cover-opt-7.jpg' }, { id: 'dusk', src: 'assets/cover-opt-8.jpg' },
  ];
  // "What best describes you": one sticker, shown beside the name on the card
  const DESCRIBES = [
    ['collector', 'Collector', 'assets/taste-collector.png'], ['nostalgic', 'Nostalgic', 'assets/taste-nostalgic.png'], ['audiophile', 'Audiophile', 'assets/stickers/headphones.png'],
    ['classics', 'Classics', 'assets/stickers/guitar.png'], ['live_shows', 'Live Shows', 'assets/stickers/ticket-sm.png'], ['all_around', 'All Around', 'assets/stickers/note.png'],
  ];
  // "Now for the basics"
  const BASICS = [
    ['occupation', 'Occupation', 'Ex: Designer at RG/A', 'briefcase'], ['education', 'Education', 'Ex: Undergrad', 'cap'], ['hometown', 'Hometown', 'Ex: London', 'house'],
    ['location', 'Current Location', 'Ex: Brooklyn', 'pin'], ['height', 'Height', 'Ex: 5′10', 'ruler'], ['activity', 'Activity', 'Ex: Active', 'barbell'],
    ['kids', 'Kids', 'Ex: Has kids', 'smiley'], ['smoking', 'Smoking', 'Ex: Never', 'smoke'],
  ];
  const ICONS = {
    briefcase: '<path d="M4 7h16v11H4z M9 7V5h6v2 M4 12h16"/>', cap: '<path d="M2 9l10-4 10 4-10 4z M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4"/>', house: '<path d="M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6"/>',
    pin: '<path d="M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', ruler: '<path d="M3 17L17 3l4 4L7 21z M7 13l2 2 M10 10l2 2 M13 7l2 2"/>',
    barbell: '<path d="M2 12h3 M19 12h3 M5 8v8 M8 6v12 M16 6v12 M19 8v8 M8 12h8"/>', smiley: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01 M15 10h.01 M8.5 14.5a4.5 4.5 0 007 0"/>', smoke: '<path d="M3 15h13v4H3z M19 15v4 M18 9c2 0 3 1 3 3 M15 7c2 0 3 1 3 3"/>',
  };
  const icon = (k) => `<svg class="ob__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ''}</svg>`;
  const KINDS = ['Bar', 'Restaurant', 'Café', 'Venue', 'Store', 'Park', 'Cinema', 'Gallery'];
  const HOODS = ['Bed-Stuy', 'Bushwick', 'Carroll Gardens', 'Clinton Hill', 'Cobble Hill', 'Crown Heights', 'DUMBO', 'Fort Greene', 'Gowanus', 'Greenpoint', 'Park Slope', 'Prospect Heights', 'Red Hook', 'Williamsburg', 'Elsewhere'];

  // ── the frame: title row with the "n of 6" pill, body, one pill button that goes mint when the step is ready
  // every frame gets a fresh panel element, so the last step's listeners go with it
  const freshPanel = (cls) => { const old = panel(); const el = document.createElement('section'); el.className = 'auth ' + (cls || ''); el.setAttribute('role', 'dialog'); old.replaceWith(el); return el; };
  function frame({ step, total, title, sub, body, cta, back, skip, ready, cls = '' }) {
    freshPanel(cls).innerHTML = `
      <div class="ob__head">
        ${back ? '<button class="ob__back" type="button" data-back aria-label="Back"><img src="assets/caret-left-dark.svg" width="24" height="24" alt=""></button>' : ''}
        <h2 class="ob__h">${esc(title)}</h2>
        ${step ? `<span class="ob__pill">${step} of ${total}</span>` : ''}${skip ? `<button class="ob__skip" type="button" data-skip>${esc(skip)}</button>` : ''}
      </div>
      ${sub ? `<p class="ob__p">${sub}</p>` : ''}
      <div class="ob__body">${body}</div>
      <p class="ob__err" aria-live="polite"></p>
      ${cta ? `<div class="ob__foot"><button class="ob__cta${ready ? ' is-ready' : ''}" type="button" data-next><span>${esc(cta)}</span><img src="assets/arrow-right.svg" width="15" height="15" alt="" class="ob__cta-arrow"></button></div>` : ''}`;
    root().hidden = false;
    root().scrollTop = 0;
    panel().scrollTop = 0;
    const first = $('.ob__body input:not([type=file]):not([type=date]), .ob__body textarea');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }
  const err = (t) => { const el = $('.ob__err'); if (el) el.textContent = t || ''; };
  const setReady = (on) => { const b = $('[data-next]'); if (b) b.classList.toggle('is-ready', !!on); };
  const busy = (on) => { const b = $('[data-next]'); if (b) { b.disabled = on; b.classList.toggle('is-busy', on); } };
  // a quiet toast at the bottom ("Photo added successfully")
  let toastTimer = 0;
  const toast = (text) => {
    let el = root().querySelector('.ob__toast');
    if (!el) { el = document.createElement('div'); el.className = 'ob__toast'; el.innerHTML = '<span class="ob__toast-check"></span><span></span>'; root().appendChild(el); }
    el.lastElementChild.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
  };
  // run a step: resolves 'next' | 'skip' | 'back'; `submit` returns true to go on
  function step(submit) {
    return new Promise((resolve) => {
      const onClick = async (e) => {
        if (e.target.closest('[data-skip]')) { panel().removeEventListener('click', onClick); resolve('skip'); return; }
        if (e.target.closest('[data-back]')) { panel().removeEventListener('click', onClick); resolve('back'); return; }
        if (!e.target.closest('[data-next]')) return;
        busy(true);
        let ok = false;
        try { ok = await submit(); } catch (ex) { err(deps.errText(ex)); }
        busy(false);
        if (ok) { panel().removeEventListener('click', onClick); resolve('next'); }
      };
      panel().addEventListener('click', onClick);
      panel().addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); const b = $('[data-next]'); if (b) b.click(); } });
    });
  }
  const liveReady = (check) => { const on = () => setReady(check()); panel().addEventListener('input', on); on(); };

  // ═══════════════ act one: essentials ═══════════════
  const draft = { name: '', last: '' };

  async function stepName(editing) {
    frame({ step: editing ? 0 : 1, total: 6, title: 'What’s your name?', cta: editing ? 'Save' : 'Next',
      body: `<input class="ob__input" id="ob-name" type="text" placeholder="First name" autocomplete="given-name" maxlength="40" value="${esc(me ? me.name : draft.name)}">
             <div><input class="ob__input" id="ob-last" type="text" placeholder="Last name" autocomplete="family-name" maxlength="60" value="${esc(me ? me.last_name || '' : draft.last)}"><p class="ob__cap">We’ll never use your last name on your profile</p></div>` });
    liveReady(() => $('#ob-name').value.trim().length > 0);
    return step(async () => {
      const name = $('#ob-name').value.trim(), last = $('#ob-last').value.trim();
      if (!name) { err('A first name, at least.'); return false; }
      if (me) { me = await api().updateProfile({ name, last_name: last || null }); }
      else { draft.name = name; draft.last = last; }
      return true;
    });
  }

  async function stepPhone() {
    let phone = '';
    while (true) {
      frame({ step: 2, total: 6, title: 'What’s your phone number?', cta: 'Next', back: true,
        body: `<div><input class="ob__input" id="ob-phone" type="tel" inputmode="tel" placeholder="+1" autocomplete="tel" value="${esc(phone)}"><p class="ob__cap">Your phone number will never be shared</p></div>` });
      liveReady(() => $('#ob-phone').value.replace(/\D/g, '').length >= 10);
      const r = await step(async () => {
        phone = $('#ob-phone').value;
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) { err('That number looks short.'); return false; }
        const res = await api().sendCode(digits);
        if (res.error) { err(res.error.message); return false; }
        return true;
      });
      if (r === 'back') return 'back';
      const digits = phone.replace(/\D/g, '');
      frame({ step: 2, total: 6, title: 'The code we texted', sub: `Sent to +${esc(digits)}`, cta: 'Next', back: true,
        body: `<input class="ob__input ob__input--code" id="ob-code" type="text" inputmode="numeric" placeholder="123456" autocomplete="one-time-code" maxlength="6">` });
      liveReady(() => $('#ob-code').value.trim().length === 6);
      const v = await step(async () => {
        const res = await api().verifyCode(digits, $('#ob-code').value.trim());
        if (res.error) { err(res.error.message); return false; }
        return true;
      });
      if (v === 'next') return 'next';
    }
  }

  async function stepBirthday(editing) {
    frame({ step: editing ? 0 : 3, total: 6, title: 'What’s your birthday?', cta: editing ? 'Save' : 'Next', back: !editing,
      body: `<div><input class="ob__input" id="ob-bday" type="date" value="${esc(me ? me.birthdate : '')}"><p class="ob__cap">This information is used only for helping you find the right people</p></div>` });
    liveReady(() => !!$('#ob-bday').value);
    return step(async () => {
      const birthdate = $('#ob-bday').value;
      if (!birthdate) { err('Your birthday, so we know you’re 18.'); return false; }
      try {
        me = me ? await api().updateProfile({ birthdate }) : await api().createProfile({ name: draft.name, last_name: draft.last || null, birthdate });
      } catch (e) { err(/birthdate/.test(deps.errText(e)) ? 'Sync is 18 and up.' : deps.errText(e)); return false; }
      return true;
    });
  }

  // photos: four slots, 2 × 2; the first is the profile photo; the fourth asks for a video
  async function stepPhotos(editing) {
    const existing = await api().myMedia();
    const slots = existing.slice(0, 4).map((m) => ({ saved: m }));
    const LABELS = ['Photo 1', 'Photo 2', 'Photo 3', 'Video'];
    const draw = () => {
      $('#ob-grid').innerHTML = [0, 1, 2, 3].map((i) => {
        const s = slots[i];
        if (!s) return `<button class="ob__slot ob__slot--empty" type="button" data-slot="${i}"><img src="assets/plus-circle-dark.svg" width="20" height="20" alt=""><span>${LABELS[i]}</span></button>`;
        const isVideo = s.file ? s.file.type.startsWith('video') : s.saved.kind === 'video';
        const src = s.file ? s.preview : (isVideo ? (s.saved.posterUrl || s.saved.url) : s.saved.url);
        return `<div class="ob__slot" data-slot="${i}" draggable="false">${isVideo && s.file ? `<video src="${src}" muted playsinline></video>` : `<img src="${src}" alt="" draggable="false">`}<span class="ob__slot-grip"><img src="assets/drag-handle.svg" width="12" height="6" alt=""></span><button class="ob__slot-x" type="button" data-remove="${i}" aria-label="Remove"><img src="assets/x-16.svg" width="14" height="14" alt=""></button></div>`;
      }).join('');
      setReady(slots.length > 0);
    };
    frame({ step: editing ? 0 : 4, total: 6, title: 'Let’s add some photos', cta: editing ? 'Save' : 'Next',
      body: `<p class="ob__cap ob__cap--lead">Drag to reorder. The first photo will be your profile photo</p>
             <div class="ob__grid" id="ob-grid"></div>
             <p class="ob__cap">Add up to 4 videos and photos. At least 1 of these has to be a video. This helps us with verification.</p>
             <input type="file" id="ob-file" accept="image/*,video/*" multiple hidden>` });
    draw();
    const file = $('#ob-file');
    panel().addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) { slots.splice(Number(rm.dataset.remove), 1); draw(); return; }
      if (e.target.closest('.ob__slot--empty')) file.click();
    });
    file.addEventListener('change', () => {
      let n = 0;
      for (const f of file.files) { if (slots.length >= 4) break; slots.push({ file: f, preview: URL.createObjectURL(f) }); n += 1; }
      file.value = '';
      draw();
      if (n) toast(n === 1 ? (slots[slots.length - 1].file.type.startsWith('video') ? 'Video added successfully' : 'Photo added successfully') : `${n} added`);
    });
    // reorder: press and drag a filled slot over another
    let drag = null;
    panel().addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.ob__slot:not(.ob__slot--empty)');
      if (!el || e.target.closest('[data-remove]')) return;
      drag = { from: Number(el.dataset.slot), el, moved: false, x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    });
    panel().addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      drag.el.classList.add('is-lifted');
      drag.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      $$('.ob__slot').forEach((s) => { const r = s.getBoundingClientRect(); s.classList.toggle('is-over', s !== drag.el && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom); });
    });
    const endDrag = (e) => {
      if (!drag) return;
      const over = $('.ob__slot.is-over');
      const d = drag; drag = null;
      d.el.classList.remove('is-lifted'); d.el.style.transform = '';
      $$('.ob__slot').forEach((s) => s.classList.remove('is-over'));
      if (!d.moved || !over) return;
      const to = Number(over.dataset.slot);
      if (to >= slots.length) { slots.push(slots.splice(d.from, 1)[0]); } else { const [m] = slots.splice(d.from, 1); slots.splice(to, 0, m); }
      draw();
    };
    panel().addEventListener('pointerup', endDrag);
    panel().addEventListener('pointercancel', endDrag);
    return step(async () => {
      if (!slots.length) { err('Pick at least one to go on.'); return false; }
      const keep = slots.filter((s) => s.saved).map((s) => s.saved.id);
      for (const m of existing.filter((x) => !keep.includes(x.id))) await api().removeMedia(m.id);
      let n = 0;
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.file) { n += 1; $('[data-next] span').textContent = `Uploading ${n}…`; s.saved = await api().uploadMedia(s.file, i); }
        else if (s.saved.position !== i) await api().setMediaPosition(s.saved.id, i);
      }
      const first = slots[0].saved;
      if (first.kind === 'photo') me = await api().updateProfile({ avatar_path: first.path });
      return true;
    });
  }

  // the basics: an accordion; each row opens a field
  async function stepBasics(editing) {
    const d = { ...((me && me.details) || {}) };
    frame({ step: editing ? 0 : 5, total: 6, title: 'Now for the basics', cta: editing ? 'Save' : 'Next',
      body: `<div class="ob__acc">${BASICS.map(([k, label, ph]) => `
        <div class="ob__acc-item${d[k] ? ' has-value' : ''}" data-key="${k}">
          <button class="ob__acc-row" type="button" data-toggle="${k}" aria-expanded="false">${icon(BASICS.find((b) => b[0] === k)[3])}<span class="ob__acc-label">${esc(label)}</span><span class="ob__acc-val">${esc(d[k] || '')}</span><img class="ob__acc-chev" src="assets/caret-left-dark.svg" width="20" height="20" alt=""></button>
          <div class="ob__acc-body" hidden><input class="ob__input" type="text" data-field="${k}" placeholder="${esc(ph)}" maxlength="60" value="${esc(d[k] || '')}"></div>
        </div>`).join('')}</div>` });
    setReady(true);
    panel().addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle]'); if (!t) return;
      const item = t.closest('.ob__acc-item'); const open = !item.classList.contains('is-open');
      $$('.ob__acc-item').forEach((x) => { x.classList.remove('is-open'); x.querySelector('.ob__acc-body').hidden = true; x.querySelector('[data-toggle]').setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); item.querySelector('.ob__acc-body').hidden = false; t.setAttribute('aria-expanded', 'true'); setTimeout(() => item.querySelector('input').focus({ preventScroll: true }), 40); }
    });
    panel().addEventListener('input', (e) => { const f = e.target.closest('[data-field]'); if (!f) return; const item = f.closest('.ob__acc-item'); item.querySelector('.ob__acc-val').textContent = f.value.trim(); item.classList.toggle('has-value', !!f.value.trim()); });
    return step(async () => {
      const details = {};
      $$('[data-field]').forEach((f) => { const v = f.value.trim(); if (v) details[f.dataset.field] = v; });
      me = await api().updateProfile({ details });
      return true;
    });
  }

  async function stepDescribes(editing) {
    let pick = (me && me.taste && me.taste[0]) || null;
    frame({ step: editing ? 0 : 6, total: 6, title: 'What best describes you?', cta: editing ? 'Save' : 'Next', ready: !!pick,
      body: `<div class="ob__describe">${DESCRIBES.map(([k, label, src]) => `<button class="ob__dtile${k === pick ? ' is-on' : ''}" type="button" data-pick="${k}"><img src="${src}" alt="" draggable="false"><span>${esc(label)}</span></button>`).join('')}</div>
             <p class="ob__cap">This appears along with your profile avatar</p>` });
    panel().addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; pick = b.dataset.pick; $$('[data-pick]').forEach((x) => x.classList.toggle('is-on', x === b)); setReady(true); });
    return step(async () => {
      if (!pick) { err('Pick one.'); return false; }
      me = await api().updateProfile({ taste: [pick] });
      return true;
    });
  }

  // ═══════════════ act two: the celebration ═══════════════
  async function stepCelebration() {
    frame({ cls: 'auth--sky', cta: 'Get plugged in', title: '', body: `
      <div class="sky" aria-hidden="true">
        <span class="sky__cloud sky__cloud--a"></span><span class="sky__cloud sky__cloud--b"></span><span class="sky__cloud sky__cloud--c"></span><span class="sky__cloud sky__cloud--d"></span>
        <img class="sky__sticker sky__sticker--heart" src="assets/stickers/heart.png" alt="">
        <img class="sky__sticker sky__sticker--pizza" src="assets/stickers/pizza.png" alt="">
        <img class="sky__sticker sky__sticker--phones" src="assets/stickers/headphones.png" alt="">
        <img class="sky__sticker sky__sticker--ticket" src="assets/stickers/ticket.png" alt="">
      </div>
      <div class="sky__me"><img src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""><img class="sky__me-disc" src="${esc(stickerFor(me))}" alt=""></div>
      <div class="sky__copy"><h2 class="sky__h">Your core profile is complete!</h2><p class="sky__p">Now it’s time to layer on the fun stuff</p></div>` });
    setReady(true);
    await step(async () => true);
  }
  const stickerFor = (p) => { const k = p && p.taste && p.taste[0]; const d = DESCRIBES.find((x) => x[0] === k); return d ? d[2] : 'assets/disc.png'; };

  // ═══════════════ act three: make it yours ═══════════════
  const FOLDERS = [
    { id: 'music', label: 'Music', min: 4, accepts: ['track'], hint: 'tracks' },
    { id: 'vibes', label: 'Vibes', min: 2, accepts: ['photo'], hint: 'photos' },
    { id: 'shelf', label: 'Watching & Reading', min: 1, accepts: ['film', 'show', 'book'], hint: 'titles' },
    { id: 'spots', label: 'Spots', min: 2, accepts: ['place'], hint: 'places' },
  ];
  const KIND_WORD = { track: 'a track', photo: 'a photo', film: 'a film', show: 'a show', book: 'a book', place: 'a place' };
  const ORBIT_MAX = 10;

  async function stepBoard(editing) {
    const existing = {
      music: ((await api().myBuild('mixtape')) || { items: [] }).items.map((t) => ({ kind: 'track', key: t.key, title: t.title, meta: t.artist, art: t.art, saved: true })),
      shelf: (await api().myShelf()).map((s) => ({ kind: s.kind, key: s.key, title: s.title, meta: s.meta, art: s.art, saved: true })),
      spots: (await api().myPlaces()).map((p) => ({ kind: 'place', key: 'place:' + p.id, id: p.id, title: p.name, meta: [p.kind, p.neighborhood].filter(Boolean).join(' • '), art: null, saved: true })),
      vibes: (me.style_paths || []).map((p, i) => ({ kind: 'photo', key: 'style:' + i, path: p, title: 'Photo', art: null, saved: true })),
    };
    if (existing.vibes.length) { const u = await api().mediaUrls(existing.vibes.map((v) => v.path)); existing.vibes.forEach((v) => { v.art = u[v.path]; }); }
    const folders = {}; FOLDERS.forEach((f) => { folders[f.id] = [...existing[f.id]]; });
    const orbit = [];   // floating tiles: { item, el, a, r, w, bob, size, rot, dragging }

    frame({ cls: 'auth--board', title: 'Make it yours', cta: editing ? 'Save' : 'See your profile',
      body: `
      <div class="board__search">
        <div class="board__field"><img src="assets/magnifying-glass.svg" width="20" height="20" alt=""><input id="bd-q" type="text" placeholder="Search anything" autocomplete="off" autocorrect="off" spellcheck="false"><button class="board__upload" type="button" data-upload aria-label="Upload a photo"><img src="assets/icon-image.svg" width="22" height="22" alt=""></button></div>
        <p class="ob__cap board__cap">Search to add items to your orbit, then drag them down to each section</p>
        <div class="board__results" id="bd-results" hidden></div>
        <input type="file" id="bd-file" accept="image/*" multiple hidden>
      </div>
      <div class="board__stage" id="bd-stage"><p class="board__empty" id="bd-empty">Your orbit is empty. Search a song, a film, a place… or upload a photo.</p></div>
      <div class="board__folders">${FOLDERS.map((f) => `<div class="folder" data-folder="${f.id}"><div class="folder__stack" id="fs-${f.id}"></div><p class="folder__title">${esc(f.label)}</p><p class="folder__count" id="fc-${f.id}"></p></div>`).join('')}</div>` });
    panel().querySelector('.ob__head').insertAdjacentHTML('afterbegin', `<span class="board__me"><img src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""><img class="board__me-disc" src="${esc(stickerFor(me))}" alt=""></span>`);
    panel().querySelector('.ob__head').insertAdjacentHTML('beforeend', '<span class="ob__pill">fun stuff</span>');
    setReady(true);

    const stage = $('#bd-stage');
    const tileHTML = (it) => it.art ? `<img src="${esc(it.art)}" alt="" draggable="false">` : `<span class="tile__type">${esc(it.title)}</span>`;
    const drawFolders = () => {
      FOLDERS.forEach((f) => {
        const list = folders[f.id];
        $(`#fs-${f.id}`).innerHTML = list.slice(-3).map((it, i) => `<span class="folder__mini" style="--i:${i}">${tileHTML(it)}</span>`).join('');
        const left = Math.max(0, f.min - list.length);
        $(`#fc-${f.id}`).textContent = left ? `${left} remaining` : `${list.length} added`;
        $(`[data-folder="${f.id}"]`).classList.toggle('is-met', !left);
      });
    };
    drawFolders();

    // ── the orbit: each tile circles the centre on its own radius and pace, bobbing a little
    let raf = 0; const t0 = performance.now();
    const place = (o, t) => {
      const cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
      const a = o.a + (t - t0) / 1000 * o.w;
      const x = cx + Math.cos(a) * o.r - o.size / 2, y = cy + Math.sin(a) * o.r * 0.72 + Math.sin((t - t0) / 1000 * 0.9 + o.bob) * 6 - o.size / 2;
      o.el.style.transform = `translate(${x}px, ${y}px) rotate(${o.rot + Math.sin((t - t0) / 1000 * 0.5 + o.bob) * 3}deg)`;
      o.el.style.zIndex = String(100 + Math.round(Math.sin(a) * 10));
    };
    const tick = (t) => { orbit.forEach((o) => { if (!o.dragging) place(o, t); }); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stopOrbit = () => cancelAnimationFrame(raf);

    const addToOrbit = (item) => {
      if (orbit.length >= ORBIT_MAX) { deps.notice('Your orbit is full. Drag a few into their sections first.'); stage.classList.add('is-full'); setTimeout(() => stage.classList.remove('is-full'), 500); return false; }
      const el = document.createElement('div');
      el.className = 'tile tile--' + item.kind;
      el.innerHTML = tileHTML(item) + `<span class="tile__tag">${esc({ track: 'Track', photo: 'Photo', film: 'Film', show: 'Show', book: 'Book', place: 'Spot' }[item.kind])}</span>`;
      const size = item.kind === 'place' || item.kind === 'photo' ? 118 : 104;
      el.style.width = el.style.height = size + 'px';
      const n = orbit.length;   // spread the newcomers around the ring, alternating inner and outer lanes
      const o = { item, el, a: n * 2.4 + Math.random() * 0.6, r: (n % 2 ? 58 : 108) + Math.random() * 18, w: (0.1 + Math.random() * 0.08) * (n % 2 ? -1 : 1), bob: Math.random() * 6, size, rot: -8 + Math.random() * 16 };
      orbit.push(o);
      stage.appendChild(el);
      $('#bd-empty').hidden = true;
      el.animate([{ transform: 'translate(50%, -40px) scale(0.3)', opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: el.style.transform || 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      attachDrag(o);
      return true;
    };
    const removeFromOrbit = (o) => { orbit.splice(orbit.indexOf(o), 1); o.el.remove(); $('#bd-empty').hidden = orbit.length > 0; };

    // ── drag a tile off its orbit into a folder; let go anywhere else and it drifts back
    function attachDrag(o) {
      let start = null;
      o.el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        o.el.setPointerCapture(e.pointerId);
        const r = o.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
        start = { x: e.clientX, y: e.clientY, ox: r.left - s.left, oy: r.top - s.top, id: e.pointerId };
        o.dragging = true;
        o.el.classList.add('is-held');
        o.el.style.zIndex = '500';
      });
      o.el.addEventListener('pointermove', (e) => {
        if (!start || e.pointerId !== start.id) return;
        const x = start.ox + e.clientX - start.x, y = start.oy + e.clientY - start.y;
        o.el.style.transform = `translate(${x}px, ${y}px) rotate(${o.rot}deg) scale(1.06)`;
        $$('.folder').forEach((f) => { const fr = f.getBoundingClientRect(); const over = e.clientX > fr.left && e.clientX < fr.right && e.clientY > fr.top && e.clientY < fr.bottom; f.classList.toggle('is-over', over); f.classList.toggle('is-wrong', over && !FOLDERS.find((x) => x.id === f.dataset.folder).accepts.includes(o.item.kind)); });
      });
      const end = async (e) => {
        if (!start || e.pointerId !== start.id) return;
        start = null;
        const target = $('.folder.is-over');
        $$('.folder').forEach((f) => f.classList.remove('is-over', 'is-wrong'));
        o.el.classList.remove('is-held');
        if (target && e.type !== 'pointercancel') {
          const f = FOLDERS.find((x) => x.id === target.dataset.folder);
          if (!f.accepts.includes(o.item.kind)) {
            deps.notice(`That’s ${KIND_WORD[o.item.kind]}. Try ${FOLDERS.find((x) => x.accepts.includes(o.item.kind)).label}.`);
            target.classList.add('is-shake'); setTimeout(() => target.classList.remove('is-shake'), 500);
          } else {
            // it drops in: shrinks toward the folder's stack and lands there
            const fr = target.querySelector('.folder__stack').getBoundingClientRect(), s = stage.getBoundingClientRect();
            const tx = fr.left + fr.width / 2 - s.left - o.size / 2, ty = fr.top + fr.height / 2 - s.top - o.size / 2;
            o.dragging = true;
            await o.el.animate([{ transform: o.el.style.transform }, { transform: `translate(${tx}px, ${ty}px) rotate(0deg) scale(0.55)`, opacity: 0.6 }], { duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.15, 1)', fill: 'forwards' }).finished;
            folders[f.id].push(o.item);
            removeFromOrbit(o);
            drawFolders();
            target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' });
            return;
          }
        }
        // back to the orbit, from wherever it was let go
        const r = o.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
        const dx = r.left - s.left + o.size / 2 - stage.clientWidth / 2, dy = (r.top - s.top + o.size / 2 - stage.clientHeight / 2) / 0.72;
        o.r = Math.min(150, Math.max(50, Math.hypot(dx, dy)));
        o.a = Math.atan2(dy, dx) - (performance.now() - t0) / 1000 * o.w;
        o.dragging = false;
      };
      o.el.addEventListener('pointerup', end);
      o.el.addEventListener('pointercancel', end);
    }

    // ── search anything: tracks, films, shows, books and places at once; or upload
    const q = $('#bd-q'), results = $('#bd-results'); let timer = 0, seq = 0;
    const search = async () => {
      const text = q.value.trim(); const my = ++seq;
      if (!text) { results.hidden = true; results.innerHTML = ''; return; }
      results.hidden = false; results.innerHTML = '<p class="board__hint">Looking…</p>';
      let hits = [];
      try { hits = await api().searchAll(text); } catch (e) { hits = []; }
      if (my !== seq) return;
      const inOrbit = new Set(orbit.map((o) => o.item.key)); const filed = new Set(Object.values(folders).flat().map((i) => i.key));
      hits = hits.filter((h) => !inOrbit.has(h.key) && !filed.has(h.key));
      results._hits = hits;
      results.innerHTML = hits.length ? hits.map((h, i) => `<button class="board__hit" type="button" data-hit="${i}"><span class="board__thumb board__thumb--${h.kind}">${h.art ? `<img src="${esc(h.art)}" alt="">` : `<i>${esc(h.title.slice(0, 1))}</i>`}</span><span class="board__hit-text"><b>${esc(h.title)}</b><small>${esc(h.meta || '')}</small></span><span class="board__hit-kind">${esc({ track: 'Track', film: 'Film', show: 'Show', book: 'Book', place: 'Spot' }[h.kind])}</span></button>`).join('') : '<p class="board__hint">Nothing matched that. Try the name of a song, a film, a book or a place.</p>';
    };
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 260); });
    q.addEventListener('focus', () => { if (q.value.trim()) results.hidden = false; });
    panel().addEventListener('click', (e) => {
      const hit = e.target.closest('[data-hit]');
      if (hit) { const h = results._hits[Number(hit.dataset.hit)]; if (h && addToOrbit(h)) { hit.remove(); results.hidden = true; if (!results.querySelector('[data-hit]')) q.value = ''; } return; }
      if (e.target.closest('[data-upload]')) { $('#bd-file').click(); return; }
      if (!e.target.closest('.board__search')) results.hidden = true;
    });
    $('#bd-file').addEventListener('change', () => {
      for (const f of $('#bd-file').files) { if (!addToOrbit({ kind: 'photo', key: 'upload:' + f.name + ':' + f.size, title: f.name.replace(/\.[^.]+$/, ''), art: URL.createObjectURL(f), file: f })) break; }
      $('#bd-file').value = '';
    });

    // ── save: each folder goes where it lives on the profile
    const r = await step(async () => {
      if (orbit.length) { err(`${orbit.length} still floating. Drag them into a section, or drop them in the bin by leaving them.`); }
      const b = $('[data-next] span');
      const music = folders.music;
      if (music.length >= 4) { b.textContent = 'Saving your rotation…'; await api().saveMyBuild('mixtape', music.map((t) => api().trackItem({ key: t.key, artist: t.meta, title: t.title, art: t.art }))); }
      else if (music.some((t) => !t.saved)) deps.notice(`Your rotation goes up at 4 tracks. You have ${music.length}; add the rest from your avatar any time.`);
      b.textContent = 'Saving your shelf…';
      await api().setMyShelf(folders.shelf.map((s) => ({ kind: s.kind, key: s.key, title: s.title, meta: s.meta, art: s.art })));
      b.textContent = 'Saving your spots…';
      await api().setMyPlaces(folders.spots.map((p) => p.id));
      const newVibes = folders.vibes.filter((v) => v.file);
      const paths = folders.vibes.filter((v) => v.saved).map((v) => v.path);
      for (let i = 0; i < newVibes.length; i++) { b.textContent = `Uploading vibe ${i + 1} of ${newVibes.length}…`; paths.push(await api().uploadStyle(newVibes[i].file)); }
      me = await api().updateProfile({ style_paths: paths });
      return true;
    });
    stopOrbit();
    return r;
  }

  // the profile, for real: your own page as others see it, with a way back to the board
  async function stepRealView() {
    const prof = await api().myProfile();
    const person = await api().hydrate(prof, prof.id);
    freshPanel('auth--real').innerHTML = `<aside class="profile ob__real">${deps.profileHTML(person)}</aside>
      <div class="ob__realbar"><button class="ob__cta ob__cta--quiet" type="button" data-board>Make it yours</button><button class="ob__cta is-ready" type="button" data-next><span>Looks good</span><img src="assets/arrow-right.svg" width="15" height="15" alt="" class="ob__cta-arrow"></button></div>`;
    root().hidden = false;
    const real = panel().querySelector('.ob__real');
    real.querySelector('.pcta').innerHTML = '<p class="ob__cap" style="text-align:center">This is your profile as people see it. Everything on it can change from your avatar, any time.</p>';
    real.querySelectorAll('.pnav__btn, .preply__field, [data-action], .pplay').forEach((b) => { b.disabled = true; b.style.pointerEvents = 'none'; });
    return new Promise((res) => {
      panel().addEventListener('click', (e) => { if (e.target.closest('[data-board]')) res('board'); else if (e.target.closest('[data-next]')) res('next'); });
    });
  }

  // ═══════════════ the rest of the editor's pieces (kept from the first pass) ═══════════════
  async function stepRotation() {
    const current = await api().myBuild('mixtape');
    frame({ title: 'Your rotation', sub: 'Four or more tracks you’d put on for someone. People remix it to say hi.', cta: current ? 'Change it' : 'Pick tracks', back: true,
      body: current ? `<div class="ob__tracks">${current.items.map((t) => `<div class="ob__track"><img src="${esc(t.art || 'assets/prof-rot-1.png')}" alt=""><div><p class="t-body-sm">${esc(t.artist)}</p><p class="t-sub">${esc(t.title)}</p></div></div>`).join('')}</div>` : '<p class="ob__cap">Nothing yet.</p>' });
    setReady(true);
    return step(() => new Promise((res) => {
      root().hidden = true;
      const draft = { name: me.name, sheetItems: current ? current.items.map((t) => ({ ...t, added: false })) : [] };
      deps.openSheet(draft, () => { root().hidden = false; res(false); }, async (items) => {
        try { await api().saveMyBuild('mixtape', items.map(api().trackItem)); root().hidden = false; res(true); }
        catch (e) { root().hidden = false; err(deps.errText(e)); res(false); }
      }, { title: 'Your rotation', sub: 'Four or more tracks. Search to add.', sendLabel: 'Save', addLimit: Infinity, minItems: 4 });
      if (!current) setTimeout(deps.focusSearch, 400);
    }));
  }
  function quoteStep(key, { title, sub, placeholder, promptDefault, promptOptions }) {
    const quoteCol = key === 'intro' ? 'intro_quote' : 'lyric_quote', promptCol = key === 'intro' ? 'intro_prompt' : 'lyric_prompt';
    const cur = (me && me[quoteCol]) || '', curPrompt = (me && me[promptCol]) || promptDefault;
    frame({ title, sub, cta: 'Save', back: true,
      body: `<div class="pbento-wide ob__quote"><div class="pquote"><div class="pquote__text"><textarea class="t-quote ob__quote-in" id="ob-quote" rows="3" maxlength="140" placeholder="${esc(placeholder)}">${esc(cur)}</textarea><div class="preply"><div class="preply__field"><span class="preply__ph" id="ob-prompt-ph">${esc(curPrompt)}</span></div></div></div></div></div>
             <p class="ob__label">What they reply to</p><div class="ob__chips">${promptOptions.map((p) => `<button class="ob__chip${p === curPrompt ? ' is-on' : ''}" type="button" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}</div>` });
    setReady(true);
    panel().addEventListener('click', (e) => { const c = e.target.closest('[data-prompt]'); if (!c) return; $$('[data-prompt]').forEach((b) => b.classList.toggle('is-on', b === c)); $('#ob-prompt-ph').textContent = c.dataset.prompt; });
    return step(async () => { const qv = $('#ob-quote').value.trim(); const on = $('[data-prompt].is-on'); me = await api().updateProfile({ [quoteCol]: qv || null, [promptCol]: on ? on.dataset.prompt : promptDefault }); return true; });
  }
  const stepIntro = () => quoteStep('intro', { title: 'Your line', sub: 'The first thing on your profile, in quotes.', placeholder: 'Jazz on vinyl. Rap in the kitchen.', promptDefault: 'Say something witty back', promptOptions: ['Say something witty back', 'Agree or disagree?', 'Your version?'] });
  const stepLyric = () => quoteStep('lyric', { title: 'Lyrics to live by', sub: 'A line from a song. They guess the artist.', placeholder: 'This may be the night that my dreams might let me know…', promptDefault: 'Name the artist', promptOptions: ['Name the artist', 'Finish the line', 'What’s it from?'] });
  async function stepEvents() {
    const chosen = [...(await api().myEvents())];
    const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const draw = () => { $('#ob-events').innerHTML = chosen.length ? chosen.map((ev) => `<div class="prow ob__row"><div class="ob__date"><span>${esc(fmt(ev.starts_at).split(' ')[1] || '')}</span><b>${esc(fmt(ev.starts_at).split(' ')[2] || '')}</b></div><div class="prow__details"><p class="t-sub">${esc(ev.title)}</p><p class="t-body-sm">${esc(ev.venue || '')}</p></div><button class="ob__row-x" type="button" data-unpick="${ev.id}" aria-label="Remove"><img src="assets/x-16.svg" width="16" height="16" alt=""></button></div>`).join('') : '<p class="ob__cap">Nothing on the calendar yet.</p>'; };
    frame({ title: 'Going to', sub: 'Shows, markets, screenings. Anything with a date.', cta: 'Save', back: true,
      body: `<div class="ob__chosen" id="ob-events"></div><div class="ob__new ob__new--open"><input class="ob__input" id="ob-ev-title" type="text" placeholder="What" maxlength="80"><input class="ob__input" id="ob-ev-venue" type="text" placeholder="Where" maxlength="80"><div class="ob__new-row"><input class="ob__input" id="ob-ev-date" type="date"><button class="ob__mini" type="button" data-add-event>Add</button></div></div>` });
    setReady(true); draw();
    panel().addEventListener('click', async (e) => {
      const un = e.target.closest('[data-unpick]'); if (un) { const i = chosen.findIndex((c) => c.id === un.dataset.unpick); if (i >= 0) chosen.splice(i, 1); draw(); return; }
      if (e.target.closest('[data-add-event]')) {
        const title = $('#ob-ev-title').value.trim(), venue = $('#ob-ev-venue').value.trim(), date = $('#ob-ev-date').value;
        if (!title || !date) { err('A what and a when, at least.'); return; }
        try { chosen.push(await api().addEvent({ title, venue, starts_at: new Date(date + 'T20:00:00').toISOString() })); draw(); err(''); $('#ob-ev-title').value = ''; $('#ob-ev-venue').value = ''; $('#ob-ev-date').value = ''; } catch (ex) { err(deps.errText(ex)); }
      }
    });
    return step(async () => { await api().setMyEvents(chosen.map((ev) => ev.id)); return true; });
  }
  async function stepMutuals() {
    const can = !!(navigator.contacts && navigator.contacts.select);
    const count = await api().myContactCount();
    frame({ title: 'Mutuals', sub: 'Pick contacts to share. We keep a scrambled fingerprint of each number, never the number, and show you people you both know.', cta: can ? 'Choose contacts' : 'Done', back: true,
      body: `<div class="ob__mutuals">${count ? `<p class="t-sub">${count} contacts shared</p><p class="ob__cap">Choose again to replace them.</p>` : can ? '<p class="ob__cap">Your phone will ask which contacts to share.</p>' : '<p class="ob__cap">Contact import isn’t available in this browser yet. It comes with the installed app.</p>'}</div>` });
    setReady(true);
    return step(async () => {
      if (!can) return true;
      let picked; try { picked = await navigator.contacts.select(['tel'], { multiple: true }); } catch (e) { err('Nothing chosen.'); return false; }
      const numbers = picked.flatMap((c) => c.tel || []).map((t) => { const d = String(t).replace(/\D/g, ''); return d.length < 10 ? null : '+' + (d.length === 10 ? '1' + d : d); }).filter(Boolean);
      const hashes = await Promise.all(numbers.map(async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('')));
      await api().syncContacts(hashes);
      return true;
    });
  }
  async function stepCover() {
    let pick = (me && me.cover) || 'reeded';
    frame({ title: 'Your cover', sub: 'The header on your profile.', cta: 'Save', back: true,
      body: `<div class="ob__cover-preview"><img id="ob-cover-img" src="${COVERS.find((c) => c.id === pick).src}" alt=""><div class="pcover__grad"></div><img class="ob__cover-avatar" src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""></div><div class="ob__covers">${COVERS.map((c) => `<button class="tile ob__cover${c.id === pick ? ' is-on' : ''}" type="button" data-cover="${c.id}"><img src="${c.src}" alt=""></button>`).join('')}</div>` });
    setReady(true);
    panel().addEventListener('click', (e) => { const b = e.target.closest('[data-cover]'); if (!b) return; pick = b.dataset.cover; $$('[data-cover]').forEach((x) => x.classList.toggle('is-on', x === b)); $('#ob-cover-img').src = COVERS.find((c) => c.id === pick).src; });
    return step(async () => { me = await api().updateProfile({ cover: pick }); return true; });
  }

  // ═══════════════ entries ═══════════════
  async function loadMe() {
    me = await api().myProfile();
    if (me && me.avatar_path) { const u = await api().mediaUrls([me.avatar_path]); me.avatarUrl = u[me.avatar_path]; }
    return me;
  }
  async function run() {
    const a = api();
    if (!(await a.session())) {
      let r;
      do { await stepName(false); r = await stepPhone(); } while (r === 'back');
    }
    await loadMe();
    if (!me) { if (!draft.name) await stepName(false); let r; do { r = await stepBirthday(false); if (r === 'back') await stepName(false); } while (r === 'back'); }
    if (me.onboarded) { root().hidden = true; return me; }
    const state = await a.myState();
    if (!state.photos) await stepPhotos(false);
    if (!me.details || !Object.keys(me.details).length) await stepBasics(false);
    if (!me.taste || !me.taste.length) await stepDescribes(false);
    await loadMe();
    await stepCelebration();
    let r = await stepBoard(false);
    while (true) {
      const v = await stepRealView();
      if (v === 'board') { r = await stepBoard(false); continue; }
      break;
    }
    try { me = await a.updateProfile({ onboarded: true }); } catch (e) { /* fine */ }
    root().hidden = true;
    return me;
  }

  async function edit() {
    const a = api();
    await loadMe();
    const sections = [
      ['board', 'Make it yours', async () => { await stepBoard(true); await loadMe(); }], ['name', 'Name', () => stepName(true)], ['photos', 'Photos', () => stepPhotos(true)],
      ['basics', 'The basics', () => stepBasics(true)], ['describes', 'What describes you', () => stepDescribes(true)], ['rotation', 'Your rotation', stepRotation],
      ['intro', 'Your line', stepIntro], ['lyric', 'Lyrics to live by', stepLyric], ['events', 'Going to', stepEvents], ['mutuals', 'Mutuals', stepMutuals], ['cover', 'Cover', stepCover],
    ];
    while (true) {
      frame({ title: me ? me.name : 'You', sub: 'Everything on your profile, one piece at a time.', cta: 'Done', ready: true,
        body: `<div class="ob__menu">${sections.map(([k, label]) => `<button class="prow ob__row" type="button" data-section="${k}"><div class="prow__details"><p class="t-sub">${esc(label)}</p></div><img src="assets/caret-left-dark.svg" width="20" height="20" alt="" style="opacity:.45;transform:scaleX(-1)"></button>`).join('')}<button class="prow ob__row ob__row--quiet" type="button" data-signout><div class="prow__details"><p class="t-sub">Sign out</p></div></button></div>` });
      const choice = await new Promise((res) => {
        const h = (e) => { const s = e.target.closest('[data-section]'); if (s) { panel().removeEventListener('click', h); res(s.dataset.section); return; } if (e.target.closest('[data-signout]')) { panel().removeEventListener('click', h); res('signout'); return; } if (e.target.closest('[data-next]')) { panel().removeEventListener('click', h); res('done'); } };
        panel().addEventListener('click', h);
      });
      if (choice === 'done') break;
      if (choice === 'signout') { await a.signOut(); location.reload(); return; }
      await sections.find(([k]) => k === choice)[2]();
      await loadMe();
    }
    root().hidden = true;
    return me;
  }

  return { init(d) { deps = d; }, run, edit, stickerFor, get me() { return me; } };
})();
