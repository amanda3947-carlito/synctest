/* sync — feed behaviour.
   One card per person; each card is a tap-through story carousel of photos
   and videos. Vertical scroll snaps to the next person; a leftward swipe (or
   the » button) slides in the rest of the profile. The rotation row is fixed
   per person and never changes with the carousel. */

(() => {
  const PHOTO_SECONDS = 5;  // how long the progress track takes to fill on a photo
  const CONTROL_LINGER_MS = 1200; // how long the play/pause indicator stays after a tap
  const SWIPE_OPEN = 0.3;   // fraction of width a slow drag must cover to commit
  const FLICK_VELOCITY = 0.35; // px per ms: a quick flick commits regardless of distance
  const FLICK_MIN_PX = 16;     // ...as long as it moved at least this far

  // Media per person. Swap these for real files; anything that fails to load
  // falls back to its poster and is treated as a photo.
  // Rotation = what they're spinning: a real lead track from each of five current chart albums
  // (Apple Music most-played, 28 Oct 2026). Shared by the feed row, the profile list and the mixtape sheet.
  const ROTATIONS = {
    Damon: [
      { art: 'assets/rot-damon-1.jpg', artist: 'Drake', title: 'Classic PT2' },
      { art: 'assets/rot-damon-2.jpg', artist: 'Jhené Aiko', title: 'Break' },
      { art: 'assets/rot-damon-3.jpg', artist: 'Steve Lacy', title: 'nothing' },
      { art: 'assets/rot-damon-4.jpg', artist: 'SZA', title: 'SOS' },
      { art: 'assets/rot-damon-5.jpg', artist: 'PARTYNEXTDOOR & Drake', title: 'MEET YOUR PADRE' },
    ],
    Olivia: [
      { art: 'assets/rot-imani-1.jpg', artist: 'Olivia Rodrigo', title: 'maggots for brains' },
      { art: 'assets/rot-imani-2.jpg', artist: 'Ariana Grande', title: 'petal' },
      { art: 'assets/rot-imani-3.jpg', artist: 'Olivia Dean', title: 'The Art of Loving (Intro)' },
      { art: 'assets/rot-imani-4.jpg', artist: 'Taylor Swift', title: 'Patient Zero' },
      { art: 'assets/rot-imani-5.jpg', artist: 'Harry Styles', title: 'American Girls' },
    ],
    Theo: [
      { art: 'assets/rot-theo-1.jpg', artist: 'Noah Kahan', title: 'The Great Divide' },
      { art: 'assets/rot-theo-2.jpg', artist: 'Zach Bryan', title: 'Lodi When' },
      { art: 'assets/rot-theo-3.jpg', artist: 'Bad Bunny', title: 'NUEVAYoL' },
      { art: 'assets/rot-theo-4.jpg', artist: 'KAROL G', title: 'BbY WOW' },
      { art: 'assets/rot-theo-5.jpg', artist: 'Morgan Wallen', title: 'Just In Case' },
    ],
  };

  const PEOPLE = [
    {
      name: 'Damon',
      disc: 'assets/disc.png',
      items: [
        { type: 'photo', src: 'assets/bg-damon.png' },
        { type: 'photo', src: 'assets/damon-2.png' },
        { type: 'video', src: 'assets/damon-3.webm', poster: 'assets/damon-3.png' },
        { type: 'photo', src: 'assets/damon-4.png' },
        { type: 'photo', src: 'assets/damon-5.png' },
      ],
      rotation: ROTATIONS.Damon,
    },
    {
      name: 'Olivia',
      disc: 'assets/disc.png',
      items: [
        { type: 'photo', src: 'assets/bg-imani.jpg' },
        { type: 'photo', src: 'assets/imani-2.png' },
        { type: 'video', src: 'assets/imani-3.webm', poster: 'assets/imani-3.png' },
        { type: 'photo', src: 'assets/imani-4.png' },
        { type: 'photo', src: 'assets/imani-5.png' },
      ],
      rotation: ROTATIONS.Olivia,
    },
    {
      name: 'Theo',
      disc: 'assets/disc.png',
      items: [
        { type: 'photo', src: 'assets/bg-theo.jpg' },
        { type: 'photo', src: 'assets/theo-2.png' },
        { type: 'video', src: 'assets/theo-3.webm', poster: 'assets/theo-3.png' },
        { type: 'photo', src: 'assets/theo-4.png' },
        { type: 'photo', src: 'assets/theo-5.png' },
      ],
      rotation: ROTATIONS.Theo,
    },
  ];

  // Header images (abstract, musical). The frame's own is first; static for now, picking comes with onboarding.
  const COVERS = [
    { id: 'reeded', src: 'assets/cover-damon.png' },
    { id: 'holo', src: 'assets/cover-opt-1.jpg' },
    { id: 'grain', src: 'assets/cover-opt-2.jpg' },
    { id: 'cyan', src: 'assets/cover-opt-3.jpg' },
    { id: 'vinyl', src: 'assets/cover-opt-4.jpg' },
    { id: 'iridescent', src: 'assets/cover-opt-5.jpg' },
    { id: 'reeded-warm', src: 'assets/cover-opt-6.jpg' },
    { id: 'waveform', src: 'assets/cover-opt-7.jpg' },
    { id: 'dusk', src: 'assets/cover-opt-8.jpg' },
  ];

  // Profile content. Damon is the Figma frame verbatim; Olivia and Theo reuse
  // his Style / Lyrics / Taste / Spots as placeholders until they get their own.
  const DAMON_SECTIONS = {
    intro: { quote: '“Jazz on vinyl. Rap in the kitchen.”', prompt: 'Say something witty back' },
    style: ['assets/style-1.png', 'assets/style-2.png', 'assets/style-3.png', 'assets/style-4.png'],
    lyric: { quote: '“This may be the night that my dreams might let me know / All the stars are closer.”', prompt: 'Name the artist' },
    taste: ['collector', 'nostalgic', 'audiophile', 'throwback'],
    spots: [
      { img: 'assets/spot-1.png', name: 'Public Records', meta: 'Restaurant • Gowanus' },
      { img: 'assets/spot-2.png', name: 'Hidden Rivers', meta: 'Bar • Gowanus' },
      { img: 'assets/spot-3.png', name: 'Books are Magic', meta: 'Store • Gowanus' },
    ],
  };
  const PROFILES = {
    Damon: { cover: 'reeded', avatar: 'assets/avatar-damon.png', ...DAMON_SECTIONS },
    Olivia: { cover: 'iridescent', avatar: 'assets/imani-4.png', ...DAMON_SECTIONS },
    Theo: { cover: 'vinyl', avatar: 'assets/theo-4.png', ...DAMON_SECTIONS },
  };

  // Taste stickers: two are clean exports, two are crops of the sticker sheets (as in the frame)
  const TASTE = {
    collector: { label: 'Collector', art: `<img class="ptile__art" src="assets/taste-collector.png" width="52" height="58" alt="" style="left:7px;top:0">` },
    nostalgic: { label: 'Nostalgic', art: `<img class="ptile__art" src="assets/taste-nostalgic.png" width="56" height="43" alt="" style="left:5px;top:7px">` },
    audiophile: { label: 'Audiophile', art: `<div class="ptile__crop" style="left:6.67px;top:2px;width:52px;height:51px"><img src="assets/disc-source.png" alt="" style="width:480.75%;height:486.46%;left:-46.01%;top:-42.76%"></div>` },
    throwback: { label: 'Throwback', art: `<div class="ptile__crop" style="left:7.5px;top:3px;width:51px;height:51px"><img src="assets/sticker-sheet-2.png" alt="" style="width:511.91%;height:286.36%;left:-105.03%;top:-22.66%"></div>` },
    classics: { label: 'Classics', art: `<img class="ptile__art" src="assets/stickers/guitar.png" width="58" height="58" alt="" style="left:4px;top:2px">` },
    live_shows: { label: 'Live Shows', art: `<img class="ptile__art" src="assets/stickers/ticket-sm.png" width="58" height="58" alt="" style="left:4px;top:2px">` },
    all_around: { label: 'All Around', art: `<img class="ptile__art" src="assets/stickers/note.png" width="51" height="51" alt="" style="left:7.5px;top:4px">` },
  };
  // "the basics" chips on the profile ("Details", 1087:10751)
  const DETAIL_ICONS = { occupation: 'briefcase', education: 'graduation-cap', height: 'ruler', activity: 'barbell', hometown: 'house-line', location: 'map-pin-line', kids: 'baby', smoking: 'cigarette' };
  const DETAIL_ORDER = ['occupation', 'education', 'height', 'activity', 'hometown', 'location', 'kids', 'smoking'];

  const PLAY_BTN = (label) => `<button class="pplay" type="button" aria-label="Play ${label}" aria-pressed="false"><img class="ico-play" src="assets/play-16.svg" width="16" height="16" alt=""><svg class="ico-pause" viewBox="0 0 256 256" aria-hidden="true"><path fill="#000" d="M216 48v160a16 16 0 0 1-16 16h-40a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h40a16 16 0 0 1 16 16ZM96 32H56a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h40a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16Z"/></svg></button>`;

  // a play button spins its row's art like a record; one record per list at a time
  const wireRecordPlayers = (root, rowSel) => {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.pplay');
      if (!btn) return;
      e.stopPropagation();
      const row = btn.closest(rowSel);
      const on = !row.classList.contains('is-spinning');
      root.querySelectorAll(rowSel + '.is-spinning').forEach((r) => { r.classList.remove('is-spinning'); r.querySelector('.pplay').setAttribute('aria-pressed', 'false'); });
      row.classList.toggle('is-spinning', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  function profileHTML(person) {
    // the person's own content from the database; Damon's frame content stands in for anything they haven't filled yet
    const p = person.profile ? { ...person.profile } : { ...(PROFILES[person.name] || PROFILES.Damon) };
    p.style = (p.style || []).filter(Boolean);
    p.spots = p.spots || [];
    p.intro = p.intro || {}; p.lyric = p.lyric || {};
    const cover = COVERS.find((c) => c.id === p.cover) || COVERS[0];
    const statusbar = `
      <div class="statusbar" aria-hidden="true">
        <div class="statusbar__time"><span>9:41</span></div>
        <div class="statusbar__levels">
          <img src="assets/cellular.svg" width="19.2" height="12.226" alt="">
          <img src="assets/wifi.svg" width="17.142" height="12.328" alt="">
          <img src="assets/battery.svg" width="27.328" height="13" alt="">
        </div>
      </div>`;
    const quoteUnit = (title, q, h) => `
      <section class="punit" style="--unit-h:${h}px">
        <p class="punit__title">${esc(title)}</p>
        <div class="pbento-wide">
          <div class="pquote">
            <div class="pquote__text">
              <p class="t-quote">${esc(q.quote)}</p>
              <div class="preply">
                <button class="preply__field" type="button" data-compose="text" data-prompt="${esc(q.prompt)}"><span class="preply__ph">${esc(q.prompt)}</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>`;
    const rotationRows = (person.rotation || ROTATIONS[person.name] || []).map((r) => `
      <div class="prow">
        <div class="prow__img"><img src="${r.art}" alt=""></div>
        <div class="prow__details">
          <p class="t-body-sm">${esc(r.artist)}</p>
          <p class="t-sub">${esc(r.title)}</p>
        </div>
        <div class="prow__action">${PLAY_BTN(esc(r.title))}</div>
      </div>`).join('');
    const spotCards = p.spots.map((s) => `
      <div class="pspot">
        <div class="pspot__img"><img src="${s.img || 'assets/spot-1.png'}" alt="">${s.shared ? '<span class="pspot__you">you too</span>' : ''}</div>
        <div class="pspot__cap">
          <p class="t-sub">${esc(s.name)}</p>
          <p class="t-body-sm">${esc(s.meta)}</p>
        </div>
      </div>`).join('');

    return `
      <div class="pbar" aria-hidden="true">
        <div class="statusbar statusbar--dark">
          <div class="statusbar__time"><span>9:41</span></div>
          <div class="statusbar__levels">
            <img src="assets/cellular.svg" width="19.2" height="12.226" alt="">
            <img src="assets/wifi.svg" width="17.142" height="12.328" alt="">
            <img src="assets/battery.svg" width="27.328" height="13" alt="">
          </div>
        </div>
        <div class="pbar__row">
          <button class="pnav__btn pbar__back" type="button" aria-label="Back to feed" tabindex="-1"><img src="assets/caret-left-dark.svg" width="24" height="24" alt=""></button>
          <div class="pbar__avatar">
            <img class="pbar__face" src="${p.avatar}" alt="">
            <img class="pbar__disc" src="${person.disc}" alt="">
          </div>
          <p class="pbar__title">${esc(person.name)}</p>
          <button class="pnav__btn" type="button" aria-label="More options" tabindex="-1"><img src="assets/dots-three-circle-dark.svg" width="24" height="24" alt=""></button>
        </div>
      </div>
      <div class="pcover" data-cover="${cover.id}">
        <img class="pcover__img" src="${cover.src}" alt="">
        ${statusbar}
        <div class="pcover__grad">
          <div class="pcover__type">
            <div class="pnav">
              <button class="pnav__btn profile__back" type="button" aria-label="Back to feed"><img src="assets/caret-left.svg" width="24" height="24" alt=""></button>
              <h2 class="pnav__title">${esc(person.name)}</h2>
              <button class="pnav__btn" type="button" aria-label="More options"><img src="assets/dots-three-circle.svg" width="24" height="24" alt=""></button>
            </div>
          </div>
        </div>
      </div>
      <div class="pavatar"><img src="${p.avatar}" alt=""></div>
      <img class="pavatar-disc" src="${person.disc}" alt="">
      <div class="pbody">
        ${p.intro.quote ? quoteUnit('Intro', p.intro, 195) : ''}
        <section class="punit">
          <p class="punit__title">Rotation</p>
          <div class="prow-list">
            ${rotationRows}
            <button class="prow" type="button" data-action="mixtape">
              <div class="prow__img prow__img--empty"></div>
              <div class="prow__details"><p class="t-sub">Make it a mixtape</p></div>
              <div class="prow__action"><span class="pplus"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt=""></span></div>
            </button>
          </div>
        </section>
        ${(person.details && DETAIL_ORDER.some((k) => person.details[k])) ? `
        <section class="punit" style="--unit-h:129px">
          <p class="punit__title">Details</p>
          <div class="pdetails">${DETAIL_ORDER.filter((k) => person.details[k]).map((k) => `<span class="pchip"><img src="assets/details/${DETAIL_ICONS[k]}.svg" width="24" height="24" alt=""><span>${esc(person.details[k])}</span></span>`).join('')}</div>
        </section>` : ''}
        <section class="punit" style="--unit-h:${p.style.length ? 498 : 0}px">
          <p class="punit__title">Vibes</p>
          ${p.style.length ? `<div class="pbento-mixed">${p.style.slice(0, 4).map((src, i) => `<div${i % 3 === 0 ? ' class="span-2"' : ''}><img src="${esc(src)}" alt=""></div>`).join('')}</div>` : ''}
          <button class="prow prow--dashed prow--cta" type="button" data-action="style">
            <div class="prow__details"><p class="t-sub">Add more vibes</p></div>
            <div class="prow__action"><span class="pplus"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt=""></span></div>
          </button>
        </section>
        ${p.lyric.quote ? quoteUnit('Lyrics to live by', p.lyric, 233) : ''}
        <section class="punit" style="--unit-h:286px">
          <p class="punit__title">Watching and Reading</p>
          <div class="pshelf">
            ${(p.shelf || []).map((sh) => `
            <div class="pbook pbook--${sh.kind}">
              <div class="pbook__art">${sh.art ? `<img src="${esc(sh.art)}" alt="" loading="lazy">` : `<span class="pbook__type">${esc(sh.title)}</span>`}<span class="pbook__tag">${({ film: 'Movie', show: 'Show', book: 'Book' })[sh.kind] || ''}</span>${sh.shared ? '<span class="pbook__you">you too</span>' : ''}</div>
              <div class="pbook__cap"><p class="t-sub">${esc(sh.title)}</p><p class="pbook__meta">${esc(sh.meta || '')}</p></div>
            </div>`).join('')}
            <button class="pbook pbook--add" type="button" data-action="shelf" aria-label="Add something you're watching or reading">
              <div class="pbook__art pbook__art--empty"><span class="pplus"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt=""></span></div>
            </button>
          </div>
        </section>
        <section class="punit" style="--unit-h:513px">
          <p class="punit__title">Spots</p>
          <div class="pspots">
            ${spotCards}
            <button class="pspot" type="button" data-action="spot">
              <div class="pspot__img pspot__img--empty"><span class="pplus"><img src="assets/plus-circle-dark.svg" width="24" height="24" alt=""></span></div>
              <div class="pspot__cap"><p class="t-sub">Suggest a spot</p></div>
            </button>
          </div>
        </section>
        <div class="pcta"><button class="ppill" type="button" data-action="not-interested">Not interested</button></div>
      </div>`;
  }

  const feed = document.getElementById('feed');
  const feedPage = () => Math.round(feed.scrollTop / feed.clientHeight);
  const device = document.querySelector('.device');
  const keyboardEl = device.querySelector('.device__keyboard');
  const keyboardHeight = () => keyboardEl.offsetHeight;
  const cardTpl = document.getElementById('card-template');
  const tileTpl = document.getElementById('tile-template');
  const mixtapeTpl = document.getElementById('mixtape-template');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoAdvancing = false;   // the feed moved on by itself (after a send)

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));


  // ── "Make it a mixtape" bottom sheet ────────────────────────────────
  // Fallback search results (the frame's list) for when the live catalog is unreachable.
  const CATALOG = [
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker', title: 'Body' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker ft. Bryson Tiller', title: 'Playing Games' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker ft. Usher', title: 'Come Thur' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker', title: 'Potential' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker', title: 'Tonight' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker ft. PARTYNEXTDOOR', title: 'Just Might' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker', title: 'Anna Mae' },
    { art: 'assets/prof-rot-1.png', artist: 'Summer Walker', title: 'Drunk Dialing...LODT' },
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // a CSS cubic-bezier() as a function of progress, for animations that drive scrollTop
  function cubicBezier(x1, y1, x2, y2) {
    const a = (p1, p2) => 1 - 3 * p2 + 3 * p1, b = (p1, p2) => 3 * p2 - 6 * p1, c = (p1) => 3 * p1;
    const calc = (t, p1, p2) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
    const slope = (t, p1, p2) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const s = slope(t, x1, x2);
        if (s < 1e-6) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      return calc(t, y1, y2);
    };
  }
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const sheetRoot = device.querySelector('.device__sheet');
  const sheet = sheetRoot.querySelector('.sheet');
  const sheetList = sheet.querySelector('.sheet__list');
  const sheetResults = sheet.querySelector('.sheet__results');
  const sheetInput = sheet.querySelector('.sheet__input');
  const sheetSend = sheet.querySelector('.sheet__send');
  const sheetTrash = sheet.querySelector('.sheet__trash');
  const sheetCta = sheet.querySelector('.sheet__cta');
  const sheetAgree = sheet.querySelector('.sheet__agree');
  let sheetPerson = null;
  let sheetOnClose = null;
  let sheetOnSend = null;
  let sheetOnAgree = null;
  let sheetMin = 0;

  // the working tracklist: a fresh copy of what's on the table every time the sheet opens
  // (the person's rotation, or the live build when one is in flight)
  const mixtapeOf = (person) => person.mixtape;
  const resetMixtape = (person) => {
    const base = person.sheetItems || person.rotation || ROTATIONS[person.name] || [];
    person.mixtape = base.map((r) => ({ ...r, added: !!r.added }));
    person.adds = 0;
    person.added = false;   // true once this turn's adds are used up
  };
  const addLimitOf = (person) => person.addLimit || 1;

  // a quiet line at the top of the device for errors the database sends back
  const noticeEl = document.createElement('div');
  noticeEl.className = 'notice';
  noticeEl.setAttribute('role', 'status');
  device.appendChild(noticeEl);
  let noticeTimer = 0;
  const notice = (text) => {
    noticeEl.textContent = text;
    noticeEl.classList.add('is-on');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => noticeEl.classList.remove('is-on'), 3200);
  };
  const errText = (e) => (e && (e.message || e.error_description || e.details)) || 'Something went wrong';

  const trackRowHTML = (t) => `
      <div class="srow${t.added ? ' srow--added' : ''}" data-title="${esc(t.title)}">
        ${t.added ? '<span class="srow__badge">Your add</span>' : ''}
        <div class="srow__art"><img src="${t.art}" alt="" draggable="false"></div>
        <div class="srow__details">
          <p class="t-body-sm">${esc(t.artist)}</p>
          <p class="t-sub">${esc(t.title)}</p>
        </div>
        <div class="srow__action">${PLAY_BTN(esc(t.title))}</div>
        <button class="srow__handle" type="button" aria-label="Drag to reorder ${esc(t.title)}" tabindex="-1"><img src="assets/drag-handle.svg" width="12" height="5.5" alt="" draggable="false"></button>
      </div>`;
  const resultRowHTML = (t, i, disabled) => `
      <div class="sres" data-index="${i}">
        <div class="sres__art"><img src="${t.art}" alt=""></div>
        <div class="sres__body">
          <div class="sres__details">
            <p class="t-body-sm">${esc(t.artist)}</p>
            <p class="t-sub">${esc(t.title)}</p>
          </div>
          <button class="sres__add" type="button" aria-label="Add ${esc(t.title)}"${disabled ? ' disabled' : ''}><img class="ico-off" src="assets/add.svg" width="20" height="20" alt=""><img class="ico-on" src="assets/add-on-tap.svg" width="20" height="20" alt=""></button>
        </div>
      </div>`;

  const renderList = () => { sheetList.innerHTML = mixtapeOf(sheetPerson).map(trackRowHTML).join(''); };
  // results currently on screen (so an add can look its track up by index)
  let shownResults = [];
  let searchSeq = 0;
  // the empty state from the frame; the copy swaps when a query finds nothing
  const blankHTML = (title, sub) => `
      <div class="sheet__blank">
        <div class="sheet__skel">
          ${'<div class="sheet__skel-row"><span class="sheet__skel-dot"></span><span class="sheet__skel-bar"></span></div>'.repeat(3)}
        </div>
        <div class="sheet__blank-text">
          <p class="sheet__blank-title">${esc(title)}</p>
          <p class="sheet__blank-sub">${sub}</p>
        </div>
      </div>`;
  const BLANK_START = () => blankHTML('Build the perfect playlist', 'Add, swap, and move songs in a shared playlist.<br>Building together makes match');
  const BLANK_NONE = () => blankHTML('Nothing matched that', 'Try another song or artist.');
  const showResults = (tracks, note) => {
    shownResults = tracks;
    const inList = new Set(mixtapeOf(sheetPerson).map((t) => t.artist + '|' + t.title));
    if (!tracks.length) {
      sheetResults.innerHTML = note === 'start' ? BLANK_START() : note === 'none' ? BLANK_NONE() : '';
      return;
    }
    sheetResults.innerHTML = tracks.map((t, i) => resultRowHTML(t, i, sheetPerson.added || inList.has(t.artist + '|' + t.title))).join('')
      + (note && note !== 'start' && note !== 'none' ? `<p class="sheet__empty">${esc(note)}</p>` : '');
  };
  const localHits = (q) => CATALOG.filter((t) => !q || (t.artist + ' ' + t.title).toLowerCase().includes(q));
  // Apple's search API answers cross-origin; map songs to our track shape
  const liveSearch = async (q) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=8&country=us`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.results.map((r) => ({ art: (r.artworkUrl100 || '').replace('100x100bb', '200x200bb'), artist: r.artistName, title: r.trackName }));
  };
  let searchTimer = 0;
  const renderResults = () => {
    const q = sheetInput.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    const seq = ++searchSeq;
    if (!q) { showResults([], 'start'); return; }
    // keep whatever is on screen until the live results land, so nothing flashes;
    // if it's the empty state, let its skeleton pulse while we wait
    const blank = sheetResults.querySelector('.sheet__blank');
    if (blank) blank.classList.add('is-loading');
    searchTimer = setTimeout(async () => {
      let tracks;
      try { tracks = await liveSearch(q); } catch (e) { tracks = localHits(q); }
      if (seq !== searchSeq) return;
      showResults(tracks, tracks.length ? '' : 'none');
    }, 200);
  };
  const markDirty = () => { sheet.classList.add('is-dirty'); sheetSend.disabled = false; };

  // animate the sheet's height across a content change (it is bottom-anchored, so the top edge moves)
  const withHeight = (mutate) => {
    const before = sheet.offsetHeight;
    mutate();
    const after = sheet.offsetHeight;
    if (before === after || reduceMotion) return;
    sheet.animate([{ height: `${before}px` }, { height: `${after}px` }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
  };

  function openSheet(person, onClose, onSend, opts = {}) {
    sheetPerson = person;
    sheetOnClose = onClose;
    sheetOnSend = onSend;
    sheetOnAgree = opts.onAgree || null;
    sheetMin = opts.minItems || 0;
    person.addLimit = opts.addLimit || 1;
    resetMixtape(person);
    sheet.querySelector('.sheet__title').textContent = opts.title || 'Make it a mixtape';
    sheet.querySelector('.sheet__sub').textContent = opts.sub || 'Search, reorder and add tracks';
    sheetSend.textContent = opts.sendLabel || 'Send it back';
    sheetAgree.hidden = !opts.canAgree;
    sheetCta.classList.toggle('has-agree', !!opts.canAgree);
    sheet.classList.remove('is-dirty', 'is-searching');
    sheetSend.disabled = true;
    sheetInput.value = '';
    renderList();
    sheetRoot.classList.add('is-open');
    sheetRoot.setAttribute('aria-hidden', 'false');
  }
  function closeSheet() {
    device.scrollTop = 0; device.scrollLeft = 0;   // a focused field can nudge the frame; put it back
    sheetRoot.classList.remove('is-open');
    sheetRoot.setAttribute('aria-hidden', 'true');
    sheetInput.blur();
    sheet.querySelectorAll('.is-spinning').forEach((r) => r.classList.remove('is-spinning'));
    if (sheetOnClose) sheetOnClose();
    sheetOnClose = null;
    sheetOnSend = null;
  }
  sheetRoot.querySelector('.scrim').addEventListener('click', closeSheet);
  // "Send it back": the sheet drops away and the person's card takes over with the celebration
  sheetSend.addEventListener('click', () => {
    if (sheetSend.disabled) return;
    const items = mixtapeOf(sheetPerson);
    if (sheetMin && items.length < sheetMin) { notice(`Add ${sheetMin - items.length} more to save`); return; }
    const sent = sheetOnSend;
    sheetOnClose = null;            // the card decides when the video comes back
    closeSheet();
    if (sent) sent(items);
  });
  // "It's a mixtape": agree to the version on the table as it stands
  sheetAgree.addEventListener('click', () => {
    const fn = sheetOnAgree;
    sheetOnClose = null;
    closeSheet();
    if (fn) fn();
  });
  wireRecordPlayers(sheetList, '.srow');

  // search: focusing the field switches the unit to results; X clears and returns to the list
  const leaveSearch = () => { withHeight(() => { sheet.classList.remove('is-searching'); }); sheetInput.blur(); sheetInput.value = ''; };
  sheetInput.addEventListener('focus', () => { if (sheet.classList.contains('is-searching')) return; withHeight(() => { sheet.classList.add('is-searching'); renderResults(); }); });
  sheetInput.addEventListener('input', renderResults);
  sheet.querySelector('.sheet__clear').addEventListener('click', leaveSearch);
  sheetInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') leaveSearch(); });

  // add: the plus pops, the track lifts off the results, hovers while the sheet shifts
  // back to the list with a dashed slot waiting at the bottom, then drops into the
  // slot and settles; the badge animates on last
  const EASE_LIFT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const EASE_DROP = 'cubic-bezier(0.3, 0.7, 0.15, 1)';
  sheetResults.addEventListener('click', async (e) => {
    const btn = e.target.closest('.sres__add');
    if (!btn || btn.disabled || sheetPerson.added) return;
    const track = shownResults[Number(btn.closest('.sres').dataset.index)];
    if (!track) return;
    sheetResults.querySelectorAll('.sres__add').forEach((b) => { b.disabled = true; });
    btn.disabled = false;
    btn.classList.add('is-tapped');
    const resultRow = btn.closest('.sres');
    const from = resultRow.getBoundingClientRect();
    const d = device.getBoundingClientRect();
    sheetPerson.adds += 1;
    sheetPerson.added = sheetPerson.adds >= addLimitOf(sheetPerson);
    mixtapeOf(sheetPerson).push({ ...track, key: track.key || window.SyncAPI.trackItem(track).key, added: true });

    if (reduceMotion) {
      withHeight(() => { sheet.classList.remove('is-searching'); sheetInput.blur(); sheetInput.value = ''; renderList(); });
      markDirty();
      return;
    }
    await wait(200);

    // 1. lift: a full-size pill rises off the result row
    const lifted = document.createElement('div');
    lifted.innerHTML = trackRowHTML({ ...track, added: true });
    const pill = lifted.firstElementChild;
    pill.querySelector('.srow__badge').remove();
    pill.classList.add('srow--flying');
    pill.style.left = `${from.left - d.left}px`;
    pill.style.top = `${from.top - d.top + (from.height - 71) / 2}px`;
    pill.style.width = `${from.width}px`;
    pill.style.setProperty('--lift-shadow', '0 2px 6px -2px rgba(12, 12, 13, 0.08)');
    device.appendChild(pill);
    resultRow.style.opacity = '0';
    const lift = pill.animate(
      [{ transform: 'translateY(0) scale(1)', opacity: 0.6, boxShadow: '0 2px 6px -2px rgba(12,12,13,0.08)' },
       { transform: 'translateY(-10px) scale(1.035)', opacity: 1, boxShadow: '0 22px 40px -6px rgba(12,12,13,0.18), 0 6px 10px -4px rgba(12,12,13,0.08)' }],
      { duration: 320, easing: EASE_LIFT, fill: 'forwards' });
    await wait(120);

    // 2. shift: the sheet goes back to the list, with the new track rendered as an empty slot
    sheetResults.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
    await wait(160);
    withHeight(() => {
      sheet.classList.remove('is-searching');
      sheetInput.blur();
      sheetInput.value = '';
      renderList();
      sheetList.lastElementChild.classList.add('is-slot');
    });
    sheetResults.getAnimations().forEach((a) => a.cancel());
    await lift.finished;
    await wait(300);   // let the height settle under the hovering pill

    // 3. drop: into the slot, untilting the scale as it lands, with a soft overshoot
    const slot = sheetList.lastElementChild;
    const to = slot.getBoundingClientRect();
    const dx = (to.left - d.left) - parseFloat(pill.style.left);
    const dy = (to.top - d.top) - parseFloat(pill.style.top);
    await pill.animate(
      [{ transform: 'translateY(-10px) scale(1.035)', boxShadow: '0 22px 40px -6px rgba(12,12,13,0.18), 0 6px 10px -4px rgba(12,12,13,0.08)' },
       { transform: `translate(${dx}px, ${dy - 6}px) scale(1.02)`, boxShadow: '0 10px 18px -6px rgba(12,12,13,0.12)', offset: 0.78 },
       { transform: `translate(${dx}px, ${dy + 2}px) scale(1)`, boxShadow: '0 2px 4px -2px rgba(12,12,13,0.05)', offset: 0.92 },
       { transform: `translate(${dx}px, ${dy}px) scale(1)`, boxShadow: '0 0 0 0 rgba(12,12,13,0)' }],
      { duration: 620, easing: EASE_DROP, fill: 'forwards' }).finished;

    // 4. land: the real row takes over, then the badge
    slot.classList.remove('is-slot');
    pill.remove();
    slot.classList.add('is-settled');
    markDirty();
  });

  // drag to reorder: grab the handle (or press and hold a row), the row lifts and tilts,
  // a dashed slot marks where it will land, neighbours slide out of the way
  let rd = null;
  const flip = (els, change) => {
    const before = els.map((el) => el.getBoundingClientRect().top);
    change();
    els.forEach((el, i) => {
      const delta = before[i] - el.getBoundingClientRect().top;
      if (delta && !reduceMotion) el.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    });
  };
  const startReorder = (row, pointerId, y0) => {
    const sheetRect = sheet.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const slot = document.createElement('div');
    slot.className = 'srow srow--empty';
    const startIndex = [...sheetList.children].indexOf(row);
    sheetList.insertBefore(slot, row);
    // the lifted row lives on the sheet itself (sheet coordinates) so it can be carried
    // down over the trash without the list's scroll area clipping it
    row.classList.add('srow--moving');
    row.style.top = `${rowRect.top - sheetRect.top}px`;
    row.style.left = `${rowRect.left - sheetRect.left}px`;
    row.style.transform = 'rotate(-3.68deg)';
    sheet.appendChild(row);
    rd = { row, slot, y0, pointerId, startIndex, rowTop: rowRect.top, height: rowRect.height, overTrash: false };
    try { sheetList.setPointerCapture(pointerId); } catch (e) { /* no capture, still fine */ }
  };
  sheetList.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('.srow');
    if (!row || rd || row.classList.contains('srow--empty') || e.target.closest('.pplay')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.srow__handle')) { e.preventDefault(); startReorder(row, e.pointerId, e.clientY); return; }
    // press and hold anywhere on the row
    const x = e.clientX, y = e.clientY;
    const timer = setTimeout(() => { cleanup(); startReorder(row, e.pointerId, y); }, 240);
    const move = (ev) => { if (Math.hypot(ev.clientX - x, ev.clientY - y) > 6) cleanup(); };
    const cleanup = () => { clearTimeout(timer); row.removeEventListener('pointermove', move); row.removeEventListener('pointerup', cleanup); row.removeEventListener('pointercancel', cleanup); };
    row.addEventListener('pointermove', move);
    row.addEventListener('pointerup', cleanup);
    row.addEventListener('pointercancel', cleanup);
  });
  sheetList.addEventListener('pointermove', (e) => {
    if (!rd || e.pointerId !== rd.pointerId) return;
    const dy = e.clientY - rd.y0;
    rd.row.style.transform = `translateY(${dy}px) rotate(-3.68deg)`;
    // just below the last drop space the bottom row becomes the bin: the slot keeps its
    // place but loses its outline, so the open can is the only target
    const unitBottom = sheet.querySelector('.sheet__unit').getBoundingClientRect().bottom;
    const inBin = e.clientY > Math.min(sheetList.getBoundingClientRect().bottom, unitBottom) + 6;
    if (inBin !== rd.overTrash) { rd.overTrash = inBin; sheetCta.classList.toggle('is-bin', inBin); sheet.classList.toggle('has-bin', inBin); }
    if (inBin) return;
    const centre = rd.rowTop + rd.height / 2 + dy;
    const others = [...sheetList.children].filter((el) => el !== rd.row && el !== rd.slot);
    for (const el of others) {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const slotBefore = rd.slot.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;   // slot is above el
      if (slotBefore && centre > mid) { flip(others, () => el.after(rd.slot)); break; }
      if (!slotBefore && centre < mid) { flip(others, () => el.before(rd.slot)); break; }
    }
  });
  // dropped in the bin: the row shrinks into it, the can jiggles, the list closes up
  const trashRow = async (row, slot) => {
    const sheetRect = sheet.getBoundingClientRect();
    if (!reduceMotion) {
      // the row drops into the bin: shrinks to its centre and fades
      const bin = sheetTrash.getBoundingClientRect();
      const top = parseFloat(row.style.top), left = parseFloat(row.style.left);
      const toX = (bin.left + bin.width / 2 - sheetRect.left) - (left + row.offsetWidth / 2);
      const toY = (bin.top + bin.height / 2 - sheetRect.top) - (top + row.offsetHeight / 2);
      await row.animate([
        { transform: getComputedStyle(row).transform, opacity: 1 },
        { transform: `translate(${toX}px, ${toY}px) scale(0.1)`, opacity: 0.3 },
      ], { duration: 240, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' }).finished;
    }
    row.remove();
    const title = row.dataset.title;
    sheetPerson.mixtape = sheetPerson.mixtape.filter((t) => t.title !== title);
    if (row.classList.contains('srow--added')) { sheetPerson.adds = Math.max(0, sheetPerson.adds - 1); sheetPerson.added = false; }   // that add is free again
    // the can jiggles as the bin folds back to the button row
    sheetTrash.classList.remove('is-fed');
    void sheetTrash.offsetWidth;
    sheetTrash.classList.add('is-fed');
    sheetCta.classList.remove('is-bin');
    sheet.classList.remove('has-bin');
    flip([...sheetList.children].filter((el) => el !== slot), () => slot.remove());
    markDirty();
  };
  const endReorder = async (e) => {
    if (!rd || e.pointerId !== rd.pointerId) return;
    const { row, slot, startIndex } = rd;
    const overTrash = rd.overTrash && e.type !== 'pointercancel';   // a cancelled drag never deletes
    rd = null;
    if (overTrash) { await trashRow(row, slot); return; }   // the bin stays open until the row is in
    sheetCta.classList.remove('is-bin');
    sheet.classList.remove('has-bin');
    const target = slot.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    if (!reduceMotion) {
      // glide from where it was dropped into the slot, untilting on the way
      const top = parseFloat(row.style.top);
      const toY = target.top - sheetRect.top - top;
      await row.animate(
        [{ transform: getComputedStyle(row).transform }, { transform: `translateY(${toY}px) rotate(0deg)` }],
        { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }).finished;
    }
    slot.replaceWith(row);
    row.classList.remove('srow--moving');
    row.style.top = ''; row.style.left = ''; row.style.transform = '';
    const order = [...sheetList.children].map((el) => el.dataset.title);
    sheetPerson.mixtape.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
    if ([...sheetList.children].indexOf(row) !== startIndex) markDirty();
  };
  sheetList.addEventListener('pointerup', endReorder);
  sheetList.addEventListener('pointercancel', endReorder);

  // drag the grabber down to dismiss
  let sd = null;
  const grab = sheet.querySelector('.sheet__grab');
  grab.addEventListener('pointerdown', (e) => { sd = { y: e.clientY, id: e.pointerId, dy: 0, t: e.timeStamp, v: 0 }; sheet.classList.add('is-dragging'); grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', (e) => {
    if (!sd || e.pointerId !== sd.id) return;
    const dy = Math.max(0, e.clientY - sd.y);
    const dt = e.timeStamp - sd.t; if (dt > 0) sd.v = (dy - sd.dy) / dt;
    sd.dy = dy; sd.t = e.timeStamp;
    sheet.style.transform = `translateY(${dy}px)`;
  });
  const endSheetDrag = (e) => {
    if (!sd || e.pointerId !== sd.id) return;
    const { dy, v } = sd; sd = null;
    sheet.classList.remove('is-dragging');
    sheet.style.transform = '';
    if (dy > 120 || v > 0.5) closeSheet();
  };
  grab.addEventListener('pointerup', endSheetDrag);
  grab.addEventListener('pointercancel', endSheetDrag);


  // ── floating nav: always up on the feed; on the profile it hides on scroll down and returns on scroll up
  const nav = {
    show() { device.classList.remove('is-nav-hidden'); },
    hide() { device.classList.add('is-nav-hidden'); },
    // watch a scroller; small jitters are ignored, direction decides
    watch(scroller) {
      let last = scroller.scrollTop;
      scroller.addEventListener('scroll', () => {
        const y = scroller.scrollTop;
        const dy = y - last;
        if (Math.abs(dy) < 6) return;
        if (dy > 0 && y > 24) nav.hide(); else nav.show();
        last = y;
      }, { passive: true });
    },
  };
  // the global like: the heart beats and a note to the person in view opens (no liked
  // state is designed yet)
  const likeBtn = device.querySelector('.device__like');
  const likeArt = likeBtn.querySelector('.device__like-art');
  likeBtn.addEventListener('click', () => {
    if (!cards.length) return;
    cards[nearestPage()].note();
    if (reduceMotion) return;
    likeArt.animate([
      { transform: 'scale(1)' }, { transform: 'scale(1.28)', offset: 0.3 }, { transform: 'scale(1)', offset: 0.55 },
      { transform: 'scale(1.14)', offset: 0.75 }, { transform: 'scale(1)' },
    ], { duration: 560, easing: 'ease-out' });
  });
  // tapping a tab: the glass bubble lifts off, goes translucent, stretches across and
  // settles under the new icon
  const gnavItems = [...device.querySelectorAll('.gnav__item')];
  const bubble = device.querySelector('.gnav__bubble');
  let bubbleIndex = 0;
  let bubbleAnim = null;
  gnavItems.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      gnavItems.forEach((b) => { b.classList.toggle('is-selected', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      if (idx === bubbleIndex) return;
      const from = bubbleIndex * 72, to = idx * 72;
      bubbleIndex = idx;
      bubble.style.setProperty('--bubble-index', idx);
      if (reduceMotion) return;
      if (bubbleAnim) bubbleAnim.cancel();
      const dir = Math.sign(to - from);
      bubbleAnim = bubble.animate([
        { transform: `translateX(${from}px) scale(1)`, opacity: 1, offset: 0 },
        { transform: `translateX(${from + dir * 6}px) scale(1.12, 1.08)`, opacity: 0.55, offset: 0.22 },
        { transform: `translateX(${(from + to) / 2}px) scale(1.22, 0.9)`, opacity: 0.45, offset: 0.55 },
        { transform: `translateX(${to - dir * 3}px) scale(0.96, 1.04)`, opacity: 0.8, offset: 0.82 },
        { transform: `translateX(${to}px) scale(1)`, opacity: 1, offset: 1 },
      ], { duration: 560, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
    });
  });

  // ── compose (":: input" 1062:5173 and 1063:5870): tapping a prompt puts the profile into
  // compose mode. The page dims to 40% around the unit, which lifts and keeps only its quote;
  // the reply field moves down to a panel above the keyboard with the quick reactions; GIF
  // swaps the keyboard for a drawer of GIFs, and a picked one attaches above the field.
  const GIFS = [
    { src: 'assets/gifs/hello-ladies.png', alt: 'Hello ladies' },
    { src: 'assets/gifs/spinning-dancer.gif', alt: 'Spinning dancer' },
    { src: 'assets/gifs/black-cat.gif', alt: 'Black cat' },
    { src: 'assets/gifs/dj-caveman.gif', alt: 'Caveman DJ' },
    { src: 'assets/gifs/disco.gif', alt: 'Disco' },
    { src: 'assets/gifs/heart.gif', alt: 'Heart' },
    { src: 'assets/gifs/horse.gif', alt: 'Galloping horse' },
    { src: 'assets/gifs/thumbs-up.gif', alt: 'Thumbs up' },
    { src: 'assets/gifs/dancing-men.gif', alt: 'Dancing' },
  ];
  const compose = (() => {
    const root = device.querySelector('.compose');
    const panel = root.querySelector('.compose__panel');
    const field = root.querySelector('.compose__field');
    const input = root.querySelector('.compose__input');
    const sendBtn = root.querySelector('.compose__send');
    const gifBtn = root.querySelector('.compose__gifbtn');
    const thumb = root.querySelector('.compose__gif');
    const removeBtn = root.querySelector('.compose__remove');
    const grid = root.querySelector('.compose__grid');
    const titleEl = root.querySelector('.compose__title');
    const coarse = () => window.matchMedia('(pointer: coarse)').matches;
    let session = null;      // { unit, punit, scope, fieldBtn, draftHost, prompt, title, onSend, onClose, hideNav, lift }
    let attachment = null;
    let placeTimer = 0;

    grid.innerHTML = GIFS.map((g, i) => `<button class="compose__tile" type="button" data-index="${i}" aria-label="${esc(g.alt)}"><img src="${g.src}" alt="" loading="lazy" draggable="false"></button>`).join('');

    const refresh = () => {
      const hasText = input.value.trim().length > 0;
      field.classList.toggle('has-text', hasText);
      field.classList.toggle('has-attach', !!attachment);
      field.classList.toggle('is-ready', hasText || !!attachment);
    };
    // the keyboard's height: the drawn one, the drawer, or (on a phone) the real one
    const setKb = () => {
      let h = 0;
      if (device.classList.contains('is-gifs-up') || device.classList.contains('is-keyboard-up')) h = keyboardHeight();
      else if (coarse() && window.visualViewport) h = Math.max(0, window.innerHeight - window.visualViewport.height);
      device.style.setProperty('--kb-h', `${h}px`);
    };
    // the unit in focus sits 11px above the panel (1062:4845). The page itself never moves:
    // it is locked the moment compose opens, and the unit is lifted into place with a
    // transform. An attachment lifts it further to stay above the taller field
    // (1063:5870); removing it lets the unit back down.
    const place = () => {
      if (!session) return;
      setKb();
      if (!session.unit) return;   // a note has nothing to lift: the title lives in the panel
      const dr = device.getBoundingClientRect();
      const kb = parseFloat(device.style.getPropertyValue('--kb-h')) || 0;
      const panelTop = dr.bottom - kb - panel.offsetHeight;
      const ur = session.unit.getBoundingClientRect();
      const delta = ur.bottom + 11 - panelTop;   // how far the unit (as lifted now) still is from its spot
      if (Math.abs(delta) > 1) {
        session.lift -= delta;
        session.unit.style.setProperty('--lift', `${Math.min(0, session.lift)}px`);   // never pushed down, only lifted
      }
    };
    const placeSoon = () => { clearTimeout(placeTimer); requestAnimationFrame(place); placeTimer = setTimeout(place, 340); };
    const placeOnce = placeSoon;
    const showKeyboard = (focus = true) => {
      device.classList.remove('is-gifs-up');
      if (!coarse()) device.classList.add('is-keyboard-up');
      if (focus) {
        input.focus({ preventScroll: true });
        requestAnimationFrame(() => { if (session) input.focus({ preventScroll: true }); });   // after the tap that opened us settles
      }
      setKb();
    };
    const showGifs = () => {
      device.classList.remove('is-keyboard-up');
      device.classList.add('is-gifs-up');
      input.blur();
      setKb();
    };
    const onOutside = (e) => { if (session && !e.target.closest('.pquote.is-composing')) close(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const onViewport = () => { if (session) placeOnce(); };   // a real keyboard changes the room: settle once more

    // a reply to a prompt: the unit lifts above the panel and the page dims around it
    function open(unit, profile, mode, onSend) {
      const fieldBtn = unit.querySelector('.preply__field');
      start({ unit, punit: unit.closest('.punit'), scope: profile, fieldBtn, draftHost: unit, prompt: fieldBtn.dataset.prompt, onSend, hideNav: true }, mode);
    }
    // a note out of the blue (the like): nothing to reply to, so the panel carries a title
    // instead of a lifted unit. `scope` is what dims and holds still: the profile if it is
    // up, otherwise the feed card itself. The draft lives on the card, one per person.
    function openNote(scope, name, card, onSend, onClose) {
      start({ unit: null, punit: null, scope, fieldBtn: null, draftHost: card, prompt: 'Say something', title: name, onSend, onClose, hideNav: scope.classList.contains('profile') }, 'text');
    }
    function start(s, mode) {
      if (session) close();
      session = { ...s, lift: 0 };
      const { unit, punit, scope, draftHost, prompt, title, hideNav } = s;
      scope.classList.add('is-locked');   // the page holds still from the first frame
      // restore the draft left behind last time
      const draft = draftHost._draft || { text: '', gif: null };
      input.value = draft.text;
      input.placeholder = prompt;
      attachment = draft.gif;
      if (attachment) thumb.src = attachment.src;
      refresh();
      root.classList.toggle('is-note', !unit);
      titleEl.innerHTML = title ? `Sending a note to <b>${esc(title)}</b>` : '';
      if (unit) { unit.classList.add('is-composing'); punit.classList.add('is-focus'); }
      scope.classList.add('is-composing');
      device.classList.add('is-composing');
      if (hideNav) nav.hide();
      if (mode === 'gif') showGifs(); else showKeyboard();
      placeOnce();
      scope.addEventListener('pointerdown', onOutside, true);
      document.addEventListener('keydown', onKey);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewport);
    }
    function close(keepDraft = true, sending = false) {
      if (!session) return;
      const { unit, punit, scope, fieldBtn, draftHost, prompt, onClose } = session;
      session = null;
      clearTimeout(placeTimer);
      scope.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onKey);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', onViewport);
      const text = input.value.trim();
      const hasDraft = keepDraft && (text || attachment);
      draftHost._draft = keepDraft ? { text, gif: attachment } : null;
      // the unit's own pill shows what was left unsent
      if (fieldBtn) {
        const ph = fieldBtn.querySelector('.preply__ph');
        ph.textContent = hasDraft ? (text || 'GIF attached') : prompt;
        fieldBtn.classList.toggle('has-draft', !!hasDraft);
      }
      input.blur();
      input.value = '';
      attachment = null;
      refresh();
      if (unit) {
        unit.classList.remove('is-composing');
        unit.style.removeProperty('--lift');
        punit.classList.remove('is-focus');
      }
      scope.classList.remove('is-composing', 'is-locked');
      device.classList.remove('is-composing', 'is-keyboard-up', 'is-gifs-up');
      device.style.setProperty('--kb-h', '335px');
      nav.show();
      if (!sending && onClose) onClose();
    }
    const send = () => {
      if (!session) return;
      const text = input.value.trim();
      if (!text && !attachment) { close(); return; }
      const onSend = session.onSend;
      const payload = { text, gif: attachment };
      close(false, true);
      onSend(payload);
    };

    root.querySelector('.compose__emoji').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      input.value += b.textContent;
      refresh();
      if (!device.classList.contains('is-gifs-up')) input.focus({ preventScroll: true });
    });
    gifBtn.addEventListener('click', () => (device.classList.contains('is-gifs-up') ? showKeyboard() : showGifs()));
    grid.addEventListener('click', (e) => {
      const tile = e.target.closest('.compose__tile');
      if (!tile) return;
      attachment = GIFS[Number(tile.dataset.index)];
      thumb.src = attachment.src;
      refresh();
      showKeyboard();   // the picked GIF sits in the field and the keyboard comes back (1063:5870)
      placeSoon();      // the unit rides up to stay above the taller field
    });
    removeBtn.addEventListener('click', () => { attachment = null; refresh(); placeSoon(); });
    root.querySelectorAll('.compose__tool[data-tool]').forEach((b) => b.addEventListener('click', () => b.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1)' }], { duration: 180 })));   // photo and voice: not built yet
    input.addEventListener('input', refresh);
    input.addEventListener('focus', () => { if (session && !device.classList.contains('is-gifs-up') && !coarse()) device.classList.add('is-keyboard-up'); });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();   // the card's keys (space, arrows) stay out of the text
      if (e.key === 'Enter') { e.preventDefault(); send(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    sendBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    sendBtn.addEventListener('click', send);
    // taps inside the panel never count as "outside"
    root.addEventListener('pointerdown', (e) => { if (e.target.closest('.compose__gifs, .compose__panel')) e.stopPropagation(); });

    return { open, openNote, close, get active() { return !!session; } };
  })();

  // ── sent toasts ("mixtape sent" 1053:4536, "spot sent" 1062:4972): the card pops up over
  // the screen the send happened on, its art moves once, the Builds tab gets its badge, and
  // the card fades. Quick: the feed moves on about 1.3s after the tap.
  // one knob for the whole sequence: 1 is the pace signed off on 2026-10-29 (2 would be twice as fast)
  const CHEER_SPEED = 1;
  const ms = (n) => n / CHEER_SPEED;
  const buildsBtn = gnavItems[1];
  const buildsBadge = buildsBtn.querySelector('.gnav__badge');
  const buildsIcon = buildsBtn.querySelector('.gnav__icon');
  // tapping Builds clears the dot
  buildsBtn.addEventListener('click', () => buildsBtn.classList.remove('has-badge'));

  // the Builds badge drops in from just above its spot and bounces a couple of times:
  // a light "it went here", nothing travels across the screen
  function badgeBuilds() {
    buildsBtn.classList.add('has-badge');
    if (reduceMotion) return Promise.resolve();
    buildsIcon.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(1.5px)', offset: 0.4 },
      { transform: 'translateY(0)' },
    ], { duration: ms(260), delay: ms(120), easing: 'ease-out' });
    return buildsBadge.animate([
      { transform: 'translateY(-14px) scale(0.6)', opacity: 0, offset: 0, easing: 'cubic-bezier(0.5, 0, 1, 1)' },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.26, easing: 'cubic-bezier(0, 0, 0.4, 1)' },
      { transform: 'translateY(-6px) scale(1)', opacity: 1, offset: 0.5, easing: 'cubic-bezier(0.6, 0, 1, 1)' },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.7, easing: 'cubic-bezier(0, 0, 0.4, 1)' },
      { transform: 'translateY(-2.5px) scale(1)', opacity: 1, offset: 0.85, easing: 'cubic-bezier(0.6, 0, 1, 1)' },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 1 },
    ], { duration: ms(620) }).finished;
  }

  // kind: 'mix' (the note, after "Send it back") or 'msg' (the fuzzy heart, after a reply;
  // `preview` is the reply, shown in quotes under the title)
  function celebrate(card, kind = 'mix', preview = '') {
    const cheer = card.querySelector('.cheer');
    const toast = cheer.querySelector('.toast');
    const art = cheer.querySelector('.toast__art');
    const title = cheer.querySelector('.toast__title');
    const sub = cheer.querySelector('.toast__sub');
    toast.classList.remove('toast--mix', 'toast--msg');
    toast.classList.add(`toast--${kind}`);
    title.textContent = kind === 'msg' ? 'Message sent' : 'Mixtape sent';
    sub.textContent = kind === 'msg' && preview ? `\u201C${preview}\u201D` : '';
    cheer.classList.add('is-on');
    nav.show();   // the badge lands on the nav, so it has to be up
    if (reduceMotion) {
      cheer.style.opacity = 1;
      return wait(ms(900)).then(badgeBuilds).then(() => { cheer.style.opacity = ''; cheer.classList.remove('is-on'); });
    }
    const pop = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
    // the wrapper is shown at full opacity: fading an ancestor would hide the glass's
    // backdrop until the fade ends, so the card fades itself as it pops up and settles
    cheer.style.opacity = 1;
    toast.animate([
      { transform: 'scale(0.86) translateY(14px)', opacity: 0, offset: 0 },
      { transform: 'scale(0.95) translateY(6px)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.025) translateY(-2px)', opacity: 1, offset: 0.62 },
      { transform: 'scale(1) translateY(0)', opacity: 1, offset: 1 },
    ], { duration: ms(420), easing: pop, fill: 'forwards' });
    // the art moves once: the note bobs on its stem, the heart beats
    const inOut = 'cubic-bezier(0.45, 0, 0.55, 1)';
    const artFrames = kind === 'msg' ? [
      { transform: 'scale(0.8)', opacity: 0, offset: 0, easing: pop },
      { transform: 'scale(1)', opacity: 1, offset: 0.22, easing: inOut },
      { transform: 'scale(1.14)', opacity: 1, offset: 0.4, easing: inOut },
      { transform: 'scale(1)', opacity: 1, offset: 0.56, easing: inOut },
      { transform: 'scale(1.09)', opacity: 1, offset: 0.7, easing: inOut },
      { transform: 'scale(1)', opacity: 1, offset: 1 },
    ] : [
      { transform: 'rotate(-10deg) scale(0.8)', opacity: 0, offset: 0, easing: pop },
      { transform: 'rotate(-10deg) scale(1)', opacity: 1, offset: 0.2, easing: inOut },
      { transform: 'rotate(7deg) scale(1.04)', opacity: 1, offset: 0.48, easing: inOut },
      { transform: 'rotate(-3deg) scale(1)', opacity: 1, offset: 0.74, easing: inOut },
      { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 1 },
    ];
    art.animate(artFrames, { duration: ms(760), fill: 'forwards' });
    [title, sub].forEach((el, i) => el.animate([
      { opacity: 0, transform: `${i === 0 ? 'translateX(-50%) ' : ''}translateY(8px)` },
      { opacity: 1, transform: `${i === 0 ? 'translateX(-50%) ' : ''}translateY(0)` },
    ], { duration: ms(280), delay: ms(140 + i * 60), easing: pop, fill: 'backwards' }));
    wait(ms(480)).then(badgeBuilds);
    return wait(ms(1000)).then(() => toast.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(1.04)' },
    ], { duration: ms(220), easing: 'ease-in', fill: 'forwards' }).finished).then(() => {
      cheer.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      cheer.style.opacity = '';
      cheer.classList.remove('is-on');
    });
  }

  function buildCard(person) {
    const card = cardTpl.content.firstElementChild.cloneNode(true);
    if (person.placeholder) card.classList.add('card--placeholder');
    card.querySelector('.name__word').textContent = person.name;
    card.querySelector('.name__disc').src = person.disc;
    card.querySelector('.profile').innerHTML = profileHTML(person);

    // media stack
    const stack = card.querySelector('.card__media');
    const media = person.items.map((item) => {
      let el;
      if (item.type === 'video') {
        el = document.createElement('video');
        el.src = item.src;
        if (item.poster) el.poster = item.poster;
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.setAttribute('playsinline', '');
        el.preload = 'metadata';
        // No file yet? Keep the poster and behave like a photo.
        el.addEventListener('error', () => { item.type = 'photo'; el.dataset.broken = '1'; }, { once: true });
      } else if (item.fill) {
        el = document.createElement('div');
        el.className = 'media-item--fill';
        el.style.setProperty('--media-fill', item.fill);
        if (item.note) el.dataset.note = item.note;
      } else {
        el = document.createElement('img');
        el.src = item.src;
        el.alt = '';
        el.decoding = 'async';
      }
      el.classList.add('media-item');
      stack.appendChild(el);
      return el;
    });

    // dots: one per item; the active one is a 40px track with a progress fill
    const dots = card.querySelector('.dots');
    const dotEls = person.items.map((_, i) => {
      const d = document.createElement('div');
      d.className = 'dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Media ${i + 1} of ${person.items.length}`);
      const fill = document.createElement('div');
      fill.className = 'dot__fill';
      d.appendChild(fill);
      dots.appendChild(d);
      return d;
    });

    // rotation: fixed per person, independent of the carousel
    const playlist = card.querySelector('.playlist');
    person.rotation.forEach((track) => {
      const t = tileTpl.content.firstElementChild.cloneNode(true);
      t.querySelector('img').src = track.art;
      t.querySelector('img').alt = `${track.artist} — ${track.title}`;
      playlist.appendChild(t);
    });
    const mixTile = mixtapeTpl.content.firstElementChild.cloneNode(true);
    if (!person.mixtapeBuildId && person.rotation) mixTile.hidden = true;   // nothing of theirs to remix
    playlist.appendChild(mixTile);

    return { card, person, media, dotEls };
  }

  // what the mixtape tile says, from where the build between you stands
  function tileLabel(b, me) {
    if (!b) return 'Make it a<br>mixtape';
    if (b.status === 'agreed') return 'It\'s a<br>mixtape';
    if (b.status === 'as_is') return b.starter_id === me ? 'Loved it<br>· waiting' : 'They loved<br>it as is';
    return b.turn_id === me ? 'Your<br>turn' : 'Sent ·<br>their turn';
  }

  function controller({ card, person, media, dotEls }) {
    let index = 0;
    let active = false;        // card is the one in focus (snapped to)
    let photoTimer = 0;
    let controlTimer = 0;
    const playpause = card.querySelector('.playpause');
    const profile = card.querySelector('.profile');

    const current = () => ({ item: person.items[index], el: media[index] });

    const setProgress = (px) => dotEls[index].style.setProperty('--progress', `${px}px`);

    const pauseAll = () => media.forEach((el) => { if (el.tagName === 'VIDEO' && !el.paused) el.pause(); });

    // flash the play/pause indicator for a moment (reels-style), whatever the state
    const flashControl = () => {
      clearTimeout(controlTimer);
      card.classList.remove('is-controls-hidden');
      controlTimer = setTimeout(() => card.classList.add('is-controls-hidden'), CONTROL_LINGER_MS);
    };
    const hideControl = () => { clearTimeout(controlTimer); card.classList.add('is-controls-hidden'); };

    const show = (i) => {
      index = clamp(i, 0, person.items.length - 1);
      media.forEach((el, k) => el.classList.toggle('is-active', k === index));
      dotEls.forEach((d, k) => {
        const on = k === index;
        d.classList.toggle('is-active', on);
        d.classList.remove('is-timed');
        d.setAttribute('aria-selected', on ? 'true' : 'false');
        if (!on) d.style.removeProperty('--progress');
      });
      clearTimeout(photoTimer);
      hideControl();
      pauseAll();

      const { item, el } = current();
      const isVideo = item.type === 'video' && !el.dataset.broken;
      card.classList.toggle('is-photo', !isVideo);
      card.classList.remove('is-paused');
      playpause.setAttribute('aria-label', 'Pause');
      playpause.setAttribute('aria-pressed', 'false');

      if (isVideo) {
        el.currentTime = 0;
        setProgress(0);
        if (active) play();
      } else {
        // photos: the track fills over a few seconds, then holds
        setProgress(0);
        photoTimer = setTimeout(() => {
          dotEls[index].classList.add('is-timed');
          setProgress(40);
        }, 30);
      }
    };

    const play = () => {
      const { el } = current();
      if (el.tagName !== 'VIDEO' || el.dataset.broken) return;
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
      card.classList.remove('is-paused');
      playpause.setAttribute('aria-label', 'Pause');
      playpause.setAttribute('aria-pressed', 'false');
    };
    const pause = () => {
      const { el } = current();
      if (el.tagName !== 'VIDEO') return;
      el.pause();
      card.classList.add('is-paused');
      playpause.setAttribute('aria-label', 'Play');
      playpause.setAttribute('aria-pressed', 'true');
    };

    media.forEach((el) => {
      if (el.tagName !== 'VIDEO') return;
      el.addEventListener('timeupdate', () => {
        if (el !== current().el || !el.duration) return;
        setProgress(40 * (el.currentTime / el.duration));
      });
    });

    // tap zones: the sides step through the carousel, the centre toggles playback
    let suppressClick = false;
    const togglePlayback = () => {
      const { el } = current();
      if (el.tagName !== 'VIDEO' || el.dataset.broken) return;
      el.paused ? play() : pause();
      flashControl();
    };
    card.querySelectorAll('.tapzone').forEach((z) => {
      z.addEventListener('click', () => {
        if (suppressClick) return;
        if (z.dataset.step) show(index + Number(z.dataset.step));
        else togglePlayback();
      });
    });

    // keyboard, for desktop review
    card.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goToPage(feedPage() + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goToPage(feedPage() - 1); }
      else if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
    });

    // profile sheet
    // the nav only comes back once the slide has landed, so nothing shifts under it mid-slide
    let slideTimer = 0;
    const afterSlide = (fn) => {
      clearTimeout(slideTimer);
      const done = () => { clearTimeout(slideTimer); profile.removeEventListener('transitionend', onEnd); fn(); };
      const onEnd = (e) => { if (e.target === profile && e.propertyName === 'transform') done(); };
      profile.addEventListener('transitionend', onEnd);
      slideTimer = setTimeout(done, reduceMotion ? 0 : 650);
    };
    const openProfile = () => { profile.scrollTop = 0; collapse(); card.classList.add('is-profile-open'); device.classList.add('is-sheet-up'); profile.setAttribute('aria-hidden', 'false'); pause(); afterSlide(() => { if (card.classList.contains('is-profile-open')) { device.classList.add('is-nav-dark'); nav.show(); } }); };
    const closeProfile = (resumeVideo = true) => { if (compose.active) compose.close(); card.classList.remove('is-profile-open'); device.classList.remove('is-sheet-up'); profile.setAttribute('aria-hidden', 'true'); if (active && resumeVideo) play(); afterSlide(() => { if (!card.classList.contains('is-profile-open')) { device.classList.remove('is-nav-dark'); nav.show(); } }); };
    card.querySelector('.profile__back').addEventListener('click', closeProfile);
    profile.querySelector('.pbar__back').addEventListener('click', closeProfile);

    // header collapse: over the first 150px of scroll the cover nav fades out, the
    // bar fades in, and the big avatar + disc shrink into the bar's slot
    const COLLAPSE_PX = 150;
    const pbar = profile.querySelector('.pbar');
    const bigNav = profile.querySelector('.pcover__grad');
    const bigAvatar = profile.querySelector('.pavatar');
    const bigDisc = profile.querySelector('.pavatar-disc');
    const smallAvatar = profile.querySelector('.pbar__avatar');
    const BIG = { ax: 136, ay: 129, as: 130, dx: 230, dy: 220, ds: 40 };   // frame positions
    const SMALL = { ax: 66, ay: 60, as: 42, dx: 96, dy: 85, ds: 18 };     // bar: 20 + 36 + 10 in, 53 + 7 down
    let collapseTicking = false;
    const collapse = () => {
      collapseTicking = false;
      const y = profile.scrollTop;
      const p = clamp(y / COLLAPSE_PX, 0, 1);
      pbar.style.opacity = p;
      pbar.style.pointerEvents = p > 0.5 ? 'auto' : 'none';
      bigNav.style.opacity = 1 - p;
      const done = p >= 1;
      bigAvatar.style.visibility = done ? 'hidden' : 'visible';
      bigDisc.style.visibility = done ? 'hidden' : 'visible';
      smallAvatar.style.opacity = done ? 1 : 0;
      if (done) return;
      const sA = 1 - p * (1 - SMALL.as / BIG.as);
      const sD = 1 - p * (1 - SMALL.ds / BIG.ds);
      bigAvatar.style.transform = `translate(${(SMALL.ax - BIG.ax) * p}px, ${(SMALL.ay - (BIG.ay - y)) * p}px) scale(${sA})`;
      bigDisc.style.transform = `translate(${(SMALL.dx - BIG.dx) * p}px, ${(SMALL.dy - (BIG.dy - y)) * p}px) scale(${sD})`;
    };
    profile.addEventListener('scroll', () => {
      if (!collapseTicking) { collapseTicking = true; requestAnimationFrame(collapse); }
    }, { passive: true });
    collapse();
    nav.watch(profile);

    // prompts ("intro" 1062:5702): the GIF, photo and field pills open compose mode. Sending
    // follows the mixtape pattern: the toast plays here on the profile, then the profile
    // slides back to the feed and the feed moves on to the next person.
    const onReplySent = ({ text, gif }) => {
      celebrate(card, 'msg', text || (gif ? 'Sent a GIF' : '')).then(() => {
        closeProfile(false);
        return wait(600);
      }).then(() => {
        const next = card.nextElementSibling;
        if (next) { autoAdvancing = true; goToPage(cardIndex() + 1); }
        else resume();
      });
    };
    profile.querySelectorAll('.preply [data-compose]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const unit = btn.closest('.pquote');
        compose.open(unit, profile, 'text', onReplySent);
      });
    });

    // "Make it a mixtape" from the feed tile or the profile row opens the sheet;
    // the video holds while it is up and resumes after
    const hold = () => pause();
    const resume = () => { if (active && !card.classList.contains('is-profile-open')) play(); };
    const moveOn = () => {
      const next = card.nextElementSibling;
      if (next) { autoAdvancing = true; goToPage(cardIndex() + 1); }
      else resume();
    };
    // the tile and the profile row read the state of the build between you
    const mixTile = card.querySelector('.tile--mixtape');
    const mixRow = profile.querySelector('[data-action="mixtape"] .t-sub');
    const refresh = () => {
      const b = person.activeBuild;
      mixTile.querySelector('.tile__text').innerHTML = tileLabel(b, ME);
      mixRow.textContent = tileLabel(b, ME).replace('<br>', ' ');
      mixTile.classList.toggle('is-turn', !!b && b.status === 'open' && b.turn_id === ME);
      mixTile.classList.toggle('is-waiting', !!b && b.status !== 'agreed' && b.turn_id !== ME);
      mixTile.classList.toggle('is-agreed', !!b && b.status === 'agreed');
    };
    // sending: the profile (if up) and the sheet drop away, the toast plays over the
    // photo, then the feed moves on to the next person by itself. The database answers
    // first: if it refuses the turn, the sheet's rules were bent and the card stays.
    const onSent = async (items) => {
      const payload = items.map(window.SyncAPI.trackItem);
      try {
        const b = person.activeBuild;
        let next;
        if (b && b.status === 'open') next = await window.SyncAPI.sendTurn(b.id, payload);
        else if (b && b.status === 'as_is') next = await window.SyncAPI.counterAsIs(b.id, payload);
        else next = await window.SyncAPI.startBuild(person.mixtapeBuildId, payload);
        person.activeBuild = next;
        refresh();
      } catch (e) { notice(errText(e)); resume(); return; }
      if (card.classList.contains('is-profile-open')) closeProfile(false);
      celebrate(card, 'mix').then(moveOn);
    };
    const onAgree = async () => {
      try {
        const b = person.activeBuild;
        person.activeBuild = b.status === 'as_is' ? await window.SyncAPI.matchBack(b.id) : await window.SyncAPI.agree(b.id);
        refresh();
      } catch (e) { notice(errText(e)); resume(); return; }
      if (card.classList.contains('is-profile-open')) closeProfile(false);
      celebrate(card, person.activeBuild.status === 'agreed' ? 'msg' : 'mix', person.activeBuild.status === 'agreed' ? 'It\'s a mixtape' : 'Agreed. Their call now.').then(moveOn);
    };
    const openMixtape = (e) => {
      e.stopPropagation();
      const b = person.activeBuild;
      if (b && b.status === 'agreed') { notice('You two already made this one'); return; }
      if (b && b.turn_id !== ME) { notice(b.status === 'as_is' ? 'Waiting on them to match back' : 'Their turn. You\'ll hear when it\'s back.'); return; }
      hold();
      if (b) {
        // the live version, with your own adds marked
        person.sheetItems = b.items.map((t) => ({ ...t, added: t.by === ME }));
        openSheet(person, resume, onSent, {
          title: b.status === 'as_is' ? `${person.name} loved yours` : 'Your turn',
          sub: b.status === 'as_is' ? 'Match back, or counter with a change' : `Round ${b.round}. Change up to two things, or call it`,
          canAgree: true, onAgree, addLimit: 2,
        });
      } else {
        person.sheetItems = null;
        openSheet(person, resume, onSent);
      }
    };

    // a note from the like: compose opens over whatever is up (the profile, or the photo
    // itself, held still). Sending is "love it as is" on their mixtape: the note goes
    // with it, and they decide whether to match back.
    const note = () => {
      if (compose.active) return;
      if (person.activeBuild) { notice('You two already have a build going'); return; }
      if (!person.mixtapeBuildId) { notice('Nothing of theirs to love yet'); return; }
      const open = card.classList.contains('is-profile-open');
      if (!open) hold();
      compose.openNote(open ? profile : card, person.name, card, async ({ text, gif }) => {
        try {
          person.activeBuild = await window.SyncAPI.loveAsIs(person.mixtapeBuildId, text || (gif ? 'Sent a GIF' : 'Loved it as is'));
          refresh();
        } catch (e) { notice(errText(e)); resume(); return; }
        celebrate(card, 'msg', text || (gif ? 'Sent a GIF' : '')).then(() => {
          if (!card.classList.contains('is-profile-open')) return;
          closeProfile(false);
          return wait(600);
        }).then(moveOn);
      }, resume);
    };
    mixTile.addEventListener('click', openMixtape);
    profile.querySelector('[data-action="mixtape"]').addEventListener('click', openMixtape);
    wireRecordPlayers(profile.querySelector('.prow-list'), '.prow');
    refresh();

    // "Not interested" records the pass and moves on to the next person
    profile.querySelector('[data-action="not-interested"]').addEventListener('click', () => {
      window.SyncAPI.pass(person.id).catch((e) => notice(errText(e)));
      closeProfile();
      const next = card.nextElementSibling;
      if (next) goToPage(cardIndex() + 1);
    });

    // horizontal drag: a swipe either way pulls the profile in from the right edge (the user
    // thinks of it as swiping over to the right); when open, a swipe either way sends it back
    // a vertical one moves the feed with the finger and pages on release, like reels
    const cardIndex = () => [...feed.children].indexOf(card);
    const capture = (e) => { try { card.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ } };
    let drag = null;
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('.playlist')) return;   // the rotation row scrolls on its own
      if (e.target.closest('.preply')) return;     // the reply row's buttons are taps, not swipes
      drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, axis: null, id: e.pointerId, open: card.classList.contains('is-profile-open'), inProfile: !!e.target.closest('.profile'), vx: 0, vy: 0, lastX: e.clientX, lastY: e.clientY, lastT: e.timeStamp, startTop: feed.scrollTop };
      suppressClick = false;
    });
    card.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') { capture(e); profile.classList.add('is-dragging'); device.classList.add('is-sheet-up'); }
        else if (drag.inProfile) { drag = null; return; }   // the profile scrolls itself
        else { capture(e); stopPaging(); feed.classList.add('is-paging'); }
      }
      // running velocity estimate from the last two samples
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) { drag.vx = (e.clientX - drag.lastX) / dt; drag.vy = (e.clientY - drag.lastY) / dt; }
      drag.lastX = e.clientX; drag.lastY = e.clientY; drag.lastT = e.timeStamp;
      suppressClick = true;
      if (drag.axis === 'y') {
        drag.dy = dy;
        feed.scrollTop = drag.startTop - dy;   // the feed rides with the finger
        return;
      }
      drag.dx = dx;
      const w = card.clientWidth;
      const travel = Math.abs(dx);
      const x = drag.open ? clamp(travel, 0, w) : clamp(w - travel, 0, w);
      profile.style.transition = 'none';
      profile.style.transform = `translateX(${x}px)`;
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { dx, dy, axis, open, vx, vy, startTop } = drag;
      drag = null;
      profile.style.transition = '';
      profile.style.transform = '';
      // keep the sheet visible until the release animation has settled
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        // drop the drag class without re-triggering the visibility delay
        profile.style.transition = 'none';
        profile.classList.remove('is-dragging');
        void profile.offsetWidth;
        profile.style.transition = '';
      };
      profile.addEventListener('transitionend', settle, { once: true });
      setTimeout(settle, 650);
      if (axis === 'y') {
        settle();
        const h = feed.clientHeight;
        // the browser took the gesture over (native pan): stand aside; the feed's quiet-scroll settle lands it
        if (e.type === 'pointercancel') { stopPaging(); feed.classList.remove('is-paging'); setTimeout(() => { suppressClick = false; }, 0); return; }
        const base = Math.round(startTop / h);
        const flick = Math.abs(vy) > FLICK_VELOCITY && Math.abs(dy) > FLICK_MIN_PX;
        const far = Math.abs(dy) > h * 0.25;
        goToPage(flick || far ? base - Math.sign(dy) : base);
        setTimeout(() => { suppressClick = false; }, 0);
        return;
      }
      if (axis !== 'x') { settle(); return; }
      const w = card.clientWidth;
      const flick = Math.abs(vx) > FLICK_VELOCITY && Math.abs(dx) > FLICK_MIN_PX;
      const far = Math.abs(dx) > w * SWIPE_OPEN;
      if (!open && (far || flick)) openProfile();
      else if (open && (far || flick)) closeProfile();
      else if (!open) device.classList.remove('is-sheet-up');   // drag abandoned: bring the chrome back
      setTimeout(() => { suppressClick = false; }, 0);
    };
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);

    // a two-finger trackpad swipe arrives as wheel deltas, not pointer moves: a short
    // sideways burst toggles the profile, then locks until the gesture ends
    let wheelAcc = 0, wheelReset = 0, wheelLock = false;
    card.addEventListener('wheel', (e) => {
      if (e.target.closest('.playlist, .ptaste, .sheet')) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
      wheelAcc += e.deltaX;
      clearTimeout(wheelReset);
      wheelReset = setTimeout(() => { wheelAcc = 0; wheelLock = false; }, 220);
      if (wheelLock || Math.abs(wheelAcc) < 40) return;
      wheelLock = true;
      wheelAcc = 0;
      card.classList.contains('is-profile-open') ? closeProfile() : openProfile();
    }, { passive: true });

    show(0);

    return {
      card,
      note,
      person,
      refresh,
      activate() { active = true; card.focus({ preventScroll: true }); if (!card.classList.contains('is-profile-open')) play(); },
      deactivate() { active = false; pause(); card.classList.remove('is-paused'); hideControl(); },
    };
  }

  let cards = [];
  let ME = null;

  // ── paging: one person per gesture, moved by hand on the nav's curve (0.32, 0.72, 0, 1)
  // so the page and the nav's show/hide travel together, quicker than the browser's own snap
  const PAGE_MS = 480;
  const PAGE_EASE = cubicBezier(0.32, 0.72, 0, 1);
  let pageRaf = 0;
  function stopPaging() { if (pageRaf) cancelAnimationFrame(pageRaf); pageRaf = 0; }
  const pageTop = (i) => cards[i].card.offsetTop;   // the card's own offset, exact even when heights are fractional
  const nearestPage = () => clamp(Math.round(feed.scrollTop / feed.clientHeight), 0, cards.length - 1);
  function goToPage(i) {
    i = clamp(i, 0, cards.length - 1);
    const from = feed.scrollTop, to = pageTop(i);
    stopPaging();
    if (reduceMotion || Math.abs(to - from) < 1) { feed.classList.remove('is-paging'); feed.scrollTop = to; return; }
    feed.classList.add('is-paging');
    const start = performance.now();
    const step = (now) => {
      const p = clamp((now - start) / PAGE_MS, 0, 1);
      feed.scrollTop = from + (to - from) * PAGE_EASE(p);
      if (p < 1) { pageRaf = requestAnimationFrame(step); return; }
      pageRaf = 0;
      feed.scrollTop = to;
      feed.classList.remove('is-paging');
    };
    pageRaf = requestAnimationFrame(step);
  }
  // nothing else should move the feed, but if something does (a cancelled touch the browser took
  // over, a stray native scroll), it settles on the nearest person once the movement goes quiet
  let settleTimer = 0;
  feed.addEventListener('scroll', () => {
    if (feed.classList.contains('is-paging')) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (feed.classList.contains('is-paging')) return;
      const i = nearestPage();
      if (Math.abs(feed.scrollTop - pageTop(i)) > 1) goToPage(i);
    }, 120);
  }, { passive: true });
  // a trackpad or wheel swipe pages once per gesture: the first burst past a small threshold
  // moves, the rest of the gesture (and its momentum tail) is ignored until it goes quiet
  let wheelY = 0, wheelQuiet = 0, wheelTaken = false;
  feed.addEventListener('wheel', (e) => {
    if (e.target.closest('.profile, .sheet')) return;            // their own scrollers
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;        // sideways is the profile's
    e.preventDefault();
    clearTimeout(wheelQuiet);
    wheelQuiet = setTimeout(() => { wheelY = 0; wheelTaken = false; }, 160);
    if (wheelTaken) return;
    wheelY += e.deltaY;
    if (Math.abs(wheelY) < 24) return;
    wheelTaken = true;
    goToPage(feedPage() + Math.sign(wheelY));
  }, { passive: false });

  // whichever card is snapped into view is the one playing. The nav stays up on the feed
  // (its show/hide only runs on the profile's own scroll), so landing on a person never moves it
  let focused = null;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const c = cards.find((x) => x.card === en.target);
      if (en.intersectionRatio >= 0.6) {
        if (focused !== c) {
          autoAdvancing = false;
          if (focused) focused.deactivate();
          focused = c;
          c.activate();
        }
      } else if (focused === c) {
        c.deactivate();
        focused = null;
      }
    }
  }, { root: feed, threshold: [0, 0.6, 1] });

  document.addEventListener('visibilitychange', () => {
    if (!focused) return;
    document.hidden ? focused.deactivate() : focused.activate();
  });

  if (reduceMotion) document.documentElement.classList.add('reduce-motion');

  // ── sign-in and first run live in onboard.js; it draws into .device__auth and uses the mixtape sheet
  const authRoot = device.querySelector('.device__auth');
  window.SyncOnboard.init({ device, openSheet, focusSearch: () => sheetInput.focus({ preventScroll: true }), notice, errText, profileHTML });
  const ensureSignedIn = () => window.SyncOnboard.run();

  // ── boot: sign in, load the people, build the feed, then listen for builds moving
  async function boot() {
    const api = window.SyncAPI;
    const me = await ensureSignedIn();
    ME = me.id;
    const header = device.querySelector('.header__me img');
    if (me.avatar_path) { const u = await api.mediaUrls([me.avatar_path]); if (u[me.avatar_path]) header.src = u[me.avatar_path]; }
    device.querySelector('.header__me').addEventListener('click', async () => {
      const updated = await window.SyncOnboard.edit();
      if (updated && updated.avatar_path) { const u = await api.mediaUrls([updated.avatar_path]); if (u[updated.avatar_path]) header.src = u[updated.avatar_path]; }
    });
    let people;
    try { people = await api.peopleForFeed(); } catch (e) { notice(errText(e)); people = []; }
    if (!people.length) {
      feed.innerHTML = '<div class="feed__empty"><p>Nobody new right now.</p><p class="t-body-sm">You\'ve seen everyone in your orbit. Check back soon.</p></div>';
      return;
    }
    cards = people.map((p) => controller(buildCard(p)));
    cards.forEach((c) => feed.appendChild(c.card));
    cards.forEach((c) => io.observe(c.card));
    // builds moving: your turn lights the Builds dot and the person's tile; a match plays the toast
    api.watchBuilds(async (b) => {
      if (!b || !(b.starter_id === ME || b.owner_id === ME)) return;
      const other = b.starter_id === ME ? b.owner_id : b.starter_id;
      const c = cards.find((x) => x.person.id === other);
      const before = c && c.person.activeBuild;
      if (c) { c.person.activeBuild = b; c.refresh(); }
      if (b.status === 'agreed' && (!before || before.status !== 'agreed')) { badgeBuilds(); if (c) celebrate(c.card, 'msg', 'It\'s a mixtape'); }
      else if (b.turn_id === ME && (!before || before.turn_id !== ME)) badgeBuilds();
    });
  }
  boot().catch((e) => { console.error(e); notice(errText(e)); });
})();
