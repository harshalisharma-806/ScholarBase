/* Builds the authenticated app shell (top bar, sidebar, search, notifications, profile menu) around <main id="page">. */
(function () {
  var NAV = [
    ['dashboard', 'Dashboard', 'dashboard.html', 'dashboard'],
    ['students', 'Students', 'students.html', 'students'],
    ['courses', 'Courses', 'courses.html', 'courses'],
    ['attendance', 'Attendance', 'attendance.html', 'attendance'],
    ['results', 'Marks & Results', 'results.html', 'results'],
    ['reports', 'Reports & Analytics', 'reports.html', 'reports'],
    ['settings', 'Settings', 'settings.html', 'settings']
  ];

  var current = document.body.dataset.page;
  var main = document.getElementById('page');

  var navHtml = NAV.map(function (n) {
    return '<a href="' + n[2] + '" class="' + (n[0] === current ? 'active' : '') + '"' + (n[0] === current ? ' aria-current="page"' : '') + '>' + SB.icon(n[3]) + '<span>' + n[1] + '</span></a>';
  }).join('') + '<a href="../logout" class="logout">' + SB.icon('logout') + '<span>Logout</span></a>';

  var shell = document.createElement('div');
  shell.innerHTML =
    '<header class="topbar">' +
      '<button type="button" class="icon-btn menu-btn" id="menuBtn" aria-label="Open navigation">' + SB.icon('menu') + '</button>' +
      '<a class="brand" href="dashboard.html"><img src="../assets/img/logo-mark.svg" alt="ScholarBase logo"><span class="brand-text"><strong>ScholarBase</strong><small>Student Records</small></span></a>' +
      '<div class="search" id="globalSearch" role="search">' + SB.icon('search') +
        '<input type="search" placeholder="Search students or courses…" autocomplete="off" aria-label="Search students or courses">' +
        '<div class="search-results" hidden></div></div>' +
      '<div class="topbar-right">' +
        '<div class="dropdown" id="notifWrap"><button type="button" class="icon-btn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications">' + SB.icon('bell') + '<span class="dot" hidden>0</span></button>' +
          '<div class="menu notif-menu" hidden><header>Notifications</header><div class="notif-body"></div></div></div>' +
        '<div class="dropdown" id="profileWrap"><button type="button" class="profile-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar navy">…</span>' +
          '<span class="pname"><strong>Loading…</strong><small>Administrator</small></span>' + SB.icon('chevdown', 16) + '</button>' +
          '<div class="menu" hidden>' +
            '<a href="settings.html">' + SB.icon('user') + 'Profile &amp; settings</a>' +
            '<a href="settings.html#security">' + SB.icon('shield') + 'Change password</a><hr>' +
            '<a href="../logout" class="danger">' + SB.icon('logout') + 'Sign out</a></div></div>' +
      '</div>' +
    '</header>' +
    '<aside class="sidebar" id="sidebar" aria-label="Main navigation"><div class="nav-label">Menu</div><nav class="nav">' + navHtml + '</nav>' +
      '<div class="sidebar-foot"><strong>ScholarBase</strong>Smarter Student Management, Better Academic Insights.</div></aside>' +
    '<div class="scrim" id="scrim"></div>' +
    '<div class="content" id="content"></div>';

  while (shell.firstChild) document.body.insertBefore(shell.firstChild, main);
  var content = document.getElementById('content');
  content.appendChild(main);
  main.classList.add('page');

  /* ---------- mobile navigation ---------- */
  function closeNav() { document.body.classList.remove('nav-open'); }
  document.getElementById('menuBtn').addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
  document.getElementById('scrim').addEventListener('click', closeNav);
  document.querySelectorAll('#sidebar a').forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ---------- dropdown menus ---------- */
  function wireDropdown(wrapId, onOpen) {
    var wrap = document.getElementById(wrapId), btn = wrap.querySelector('button'), menu = wrap.querySelector('.menu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      document.querySelectorAll('.dropdown .menu').forEach(function (m) { m.hidden = true; });
      document.querySelectorAll('.dropdown > button').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      menu.hidden = !willOpen;
      btn.setAttribute('aria-expanded', String(willOpen));
      if (willOpen && onOpen) onOpen();
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }
  wireDropdown('notifWrap');
  wireDropdown('profileWrap');
  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown .menu').forEach(function (m) { m.hidden = true; });
    var res = document.querySelector('#globalSearch .search-results');
    if (res) res.hidden = true;
  });

  /* ---------- global search ---------- */
  var searchBox = document.getElementById('globalSearch');
  var searchInput = searchBox.querySelector('input'), results = searchBox.querySelector('.search-results');
  var runSearch = SB.debounce(async function () {
    var q = searchInput.value.trim();
    if (q.length < 2) { results.hidden = true; return; }
    try {
      var data = await SB.api.get('api/search', { q: q });
      var html = '';
      if (data.students.length) {
        html += '<div class="group">Students</div>' + data.students.map(function (s) {
          return '<a href="students.html?view=' + s.id + '">' + SB.avatar(s.fullName) + '<span><strong>' + SB.esc(s.fullName) + '</strong><br><span class="small muted">' + SB.esc(s.rollNumber) + ' · ' + SB.esc(s.department) + '</span></span></a>';
        }).join('');
      }
      if (data.courses.length) {
        html += '<div class="group">Courses</div>' + data.courses.map(function (c) {
          return '<a href="courses.html?view=' + c.id + '"><span class="avatar" style="border-radius:10px">' + SB.icon('courses', 16) + '</span><span><strong>' + SB.esc(c.courseName) + '</strong><br><span class="small muted">' + SB.esc(c.courseCode) + ' · Semester ' + c.semester + '</span></span></a>';
        }).join('');
      }
      results.innerHTML = html || '<div class="none">No matches for “' + SB.esc(q) + '”.</div>';
      results.hidden = false;
    } catch (e) { /* ignore transient search errors */ }
  }, 250);
  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('click', function (e) { e.stopPropagation(); });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = 'students.html?q=' + encodeURIComponent(searchInput.value.trim());
    } else if (e.key === 'Escape') { results.hidden = true; }
  });
  results.addEventListener('click', function (e) { e.stopPropagation(); });

  /* ---------- session + notifications ---------- */
  SB.ready = (async function () {
    var session = await SB.api.get('api/session');
    SB.csrf = session.csrfToken;
    SB.admin = session.admin;
    var btn = document.querySelector('#profileWrap .profile-btn');
    btn.querySelector('.avatar').textContent = SB.initials(SB.admin.fullName);
    btn.querySelector('strong').textContent = SB.admin.fullName;
    loadNotifications();
    return SB.admin;
  })();

  async function loadNotifications() {
    var wrap = document.getElementById('notifWrap');
    var body = wrap.querySelector('.notif-body'), dot = wrap.querySelector('.dot');
    try {
      var data = await SB.api.get('api/notifications');
      dot.hidden = data.count === 0;
      dot.textContent = data.count;
      body.innerHTML = data.items.length ? data.items.map(function (n) {
        return '<a class="notif ' + n.level + '" href="' + SB.esc(n.link) + '"><span class="ico">' + SB.icon(n.level === 'info' ? 'info' : 'alert', 18) + '</span><span><strong>' + SB.esc(n.title) + '</strong><span class="t">' + SB.esc(n.text) + '</span></span></a>';
      }).join('') : '<div class="notif-empty">You are all caught up.</div>';
    } catch (e) {
      body.innerHTML = '<div class="notif-empty">Could not load notifications.</div>';
    }
  }
})();
