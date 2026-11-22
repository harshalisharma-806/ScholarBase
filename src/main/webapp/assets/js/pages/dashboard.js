/* Dashboard: every figure is loaded from /api/dashboard (MySQL). */
(function () {
  var page = document.getElementById('page');

  function load() {
    page.innerHTML = '<div class="page-head"><div><h1>Dashboard</h1><p>Loading your institution overview…</p></div></div>' +
      '<div class="grid cols-4">' + [1, 2, 3, 4].map(function () { return '<div class="card card-pad">' + SB.skeleton(2, 1) + '</div>'; }).join('') + '</div>';
    SB.api.get('api/dashboard').then(render).catch(function (e) {
      page.innerHTML = '<div class="card">' + SB.empty('alert', 'Could not load the dashboard', SB.errorMessage(e),
        '<button type="button" class="btn primary" id="retry">Try again</button>') + '</div>';
      document.getElementById('retry').addEventListener('click', load);
    });
  }

  function listCard(title, subtitle, body) {
    return '<section class="card"><div class="card-head"><div><h2>' + title + '</h2><p>' + subtitle + '</p></div></div><div class="card-body">' + body + '</div></section>';
  }
  function chartCard(title, subtitle, id, extra) {
    return '<section class="card"><div class="card-head"><div><h2>' + title + '</h2><p>' + subtitle + '</p></div>' + (extra || '') + '</div><div class="card-body" id="' + id + '"></div></section>';
  }

  function render(d) {
    var s = d.stats;
    var greeting = new Date().getHours() < 12 ? 'Good morning' : (new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening');
    var first = SB.admin.fullName.split(' ')[0];

    var html = '<div class="page-head"><div><h1>' + greeting + ', ' + SB.esc(first) + '</h1><p>Here is how ScholarBase is doing today.</p></div>' +
      '<div class="page-actions"><a class="btn" href="reports.html">' + SB.icon('reports', 16) + 'View reports</a><a class="btn primary" href="students.html?add=1">' + SB.icon('userplus', 16) + 'Add student</a></div></div>';

    html += '<div class="grid cols-4">' +
      stat('c1', 'students', 'Total students', SB.num(s.totalStudents, 0), s.activeStudents + ' active · ' + s.newThisWeek + ' new this week') +
      stat('c2', 'courses', 'Total courses', SB.num(s.totalCourses, 0), 'Across all departments') +
      stat('c3', 'attendance', 'Average attendance', SB.pct(s.averageAttendance), s.averageAttendance === null ? 'No attendance marked yet' : (s.averageAttendance >= s.attendanceMinimum ? 'Above' : 'Below') + ' the ' + s.attendanceMinimum + '% requirement') +
      stat('c4', 'results', 'Average performance', SB.pct(s.averagePerformance), s.averagePerformance === null ? 'No marks entered yet' : 'Mean course score') +
      '</div>';

    html += '<div class="grid split mt">' +
      chartCard('Student enrollment overview', 'Students per department', 'chDept') +
      chartCard('Attendance analytics', 'Share of classes by status', 'chAttStatus') + '</div>';

    html += '<div class="grid split mt">' +
      chartCard('Attendance trend', 'Daily attendance percentage, most recent sessions', 'chTrend') +
      chartCard('Enrollment by semester', 'Students per semester', 'chSem') + '</div>';

    html += '<div class="grid cols-2 mt">' +
      chartCard('Academic performance', 'Average score per course', 'chPerf') +
      chartCard('Grade distribution', 'Course results by grade', 'chGrades') + '</div>';

    html += '<div class="grid cols-3 mt">' +
      listCard('Recent registrations', 'Newest students', list(d.recentRegistrations.map(function (st) {
        return '<a class="list-item" href="students.html?view=' + st.id + '">' + SB.avatar(st.fullName) +
          '<div class="grow"><span class="t">' + SB.esc(st.fullName) + '</span><span class="s">' + SB.esc(st.rollNumber) + ' · ' + SB.esc(SB.abbr(st.department)) + '</span></div>' +
          '<span class="small muted nowrap">' + SB.timeAgo(st.createdAt) + '</span></a>';
      }), 'No students registered yet.')) +
      listCard('Top-performing students', 'Highest average score', list(d.topStudents.map(function (t, i) {
        return '<a class="list-item" href="students.html?view=' + t.studentId + '"><span class="rank ' + (i === 0 ? 'r1' : '') + '">' + (i + 1) + '</span>' +
          '<div class="grow"><span class="t">' + SB.esc(t.studentName) + '</span><span class="s">' + SB.esc(t.rollNumber) + ' · ' + SB.esc(SB.abbr(t.department)) + '</span></div>' +
          '<strong>' + SB.pct(t.percentage) + '</strong></a>';
      }), 'Marks have not been entered yet.')) +
      listCard('Recently updated records', 'Latest edits', list(d.recentlyUpdated.map(function (u) {
        return '<div class="list-item"><span class="pill ' + ({ STUDENT: 'blue', COURSE: 'lav', RESULT: 'green' }[u.type] || 'grey') + ' plain">' + SB.esc(u.type.charAt(0) + u.type.slice(1).toLowerCase()) + '</span>' +
          '<div class="grow"><span class="t">' + SB.esc(u.title) + '</span><span class="s">' + SB.esc(u.subtitle) + '</span></div>' +
          '<span class="small muted nowrap">' + SB.timeAgo(u.ts) + '</span></div>';
      }), 'Nothing has been edited yet.')) + '</div>';

    html += '<div class="mt">' + listCard('Recent activity', 'What has happened across ScholarBase',
      d.recentActivity.length ? '<ul class="timeline">' + d.recentActivity.map(function (a) {
        return '<li class="t-' + String(a.type).toLowerCase() + '"><div>' + SB.esc(a.text) + '</div><div class="when">' + SB.fmtDateTime(a.ts) + ' · ' + SB.timeAgo(a.ts) + '</div></li>';
      }).join('') + '</ul>' : '<p class="muted">No activity yet.</p>') + '</div>';

    page.innerHTML = html;

    SB.charts.hbar(document.getElementById('chDept'), d.enrollmentByDepartment, { multicolor: true, label: 'Students per department', emptyText: 'No students registered yet.' });
    var c = d.attendanceStatus || {};
    var attTotal = (c.PRESENT || 0) + (c.ABSENT || 0) + (c.LEAVE || 0);
    SB.charts.donut(document.getElementById('chAttStatus'), [
      { label: 'Present', value: c.PRESENT || 0, color: '#13926a' },
      { label: 'Absent', value: c.ABSENT || 0, color: '#d64545' },
      { label: 'Leave', value: c.LEAVE || 0, color: '#e0a030' }
    ], { centerValue: attTotal ? SB.pct(s.averageAttendance) : '—', centerLabel: 'attendance', emptyText: 'No attendance has been marked yet.' });
    SB.charts.line(document.getElementById('chTrend'), d.attendanceTrend.map(function (t) {
      return { label: SB.fmtDate(t.date).replace(/ \d{4}$/, ''), value: Number(t.percentage) };
    }), { id: 'trend', unit: '%', label: 'Attendance trend', emptyText: 'Mark attendance on at least two days to see the trend.' });
    SB.charts.bar(document.getElementById('chSem'), d.enrollmentBySemester, { multicolor: false, label: 'Students per semester', emptyText: 'No students registered yet.' });
    SB.charts.bar(document.getElementById('chPerf'), d.performanceByCourse.map(function (p) { return { label: p.label, value: Number(p.value) }; }),
      { max: 100, unit: '%', label: 'Average score per course', emptyText: 'No marks have been entered yet.' });
    SB.charts.bar(document.getElementById('chGrades'), d.gradeDistribution, { multicolor: true, label: 'Grade distribution', emptyText: 'No marks have been entered yet.' });
  }

  function stat(cls, icon, label, value, sub) {
    return '<div class="card stat ' + cls + '"><div class="ico">' + SB.icon(icon) + '</div><div><div class="label">' + label + '</div><div class="value">' + value + '</div><div class="sub">' + SB.esc(sub) + '</div></div></div>';
  }
  function list(items, emptyText) {
    return items.length ? '<div class="list">' + items.join('') + '</div>' : '<p class="muted">' + emptyText + '</p>';
  }

  SB.ready.then(load);
})();
