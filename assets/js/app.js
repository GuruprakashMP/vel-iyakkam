/* ==========================================================================
   VEL IYAKKAM — Shared shell: header, footer, language, theme, helpers
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.VI_CONFIG, DICT = window.VI_I18N;

  /* ---------- Language ---------------------------------------------------- */
  var lang = localStorage.getItem('vi-lang') || CFG.display.defaultLang || 'ta';
  if (lang !== 'ta' && lang !== 'en') lang = 'ta';

  function t(key) {
    var v = DICT[lang][key];
    if (v === undefined) v = DICT.ta[key];
    return v === undefined ? key : v;
  }
  function setLang(next) {
    lang = next;
    localStorage.setItem('vi-lang', next);
    document.documentElement.lang = next;
    applyI18n();
    document.dispatchEvent(new CustomEvent('vi:langchange', { detail: { lang: next } }));
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-label]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-label')));
    });
    var title = document.querySelector('[data-i18n-title]');
    if (title) {
      document.title = t(title.getAttribute('data-i18n-title')) + ' · ' +
        (lang === 'ta' ? CFG.org.nameTa : CFG.org.nameEn);
    }
    var btn = document.getElementById('langBtn');
    if (btn) btn.textContent = lang === 'ta' ? 'EN' : 'தமிழ்';
  }

  /* ---------- Theme ------------------------------------------------------- */
  var theme = localStorage.getItem('vi-theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) {
      cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vi-theme', next);
  }

  /* ---------- Formatting helpers ------------------------------------------ */
  function money(n) {
    n = Number(n) || 0;
    return CFG.display.currency + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  function monthLabel(ym) {                       // '2026-08' -> 'ஆகஸ்ட் 2026'
    if (!ym) return '';
    var p = String(ym).split('-');
    var m = parseInt(p[1], 10);
    if (!p[0] || isNaN(m)) return ym;
    return t('c.months')[m - 1] + ' ' + p[0];
  }
  function monthLabelShort(ym) {
    if (!ym) return '';
    var p = String(ym).split('-');
    var m = parseInt(p[1], 10);
    if (!p[0] || isNaN(m)) return ym;
    return t('c.monthsShort')[m - 1] + ' ' + p[0];
  }
  function dateLabel(d) {                         // Date -> '18 ஆகஸ்ட் 2026'
    if (!(d instanceof Date) || isNaN(d)) return '';
    return d.getUTCDate() + ' ' + t('c.months')[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function weekdayLabel(i) { return t('c.weekdays')[i]; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function download(filename, text, mime) {
    var blob = new Blob(['﻿' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- Header / footer -------------------------------------------- */
  var PAGES = [
    { href: 'index.html',     key: 'nav.home' },
    { href: 'donations.html', key: 'nav.donations' },
    { href: 'calendar.html',  key: 'nav.calendar' },
    { href: 'guidance.html',  key: 'nav.guidance' },
    { href: 'stories.html',   key: 'nav.stories' },
    { href: 'about.html',     key: 'nav.about' }
  ];

  var VEL_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 1.6 15 8.2c.35.78.1 1.7-.6 2.16L12 12l-2.4-1.64c-.7-.46-.95-1.38-.6-2.16L12 1.6Z" fill="#F2BE45"/>' +
    '<path d="M12 11.4v10.9" stroke="#F2BE45" stroke-width="1.7" stroke-linecap="round"/>' +
    '<path d="M9.1 13.6h5.8" stroke="#FBEFD3" stroke-width="1.4" stroke-linecap="round"/>' +
    '</svg>';

  function buildHeader() {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var links = PAGES.map(function (p) {
      var cur = p.href.toLowerCase() === here ? ' aria-current="page"' : '';
      return '<a href="' + p.href + '"' + cur + ' data-i18n="' + p.key + '"></a>';
    }).join('');

    var el = document.createElement('header');
    el.className = 'site-header';
    el.innerHTML =
      '<div class="wrap"><nav class="nav">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark">' + VEL_SVG + '</span>' +
          '<span class="brand-txt">' + esc(CFG.org.nameTa) +
            '<small>' + esc(CFG.org.nameEn) + '</small></span>' +
        '</a>' +
        '<div class="nav-links" id="navLinks">' + links + '</div>' +
        '<div class="nav-tools">' +
          '<button class="icon-btn lang-btn" id="langBtn" type="button" title="Language / மொழி">EN</button>' +
          '<button class="icon-btn" id="themeBtn" type="button" data-i18n-label="nav.theme" title="Dark / Light">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>' +
          '</button>' +
          '<button class="icon-btn nav-toggle" id="navToggle" type="button" data-i18n-label="nav.menu" aria-expanded="false">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
            '<path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
          '</button>' +
        '</div>' +
      '</nav></div>';
    document.body.insertBefore(el, document.body.firstChild);

    document.getElementById('langBtn').onclick = function () { setLang(lang === 'ta' ? 'en' : 'ta'); };
    document.getElementById('themeBtn').onclick = toggleTheme;
    var tog = document.getElementById('navToggle'), nl = document.getElementById('navLinks');
    tog.onclick = function () {
      var open = nl.classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    nl.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nl.classList.remove('open'); tog.setAttribute('aria-expanded', 'false'); }
    });
  }

  function buildFooter() {
    var links = PAGES.map(function (p) {
      return '<li><a href="' + p.href + '" data-i18n="' + p.key + '"></a></li>';
    }).join('');

    var contact = '';
    if (CFG.org.contactEmail) contact += '<li><a href="mailto:' + esc(CFG.org.contactEmail) + '">' + esc(CFG.org.contactEmail) + '</a></li>';
    if (CFG.org.contactPhone) contact += '<li><a href="tel:' + esc(CFG.org.contactPhone) + '">' + esc(CFG.org.contactPhone) + '</a></li>';
    if (CFG.org.whatsapp)     contact += '<li><a href="https://wa.me/' + esc(CFG.org.whatsapp) + '" rel="noopener">WhatsApp</a></li>';
    if (!contact) contact = '<li class="tiny">—</li>';

    var el = document.createElement('footer');
    el.className = 'site-footer';
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="foot-grid">' +
          '<div><h4 data-i18n="c.footer.about"></h4><p class="small" data-i18n="c.footer.aboutp"></p></div>' +
          '<div><h4 data-i18n="c.footer.quick"></h4><ul>' + links + '</ul></div>' +
          '<div><h4 data-i18n="c.footer.contact"></h4><ul>' + contact + '</ul></div>' +
        '</div>' +
        '<div class="foot-bot">' +
          '<span>© ' + new Date().getFullYear() + ' ' + esc(CFG.org.nameTa) + ' · ' + esc(CFG.org.nameEn) + '</span>' +
          '<span data-i18n="c.footer.rights"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
  }

  /* ---------- Boot -------------------------------------------------------- */
  function boot() {
    buildHeader();
    buildFooter();
    applyI18n();
    document.dispatchEvent(new CustomEvent('vi:ready', { detail: { lang: lang } }));
  }

  window.VI = {
    t: t, get lang() { return lang; }, setLang: setLang, applyI18n: applyI18n,
    money: money, monthLabel: monthLabel, monthLabelShort: monthLabelShort,
    dateLabel: dateLabel, weekdayLabel: weekdayLabel, esc: esc, download: download,
    cfg: CFG
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
