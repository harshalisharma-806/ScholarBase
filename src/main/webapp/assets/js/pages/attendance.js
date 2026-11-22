/* Attendance: mark a class, browse / edit records, and student-wise percentages. */
(function () {
  var page = document.getElementById('page');
  var courses = [];
  var minimum = 75;

  function shell() {
    page.innerHTML =
      '<div class="page-head"><div><h1>Attendance</h1><p>Mark classes, review records and track attendance percentages.</p></div></div>' +
      '<div class="tabs" role="tablist" id="tabs" style="margin-bottom:20px">' +
        '<button type="button" role="tab" data-tab="mark">Mark attendance</button>' +
        '<button type="button" role="tab" data-tab="records">Records</button>' +
        '<button type="button" role="tab" data-tab="summary">Student-wise report</button></div>' +
      '<section data-panel="mark" hidden></section><section data-panel="records" hidden></section><section data-panel="summary" hidden></section>';
    var loaded = {};
    var activate = SB.tabs(document.getElementById('tabs'), function (name) {
      history.replaceState(null, '', '?tab=' + name + (name === 'summary' && SB.qs('below') ? '&below=1' : ''));
      if (!loaded[name]) { loaded[name] = true; ({ mark: initMark, records: initRecords, summary: initSummary })[name](); }
    });
    activate(['mark', 'records', 'summary'].indexOf(SB.qs('tab')) !== -1 ? SB.qs('tab') : 'mark');
  }

  function panel(name) { return document.querySelector('[data-panel="' + name + '"]'); }

  /* ================= mark ================= */
  function initMark() {
    var p = panel('mark'), roster = [];
    p.innerHTML = '<section class="card"><div class="toolbar">' +
      '<select class="select" id="mCourse" aria-label="Course" style="min-width:260px">' + SB.courseOptions(courses, '', 'Select a course') + '</select>' +
      '<input class="input" id="mDate" type="date" max="' + SB.today() + '" value="' + SB.today() + '" aria-label="Date" style="width:auto">' +
      '<button type="button" class="btn primary" id="mLoad">Load class</button></div><div id="mBody">' +
      SB.empty('attendance', 'Choose a course and date', 'Select a course and a date, then load the class to mark attendance.') + '</div></section>';

    var courseSel = p.querySelector('#mCourse'), dateInput = p.querySelector('#mDate'), body = p.querySelector('#mBody');

    async function loadRoster() {
      if (!courseSel.value) { SB.toast('Select a course first.', 'error'); return; }
      if (!dateInput.value) { SB.toast('Select a date.', 'error'); return; }
      body.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 3) + '</div>';
      try {
        var data = await SB.api.get('api/attendance', { view: 'roster', courseId: courseSel.value, date: dateInput.value });
        roster = data.students;
        renderRoster(data);
      } catch (e) { body.innerHTML = SB.empty('alert', 'Could not load the class', SB.errorMessage(e)); }
    }

    function renderRoster(data) {
      if (!roster.length) {
        body.innerHTML = SB.empty('students', 'No active students in this course', 'Allocate students to ' + data.course.courseName + ' from the Courses page first.', '<a class="btn primary" href="courses.html?view=' + data.course.id + '">Allocate students</a>');
        return;
      }
      var marked = roster.filter(function (r) { return r.status; }).length;
      body.innerHTML =
        '<div class="toolbar" style="border-top:0"><div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="rq" type="search" placeholder="Search student" aria-label="Search student in this class"></div>' +
        '<button type="button" class="btn sm" data-all="PRESENT">Mark all present</button><button type="button" class="btn sm" data-all="ABSENT">Mark all absent</button>' +
        '<span class="spacer"></span><span class="small muted" id="rCount"></span></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Roll no.</th><th>Status</th></tr></thead><tbody>' +
        roster.map(function (r) {
          return '<tr data-row="' + r.studentId + '" data-text="' + SB.esc((r.studentName + ' ' + r.rollNumber).toLowerCase()) + '"><td><div class="cell-person">' + SB.avatar(r.studentName) + '<span class="name">' + SB.esc(r.studentName) + '</span></div></td>' +
            '<td>' + SB.esc(r.rollNumber) + '</td><td><div class="seg" role="radiogroup" aria-label="Attendance for ' + SB.esc(r.studentName) + '">' +
            ['PRESENT', 'ABSENT', 'LEAVE'].map(function (st) {
              return '<label><input type="radio" name="st-' + r.studentId + '" value="' + st + '"' + (r.status === st ? ' checked' : '') + '><span>' + st.charAt(0) + st.slice(1).toLowerCase() + '</span></label>';
            }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="table-foot"><span id="rHint">' + (marked ? 'Attendance was already marked for ' + marked + ' of ' + roster.length + ' students; saving will update it.' : 'Nothing marked yet for this date.') + '</span>' +
        '<button type="button" class="btn primary" id="rSave">' + SB.icon('check', 16) + 'Save attendance</button></div>';

      function count() {
        var checked = body.querySelectorAll('.seg input:checked').length;
        body.querySelector('#rCount').textContent = checked + ' of ' + roster.length + ' marked';
      }
      count();
      body.addEventListener('change', function (e) { if (e.target.matches('.seg input')) count(); });
      body.querySelectorAll('[data-all]').forEach(function (b) {
        b.addEventListener('click', function () {
          body.querySelectorAll('.seg input[value="' + b.dataset.all + '"]').forEach(function (i) { if (!i.closest('tr').hidden) i.checked = true; });
          count();
        });
      });
      body.querySelector('#rq').addEventListener('input', function (e) {
        var term = e.target.value.trim().toLowerCase();
        body.querySelectorAll('tr[data-row]').forEach(function (tr) { tr.hidden = term && tr.dataset.text.indexOf(term) === -1; });
      });
      body.querySelector('#rSave').addEventListener('click', async function () {
        var ids = [], statuses = [], missing = 0;
        roster.forEach(function (r) {
          var chosen = body.querySelector('input[name="st-' + r.studentId + '"]:checked');
          if (chosen) { ids.push(r.studentId); statuses.push(chosen.value); } else missing++;
        });
        if (!ids.length) { SB.toast('Mark at least one student before saving.', 'error'); return; }
        if (missing && !(await SB.confirm({ title: 'Some students are unmarked', confirmText: 'Save anyway', message: missing + ' student(s) have no status and will be skipped. Save the rest?' }))) return;
        var btn = body.querySelector('#rSave');
        SB.setBusy(btn, true);
        try {
          var res = await SB.api.post('api/attendance', { action: 'mark', courseId: courseSel.value, date: dateInput.value, studentId: ids, status: statuses });
          SB.toast(res.message);
          loadRoster();
        } catch (e) { SB.toast(SB.errorMessage(e), 'error'); SB.setBusy(btn, false); }
      });
    }
    p.querySelector('#mLoad').addEventListener('click', loadRoster);
    courseSel.addEventListener('change', function () { if (courseSel.value) loadRoster(); });
  }

  /* ================= records ================= */
  function initRecords() {
    var p = panel('records'), state = { courseId: '', date: '', q: '', status: '', page: 1, size: 10 };
    p.innerHTML = '<section class="card"><div class="toolbar">' +
      '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="rcQ" type="search" placeholder="Search student name or roll number" aria-label="Search records"></div>' +
      '<select class="select" id="rcCourse" aria-label="Filter by course">' + SB.courseOptions(courses, '', 'All courses') + '</select>' +
      '<input class="input" id="rcDate" type="date" aria-label="Filter by date" style="width:auto">' +
      '<select class="select" id="rcStatus" aria-label="Filter by status">' + SB.options([['PRESENT', 'Present'], ['ABSENT', 'Absent'], ['LEAVE', 'Leave']], '', 'All statuses') + '</select>' +
      '<button type="button" class="btn ghost sm" id="rcClear">Clear</button></div>' +
      '<div id="rcTable"></div><div class="table-foot" id="rcPager"></div></section>';
    p.querySelector('#rcQ').addEventListener('input', SB.debounce(function (e) { state.q = e.target.value.trim(); state.page = 1; load(); }, 300));
    [['rcCourse', 'courseId'], ['rcDate', 'date'], ['rcStatus', 'status']].forEach(function (x) {
      p.querySelector('#' + x[0]).addEventListener('change', function (e) { state[x[1]] = e.target.value; state.page = 1; load(); });
    });
    p.querySelector('#rcClear').addEventListener('click', function () {
      state = { courseId: '', date: '', q: '', status: '', page: 1, size: 10 };
      ['rcQ', 'rcCourse', 'rcDate', 'rcStatus'].forEach(function (id) { p.querySelector('#' + id).value = ''; });
      load();
    });

    async function load() {
      var host = p.querySelector('#rcTable');
      host.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 5) + '</div>';
      try {
        var data = await SB.api.get('api/attendance', state);
        if (data.page > data.totalPages) { state.page = data.totalPages; return load(); }
        if (!data.items.length) {
          host.innerHTML = SB.empty('search', 'No attendance records', 'No records match these filters. Use "Mark attendance" to record a class.');
          p.querySelector('#rcPager').innerHTML = '';
          return;
        }
        host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Student</th><th>Course</th><th>Status</th><th class="right">Actions</th></tr></thead><tbody>' +
          data.items.map(function (r) {
            return '<tr><td class="nowrap">' + SB.fmtDate(r.date) + '</td><td><div class="cell-person">' + SB.avatar(r.studentName) + '<div><span class="name">' + SB.esc(r.studentName) + '</span><span class="sub">' + SB.esc(r.rollNumber) + '</span></div></div></td>' +
              '<td>' + SB.esc(r.courseCode) + ' <span class="muted small">' + SB.esc(r.courseName) + '</span></td><td>' + SB.attendanceStatus(r.status) + '</td>' +
              '<td class="right"><div class="row-actions"><select class="select" data-set="' + r.id + '" aria-label="Change status" style="height:34px;width:auto;padding-top:0;padding-bottom:0">' +
              SB.options([['PRESENT', 'Present'], ['ABSENT', 'Absent'], ['LEAVE', 'Leave']], r.status) + '</select>' +
              '<button type="button" class="icon-action del" data-del="' + r.id + '" aria-label="Delete record" title="Delete">' + SB.icon('trash', 18) + '</button></div></td></tr>';
          }).join('') + '</tbody></table></div>';
        host.querySelectorAll('[data-set]').forEach(function (sel) {
          sel.addEventListener('change', async function () {
            try { SB.toast((await SB.api.post('api/attendance', { action: 'update', id: sel.dataset.set, status: sel.value })).message); load(); }
            catch (e) { SB.toast(SB.errorMessage(e), 'error'); load(); }
          });
        });
        host.querySelectorAll('[data-del]').forEach(function (b) {
          b.addEventListener('click', async function () {
            if (!(await SB.confirm({ title: 'Delete record', message: 'Delete this attendance record? This cannot be undone.' }))) return;
            try { SB.toast((await SB.api.post('api/attendance', { action: 'delete', id: b.dataset.del })).message); load(); }
            catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
          });
        });
        SB.pager(p.querySelector('#rcPager'), data, function (pg) { state.page = pg; load(); });
      } catch (e) { host.innerHTML = SB.empty('alert', 'Could not load records', SB.errorMessage(e)); }
    }
    load();
  }

  /* ================= summary ================= */
  function initSummary() {
    var p = panel('summary'), state = { courseId: '', q: '', below: !!SB.qs('below') }, rows = [];
    p.innerHTML = '<div id="sCards" class="summary-cards" style="margin-bottom:20px"></div>' +
      '<section class="card"><div class="toolbar">' +
      '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="sQ" type="search" placeholder="Search student name or roll number" aria-label="Search students"></div>' +
      '<select class="select" id="sCourse" aria-label="Filter by course">' + SB.courseOptions(courses, '', 'All courses') + '</select>' +
      '<label class="check"><input type="checkbox" id="sBelow"' + (state.below ? ' checked' : '') + '> Below minimum only</label><span class="spacer"></span>' +
      '<button type="button" class="btn sm" id="sCsv">' + SB.icon('download', 16) + 'Export CSV</button><button type="button" class="btn sm" id="sPrint">' + SB.icon('printer', 16) + 'Print</button></div>' +
      '<div class="print-only" style="padding:16px 20px"><h2>Student-wise attendance report</h2></div><div id="sTable"></div></section>';
    p.querySelector('#sQ').addEventListener('input', SB.debounce(function (e) { state.q = e.target.value.trim(); load(); }, 300));
    p.querySelector('#sCourse').addEventListener('change', function (e) { state.courseId = e.target.value; load(); });
    p.querySelector('#sBelow').addEventListener('change', function (e) { state.below = e.target.checked; draw(); });
    p.querySelector('#sPrint').addEventListener('click', function () { window.print(); });
    p.querySelector('#sCsv').addEventListener('click', function () {
      var shown = visible();
      if (!shown.length) { SB.toast('There is nothing to export.', 'error'); return; }
      SB.downloadCsv('scholarbase-attendance-summary.csv', [
        { key: 'rollNumber', label: 'Roll number' }, { key: 'studentName', label: 'Student' }, { key: 'courseCode', label: 'Course code' },
        { key: 'total', label: 'Classes' }, { key: 'present', label: 'Present' }, { key: 'absent', label: 'Absent' }, { key: 'leave', label: 'Leave' }, { key: 'percentage', label: 'Attendance %' }
      ], shown);
    });

    var totals = null;
    function visible() { return state.below ? rows.filter(function (r) { return r.belowMinimum; }) : rows; }

    async function load() {
      p.querySelector('#sTable').innerHTML = '<div class="card-pad">' + SB.skeleton(6, 4) + '</div>';
      try {
        var data = await SB.api.get('api/attendance', { view: 'summary', courseId: state.courseId, q: state.q });
        rows = data.rows; totals = data.totals; minimum = data.minimum;
        draw();
      } catch (e) { p.querySelector('#sTable').innerHTML = SB.empty('alert', 'Could not load the report', SB.errorMessage(e)); }
    }

    function draw() {
      var t = totals;
      p.querySelector('#sCards').innerHTML =
        mini('Overall attendance', SB.pct(t.percentage), t.percentage === null ? '' : (t.percentage >= minimum ? 'good' : 'bad')) +
        mini('Classes marked', SB.num(t.total, 0)) + mini('Present', SB.num(t.present, 0), 'good') + mini('Absent', SB.num(t.absent, 0), t.absent ? 'bad' : '') + mini('On leave', SB.num(t.leave, 0)) +
        mini('Below ' + minimum + '%', rows.filter(function (r) { return r.belowMinimum; }).length, 'bad');
      var shown = visible(), host = p.querySelector('#sTable');
      if (!shown.length) {
        host.innerHTML = SB.empty(state.below ? 'check' : 'attendance', state.below ? 'Everyone meets the requirement' : 'No attendance data', state.below ? 'No student is below ' + minimum + '% for the current filters.' : 'Attendance percentages appear here once classes have been marked.');
        return;
      }
      host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Course</th><th class="num">Classes</th><th class="num">Present</th><th class="num">Absent</th><th class="num">Leave</th><th style="min-width:170px">Attendance</th></tr></thead><tbody>' +
        shown.map(function (r) {
          return '<tr><td><div class="cell-person">' + SB.avatar(r.studentName) + '<div><span class="name">' + SB.esc(r.studentName) + '</span><span class="sub">' + SB.esc(r.rollNumber) + '</span></div></div></td>' +
            '<td>' + SB.esc(r.courseCode || '—') + '</td><td class="num">' + r.total + '</td><td class="num">' + r.present + '</td><td class="num">' + r.absent + '</td><td class="num">' + r.leave + '</td><td>' + SB.meter(r.percentage, minimum) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    function mini(l, v, cls) { return '<div class="mini ' + (cls || '') + '"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
    load();
  }

  SB.ready.then(async function () {
    try { courses = await SB.loadCourses(true); } catch (e) { courses = []; SB.toast(SB.errorMessage(e), 'error'); }
    shell();
  });
})();
