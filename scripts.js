/* Andante marketing site — shared behaviour.
   Pure vanilla JS; no build step; runs after the DOM is ready.
   The Tailwind theme lives in the stylesheet source (styles.css: @theme),
   so there is no JS theme config anymore. */

function initAndante() {
  'use strict';

  /* Mobile menu toggle */
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!open));
      // animate the hamburger into an X
      var bars = toggle.querySelectorAll('.menu-bar');
      bars.forEach(function (b, i) {
        b.style.transform = open ? 'none' : (i === 0 ? 'translateY(7px) rotate(45deg)' : i === 2 ? 'translateY(-7px) rotate(-45deg)' : '');
        if (i === 1) b.style.opacity = open ? '1' : '0';
      });
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Animated counters ([data-count]): ease from 0 to the target value in view. */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        cio.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var dur = parseInt(el.getAttribute('data-duration'), 10) || 1600;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* Rotating word ticker ([.vg-tick]): cycle the words in crossfade every 3s. */
  document.querySelectorAll('.vg-tick').forEach(function (tick) {
    var words = Array.prototype.slice.call(tick.querySelectorAll('.vg-tick-word'));
    if (words.length < 2) return;
    var i = 0;
    words[0].classList.add('active');
    setInterval(function () {
      words[i].classList.remove('active');
      i = (i + 1) % words.length;
      words[i].classList.add('active');
    }, 3000);
  });

  /* References accordion (Evidence page) */
  var refToggle = document.getElementById('references-toggle');
  var refBody = document.getElementById('references-body');
  var refIcon = document.getElementById('references-icon');
  if (refToggle && refBody && refIcon) {
    refToggle.addEventListener('click', function () {
      var open = refBody.classList.toggle('hidden');
      refIcon.textContent = open ? '+' : '\u2212';
      refToggle.setAttribute('aria-expanded', String(!open));
    });
  }

  /* Fullscreen lightbox with gallery navigation.
     Opens an image fullscreen; if the image belongs to a carousel, the ‹ ›
     buttons and ←/→ arrow keys move between its images without closing. */
  var lightboxImgs = document.querySelectorAll('[data-lightbox]');
  var lightboxOpen = false;
  var lb = null;

  function lbSet(i) {
    lb.index = (i + lb.images.length) % lb.images.length;
    var src = lb.images[lb.index].currentSrc || lb.images[lb.index].src;
    lb.big.src = src;
    lb.big.alt = lb.images[lb.index].alt || '';
  }

  function openLightbox(img) {
    if (lightboxOpen) return;
    lightboxOpen = true;

    var carousel = img.closest('.carousel');
    var images = (carousel && carousel.querySelectorAll('[data-lightbox]').length > 1)
      ? Array.from(carousel.querySelectorAll('[data-lightbox]'))
      : [img];
    var index = images.indexOf(img);

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var big = document.createElement('img');
    var close = document.createElement('button');
    close.className = 'lightbox-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '\u00d7';

    overlay.appendChild(big);
    overlay.appendChild(close);

    var prev = null, next = null;
    if (images.length > 1) {
      prev = document.createElement('button');
      prev.className = 'lightbox-nav lightbox-prev';
      prev.setAttribute('aria-label', 'Previous image');
      prev.textContent = '\u2039';
      next = document.createElement('button');
      next.className = 'lightbox-nav lightbox-next';
      next.setAttribute('aria-label', 'Next image');
      next.textContent = '\u203a';
      overlay.appendChild(prev);
      overlay.appendChild(next);
    }

    document.body.appendChild(overlay);
    document.body.classList.add('lightbox-open');

    lb = { big: big, images: images, index: index };
    lbSet(index);

    function closeLightbox() {
      overlay.remove();
      document.body.classList.remove('lightbox-open');
      window.removeEventListener('keydown', onKey);
      lightboxOpen = false;
      lb = null;
    }
    function onKey(e) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') lbSet(lb.index + 1);
      else if (e.key === 'ArrowLeft') lbSet(lb.index - 1);
    }
    window.addEventListener('keydown', onKey);
    close.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); lbSet(lb.index - 1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); lbSet(lb.index + 1); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeLightbox(); });
  }
  lightboxImgs.forEach(function (img) {
    img.addEventListener('click', function () { openLightbox(img); });
  });

  /* Auto-rotating carousel for elements with [data-autoplay] */
  document.querySelectorAll('[data-autoplay]').forEach(function (carousel) {
    var slides = carousel.querySelectorAll('.carousel-slide');
    if (slides.length < 2) return;
    var dots = carousel.querySelector('.carousel-dots');
    var interval = parseInt(carousel.getAttribute('data-autoplay'), 10) || 3000;
    var i = 0;

    var dotsArr = [];
    slides.forEach(function (_, n) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Slide ' + (n + 1));
      if (n === 0) b.classList.add('active');
      b.addEventListener('click', function () { goTo(n); });
      if (dots) { dots.appendChild(b); dotsArr.push(b); }
    });

    function goTo(n) {
      slides[i].classList.remove('active');
      if (dotsArr[i]) dotsArr[i].classList.remove('active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('active');
      if (dotsArr[i]) dotsArr[i].classList.add('active');
    }
    function next() { goTo(i + 1); }
    function start() { return setInterval(next, interval); }
    var timer = start();
    carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
    carousel.addEventListener('mouseleave', function () { clearInterval(timer); timer = start(); });
  });

  /* Demo request modal: opens on any "Book a demo" CTA and POSTs the form to
     FormSubmit.co (its AJAX endpoint), so the request lands in the inbox with no
     backend. The recipient is NOT hardcoded here — it is read from the form's
     action attribute in index.html, and only rewritten to the /ajax/ URL below.
     If the POST cannot be made (offline, blocked, no web server), the visitor
     gets a pre-filled mailto link as a fallback. */
  var modal = document.getElementById('book-a-demo-modal');
  var form = document.getElementById('book-a-demo-form');
  var statusEl = document.getElementById('book-a-demo-status');
  var submitBtn = document.getElementById('book-a-demo-submit');
  var subjectEl = document.getElementById('book-a-demo-subject');
  var actionUrl = form ? (form.getAttribute('action') || '') : '';
  var recipient = actionUrl.replace(/^https?:\/\/(?:www\.)?formsubmit\.co\//, '');
  var endpoint = actionUrl.replace('formsubmit.co/', 'formsubmit.co/ajax/');
  var submitLabel = 'Request a demo';

  function setStatus(state, text) {
    if (!statusEl) return;
    if (!state) {
      statusEl.hidden = true;
      statusEl.removeAttribute('data-state');
      statusEl.textContent = '';
      return;
    }
    statusEl.hidden = false;
    statusEl.setAttribute('data-state', state);
    statusEl.textContent = text || '';
  }
  function resetSubmitBtn() {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
  }
  function openModal(e) {
    if (e) e.preventDefault();
    if (!modal) return;
    // Reopening starts a fresh request: clear the previous status, re-enable the button.
    if (statusEl && statusEl.getAttribute('data-state') !== 'pending') {
      setStatus(null);
      resetSubmitBtn();
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('a[href*="book-a-demo"]').forEach(function (a) {
    a.addEventListener('click', openModal);
  });
  if (modal) {
    var closeBtn = document.getElementById('book-a-demo-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      if (String(d.get('_honey') || '').trim()) return; // honeypot: silently drop bots

      var name = String(d.get('name') || '').trim();
      var email = String(d.get('email') || '').trim();
      var msg = String(d.get('message') || '').trim();
      if (subjectEl) subjectEl.value = 'Andante demo request' + (name ? ' \u2014 ' + name : '');
      d.set('_subject', subjectEl ? subjectEl.value : 'Andante demo request');

      var mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent('Andante demo request')
        + '&body=' + encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + msg);

      // Appends the "send us an email" fallback link to the status line.
      function appendMailto() {
        if (!statusEl) return;
        var a = document.createElement('a');
        a.href = mailto;
        a.textContent = 'send us an email';
        statusEl.appendChild(a);
        statusEl.appendChild(document.createTextNode('.'));
      }
      function fail(detail) {
        setStatus('error', (detail ? detail + ' ' : '') + 'Please try again, or ');
        appendMailto();
        resetSubmitBtn();
      }

      // Opened straight from disk: FormSubmit refuses pages browsed as files
      // ("open this page through a web server"), so nothing is sent. Say that
      // plainly instead of surfacing the endpoint's raw warning.
      if (window.location.protocol === 'file:') {
        setStatus('notice', 'Local preview: the form only sends from a web server. Serve this folder over http:// to test it, or ');
        appendMailto();
        return;
      }

      setStatus('pending', 'Sending your request\u2026');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending\u2026';
      }

      // FormData keeps this a "simple" POST (no CORS preflight), which is the
      // shape FormSubmit documents for its AJAX endpoint.
      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: d })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          if (r.ok && String(r.data.success) === 'true') {
            setStatus('success', 'Thanks' + (name ? ', ' + name.split(' ')[0] : '')
              + '! Your request is on its way \u2014 we\u2019ll be in touch shortly.');
            form.reset();
            if (subjectEl) subjectEl.value = 'Andante demo request';
            resetSubmitBtn();
          } else {
            var raw = (r.data && r.data.message) || '';
            // FormSubmit answers 200 even when it refuses, e.g. while the inbox
            // still needs its one-time activation.
            if (/activation/i.test(raw)) {
              setStatus('notice', 'Our contact inbox is not live yet, so this request was not delivered. ');
            } else {
              setStatus('error', (raw || 'We could not send your request.') + ' ');
            }
            appendMailto();
            resetSubmitBtn();
          }
        })
        .catch(function () {
          fail('We could not reach our form service.');
        });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAndante);
} else {
  initAndante();
}