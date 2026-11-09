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

  // the covers (":: making it you._cover selection", 1100:31538), in the frame's order; older ids map onto them
  const COVERS = [
    { id: 'vinyl', src: 'assets/covers/1.jpg' }, { id: 'waveform', src: 'assets/covers/2.jpg' }, { id: 'holo', src: 'assets/covers/3.jpg' }, { id: 'reeded-warm', src: 'assets/covers/4.jpg' },
    { id: 'stripes', src: 'assets/covers/5.jpg' }, { id: 'discs', src: 'assets/covers/6.jpg' }, { id: 'reeded', src: 'assets/covers/7.jpg' }, { id: 'rain', src: 'assets/covers/8.jpg' },
  ];
  const COVER_ALIAS = { iridescent: 'holo', grain: 'rain', cyan: 'rain', dusk: 'rain' };
  const coverOf = (id) => COVERS.find((c) => c.id === (COVER_ALIAS[id] || id)) || COVERS[0];
  // "What best describes you": one sticker, shown beside the name on the card
  const DESCRIBES = [
    ['collector', 'Collector', 'assets/stickers/taste-collector.png'], ['nostalgic', 'Nostalgic', 'assets/stickers/taste-nostalgic.png'], ['audiophile', 'Audiophile', 'assets/stickers/taste-audiophile.png'],
    ['classics', 'Classics', 'assets/stickers/taste-classics.png'], ['live_shows', 'Live Shows', 'assets/stickers/taste-live_shows.png'], ['all_around', 'All Around', 'assets/stickers/taste-all_around.png'],
  ];
  // "Now for the basics"
  // "Now for the basics" (5 of 7): typed, or picked from a short list; Kids takes more than one
  const BASICS = [
    { key: 'occupation', label: 'Occupation', icon: 'briefcase', ph: 'Ex: Designer at RG/A' },
    { key: 'education', label: 'Education', icon: 'graduation-cap', options: ['High school', 'Undergrad', 'Graduate', 'PhD', 'Higher education'] },
    { key: 'hometown', label: 'Hometown', icon: 'house-line', ph: 'Ex: London' },
    { key: 'location', label: 'Current Location', icon: 'map-pin-line', ph: 'Ex: Brooklyn' },
    { key: 'height', label: 'Height', icon: 'ruler', ph: 'Ex: 5′10' },
    { key: 'activity', label: 'Activity', icon: 'barbell', options: ['Active', 'Moderately active', 'Sometimes active', 'Not active'] },
    { key: 'kids', label: 'Kids', icon: 'baby', options: ['Has kids', 'No kids', 'Wants kids', 'Not sure yet'], multi: true },
    { key: 'smoking', label: 'Smoking', icon: 'cigarette', options: ['Smokes', 'Doesn’t smoke', 'Socially'] },
    { key: 'drinking', label: 'Drinking', icon: 'wine', options: ['Drinks', 'Doesn’t drink', 'Socially'] },
  ];
  const icon = (k) => `<img class="ob__ic" src="assets/details/${k}.svg" width="24" height="24" alt="">`;
  const KINDS = ['Bar', 'Restaurant', 'Café', 'Venue', 'Store', 'Park', 'Cinema', 'Gallery'];
  const HOODS = ['Bed-Stuy', 'Bushwick', 'Carroll Gardens', 'Clinton Hill', 'Cobble Hill', 'Crown Heights', 'DUMBO', 'Fort Greene', 'Gowanus', 'Greenpoint', 'Park Slope', 'Prospect Heights', 'Red Hook', 'Williamsburg', 'Elsewhere'];

  // ── the frame: title row with the "n of 6" pill, body, one pill button that goes mint when the step is ready
  // every frame gets a fresh panel element, so the last step's listeners go with it
  const freshPanel = (cls) => { const old = panel(); const el = document.createElement('section'); el.className = 'auth ' + (cls || ''); el.setAttribute('role', 'dialog'); old.replaceWith(el); return el; };
  function frame({ step, total, title, sub, body, cta, back, skip, ready, cancel, focus = true, cls = '' }) {
    const showCancel = cta && cancel !== false;
    freshPanel(cls).innerHTML = `
      <div class="ob__head">
        ${back ? '<button class="ob__back" type="button" data-back aria-label="Back"><img src="assets/chevron-left.svg" width="9" height="17" alt=""></button>' : ''}
        <h2 class="ob__h">${esc(title)}</h2>
        ${step ? `<span class="ob__pill">${step} of ${total}</span>` : ''}${skip ? `<button class="ob__skip" type="button" data-skip>${esc(skip)}</button>` : ''}
      </div>
      ${sub ? `<p class="ob__p">${sub}</p>` : ''}
      <div class="ob__body">${body}</div>
      <p class="ob__err" aria-live="polite"></p>
      ${cta ? `<div class="ob__foot"><button class="ob__cta${ready ? ' is-ready' : ''}" type="button" data-next><span>${esc(cta)}</span><img src="assets/arrow-right.svg" width="15" height="15" alt="" class="ob__cta-arrow"></button>${showCancel ? `<button class="ob__cta ob__cta--ghost" type="button" data-cancel>${esc(typeof cancel === 'string' ? cancel : 'Cancel')}</button>` : ''}</div>` : ''}`;
    root().hidden = false;
    root().scrollTop = 0;
    panel().scrollTop = 0;
    const first = !focus || cls.includes('auth--board') ? null : $('.ob__body input:not([type=file]):not([type=date]), .ob__body textarea');
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
        if (e.target.closest('[data-cancel]')) { panel().removeEventListener('click', onClick); resolve('cancel'); return; }
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

  // ═══════════════ the splash: the sky and the wordmark, a moment, then act one ═══════════════
  // ═══════════════ the splash: the "animation frames" storyboard (1107:14029) read as one motion ═══════════════
  // The chrome letters come forward, then fall back into a pop of colour that swells behind them until it
  // owns the screen, and fades off fast onto the title screen: "Pass the aux", a button that starts the
  // build, and behind them an orbit of pieces (photos, covers, stickers) that keeps turning, the way the
  // board's ring does, to hint at what this is. A tap skips ahead.
  // each piece: its own size, its own ellipse (radii, tilt, a nudge off centre) and pace, so the paths cross
  // rather than queue; the widest ones carry a piece off the edge of the screen and back in
  const ORBIT_PIECES = [
    { src: 'assets/splash/photo-1.jpg', cls: 'splash__piece--tall', size: 1.5, rx: 150, ry: 96, tilt: -10, cx: 0, cy: 0, speed: 1 },
    { src: 'assets/stickers/heart.png', cls: 'splash__piece--sticker', size: 0.8, rx: 250, ry: 70, tilt: 14, cx: 10, cy: -40, speed: -0.9 },
    { src: 'assets/splash/photo-3.jpg', size: 1.0, rx: 180, ry: 120, tilt: 6, cx: -10, cy: 20, speed: 1.25 },
    { src: 'assets/stickers/taste-all_around.png', cls: 'splash__piece--sticker', size: 1.7, rx: 140, ry: 140, tilt: -22, cx: 20, cy: -10, speed: 0.7 },
    { src: 'assets/album-2.png', size: 0.55, rx: 270, ry: 90, tilt: -6, cx: 0, cy: 50, speed: 1.45 },
    { src: 'assets/stickers/taste-collector.png', cls: 'splash__piece--sticker', size: 1.2, rx: 165, ry: 80, tilt: 18, cx: -20, cy: -30, speed: 0.95 },
    { src: 'assets/splash/photo-2.jpg', size: 0.6, rx: 230, ry: 150, tilt: 10, cx: 0, cy: -20, speed: -1.1 },
    { src: 'assets/stickers/taste-nostalgic.png', cls: 'splash__piece--sticker', size: 0.95, rx: 120, ry: 110, tilt: -14, cx: 30, cy: 30, speed: 1.35 },
    { src: 'assets/album-4.png', size: 1.3, rx: 200, ry: 72, tilt: 4, cx: -30, cy: 10, speed: 0.85 },
    { src: 'assets/stickers/sticker-sneakers.png', cls: 'splash__piece--sticker', size: 1.35, rx: 215, ry: 104, tilt: -30, cx: 10, cy: 10, speed: 0.78 },
    { src: 'assets/damon-2.png', size: 0.85, rx: 260, ry: 60, tilt: 24, cx: -10, cy: -60, speed: 1.15 },
    { src: 'assets/stickers/sticker-cocktail.png', cls: 'splash__piece--sticker', size: 0.7, rx: 110, ry: 160, tilt: 40, cx: 40, cy: 0, speed: -1.3 },
    { src: 'assets/imani-3.png', size: 1.1, rx: 190, ry: 130, tilt: -4, cx: 20, cy: 40, speed: 0.9 },
    { src: 'assets/stickers/sticker-clapper.png', cls: 'splash__piece--sticker', size: 0.9, rx: 240, ry: 110, tilt: -18, cx: -40, cy: -10, speed: 1.05 },
    { src: 'assets/stickers/sticker-pizza.png', cls: 'splash__piece--sticker', size: 0.65, rx: 285, ry: 80, tilt: 8, cx: 0, cy: 30, speed: 1.55 },
    { src: 'assets/theo-3.png', size: 0.75, rx: 130, ry: 90, tilt: 30, cx: -30, cy: -20, speed: -0.8 },
    { src: 'assets/stickers/sticker-coffee.png', cls: 'splash__piece--sticker', size: 0.6, rx: 205, ry: 140, tilt: -36, cx: 30, cy: -40, speed: 1.2 },
  ];
  async function stepSplash() {
    frame({ cls: 'auth--sky auth--splash', title: '', body: `
      <div class="sky" aria-hidden="true">
        <span class="sky__cloud sky__cloud--a"></span><span class="sky__cloud sky__cloud--b"></span><span class="sky__cloud sky__cloud--c"></span><span class="sky__cloud sky__cloud--d"></span>
      </div>
      <div class="splash" id="splash">
        <div class="splash__orbit" aria-hidden="true">${ORBIT_PIECES.map((p) => `<img class="splash__piece ${p.cls || ''}" src="${p.src}" alt="" draggable="false">`).join('')}</div>
        <div class="splash__glow" aria-hidden="true"></div>
        <img class="splash__mark" src="assets/aux-splash.png" alt="aux" draggable="false">
        <div class="splash__words"><p class="splash__tag">Pass the <b>aux</b></p><button class="splash__go" type="button" data-go>Let’s build</button></div>
      </div>` });
    const splash = $('#splash');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the orbit: an ellipse seen from a little above, centred on the stage, one turn in about 34s
    const pieces = [...splash.querySelectorAll('.splash__piece')];
    const CX = 200, CY = 290, N = pieces.length, TAU = Math.PI * 2;
    let raf = 0;
    const place = (t) => {
      pieces.forEach((el, i) => {
        const o = ORBIT_PIECES[i];
        const a = (t / (17000 / o.speed)) * TAU + (i / N) * TAU * 1.618;
        const depth = (Math.sin(a) + 1) / 2;                       // 0 at the back, 1 at the front
        const ex = o.rx * Math.cos(a), ey = o.ry * Math.sin(a);
        const tr = (o.tilt * Math.PI) / 180;                        // the ellipse itself is tilted
        const x = CX + o.cx + ex * Math.cos(tr) - ey * Math.sin(tr);
        const y = CY + o.cy + ex * Math.sin(tr) + ey * Math.cos(tr) + Math.sin(t / 1700 + i) * 9;
        const sc = o.size * (0.34 + 0.86 * depth);
        el.style.transform = `translate(${(x - 46).toFixed(1)}px, ${(y - 46).toFixed(1)}px) scale(${sc.toFixed(3)}) rotate(${(Math.sin(t / 2300 + i * 1.3) * 11).toFixed(2)}deg)`;
        el.style.opacity = (0.3 + 0.7 * depth).toFixed(3);
        el.style.zIndex = String(Math.round(depth * 10));
        el.style.filter = depth < 0.3 ? `blur(${((0.3 - depth) * 5).toFixed(2)}px)` : '';
      });
    };
    const start = performance.now() - 9000;
    const loop = () => { place(performance.now() - start); raf = requestAnimationFrame(loop); };
    place(0);
    if (reduce) { splash.classList.add('is-orbit', 'is-title'); }
    else {
      requestAnimationFrame(() => splash.classList.add('is-playing'));
      loop();
      setTimeout(() => splash.classList.add('is-orbit'), 2750);   // as the letters go, the orbit is already on its way up through the colour
      setTimeout(() => splash.classList.add('is-title'), 3050);
    }
    const skip = () => { splash.classList.remove('is-playing'); splash.querySelector('.splash__mark').style.opacity = '0'; splash.querySelector('.splash__glow').style.opacity = '0'; splash.classList.add('is-orbit', 'is-title'); if (!raf && !reduce) loop(); };
    await new Promise((res) => {
      const h = (e) => {
        if (e.target.closest('[data-go]')) { panel().removeEventListener('click', h); res(); return; }
        if (!splash.classList.contains('is-title')) skip();
      };
      panel().addEventListener('click', h);
    });
    cancelAnimationFrame(raf);
  }

  // ═══════════════ act one: essentials ═══════════════
  const draft = { name: '', last: '' };

  async function stepName(editing) {
    frame({ step: editing ? 0 : 1, total: 7, title: 'What’s your name?', cta: editing ? 'Save' : 'Next', back: true, focus: !!editing,
      body: `<label class="ob__fld"><input class="ob__input" id="ob-name" type="text" placeholder="First name" autocomplete="given-name" maxlength="40" value="${esc(me ? me.name : draft.name)}"><span class="ob__fld-label">First name</span></label>
             <div><label class="ob__fld"><input class="ob__input" id="ob-last" type="text" placeholder="Last name" autocomplete="family-name" maxlength="60" value="${esc(me ? me.last_name || '' : draft.last)}"><span class="ob__fld-label">Last name</span></label><p class="ob__cap">We’ll never use your last name on your profile</p></div>` });
    liveReady(() => $('#ob-name').value.trim().length > 0);
    return step(async () => {
      const name = $('#ob-name').value.trim(), last = $('#ob-last').value.trim();
      if (!name) { err('A first name, at least.'); return false; }
      if (me) { me = await api().updateProfile({ name, last_name: last || null }); }
      else { draft.name = name; draft.last = last; }
      return true;
    });
  }

  // digits only; a ten-digit number is taken as US and gets its 1
  const e164 = (v) => { const d = v.replace(/\D/g, ''); return d.length === 10 ? '1' + d : d; };
  async function stepPhone() {
    let phone = '';
    while (true) {
      frame({ step: 2, total: 7, title: 'What’s your phone number?', cta: 'Next', back: true,
        body: `<div><label class="ob__fld"><input class="ob__input" id="ob-phone" type="tel" inputmode="tel" placeholder="+1" autocomplete="tel" value="${esc(phone || '+1 ')}"><span class="ob__fld-label">Phone number</span></label><p class="ob__cap">Your phone number will never be shared</p></div>` });
      liveReady(() => $('#ob-phone').value.replace(/\D/g, '').length >= 10);
      const r = await step(async () => {
        phone = $('#ob-phone').value;
        const digits = e164(phone);
        if (digits.length < 10) { err('That number looks short.'); return false; }
        const res = await api().sendCode(digits);
        if (res.error) { err(/provider|sms|twilio/i.test(res.error.message) ? 'Texting isn\u2019t on yet. Use a test number: +1 555 000 0010 to 0012, code 123456.' : res.error.message); return false; }
        return true;
      });
      if (r === 'back') return 'back';
      const digits = e164(phone);
      frame({ step: 2, total: 7, title: 'The code we texted', sub: `Sent to +${esc(digits)}`, cta: 'Next', back: true,
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
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let value = (me && me.birthdate) || '';   // ISO
    const fmt = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${m} / ${d} / ${y}`; };
    const thisYear = new Date().getFullYear();
    let view = value ? { y: +value.slice(0, 4), m: +value.slice(5, 7) - 1 } : { y: thisYear - 25, m: new Date().getMonth() };
    frame({ step: editing ? 0 : 3, total: 7, title: 'When’s your birthday?', cta: editing ? 'Save' : 'Next', back: true,
      body: `<div class="ob__datewrap">
               <button class="ob__input ob__dateb${value ? ' has-value' : ''}" type="button" id="ob-bday-btn" aria-haspopup="dialog" aria-expanded="false"><span id="ob-bday-text">${value ? fmt(value) : 'MM / DD / YYYY'}</span><svg class="ob__date-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg></button>
               <p class="ob__cap">This information is used only for helping you find the right people</p>
               <div class="ob__cal" id="ob-cal" role="dialog" aria-label="Pick your birthday" hidden></div>
             </div>` });
    const btn = $('#ob-bday-btn'), cal = $('#ob-cal'), text = $('#ob-bday-text');
    const years = []; for (let y = thisYear - 18; y >= thisYear - 100; y--) years.push(y);
    const drawCal = () => {
      const first = new Date(view.y, view.m, 1); const lead = first.getDay(); const days = new Date(view.y, view.m + 1, 0).getDate(); const prevDays = new Date(view.y, view.m, 0).getDate();
      const cells = [];
      for (let i = lead - 1; i >= 0; i--) cells.push(`<span class="ob__cal-day is-out">${prevDays - i}</span>`);
      for (let d = 1; d <= days; d++) { const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; cells.push(`<button class="ob__cal-day${iso === value ? ' is-on' : ''}" type="button" data-day="${iso}">${d}</button>`); }
      for (let d = 1; cells.length % 7; d++) cells.push(`<span class="ob__cal-day is-out">${d}</span>`);
      cal.innerHTML = `<div class="ob__cal-head"><button class="ob__cal-nav" type="button" data-nav="-1" aria-label="Previous month"><img src="assets/caret-left-dark.svg" width="20" height="20" alt=""></button>
          <select class="ob__cal-sel" data-sel="m" aria-label="Month">${MONTHS.map((n, i) => `<option value="${i}"${i === view.m ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <select class="ob__cal-sel" data-sel="y" aria-label="Year">${years.map((y) => `<option value="${y}"${y === view.y ? ' selected' : ''}>${y}</option>`).join('')}</select>
          <button class="ob__cal-nav" type="button" data-nav="1" aria-label="Next month"><img src="assets/caret-left-dark.svg" width="20" height="20" alt="" style="transform:scaleX(-1)"></button></div>
        <div class="ob__cal-grid">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => `<span class="ob__cal-dow">${d}</span>`).join('')}${cells.join('')}</div>`;
    };
    const openCal = () => { drawCal(); cal.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
    const closeCal = () => { cal.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    panel().addEventListener('click', (e) => {
      if (e.target.closest('#ob-bday-btn')) { cal.hidden ? openCal() : closeCal(); return; }
      const nav = e.target.closest('[data-nav]'); if (nav) { view.m += +nav.dataset.nav; if (view.m < 0) { view.m = 11; view.y -= 1; } if (view.m > 11) { view.m = 0; view.y += 1; } drawCal(); return; }
      const day = e.target.closest('[data-day]'); if (day) { value = day.dataset.day; text.textContent = fmt(value); btn.classList.add('has-value'); setReady(true); setTimeout(closeCal, 120); return; }
      if (!cal.hidden && !e.target.closest('#ob-cal')) closeCal();
    });
    panel().addEventListener('change', (e) => { const sel = e.target.closest('[data-sel]'); if (!sel) return; if (sel.dataset.sel === 'm') view.m = +sel.value; else view.y = +sel.value; drawCal(); });
    setReady(!!value);
    return step(async () => {
      const birthdate = value;
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
    frame({ step: editing ? 0 : 4, total: 7, title: 'Let’s add some photos', cta: editing ? 'Save' : 'Next', back: true,
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
    const rowHTML = (f) => {
      const v = d[f.key] || '';
      const body = f.options
        ? `<div class="ob__opts" role="${f.multi ? 'group' : 'radiogroup'}">${f.options.map((o) => { const on = f.multi ? v.split(', ').includes(o) : v === o; return `<button class="ob__opt${on ? ' is-on' : ''}" type="button" role="${f.multi ? 'checkbox' : 'radio'}" aria-checked="${on}" data-opt="${esc(o)}" data-for="${f.key}"><span>${esc(o)}</span><span class="ob__opt-mark${f.multi ? ' ob__opt-mark--box' : ''}"></span></button>`; }).join('')}</div>`
        : `<input class="ob__input ob__input--basic" type="text" data-field="${f.key}" placeholder="${esc(f.ph)}" maxlength="60" value="${esc(v)}" autocomplete="off">`;
      return `<div class="ob__acc-item${v ? ' has-value' : ''}" data-key="${f.key}">
          <button class="ob__acc-row" type="button" data-toggle="${f.key}" aria-expanded="false">${icon(f.icon)}<span class="ob__acc-text"><span class="ob__acc-label">${esc(f.label)}</span><span class="ob__acc-val">${esc(v)}</span></span><img class="ob__acc-chev" src="assets/caret-left-dark.svg" width="20" height="20" alt=""></button>
          <div class="ob__acc-body" hidden>${body}</div>
        </div>`;
    };
    frame({ step: editing ? 0 : 5, total: 7, title: 'Now for the basics', cta: editing ? 'Save' : 'Next', back: true,
      body: `<div class="ob__acc">${BASICS.map(rowHTML).join('')}</div>` });
    setReady(true);
    const setVal = (key, v) => { if (v) d[key] = v; else delete d[key]; const item = $(`.ob__acc-item[data-key="${key}"]`); item.querySelector('.ob__acc-val').textContent = v; item.classList.toggle('has-value', !!v); };
    const openItem = (item) => {
      $$('.ob__acc-item').forEach((x) => { x.classList.remove('is-open'); x.querySelector('.ob__acc-body').hidden = true; x.querySelector('[data-toggle]').setAttribute('aria-expanded', 'false'); });
      if (!item) return;
      item.classList.add('is-open'); item.querySelector('.ob__acc-body').hidden = false; item.querySelector('[data-toggle]').setAttribute('aria-expanded', 'true');
      const inp = item.querySelector('input'); if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 40); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();   // a pick row needs no keyboard
      setTimeout(() => item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    };
    panel().addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle]');
      if (t) { const item = t.closest('.ob__acc-item'); openItem(item.classList.contains('is-open') ? null : item); return; }
      const o = e.target.closest('[data-opt]');
      if (!o) return;
      const f = BASICS.find((x) => x.key === o.dataset.for);
      if (f.multi) {
        const on = !o.classList.contains('is-on'); o.classList.toggle('is-on', on); o.setAttribute('aria-checked', on);
        setVal(f.key, [...o.parentNode.querySelectorAll('.ob__opt.is-on')].map((x) => x.dataset.opt).join(', '));
      } else {
        o.parentNode.querySelectorAll('.ob__opt').forEach((x) => { x.classList.toggle('is-on', x === o); x.setAttribute('aria-checked', x === o); });
        setVal(f.key, o.dataset.opt);
        // one answer closes the row and opens the next unanswered one
        setTimeout(() => { const next = $$('.ob__acc-item').find((x) => !x.classList.contains('has-value')); openItem(next || null); }, 220);
      }
    });
    panel().addEventListener('input', (e) => { const f = e.target.closest('[data-field]'); if (!f) return; setVal(f.dataset.field, f.value.trim()); });
    panel().addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.closest('[data-field]')) { e.preventDefault(); e.stopImmediatePropagation(); const next = $$('.ob__acc-item').find((x) => !x.classList.contains('has-value')); openItem(next || null); } });
    return step(async () => {
      me = await api().updateProfile({ details: d });
      return true;
    });
  }

  // ═══════════════ "Let's learn more about you" (6 of 7): the prompts, typed or spoken ═══════════════
  const PROMPTS = [
    { key: 'intro', label: 'Intro', ph: 'Type your intro or add voice', mirror: 'intro_quote' },
    { key: 'lyrics', label: 'Lyrics to<br>Live By', ph: 'Type a lyric or add voice', mirror: 'lyric_quote' },
    { key: 'dealbreakers', label: 'Deal-<br>breakers', ph: 'Type a deal-breaker or add voice' },
    { key: 'obsession', label: 'Current<br>Obsession', ph: 'Type your obsession or add voice' },
  ];
  const PROMPT_MIN = 2;
  const EMOJI = ['🔥', '🎵', '😍', '💚', '😋', '🎧', '✨'];
  const mmss = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
  async function stepPrompts(editing) {
    const answers = { ...((me && me.prompts) || {}) };
    const done = () => PROMPTS.filter((pr) => answers[pr.key] && (answers[pr.key].text || answers[pr.key].voice)).length;
    const tileHTML = (pr) => {
      const a = answers[pr.key];
      if (a && a.text) return `<button class="ob__ptile is-done" type="button" data-prompt="${pr.key}"><span class="ob__ptile-text">${esc(a.text)}</span></button>`;
      if (a && a.voice) return `<button class="ob__ptile is-done" type="button" data-prompt="${pr.key}"><span class="ob__ptile-voice"><img src="assets/icon-waveform.svg" width="24" height="24" alt=""><span>${pr.label.replace('<br>', ' ')} · ${mmss(a.seconds || 0)}</span></span></button>`;
      return `<button class="ob__ptile" type="button" data-prompt="${pr.key}"><span class="ob__ptile-label">${pr.label}</span></button>`;
    };
    const capHTML = () => { const left = Math.max(0, PROMPT_MIN - done()); return left ? `Add ${left} or more, and remember you can also include voice` : 'Tap a prompt to change it, and remember you can also include voice'; };
    frame({ step: editing ? 0 : 6, total: 7, title: 'Let’s learn more about you', cta: editing ? 'Save' : 'Next', back: true, ready: done() >= PROMPT_MIN,
      body: `<p class="ob__cap ob__cap--lead ob__cap--prompts">Select from the prompts below to add a response</p>
             <div class="ob__ptiles" id="ob-ptiles">${PROMPTS.map(tileHTML).join('')}</div>
             <p class="ob__cap ob__cap--prompts" id="ob-pcap">${capHTML()}</p>
             <div class="ob__compose" id="ob-compose" hidden>
               <div class="ob__ccard"><p class="ob__ccard-text" id="ob-ctext"></p></div>
               <div class="ob__cemoji">${EMOJI.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div>
               <form class="ob__cfield" id="ob-cform" novalidate><input type="text" id="ob-cin" maxlength="140" autocomplete="off" enterkeyhint="done" aria-label="Your answer"><button class="ob__cvoice" type="button" data-voice aria-label="Add voice"><img src="assets/icon-waveform.svg" width="24" height="24" alt=""></button></form>
             </div>` });
    const tiles = $('#ob-ptiles'), cap = $('#ob-pcap'), comp = $('#ob-compose'), cin = $('#ob-cin'), ctext = $('#ob-ctext'), voiceBtn = $('[data-voice]');
    let open = null, rec = null;
    const redraw = () => { tiles.innerHTML = PROMPTS.map(tileHTML).join(''); cap.textContent = capHTML(); setReady(done() >= PROMPT_MIN); };
    const show = (pr) => {
      open = pr;
      const a = answers[pr.key] || {};
      cin.value = a.text || ''; cin.placeholder = pr.ph;
      ctext.textContent = cin.value || pr.label.replace('<br>', ' '); ctext.classList.toggle('is-ph', !cin.value);
      panel().classList.add('is-composing'); root().classList.add('is-composing'); panel().scrollTop = 0; comp.hidden = false;
      setTimeout(() => cin.focus({ preventScroll: true }), 40);
    };
    const hide = () => { open = null; comp.hidden = true; panel().classList.remove('is-composing'); root().classList.remove('is-composing'); cin.blur(); };
    const commit = async () => {
      if (!open) return;
      const text = cin.value.trim(); const pr = open;
      if (!text) { hide(); return; }
      answers[pr.key] = { text };
      hide(); redraw(); toast(`${pr.label.replace('<br>', ' ')} added successfully`);
    };
    // voice: tap to record, tap again to stop; the note is uploaded and the tile says how long it is
    const startRec = async () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) { err('Voice needs a phone or a browser with a microphone.'); return; }
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { err('The microphone isn’t available.'); return; }
      const mr = new MediaRecorder(stream); const chunks = []; const started = Date.now(); const pr = open;
      mr.addEventListener('dataavailable', (e) => chunks.push(e.data));
      mr.addEventListener('stop', async () => {
        stream.getTracks().forEach((t) => t.stop());
        const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        cin.placeholder = pr.ph;
        if (mr.discardFlag) return;
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        try { busy(true); const path = await api().uploadVoice(pr.key, blob); answers[pr.key] = { voice: path, seconds }; hide(); redraw(); toast(`${pr.label.replace('<br>', ' ')} added successfully`); }
        catch (e) { err(deps.errText(e)); } finally { busy(false); }
      });
      rec = { mr, timer: 0 };
      mr.start();
      voiceBtn.classList.add('is-rec'); cin.value = ''; cin.blur();
      rec.timer = setInterval(() => { cin.placeholder = `Recording… ${mmss((Date.now() - started) / 1000)}  tap to stop`; }, 250);
      cin.placeholder = 'Recording… 0:00  tap to stop';
      const stopAt = setTimeout(() => stopRec(false), 60000);
      mr.addEventListener('stop', () => clearTimeout(stopAt), { once: true });
    };
    const stopRecKeep = () => { if (!rec) return; const r = rec; rec = null; voiceBtn.classList.remove('is-rec'); clearInterval(r.timer); r.mr.discardFlag = false; r.mr.stop(); };
    const stopRecDrop = () => { if (!rec) return; const r = rec; rec = null; voiceBtn.classList.remove('is-rec'); clearInterval(r.timer); r.mr.discardFlag = true; r.mr.stop(); };
    panel().addEventListener('click', (e) => {
      const t = e.target.closest('[data-prompt]'); if (t) { show(PROMPTS.find((pr) => pr.key === t.dataset.prompt)); return; }
      const em = e.target.closest('[data-emoji]'); if (em) { cin.value += em.dataset.emoji; cin.dispatchEvent(new Event('input')); cin.focus({ preventScroll: true }); return; }
      if (e.target.closest('[data-voice]')) { if (rec) stopRecKeep(); else startRec(); return; }
      if (open && !e.target.closest('.ob__ccard, .ob__cfield, .ob__cemoji, .ob__ckb')) { if (rec) stopRecDrop(); commit(); }
    });
    cin.addEventListener('input', () => { ctext.textContent = cin.value || open.label.replace('<br>', ' '); ctext.classList.toggle('is-ph', !cin.value); });
    // the keyboard's return key: a submit on every platform, so it saves wherever the key event itself is swallowed
    $('#ob-cform').addEventListener('submit', (e) => { e.preventDefault(); commit(); });
    cin.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit(); } if (e.key === 'Escape') { stopRecDrop(); hide(); } });
    return step(async () => {
      if (open) { await commit(); }
      if (!editing && done() < PROMPT_MIN) { err(`Add ${PROMPT_MIN - done()} more to go on.`); return false; }
      const patch = { prompts: answers };
      PROMPTS.forEach((pr) => { if (pr.mirror) patch[pr.mirror] = (answers[pr.key] && answers[pr.key].text) || null; });
      me = await api().updateProfile(patch);
      return true;
    });
  }

  async function stepDescribes(editing) {
    let pick = (me && me.taste && me.taste[0]) || null;
    frame({ step: editing ? 0 : 7, total: 7, title: 'What best describes you?', cta: editing ? 'Save' : 'Next', back: true, ready: !!pick,
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
    frame({ cancel: false, cls: 'auth--sky', cta: 'Get plugged in', title: '', body: `
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
  const stickerFor = (p) => { const k = p && p.taste && p.taste[0]; return DESCRIBES.some((x) => x[0] === k) ? `assets/badges/${k}.png` : 'assets/badges/all_around.png'; };

  // ═══════════════ act three: make it yours ═══════════════
  const FOLDERS = [
    { id: 'music', label: 'Music', min: 3, accepts: ['track'], hint: 'tracks' },
    { id: 'vibes', label: 'Vibes', min: 2, accepts: ['photo', 'gif'], hint: 'photos' },
    { id: 'shelf', label: 'Watching & Reading', min: 1, accepts: ['film', 'show', 'book'], hint: 'titles' },
    { id: 'spots', label: 'Spots', min: 2, accepts: ['place'], hint: 'places' },
  ];
  const KIND_WORD = { track: 'a track', photo: 'a photo', gif: 'a GIF', film: 'a film', show: 'a show', book: 'a book', place: 'a place' };
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

    const CATS = [['track', 'Tracks'], ['film', 'Movies'], ['show', 'Shows'], ['place', 'Spots'], ['gif', 'GIFs'], ['book', 'Books']];
    const TAG = { track: 'Track', film: 'Movie', show: 'Show', place: 'Spot', gif: 'GIF', book: 'Book', photo: 'Photo' };
    frame({ cls: 'auth--board', title: 'Make it yours', cta: editing ? 'Save' : 'See your profile',
      body: `
      <div class="board__search" id="bd-search">
        <div class="board__field"><button class="board__glass" type="button" data-cats aria-label="Pick a category"><img src="assets/magnifying-glass.svg" width="20" height="20" alt=""></button><span class="board__chip" id="bd-chip" hidden></span><input id="bd-q" type="text" placeholder="Search books, movies, albums and more" autocomplete="off" autocorrect="off" spellcheck="false"><button class="board__fbtn board__fbtn--gif" type="button" data-gif aria-label="Search GIFs">GIF</button><button class="board__fbtn" type="button" data-upload aria-label="Upload a photo"><img src="assets/icon-image.svg" width="18" height="18" alt=""></button><button class="board__fbtn board__fbtn--clear" type="button" data-clear aria-label="Clear"><img src="assets/x-16.svg" width="16" height="16" alt=""></button></div>
        <p class="board__cap">All searched items will get added to your orbit below, drag and drop them into each folder for the perfect representation of you</p>
        <input type="file" id="bd-file" accept="image/*" multiple hidden>
      </div>
      <div class="ring" id="bd-stage">
        <div class="ring__empty" id="bd-empty" aria-hidden="true">
          <svg class="ring__planet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6.5"/><path d="M5.2 14.6C2.4 16.9 1.3 18.9 2 19.9c1 1.5 6.2-.1 11.6-3.6S22.6 8.9 21.6 7.4c-.6-.9-2.6-.6-5.1.4"/></svg>
          <svg class="ring__star ring__star--a" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5c.8 5 3.7 8.4 9.5 9.5-5.8 1.1-8.7 4.5-9.5 9.5-.8-5-3.7-8.4-9.5-9.5 5.8-1.1 8.7-4.5 9.5-9.5z"/></svg>
          <svg class="ring__star ring__star--b" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5c.8 5 3.7 8.4 9.5 9.5-5.8 1.1-8.7 4.5-9.5 9.5-.8-5-3.7-8.4-9.5-9.5 5.8-1.1 8.7-4.5 9.5-9.5z"/></svg>
          <svg class="ring__star ring__star--c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5c.8 5 3.7 8.4 9.5 9.5-5.8 1.1-8.7 4.5-9.5 9.5-.8-5-3.7-8.4-9.5-9.5 5.8-1.1 8.7-4.5 9.5-9.5z"/></svg>
          <svg class="ring__star ring__star--d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5c.8 5 3.7 8.4 9.5 9.5-5.8 1.1-8.7 4.5-9.5 9.5-.8-5-3.7-8.4-9.5-9.5 5.8-1.1 8.7-4.5 9.5-9.5z"/></svg>
        </div>
        <div class="ring__floor" aria-hidden="true"></div>
      </div>
      <div class="board__folders">${FOLDERS.map((f) => `<div class="folder" data-folder="${f.id}"><div class="folder__stack" id="fs-${f.id}"></div><p class="folder__title">${esc(f.label)}</p><p class="folder__count" id="fc-${f.id}"></p></div>`).join('')}</div>
      <div class="board__overlay" id="bd-overlay" hidden>
        <div class="board__cats" id="bd-cats">${CATS.map(([k, label]) => `<button class="board__cat board__cat--${k}" type="button" data-cat="${k}">${label}</button>`).join('')}</div>
        <div class="board__results" id="bd-results" hidden></div>
      </div>` });
    panel().querySelector('.ob__head').insertAdjacentHTML('afterbegin', `<span class="board__me"><img src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""><img class="board__me-disc" src="${esc(stickerFor(me))}" alt=""></span>`);
    panel().querySelector('.ob__head').insertAdjacentHTML('beforeend', '<span class="board__me board__me--ghost" aria-hidden="true"></span>');

    const stage = $('#bd-stage');
    const tileHTML = (it) => it.art ? `<img src="${esc(it.art)}" alt="" draggable="false">` : `<span class="orb__type">${esc(it.title)}</span>`;
    const drawFolders = () => {
      FOLDERS.forEach((f) => {
        const list = folders[f.id];
        $(`#fs-${f.id}`).innerHTML = list.slice(-3).map((it, i) => `<span class="folder__mini folder__mini--${it.kind}" style="--i:${i}">${tileHTML(it)}</span>`).join('');
        const left = Math.max(0, f.min - list.length);
        $(`#fc-${f.id}`).textContent = left ? `${left} remaining` : `${list.length} added`;
        $(`[data-folder="${f.id}"]`).classList.toggle('is-met', !left);
      });
    };
    drawFolders();

    // ── the ring: cards on a circle seen from a little above. Spin it with a sideways drag;
    //    the front card is big and bright, the back ones small and dim. Left alone it turns
    //    slowly and each card breathes on its own. A downward drag or a press lifts a card out.
    const ring = { cards: [], rot: 0, vel: 0, idleAt: performance.now(), spin: null, lift: null };
    const SIZE = 112;
    const radius = () => Math.max(78, (ring.cards.length * (SIZE + 14)) / (2 * Math.PI));
    const MUSIC_MIN = FOLDERS.find((f) => f.id === 'music').min;
    const count = () => { const n = ring.cards.length; const e = $('#bd-empty'); if (e) e.hidden = n > 0; stage.classList.toggle('is-empty', !n); setReady(folders.music.length >= MUSIC_MIN); };
    let last = performance.now(), raf = 0;
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!ring.spin) {
        const idle = t - ring.idleAt;
        if (Math.abs(ring.vel) > 0.02) { ring.rot += ring.vel * dt; ring.vel *= Math.pow(0.08, dt); }
        else if (idle < 1600 && ring.cards.length) {
          // settle so one card faces front
          const step = (Math.PI * 2) / ring.cards.length;
          const target = Math.round(ring.rot / step) * step;
          ring.rot += (target - ring.rot) * Math.min(1, dt * 8);
        } else ring.rot += 0.16 * dt;   // the slow turn
      }
      const n = ring.cards.length, R = radius(), cx = stage.clientWidth / 2, cy = stage.clientHeight / 2 + 10;
      ring.cards.forEach((c, i) => {
        if (c.lifted) return;
        const a = (i / Math.max(n, 1)) * Math.PI * 2 + ring.rot;
        const depth = (Math.cos(a) + 1) / 2;                    // 1 front, 0 back
        const x = Math.sin(a) * R, y = (1 - depth) * -26 + Math.sin(t / 1000 * 0.8 + c.bob) * 4;
        const sc = 0.56 + 0.44 * depth;
        c.el.style.transform = `translate(${cx + x - SIZE / 2}px, ${cy + y - SIZE / 2}px) scale(${sc}) rotate(${Math.sin(t / 1000 * 0.5 + c.bob) * 2.5}deg)`;
        c.el.style.zIndex = String(10 + Math.round(depth * 100));
        c.el.style.opacity = String(0.42 + 0.58 * depth);
        c.el.classList.toggle('is-front', depth > 0.92);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stopRing = () => cancelAnimationFrame(raf);

    const addToRing = (item) => {
      if (ring.cards.length >= ORBIT_MAX) { deps.notice('Your orbit is full. Drag a few into their sections first.'); stage.classList.add('is-shake'); setTimeout(() => stage.classList.remove('is-shake'), 500); return false; }
      const el = document.createElement('div');
      el.className = 'orb orb--' + item.kind;
      el.innerHTML = tileHTML(item) + `<span class="orb__tag">${esc(TAG[item.kind] || item.kind)}</span>`;
      el.style.width = el.style.height = SIZE + 'px';
      const card = { item, el, bob: Math.random() * 6 };
      ring.cards.push(card);
      // the newcomer takes the front: turn the ring so its slot faces you
      ring.rot = -((ring.cards.length - 1) / ring.cards.length) * Math.PI * 2;
      ring.vel = 0; ring.idleAt = performance.now();
      stage.appendChild(el);
      el.animate([{ transform: `translate(${stage.clientWidth / 2 - SIZE / 2}px, -40px) scale(0.4)`, opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      count();
      return true;
    };
    const removeFromRing = (card) => { ring.cards.splice(ring.cards.indexOf(card), 1); card.el.remove(); ring.idleAt = performance.now(); count(); };

    // ── gestures on the ring: sideways spins, down (or a press) lifts a card out to drag
    let g = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const el = e.target.closest('.orb');
      const card = el ? ring.cards.find((c) => c.el === el) : null;
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, card, axis: null, rot0: ring.rot, hold: 0 };
      stage.setPointerCapture(e.pointerId);
      if (card) g.hold = setTimeout(() => { if (g && !g.axis) startLift(e.clientX, e.clientY); }, 320);
      e.preventDefault();
    });
    const startLift = (px, py) => {
      const card = g.card; g.axis = 'lift'; clearTimeout(g.hold);
      const r = card.el.getBoundingClientRect();
      const ghost = card.el.cloneNode(true);
      ghost.classList.add('is-ghost');
      ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;transform:none;opacity:1;z-index:1000;margin:0;`;
      document.body.appendChild(ghost);
      card.lifted = true; card.el.style.opacity = '0';
      ring.lift = { card, ghost, dx: px - r.left, dy: py - r.top, w: r.width, h: r.height, startRect: r };
      ghost.animate([{ transform: 'scale(1)' }, { transform: `scale(${SIZE / r.width * 1.04})` }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
      if (navigator.vibrate) navigator.vibrate(8);
    };
    stage.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.axis) {
        if (Math.hypot(dx, dy) < 8) return;
        clearTimeout(g.hold);
        if (g.card && dy > Math.abs(dx) * 0.8) { startLift(e.clientX, e.clientY); }
        else { g.axis = 'spin'; ring.spin = g; ring.vel = 0; }
      }
      if (g.axis === 'spin') {
        ring.rot = g.rot0 + dx / radius();
        const dt = e.timeStamp - g.lt; if (dt > 0) ring.vel = ((e.clientX - g.lx) / radius()) / (dt / 1000) * 0.6;
        g.lx = e.clientX; g.lt = e.timeStamp;
        return;
      }
      const L = ring.lift;
      L.ghost.style.left = (e.clientX - L.dx) + 'px'; L.ghost.style.top = (e.clientY - L.dy) + 'px';
      // keep the sections in reach: nudge the page when the finger nears the bottom
      const pr = panel().getBoundingClientRect();
      if (e.clientY > pr.bottom - 70) panel().scrollTop += 10;
      else if (e.clientY < pr.top + 110) panel().scrollTop -= 10;
      $$('.folder').forEach((f) => { const fr = f.getBoundingClientRect(); const over = e.clientX > fr.left && e.clientX < fr.right && e.clientY > fr.top && e.clientY < fr.bottom; f.classList.toggle('is-over', over); f.classList.toggle('is-wrong', over && !FOLDERS.find((x) => x.id === f.dataset.folder).accepts.includes(L.card.item.kind)); });
    });
    const endGesture = async (e) => {
      if (!g || e.pointerId !== g.id) return;
      clearTimeout(g.hold);
      const was = g; g = null;
      if (was.axis === 'spin') { ring.spin = null; ring.idleAt = performance.now(); return; }
      if (was.axis !== 'lift') return;
      const L = ring.lift; ring.lift = null;
      const target = $('.folder.is-over');
      $$('.folder').forEach((f) => f.classList.remove('is-over', 'is-wrong'));
      const f = target && e.type !== 'pointercancel' ? FOLDERS.find((x) => x.id === target.dataset.folder) : null;
      if (f && f.accepts.includes(L.card.item.kind)) {
        const fr = target.querySelector('.folder__stack').getBoundingClientRect();
        await L.ghost.animate([{ left: L.ghost.style.left, top: L.ghost.style.top, transform: L.ghost.style.transform || 'scale(1)' }, { left: (fr.left + fr.width / 2 - L.w / 2) + 'px', top: (fr.top + fr.height / 2 - L.h / 2) + 'px', transform: 'scale(0.42)', opacity: 0.7 }], { duration: 300, easing: 'cubic-bezier(0.3, 0.7, 0.15, 1)', fill: 'forwards' }).finished;
        L.ghost.remove();
        folders[f.id].push(L.card.item);
        removeFromRing(L.card);
        drawFolders();
        target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
        return;
      }
      if (f) { deps.notice(`That’s ${KIND_WORD[L.card.item.kind]}. Try ${FOLDERS.find((x) => x.accepts.includes(L.card.item.kind)).label}.`); target.classList.add('is-shake'); setTimeout(() => target.classList.remove('is-shake'), 500); }
      // back to its place on the ring
      L.card.lifted = false;
      const r = L.card.el.getBoundingClientRect();
      await L.ghost.animate([{ left: L.ghost.style.left, top: L.ghost.style.top, transform: L.ghost.style.transform || 'scale(1)' }, { left: r.left + 'px', top: r.top + 'px', transform: `scale(${r.width / L.w})` }], { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }).finished;
      L.ghost.remove();
      L.card.el.style.opacity = '';
      ring.idleAt = performance.now();
    };
    stage.addEventListener('pointerup', endGesture);
    stage.addEventListener('pointercancel', endGesture);

    // ── search: tap the field and the page goes quiet under white; pick a category, then search
    //    that one kind. A pick lands on the ring and the page comes back.
    const q = $('#bd-q'), overlay = $('#bd-overlay'), cats = $('#bd-cats'), results = $('#bd-results'), field = $('.board__field'), chip = $('#bd-chip');
    let mode = 'idle', cat = null, timer = 0, seq = 0;
    const PLACEHOLDER = q.placeholder;
    const openCats = () => { chip.hidden = true; mode = 'cats'; cat = null; overlay.hidden = false; cats.hidden = false; cats.classList.remove('is-out'); results.hidden = true; results.innerHTML = ''; q.placeholder = ''; q.value = ''; field.classList.add('is-open'); panel().classList.add('is-searching'); };
    const pickCat = (k) => {
      mode = 'results'; cat = k;
      cats.classList.add('is-out'); setTimeout(() => { if (mode === 'results') cats.hidden = true; }, 220);
      const label = CATS.find(([kk]) => kk === k)[1]; const word = k === 'gif' ? 'GIFs' : label.toLowerCase();
      results.hidden = false; results.innerHTML = `<p class="board__hint">Type to search ${word}</p>`;
      q.placeholder = `Search ${word}`;
      chip.textContent = label; chip.className = 'board__chip board__chip--' + k; chip.hidden = false;
      field.className = 'board__field is-open is-picked is-' + k;
      if (q.value.trim() || k === 'gif') search(); else q.focus({ preventScroll: true });
    };
    const closeSearch = () => { chip.hidden = true; mode = 'idle'; cat = null; overlay.hidden = true; results.innerHTML = ''; q.value = ''; q.placeholder = PLACEHOLDER; q.blur(); field.className = 'board__field'; panel().classList.remove('is-searching'); };
    const rowHTML = (h, i) => {
      const art = h.art ? `<img src="${esc(h.art)}" alt="">` : `<i>${esc(h.title.slice(0, 1))}</i>`;
      return `<button class="board__hit" type="button" data-hit="${i}"><span class="board__thumb board__thumb--${h.kind}">${art}</span><span class="board__hit-text">${h.meta ? `<small>${esc(h.meta)}</small>` : ''}<b>${esc(h.title)}</b></span><span class="board__tag board__tag--${h.kind}">${TAG[h.kind]}</span></button>`;
    };
    const gifHTML = (h, i) => `<button class="board__gif" type="button" data-hit="${i}" aria-label="${esc(h.title)}"><img src="${esc(h.thumb || h.art)}" alt="" loading="lazy"></button>`;
    // what the catalogs miss, you can still add by name: a spot, a film, a show, a book
    const ADDABLE = { film: 'a movie', show: 'a show', book: 'a book', place: 'a spot' };
    const addHTML = (text) => `<button class="board__hit board__hit--add" type="button" data-add><span class="board__thumb board__thumb--add"><img src="assets/plus-circle-dark.svg" width="20" height="20" alt=""></span><span class="board__hit-text"><small>Add ${ADDABLE[cat]}</small><b>“${esc(text)}”</b></span></button>`;
    const addOwn = async (text) => {
      if (cat === 'place') {
        try { const pl = await api().addPlace({ name: text, kind: null, neighborhood: null }); return { kind: 'place', key: 'place:' + pl.id, id: pl.id, title: pl.name, meta: '', art: null }; }
        catch (e) { deps.notice(deps.errText(e)); return null; }
      }
      return { kind: cat, key: 'own:' + cat + ':' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), title: text, meta: null, art: null };
    };
    const search = async () => {
      const text = q.value.trim(); const my = ++seq;
      if (!cat) return;
      if (!text && cat !== 'gif') { results.innerHTML = `<p class="board__hint">Type to search ${CATS.find(([kk]) => kk === cat)[1].toLowerCase()}</p>`; return; }
      if (!results.querySelector('.board__gifgrid')) results.innerHTML = '<p class="board__hint">Looking…</p>';
      let hits = [];
      try { hits = await api().searchKind(cat, text); } catch (e) { hits = []; }
      if (my !== seq || mode !== 'results') return;
      const inRing = new Set(ring.cards.map((c) => c.item.key)); const filed = new Set(Object.values(folders).flat().map((i) => i.key));
      hits = hits.filter((h) => !inRing.has(h.key) && !filed.has(h.key));
      results._hits = hits; results._text = text;
      if (cat === 'gif') { results.innerHTML = hits.length ? `<div class="board__gifgrid">${hits.map(gifHTML).join('')}</div>` : `<p class="board__hint">No GIFs for that.</p>`; return; }
      // spots are mostly yours to add; the catalogs get an "add" row only when they come up empty
      const add = ADDABLE[cat] && (cat === 'place' || !hits.length) ? addHTML(text) : '';
      results.innerHTML = (hits.length ? hits.map(rowHTML).join('') : (add ? '' : `<p class="board__hint">Nothing matched that.</p>`)) + add;
    };
    q.addEventListener('focus', () => { if (mode === 'idle') openCats(); });
    q.addEventListener('input', () => { if (mode === 'cats') { if (q.value.trim()) pickCat('track'); return; } clearTimeout(timer); timer = setTimeout(search, 260); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Backspace' && mode === 'results' && !q.value) { openCats(); q.focus({ preventScroll: true }); } });
    panel().addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]'); if (c) { pickCat(c.dataset.cat); return; }
      const hit = e.target.closest('[data-hit]');
      if (hit) { const h = results._hits[Number(hit.dataset.hit)]; if (h) { closeSearch(); addToRing(h); } return; }
      if (e.target.closest('[data-add]')) { const text = results._text; addOwn(text).then((item) => { if (item) { closeSearch(); addToRing(item); } }); return; }
      if (e.target.closest('[data-cats]')) { if (mode === 'idle') { openCats(); q.focus({ preventScroll: true }); } else openCats(); return; }
      if (e.target.closest('[data-gif]')) { if (mode === 'idle') openCats(); pickCat('gif'); return; }
      if (e.target.closest('[data-upload]')) { $('#bd-file').click(); return; }
      if (e.target.closest('[data-clear]')) { if (q.value) { q.value = ''; search(); q.focus({ preventScroll: true }); } else { openCats(); q.focus({ preventScroll: true }); } return; }
      if (e.target === overlay) { closeSearch(); return; }
    });
    $('#bd-file').addEventListener('change', () => {
      closeSearch();
      for (const f of $('#bd-file').files) { if (!addToRing({ kind: 'photo', key: 'upload:' + f.name + ':' + f.size, title: f.name.replace(/\.[^.]+$/, ''), art: URL.createObjectURL(f), file: f })) break; }
      $('#bd-file').value = '';
    });
    count();

    // ── save: each folder goes where it lives on the profile
    const r = await step(async () => {
      if (ring.cards.length) err(`${ring.cards.length} still in your orbit. They stay here if you come back; only what’s in a section goes on your profile.`);
      const b = $('[data-next] span');
      const music = folders.music;
      if (music.length < MUSIC_MIN) { err(`Your rotation needs ${MUSIC_MIN} tracks to go up. ${MUSIC_MIN - music.length} more to go: search Tracks and drag them into Music.`); return false; }
      b.textContent = 'Saving your rotation…'; await api().saveMyBuild('mixtape', music.map((t) => api().trackItem({ key: t.key, artist: t.meta, title: t.title, art: t.art })));
      b.textContent = 'Saving your shelf…';
      await api().setMyShelf(folders.shelf.map((s) => ({ kind: s.kind, key: s.key, title: s.title, meta: s.meta, art: s.art })));
      b.textContent = 'Saving your spots…';
      await api().setMyPlaces(folders.spots);
      const newVibes = folders.vibes.filter((v) => v.file);
      const paths = folders.vibes.filter((v) => v.saved || v.kind === 'gif').map((v) => v.path || v.art);
      for (let i = 0; i < newVibes.length; i++) { b.textContent = `Uploading vibe ${i + 1} of ${newVibes.length}…`; paths.push(await api().uploadStyle(newVibes[i].file)); }
      me = await api().updateProfile({ style_paths: paths });
      return true;
    });
    stopRing();
    return r;
  }

  // the profile, for real: your own page as others see it, with a way back to the board
  // the shelf and the spots are edited in a sheet that follows the mixtape's: search, reorder, delete, save
  const openAdd = (kind, person) => new Promise((res) => {
      const own = kind === 'shelf' ? person.profile.shelf.map((x) => ({ key: x.key, kind: x.kind, art: x.art, artist: x.meta || '', title: x.title })) : person.profile.spots.map((x) => ({ key: 'place:' + x.id, id: x.id, art: x.img, artist: x.meta, title: x.name }));
      const search = kind === 'shelf'
        ? async (q) => (await Promise.all(['film', 'show', 'book'].map((k) => api().searchShelf(k, q).catch(() => [])))).flat().slice(0, 10).map((h) => ({ key: h.key, kind: h.kind, art: h.art, artist: [({ film: 'Movie', show: 'Show', book: 'Book' })[h.kind], h.meta].filter(Boolean).join(' · '), title: h.title }))
        : async (q) => (await api().searchKind('place', q)).map((h) => ({ key: h.key, id: h.id, place: h.place, art: null, artist: h.meta || 'Spot', title: h.title }));
      root().hidden = true;
      deps.openSheet({ name: me.name, sheetItems: own }, () => { root().hidden = false; res(false); }, async (items) => {
        try {
          if (kind === 'shelf') await api().setMyShelf(items.map((t) => ({ kind: t.kind, key: t.key, title: t.title, meta: (t.artist || '').replace(/^(Movie|Show|Book)( · )?/, '') || null, art: t.art })));
          else await api().setMyPlaces(items);
          root().hidden = false; res(true);
        } catch (e) { root().hidden = false; deps.notice(deps.errText(e)); res(false); }
      }, kind === 'shelf'
        ? { title: 'Watching and reading', sub: 'Search, reorder and add titles', sendLabel: 'Save', addLimit: Infinity, kind: 'shelf', search, placeholder: 'Search movies, shows and books' }
        : { title: 'Your spots', sub: 'Search, reorder and add places', sendLabel: 'Save', addLimit: Infinity, kind: 'place', search, placeholder: 'Search for a spot' });
  });
  async function stepRealView() {
    const prof = await api().myProfile();
    const person = await api().hydrate(prof, prof.id);
    freshPanel('auth--real').innerHTML = `<aside class="profile ob__real">${deps.profileHTML(person)}</aside>
      <div class="ob__realbar"><button class="ob__cta ob__cta--quiet" type="button" data-board>Make it yours</button><button class="ob__cta is-ready" type="button" data-next><span>Looks good</span><img src="assets/arrow-right.svg" width="15" height="15" alt="" class="ob__cta-arrow"></button></div>`;
    root().hidden = false;
    const real = panel().querySelector('.ob__real');
    real.querySelector('.pcta').innerHTML = '<p class="ob__cap" style="text-align:center">This is your profile as people see it. Everything on it can change from your avatar, any time.</p>';
    real.querySelectorAll('.pnav__btn, .preply__field, [data-action]:not([data-action="shelf"]):not([data-action="spot"]), .pplay').forEach((b) => { b.disabled = true; b.style.pointerEvents = 'none'; });
    return new Promise((res) => {
      panel().addEventListener('click', async (e) => {
        if (e.target.closest('[data-board]')) { res('board'); return; }
        if (e.target.closest('[data-next]')) { res('next'); return; }
        const act = e.target.closest('[data-action="shelf"], [data-action="spot"]');
        if (act) { if (await openAdd(act.dataset.action, person)) res('refresh'); }
      });
    });
  }

  // ═══════════════ your profile from the avatar (1110:2745): Edit first, View to see it as people do ═══════════════
  // A segmented control sits under the status bar. Edit (the default) shows your avatar with its badge,
  // "The basics" (name, number, birthday) as a card, and under it the pieces of your profile as rows with a
  // pencil each: a tap opens that piece's editor and comes back here. View is the profile as people see it,
  // with nothing to tap but the shelf and spots sheets. The chevron goes back to the feed; the dots keep the
  // section list (Sign out lives there).
  const PENCIL = '<img src="assets/pencil-simple-line.svg" width="20" height="20" alt="">';
  const fmtPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); if (!d) return ''; if (d.length === 11 && d[0] === '1') return `+1 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`; return '+' + d; };
  const fmtDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[2]}/${m[3]}/${m[1]}` : ''; };
  async function viewMine() {
    const a = api();
    let mode = 'edit';
    while (true) {
      await loadMe();
      const prof = await a.myProfile();
      const person = await a.hydrate(prof, prof.id);
      const p = person.profile;
      const sess = await a.session();
      const phone = fmtPhone(sess && sess.user && sess.user.phone);
      const top = `<div class="mine__top">
          <button class="ob__back" type="button" data-done aria-label="Back to the feed"><img src="assets/chevron-left.svg" width="9" height="17" alt=""></button>
          <div class="seg" role="tablist"><button class="seg__btn${mode === 'edit' ? ' is-on' : ''}" type="button" role="tab" data-mode="edit">Edit</button><button class="seg__btn${mode === 'view' ? ' is-on' : ''}" type="button" role="tab" data-mode="view">View</button></div>
          <button class="ob__back" type="button" data-menu aria-label="More"><img src="assets/dots-three-circle-dark.svg" width="24" height="24" alt=""></button>
        </div>`;
      const panelEl = freshPanel('auth--mine' + (mode === 'view' ? ' auth--real auth--mine-view' : ' auth--mine-edit'));
      if (mode === 'view') {
        panelEl.innerHTML = `<aside class="profile ob__real">${deps.profileHTML(person)}</aside>` + top;
        const real = panelEl.querySelector('.ob__real');
        real.querySelector('.pcta').innerHTML = '<p class="ob__cap" style="text-align:center">This is you, as people see you.</p>';
        real.querySelectorAll('.pnav__btn, .preply__field, [data-action="not-interested"], .pplay').forEach((b) => { b.disabled = true; b.style.pointerEvents = 'none'; });
      } else {
        const prompts = Object.keys(me.prompts || {}).length;
        const details = Object.keys(me.details || {}).filter((k) => me.details[k]).length;
        const taste = DESCRIBES.find((x) => x[0] === (me.taste || [])[0]);
        const n = (arr) => (arr || []).length;
        const plural = (k, one, many, verb) => (k ? `${k} ${k === 1 ? one : many} ${verb}` : 'None yet');
        const coverName = (id) => id.split('-').map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
        const rows = [
          ['photos', 'Photos', `${n(person.items)} added`],
          ['cover', 'Cover', me.cover ? coverName(coverOf(me.cover).id) : 'No cover added'],
          ['describes', 'Your badge', taste ? taste[1] : 'None yet'],
          ['basics', 'Details', `${details} of ${BASICS.length} completed`],
          ['prompts', 'Prompts', `${prompts} of ${PROMPTS.length} added`],
          ['rotation', 'Rotation', plural(n(person.rotation), 'track', 'tracks', 'added')],
          ['board', 'Vibes', plural(n(p.style), 'element', 'elements', 'added')],
          ['shelf', 'Watching and Reading', plural(n(p.shelf), 'title', 'titles', 'added')],
          ['spot', 'Spots', plural(n(p.spots), 'place', 'places', 'listed')],
        ];
        panelEl.innerHTML = top + `<div class="mine__scroll">
          <div class="mine__hero"><button class="mine__avatar" type="button" data-edit="photos" aria-label="Change your photos"><img src="${esc(p.avatar)}" alt=""></button><button class="mine__badge" type="button" data-edit="describes" aria-label="Change your badge"><img src="${esc(person.disc)}" alt=""></button></div>
          <section class="mine__sec">
            <div class="mine__sechead"><span>The basics</span></div>
            <div class="mine__card">
              <label class="mine__fld"><span class="mine__lbl">Name</span><input class="mine__val" id="mn-name" type="text" autocomplete="name" maxlength="100" placeholder="Your name" value="${esc([me.name, me.last_name].filter(Boolean).join(' '))}"></label>
              <label class="mine__fld is-static" data-static="phone"><span class="mine__lbl">Phone number</span><input class="mine__val" id="mn-phone" type="tel" value="${esc(phone || 'Not on file')}" readonly tabindex="-1"></label>
              <label class="mine__fld"><span class="mine__lbl">Date of Birth</span><input class="mine__val" id="mn-dob" type="date" value="${esc((me.birthdate || '').slice(0, 10))}" max="${new Date(Date.now() - 18 * 365.25 * 864e5).toISOString().slice(0, 10)}"></label>
            </div>
          </section>
          <section class="mine__sec">
            <div class="mine__sechead"><span>Your profile</span></div>
            <div class="mine__list">${rows.map(([k, label, sub]) => `<button class="mine__row" type="button" data-edit="${k}"><span class="mine__rowtext"><span class="mine__rowlabel">${esc(label)}</span><span class="mine__rowsub">${esc(sub)}</span></span><span class="mine__pencil">${PENCIL}</span></button>`).join('')}</div>
          </section>
          <p class="ob__cap mine__cap">Switch to View to see it as people do.</p></div>`;
      }
      // the control is background-aware: over the cover it is the light glass with white ink; once the cover has
      // scrolled away (View) or always on the white page (Edit) it is the bright glass with ink
      const scroller = panelEl.querySelector(mode === 'view' ? '.ob__real' : '.mine__scroll');
      if (mode === 'view' && scroller) { const onLight = () => panelEl.classList.toggle('is-light', scroller.scrollTop > 110); scroller.addEventListener('scroll', onLight, { passive: true }); onLight(); }
      root().hidden = false;
      // the basics save as you leave the field: the first word is the first name, the rest the last
      const nameEl = $('#mn-name'), dobEl = $('#mn-dob');
      if (nameEl) {
        nameEl.addEventListener('change', async () => {
          const parts = nameEl.value.trim().split(/\s+/).filter(Boolean);
          if (!parts.length) { nameEl.value = [me.name, me.last_name].filter(Boolean).join(' '); return; }
          try { me = await a.updateProfile({ name: parts[0], last_name: parts.slice(1).join(' ') || null }); toast('Name saved'); } catch (ex) { deps.notice(deps.errText(ex)); }
        });
        nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
      }
      if (dobEl) {
        dobEl.addEventListener('change', async () => {
          const v = dobEl.value;
          if (!v) { dobEl.value = (me.birthdate || '').slice(0, 10); return; }
          if (new Date(v) > new Date(dobEl.max)) { deps.notice('You have to be 18.'); dobEl.value = (me.birthdate || '').slice(0, 10); return; }
          try { me = await a.updateProfile({ birthdate: v }); toast('Birthday saved'); } catch (ex) { deps.notice(deps.errText(ex)); }
        });
      }
      const choice = await new Promise((res) => {
        const h = (e) => {
          const f = e.target.closest('[data-focus]'); if (f) { const el = document.getElementById(f.dataset.focus); if (el) { el.focus(); el.select && el.select(); } return; }
          const m = e.target.closest('[data-mode]'); if (m) { done('mode:' + m.dataset.mode); return; }
          if (e.target.closest('[data-done]')) { done('done'); return; }
          if (e.target.closest('[data-menu]')) { done('menu'); return; }
          if (e.target.closest('[data-static="phone"]')) { deps.notice('Your number is how you sign in. Ask us to change it.'); return; }
          const act = e.target.closest('[data-action="shelf"], [data-action="spot"]'); if (act) { done(act.dataset.action); return; }
          const ed = e.target.closest('[data-edit]'); if (ed) done(ed.dataset.edit);
        };
        const done = (v) => { panel().removeEventListener('click', h); res(v); };
        panel().addEventListener('click', h);
      });
      if (choice === 'done') break;
      if (choice.startsWith('mode:')) { mode = choice.slice(5); continue; }
      if (choice === 'menu') { await edit(); continue; }
      if (choice === 'shelf' || choice === 'spot') { await openAdd(choice, person); continue; }
      const sec = SECTIONS.find(([k]) => k === choice);
      if (sec) await sec[2]();
    }
    root().hidden = true;
    return me;
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
      }, { title: 'Your rotation', sub: 'Three or more tracks. Search to add.', sendLabel: 'Save', addLimit: Infinity, minItems: 3 });
      if (!current) setTimeout(deps.focusSearch, 400);
    }));
  }
  async function stepCoverPick(editing) {
    let pick = coverOf(me && me.cover).id;
    frame({ cls: 'auth--board auth--covers', title: 'Make it yours', cta: editing ? 'Save' : 'Next', back: true, ready: true,
      body: `<p class="punit__title ob__covers-cap">Choose a cover image</p>
             <div class="ob__covergrid">${COVERS.map((c) => `<button class="ob__coverpick${c.id === pick ? ' is-on' : ''}" type="button" data-cover="${c.id}" aria-label="${c.id}" aria-pressed="${c.id === pick}"><img src="${c.src}" alt="" draggable="false"><span class="ob__coverpick-grad"></span></button>`).join('')}</div>` });
    panel().querySelector('.ob__head').insertAdjacentHTML('afterbegin', `<span class="board__me"><img src="${esc(me.avatarUrl || 'assets/avatar-damon.png')}" alt=""><img class="board__me-disc" src="${esc(stickerFor(me))}" alt=""></span>`);
    panel().querySelector('.ob__head').insertAdjacentHTML('beforeend', '<span class="board__me board__me--ghost" aria-hidden="true"></span>');
    panel().addEventListener('click', (e) => { const b = e.target.closest('[data-cover]'); if (!b) return; pick = b.dataset.cover; $$('[data-cover]').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); }); });
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
    // ?reset on the URL signs out first, so a link can land on the very first screen
    if (new URLSearchParams(location.search).has('reset')) { try { await a.signOut(); } catch (e) { /* fine */ } history.replaceState(null, '', location.pathname); }
    // Cancel on any step leaves the run: whatever is saved stays with the account, the splash comes back
    const leave = async () => { try { await a.signOut(); } catch (e) { /* fine */ } location.reload(); return new Promise(() => {}); };
    if (!(await a.session())) {
      await stepSplash();
      while (true) {
        const n = await stepName(false);
        if (n === 'back') { await stepSplash(); continue; }
        if (n === 'cancel') { location.reload(); return new Promise(() => {}); }
        const r = await stepPhone();
        if (r === 'back') continue;
        if (r === 'cancel') return leave();
        break;
      }
    }
    await loadMe();
    // ?go=<step> opens that step of the editor first, finished or not; an unfinished run then carries on where it was
    const go = new URLSearchParams(location.search).get('go');
    if (go && me) { history.replaceState(null, '', location.pathname); await edit(go); }
    if (me && me.onboarded) return me;   // the sky stays up until the feed is built (main.js lifts it)
    // the essentials, in order; the run starts at the first one not done and the chevron walks back through them
    const state = me ? await a.myState() : { photos: false };
    const chain = [
      ['birthday', () => stepBirthday(false), () => !me],
      ['photos', () => stepPhotos(false), () => !state.photos],
      ['basics', () => stepBasics(false), () => !me.details || !Object.keys(me.details).length],
      ['prompts', () => stepPrompts(false), () => !me.prompts || Object.keys(me.prompts).length < PROMPT_MIN],
      ['describes', () => stepDescribes(false), () => !me.taste || !me.taste.length],
    ];
    let i = chain.findIndex(([, , todo]) => todo());
    if (i < 0) i = chain.length;
    while (i < chain.length) {
      const r = await chain[i][1]();
      if (r === 'cancel') return leave();
      if (r === 'back') {
        if (i === 0) { const n = await stepName(false); if (n === 'cancel') return leave(); continue; }   // before the birthday there is only the name
        i -= 1; continue;
      }
      i += 1;
    }
    await loadMe();
    await stepCelebration();
    while (true) { const c = await stepCoverPick(false); if (c === 'cancel') return leave(); if (c === 'back') { await stepCelebration(); continue; } break; }
    let r = await stepBoard(false);
    if (r === 'cancel') return leave();
    while (true) {
      const v = await stepRealView();
      if (v === 'board') { r = await stepBoard(false); continue; }
      if (v === 'refresh') continue;
      break;
    }
    try { me = await a.updateProfile({ onboarded: true }); } catch (e) { /* fine */ }
    frame({ cls: 'auth--sky auth--splash', title: '', body: '<div class="sky" aria-hidden="true"><span class="sky__cloud sky__cloud--a"></span><span class="sky__cloud sky__cloud--b"></span><span class="sky__cloud sky__cloud--c"></span><span class="sky__cloud sky__cloud--d"></span></div><div class="splash splash--loading" aria-hidden="true"><img class="splash__mark" src="assets/aux-splash.png" alt="" draggable="false"></div>' });   // the sky again, with the mark, while the feed loads
    return me;
  }

  const SECTIONS = [
    ['board', 'Make it yours', async () => { await stepBoard(true); await loadMe(); }], ['name', 'Name', () => stepName(true)], ['birthday', 'Birthday', () => stepBirthday(true)], ['photos', 'Photos', () => stepPhotos(true)],
    ['basics', 'The basics', () => stepBasics(true)], ['describes', 'What describes you', () => stepDescribes(true)], ['rotation', 'Your rotation', stepRotation],
    ['prompts', 'Prompts', () => stepPrompts(true)], ['cover', 'Cover', () => stepCoverPick(true)],
  ];
  // the list of sections, behind the dots on your profile (Sign out lives here); ?go=<step> runs one step then shows your profile
  async function edit(initial) {
    const a = api();
    await loadMe();
    const sections = SECTIONS;
    if (initial) { const sec = sections.find(([k]) => k === initial); if (sec) { root().hidden = false; await sec[2](); await loadMe(); } return viewMine(); }
    while (true) {
      frame({ title: me ? me.name : 'You', sub: 'Everything on your profile, one piece at a time.', cta: 'Done', ready: true, cancel: false,
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

  function initKeyboard() {
    const r = root();
    if (r.querySelector('.ob__kb')) return;
    const kb = document.createElement('div'); kb.className = 'ob__kb'; kb.setAttribute('aria-hidden', 'true');
    kb.innerHTML = '<img src="assets/keyboard.png" width="401" height="335" alt="" draggable="false"><button class="ob__kb-key" type="button" tabindex="-1"><span class="ob__kb-key-save">Save</span><span class="ob__kb-key-return" aria-hidden="true">&#8629;</span></button>';
    r.appendChild(kb);
    // the key acts like the phone's: it submits an open prompt, or sends Return to the field being typed into
    kb.querySelector('.ob__kb-key').addEventListener('pointerdown', (e) => e.preventDefault());   // keep the field's focus
    kb.querySelector('.ob__kb-key').addEventListener('click', () => {
      const form = r.querySelector('#ob-cform');
      if (form && !form.closest('[hidden]')) { form.requestSubmit(); return; }
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    const isField = (el) => el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !/^(file|date|checkbox|radio|range)$/.test(el.type || '');
    let hideTimer = 0;
    r.addEventListener('focusin', (e) => { if (!isField(e.target)) return; clearTimeout(hideTimer); r.classList.add('has-kb'); });
    r.addEventListener('focusout', () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (!isField(document.activeElement) || !r.contains(document.activeElement)) r.classList.remove('has-kb'); }, 160); });
  }
  return { init(d) { deps = d; initKeyboard(); }, run, edit, viewMine, stickerFor, get me() { return me; } };
})();
