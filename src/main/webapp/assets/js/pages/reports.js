/* Reports & Analytics: one uniform report shape (columns + rows) drives the table, charts, print and CSV. */
(function () {
  var page = document.getElementById('page');
  var TYPES = [
    ['overall', 'Overall performance', 'trending'], ['student', 'Student academic', 'students'], ['course', 'Course performance', 'courses'],
    ['attendance', 'Attendance', 'attendance'], ['department', 'Department statistics', 'reports'], ['toppers', 'Top performers', 'results']
  ];
  var state = { type: SB.qs('type') || 'overall', department: '', courseId: '', limit: 10 };
  var current = null, courses = [];
  var PCT = { percentage: 1, average: 1, highest: 1, lowest: 1, passRate: 1, attendance: 1, averagePercentage: 1 };

  function shell() {
    page.innerHTML = '<div class="page-head"><div><h1>Reports &amp; Analytics</h1><p>Generate academic, attendance and department reports. Print them or export to CSV.</p></div>' +
      '<div class="page-actions"><button type="button" class="btn" id="csvBtn">' + SB.icon('download', 16) + 'Export CSV</button><button type="button" class="btn primary" id="printBtn">' + SB.icon('printer', 16) + 'Print report</button></div></div>' +
      '<div class="tabs" id="tabs" role="tablist" style="margin-bottom:20px">' + TYPES.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div id="filters" class="card no-print" style="margin-bottom:20px" hidden></div><div id="report"></div>';
    var activate = SB.tabs(document.getElementById('tabs'), function (name) {
      state.type = name;
      history.replaceState(null, '', '?type=' + name);
      drawFilters();
      load();
    });
    // SB.tabs toggles [data-panel]; reports has none, so only the active styling is used
    document.getElementById('printBtn').addEventListener('click', function () { window.print(); });
    document.getElementById('csvBtn').addEventListener('click', function () {
      var qs = new URLSearchParams({ type: state.type, format: 'csv' });
      if (state.department) qs.set('department', state.department);
      if (state.courseId) qs.set('courseId', state.courseId);
      if (state.type === 'toppers') qs.set('limit', state.limit);
      window.location.href = SB.url('api/reports?' + qs.toString());
    });
    activate(TYPES.some(function (t) { return t[0] === state.type; }) ? state.type : 'overall');
  }

  function drawFilters() {
    var f = document.getElementById('filters'), html = '';
    if (state.type === 'student' || state.type === 'attendance') {
      html += '<select class="select" id="fDept" aria-label="Department">' + SB.deptOptions(state.department, 'All departments') + '</select>';
    }
    if (state.type === 'attendance') html += '<select class="select" id="fCourse" aria-label="Course">' + SB.courseOptions(courses, state.courseId, 'All courses') + '</select>';
    if (state.type === 'toppers') html += '<label class="small muted" for="fLimit">Show top</label><select class="select" id="fLimit">' + SB.options([5, 10, 20, 50].map(function (n) { return [n, n + ' students']; }), state.limit) + '</select>';
    f.hidden = !html;
    f.innerHTML = html ? '<div class="toolbar" style="border:0">' + html + '</div>' : '';
    [['fDept', 'department'], ['fCourse', 'courseId'], ['fLimit', 'limit']].forEach(function (x) {
      var el = document.getElementById(x[0]);
      if (el) el.addEventListener('change', function () { state[x[1]] = el.value; load(); });
    });
  }

  async function load() {
    var host = document.getElementById('report');
    host.innerHTML = '<div class="card card-pad">' + SB.skeleton(7, 5) + '</div>';
    try {
      current = await SB.api.get('api/reports', { type: state.type, department: state.department, courseId: state.courseId, limit: state.limit });
      render();
    } catch (e) {
      host.innerHTML = '<div class="card">' + SB.empty('alert', 'Could not generate the report', SB.errorMessage(e), '<button type="button" class="btn primary" id="retry">Try again</button>') + '</div>';
      document.getElementById('retry').addEventListener('click', load);
    }
  }

  function cell(key, v) {
    if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
    if (PCT[key]) return SB.pct(v);
    if (key === 'grade') return SB.gradeBadge(v);
    if (key === 'result') return v === '-' ? '<span class="muted">—</span>' : SB.resultStatus(v);
    if (key === 'standing') return SB.pill(v === 'OK' ? 'OK' : 'Shortage', v === 'OK' ? 'green' : 'red');
    if (key === 'rank') return '<span class="rank ' + (v === 1 ? 'r1' : '') + '">' + v + '</span>';
    return typeof v === 'number' ? SB.num(v) : SB.esc(v);
  }

  function render() {
    var d = current, host = document.getElementById('report');
    var html = '<section class="card card-pad"><div class="print-only" style="margin-bottom:14px"><strong style="font-size:18px">ScholarBase</strong><br><span class="muted">Smarter Student Management, Better Academic Insights.</span></div>' +
      '<div class="row-between" style="flex-wrap:wrap"><div><h2 style="font-size:20px">' + SB.esc(d.title) + '</h2><div class="report-meta" style="margin-top:6px"><span>Generated ' + SB.fmtDateTime(d.generatedAt) + '</span>' +
      (state.department ? '<span>Department: ' + SB.esc(state.department) + '</span>' : '') + d.summary.map(function (s) { return '<span>' + SB.esc(s.label) + ': <strong>' + SB.esc(s.value) + '</strong></span>'; }).join('') + '</div></div></div>';

    var charts = chartSlots(d);
    if (charts) html += '<div class="grid cols-2 mt no-break">' + charts + '</div>';

    html += d.rows.length ? '<div class="table-wrap mt"><table class="data compact"><thead><tr>' + d.columns.map(function (c) {
      return '<th' + (PCT[c.key] || /^(total|present|absent|leave|students|active|courses|enrolled|graded|value)$/.test(c.key) ? ' class="num"' : '') + '>' + SB.esc(c.label) + '</th>';
    }).join('') + '</tr></thead><tbody>' + d.rows.map(function (r) {
      return '<tr>' + d.columns.map(function (c) {
        var numeric = PCT[c.key] || /^(total|present|absent|leave|students|active|courses|enrolled|graded|value)$/.test(c.key);
        return '<td' + (numeric ? ' class="num"' : '') + '>' + cell(c.key, r[c.key]) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>' : SB.empty('reports', 'No data for this report', 'Nothing matches the current filters yet.');
    html += '</section>';
    host.innerHTML = html;
    drawCharts(d);
  }

  function chartSlots(d) {
    function slot(id, title) { return '<div><div class="section-title" style="margin-top:0">' + title + '</div><div id="' + id + '"></div></div>'; }
    if (!d.rows.length) return '';
    switch (state.type) {
      case 'department': return slot('ch1', 'Students per department') + slot('ch2', 'Average score per department');
      case 'course': return slot('ch1', 'Average score per course') + slot('ch2', 'Pass rate per course');
      case 'toppers': return slot('ch1', 'Average score of top students');
      case 'attendance': return slot('ch1', 'Attendance status of students') + slot('ch2', 'Lowest attendance');
      case 'student': return slot('ch1', 'Result distribution') + slot('ch2', 'Grade distribution');
      case 'overall': return slot('ch1', 'Course pass rate') + slot('ch2', 'Attendance vs. requirement');
      default: return '';
    }
  }

  function drawCharts(d) {
    var c1 = document.getElementById('ch1'), c2 = document.getElementById('ch2');
    if (!c1) return;
    function metric(name) { var r = d.rows.filter(function (x) { return x.metric && x.metric.indexOf(name) === 0; })[0]; return r ? r.value : null; }
    function tally(key) { var o = {}; d.rows.forEach(function (r) { var v = r[key]; if (v !== null && v !== undefined) o[v] = (o[v] || 0) + 1; }); return o; }
    var abbr = function (s) { return SB.abbr(s); };
    switch (state.type) {
      case 'department':
        SB.charts.hbar(c1, d.rows.map(function (r) { return { label: r.department, value: r.students }; }), { multicolor: true });
        SB.charts.bar(c2, d.rows.map(function (r) { return { label: abbr(r.department), value: Number(r.averagePercentage || 0) }; }), { max: 100, unit: '%', multicolor: true, emptyText: 'No marks entered yet.' });
        break;
      case 'course':
        SB.charts.bar(c1, d.rows.map(function (r) { return { label: r.courseCode, value: Number(r.average || 0) }; }), { max: 100, unit: '%', emptyText: 'No marks entered yet.' });
        SB.charts.bar(c2, d.rows.map(function (r) { return { label: r.courseCode, value: Number(r.passRate || 0) }; }), { max: 100, unit: '%', color: '#13926a', emptyText: 'No marks entered yet.' });
        break;
      case 'toppers':
        SB.charts.hbar(c1, d.rows.map(function (r) { return { label: r.studentName, value: Number(r.percentage) }; }), { max: 100, unit: '%', multicolor: true });
        break;
      case 'attendance':
        var low = d.rows.filter(function (r) { return r.standing === 'SHORTAGE'; }).length;
        SB.charts.donut(c1, [{ label: 'Meets requirement', value: d.rows.length - low, color: '#13926a' }, { label: 'Shortage', value: low, color: '#d64545' }], { centerLabel: 'records' });
        SB.charts.hbar(c2, d.rows.slice().sort(function (a, b) { return a.percentage - b.percentage; }).slice(0, 6).map(function (r) { return { label: r.studentName, value: Number(r.percentage) }; }), { max: 100, unit: '%', color: '#d64545' });
        break;
      case 'student':
        var rs = tally('result'), gs = tally('grade');
        SB.charts.donut(c1, [{ label: 'Pass', value: rs.PASS || 0, color: '#13926a' }, { label: 'Fail', value: rs.FAIL || 0, color: '#d64545' }, { label: 'No results', value: rs['-'] || 0, color: '#9aa7c7' }], { centerLabel: 'students' });
        SB.charts.bar(c2, Object.keys(gs).sort().map(function (g) { return { label: g, value: gs[g] }; }), { multicolor: true, emptyText: 'No marks entered yet.' });
        break;
      case 'overall':
        var pr = metric('Course pass rate'), at = metric('Average attendance');
        SB.charts.donut(c1, pr === null ? [] : [{ label: 'Passed', value: Math.round(pr), color: '#13926a' }, { label: 'Failed', value: 100 - Math.round(pr), color: '#d64545' }], { centerValue: pr === null ? '—' : SB.pct(pr), centerLabel: 'pass rate', emptyText: 'No marks entered yet.' });
        SB.charts.bar(c2, at === null ? [] : [{ label: 'Actual', value: Number(at), color: '#2f5bd6' }, { label: 'Required', value: Number(page.dataset.min || 75), color: '#8f86ee' }], { max: 100, unit: '%', emptyText: 'No attendance marked yet.' });
        break;
    }
  }

  SB.ready.then(async function () {
    try {
      courses = await SB.loadCourses();
      var g = await SB.api.get('api/results', { view: 'grading' });
      page.dataset.min = g.attendanceMinimum;
    } catch (e) { /* filters degrade gracefully */ }
    shell();
  });
})();
