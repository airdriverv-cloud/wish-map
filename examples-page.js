(() => {
  'use strict';

  const MAP_KEY = 'wishmap-viktor-v2';
  const INBOX_KEY = 'wishmap-example-inbox-v1';
  const COLS_KEY = 'wishmap-examples-cols';
  const EXAMPLES = window.WISH_EXAMPLES || [];
  const CATEGORY_LABEL = {
    travel: 'Путешествия и приключения',
    body: 'Тело и энергия',
    business: 'Дело и деньги',
    love: 'Любовь и люди',
    creativity: 'Творчество и смысл'
  };
  const CATEGORY_SHORT = {
    travel: 'Путешествие',
    body: 'Тело',
    business: 'Дело',
    love: 'Любовь',
    creativity: 'Творчество'
  };
  const IMAGES = {
    travel: ['scene-ski.jpg', 'scene-egypt.jpg', 'scene-turkey.jpg', 'scene-vietnam.jpg', 'scene-yacht.jpg'],
    body: ['scene-dolzhanka.jpg', 'scene-ski.jpg', 'scene-pyatigorsk.jpg', 'scene-yacht.jpg', 'scene-vietnam.jpg'],
    business: ['scene-business.jpg', 'scene-income.jpg'],
    love: ['scene-love.jpg', 'scene-yacht.jpg'],
    creativity: ['scene-vietnam.jpg', 'scene-yacht.jpg', 'scene-business.jpg', 'scene-love.jpg']
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const uid = () => `wish-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const plural = (n, one, few, many) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  };

  const grid = $('#examplesPageGrid');
  const countLabel = $('#exampleCount');
  const empty = $('#examplesEmpty');
  const toast = $('#toast');
  let filter = 'all';
  let columns = 5;
  let toastTimer = null;

  try {
    const savedCols = Number(localStorage.getItem(COLS_KEY));
    if ([2, 4, 5].includes(savedCols)) columns = savedCols;
  } catch {}

  function imageFor(example) {
    const images = IMAGES[example.category] || IMAGES.travel;
    const index = EXAMPLES.filter((item) => item.category === example.category).indexOf(example);
    return `assets/img/scenes/${images[index % images.length]}`;
  }

  function readMap() {
    try {
      const raw = localStorage.getItem(MAP_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.wishes) ? parsed : null;
    } catch {
      return null;
    }
  }

  function readInbox() {
    try {
      const raw = JSON.parse(localStorage.getItem(INBOX_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function isInMap(example) {
    const map = readMap();
    if (map?.wishes.some((wish) => wish.title === example.title)) return true;
    return readInbox().includes(example.id);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function addExample(example) {
    if (isInMap(example)) {
      showToast('Это желание уже есть в карте');
      return;
    }
    const wish = {
      id: uid(),
      title: example.title,
      note: example.note,
      month: 'Когда-нибудь',
      category: example.category,
      image: imageFor(example),
      done: false
    };
    const map = readMap();
    try {
      if (map) {
        map.wishes.push(wish);
        map.updatedAt = Date.now();
        localStorage.setItem(MAP_KEY, JSON.stringify(map));
      } else {
        const inbox = readInbox();
        if (!inbox.includes(example.id)) inbox.push(example.id);
        localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
      }
    } catch {
      showToast('Не удалось сохранить. Открой карту в этом браузере.');
      return;
    }
    render();
    showToast(map ? `«${example.title}» добавлено в карту` : 'Желание добавлено — оно появится в карте');
  }

  function render() {
    const visible = EXAMPLES.filter((example) => filter === 'all' || example.category === filter);
    grid.className = `examples-page-grid cols-${columns}`;
    grid.innerHTML = visible.map((example) => {
      const added = isInMap(example);
      return `
        <article class="wish-card example-card" data-example-id="${example.id}">
          <div class="wish-media">
            <img class="wish-media-img" src="${imageFor(example)}" alt="${escapeHtml(example.title)}" loading="lazy" decoding="async">
            <span class="wish-cat">${escapeHtml(CATEGORY_SHORT[example.category] || 'Мечта')}</span>
          </div>
          <div class="wish-body">
            <div class="wish-body-top"><h3>${escapeHtml(example.title)}</h3></div>
            <p>${escapeHtml(example.note)}</p>
            <button class="example-add${added ? ' is-added' : ''}" type="button" data-add-example="${example.id}">
              ${added ? 'В карте' : '+ В мою карту'}
            </button>
          </div>
        </article>`;
    }).join('');
    if (empty) empty.hidden = visible.length !== 0;
    if (countLabel) countLabel.textContent = `${visible.length} ${plural(visible.length, 'идея', 'идеи', 'идей')}`;
    $$('.example-filter').forEach((button) => {
      const active = button.dataset.exampleFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('.view-tab').forEach((button) => {
      const active = Number(button.dataset.cols) === columns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  $$('.example-filter').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.exampleFilter || 'all';
      render();
    });
  });

  $$('.view-tab').forEach((button) => {
    button.addEventListener('click', () => {
      columns = Number(button.dataset.cols) || 5;
      try { localStorage.setItem(COLS_KEY, String(columns)); } catch {}
      render();
    });
  });

  grid?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-example]');
    if (!button) return;
    const example = EXAMPLES.find((item) => item.id === button.dataset.addExample);
    if (example) addExample(example);
  });

  render();
})();
