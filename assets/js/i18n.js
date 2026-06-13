/* ============================================================================
   i18n — Motor de traducción por nodos de texto (ES / EN / PT)
   - No requiere etiquetar el HTML: guarda el texto español original de cada
     nodo y lo reemplaza según el diccionario `window.I18N`.
   - El idioma elegido se guarda en localStorage y se autodetecta en la 1ª visita.
   Diccionario esperado (cada página define el suyo ANTES o DESPUÉS, da igual):
     window.I18N = { en: { "<texto ES normalizado>": "<EN>" , ... }, pt: { ... } }
     window.I18N_TITLE = { es: "...", en: "...", pt: "..." }   // opcional (<title>)
   Para excluir un subárbol de la traducción: agregar  data-i18n-skip
   ========================================================================== */
(function () {
  'use strict';

  var LANGS = ['es', 'en', 'pt'];
  var nodes = [];        // { node, es, key }
  var collected = false;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function preserveSpace(orig, translated) {
    var lead = (orig.match(/^\s*/) || [''])[0];
    var trail = (orig.match(/\s*$/) || [''])[0];
    return lead + translated + trail;
  }

  function collect() {
    if (collected || !document.body) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !norm(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, es: n.nodeValue, key: norm(n.nodeValue) });
    }
    collected = true;
  }

  function apply(lang) {
    if (LANGS.indexOf(lang) < 0) lang = 'es';
    collect();
    var dict = (window.I18N && window.I18N[lang]) || {};

    nodes.forEach(function (it) {
      if (lang === 'es') {
        it.node.nodeValue = it.es;
      } else {
        var t = dict[it.key];
        it.node.nodeValue = (t != null) ? preserveSpace(it.es, t) : it.es;
      }
    });

    document.documentElement.setAttribute('lang', lang);

    // <title>
    if (window.I18N_TITLE) {
      var tt = (lang === 'es') ? window.I18N_TITLE.es : (window.I18N_TITLE[lang] || window.I18N_TITLE.es);
      if (tt) document.title = tt;
    }

    // Indicadores del selector
    document.querySelectorAll('[data-lang-current]').forEach(function (el) {
      el.textContent = lang.toUpperCase();
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-lang-btn') === lang ? 'true' : 'false');
    });

    try { localStorage.setItem('lang', lang); } catch (e) {}
  }

  function initialLang() {
    // Default: español. Solo se cambia si el usuario eligió otro idioma (guardado).
    var saved;
    try { saved = localStorage.getItem('lang'); } catch (e) {}
    if (saved && LANGS.indexOf(saved) >= 0) return saved;
    return 'es';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        apply(b.getAttribute('data-lang-btn'));
      });
    });
    apply(initialLang());
  });

  // Exponer por si se quiere cambiar desde otro script
  window.setLang = apply;
})();
