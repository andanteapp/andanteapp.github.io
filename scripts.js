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

  /* Demo CTA placeholder ----------
     All "Book a demo" / "Partner on a study" actions point at #book-a-demo.
     Wire the real destination here (mailto:, booking link or modal). */
  document.querySelectorAll('a[href="#book-a-demo"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // TODO: replace with the real demo request flow (email or booking form).
      console.log('Demo/Call-to-action requested — wire a destination here.');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAndante);
} else {
  initAndante();
}