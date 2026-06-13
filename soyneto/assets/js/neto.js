/* Neto — JS mínimo: menú hamburguesa mobile + año del footer.
   El scroll suave se resuelve con CSS (scroll-behavior + scroll-margin-top). */
(function () {
  'use strict';

  function initMobileMenu() {
    var btn = document.getElementById('btn-menu');
    var menu = document.getElementById('menu-mobile');
    if (!btn || !menu) return;

    var icon = btn.querySelector('i');

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (icon) icon.className = open ? 'ti ti-x text-[26px]' : 'ti ti-menu-2 text-[26px]';
    }

    btn.addEventListener('click', function () {
      setOpen(!menu.classList.contains('is-open'));
    });

    // Cerrar al hacer clic en un enlace del menú
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });
  }

  function initYear() {
    var el = document.getElementById('anio');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // Auto-hover secuencial de las tarjetas de Condiciones (cada 2 s)
  function initCondAutoHover() {
    var grid = document.getElementById('cond-grid');
    if (!grid) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.cond-card'));
    if (!cards.length) return;

    var i = -1;
    var timer = null;

    function step() {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      i = (i + 1) % cards.length;
      cards[i].classList.add('is-active');
    }

    function start() {
      if (timer) return;
      step();
      timer = window.setInterval(step, 2000);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      i = -1;
    }

    // Pausa el ciclo mientras el usuario interactúa con la grilla (el hover real toma el control)
    grid.addEventListener('mouseenter', stop);
    grid.addEventListener('mouseleave', start);

    // Pausa cuando la pestaña no está visible
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  }

  // Aparición progresiva de los elementos (.reveal) al entrar en viewport
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.remove('reveal'); });
      return;
    }

    // Stagger: retardo según la posición entre hermanos que también son .reveal
    els.forEach(function (el) {
      var parent = el.parentElement;
      var sibs = parent
        ? Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); })
        : [el];
      var idx = sibs.indexOf(el);
      el.style.transitionDelay = (Math.min(idx, 6) * 80) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // Limpieza tras la animación para no interferir con hover/transiciones propias
        var delay = parseFloat(el.style.transitionDelay) || 0;
        window.setTimeout(function () {
          el.classList.remove('reveal', 'is-visible');
          el.style.transitionDelay = '';
        }, 700 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    els.forEach(function (el) { io.observe(el); });
  }

  // Pop-up de bienvenida (aparece al cargar; se puede cerrar)
  function initPopup() {
    var popup = document.getElementById('popup');
    if (!popup) return;

    function open() {
      popup.classList.remove('hidden');
      popup.classList.add('flex');
      // fuerza reflow para que la transición se dispare
      void popup.offsetWidth;
      popup.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      popup.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        popup.classList.add('hidden');
        popup.classList.remove('flex');
      }, 300);
    }

    popup.querySelectorAll('.popup-close, .popup-backdrop').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('is-open')) close();
    });

    // Aparece poco después de cargar
    window.setTimeout(open, 600);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initYear();
    initCondAutoHover();
    initReveal();
    initPopup();
  });
})();
