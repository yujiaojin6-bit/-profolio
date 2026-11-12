/* Site motion, counters, reading progress, and featured project switching. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var progress = document.querySelector('.scroll-progress');
  var counterObserver = null;
  var animatedNumbers = new WeakSet();

  function updateScrollState() {
    document.body.classList.toggle('scrolled', window.scrollY > 8);
    if (!progress || reduced) return;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progress.style.transform = 'scaleX(' + Math.min(Math.max(ratio, 0), 1) + ')';
  }

  function formatNumber(value, decimals, useGrouping) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: useGrouping
    });
  }

  function animateNumber(el) {
    if (reduced || animatedNumbers.has(el)) return;
    animatedNumbers.add(el);

    var target = Number(el.dataset.count);
    var decimals = Number(el.dataset.decimals || 0);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var grouping = el.dataset.format === 'comma';
    if (!Number.isFinite(target)) return;

    var startTime = null;
    var duration = 1250;
    var finalText = el.textContent.trim();

    function tick(time) {
      if (startTime === null) startTime = time;
      var progressRatio = Math.min((time - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progressRatio, 4);
      var value = target * eased;
      el.textContent = prefix + formatNumber(value, decimals, grouping) + suffix;
      if (progressRatio < 1) {
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
      }
    }

    el.textContent = prefix + formatNumber(0, decimals, grouping) + suffix;
    window.requestAnimationFrame(tick);
  }

  function observeCounters(root) {
    if (!root) return;
    var numbers = root.querySelectorAll('.count-up');
    if (reduced || !('IntersectionObserver' in window)) {
      if (!reduced) numbers.forEach(animateNumber);
      return;
    }
    numbers.forEach(function (number) { counterObserver.observe(number); });
  }

  function initCapabilityTabs() {
    var buttons = Array.from(document.querySelectorAll('.capability-tab'));
    var panels = Array.from(document.querySelectorAll('.capability-panel'));
    if (!buttons.length || !panels.length) return;

    function activate(button, focusButton) {
      var key = button.dataset.capability;
      var panel = document.querySelector('[data-capability-panel="' + key + '"]');
      if (!panel) return;

      buttons.forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        if (active && focusButton) item.focus();
      });
      panels.forEach(function (item) {
        var active = item === panel;
        item.hidden = !active;
        item.classList.toggle('is-active', active);
        if (active) item.classList.add('is-visible');
      });
      observeCounters(panel);
    }

    buttons.forEach(function (button, index) {
      button.tabIndex = button.classList.contains('is-active') ? 0 : -1;
      button.addEventListener('click', function () { activate(button, false); });
      button.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(buttons[next], true);
      });
    });
  }

  function initToolkitAccordion() {
    var buttons = Array.from(document.querySelectorAll('.toolkit-toggle'));
    if (!buttons.length) return;

    function activate(button, focusButton) {
      buttons.forEach(function (item) {
        var active = button !== null && item === button;
        item.setAttribute('aria-expanded', String(active));
        var panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
        if (panel && active) {
          panel.querySelectorAll('.skill-card').forEach(function (card) {
            card.classList.add('is-visible');
          });
        }
        var indicator = item.querySelector('.toolkit-chevron');
        if (indicator) indicator.textContent = active ? '\u2212' : '+';
        if (active && focusButton) item.focus();
      });
    }

    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        activate(button.getAttribute('aria-expanded') === 'true' ? null : button, false);
      });
      button.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(buttons[next], true);
      });
    });
  }

  function initReveals() {
    var targets = document.querySelectorAll(
      '.section-heading, .impact-item, .capability-tab, .capability-panel:not([hidden]),' +
      ' .toolkit-skill-group, .skill-card, .featured-project, .contact > .container > *'
    );

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (target) { target.classList.add('is-visible'); });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    targets.forEach(function (target, index) {
      target.classList.add('reveal-ready');
      target.style.setProperty('--reveal-delay', Math.min((index % 4) * 70, 210) + 'ms');
      revealObserver.observe(target);
    });
  }

  if (!reduced && 'IntersectionObserver' in window) {
    counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        animateNumber(entry.target);
      });
    }, { threshold: 0.35 });
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState);
  updateScrollState();
  initReveals();
  initCapabilityTabs();
  initToolkitAccordion();
  observeCounters(document.querySelector('.impact'));
  document.querySelectorAll('.featured-project').forEach(observeCounters);
  observeCounters(document.querySelector('.capability-panel:not([hidden])'));
})();
