/* Shared UI helpers: icons, formatting, toasts, modals, pagination, form errors. */
(function () {
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    students: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.9.8 3 2.8 3 5.6"/>',
    courses: '<path d="M3 5.5C5 4.5 8 4.3 12 6.5c4-2.2 7-2 9-1v13c-2-1-5-1.2-9 1-4-2.2-7-2-9-1z"/><path d="M12 6.5v13"/>',
    attendance: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    results: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
    reports: '<path d="M4 20V4M4 20h16"/><rect x="8" y="12" width="3" height="5" rx=".6"/><rect x="13" y="8" width="3" height="9" rx=".6"/><rect x="18" y="5" width="2.5" height="12" rx=".6"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l3 3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.3 7.8C3.6 9.6 2 12 2 12s3.5 6 10 6c1.6 0 3-.3 4.2-.9"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    printer: '<path d="M7 9V3h10v6M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chevdown: '<path d="M6 9l6 6 6-6"/>',
    chevleft: '<path d="M15 6l-6 6 6 6"/>',
    chevright: '<path d="M9 6l6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    userplus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    trending: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
  };

  SB.icon = function (name, size) {
    var s = size ? ' width="' + size + '" height="' + size + '"' : '';
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + s + ' aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- formatting ---------- */
  SB.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  SB.fmtDate = function (iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0] : iso;
  };
  SB.fmtDateTime = function (iso) {
    if (!iso) return '—';
    var t = String(iso).slice(11, 16);
    return SB.fmtDate(iso) + (t ? ', ' + t : '');
  };
  SB.timeAgo = function (iso) {
    if (!iso) return '';
    var then = new Date(String(iso).replace(' ', 'T'));
    var sec = Math.max(0, (Date.now() - then.getTime()) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return Math.floor(sec / 60) + ' min ago';
    if (sec < 86400) return Math.floor(sec / 3600) + ' h ago';
    if (sec < 86400 * 30) return Math.floor(sec / 86400) + ' d ago';
    return SB.fmtDate(iso);
  };
  SB.initials = function (name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  };
  SB.num = function (v, digits) {
    if (v === null || v === undefined || v === '') return '—';
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits === undefined ? 2 : digits });
  };
  SB.pct = function (v) { return v === null || v === undefined ? '—' : SB.num(v, 1) + '%'; };
  SB.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  SB.debounce = function (fn, ms) {
    var t;
    return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 300); };
  };
  SB.abbr = function (text) {
    return String(text).split(/\s+/).filter(function (w) { return w !== '&'; }).map(function (w) { return w[0]; }).join('').toUpperCase();
  };

  /* ---------- small components ---------- */
  SB.pill = function (text, kind) { return '<span class="pill ' + (kind || 'grey') + '">' + SB.esc(text) + '</span>'; };
  SB.studentStatus = function (s) { return SB.pill(s === 'ACTIVE' ? 'Active' : 'Inactive', s === 'ACTIVE' ? 'green' : 'grey'); };
  SB.attendanceStatus = function (s) {
    var map = { PRESENT: ['Present', 'green'], ABSENT: ['Absent', 'red'], LEAVE: ['Leave', 'amber'] };
    var m = map[s] || [s || '—', 'grey'];
    return SB.pill(m[0], m[1]);
  };
  SB.resultStatus = function (s) {
    if (s === 'PASS') return SB.pill('Pass', 'green');
    if (s === 'FAIL') return SB.pill('Fail', 'red');
    return SB.pill(s || '—', 'grey');
  };
  SB.gradeBadge = function (g) {
    if (!g) return '<span class="muted">—</span>';
    var cls = g === 'F' ? ' f' : (g === 'O' ? ' top' : '');
    return '<span class="grade' + cls + '">' + SB.esc(g) + '</span>';
  };
  SB.meter = function (pct, minimum) {
    if (pct === null || pct === undefined) return '<span class="muted">—</span>';
    var min = minimum === undefined ? 75 : minimum;
    var cls = pct >= min ? '' : (pct >= min - 15 ? 'warn' : 'bad');
    return '<div class="meter ' + cls + '"><div class="bar"><i style="width:' + Math.max(2, Math.min(100, pct)) + '%"></i></div><b>' + SB.num(pct, 1) + '%</b></div>';
  };
  SB.avatar = function (name, extra) { return '<span class="avatar ' + (extra || '') + '">' + SB.esc(SB.initials(name)) + '</span>'; };

  SB.skeleton = function (rows, cols) {
    var cells = '';
    for (var c = 0; c < (cols || 4); c++) cells += '<div class="skeleton"></div>';
    var out = '';
    for (var r = 0; r < (rows || 5); r++) out += '<div class="skel-row">' + cells + '</div>';
    return out;
  };
  SB.empty = function (icon, title, text, actionHtml) {
    return '<div class="empty"><div class="ico">' + SB.icon(icon) + '</div><h3>' + SB.esc(title) + '</h3><p>' + SB.esc(text || '') + '</p>' + (actionHtml || '') + '</div>';
  };
  SB.options = function (items, selected, placeholder) {
    var html = placeholder === undefined ? '' : '<option value="">' + SB.esc(placeholder) + '</option>';
    items.forEach(function (it) {
      var v = Array.isArray(it) ? it[0] : it, l = Array.isArray(it) ? it[1] : it;
      html += '<option value="' + SB.esc(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + SB.esc(l) + '</option>';
    });
    return html;
  };
  SB.deptOptions = function (selected, placeholder) { return SB.options(SB.config.departments, selected, placeholder); };
  SB.semOptions = function (selected, placeholder) {
    return SB.options(SB.config.semesters.map(function (s) { return [s, 'Semester ' + s]; }), selected, placeholder);
  };

  SB.setBusy = function (btn, busy) {
    if (!btn) return;
    btn.classList.toggle('loading', !!busy);
    btn.disabled = !!busy;
  };

  /* ---------- pagination ---------- */
  SB.pager = function (container, info, onPage) {
    var page = info.page, total = info.totalPages, size = info.size, count = info.total;
    var from = count === 0 ? 0 : (page - 1) * size + 1, to = Math.min(count, page * size);
    var pages = [], i;
    for (i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    var btns = '<button type="button" data-p="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + ' aria-label="Previous page">' + SB.icon('chevleft', 16) + '</button>';
    pages.forEach(function (p) {
      btns += p === '…' ? '<span class="gap">…</span>' : '<button type="button" data-p="' + p + '" class="' + (p === page ? 'current' : '') + '">' + p + '</button>';
    });
    btns += '<button type="button" data-p="' + (page + 1) + '" ' + (page >= total ? 'disabled' : '') + ' aria-label="Next page">' + SB.icon('chevright', 16) + '</button>';
    container.innerHTML = '<span>Showing ' + from + '–' + to + ' of ' + count + '</span><div class="pager">' + (total > 1 ? btns : '') + '</div>';
    container.querySelectorAll('button[data-p]').forEach(function (b) {
      b.addEventListener('click', function () { onPage(Number(b.dataset.p)); });
    });
  };

  /* ---------- toasts ---------- */
  SB.toast = function (message, type) {
    var host = document.querySelector('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'success');
    el.innerHTML = SB.icon(type === 'error' ? 'alert' : 'check') + '<span>' + SB.esc(message) + '</span>';
    host.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, type === 'error' ? 6000 : 3800);
  };

  /* ---------- modal ---------- */
  var openModals = [];
  SB.modal = function (opts) {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true" aria-label="' + SB.esc(opts.title) + '">' +
      '<div class="modal-head"><h2>' + SB.esc(opts.title) + '</h2><button type="button" class="icon-action" data-close aria-label="Close">' + SB.icon('x') + '</button></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') + '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    var api = {
      el: backdrop,
      body: backdrop.querySelector('.modal-body'),
      foot: backdrop.querySelector('.modal-foot'),
      close: function () {
        backdrop.remove();
        openModals = openModals.filter(function (m) { return m !== api; });
        if (!openModals.length) document.body.style.overflow = '';
        if (opts.onClose) opts.onClose();
      }
    };
    openModals.push(api);
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop && !opts.persistent) api.close(); });
    backdrop.querySelector('[data-close]').addEventListener('click', api.close);
    var first = backdrop.querySelector('input:not([type=hidden]), select, textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return api;
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModals.length) openModals[openModals.length - 1].close();
  });

  SB.confirm = function (opts) {
    return new Promise(function (resolve) {
      var m = SB.modal({
        title: opts.title || 'Are you sure?', size: 'narrow',
        body: '<div class="confirm-icon">' + SB.icon('trash') + '</div><p>' + opts.message + '</p>',
        footer: '<button type="button" class="btn" data-no>Cancel</button><button type="button" class="btn danger" data-yes>' + SB.esc(opts.confirmText || 'Delete') + '</button>',
        onClose: function () { resolve(false); }
      });
      m.el.querySelector('[data-no]').addEventListener('click', m.close);
      m.el.querySelector('[data-yes]').addEventListener('click', function () {
        m.el.querySelector('[data-yes]').dataset.done = '1';
        resolve(true);
        // closing triggers onClose -> resolve(false), which is ignored because the promise is already settled
        m.close();
      });
    });
  };

  /* ---------- forms ---------- */
  SB.clearErrors = function (form) {
    form.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
    form.querySelectorAll('.field-error').forEach(function (e) { e.textContent = ''; });
    var banner = form.querySelector('.form-alert');
    if (banner) banner.hidden = true;
  };
  SB.showErrors = function (form, errors, message) {
    var first = null;
    Object.keys(errors || {}).forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      var field = input && input.closest('.field');
      if (!field) return;
      field.classList.add('invalid');
      var err = field.querySelector('.field-error');
      if (!err) { err = document.createElement('div'); err.className = 'field-error'; field.appendChild(err); }
      err.textContent = errors[name];
      if (!first) first = input;
    });
    var banner = form.querySelector('.form-alert');
    if (banner && message) { banner.querySelector('span').textContent = message; banner.hidden = false; }
    if (first) first.focus();
  };
  SB.formData = function (form) {
    var out = {};
    new FormData(form).forEach(function (v, k) { out[k] = typeof v === 'string' ? v.trim() : v; });
    return out;
  };
  SB.bindPasswordToggles = function (root) {
    (root || document).querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.dataset.togglePassword);
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = SB.icon(show ? 'eyeoff' : 'eye');
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  };

  /* tabs: <div class="tabs" data-tabs><button data-tab="x">..</button></div> + <section data-panel="x"> */
  SB.tabs = function (container, onChange) {
    var buttons = container.querySelectorAll('[data-tab]');
    function activate(name) {
      buttons.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); b.setAttribute('aria-selected', b.dataset.tab === name); });
      document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
      if (onChange) onChange(name);
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { activate(b.dataset.tab); }); });
    return activate;
  };

  SB.errorMessage = function (e) { return (e && e.message) || 'Something went wrong. Please try again.'; };
  SB.qs = function (name) { return new URLSearchParams(location.search).get(name); };

  /* ---------- shared data helpers ---------- */
  var courseCache = null;
  SB.loadCourses = async function (force) {
    if (!courseCache || force) courseCache = (await SB.api.get('api/courses', { size: 200 })).items;
    return courseCache;
  };
  SB.courseOptions = function (courses, selected, placeholder) {
    return SB.options(courses.map(function (c) { return [c.id, c.courseCode + ' · ' + c.courseName]; }), selected, placeholder);
  };

  /* Fetches every page of a paged endpoint (used for client-side CSV export of list screens). */
  SB.fetchAll = async function (path, params) {
    var all = [], page = 1, data;
    do {
      data = await SB.api.get(path, Object.assign({}, params, { page: page, size: 200 }));
      all = all.concat(data.items);
      page++;
    } while (page <= data.totalPages && page <= 50);
    return all;
  };

  /* Downloads rows as an Excel-friendly CSV. Text cells that start with = + - @ are neutralised. */
  SB.downloadCsv = function (filename, columns, rows) {
    function cell(v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      if (typeof v === 'string' && /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var lines = [columns.map(function (c) { return cell(c.label); }).join(',')];
    rows.forEach(function (r) { lines.push(columns.map(function (c) { return cell(r[c.key]); }).join(',')); });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})();
