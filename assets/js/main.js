/* =============================================================================
   JLC Global Advisory — main.js
   JS mínimo y vanilla: (a) configuración de enlaces (CTA + WhatsApp),
   (b) menú hamburguesa mobile, (c) selector numérico 1·2·3 de Servicios,
   (d) scroll suave con compensación de la navbar fija.
============================================================================= */

/* -----------------------------------------------------------------------------
   CONFIGURACIÓN — Placeholders fáciles de reemplazar.
   Reemplazá estos valores cuando estén los datos definitivos.
----------------------------------------------------------------------------- */
const CONFIG = {
  // URL del Google Form ("Sesión Estratégica"). Todos los CTA apuntan acá.
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScxHuUrLtFvX80HN3CiEBf--amwKmgd1N8veVeRX7fO0hQXdg/viewform?usp=publish-editor',

  // Número de WhatsApp en formato internacional, solo dígitos (sin + ni espacios).
  WHATSAPP_NUMBER: '5491131284077',

  // Mensaje precargado al abrir WhatsApp.
  WHATSAPP_MESSAGE: 'Hola, me gustaría agendar una Sesión Estratégica con JLC Global Advisory.',
};

document.addEventListener('DOMContentLoaded', function () {
  applyConfig();
  initMobileMenu();
  initServices();
  initCasoModal();
  initHeroVideo();
  initCounters();
  initBackgroundNetwork();
  initReveal();
  initYear();
});

/* -----------------------------------------------------------------------------
   (a) Aplica la configuración a los enlaces del DOM.
----------------------------------------------------------------------------- */
function applyConfig() {
  // CTAs → Google Form (abre en pestaña nueva)
  document.querySelectorAll('[data-cta-form]').forEach(function (el) {
    el.setAttribute('href', CONFIG.GOOGLE_FORM_URL);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });

  // WhatsApp
  const waLink =
    'https://wa.me/' +
    CONFIG.WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent(CONFIG.WHATSAPP_MESSAGE);
  document.querySelectorAll('[data-whatsapp]').forEach(function (el) {
    el.setAttribute('href', waLink);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
}

/* -----------------------------------------------------------------------------
   (b) Menú hamburguesa (mobile).
----------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const icon = toggle.querySelector('i');

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    if (icon) icon.className = 'ti ti-menu-2';
  }

  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    if (icon) icon.className = 'ti ti-x';
  }

  toggle.addEventListener('click', function () {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Cierra el menú al elegir un enlace.
  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Cierra con Escape.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
}

/* -----------------------------------------------------------------------------
   (c) Servicios: las 3 unidades van apiladas (una debajo de la otra). El selector
   1·2·3 hace scroll suave a cada una; el botón activo se resalta según la unidad
   que estás viendo (scrollspy). El submenú del navbar también salta a su unidad.
----------------------------------------------------------------------------- */
function initServices() {
  const btns = Array.prototype.slice.call(document.querySelectorAll('.js-tab'));
  const cards = btns.map(function (b) {
    return document.getElementById(b.getAttribute('data-target'));
  });
  if (!btns.length || cards.some(function (c) { return !c; })) return;

  function setActive(index) {
    btns.forEach(function (b, i) {
      b.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function goTo(index) {
    const card = cards[index];
    if (card) card.scrollIntoView({ block: 'start' }); // scroll suave vía CSS scroll-behavior
  }

  // Click en cada número → salta a la unidad.
  btns.forEach(function (b, i) {
    b.addEventListener('click', function () { setActive(i); goTo(i); });
  });

  // Submenú del navbar → salta a la unidad correspondiente.
  // preventDefault evita el salto del ancla #servicios, que competía con goTo()
  // y hacía que en clicks alternados volviera al tope de la sección.
  document.querySelectorAll('[data-goto-service]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const idx = parseInt(link.getAttribute('data-goto-service'), 10) || 0;
      goTo(idx);
    });
  });

  // Scrollspy: resalta el botón de la unidad que está en el centro del viewport.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const i = cards.indexOf(entry.target);
          if (i >= 0) setActive(i);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    cards.forEach(function (c) { observer.observe(c); });
  }
}

/* -----------------------------------------------------------------------------
   Red de partículas de fondo: puntos que flotan y se interconectan con líneas
   cuando se acercan. Difuminada (blur) y esporádica (titileo). Va en un canvas
   fijo detrás de todo el contenido. Respeta "movimiento reducido" (no se dibuja).
----------------------------------------------------------------------------- */
function initBackgroundNetwork() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;filter:blur(.6px);';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const NAVY = '10, 31, 68';     // navy de marca
  const GOLD = '200, 149, 42';   // gold-principal de marca
  const LINK_DIST = 150;         // distancia máxima para unir dos puntos
  let w, h, dpr, particles, raf;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(30, Math.min(80, Math.round((w * h) / 24000)));
    particles = [];
    for (let i = 0; i < count; i++) {
      const near = Math.random() < 0.32;   // ~1/3 más "cerca" (profundidad)
      const gold = Math.random() < 0.22;   // ~1/5 dorados
      const speed = near ? 0.42 : 0.22;    // los cercanos se mueven un poco más
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: near ? (2.6 + Math.random() * 1.9) : (1.3 + Math.random() * 1.3),
        near: near,
        gold: gold,
        base: near ? 0.62 : 0.4,            // opacidad base (los cercanos más visibles)
        ph: Math.random() * Math.PI * 2,    // fase del titileo
        sp: 0.004 + Math.random() * 0.012   // velocidad del titileo
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.ph += p.sp;
      if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
    }

    // Conexiones (líneas tenues entre puntos cercanos)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const goldLink = a.gold || b.gold;
          const alpha = (1 - dist / LINK_DIST) * (goldLink ? 0.17 : 0.12);
          ctx.strokeStyle = 'rgba(' + (goldLink ? GOLD : NAVY) + ',' + alpha + ')';
          ctx.lineWidth = (a.near || b.near) ? 1.3 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Puntos (con titileo esporádico, color de marca y profundidad)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const tw = p.base * (0.55 + (Math.sin(p.ph) * 0.5 + 0.5) * 0.45);
      const alpha = p.gold ? Math.min(tw * 1.3, 0.9) : tw; // los dorados resaltan más
      if (p.gold) {
        ctx.shadowColor = 'rgba(' + GOLD + ', 0.55)';
        ctx.shadowBlur = p.near ? 10 : 5;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = 'rgba(' + (p.gold ? GOLD : NAVY) + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    raf = requestAnimationFrame(frame);
  }

  function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }

  build();
  start();

  // Reconstruye al cambiar el tamaño (con un pequeño debounce).
  let rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(build, 200);
  });

  // Pausa cuando la pestaña no está visible (ahorra batería/CPU).
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  });
}

