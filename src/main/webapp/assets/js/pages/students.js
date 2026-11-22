/* Students: list, search/filter, add/edit/delete, detailed profile with course allocation. */
(function () {
  var page = document.getElementById('page');
  var state = { q: SB.qs('q') || '', department: '', semester: '', status: '', page: 1, size: 10 };

  function shell() {
    page.innerHTML =
      '<div class="page-head"><div><h1>Students</h1><p>Register, search and manage every student record.</p></div>' +
        '<div class="page-actions"><button type="button" class="btn" id="exportBtn">' + SB.icon('download', 16) + 'Export CSV</button>' +
        '<button type="button" class="btn primary" id="addBtn">' + SB.icon('userplus', 16) + 'Add student</button></div></div>' +
      '<section class="card"><div class="toolbar">' +
        '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="fq" type="search" placeholder="Search by name or roll number" aria-label="Search students" value="' + SB.esc(state.q) + '"></div>' +
        '<select class="select" id="fdept" aria-label="Filter by department">' + SB.deptOptions('', 'All departments') + '</select>' +
        '<select class="select" id="fsem" aria-label="Filter by semester">' + SB.semOptions('', 'All semesters') + '</select>' +
        '<select class="select" id="fstatus" aria-label="Filter by status">' + SB.options(SB.config.studentStatuses, '', 'All statuses') + '</select>' +
        '<button type="button" class="btn ghost sm" id="clearBtn">Clear filters</button></div>' +
      '<div id="tableHost"></div><div class="table-foot" id="pagerHost"></div></section>';

    var search = SB.debounce(function () { state.q = document.getElementById('fq').value.trim(); state.page = 1; load(); }, 300);
    document.getElementById('fq').addEventListener('input', search);
    [['fdept', 'department'], ['fsem', 'semester'], ['fstatus', 'status']].forEach(function (p) {
      document.getElementById(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; state.page = 1; load(); });
    });
    document.getElementById('clearBtn').addEventListener('click', function () {
      state = { q: '', department: '', semester: '', status: '', page: 1, size: 10 };
      document.getElementById('fq').value = '';
      ['fdept', 'fsem', 'fstatus'].forEach(function (id) { document.getElementById(id).value = ''; });
      load();
    });
    document.getElementById('addBtn').addEventListener('click', function () { openForm(null); });
    document.getElementById('exportBtn').addEventListener('click', exportCsv);
  }

  async function load() {
    var host = document.getElementById('tableHost');
    host.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 5) + '</div>';
    try {
      var data = await SB.api.get('api/students', state);
      if (data.page > data.totalPages) { state.page = data.totalPages; return load(); }
      renderTable(data);
    } catch (e) {
      host.innerHTML = SB.empty('alert', 'Could not load students', SB.errorMessage(e), '<button type="button" class="btn primary" id="retry">Try again</button>');
      document.getElementById('retry').addEventListener('click', load);
      document.getElementById('pagerHost').innerHTML = '';
    }
  }

  function renderTable(data) {
    var host = document.getElementById('tableHost');
    var filtered = state.q || state.department || state.semester || state.status;
    if (!data.items.length) {
      host.innerHTML = filtered
        ? SB.empty('search', 'No matching students', 'Try a different search term or clear the filters.')
        : SB.empty('students', 'No students yet', 'Register your first student to get started.', '<button type="button" class="btn primary" id="emptyAdd">' + SB.icon('userplus', 16) + 'Add student</button>');
      var ea = document.getElementById('emptyAdd');
      if (ea) ea.addEventListener('click', function () { openForm(null); });
      document.getElementById('pagerHost').innerHTML = '';
      return;
    }
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Roll no.</th><th>Department</th><th>Semester</th><th>Contact</th><th>Status</th><th class="right">Actions</th></tr></thead><tbody>' +
      data.items.map(function (s) {
        return '<tr><td><div class="cell-person">' + SB.avatar(s.fullName) + '<div><a class="name" href="#" data-view="' + s.id + '">' + SB.esc(s.fullName) + '</a><span class="sub">' + SB.esc(s.email) + '</span></div></div></td>' +
          '<td class="nowrap"><strong>' + SB.esc(s.rollNumber) + '</strong></td><td>' + SB.esc(s.department) + '</td><td>Sem ' + s.semester + '</td>' +
          '<td class="nowrap">' + SB.esc(s.phone) + '</td><td>' + SB.studentStatus(s.status) + '</td>' +
          '<td class="right"><div class="row-actions">' +
            '<button type="button" class="icon-action" data-view="' + s.id + '" aria-label="View ' + SB.esc(s.fullName) + '" title="View profile">' + SB.icon('eye', 18) + '</button>' +
            '<button type="button" class="icon-action" data-edit="' + s.id + '" aria-label="Edit ' + SB.esc(s.fullName) + '" title="Edit">' + SB.icon('edit', 18) + '</button>' +
            '<button type="button" class="icon-action del" data-del="' + s.id + '" aria-label="Delete ' + SB.esc(s.fullName) + '" title="Delete">' + SB.icon('trash', 18) + '</button></div></td></tr>';
      }).join('') + '</tbody></table></div>';

    var byId = {};
    data.items.forEach(function (s) { byId[s.id] = s; });
    host.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openProfile(Number(el.dataset.view)); });
    });
    host.querySelectorAll('[data-edit]').forEach(function (el) { el.addEventListener('click', function () { openForm(byId[el.dataset.edit]); }); });
    host.querySelectorAll('[data-del]').forEach(function (el) { el.addEventListener('click', function () { remove(byId[el.dataset.del]); }); });
    SB.pager(document.getElementById('pagerHost'), data, function (p) { state.page = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- add / edit ---------- */
  function openForm(student) {
    var editing = !!student, s = student || { status: 'ACTIVE', enrollmentDate: SB.today(), semester: 1 };
    function field(name, label, input, full, hint) {
      return '<div class="field' + (full ? ' full' : '') + '"><label for="f_' + name + '">' + label + ' <span class="req" aria-hidden="true">*</span></label>' + input + (hint ? '<div class="field-hint">' + hint + '</div>' : '') + '<div class="field-error" role="alert"></div></div>';
    }
    var body = '<form id="studentForm" novalidate><div class="alert error form-alert" role="alert" hidden><span></span></div><div class="form-grid">' +
      field('fullName', 'Full name', '<input class="input" id="f_fullName" name="fullName" maxlength="100" autocomplete="off" required value="' + SB.esc(s.fullName) + '">') +
      field('rollNumber', 'Roll number', '<input class="input" id="f_rollNumber" name="rollNumber" maxlength="30" autocomplete="off" required value="' + SB.esc(s.rollNumber) + '">', false, 'Must be unique, e.g. AIML24001') +
      field('email', 'Email', '<input class="input" id="f_email" name="email" type="email" maxlength="120" autocomplete="off" required value="' + SB.esc(s.email) + '">') +
      field('phone', 'Phone number', '<input class="input" id="f_phone" name="phone" type="tel" inputmode="numeric" maxlength="15" autocomplete="off" required value="' + SB.esc(s.phone) + '">', false, '10-digit mobile number') +
      field('dateOfBirth', 'Date of birth', '<input class="input" id="f_dateOfBirth" name="dateOfBirth" type="date" max="' + SB.today() + '" required value="' + SB.esc(s.dateOfBirth) + '">') +
      field('gender', 'Gender', '<select class="select" id="f_gender" name="gender" required>' + SB.options(SB.config.genders, s.gender, 'Select gender') + '</select>') +
      field('department', 'Department', '<select class="select" id="f_department" name="department" required>' + SB.deptOptions(s.department, 'Select department') + '</select>') +
      field('semester', 'Semester', '<select class="select" id="f_semester" name="semester" required>' + SB.semOptions(s.semester) + '</select>') +
      field('enrollmentDate', 'Enrollment date', '<input class="input" id="f_enrollmentDate" name="enrollmentDate" type="date" max="' + SB.today() + '" required value="' + SB.esc(s.enrollmentDate) + '">') +
      field('status', 'Status', '<select class="select" id="f_status" name="status" required>' + SB.options(SB.config.studentStatuses, s.status) + '</select>') +
      field('address', 'Address', '<textarea class="textarea" id="f_address" name="address" rows="2" maxlength="255" required>' + SB.esc(s.address) + '</textarea>', true) +
      '</div></form>';
    var m = SB.modal({
      title: editing ? 'Edit student' : 'Register new student', size: 'wide', body: body, persistent: true,
      footer: '<button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn primary" form="studentForm" id="saveBtn">' + (editing ? 'Save changes' : 'Register student') + '</button>'
    });
    m.el.querySelector('[data-cancel]').addEventListener('click', m.close);
    var form = m.el.querySelector('#studentForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      SB.clearErrors(form);
      var data = SB.formData(form);
      var errors = clientValidate(data);
      if (Object.keys(errors).length) { SB.showErrors(form, errors, 'Please correct the highlighted fields.'); return; }
      if (editing) data.id = s.id;
      data.action = editing ? 'update' : 'create';
      var btn = m.el.querySelector('#saveBtn');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/students', data);
        SB.toast(res.message);
        m.close();
        load();
      } catch (err) {
        SB.setBusy(btn, false);
        SB.showErrors(form, err.errors, err.message);
      }
    });
  }

  function clientValidate(d) {
    var e = {};
    if (d.fullName.length < 2) e.fullName = 'Enter the student\'s full name.';
    if (!d.rollNumber) e.rollNumber = 'Roll number is required.';
    if (!d.email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Enter a valid email address.';
    if (!d.phone) e.phone = 'Phone number is required.';
    else if (!/^(\+91[- ]?)?[6-9][0-9]{9}$/.test(d.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!d.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    if (!d.gender) e.gender = 'Select a gender.';
    if (!d.department) e.department = 'Select a department.';
    if (!d.enrollmentDate) e.enrollmentDate = 'Enrollment date is required.';
    if (!d.address) e.address = 'Address is required.';
    return e;
  }

  async function remove(s) {
    var ok = await SB.confirm({
      title: 'Delete student',
      message: 'Delete <strong>' + SB.esc(s.fullName) + '</strong> (' + SB.esc(s.rollNumber) + ')? Their course allocations, attendance and marks will be removed too. This cannot be undone.'
    });
    if (!ok) return;
    try {
      var res = await SB.api.post('api/students', { action: 'delete', id: s.id });
      SB.toast(res.message);
      load();
    } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
  }

  async function exportCsv() {
    var btn = document.getElementById('exportBtn');
    SB.setBusy(btn, true);
    try {
      var rows = await SB.fetchAll('api/students', { q: state.q, department: state.department, semester: state.semester, status: state.status });
      SB.downloadCsv('scholarbase-students.csv', [
        { key: 'id', label: 'Student ID' }, { key: 'fullName', label: 'Full name' }, { key: 'rollNumber', label: 'Roll number' },
        { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'dateOfBirth', label: 'Date of birth' },
        { key: 'gender', label: 'Gender' }, { key: 'department', label: 'Department' }, { key: 'semester', label: 'Semester' },
        { key: 'address', label: 'Address' }, { key: 'enrollmentDate', label: 'Enrollment date' }, { key: 'status', label: 'Status' }
      ], rows);
      SB.toast('Exported ' + rows.length + ' students.');
    } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
    SB.setBusy(btn, false);
  }

  /* ---------- profile ---------- */
  async function openProfile(id) {
    var m = SB.modal({ title: 'Student profile', size: 'wide', body: SB.skeleton(6, 3) });
    try {
      var p = await SB.api.get('api/students', { id: id });
      renderProfile(m, p);
    } catch (e) {
      m.body.innerHTML = SB.empty('alert', 'Could not load profile', SB.errorMessage(e));
    }
  }

  function renderProfile(m, p) {
    var s = p.student, sum = p.result.summary, att = p.attendance.rows, min = p.attendance.minimum;
    var attByCourse = {};
    att.forEach(function (r) { attByCourse[r.courseId] = r; });
    var resByCourse = {};
    p.result.results.forEach(function (r) { resByCourse[r.courseId] = r; });

    var html = '<div class="profile-head">' + SB.avatar(s.fullName, 'lg navy') +
      '<div><h3>' + SB.esc(s.fullName) + '</h3><div class="muted">' + SB.esc(s.rollNumber) + ' · ' + SB.esc(s.department) + ' · Semester ' + s.semester + '</div></div>' +
      '<div style="margin-left:auto" class="no-print">' + SB.studentStatus(s.status) + '</div></div>';

    html += '<div class="section-title">Summary</div><div class="summary-cards">' +
      mini('Courses', p.courses.length) +
      mini('Attendance', SB.pct(p.overallAttendance), p.overallAttendance === null ? '' : (p.overallAttendance >= min ? 'good' : 'bad')) +
      mini('Overall score', SB.pct(sum.percentage)) +
      mini('Grade', sum.grade || '—') +
      mini('Result', sum.status === 'N/A' ? '—' : (sum.status === 'PASS' ? 'Pass' : 'Fail'), sum.status === 'PASS' ? 'good' : (sum.status === 'FAIL' ? 'bad' : '')) + '</div>';

    html += '<div class="section-title">Personal details</div><dl class="kv">' +
      kv('Student ID', 'STU-' + String(s.id).padStart(4, '0')) + kv('Email', s.email) + kv('Phone', s.phone) +
      kv('Date of birth', SB.fmtDate(s.dateOfBirth)) + kv('Gender', s.gender.charAt(0) + s.gender.slice(1).toLowerCase()) + kv('Enrollment date', SB.fmtDate(s.enrollmentDate)) +
      '<div style="grid-column:1/-1"><dt>Address</dt><dd>' + SB.esc(s.address) + '</dd></div></dl>';

    html += '<div class="section-title"><span>Allocated courses</span></div>';
    if (p.courses.length) {
      html += '<div class="table-wrap"><table class="data compact"><thead><tr><th>Course</th><th>Credits</th><th>Attendance</th><th class="num">Marks</th><th>Grade</th><th class="no-print"></th></tr></thead><tbody>' +
        p.courses.map(function (c) {
          var a = attByCourse[c.id], r = resByCourse[c.id];
          return '<tr><td><span class="name" style="font-weight:600">' + SB.esc(c.courseName) + '</span><br><span class="small muted">' + SB.esc(c.courseCode) + ' · ' + SB.esc(c.instructorName) + '</span></td>' +
            '<td>' + c.credits + '</td><td>' + (a ? SB.meter(a.percentage, min) : '<span class="muted">No classes yet</span>') + '</td>' +
            '<td class="num">' + (r ? SB.num(r.marksObtained) + ' / ' + SB.num(r.maxMarks) : '<span class="muted">—</span>') + '</td>' +
            '<td>' + (r ? SB.gradeBadge(r.grade) : '—') + '</td>' +
            '<td class="right no-print"><button type="button" class="icon-action del" data-remove-course="' + c.id + '" aria-label="Remove ' + SB.esc(c.courseName) + '" title="Remove from course">' + SB.icon('x', 18) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html += '<p class="muted">Not allocated to any course yet.</p>';
    }
    html += '<div class="row-between no-print" style="margin-top:14px;gap:10px;flex-wrap:wrap"><select class="select" id="allocSelect" style="max-width:380px" aria-label="Course to allocate"><option value="">Loading courses…</option></select>' +
      '<button type="button" class="btn primary sm" id="allocBtn">' + SB.icon('plus', 16) + 'Allocate course</button></div>';

    m.body.innerHTML = html;
    m.foot = m.foot || null;

    m.body.querySelectorAll('[data-remove-course]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var course = p.courses.filter(function (c) { return String(c.id) === b.dataset.removeCourse; })[0];
        var ok = await SB.confirm({ title: 'Remove from course', confirmText: 'Remove', message: 'Remove <strong>' + SB.esc(s.fullName) + '</strong> from <strong>' + SB.esc(course.courseName) + '</strong>? Their attendance and marks for this course will also be deleted.' });
        if (!ok) return;
        try {
          var res = await SB.api.post('api/courses', { action: 'deallocate', courseId: course.id, studentId: s.id });
          SB.toast(res.message);
          renderProfile(m, await SB.api.get('api/students', { id: s.id }));
        } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
      });
    });

    SB.loadCourses(true).then(function (all) {
      var taken = {};
      p.courses.forEach(function (c) { taken[c.id] = true; });
      var avail = all.filter(function (c) { return !taken[c.id]; });
      var sel = m.body.querySelector('#allocSelect');
      if (!sel) return;
      sel.innerHTML = avail.length ? SB.courseOptions(avail, '', 'Select a course to allocate') : '<option value="">All courses are already allocated</option>';
      sel.disabled = !avail.length;
    });
    m.body.querySelector('#allocBtn').addEventListener('click', async function () {
      var sel = m.body.querySelector('#allocSelect');
      if (!sel.value) { SB.toast('Select a course first.', 'error'); return; }
      try {
        var res = await SB.api.post('api/courses', { action: 'allocate', courseId: sel.value, studentId: s.id });
        SB.toast(res.message);
        renderProfile(m, await SB.api.get('api/students', { id: s.id }));
      } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
    });
  }

  function mini(label, value, cls) { return '<div class="mini ' + (cls || '') + '"><div class="l">' + label + '</div><div class="v">' + SB.esc(value) + '</div></div>'; }
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + SB.esc(v) + '</dd></div>'; }

  SB.ready.then(function () {
    shell();
    load();
    if (SB.qs('add')) openForm(null);
    if (SB.qs('view')) openProfile(Number(SB.qs('view')));
  });
})();
