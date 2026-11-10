(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STORAGE_KEY = 'wishmap-viktor-v2';
  const IMAGE_DRAFT_KEY = 'wishmap-image-drafts-v1';
  const COLLAGE_KEY = 'wishmap-collage-layout-v1';
  const EXAMPLE_INBOX_KEY = 'wishmap-example-inbox-v1';
  const COLLAGE_SAVED_KEY = 'wishmap-collage-saved-v1';
  const GRID_COLS_KEY = 'wishmap-grid-columns-v1';
  const CARD_IMAGES = {
    dombay: 'assets/img/card-01.jpg',
    egypt: 'assets/img/card-02.jpg',
    pyatigorsk: 'assets/img/card-03.jpg',
    dolzhanka: 'assets/img/card-04.jpg',
    turkey: 'assets/img/card-05.jpg',
    vietnam: 'assets/img/card-06.jpg',
    yacht: 'assets/img/card-07.jpg',
    business: 'assets/img/card-08.jpg'
  };

  const SEED = [
    { id: 'income', title: 'Личный доход 1 000 000 ₽/мес', note: 'свыше, каждый месяц', month: 'Каждый месяц', category: 'business', image: 'assets/img/income.jpg', done: false },
    { id: 'love', title: 'Светлана · всегда рядом', note: 'моя девушка, живём и путешествуем вместе', month: 'Всегда', category: 'love', image: 'assets/img/love.jpg', done: false },
    { id: 'dombay', title: 'Домбай · Эльбрус · Архыз', note: 'горные лыжи', month: 'Февраль', category: 'travel', image: CARD_IMAGES.dombay, done: false },
    { id: 'egypt', title: 'Египет · 3 месяца', note: 'живу у Красного моря', month: 'Март — конец мая', category: 'travel', image: CARD_IMAGES.egypt, done: false },
    { id: 'pyatigorsk', title: 'Пятигорск · парапланы', note: '2–3 недели', month: 'Конец мая — начало июля', category: 'travel', image: CARD_IMAGES.pyatigorsk, done: false },
    { id: 'dolzhanka', title: 'Должанка', note: 'кайт-сёрфинг каждый день', month: 'Лето', category: 'travel', image: CARD_IMAGES.dolzhanka, done: false },
    { id: 'turkey', title: 'Турция · парапланы', note: '2–3 недели', month: 'Конец августа — начало сентября', category: 'travel', image: CARD_IMAGES.turkey, done: false },
    { id: 'vietnam', title: 'Вьетнам · 4 месяца', note: 'живу у океана', month: 'Сентябрь — конец декабря', category: 'travel', image: CARD_IMAGES.vietnam, done: false },
    { id: 'yacht', title: 'Яхты и кайты', note: 'вместе по морям', month: 'В путешествиях', category: 'travel', image: CARD_IMAGES.yacht, done: false },
    { id: 'business', title: 'Большой успешный бизнес в РФ', note: 'команда, регламенты, свобода', month: 'Всегда', category: 'business', image: CARD_IMAGES.business, done: false }
  ];

  const CATEGORY_LABEL = {
    travel: 'Путешествия и приключения',
    body: 'Тело и энергия',
    business: 'Дело и деньги',
    love: 'Любовь и люди',
    creativity: 'Творчество и смысл',
    dream: 'Другая мечта'
  };

  const CATEGORY_ORDER = ['travel', 'body', 'business', 'love', 'creativity', 'dream'];

  const CATEGORY_SHORT = {
    travel: 'Путешествие',
    body: 'Тело',
    business: 'Дело',
    love: 'Любовь',
    creativity: 'Творчество',
    dream: 'Мечта'
  };

  const EXAMPLES = window.WISH_EXAMPLES || [];
  const EXAMPLE_IMAGES = window.WISH_EXAMPLE_IMAGES || {};
  const BASE_BY_ID = Object.fromEntries(SEED.map((wish) => [wish.id, wish]));

  const state = {
    wishes: [],
    filter: 'all',
    exampleFilter: 'all',
    editingId: null,
    shared: false
  };

  let toastTimer = null;
  let lastFocused = null;
  let imageWishId = null;
  let deleteArmed = false;
  let deleteTimer = null;
  let draftTimer = null;
  let restoringDraft = false;
  let importArmed = false;
  let importTimer = null;
  let imageMethod = 'find';
  let imageStyle = 'cartoon';
  const FAL_PIN = '6620';
  const REMOTE_COMFY_URL = 'https://vik-laptop.tailebabca.ts.net:8443';
  const REMOTE_COMFY_PIN = '6620';
  let falUnlocked = false;

  const COLLAGE_LAYOUTS = {
    mosaic: { label: 'Классика · угловая мозаика' },
    grid: { label: 'Сетка · ровный ритм' },
    polaroid: { label: 'Полароиды · тёплые рамки' }
  };
  let collageLayout = 'mosaic';
  let gridColumns = 'current';
  try {
    const savedCollage = localStorage.getItem(COLLAGE_KEY);
    if (savedCollage && COLLAGE_LAYOUTS[savedCollage]) collageLayout = savedCollage;
    const savedCols = localStorage.getItem(GRID_COLS_KEY);
    if (['2', '4', 'current'].includes(savedCols)) gridColumns = savedCols;
  } catch {}

  const IMAGE_STYLES = {
    cartoon: {
      label: 'Мульт',
      placeholder: 'Например: пара на яхте в бирюзовой бухте, тёплый закат',
      style: 'hand-painted 2D cartoon illustration, warm cinematic palette, soft grain, storybook animation'
    },
    realistic: {
      label: 'Реалити',
      placeholder: 'Например: пара на яхте в бирюзовой бухте, тёплый закат',
      style: 'realistic editorial travel photograph, natural light, 35mm, warm film colors'
    },
    anime: {
      label: 'Аниме',
      placeholder: 'Например: герой на крыше Токио, неон, дождь',
      style: 'anime key visual, clean line art, expressive eyes, cinematic lighting, detailed background'
    },
    watercolor: {
      label: 'Акварель',
      placeholder: 'Например: горы в утреннем тумане, пастельные цвета',
      style: 'soft watercolor painting, paper texture, gentle washes, delicate ink lines'
    },
    neon: {
      label: 'Неон',
      placeholder: 'Например: ночной город, неоновые вывески, дождь',
      style: 'neon cyberpunk illustration, glowing magenta and cyan, wet asphalt reflections, cinematic night'
    },
    render3d: {
      label: '3D',
      placeholder: 'Например: уютный дом у моря, пластилиновый стиль',
      style: 'stylized 3D render, soft clay materials, cinematic depth of field, warm studio light'
    }
  };

  const IMAGE_METHODS = {
    find: { label: 'Найти', button: 'Найти кадр' },
    local: { label: 'Ноут', button: 'Сгенерировать' },
    fal: { label: 'FAL', button: 'FAL-кадр' }
  };

  const els = {
    grid: $('#wishGrid'),
    empty: $('#wishEmpty'),
    countAll: $('#countAll'),
    wishCount: $('#wishCount'),
    progressText: $('#progressText'),
    progressPct: $('#progressPct'),
    progressSub: $('#progressSub'),
    ring: $('#ringFill'),
    progressCard: $('#progressCard'),
    addButtons: $$('[data-add-wish], #openAddWish'),
    shareButtons: [$('#shareTop'), $('#shareWishes'), $('#shareManifesto')].filter(Boolean),
    shareBanner: $('#shareBanner'),
    importShared: $('#importShared'),
    shareModal: $('#shareModal'),
    shareLink: $('#shareLink'),
    copyShare: $('#copyShare'),
    nativeShare: $('#nativeShare'),
    wishModal: $('#wishModal'),
    wishForm: $('#wishForm'),
    wishModalTitle: $('#wishModalTitle'),
    wishModalKicker: $('#wishModalKicker'),
    wishTitle: $('#wishTitle'),
    wishNote: $('#wishNote'),
    wishMonth: $('#wishMonth'),
    wishCategory: $('#wishCategory'),
    deleteWish: $('#deleteWish'),
    imageModal: $('#imageModal'),
    imageWishLabel: $('#imageWishLabel'),
    imagePrompt: $('#imagePrompt'),
    imageDetails: $('#imageDetails'),
    imageCount: $('#imageCount'),
    imageGallery: $('#imageGallery'),
    imageGalleryWrap: $('#imageGalleryWrap'),
    generateImage: $('#generateImage'),
    imageStatus: $('#imageStatus'),
    falPinPanel: $('#falPinPanel'),
    falPin: $('#falPin'),
    unlockFal: $('#unlockFal'),
    falPinStatus: $('#falPinStatus'),
    copyImageRequest: $('#copyImageRequest'),
    toast: $('#toast')
  };

  const uid = () => `wish-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeWish(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || uid());
    const title = String(raw.title || '').trim().slice(0, 80);
    if (!title) return null;
    const category = ['travel', 'body', 'business', 'love', 'creativity', 'dream'].includes(raw.category) ? raw.category : 'dream';
    const base = BASE_BY_ID[id];
    return {
      id,
      title,
      note: String(raw.note || '').slice(0, 160),
      month: String(raw.month || '').slice(0, 50),
      category,
      image: typeof raw.image === 'string' && raw.image ? raw.image : (base ? base.image : ''),
      gallery: Array.isArray(raw.gallery) ? raw.gallery.filter((item) => typeof item === 'string').slice(0, 30) : [],
      done: Boolean(raw.done)
    };
  }

  function seedWishes() {
    return SEED.map((wish) => ({ ...wish }));
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedWishes();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.wishes)) return seedWishes();
      const wishes = parsed.wishes.map(normalizeWish).filter(Boolean);
      return wishes;
    } catch {
      return seedWishes();
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wishes: state.wishes, updatedAt: Date.now() }));
    } catch {
      showToast('Не удалось сохранить в браузере');
    }
  }

  /* ---------- share encoding ---------- */
  function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }

  function fromBase64Url(value) {
    let base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function shareableImage(image) {
    return typeof image === 'string' && (/^https?:\/\//.test(image) || /^assets\//.test(image));
  }

  function buildShareUrl() {
    const payload = {
      v: 1,
      name: 'Виктор + Светлана',
      wishes: state.wishes.map((wish) => ({
        id: wish.id,
        title: wish.title,
        note: wish.note,
        month: wish.month,
        category: wish.category,
        done: wish.done,
        image: shareableImage(wish.image) ? wish.image : ''
      }))
    };
    return `${location.origin}${location.pathname}?share=${toBase64Url(JSON.stringify(payload))}`;
  }

  function readSharedPayload() {
    const param = new URLSearchParams(location.search).get('share');
    if (!param) return null;
    try {
      const parsed = JSON.parse(fromBase64Url(param));
      if (!Array.isArray(parsed?.wishes)) return null;
      const wishes = parsed.wishes.map(normalizeWish).filter(Boolean);
      return wishes.length ? wishes : null;
    } catch {
      return null;
    }
  }

  /* ---------- rendering ---------- */
  function renderWishes() {
    if (!els.grid) return;
    const filter = state.filter;
    const visible = state.wishes.filter((wish) => {
      if (filter === 'all') return true;
      if (filter === 'planned') return !wish.done;
      if (filter === 'done') return wish.done;
      return wish.category === filter;
    });

    const cardHtml = (wish) => {
      const media = wish.image ? `<img class="wish-media-img" src="${escapeHtml(wish.image)}" alt="" loading="lazy" decoding="async">` : '';
      const doneClass = wish.done ? ' is-done' : '';
      const stamp = wish.done ? '<span class="wish-stamp">Сбылось</span>' : '';
      const edit = state.shared ? '' : `<button class="wish-edit" type="button" data-edit="${escapeHtml(wish.id)}" aria-label="Редактировать желание">✎</button>`;
      const galleryCount = Array.isArray(wish.gallery) ? wish.gallery.length : 0;
      const replaceLabel = galleryCount > 1 ? `Кадры · ${galleryCount}` : 'Заменить';
      return `
        <article class="wish-card${doneClass}" data-id="${escapeHtml(wish.id)}">
          <div class="wish-media${wish.image ? '' : ' no-image'}">${media}
            <span class="wish-cat">${CATEGORY_SHORT[wish.category] || 'Мечта'}</span>
            <button class="wish-check" type="button" data-check="${escapeHtml(wish.id)}" aria-pressed="${wish.done}" aria-label="${wish.done ? 'Вернуть в планы' : 'Отметить сбывшимся'}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>
            </button>
            ${stamp}
            <span class="wish-month">${escapeHtml(wish.month || 'Когда угодно')}</span>
            ${state.shared ? '' : `<button class="wish-replace" type="button" data-replace="${escapeHtml(wish.id)}" aria-label="Кадры желания">
              <span aria-hidden="true">✦</span> <span class="replace-label">${replaceLabel}</span>
            </button>`}
          </div>
          <div class="wish-body">
            <div class="wish-body-top">
              <h3>${escapeHtml(wish.title)}</h3>
              ${edit}
            </div>
            <p>${escapeHtml(wish.note || ' ')}</p>
          </div>
        </article>`;
    };

    let cards = '';
    if (filter === 'all') {
      cards = CATEGORY_ORDER.map((category, index) => {
        const items = visible.filter((wish) => wish.category === category);
        if (!items.length) return '';
        return `<div class="wish-group-head"><span>${String(index + 1).padStart(2, '0')}</span><h3>${CATEGORY_LABEL[category]}</h3><small>${items.length}</small></div>${items.map(cardHtml).join('')}`;
      }).join('');
    } else {
      cards = visible.map(cardHtml).join('');
    }

    const addCard = state.shared ? '' : `
      <button class="wish-add-card" type="button" data-add-wish>
        <div><span class="plus">+</span><h3>Новое желание</h3><p>Добавь то, что хочется прожить</p></div>
      </button>`;

    els.grid.innerHTML = cards + addCard;
    if (els.empty) els.empty.hidden = visible.length !== 0 || state.wishes.length !== 0;

    if (els.countAll) els.countAll.textContent = String(state.wishes.length);
    if (els.wishCount) {
      els.wishCount.textContent = visible.length === state.wishes.length
        ? `${state.wishes.length} ${plural(state.wishes.length, 'желание', 'желания', 'желаний')}`
        : `Показано ${visible.length} из ${state.wishes.length}`;
    }
    renderRoute();
    renderHero();
    renderCollage();
    updateProgress();
  }

  function renderRoute() {
    const track = $('#routeTrack');
    if (!track) return;
    track.innerHTML = state.wishes.map((wish) => `
      <article class="route-stop${wish.done ? ' is-done' : ''}" data-route-id="${escapeHtml(wish.id)}">
        <div class="route-image">
          ${wish.image ? `<img src="${escapeHtml(wish.image)}" alt="${escapeHtml(wish.title)}" loading="lazy">` : ''}
          <span class="route-check" aria-hidden="true">✓</span>
        </div>
        <div class="route-copy">
          <span class="route-month">${escapeHtml(wish.month || 'когда угодно')}</span>
          <h3>${escapeHtml(wish.title)}</h3>
          <p>${escapeHtml(wish.note || CATEGORY_LABEL[wish.category] || 'мечта')}</p>
        </div>
      </article>`).join('');
    const count = $('#routeCount');
    if (count) {
      const n = state.wishes.length;
      count.textContent = `${n} ${plural(n, 'остановка', 'остановки', 'остановок')} · 12 месяцев`;
    }
  }

  function renderHero() {
    const preferred = ['dombay', 'yacht', 'love'];
    const picks = [];
    preferred.forEach((id) => {
      const wish = state.wishes.find((item) => item.id === id);
      if (wish) picks.push(wish);
    });
    state.wishes.forEach((wish) => {
      if (picks.length < 3 && !picks.includes(wish)) picks.push(wish);
    });
    picks.slice(0, 3).forEach((wish, index) => {
      const number = index + 1;
      const image = $(`#deckImg${number}`);
      const month = $(`#deckMonth${number}`);
      const title = $(`#deckTitle${number}`);
      if (image) {
        image.src = wish.image || 'assets/img/card-01.jpg';
        image.alt = wish.title;
      }
      if (month) month.textContent = wish.month || 'когда угодно';
      if (title) title.textContent = wish.title;
    });
    const count = state.wishes.length;
    const categories = new Set(state.wishes.map((wish) => wish.category)).size;
    if ($('#deckCount')) $('#deckCount').textContent = String(count);
    if ($('#heroWishCount')) $('#heroWishCount').textContent = String(count);
    if ($('#heroCategoryCount')) $('#heroCategoryCount').textContent = String(categories);
    if ($('#heroCategoryLabel')) $('#heroCategoryLabel').textContent = plural(categories, 'категория', 'категории', 'категорий');
    if ($('#heroLead')) {
      $('#heroLead').textContent = `${count} ${plural(count, 'желание', 'желания', 'желаний')}, ${categories} ${plural(categories, 'категория', 'категории', 'категорий')} и 12 месяцев.`;
    }
  }

  function applyGridColumns() {
    if (!els.grid) return;
    els.grid.classList.remove('view-2', 'view-4');
    if (gridColumns === '2' || gridColumns === '4') els.grid.classList.add(`view-${gridColumns}`);
    $$('.view-quick-tab').forEach((button) => {
      const active = button.dataset.gridCols === gridColumns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderCollage() {
    if (!els.grid) return;
    els.grid.classList.remove('is-mosaic', 'is-grid', 'is-polaroid');
    els.grid.classList.add(`is-${collageLayout}`);
    $$('.collage-quick-tab').forEach((button) => {
      const active = button.dataset.collageLayout === collageLayout;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyGridColumns();
  }

  function exampleImage(example) {
    const images = EXAMPLE_IMAGES[example.category] || EXAMPLE_IMAGES.travel;
    const index = EXAMPLES.filter((item) => item.category === example.category).indexOf(example);
    return `assets/img/scenes/${images[index % images.length]}`;
  }

  function renderExamples() {
    const grid = $('#examplesGrid');
    if (!grid) return;
    const filter = state.exampleFilter;
    const visible = EXAMPLES.filter((example) => filter === 'all' || example.category === filter);
    grid.className = `wish-grid examples-grid is-${collageLayout}`;
    grid.innerHTML = visible.map((example) => {
      const exists = state.wishes.some((wish) => wish.title === example.title);
      return `
        <article class="wish-card example-card" data-example-id="${example.id}">
          <div class="wish-media">
            <img class="wish-media-img" src="${exampleImage(example)}" alt="${escapeHtml(example.title)}" loading="lazy" decoding="async">
            <span class="wish-cat">${escapeHtml(CATEGORY_SHORT[example.category] || 'Мечта')}</span>
          </div>
          <div class="wish-body">
            <div class="wish-body-top"><h3>${escapeHtml(example.title)}</h3></div>
            <p>${escapeHtml(example.note)}</p>
            <button class="example-add${exists ? ' is-added' : ''}" type="button" data-add-example="${example.id}">
              ${exists ? 'В моей карте' : '+ В мою карту'}
            </button>
          </div>
        </article>`;
    }).join('');
    if ($('#exampleCount')) $('#exampleCount').textContent = `${visible.length} ${plural(visible.length, 'идея', 'идеи', 'идей')}`;
    $$('.example-filter').forEach((button) => {
      const active = button.dataset.exampleFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function addExample(id) {
    const example = EXAMPLES.find((item) => item.id === id);
    if (!example) return;
    if (state.wishes.some((wish) => wish.title === example.title)) {
      showToast('Это желание уже есть в карте');
      return;
    }
    state.wishes.push({
      id: uid(),
      title: example.title,
      note: example.note,
      month: 'Когда-нибудь',
      category: example.category,
      image: exampleImage(example),
      done: false
    });
    saveLocal();
    renderWishes();
    renderExamples();
    showToast(`«${example.title}» добавлено в карту`);
  }

  function setCollageLayout(layout) {
    if (!COLLAGE_LAYOUTS[layout]) return;
    collageLayout = layout;
    try { localStorage.setItem(COLLAGE_KEY, layout); } catch {}
    renderWishes();
    renderExamples();
    showToast(`Коллаж: ${COLLAGE_LAYOUTS[layout].label}`);
  }

  function plural(number, one, few, many) {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  function updateProgress() {
    const total = state.wishes.length;
    const done = state.wishes.filter((wish) => wish.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    if (els.progressText) els.progressText.textContent = `${done} из ${total}`;
    if (els.progressPct) els.progressPct.textContent = `${percent}%`;
    if (els.ring) {
      const circumference = 2 * Math.PI * 52;
      els.ring.style.strokeDashoffset = String(circumference * (1 - percent / 100));
    }
    if (els.progressSub) {
      els.progressSub.textContent = total && done === total
        ? 'Всё сбылось. Можно добавлять новое.'
        : done === 0
          ? 'Отмечай то, что уже стало реальностью.'
          : `Осталось ${total - done}. Ты уже ближе.`;
    }
    els.progressCard?.classList.toggle('is-complete', total > 0 && done === total);
  }

  function setFilter(filter) {
    state.filter = filter;
    $$('.filter').forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderWishes();
  }

  /* ---------- actions ---------- */
  function toggleWish(id) {
    if (state.shared) {
      showToast('Это просмотр. Забери карту себе, чтобы отмечать.');
      return;
    }
    const wish = state.wishes.find((item) => item.id === id);
    if (!wish) return;
    const button = $(`[data-check="${CSS.escape(id)}"]`);
    const rect = button?.getBoundingClientRect();
    wish.done = !wish.done;
    saveLocal();
    renderWishes();
    if (wish.done) {
      if (rect) burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 58);
      const done = state.wishes.filter((item) => item.done).length;
      showToast(done === state.wishes.length ? 'Всё сбылось. Красиво.' : `Сбылось: ${wish.title}`);
      if (done === state.wishes.length) {
        window.setTimeout(() => burstConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 130), 350);
      }
    } else {
      showToast('Вернул в планы');
    }
  }

  function resetDeleteButton() {
    deleteArmed = false;
    if (deleteTimer) window.clearTimeout(deleteTimer);
    deleteTimer = null;
    if (els.deleteWish) {
      els.deleteWish.textContent = 'Удалить';
      els.deleteWish.classList.remove('is-armed');
    }
  }

  function openWishModal(mode, id = null) {
    if (state.shared) {
      showToast('Это просмотр. Забери карту себе, чтобы менять её.');
      return;
    }
    resetDeleteButton();
    state.editingId = mode === 'edit' ? id : null;
    const wish = state.editingId ? state.wishes.find((item) => item.id === id) : null;
    if (els.wishModalKicker) els.wishModalKicker.textContent = mode === 'edit' ? 'Редактировать' : 'Новое желание';
    if (els.wishModalTitle) els.wishModalTitle.textContent = mode === 'edit' ? 'Изменить' : 'Добавить';
    if (els.wishForm) els.wishForm.reset();
    if (els.wishTitle) els.wishTitle.value = wish?.title || '';
    if (els.wishNote) els.wishNote.value = wish?.note || '';
    if (els.wishMonth) els.wishMonth.value = wish?.month || '';
    if (els.wishCategory) els.wishCategory.value = wish?.category || 'travel';
    if (els.deleteWish) els.deleteWish.hidden = mode !== 'edit';
    openModal(els.wishModal);
    window.setTimeout(() => els.wishTitle?.focus(), 80);
  }

  function saveWish(event) {
    event.preventDefault();
    if (state.shared) return;
    const title = els.wishTitle?.value.trim() || '';
    if (!title) {
      showToast('Назови желание');
      return;
    }
    const data = {
      title,
      note: els.wishNote?.value.trim() || '',
      month: els.wishMonth?.value.trim() || '',
      category: els.wishCategory?.value || 'dream'
    };
    if (state.editingId) {
      const wish = state.wishes.find((item) => item.id === state.editingId);
      if (wish) Object.assign(wish, data);
      showToast('Желание обновлено');
    } else {
      state.wishes.push({ id: uid(), ...data, image: '', done: false });
      state.filter = 'all';
      showToast('Желание добавлено');
    }
    saveLocal();
    closeModal(els.wishModal);
    setFilter(state.filter);
  }

  function deleteWish() {
    if (!state.editingId || state.shared) return;
    const wish = state.wishes.find((item) => item.id === state.editingId);
    if (!wish) return;
    if (!deleteArmed) {
      deleteArmed = true;
      if (els.deleteWish) {
        els.deleteWish.textContent = 'Удалить?';
        els.deleteWish.classList.add('is-armed');
      }
      if (deleteTimer) window.clearTimeout(deleteTimer);
      deleteTimer = window.setTimeout(resetDeleteButton, 4000);
      showToast('Нажми «Удалить?» ещё раз');
      return;
    }
    resetDeleteButton();
    state.wishes = state.wishes.filter((item) => item.id !== state.editingId);
    saveLocal();
    closeModal(els.wishModal);
    renderWishes();
    showToast('Удалено');
  }

  /* ---------- image generation (no account) ---------- */
  function generateLabel() {
    return IMAGE_METHODS[imageMethod]?.button || 'Сделать кадр';
  }

  function updateGenerateButton() {
    if (els.generateImage && !els.generateImage.disabled) {
      els.generateImage.textContent = generateLabel();
    }
  }

  function setImageMethod(method) {
    if (!IMAGE_METHODS[method]) return;
    if (method === 'fal' && !falUnlocked) {
      if (els.falPinPanel) els.falPinPanel.hidden = false;
      if (els.falPinStatus) {
        els.falPinStatus.textContent = 'Введи PIN, чтобы открыть FAL-генерацию.';
        els.falPinStatus.classList.remove('is-error');
      }
      $$('.image-method').forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-checked', 'false');
      });
      window.setTimeout(() => els.falPin?.focus(), 60);
      return;
    }
    imageMethod = method;
    if (method !== 'fal') falUnlocked = false;
    $$('.image-method').forEach((button) => {
      const active = button.dataset.imageMethod === method;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    if (els.falPinPanel) els.falPinPanel.hidden = true;
    updateGenerateButton();
    saveImageDraft();
  }

  function setImageStyle(style) {
    if (!IMAGE_STYLES[style]) return;
    imageStyle = style;
    $$('.image-style').forEach((button) => {
      const active = button.dataset.imageStyle === style;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    if (els.imagePrompt) els.imagePrompt.placeholder = IMAGE_STYLES[style].placeholder;
    saveImageDraft();
  }

  function unlockFal() {
    const value = els.falPin?.value.trim() || '';
    if (value !== FAL_PIN) {
      if (els.falPinStatus) {
        els.falPinStatus.textContent = 'Неверный PIN. Попробуй ещё раз.';
        els.falPinStatus.classList.add('is-error');
      }
      els.falPin?.focus();
      els.falPin?.select();
      return;
    }
    falUnlocked = true;
    if (els.falPinStatus) {
      els.falPinStatus.textContent = 'FAL открыт. Теперь можно генерировать.';
      els.falPinStatus.classList.remove('is-error');
    }
    setImageMethod('fal');
    saveImageDraft();
    showToast('FAL-режим открыт');
  }

  function readImageDrafts() {
    try {
      return JSON.parse(localStorage.getItem(IMAGE_DRAFT_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function getImageDraft(id) {
    if (!id) return {};
    const draft = readImageDrafts()[id];
    return draft && typeof draft === 'object' ? draft : {};
  }

  function saveImageDraft() {
    if (!imageWishId || restoringDraft) return;
    if (draftTimer) window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(() => {
      try {
        const drafts = readImageDrafts();
        drafts[imageWishId] = {
          prompt: els.imagePrompt?.value || '',
          details: els.imageDetails?.value || '',
          method: imageMethod,
          style: imageStyle
        };
        localStorage.setItem(IMAGE_DRAFT_KEY, JSON.stringify(drafts));
      } catch {
        // текст не критичен для работы карты
      }
    }, 180);
  }

  function openImageModal(id) {
    if (state.shared) {
      showToast('Это просмотр. Забери карту себе, чтобы менять кадры.');
      return;
    }
    const wish = state.wishes.find((item) => item.id === id);
    if (!wish) return;
    imageWishId = id;
    ensureGallery(wish);
    renderGallery();
    if (els.imageWishLabel) {
      els.imageWishLabel.innerHTML = `Желание: <b>${escapeHtml(wish.title)}</b>. Выбери способ, вид и опиши кадр.`;
    }
    const draft = getImageDraft(id);
    restoringDraft = true;
    if (els.imagePrompt) els.imagePrompt.value = draft.prompt || '';
    if (els.imageDetails) els.imageDetails.value = draft.details || '';
    if (els.imageStatus) {
      els.imageStatus.textContent = 'Без аккаунта. Текст сохраняется для этого желания.';
      els.imageStatus.classList.remove('is-error');
    }
    falUnlocked = false;
    if (els.falPinPanel) els.falPinPanel.hidden = true;
    if (els.falPin) els.falPin.value = '';
    if (draft.method === 'fal') {
      imageMethod = 'find';
      falUnlocked = false;
      setImageMethod('fal');
    } else {
      setImageMethod(draft.method || 'find');
    }
    setImageStyle(draft.style || 'cartoon');
    restoringDraft = false;
    openModal(els.imageModal);
    window.setTimeout(() => els.imagePrompt?.focus(), 80);
  }

  const FALLBACK_IMAGES = [
    'assets/img/scenes/scene-yacht.jpg',
    'assets/img/scenes/scene-vietnam.jpg',
    'assets/img/scenes/scene-ski.jpg',
    'assets/img/scenes/scene-egypt.jpg',
    'assets/img/scenes/scene-turkey.jpg',
    'assets/img/scenes/scene-pyatigorsk.jpg',
    'assets/img/scenes/scene-dolzhanka.jpg',
    'assets/img/scenes/scene-love.jpg',
    'assets/img/scenes/scene-business.jpg',
    'assets/img/scenes/scene-income.jpg'
  ];

  async function translateToEnglish(text) {
    if (!text) return '';
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch(
        'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=ru|en',
        { signal: controller.signal }
      );
      window.clearTimeout(timer);
      const data = await response.json();
      const translated = data?.responseData?.translatedText;
      return typeof translated === 'string' && translated ? translated : text;
    } catch {
      return text;
    }
  }

  function loadImage(url, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = window.setTimeout(() => reject(new Error('timeout')), timeout);
      image.onload = () => {
        window.clearTimeout(timer);
        resolve(url);
      };
      image.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('image error'));
      };
      image.src = url;
    });
  }

  async function compactImage(url) {
    if (!url || !url.startsWith('data:image/')) return url;
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(640 / image.width, 800 / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, (640 - w) / 2, (800 - h) / 2, w, h);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return url;
    }
  }

  async function searchCommons(text) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${text} filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: '12',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '800',
      format: 'json',
      origin: '*'
    });
    const response = await fetch('https://commons.wikimedia.org/w/api.php?' + params.toString());
    if (!response.ok) throw new Error('commons');
    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return [];
    return Object.values(pages)
      .map((page) => {
        const info = page?.imageinfo?.[0];
        return {
          url: info?.thumburl,
          title: page?.title || '',
          width: Number(info?.thumbwidth) || 0,
          height: Number(info?.thumbheight) || 0
        };
      })
      .filter((item) => item.url && !/(stamp|logo|map|diagram|poster|cover|plaque|sign)/i.test(item.title));
  }

  async function findCommonsImage(query) {
    const english = await translateToEnglish(query);
    const words = english.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 3);
    const queries = [...new Set([
      english,
      words.slice(0, 5).join(' '),
      words.slice(0, 3).join(' '),
      query
    ].map((item) => item.trim()).filter(Boolean))];

    for (const text of queries) {
      const candidates = await searchCommons(text);
      if (!candidates.length) continue;
      const portrait = candidates.filter((item) => item.height >= item.width * 1.05);
      const pool = portrait.length ? portrait : candidates;
      return pool[Math.floor(Math.random() * Math.min(pool.length, 6))].url;
    }
    throw new Error('nothing found in internet');
  }

  function fallbackImage(wish) {
    const options = FALLBACK_IMAGES.filter((url) => url !== wish?.image);
    return options[Math.floor(Math.random() * options.length)] || FALLBACK_IMAGES[0];
  }

  function setGenerateBusy(busy, text) {
    if (els.generateImage) {
      els.generateImage.disabled = busy;
      els.generateImage.textContent = busy ? (imageMethod === 'find' ? 'Ищу кадр…' : 'Генерирую…') : generateLabel();
    }
    if (els.imageStatus && text) {
      els.imageStatus.textContent = text;
      els.imageStatus.classList.remove('is-error');
    }
  }

  async function pollComfyJob(base, jobId, headers, signal) {
    while (true) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      const poll = await fetch(`${base}/status/${jobId}`, { headers, signal });
      if (!poll.ok) throw new Error('comfy status ' + poll.status);
      const state = await poll.json();
      if (state.status === 'done' && state.url) {
        await loadImage(state.url, 30000);
        return state.url;
      }
      if (state.status === 'error') throw new Error(state.error || 'comfy error');
    }
  }

  async function startComfy(base, prompt, headers, timeout, seed) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${base}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, seed }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('comfy start ' + response.status);
      const started = await response.json();
      if (started?.url) {
        await loadImage(started.url, 30000);
        return started.url;
      }
      if (!started?.job_id) throw new Error('comfy no job');
      return await pollComfyJob(base, started.job_id, headers, controller.signal);
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function remoteGenerate(prompt, seed) {
    return startComfy(
      REMOTE_COMFY_URL,
      prompt,
      { 'Content-Type': 'application/json', 'X-Wishmap-Pin': REMOTE_COMFY_PIN },
      180000,
      seed
    );
  }

  async function localGenerate(prompt, seed) {
    try {
      const url = await startComfy(
        'http://127.0.0.1:8190',
        prompt,
        { 'Content-Type': 'application/json', 'X-Wishmap-Pin': REMOTE_COMFY_PIN },
        180000,
        seed
      );
      return { url, via: 'local' };
    } catch {
      const url = await remoteGenerate(prompt, seed);
      return { url, via: 'remote' };
    }
  }

  async function falGenerate(prompt) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch('http://127.0.0.1:8189/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: FAL_PIN, prompt }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('fal bridge ' + response.status);
      const data = await response.json();
      if (!data?.url) throw new Error('fal no image');
      await loadImage(data.url, 30000);
      return data.url;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function buildImageRequestText() {
    const wish = state.wishes.find((item) => item.id === imageWishId);
    return [
      'Описание нового кадра',
      `Желание: ${wish?.title || '—'}`,
      `Способ: ${IMAGE_METHODS[imageMethod].label}`,
      `Вид: ${IMAGE_STYLES[imageStyle].label}`,
      `Промпт: ${els.imagePrompt?.value.trim() || '—'}`,
      els.imageDetails?.value.trim() ? `Детали: ${els.imageDetails.value.trim()}` : ''
    ].filter(Boolean).join('\n');
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      scratch.remove();
    }
    showToast(successMessage);
  }

  function ensureGallery(wish) {
    if (!Array.isArray(wish.gallery)) wish.gallery = [];
    if (wish.image && !wish.gallery.includes(wish.image)) wish.gallery.unshift(wish.image);
    wish.gallery = [...new Set(wish.gallery)].slice(0, 30);
  }

  function renderGallery() {
    const wrap = $('#imageGalleryWrap');
    const grid = $('#imageGallery');
    if (!wrap || !grid) return;
    const wish = state.wishes.find((item) => item.id === imageWishId);
    if (!wish || !wish.gallery?.length) {
      wrap.hidden = true;
      grid.innerHTML = '';
      return;
    }
    wrap.hidden = false;
    grid.innerHTML = wish.gallery.map((url, index) => `
      <figure class="gallery-item${url === wish.image ? ' is-current' : ''}">
        <img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async">
        <figcaption>
          <button class="gallery-use" type="button" data-gallery-use="${index}">${url === wish.image ? 'Стоит' : 'Поставить'}</button>
          <button class="gallery-delete" type="button" data-gallery-delete="${index}" aria-label="Удалить кадр">×</button>
        </figcaption>
      </figure>`).join('');
  }

  async function generateSingle(fullPrompt, prompt, details, wish, seed) {
    let imageUrl = null;
    let used = '';

    if (imageMethod === 'local') {
      try {
        const local = await localGenerate(fullPrompt, seed);
        imageUrl = local.url;
        used = local.via;
      } catch {
        imageUrl = null;
      }
    }

    if (imageMethod === 'fal') {
      try {
        imageUrl = await falGenerate(fullPrompt);
        used = 'fal';
      } catch {
        imageUrl = null;
      }
    }

    if (!imageUrl && imageMethod !== 'find') {
      try {
        const candidate = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(fullPrompt) +
          `?width=640&height=800&seed=${seed}&nologo=true`;
        imageUrl = await loadImage(candidate, 40000);
        used = 'generated';
      } catch {
        imageUrl = null;
      }
    }

    if (!imageUrl) {
      const query = [prompt, details].filter(Boolean).join(' ') || wish.title;
      try {
        imageUrl = await findCommonsImage(query);
        await loadImage(imageUrl);
        used = 'photo';
      } catch {
        if (imageMethod === 'find') throw new Error('nothing found in internet');
        imageUrl = fallbackImage(wish);
        used = 'fallback';
      }
    }
    return { url: imageUrl, used };
  }

  async function generateImage() {
    const prompt = els.imagePrompt?.value.trim() || '';
    if (!prompt) {
      showToast('Опиши, что должно быть на кадре');
      els.imagePrompt?.focus();
      return;
    }
    if (imageMethod === 'fal' && !falUnlocked) {
      setImageMethod('fal');
      return;
    }
    const wish = state.wishes.find((item) => item.id === imageWishId);
    if (!wish) return;
    ensureGallery(wish);

    const details = els.imageDetails?.value.trim() || '';
    const style = IMAGE_STYLES[imageStyle];
    const count = Math.min(10, Math.max(1, Number(els.imageCount?.value) || 1));
    setGenerateBusy(true, imageMethod === 'find' ? 'Ищу кадры…' : 'Генерирую кадры…');

    const english = await translateToEnglish([prompt, details].filter(Boolean).join('. '));
    const fullPrompt = [english, style.style, 'vertical 4:5 composition, no text, no letters, no watermark, no logo']
      .filter(Boolean).join('. ');

    const results = [];
    const variations = [
      'wide establishing shot, different composition',
      'closer angle, different light',
      'alternate framing, slightly different moment',
      'different camera position, new details'
    ];
    for (let index = 0; index < count; index += 1) {
      if (els.imageStatus) {
        els.imageStatus.textContent = `Генерирую ${index + 1} из ${count}…`;
        els.imageStatus.classList.remove('is-error');
      }
      try {
        const seed = Math.floor(Math.random() * 2_000_000_000);
        const variantPrompt = `${fullPrompt}. Variation ${index + 1}: ${variations[index % variations.length]}.`;
        const result = await generateSingle(variantPrompt, prompt, details, wish, seed);
        if (result?.url) results.push(result);
      } catch {
        // пробуем следующий вариант
      }
    }

    if (!results.length) {
      setGenerateBusy(false);
      if (els.imageStatus) {
        els.imageStatus.textContent = 'Не получилось получить ни один кадр. Попробуй ещё раз.';
        els.imageStatus.classList.add('is-error');
      }
      showToast('Кадры не получились');
      return;
    }

    const uniqueResults = [...new Set(results.map((item) => item.url))];
    saveImageDraft();
    if (imageMethod === 'fal') falUnlocked = false;
    wish.gallery = [...new Set([...uniqueResults, ...(wish.gallery || [])])].slice(0, 30);
    wish.image = uniqueResults[0];
    saveLocal();
    renderWishes();
    renderGallery();
    setGenerateBusy(false);
    if (els.imageStatus) {
      els.imageStatus.textContent = `Готово: ${uniqueResults.length}. Выбери кадр из галереи.`;
      els.imageStatus.classList.remove('is-error');
    }
    showToast(`Добавлено вариантов: ${uniqueResults.length}`);
  }

  function copyImageRequest() {
    copyText(buildImageRequestText(), 'Описание скопировано — можно вставить в чат');
  }

  /* ---------- share ---------- */
  function openShareModal() {
    if (!els.shareModal) return;
    if (els.shareLink) els.shareLink.value = buildShareUrl();
    openModal(els.shareModal);
  }

  async function copyShareLink() {
    const value = els.shareLink?.value || buildShareUrl();
    try {
      await navigator.clipboard.writeText(value);
      showToast('Ссылка скопирована');
    } catch {
      els.shareLink?.focus();
      els.shareLink?.select();
      try {
        document.execCommand('copy');
        showToast('Ссылка скопирована');
      } catch {
        showToast('Скопируй ссылку вручную');
      }
    }
  }

  async function nativeShare() {
    const url = els.shareLink?.value || buildShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Карта желаний',
          text: 'Моя карта желаний — посмотри и забери себе.',
          url
        });
        return;
      } catch {
        // пользователь отменил — не показываем ошибку
        return;
      }
    }
    copyShareLink();
  }

  function importShared() {
    if (!state.shared) return;
    let existing = null;
    try { existing = localStorage.getItem(STORAGE_KEY); } catch {}
    if (existing && !importArmed) {
      importArmed = true;
      if (els.importShared) els.importShared.textContent = 'Заменить мою карту?';
      if (importTimer) window.clearTimeout(importTimer);
      importTimer = window.setTimeout(() => {
        importArmed = false;
        if (els.importShared) els.importShared.textContent = 'Забрать себе';
      }, 4000);
      showToast('Нажми ещё раз, чтобы заменить свою карту');
      return;
    }
    if (importTimer) window.clearTimeout(importTimer);
    try {
      if (existing) localStorage.setItem('wishmap-viktor-backup', existing);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wishes: state.wishes, updatedAt: Date.now() }));
    } catch {
      showToast('Не удалось сохранить карту в браузере');
      return;
    }
    importArmed = false;
    if (els.importShared) els.importShared.textContent = 'Забрать себе';
    state.shared = false;
    document.body.classList.remove('is-shared');
    if (els.shareBanner) els.shareBanner.hidden = true;
    history.replaceState({}, '', location.pathname);
    renderWishes();
    showToast(existing ? 'Карта заменена. Старая копия сохранена' : 'Карта сохранена. Теперь можно отмечать');
  }

  /* ---------- modals ---------- */
  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => ($('input:not([type=hidden]), textarea, select', modal) || $('button', modal))?.focus(), 80);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      if (!modal.classList.contains('is-open')) modal.hidden = true;
    }, 320);
    if (!$('.modal.is-open')) document.body.classList.remove('modal-open');
    if (modal === els.imageModal) imageWishId = null;
    state.editingId = null;
    lastFocused?.focus?.();
  }

  /* ---------- toast / confetti ---------- */
  function showToast(message) {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), 2600);
  }

  const confettiCanvas = $('#confetti');
  const ctx = confettiCanvas?.getContext('2d');
  let particles = [];
  let confettiFrame = 0;

  function sizeCanvas() {
    if (!confettiCanvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    confettiCanvas.width = Math.round(window.innerWidth * dpr);
    confettiCanvas.height = Math.round(window.innerHeight * dpr);
    confettiCanvas.style.width = `${window.innerWidth}px`;
    confettiCanvas.style.height = `${window.innerHeight}px`;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burstConfetti(x, y, amount = 50) {
    if (!ctx || reduceMotion.matches) return;
    const colors = ['#c9a063', '#e5c793', '#f4ebdc', '#c26a49', '#7d9b83'];
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.25
      });
    }
    if (!confettiFrame) animateConfetti();
  }

  function animateConfetti() {
    if (!ctx || !confettiCanvas) return;
    confettiFrame = requestAnimationFrame(animateConfetti);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.vy += 0.14;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= p.decay;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    if (!particles.length) {
      cancelAnimationFrame(confettiFrame);
      confettiFrame = 0;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  /* ---------- header / navigation ---------- */
  const header = $('#header');
  const nav = $('#nav');
  const menuToggle = $('.menu-toggle');
  const navLinks = $$('.nav a');

  function onScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  menuToggle?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach((link) => link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const sectionIds = ['wishes', 'route', 'video-map', 'video', 'foundation', 'how'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------- reveal ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  document.addEventListener('keydown', (event) => {
    const modal = $('.modal.is-open');
    if (event.key === 'Escape') {
      closeModal(modal);
      document.body.classList.remove('nav-open');
      return;
    }
    if (event.key !== 'Tab' || !modal) return;
    const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal)
      .filter((item) => item.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- video ---------- */
  $$('.video-shell').forEach((shell) => {
    const video = shell.querySelector('video');
    const play = shell.querySelector('.video-play');
    play?.addEventListener('click', async () => {
      if (!video) return;
      video.controls = true;
      shell.classList.add('is-playing');
      try {
        await video.play();
      } catch {
        shell.classList.remove('is-playing');
        showToast('Нажми Play в плеере видео');
      }
    });
    video?.addEventListener('play', () => shell.classList.add('is-playing'));
  });

  /* ---------- one FAL film ---------- */
  const falFilm = $('#falFilmVideo');
  const falExpand = $('#falExpand');
  const falChapters = $$('.fal-chapter');
  const chapterTimes = falChapters.map((button) => Number(button.dataset.start) || 0);

  async function enterFullscreen() {
    if (!falFilm) return;
    try {
      if (falFilm.requestFullscreen) {
        await falFilm.requestFullscreen();
      } else if (falFilm.webkitEnterFullscreen) {
        falFilm.webkitEnterFullscreen();
      } else if (falFilm.webkitRequestFullscreen) {
        falFilm.webkitRequestFullscreen();
      } else {
        showToast('Полный экран доступен через кнопку в плеере');
      }
    } catch {
      showToast('Нажми кнопку полного экрана в плеере');
    }
  }

  falExpand?.addEventListener('click', enterFullscreen);
  falFilm?.addEventListener('dblclick', enterFullscreen);

  falChapters.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (!falFilm) return;
      falFilm.currentTime = chapterTimes[index];
      falFilm.play().catch(() => {});
      falChapters.forEach((item) => item.classList.toggle('is-active', item === button));
    });
  });

  falFilm?.addEventListener('timeupdate', () => {
    if (!falChapters.length) return;
    let active = 0;
    chapterTimes.forEach((time, index) => {
      if (falFilm.currentTime + 0.1 >= time) active = index;
    });
    falChapters.forEach((button, index) => button.classList.toggle('is-active', index === active));
  });

  /* ---------- bindings ---------- */
  els.grid?.addEventListener('click', (event) => {
    const replace = event.target.closest('[data-replace]');
    if (replace) {
      openImageModal(replace.dataset.replace);
      return;
    }
    const check = event.target.closest('[data-check]');
    if (check) {
      toggleWish(check.dataset.check);
      return;
    }
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      openWishModal('edit', edit.dataset.edit);
      return;
    }
    if (event.target.closest('[data-add-wish]')) openWishModal('add');
  });

  els.addButtons.forEach((button) => button.addEventListener('click', () => openWishModal('add')));
  els.shareButtons.forEach((button) => button.addEventListener('click', openShareModal));
  els.copyShare?.addEventListener('click', copyShareLink);
  els.nativeShare?.addEventListener('click', nativeShare);
  els.importShared?.addEventListener('click', importShared);
  els.wishForm?.addEventListener('submit', saveWish);
  els.deleteWish?.addEventListener('click', deleteWish);
  $$('.collage-tab, .collage-quick-tab').forEach((button) => {
    button.addEventListener('click', () => setCollageLayout(button.dataset.collageLayout));
  });
  $$('.view-quick-tab').forEach((button) => {
    button.addEventListener('click', () => {
      gridColumns = button.dataset.gridCols || 'current';
      try { localStorage.setItem(GRID_COLS_KEY, gridColumns); } catch {}
      applyGridColumns();
    });
  });
  $('#saveCollageView')?.addEventListener('click', () => {
    try {
      localStorage.setItem(COLLAGE_KEY, collageLayout);
      localStorage.setItem(COLLAGE_SAVED_KEY, JSON.stringify({ layout: collageLayout, savedAt: Date.now() }));
    } catch {
      showToast('Не удалось сохранить вид');
      return;
    }
    const button = $('#saveCollageView');
    if (button) {
      button.textContent = 'Вид сохранён';
      button.classList.add('is-saved');
      window.setTimeout(() => {
        button.textContent = 'Сохранить вид';
        button.classList.remove('is-saved');
      }, 2200);
    }
    showToast(`Сохранён вид: ${COLLAGE_LAYOUTS[collageLayout].label}`);
  });
  $$('.example-filter').forEach((button) => {
    button.addEventListener('click', () => {
      state.exampleFilter = button.dataset.exampleFilter;
      renderExamples();
    });
  });
  $('#examplesGrid')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-example]');
    if (button) addExample(button.dataset.addExample);
  });

  $('#imageGallery')?.addEventListener('click', (event) => {
    const use = event.target.closest('[data-gallery-use]');
    const remove = event.target.closest('[data-gallery-delete]');
    const wish = state.wishes.find((item) => item.id === imageWishId);
    if (!wish) return;
    if (use) {
      const index = Number(use.dataset.galleryUse);
      if (wish.gallery?.[index]) {
        wish.image = wish.gallery[index];
        saveLocal();
        renderWishes();
        renderGallery();
        showToast('Кадр выбран');
      }
      return;
    }
    if (remove) {
      const index = Number(remove.dataset.galleryDelete);
      const removed = wish.gallery?.[index];
      if (!removed) return;
      wish.gallery.splice(index, 1);
      if (wish.image === removed) wish.image = wish.gallery[0] || '';
      saveLocal();
      renderWishes();
      renderGallery();
      showToast('Кадр удалён');
    }
  });

  els.imagePrompt?.addEventListener('input', saveImageDraft);
  els.imageDetails?.addEventListener('input', saveImageDraft);
  els.generateImage?.addEventListener('click', generateImage);
  els.unlockFal?.addEventListener('click', unlockFal);
  els.falPin?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      unlockFal();
    }
  });
  els.copyImageRequest?.addEventListener('click', copyImageRequest);
  $$('.image-method').forEach((button) => {
    button.addEventListener('click', () => setImageMethod(button.dataset.imageMethod));
  });
  $$('.image-style').forEach((button) => {
    button.addEventListener('click', () => setImageStyle(button.dataset.imageStyle));
  });

  $$('.filter').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  $$('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal')));
  });
  $$('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });
  window.addEventListener('resize', sizeCanvas);
  sizeCanvas();

  function consumeExampleInbox() {
    if (state.shared) return;
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem(EXAMPLE_INBOX_KEY) || '[]');
    } catch {
      return;
    }
    if (!Array.isArray(ids) || !ids.length) return;
    let added = 0;
    ids.forEach((id) => {
      const example = EXAMPLES.find((item) => item.id === id);
      if (!example) return;
      if (state.wishes.some((wish) => wish.title === example.title)) return;
      state.wishes.push({
        id: uid(),
        title: example.title,
        note: example.note,
        month: 'Когда-нибудь',
        category: example.category,
        image: exampleImage(example),
        done: false
      });
      added += 1;
    });
    if (added) saveLocal();
    try { localStorage.removeItem(EXAMPLE_INBOX_KEY); } catch {}
    if (added) showToast(`Добавлено из примеров: ${added}`);
  }

  /* ---------- init ---------- */
  const sharedWishes = readSharedPayload();
  if (sharedWishes) {
    state.shared = true;
    state.wishes = sharedWishes;
    document.body.classList.add('is-shared');
    if (els.shareBanner) els.shareBanner.hidden = false;
    if (els.progressSub) els.progressSub.textContent = 'Так выглядит карта Виктора.';
  } else {
    state.wishes = loadLocal();
    consumeExampleInbox();
  }
  renderWishes();
  renderExamples();
  setFilter('all');
})();
