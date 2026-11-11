/* Sky portfolio visual editor.
   - Normal visitors see the site as usual; saved edits are applied on load.
   - Edit mode only when the URL has ?edit=1 (or #edit, or localStorage
     sky-editor-on = "1"): click any text or image, then use the panel on
     the right to change its text, font size, colour, background, weight,
     line height, alignment, or image width.
   - Edits are saved in this browser (localStorage, key below) and can be
     copied out as CSS with "Copy CSS" so they can be pasted into the
     site's stylesheet and pushed to GitHub as a permanent change.
*/
(function () {
  'use strict';
  var STORAGE_KEY = 'sky-portfolio-edits-v1';
  var SELECTABLE = 'h1,h2,h3,h4,p,span,a,li,img';
  var params = new URLSearchParams(window.location.search);
  var editMode = params.get('edit') === '1' ||
    window.location.hash === '#edit' ||
    window.localStorage.getItem('sky-editor-on') === '1';

  function loadSaved() {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveAll(data) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function assignIds() {
    var els = document.querySelectorAll(SELECTABLE);
    var n = 0;
    els.forEach(function (el) {
      if (el.closest('#sky-editor-panel, #sky-editor-badge, script, style')) return;
      if (el.closest('iframe')) return;
      if (!el.getAttribute('data-edit-id')) {
        n += 1;
        el.setAttribute('data-edit-id', 'e' + n);
      }
    });
  }

  function applyStyle(el, styles) {
    Object.keys(styles).forEach(function (prop) {
      var v = styles[prop];
      if (v === '' || v == null) { el.style[prop] = ''; return; }
      el.style[prop] = v;
    });
  }

  function applySaved() {
    var saved = loadSaved();
    if (saved.__globals) {
      var root = document.documentElement;
      if (saved.__globals.accent) root.style.setProperty('--purple', saved.__globals.accent);
      if (saved.__globals.paper) root.style.setProperty('--paper', saved.__globals.paper);
    }
    Object.keys(saved).forEach(function (id) {
      if (id === '__globals') return;
      var el = document.querySelector('[data-edit-id="' + id + '"]');
      if (!el) return;
      var entry = saved[id];
      if (entry.text != null && el.children.length === 0) el.textContent = entry.text;
      if (entry.styles) applyStyle(el, entry.styles);
    });
  }

  function exportSelector(el) {
    if (el.id) return '#' + el.id;
    var article = el.closest('article[data-accent]');
    var tag = el.tagName.toLowerCase();
    var cls = (el.className && typeof el.className === 'string')
      ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    var base = tag + cls;
    if (article) return 'article[data-accent="' + article.getAttribute('data-accent') + '"] ' + base;
    return base;
  }

  function buildCss() {
    var saved = loadSaved();
    var lines = [];
    Object.keys(saved).forEach(function (id) {
      if (id === '__globals') return;
      var el = document.querySelector('[data-edit-id="' + id + '"]');
      if (!el || !saved[id].styles) return;
      var decls = Object.keys(saved[id].styles).map(function (p) {
        var cssProp = p.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
        return '  ' + cssProp + ': ' + saved[id].styles[p] + ';';
      }).join('\n');
      if (decls) lines.push(exportSelector(el) + ' {\n' + decls + '\n}');
    });
    if (saved.__globals) {
      if (saved.__globals.accent) lines.push(':root {\n  --purple: ' + saved.__globals.accent + ';\n}');
      if (saved.__globals.paper) lines.push(':root {\n  --paper: ' + saved.__globals.paper + ';\n}');
    }
    return lines.join('\n\n');
  }

  assignIds();
  applySaved();
  if (!editMode) return;

  document.body.classList.add('edit-mode');
  window.localStorage.setItem('sky-editor-on', '1');

  var selected = null;
  var saved = loadSaved();

  function ensureEntry(id) {
    if (!saved[id]) saved[id] = { styles: {} };
    if (!saved[id].styles) saved[id].styles = {};
    return saved[id];
  }
  function setStatus(msg) {
    var s = document.getElementById('sky-editor-status');
    if (s) s.textContent = msg;
  }
  function persist() { saveAll(saved); }

  var panel = document.createElement('div');
  panel.id = 'sky-editor-panel';
  panel.innerHTML =
    '<h2>\u270e Edit mode</h2>' +
    '<p class="sky-editor-sub">Click any text or image on the page, then adjust it here. Changes save in this browser automatically.</p>' +
    '<p class="sky-editor-selected-label" id="sky-editor-selected">Nothing selected yet \u2014 click a heading, paragraph, or image.</p>' +
    '<label for="sky-text">Text</label>' +
    '<textarea id="sky-text" placeholder="Edit the wording\u2026"></textarea>' +
    '<label for="sky-font-size">Font size: <span id="sky-font-size-val">\u2014</span></label>' +
    '<input type="range" id="sky-font-size" min="10" max="80" step="1" value="16">' +
    '<label for="sky-color">Text colour</label>' +
    '<input type="color" id="sky-color" value="#171517">' +
    '<label for="sky-bg">Background colour</label>' +
    '<input type="color" id="sky-bg" value="#ffffff">' +
    '<label for="sky-weight">Font weight</label>' +
    '<select id="sky-weight"><option value="">\u2014 keep \u2014</option><option value="400">400 regular</option><option value="600">600 semi-bold</option><option value="700">700 bold</option></select>' +
    '<label for="sky-line-height">Line height: <span id="sky-line-height-val">\u2014</span></label>' +
    '<input type="range" id="sky-line-height" min="1" max="2" step="0.05" value="1.6">' +
    '<label for="sky-align">Alignment</label>' +
    '<select id="sky-align"><option value="">\u2014 keep \u2014</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>' +
    '<label for="sky-img-width">Image width: <span id="sky-img-width-val">\u2014</span></label>' +
    '<input type="range" id="sky-img-width" min="20" max="100" step="1" value="100">' +
    '<label for="sky-accent">Site accent colour (purple)</label>' +
    '<input type="color" id="sky-accent" value="#4d2d75">' +
    '<label for="sky-paper">Page background colour</label>' +
    '<input type="color" id="sky-paper" value="#f9f5f1">' +
    '<div class="sky-editor-row"><button type="button" id="sky-reset-one">Reset this</button><button type="button" id="sky-reset-all">Reset all</button></div>' +
    '<div class="sky-editor-row"><button type="button" class="sky-editor-primary" id="sky-copy-css">Copy CSS</button><button type="button" id="sky-copy-json">Copy saved data</button></div>' +
    '<div class="sky-editor-row"><button type="button" id="sky-exit">Exit edit mode</button></div>' +
    '<p class="sky-editor-status" id="sky-editor-status"></p>' +
    '<p class="sky-editor-note">\u201cCopy CSS\u201d gives you the permanent version: paste it into the site stylesheet and push to GitHub, and everyone sees it \u2014 not just this browser.</p>';
  document.body.appendChild(panel);

  var badge = document.createElement('div');
  badge.id = 'sky-editor-badge';
  badge.textContent = 'EDIT MODE \u2014 ?edit=1';
  document.body.appendChild(badge);

  function rgbToHex(rgb) {
    var m = rgb && rgb.match(/\d+/g);
    if (!m) return '#171517';
    return '#' + m.slice(0, 3).map(function (n) {
      var h = parseInt(n, 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function select(el) {
    document.querySelectorAll('.sky-edit-selected').forEach(function (n) {
      n.classList.remove('sky-edit-selected');
    });
    selected = el;
    el.classList.add('sky-edit-selected');
    var label = document.getElementById('sky-editor-selected');
    var desc = el.tagName.toLowerCase() +
      (el.id ? ' #' + el.id : '') +
      (el.className && typeof el.className === 'string' && el.className ? ' .' + String(el.className).trim().split(/\s+/).join('.') : '') +
      ' \u2014 \u201c' + (el.textContent || el.alt || '').trim().slice(0, 60) + '\u201d';
    label.textContent = 'Selected: ' + desc;
    var cs = window.getComputedStyle(el);
    document.getElementById('sky-text').value = el.children.length === 0 ? el.textContent.trim() : '';
    document.getElementById('sky-text').disabled = el.children.length !== 0;
    var fs = parseFloat(cs.fontSize) || 16;
    document.getElementById('sky-font-size').value = Math.round(fs);
    document.getElementById('sky-font-size-val').textContent = Math.round(fs) + 'px';
    document.getElementById('sky-color').value = rgbToHex(cs.color);
    document.getElementById('sky-bg').value = rgbToHex(cs.backgroundColor);
    document.getElementById('sky-weight').value = String(cs.fontWeight);
    var lh = parseFloat(cs.lineHeight) / fs;
    document.getElementById('sky-line-height').value = isFinite(lh) ? lh.toFixed(2) : 1.6;
    document.getElementById('sky-line-height-val').textContent = isFinite(lh) ? lh.toFixed(2) : '\u2014';
    document.getElementById('sky-align').value = cs.textAlign === 'start' ? '' : cs.textAlign;
    var isImg = el.tagName === 'IMG';
    document.getElementById('sky-img-width').disabled = !isImg;
    document.getElementById('sky-img-width-val').textContent = isImg ? '100% (of its frame)' : 'images only';
  }

  function updateSelected(prop, value) {
    if (!selected) { setStatus('Click something on the page first.'); return; }
    var id = selected.getAttribute('data-edit-id');
    var entry = ensureEntry(id);
    if (value === '' || value == null) delete entry.styles[prop];
    else entry.styles[prop] = value;
    applyStyle(selected, entry.styles);
    persist();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#sky-editor-panel, #sky-editor-badge')) return;
    var target = e.target.closest(SELECTABLE);
    if (!target || target.closest('#sky-editor-panel')) return;
    e.preventDefault();
    e.stopPropagation();
    select(target);
  }, true);

  document.getElementById('sky-text').addEventListener('input', function (e) {
    if (!selected || selected.children.length !== 0) return;
    selected.textContent = e.target.value;
    var id = selected.getAttribute('data-edit-id');
    ensureEntry(id).text = e.target.value;
    persist();
  });
  document.getElementById('sky-font-size').addEventListener('input', function (e) {
    document.getElementById('sky-font-size-val').textContent = e.target.value + 'px';
    updateSelected('fontSize', e.target.value + 'px');
  });
  document.getElementById('sky-color').addEventListener('input', function (e) {
    updateSelected('color', e.target.value);
  });
  document.getElementById('sky-bg').addEventListener('input', function (e) {
    updateSelected('backgroundColor', e.target.value);
  });
  document.getElementById('sky-weight').addEventListener('change', function (e) {
    updateSelected('fontWeight', e.target.value);
  });
  document.getElementById('sky-line-height').addEventListener('input', function (e) {
    document.getElementById('sky-line-height-val').textContent = e.target.value;
    updateSelected('lineHeight', e.target.value);
  });
  document.getElementById('sky-align').addEventListener('change', function (e) {
    updateSelected('textAlign', e.target.value);
  });
  document.getElementById('sky-img-width').addEventListener('input', function (e) {
    document.getElementById('sky-img-width-val').textContent = e.target.value + '%';
    updateSelected('width', e.target.value + '%');
  });
  document.getElementById('sky-accent').addEventListener('input', function (e) {
    if (!saved.__globals) saved.__globals = {};
    saved.__globals.accent = e.target.value;
    document.documentElement.style.setProperty('--purple', e.target.value);
    persist();
  });
  document.getElementById('sky-paper').addEventListener('input', function (e) {
    if (!saved.__globals) saved.__globals = {};
    saved.__globals.paper = e.target.value;
    document.documentElement.style.setProperty('--paper', e.target.value);
    persist();
  });
  document.getElementById('sky-reset-one').addEventListener('click', function () {
    if (!selected) return;
    var id = selected.getAttribute('data-edit-id');
    delete saved[id];
    selected.removeAttribute('style');
    selected.classList.remove('sky-edit-selected');
    selected = null;
    persist();
    setStatus('That element was reset.');
  });
  document.getElementById('sky-reset-all').addEventListener('click', function () {
    if (!window.confirm('Reset every saved edit?')) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
  function copyText(text, msg) {
    function done() { setStatus(msg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { setStatus('Copy failed \u2014 select the text manually.'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { setStatus('Copy failed.'); }
      ta.remove();
    }
  }
  document.getElementById('sky-copy-css').addEventListener('click', function () {
    var css = buildCss();
    if (!css) { setStatus('No edits saved yet \u2014 change something first.'); return; }
    copyText(css, 'CSS copied. Paste it into the stylesheet to make it permanent.');
  });
  document.getElementById('sky-copy-json').addEventListener('click', function () {
    copyText(JSON.stringify(loadSaved(), null, 2), 'Saved edits copied as JSON.');
  });
  document.getElementById('sky-exit').addEventListener('click', function () {
    window.localStorage.removeItem('sky-editor-on');
    document.body.classList.remove('edit-mode');
    var url = new URL(window.location.href);
    url.searchParams.delete('edit');
    url.hash = '';
    window.location.href = url.toString();
  });
})();
