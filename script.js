(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STORAGE_KEY = 'wishmap-viktor-v2';
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
    travel: 'Путешествие',
    business: 'Дело',
    love: 'Любовь',
    dream: 'Мечта'
  };

  const BASE_BY_ID = Object.fromEntries(SEED.map((wish) => [wish.id, wish]));

  const state = {
    wishes: [],
    filter: 'all',
    editingId: null,
    shared: false
  };

  let toastTimer = null;
  let lastFocused = null;
  let imageWishId = null;
  let imageMethod = 'find';
  let imageStyle = 'cartoon';
  const FAL_PIN = '6620';
  let falUnlocked = false;
  try { falUnlocked = sessionStorage.getItem('wishmap-fal-unlocked') === '1'; } catch {}

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
    const category = ['travel', 'business', 'love', 'dream'].includes(raw.category) ? raw.category : 'dream';
    const base = BASE_BY_ID[id];
    return {
      id,
      title,
      note: String(raw.note || '').slice(0, 160),
      month: String(raw.month || '').slice(0, 50),
      category,
      image: typeof raw.image === 'string' && raw.image ? raw.image : (base ? base.image : ''),
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
      return wishes.length ? wishes : seedWishes();
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

  function buildShareUrl() {
    const payload = {
      v: 1,
      name: 'Виктор + Светлана',
      wishes: state.wishes.map(({ id, title, note, month, category, done }) => ({ id, title, note, month, category, done }))
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

    const cards = visible.map((wish) => {
      const mediaStyle = wish.image ? ` style="background-image:url('${escapeHtml(wish.image)}')"` : '';
      const doneClass = wish.done ? ' is-done' : '';
      const stamp = wish.done ? '<span class="wish-stamp">Сбылось</span>' : '';
      const edit = state.shared ? '' : `<button class="wish-edit" type="button" data-edit="${escapeHtml(wish.id)}" aria-label="Редактировать желание">✎</button>`;
      return `
        <article class="wish-card${doneClass}" data-id="${escapeHtml(wish.id)}">
          <div class="wish-media${wish.image ? '' : ' no-image'}"${mediaStyle}>
            <span class="wish-cat">${CATEGORY_LABEL[wish.category] || 'Мечта'}</span>
            <button class="wish-check" type="button" data-check="${escapeHtml(wish.id)}" aria-pressed="${wish.done}" aria-label="${wish.done ? 'Вернуть в планы' : 'Отметить сбывшимся'}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>
            </button>
            ${stamp}
            <span class="wish-month">${escapeHtml(wish.month || 'Когда угодно')}</span>
            ${state.shared ? '' : `<button class="wish-replace" type="button" data-replace="${escapeHtml(wish.id)}" aria-label="Заменить изображение">
              <span aria-hidden="true">✦</span> <span class="replace-label">Заменить</span>
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
    }).join('');

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
    updateProgress();
  }

  function renderRoute() {
    $$('[data-route-id]').forEach((stop) => {
      const wish = state.wishes.find((item) => item.id === stop.dataset.routeId);
      stop.classList.toggle('is-done', Boolean(wish?.done));
    });
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

  function openWishModal(mode, id = null) {
    if (state.shared) {
      showToast('Это просмотр. Забери карту себе, чтобы менять её.');
      return;
    }
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
    if (!window.confirm(`Удалить «${wish.title}»?`)) return;
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
    $$('.image-method').forEach((button) => {
      const active = button.dataset.imageMethod === method;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    if (els.falPinPanel) els.falPinPanel.hidden = true;
    updateGenerateButton();
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
    try { sessionStorage.setItem('wishmap-fal-unlocked', '1'); } catch {}
    if (els.falPinStatus) {
      els.falPinStatus.textContent = 'FAL открыт. Теперь можно генерировать.';
      els.falPinStatus.classList.remove('is-error');
    }
    setImageMethod('fal');
    showToast('FAL-режим открыт');
  }

  function openImageModal(id) {
    if (state.shared) {
      showToast('Это просмотр. Забери карту себе, чтобы менять кадры.');
      return;
    }
    const wish = state.wishes.find((item) => item.id === id);
    if (!wish) return;
    imageWishId = id;
    if (els.imageWishLabel) {
      els.imageWishLabel.innerHTML = `Желание: <b>${escapeHtml(wish.title)}</b>. Выбери способ, вид и опиши кадр.`;
    }
    if (els.imagePrompt) els.imagePrompt.value = '';
    if (els.imageDetails) els.imageDetails.value = '';
    if (els.imageStatus) {
      els.imageStatus.textContent = 'Без аккаунта. Найти, сгенерировать на ноутбуке или через FAL.';
      els.imageStatus.classList.remove('is-error');
    }
    if (els.falPinPanel) els.falPinPanel.hidden = true;
    if (els.falPin) els.falPin.value = '';
    setImageMethod('find');
    setImageStyle('cartoon');
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

  async function findCommonsImage(query) {
    const search = await translateToEnglish(query);
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${search} filetype:bitmap`,
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
    if (!pages) throw new Error('no pages');
    const candidates = Object.values(pages)
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
    if (!candidates.length) throw new Error('no candidates');
    const portrait = candidates.filter((item) => item.height >= item.width * 1.05);
    const pool = portrait.length ? portrait : candidates;
    return pool[Math.floor(Math.random() * Math.min(pool.length, 6))].url;
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

  async function localGenerate(prompt) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch('http://127.0.0.1:8190/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('local bridge ' + response.status);
      const data = await response.json();
      if (!data?.url) throw new Error('local no image');
      await loadImage(data.url, 30000);
      return data.url;
    } finally {
      window.clearTimeout(timer);
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

    const details = els.imageDetails?.value.trim() || '';
    const style = IMAGE_STYLES[imageStyle];
    const method = IMAGE_METHODS[imageMethod];
    setGenerateBusy(true, imageMethod === 'find'
      ? 'Ищу кадр в интернете…'
      : `${method.label} генерирует кадр…`);

    let imageUrl = null;
    let used = '';
    const english = await translateToEnglish([prompt, details].filter(Boolean).join('. '));
    const fullPrompt = [english, style.style, 'vertical 4:5 composition, no text, no letters, no watermark, no logo']
      .filter(Boolean).join('. ');

    if (imageMethod === 'local') {
      try {
        imageUrl = await localGenerate(fullPrompt);
        used = 'local';
      } catch {
        if (els.imageStatus) els.imageStatus.textContent = 'Ноут-мост не ответил — генерирую резервно…';
      }
    }

    if (imageMethod === 'fal') {
      try {
        imageUrl = await falGenerate(fullPrompt);
        used = 'fal';
      } catch {
        if (els.imageStatus) els.imageStatus.textContent = 'FAL-мост не ответил — генерирую резервно…';
      }
    }

    if (!imageUrl && imageMethod !== 'find') {
      try {
        const seed = Math.floor(Math.random() * 1_000_000_000);
        const candidate = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(fullPrompt) +
          `?width=640&height=800&seed=${seed}&nologo=true`;
        imageUrl = await loadImage(candidate, 40000);
        used = 'generated';
      } catch {
        imageUrl = null;
      }
    }

    if (!imageUrl) {
      try {
        const query = [prompt, details].filter(Boolean).join(' ') || wish.title;
        imageUrl = await findCommonsImage(query);
        await loadImage(imageUrl);
        used = 'photo';
      } catch {
        imageUrl = fallbackImage(wish);
        used = 'fallback';
      }
    }

    wish.image = imageUrl;
    saveLocal();
    renderWishes();
    setGenerateBusy(false);
    closeModal(els.imageModal);
    if (used === 'local') showToast('Ноут сгенерировал кадр');
    else if (used === 'fal') showToast('FAL-кадр готов — PIN принят');
    else if (used === 'generated') showToast('Резервный кадр сгенерирован');
    else if (used === 'photo') showToast('Нашёл новый кадр в интернете');
    else showToast('Поставил кадр из коллекции');
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wishes: state.wishes, updatedAt: Date.now() }));
    } catch {
      // всё равно даём пользоваться в этой вкладке
    }
    state.shared = false;
    document.body.classList.remove('is-shared');
    if (els.shareBanner) els.shareBanner.hidden = true;
    history.replaceState({}, '', location.pathname);
    renderWishes();
    showToast('Карта сохранена. Теперь можно отмечать');
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
    if (event.key !== 'Escape') return;
    closeModal($('.modal.is-open'));
    document.body.classList.remove('nav-open');
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
  }
  renderWishes();
  setFilter('all');
})();
