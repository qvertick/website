/**
 * adapter @xakurr — sparks, tilt, skills, modal
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initSparks() {
    const canvas = document.getElementById('sparks-canvas');
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let sparks = [];
    let rafId = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.floor((width * height) / 9000));
      sparks = Array.from({ length: count }, createSpark);
    }

    function createSpark() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2.4 + 0.6,
        alpha: Math.random() * 0.45 + 0.35,
        phase: Math.random() * Math.PI * 2
      };
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.phase += 0.02;
        const flicker = 0.5 + 0.5 * Math.sin(s.phase);

        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
        const a = s.alpha * flicker;
        gradient.addColorStop(0, 'rgba(255,255,255,' + a + ')');
        gradient.addColorStop(0.35, 'rgba(180,220,255,' + (a * 0.65) + ')');
        gradient.addColorStop(0.65, 'rgba(124,108,255,' + (a * 0.25) + ')');
        gradient.addColorStop(1, 'rgba(124,108,255,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    }

    resize();
    tick();

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
  }

  /**
   * Tilt на всю вкладку «Расценки»
   * perspective(1000px), макс. 10°, плавный возврат 0.5s ease
   */
  function initTilt() {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const PERSPECTIVE = 1000;
    const LEAVE_TRANSITION = 'transform 0.5s ease';
    const MOVE_TRANSITION = 'transform 0.1s ease-out';
    const selector = '.pricing-panel[data-tilt]';

    document.querySelectorAll(selector).forEach(function (card) {
      let rect = null;
      const maxTilt = Math.min(10, parseFloat(card.getAttribute('data-tilt-max')) || 8);

      card.classList.add('tilt-enabled');

      function applyTransform(rotateX, rotateY) {
        card.style.transform =
          'perspective(' + PERSPECTIVE + 'px) rotateX(' +
          rotateX.toFixed(2) + 'deg) rotateY(' +
          rotateY.toFixed(2) + 'deg)';
      }

      function onEnter() {
        rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
        card.style.transition = MOVE_TRANSITION;
      }

      function onMove(e) {
        if (!rect) rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateY = ((x - cx) / cx) * maxTilt;
        const rotateX = ((cy - y) / cy) * maxTilt;
        applyTransform(rotateX, rotateY);
      }

      function onLeave() {
        rect = null;
        card.classList.remove('is-tilting');
        card.style.transition = LEAVE_TRANSITION;
        applyTransform(0, 0);
      }

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  function initSkillBars() {
    document.querySelectorAll('.skill-row').forEach(function (row, index) {
      const value = Math.min(100, Math.max(0, parseInt(row.getAttribute('data-value'), 10) || 0));
      const fill = row.querySelector('.skill-fill');
      const pctEl = row.querySelector('.skill-pct');
      if (!fill) return;

      if (prefersReducedMotion) {
        fill.style.width = value + '%';
        if (pctEl) pctEl.textContent = value + '%';
        return;
      }

      window.setTimeout(function () {
        fill.style.width = value + '%';
        if (pctEl) animateNumber(pctEl, 0, value, 1100);
      }, 500 + index * 140);
    });
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased) + '%';
      if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initDetailsModal() {
    const btn = document.querySelector('.btn-details');
    const modal = document.getElementById('details-modal');
    if (!btn || !modal) return;

    const closeTriggers = modal.querySelectorAll('[data-close-modal]');
    let lastFocus = null;

    function openModal(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      lastFocus = document.activeElement;
      modal.removeAttribute('hidden');
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal(e) {
      if (e) e.stopPropagation();
      modal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      window.setTimeout(function () {
        modal.setAttribute('hidden', '');
        if (lastFocus && typeof lastFocus.focus === 'function') {
          lastFocus.focus();
        }
      }, 320);
    }

    btn.addEventListener('click', openModal);

    closeTriggers.forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  function boot() {
    initSparks();
    initTilt();
    initSkillBars();
    initDetailsModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
