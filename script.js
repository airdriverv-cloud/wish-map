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
  let imageMode = 'find';

  const IMAGE_MODES = {
    find: {
      label: 'Найти',
      placeholder: 'Например: пара на яхте в бирюзовой бухте, тёплый закат, без текста'
    },
    local: {
      label: 'Ноут',
      placeholder: 'Опиши сцену для генерации на ноутбуке: герои, место, свет, настроение'
    },
    fal: {
      label: 'FAL',
      placeholder: 'Опиши сцену для fal.ai: герои, место, свет, стиль, настроение'
    }
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
    sendImageRequest: $('#sendImageRequest'),
    copyImageRequest: $('#copyImageRequest'),
    toast: $('#toast'),
    video: $('#wishVideo'),
    videoShell: $('#videoShell'),
    videoPlay: $('#videoPlay')
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
      image: base ? base.image : '',
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
    updateProgress();
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

  /* ---------- image replacement requests ---------- */
  function setImageMode(mode) {
    if (!IMAGE_MODES[mode]) return;
    imageMode = mode;
    $$('.image-mode').forEach((button) => {
      const active = button.dataset.imageMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    if (els.imagePrompt) els.imagePrompt.placeholder = IMAGE_MODES[mode].placeholder;
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
      els.imageWishLabel.innerHTML = `Желание: <b>${escapeHtml(wish.title)}</b>. Выбери способ и опиши, что должно быть на новом кадре.`;
    }
    if (els.imagePrompt) els.imagePrompt.value = '';
    if (els.imageDetails) els.imageDetails.value = '';
    setImageMode('find');
    openModal(els.imageModal);
    window.setTimeout(() => els.imagePrompt?.focus(), 80);
  }

  function buildImageRequestText() {
    const wish = state.wishes.find((item) => item.id === imageWishId);
    const prompt = els.imagePrompt?.value.trim() || '';
    const details = els.imageDetails?.value.trim() || '';
    return [
      'Заявка на изображение',
      `Карта: ${location.origin}${location.pathname}`,
      `Желание: ${wish?.title || '—'}`,
      `ID: ${imageWishId || '—'}`,
      `Режим: ${IMAGE_MODES[imageMode].label}`,
      `Что заменить или сгенерировать: ${prompt || '—'}`,
      details ? `Детали: ${details}` : '',
      `Текущий кадр: ${wish?.image || 'градиент'}`
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

  function sendImageRequest() {
    const prompt = els.imagePrompt?.value.trim() || '';
    if (!prompt) {
      showToast('Опиши, что заменить или сгенерировать');
      els.imagePrompt?.focus();
      return;
    }
    const wish = state.wishes.find((item) => item.id === imageWishId);
    if (!wish) return;
    const text = buildImageRequestText();
    try {
      const requests = JSON.parse(localStorage.getItem('wishmap-image-requests') || '[]');
      requests.unshift({
        wishId: imageWishId,
        title: wish.title,
        mode: imageMode,
        prompt,
        details: els.imageDetails?.value.trim() || '',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('wishmap-image-requests', JSON.stringify(requests.slice(0, 40)));
    } catch {
      // локальная история не критична
    }

    const title = `[image] ${wish.title} · ${IMAGE_MODES[imageMode].label}`;
    const url = 'https://github.com/airdriverv-cloud/wish-map/issues/new?' + new URLSearchParams({
      title,
      body: text,
      labels: 'image-request',
      assignees: 'airdriverv-cloud'
    }).toString();
    const popup = window.open(url, '_blank');
    if (popup) popup.opener = null;
    if (!popup) {
      copyText(text, 'Окно GitHub не открылось — запрос скопирован');
    } else {
      showToast('Заявка открыта в GitHub Issues');
    }
    closeModal(els.imageModal);
  }

  function copyImageRequest() {
    copyText(buildImageRequestText(), 'Запрос скопирован — можно вставить в чат');
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
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => ($('input:not([type=hidden]), textarea, select', modal) || $('button', modal))?.focus(), 80);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
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

  const sectionIds = ['wishes', 'map', 'video', 'passport'];
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

  /* ---------- map viewer / lightbox ---------- */
  const viewerImage = $('#viewer-image');
  const viewerCaption = $('#viewer-caption');
  const viewerStage = $('.viewer-stage');
  const tabs = $$('.tab');
  const views = [
    { src: 'assets/img/front.jpg', caption: 'Лицевая сторона', alt: 'Лицевая сторона карты желаний' },
    { src: 'assets/img/back.jpg', caption: 'Обратная сторона', alt: 'Обратная сторона — паспорт желаний' }
  ];

  function setView(index) {
    const view = views[index];
    if (viewerImage) {
      viewerImage.src = view.src;
      viewerImage.alt = view.alt;
    }
    if (viewerCaption) viewerCaption.textContent = view.caption;
    if (viewerStage) viewerStage.dataset.lightbox = String(index);
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setView(index));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      setView(next);
    });
  });

  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  const lightboxCaption = $('#lightbox-caption');
  const closeButton = $('.lightbox-close');
  const prevButton = $('.lightbox-prev');
  const nextButton = $('.lightbox-next');
  let lightboxIndex = 0;

  function renderLightbox() {
    const view = views[lightboxIndex];
    if (lightboxImage) {
      lightboxImage.src = view.src;
      lightboxImage.alt = view.alt;
    }
    if (lightboxCaption) lightboxCaption.textContent = `${view.caption} · ${lightboxIndex + 1} / ${views.length}`;
  }

  function openLightbox(index) {
    lightboxIndex = Number(index) || 0;
    lastFocused = document.activeElement;
    renderLightbox();
    lightbox?.classList.add('is-open');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    window.setTimeout(() => closeButton?.focus(), 50);
  }

  function closeLightbox() {
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lastFocused?.focus?.();
  }

  function moveLightbox(direction) {
    lightboxIndex = (lightboxIndex + direction + views.length) % views.length;
    renderLightbox();
  }

  $$('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => openLightbox(trigger.dataset.lightbox));
  });
  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
      closeModal($('.modal.is-open'));
      document.body.classList.remove('nav-open');
    }
    if (!lightbox?.classList.contains('is-open')) return;
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });

  /* ---------- video ---------- */
  els.videoPlay?.addEventListener('click', async () => {
    if (!els.video) return;
    els.videoShell?.classList.add('is-playing');
    try {
      await els.video.play();
    } catch {
      els.videoShell?.classList.remove('is-playing');
      showToast('Нажми Play в плеере видео');
    }
  });
  els.video?.addEventListener('play', () => els.videoShell?.classList.add('is-playing'));

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
  els.sendImageRequest?.addEventListener('click', sendImageRequest);
  els.copyImageRequest?.addEventListener('click', copyImageRequest);
  $$('.image-mode').forEach((button) => {
    button.addEventListener('click', () => setImageMode(button.dataset.imageMode));
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
  setView(0);
})();