/* -----------------------------------------------------------------------------
   Casos de Éxito: la lupa de cada card abre un modal (lightbox). La tarjeta se
   clona, se agranda en primer plano y el fondo se oscurece. Cierra con la X,
   clic en el fondo o Escape.
----------------------------------------------------------------------------- */
function initCasoModal() {
  const modal = document.getElementById('caso-modal');
  const content = document.getElementById('caso-modal-content');
  const zoomBtns = Array.prototype.slice.call(document.querySelectorAll('.js-caso-zoom'));
  if (!modal || !content || !zoomBtns.length) return;

  let lastFocused = null;

  function open(card) {
    if (!card) return;
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    const z = clone.querySelector('.js-caso-zoom');
    if (z) z.remove();
    // Sin layout de subgrid/hover/reveal: el panel aporta fondo y bordes; el alto
    // se ajusta al contenido (encabezado arriba, sin espacio sobrante abajo).
    clone.className = 'block';

    content.innerHTML = '';
    content.appendChild(clone);

    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // bloquea el scroll de fondo
    requestAnimationFrame(function () { modal.classList.add('is-open'); });

    const closeBtn = modal.querySelector('.js-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      content.innerHTML = '';
    }, 250);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  zoomBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn.closest('article')); });
  });

  modal.querySelectorAll('.js-modal-close, .js-modal-backdrop').forEach(function (el) {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('flex')) close();
  });
}

/* -----------------------------------------------------------------------------
   Reveal on scroll: los elementos con clase .reveal aparecen (fade + subida)
   cuando entran en viewport, una sola vez, con cascada sutil entre hermanos.
   Al terminar se limpian las clases/inline para no interferir con otros efectos
   (p. ej. el hover de las cards). Respeta "movimiento reducido".
----------------------------------------------------------------------------- */
function initReveal() {
  const els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function showNow(el) { el.classList.remove('reveal', 'is-visible'); el.style.transitionDelay = ''; }
  if (reduce.matches) { els.forEach(showNow); return; }

  // Cascada sutil: retardo según la posición entre hermanos .reveal del mismo padre.
  const idx = new Map();
  els.forEach(function (el) {
    const p = el.parentElement;
    const i = idx.get(p) || 0;
    if (i > 0) el.style.transitionDelay = (i * 80) + 'ms';
    idx.set(p, i + 1);
  });

  if (!('IntersectionObserver' in window)) { els.forEach(showNow); return; }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      observer.unobserve(el);
      // Limpieza tras la transición: deja el elemento "neutro" (hover, etc. funcionan).
      const delay = parseFloat(el.style.transitionDelay) || 0;
      setTimeout(function () {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, 700 + delay);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (e) { observer.observe(e); });
}

/* -----------------------------------------------------------------------------
   Contadores numéricos: animan de 0 al valor objetivo (data-target) cuando
   entran en pantalla. Respeta "movimiento reducido" (muestra el valor final).
----------------------------------------------------------------------------- */
function initCounters() {
  const counters = Array.prototype.slice.call(document.querySelectorAll('[data-counter]'));
  if (!counters.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function animate(el) {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (reduce.matches) {
      el.textContent = String(target);
      return;
    }
    const duration = 1300;
    let startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic: arranca rápido y desacelera
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  // Sin IntersectionObserver: anima directo.
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target); // anima una sola vez
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(function (c) { observer.observe(c); });
}

/* -----------------------------------------------------------------------------
   Video del hero: respeta "movimiento reducido" del sistema (pausa → queda el
   póster fijo).
----------------------------------------------------------------------------- */
function initHeroVideo() {
  const video = document.querySelector('#inicio video');
  if (!video) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function apply() {
    if (reduce.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(function () {/* autoplay bloqueado: queda el póster */});
    }
  }
  apply();
  reduce.addEventListener('change', apply);
}

/* -----------------------------------------------------------------------------
   (d) Año dinámico en el footer.
----------------------------------------------------------------------------- */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}
