/* Marks & Results: enter marks, browse/edit records, student-wise and course-wise result sheets. */
(function () {
  var page = document.getElementById('page');
  var courses = [], grading = null;

  /* Mirrors GradingService on the server so the entry sheet can preview results; the server remains the authority. */
  function evaluate(marks, max) {
    var pct = max > 0 ? Math.round(marks * 10000 / max) / 100 : 0, grade = 'F';
    for (var i = 0; i < grading.scale.length; i++) { if (pct >= grading.scale[i].minimum) { grade = grading.scale[i].grade; break; } }
    return { pct: pct, grade: grade, pass: pct >= grading.passPercentage };
  }

  function shell() {
    page.innerHTML =
      '<div class="page-head"><div><h1>Marks &amp; Results</h1><p>Enter marks, then review grades and pass/fail status per student or course.</p></div></div>' +
      '<div class="tabs" role="tablist" id="tabs" style="margin-bottom:20px">' +
        '<button type="button" role="tab" data-tab="enter">Enter marks</button><button type="button" role="tab" data-tab="records">Marks records</button>' +
        '<button type="button" role="tab" data-tab="student">Student-wise results</button><button type="button" role="tab" data-tab="course">Course-wise results</button></div>' +
      '<section data-panel="enter" hidden></section><section data-panel="records" hidden></section><section data-panel="student" hidden></section><section data-panel="course" hidden></section>';
    var loaded = {}, inits = { enter: initEnter, records: initRecords, student: initStudent, course: initCourse };
    var activate = SB.tabs(document.getElementById('tabs'), function (name) {
      history.replaceState(null, '', '?tab=' + name);
      if (!loaded[name]) { loaded[name] = true; inits[name](); }
    });
    activate(inits[SB.qs('tab')] ? SB.qs('tab') : 'enter');
  }
  function panel(n) { return document.querySelector('[data-panel="' + n + '"]'); }
  function mini(l, v, cls) { return '<div class="mini ' + (cls || '') + '"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }

  /* ================= enter ================= */
  function initEnter() {
    var p = panel('enter'), roster = [];
    p.innerHTML = '<section class="card"><div class="toolbar">' +
      '<select class="select" id="eCourse" aria-label="Course" style="min-width:260px">' + SB.courseOptions(courses, '', 'Select a course') + '</select>' +
      '<label class="small muted" for="eMax">Maximum marks</label><input class="input" id="eMax" type="number" min="1" max="1000" step="0.5" value="' + grading.defaultMaxMarks + '" style="width:110px">' +
      '<span class="small muted">Pass mark: ' + grading.passPercentage + '%</span></div>' +
      '<div id="eBody">' + SB.empty('results', 'Choose a course', 'Select a course to list its students and enter their marks.') + '</div></section>';
    var sel = p.querySelector('#eCourse'), maxInput = p.querySelector('#eMax'), body = p.querySelector('#eBody');

    async function load() {
      if (!sel.value) return;
      body.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 4) + '</div>';
      try {
        var data = await SB.api.get('api/results', { view: 'roster', courseId: sel.value });
        roster = data.students;
        var existing = roster.filter(function (r) { return r.maxMarks; })[0];
        maxInput.value = existing ? existing.maxMarks : data.defaultMaxMarks;
        render(data);
      } catch (e) { body.innerHTML = SB.empty('alert', 'Could not load the class', SB.errorMessage(e)); }
    }

    function render(data) {
      if (!roster.length) {
        body.innerHTML = SB.empty('students', 'No students in this course', 'Allocate students to ' + data.course.courseName + ' first.', '<a class="btn primary" href="courses.html?view=' + data.course.id + '">Allocate students</a>');
        return;
      }
      body.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Roll no.</th><th class="num">Marks obtained</th><th class="num">%</th><th>Grade</th><th>Status</th></tr></thead><tbody>' +
        roster.map(function (r) {
          return '<tr data-row="' + r.studentId + '"><td><div class="cell-person">' + SB.avatar(r.studentName) + '<span class="name">' + SB.esc(r.studentName) + '</span></div></td><td>' + SB.esc(r.rollNumber) + '</td>' +
            '<td class="num"><input class="input marks-input" type="number" min="0" step="0.5" inputmode="decimal" data-sid="' + r.studentId + '" aria-label="Marks for ' + SB.esc(r.studentName) + '" value="' + (r.marksObtained === null || r.marksObtained === undefined ? '' : r.marksObtained) + '"></td>' +
            '<td class="num" data-pct>—</td><td data-grade>—</td><td data-status>—</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="table-foot"><span id="eHint">Leave a field empty to skip that student.</span><button type="button" class="btn primary" id="eSave">' + SB.icon('check', 16) + 'Save marks</button></div>';
      body.querySelectorAll('.marks-input').forEach(function (i) { i.addEventListener('input', recalc); });
      maxInput.oninput = recalc;
      body.querySelector('#eSave').addEventListener('click', save);
      recalc();
    }

    function recalc() {
      var max = parseFloat(maxInput.value), bad = 0;
      body.querySelectorAll('tr[data-row]').forEach(function (tr) {
        var input = tr.querySelector('.marks-input'), raw = input.value.trim();
        var cells = { pct: tr.querySelector('[data-pct]'), grade: tr.querySelector('[data-grade]'), status: tr.querySelector('[data-status]') };
        input.title = '';
        input.classList.remove('bad');
        if (raw === '' || !(max > 0)) { cells.pct.textContent = '—'; cells.grade.innerHTML = '—'; cells.status.innerHTML = '—'; return; }
        var m = parseFloat(raw);
        if (isNaN(m) || m < 0 || m > max) {
          input.classList.add('bad'); input.title = 'Marks must be between 0 and ' + max + '.'; bad++;
          cells.pct.textContent = '—'; cells.grade.innerHTML = '—'; cells.status.innerHTML = '<span class="small" style="color:var(--red)">Max ' + max + '</span>';
          return;
        }
        var ev = evaluate(m, max);
        cells.pct.textContent = SB.num(ev.pct, 2) + '%';
        cells.grade.innerHTML = SB.gradeBadge(ev.grade);
        cells.status.innerHTML = SB.resultStatus(ev.pass ? 'PASS' : 'FAIL');
      });
      var hint = body.querySelector('#eHint');
      if (hint) hint.textContent = bad ? bad + ' entr' + (bad === 1 ? 'y exceeds' : 'ies exceed') + ' the allowed range.' : 'Leave a field empty to skip that student.';
    }

    async function save() {
      var max = parseFloat(maxInput.value);
      if (!(max > 0)) { SB.toast('Enter the maximum marks first.', 'error'); maxInput.focus(); return; }
      if (body.querySelector('.marks-input.bad')) { SB.toast('Fix the highlighted marks before saving.', 'error'); return; }
      var ids = [], marks = [];
      body.querySelectorAll('.marks-input').forEach(function (i) { ids.push(i.dataset.sid); marks.push(i.value.trim()); });
      if (!marks.some(function (m) { return m !== ''; })) { SB.toast('Enter marks for at least one student.', 'error'); return; }
      var btn = body.querySelector('#eSave');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/results', { action: 'saveBulk', courseId: sel.value, maxMarks: max, studentId: ids, marks: marks });
        SB.toast(res.message);
        load();
      } catch (e) {
        SB.setBusy(btn, false);
        var first = null;
        Object.keys(e.errors || {}).forEach(function (k) {
          var input = body.querySelector('.marks-input[data-sid="' + k.replace('row-', '') + '"]');
          if (input) { input.classList.add('bad'); input.title = e.errors[k]; if (!first) { first = input; } }
        });
        SB.toast(first ? e.errors['row-' + first.dataset.sid] : SB.errorMessage(e), 'error');
        if (first) first.focus();
      }
    }
    sel.addEventListener('change', load);
  }

  /* ================= records ================= */
  function initRecords() {
    var p = panel('records'), state = { q: '', courseId: '', page: 1, size: 10 };
    p.innerHTML = '<section class="card"><div class="toolbar">' +
      '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="qr" type="search" placeholder="Search student name or roll number" aria-label="Search marks"></div>' +
      '<select class="select" id="qc" aria-label="Filter by course">' + SB.courseOptions(courses, '', 'All courses') + '</select>' +
      '<button type="button" class="btn ghost sm" id="qx">Clear</button></div><div id="rTable"></div><div class="table-foot" id="rPager"></div></section>';
    p.querySelector('#qr').addEventListener('input', SB.debounce(function (e) { state.q = e.target.value.trim(); state.page = 1; load(); }, 300));
    p.querySelector('#qc').addEventListener('change', function (e) { state.courseId = e.target.value; state.page = 1; load(); });
    p.querySelector('#qx').addEventListener('click', function () { state = { q: '', courseId: '', page: 1, size: 10 }; p.querySelector('#qr').value = ''; p.querySelector('#qc').value = ''; load(); });

    async function load() {
      var host = p.querySelector('#rTable');
      host.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 5) + '</div>';
      try {
        var data = await SB.api.get('api/results', state);
        if (data.page > data.totalPages) { state.page = data.totalPages; return load(); }
        if (!data.items.length) { host.innerHTML = SB.empty('results', 'No marks recorded', 'Use "Enter marks" to record results for a course.'); p.querySelector('#rPager').innerHTML = ''; return; }
        var byId = {};
        data.items.forEach(function (r) { byId[r.id] = r; });
        host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Course</th><th class="num">Marks</th><th class="num">%</th><th>Grade</th><th>Status</th><th class="right">Actions</th></tr></thead><tbody>' +
          data.items.map(function (r) {
            return '<tr><td><div class="cell-person">' + SB.avatar(r.studentName) + '<div><span class="name">' + SB.esc(r.studentName) + '</span><span class="sub">' + SB.esc(r.rollNumber) + '</span></div></div></td>' +
              '<td>' + SB.esc(r.courseCode) + ' <span class="muted small">' + SB.esc(r.courseName) + '</span></td><td class="num">' + SB.num(r.marksObtained) + ' / ' + SB.num(r.maxMarks) + '</td><td class="num">' + SB.pct(r.percentage) + '</td>' +
              '<td>' + SB.gradeBadge(r.grade) + '</td><td>' + SB.resultStatus(r.status) + '</td><td class="right"><div class="row-actions">' +
              '<button type="button" class="icon-action" data-edit="' + r.id + '" aria-label="Edit marks" title="Edit">' + SB.icon('edit', 18) + '</button>' +
              '<button type="button" class="icon-action del" data-del="' + r.id + '" aria-label="Delete result" title="Delete">' + SB.icon('trash', 18) + '</button></div></td></tr>';
          }).join('') + '</tbody></table></div>';
        host.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { edit(byId[b.dataset.edit], load); }); });
        host.querySelectorAll('[data-del]').forEach(function (b) {
          b.addEventListener('click', async function () {
            var r = byId[b.dataset.del];
            if (!(await SB.confirm({ title: 'Delete result', message: 'Delete the marks of <strong>' + SB.esc(r.studentName) + '</strong> in ' + SB.esc(r.courseCode) + '?' }))) return;
            try { SB.toast((await SB.api.post('api/results', { action: 'delete', id: r.id })).message); load(); } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
          });
        });
        SB.pager(p.querySelector('#rPager'), data, function (pg) { state.page = pg; load(); });
      } catch (e) { host.innerHTML = SB.empty('alert', 'Could not load results', SB.errorMessage(e)); }
    }
    load();
  }

  function edit(r, done) {
    var m = SB.modal({
      title: 'Edit marks', size: 'narrow', persistent: true,
      body: '<form id="editForm" novalidate><div class="alert error form-alert" role="alert" hidden><span></span></div><p class="muted" style="margin-bottom:14px"><strong>' + SB.esc(r.studentName) + '</strong> · ' + SB.esc(r.courseCode) + ' ' + SB.esc(r.courseName) + '</p>' +
        '<div class="form-grid"><div class="field"><label for="e_marks">Marks obtained</label><input class="input" id="e_marks" name="marksObtained" type="number" min="0" step="0.5" required value="' + r.marksObtained + '"><div class="field-error" role="alert"></div></div>' +
        '<div class="field"><label for="e_max">Maximum marks</label><input class="input" id="e_max" name="maxMarks" type="number" min="1" step="0.5" required value="' + r.maxMarks + '"><div class="field-error" role="alert"></div></div></div></form>',
      footer: '<button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn primary" form="editForm" id="saveBtn">Save changes</button>'
    });
    m.el.querySelector('[data-cancel]').addEventListener('click', m.close);
    var form = m.el.querySelector('#editForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      SB.clearErrors(form);
      var d = SB.formData(form), errs = {};
      if (d.marksObtained === '' || Number(d.marksObtained) < 0) errs.marksObtained = 'Enter valid marks.';
      if (!(Number(d.maxMarks) > 0)) errs.maxMarks = 'Enter the maximum marks.';
      else if (Number(d.marksObtained) > Number(d.maxMarks)) errs.marksObtained = 'Marks cannot exceed the maximum of ' + d.maxMarks + '.';
      if (Object.keys(errs).length) { SB.showErrors(form, errs); return; }
      var btn = m.el.querySelector('#saveBtn');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/results', { action: 'save', studentId: r.studentId, courseId: r.courseId, marksObtained: d.marksObtained, maxMarks: d.maxMarks });
        SB.toast(res.message); m.close(); done();
      } catch (err) { SB.setBusy(btn, false); SB.showErrors(form, err.errors, err.message); }
    });
  }

  /* ================= student-wise ================= */
  function initStudent() {
    var p = panel('student');
    p.innerHTML = '<section class="card no-print"><div class="toolbar">' +
      '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="sq" type="search" placeholder="Search student" aria-label="Search student"></div>' +
      '<select class="select" id="ss" aria-label="Student" style="min-width:280px"><option value="">Loading students…</option></select></div></section><div id="sOut" class="mt">' +
      SB.empty('students', 'Select a student', 'Pick a student to see their complete result sheet.') + '</div>';
    var sel = p.querySelector('#ss');

    async function loadStudents(q) {
      try {
        var res = await SB.api.get('api/students', { q: q, size: 100 });
        sel.innerHTML = SB.options(res.items.map(function (s) { return [s.id, s.fullName + ' (' + s.rollNumber + ')']; }), sel.value, res.items.length ? 'Select a student' : 'No students found');
      } catch (e) { sel.innerHTML = '<option value="">Could not load students</option>'; }
    }
    p.querySelector('#sq').addEventListener('input', SB.debounce(function (e) { loadStudents(e.target.value.trim()); }, 300));
    sel.addEventListener('change', async function () {
      var out = p.querySelector('#sOut');
      if (!sel.value) return;
      out.innerHTML = '<div class="card card-pad">' + SB.skeleton(5, 4) + '</div>';
      try {
        var d = await SB.api.get('api/results', { view: 'student', studentId: sel.value });
        var s = d.student, sm = d.summary;
        out.innerHTML = '<section class="card card-pad"><div class="profile-head">' + SB.avatar(s.fullName, 'lg navy') +
          '<div><h3>' + SB.esc(s.fullName) + '</h3><div class="muted">' + SB.esc(s.rollNumber) + ' · ' + SB.esc(s.department) + ' · Semester ' + s.semester + '</div></div>' +
          '<div style="margin-left:auto" class="no-print"><button type="button" class="btn sm" id="sPrint">' + SB.icon('printer', 16) + 'Print result sheet</button></div></div>' +
          '<div class="section-title">Overall</div><div class="summary-cards">' +
          mini('Courses graded', sm.courses) + mini('Total marks', SB.num(sm.totalObtained) + ' / ' + SB.num(sm.totalMax)) + mini('Percentage', SB.pct(sm.percentage)) +
          mini('Grade', sm.grade || '—') + mini('GPA', sm.gpa === null ? '—' : SB.num(sm.gpa)) +
          mini('Result', sm.status === 'N/A' ? '—' : (sm.status === 'PASS' ? 'Pass' : 'Fail'), sm.status === 'PASS' ? 'good' : (sm.status === 'FAIL' ? 'bad' : '')) + '</div>' +
          '<div class="section-title">Course results</div>' + (d.results.length ?
          '<div class="table-wrap"><table class="data compact"><thead><tr><th>Course</th><th>Credits</th><th class="num">Marks</th><th class="num">%</th><th>Grade</th><th>Status</th></tr></thead><tbody>' +
          d.results.map(function (r) {
            return '<tr><td><strong>' + SB.esc(r.courseCode) + '</strong> <span class="muted">' + SB.esc(r.courseName) + '</span></td><td>' + r.credits + '</td><td class="num">' + SB.num(r.marksObtained) + ' / ' + SB.num(r.maxMarks) + '</td><td class="num">' + SB.pct(r.percentage) + '</td><td>' + SB.gradeBadge(r.grade) + '</td><td>' + SB.resultStatus(r.status) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted">No marks have been entered for this student yet.</p>') + '</section>';
        var pb = out.querySelector('#sPrint');
        if (pb) pb.addEventListener('click', function () { window.print(); });
      } catch (e) { out.innerHTML = SB.empty('alert', 'Could not load the result sheet', SB.errorMessage(e)); }
    });
    loadStudents('');
  }

  /* ================= course-wise ================= */
  function initCourse() {
    var p = panel('course');
    p.innerHTML = '<section class="card no-print"><div class="toolbar"><select class="select" id="cs" aria-label="Course" style="min-width:300px">' + SB.courseOptions(courses, '', 'Select a course') + '</select></div></section>' +
      '<div id="cOut" class="mt">' + SB.empty('courses', 'Select a course', 'Pick a course to see class performance and every student\'s result.') + '</div>';
    p.querySelector('#cs').addEventListener('change', async function (e) {
      var out = p.querySelector('#cOut');
      if (!e.target.value) return;
      out.innerHTML = '<div class="card card-pad">' + SB.skeleton(5, 4) + '</div>';
      try {
        var d = await SB.api.get('api/results', { view: 'course', courseId: e.target.value });
        var st = d.stats, c = d.course;
        out.innerHTML = '<section class="card card-pad"><div class="row-between" style="flex-wrap:wrap"><div><h3 style="font-size:20px">' + SB.esc(c.courseName) + '</h3><div class="muted">' + SB.esc(c.courseCode) + ' · ' + SB.esc(c.department) + ' · Semester ' + c.semester + ' · ' + SB.esc(c.instructorName) + '</div></div>' +
          '<button type="button" class="btn sm no-print" id="cPrint">' + SB.icon('printer', 16) + 'Print</button></div>' +
          '<div class="section-title">Class performance</div><div class="summary-cards">' +
          mini('Enrolled', st.enrolled) + mini('Graded', st.graded) + mini('Pending', st.pending, st.pending ? 'bad' : '') + mini('Average', SB.pct(st.average)) +
          mini('Highest', SB.pct(st.highest), 'good') + mini('Lowest', SB.pct(st.lowest)) + mini('Pass rate', SB.pct(st.passRate), st.passRate !== null && st.passRate >= 50 ? 'good' : 'bad') + '</div>' +
          '<div class="grid split mt"><div><div class="section-title" style="margin-top:0">Grade distribution</div><div id="cChart"></div></div><div></div></div>' +
          '<div class="section-title">Student results</div>' + (d.results.length ?
          '<div class="table-wrap"><table class="data compact"><thead><tr><th>Rank</th><th>Student</th><th class="num">Marks</th><th class="num">%</th><th>Grade</th><th>Status</th></tr></thead><tbody>' +
          d.results.slice().sort(function (a, b) { return b.percentage - a.percentage; }).map(function (r, i) {
            return '<tr><td><span class="rank ' + (i === 0 ? 'r1' : '') + '">' + (i + 1) + '</span></td><td><div class="cell-person">' + SB.avatar(r.studentName) + '<div><span class="name">' + SB.esc(r.studentName) + '</span><span class="sub">' + SB.esc(r.rollNumber) + '</span></div></div></td>' +
              '<td class="num">' + SB.num(r.marksObtained) + ' / ' + SB.num(r.maxMarks) + '</td><td class="num">' + SB.pct(r.percentage) + '</td><td>' + SB.gradeBadge(r.grade) + '</td><td>' + SB.resultStatus(r.status) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted">No marks have been entered for this course yet.</p>') + '</section>';
        SB.charts.bar(out.querySelector('#cChart'), st.gradeDistribution, { multicolor: true, label: 'Grade distribution', emptyText: 'No results to chart yet.' });
        out.querySelector('#cPrint').addEventListener('click', function () { window.print(); });
      } catch (err) { out.innerHTML = SB.empty('alert', 'Could not load the course results', SB.errorMessage(err)); }
    });
  }

  SB.ready.then(async function () {
    try {
      var all = await Promise.all([SB.loadCourses(true), SB.api.get('api/results', { view: 'grading' })]);
      courses = all[0]; grading = all[1];
      shell();
    } catch (e) {
      page.innerHTML = '<div class="card">' + SB.empty('alert', 'Could not load Marks & Results', SB.errorMessage(e)) + '</div>';
    }
  });
})();
