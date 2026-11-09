(() => {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = [...document.querySelectorAll('.nav a')];

  const onScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const closeNav = () => {
    document.body.classList.remove('nav-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.forEach((link) => link.addEventListener('click', closeNav));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // active section in nav
  const sectionIds = ['map', 'route', 'foundation', 'passport'];
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

  // reveal on scroll
  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  // front / back viewer
  const viewerImage = document.getElementById('viewer-image');
  const viewerCaption = document.getElementById('viewer-caption');
  const viewerStage = document.querySelector('.viewer-stage');
  const tabs = [...document.querySelectorAll('.tab')];
  const views = [
    { src: 'assets/img/front.jpg', caption: 'Лицевая сторона', alt: 'Лицевая сторона карты желаний' },
    { src: 'assets/img/back.jpg', caption: 'Обратная сторона', alt: 'Обратная сторона — паспорт желаний' }
  ];
  let activeView = 0;

  function setView(index) {
    activeView = index;
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

  // lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeButton = document.querySelector('.lightbox-close');
  const prevButton = document.querySelector('.lightbox-prev');
  const nextButton = document.querySelector('.lightbox-next');
  let current = 0;
  let lastFocused = null;

  function renderLightbox() {
    const view = views[current];
    if (lightboxImage) {
      lightboxImage.src = view.src;
      lightboxImage.alt = view.alt;
    }
    if (lightboxCaption) lightboxCaption.textContent = `${view.caption} · ${current + 1} / ${views.length}`;
    if (lightbox) lightbox.dataset.current = String(current);
  }

  function openLightbox(index) {
    current = Number(index) || 0;
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
    current = (current + direction + views.length) % views.length;
    renderLightbox();
  }

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => openLightbox(trigger.dataset.lightbox));
  });
  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  window.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });

  // subtle tilt on hero map (pointer devices only)
  const frame = document.querySelector('[data-tilt]');
  if (frame && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = `rotate(${1.4 - x * 1.4}deg) translate(${x * 5}px, ${y * 4}px)`;
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.transform = '';
    });
  }
})();

  // deep-link for screenshots / direct section links
  const sectionParam = new URLSearchParams(window.location.search).get('section');
  if (sectionParam) {
    const target = document.getElementById(sectionParam);
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }), 200);
  }
