(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeMeta() { if (themeMeta) themeMeta.setAttribute('content', effectiveTheme() === 'dark' ? '#08090d' : '#f6f7f9'); }
  syncThemeMeta();
  $('#theme-toggle').addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeMeta();
  });

  /* ---------- scroll progress + nav state ---------- */
  var bar = $('#progress-bar');
  var nav = $('#nav');
  var ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
    bar.style.setProperty('--p', p.toFixed(4));
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- active section in nav ---------- */
  var navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'research', 'projects', 'honours', 'education', 'skills', 'contact'].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menu-toggle');
  var sheet = $('#menu-sheet');
  function setMenu(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  }
  menuBtn.addEventListener('click', function () { setMenu(sheet.hidden); });
  $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) setMenu(false); });

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('[data-reveal]');
  revealEls.forEach(function (el) {
    var sibs = $$(':scope > [data-reveal]', el.parentElement);
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 80 + 'ms';
  });
  // Position check on scroll, so content can never stay hidden even if observers are throttled.
  var pending = revealEls.slice();
  function revealCheck() {
    if (!pending.length) return;
    var limit = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) window.removeEventListener('scroll', revealCheck);
  }
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    window.addEventListener('scroll', revealCheck, { passive: true });
    window.addEventListener('resize', revealCheck);
    revealCheck();
  }

  /* ---------- count-up figures ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
    var start = null, dur = 1600;
    // Guarantee the final figure even if animation frames are throttled.
    var finished = false;
    setTimeout(function () { finished = true; el.textContent = target.toFixed(dec); }, dur + 400);
    function step(t) {
      if (finished) return;
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = (target * eased).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- case-study drawer ---------- */
  var drawer = $('#drawer'), drawerBody = $('#drawer-body');
  var lastTrigger = null;
  function openDrawer(id, trigger) {
    var tpl = document.getElementById(id);
    if (!tpl || !drawer.showModal) return;
    lastTrigger = trigger;
    drawerBody.innerHTML = '';
    drawerBody.appendChild(tpl.content.cloneNode(true));
    $('.drawer__panel', drawer).scrollTop = 0;
    drawer.showModal();
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add('is-open'); }); });
  }
  function closeDrawer() {
    if (!drawer.open) return;
    drawer.classList.remove('is-open');
    var done = function () {
      drawer.close();
      drawerBody.innerHTML = '';
      document.body.classList.remove('is-locked');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    };
    if (reduceMotion) done(); else setTimeout(done, 450);
  }
  $$('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openDrawer(btn.getAttribute('data-open'), btn);
    });
  });
  $('#drawer-close').addEventListener('click', closeDrawer);
  drawer.addEventListener('cancel', function (e) { e.preventDefault(); closeDrawer(); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lightbox-img'), lbCap = $('#lightbox-cap');
  document.addEventListener('click', function (e) {
    var z = e.target.closest && e.target.closest('.zoom');
    if (!z || !lb.showModal) return;
    var img = $('img', z);
    if (!img) return;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    var cap = z.parentElement && z.parentElement.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent : img.alt;
    lb.showModal();
  });
  $('#lightbox-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbCap) lb.close(); });

  /* ---------- highlight cards: soft cursor spotlight ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.hl').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- copy email ---------- */
  var copyBtn = $('#copy-email');
  copyBtn.addEventListener('click', function () {
    var text = copyBtn.getAttribute('data-copy');
    function done() { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1800); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents($('#email'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      copyBtn.textContent = 'Selected';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });
})();
