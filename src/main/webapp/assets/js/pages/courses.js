/* Courses: CRUD, search/filter and allocation of students to courses. */
(function () {
  var page = document.getElementById('page');
  var state = { q: '', department: '', semester: '', page: 1, size: 10 };

  function shell() {
    page.innerHTML =
      '<div class="page-head"><div><h1>Courses</h1><p>Manage the course catalogue and who is enrolled in each course.</p></div>' +
        '<div class="page-actions"><button type="button" class="btn" id="exportBtn">' + SB.icon('download', 16) + 'Export CSV</button>' +
        '<button type="button" class="btn primary" id="addBtn">' + SB.icon('plus', 16) + 'Add course</button></div></div>' +
      '<section class="card"><div class="toolbar">' +
        '<div class="search-box">' + SB.icon('search', 18) + '<input class="input" id="fq" type="search" placeholder="Search by course name, code or instructor" aria-label="Search courses"></div>' +
        '<select class="select" id="fdept" aria-label="Filter by department">' + SB.deptOptions('', 'All departments') + '</select>' +
        '<select class="select" id="fsem" aria-label="Filter by semester">' + SB.semOptions('', 'All semesters') + '</select>' +
        '<button type="button" class="btn ghost sm" id="clearBtn">Clear filters</button></div>' +
      '<div id="tableHost"></div><div class="table-foot" id="pagerHost"></div></section>';
    document.getElementById('fq').addEventListener('input', SB.debounce(function () { state.q = document.getElementById('fq').value.trim(); state.page = 1; load(); }, 300));
    [['fdept', 'department'], ['fsem', 'semester']].forEach(function (p) {
      document.getElementById(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; state.page = 1; load(); });
    });
    document.getElementById('clearBtn').addEventListener('click', function () {
      state = { q: '', department: '', semester: '', page: 1, size: 10 };
      document.getElementById('fq').value = ''; document.getElementById('fdept').value = ''; document.getElementById('fsem').value = '';
      load();
    });
    document.getElementById('addBtn').addEventListener('click', function () { openForm(null); });
    document.getElementById('exportBtn').addEventListener('click', exportCsv);
  }

  async function load() {
    var host = document.getElementById('tableHost');
    host.innerHTML = '<div class="card-pad">' + SB.skeleton(6, 5) + '</div>';
    try {
      var data = await SB.api.get('api/courses', state);
      if (data.page > data.totalPages) { state.page = data.totalPages; return load(); }
      renderTable(data);
    } catch (e) {
      host.innerHTML = SB.empty('alert', 'Could not load courses', SB.errorMessage(e), '<button type="button" class="btn primary" id="retry">Try again</button>');
      document.getElementById('retry').addEventListener('click', load);
      document.getElementById('pagerHost').innerHTML = '';
    }
  }

  function renderTable(data) {
    var host = document.getElementById('tableHost');
    if (!data.items.length) {
      var filtered = state.q || state.department || state.semester;
      host.innerHTML = filtered ? SB.empty('search', 'No matching courses', 'Try a different search term or clear the filters.')
        : SB.empty('courses', 'No courses yet', 'Add a course to start allocating students.', '<button type="button" class="btn primary" id="emptyAdd">' + SB.icon('plus', 16) + 'Add course</button>');
      var ea = document.getElementById('emptyAdd');
      if (ea) ea.addEventListener('click', function () { openForm(null); });
      document.getElementById('pagerHost').innerHTML = '';
      return;
    }
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Course</th><th>Code</th><th>Department</th><th>Sem</th><th>Credits</th><th>Instructor</th><th>Enrolled</th><th class="right">Actions</th></tr></thead><tbody>' +
      data.items.map(function (c) {
        return '<tr><td><a class="name" style="font-weight:600;color:var(--navy-900)" href="#" data-manage="' + c.id + '">' + SB.esc(c.courseName) + '</a>' +
          (c.description ? '<br><span class="small muted">' + SB.esc(c.description.length > 70 ? c.description.slice(0, 70) + '…' : c.description) + '</span>' : '') + '</td>' +
          '<td><span class="pill lav plain">' + SB.esc(c.courseCode) + '</span></td><td>' + SB.esc(c.department) + '</td><td>Sem ' + c.semester + '</td><td>' + c.credits + '</td>' +
          '<td class="nowrap">' + SB.esc(c.instructorName) + '</td><td><strong>' + c.enrolledCount + '</strong> students</td>' +
          '<td class="right"><div class="row-actions">' +
            '<button type="button" class="icon-action" data-manage="' + c.id + '" aria-label="Manage students of ' + SB.esc(c.courseName) + '" title="Manage students">' + SB.icon('students', 18) + '</button>' +
            '<button type="button" class="icon-action" data-edit="' + c.id + '" aria-label="Edit ' + SB.esc(c.courseName) + '" title="Edit">' + SB.icon('edit', 18) + '</button>' +
            '<button type="button" class="icon-action del" data-del="' + c.id + '" aria-label="Delete ' + SB.esc(c.courseName) + '" title="Delete">' + SB.icon('trash', 18) + '</button></div></td></tr>';
      }).join('') + '</tbody></table></div>';
    var byId = {};
    data.items.forEach(function (c) { byId[c.id] = c; });
    host.querySelectorAll('[data-manage]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); openStudents(Number(el.dataset.manage)); }); });
    host.querySelectorAll('[data-edit]').forEach(function (el) { el.addEventListener('click', function () { openForm(byId[el.dataset.edit]); }); });
    host.querySelectorAll('[data-del]').forEach(function (el) { el.addEventListener('click', function () { remove(byId[el.dataset.del]); }); });
    SB.pager(document.getElementById('pagerHost'), data, function (p) { state.page = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- add / edit ---------- */
  function openForm(course) {
    var editing = !!course, c = course || { semester: 1, credits: 3 };
    function field(name, label, input, full, hint, optional) {
      return '<div class="field' + (full ? ' full' : '') + '"><label for="f_' + name + '">' + label + (optional ? '' : ' <span class="req" aria-hidden="true">*</span>') + '</label>' + input + (hint ? '<div class="field-hint">' + hint + '</div>' : '') + '<div class="field-error" role="alert"></div></div>';
    }
    var credits = [1, 2, 3, 4, 5, 6].map(function (n) { return [n, n + (n === 1 ? ' credit' : ' credits')]; });
    var body = '<form id="courseForm" novalidate><div class="alert error form-alert" role="alert" hidden><span></span></div><div class="form-grid">' +
      field('courseName', 'Course name', '<input class="input" id="f_courseName" name="courseName" maxlength="150" required value="' + SB.esc(c.courseName) + '">') +
      field('courseCode', 'Course code', '<input class="input" id="f_courseCode" name="courseCode" maxlength="20" required style="text-transform:uppercase" value="' + SB.esc(c.courseCode) + '">', false, 'Must be unique, e.g. CS301') +
      field('department', 'Department', '<select class="select" id="f_department" name="department" required>' + SB.deptOptions(c.department, 'Select department') + '</select>') +
      field('semester', 'Semester', '<select class="select" id="f_semester" name="semester" required>' + SB.semOptions(c.semester) + '</select>') +
      field('credits', 'Credits', '<select class="select" id="f_credits" name="credits" required>' + SB.options(credits, c.credits) + '</select>') +
      field('instructorName', 'Instructor name', '<input class="input" id="f_instructorName" name="instructorName" maxlength="100" required value="' + SB.esc(c.instructorName) + '">') +
      field('description', 'Course description', '<textarea class="textarea" id="f_description" name="description" rows="3" maxlength="1000">' + SB.esc(c.description) + '</textarea>', true, '', true) +
      '</div></form>';
    var m = SB.modal({
      title: editing ? 'Edit course' : 'Add new course', size: 'wide', body: body, persistent: true,
      footer: '<button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn primary" form="courseForm" id="saveBtn">' + (editing ? 'Save changes' : 'Add course') + '</button>'
    });
    m.el.querySelector('[data-cancel]').addEventListener('click', m.close);
    var form = m.el.querySelector('#courseForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      SB.clearErrors(form);
      var data = SB.formData(form), errors = {};
      if (data.courseName.length < 3) errors.courseName = 'Enter the course name (at least 3 characters).';
      if (!data.courseCode) errors.courseCode = 'Course code is required.';
      else if (!/^[A-Za-z0-9-]{2,20}$/.test(data.courseCode)) errors.courseCode = 'Use letters, digits and hyphens only.';
      if (!data.department) errors.department = 'Select a department.';
      if (data.instructorName.length < 2) errors.instructorName = 'Enter the instructor\'s name.';
      if (Object.keys(errors).length) { SB.showErrors(form, errors, 'Please correct the highlighted fields.'); return; }
      if (editing) data.id = c.id;
      data.action = editing ? 'update' : 'create';
      var btn = m.el.querySelector('#saveBtn');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/courses', data);
        SB.toast(res.message);
        SB.loadCourses(true);
        m.close();
        load();
      } catch (err) {
        SB.setBusy(btn, false);
        SB.showErrors(form, err.errors, err.message);
      }
    });
  }

  async function remove(c) {
    var ok = await SB.confirm({ title: 'Delete course', message: 'Delete <strong>' + SB.esc(c.courseName) + '</strong> (' + SB.esc(c.courseCode) + ')? Its allocations, attendance and marks will be removed too. This cannot be undone.' });
    if (!ok) return;
    try {
      var res = await SB.api.post('api/courses', { action: 'delete', id: c.id });
      SB.toast(res.message);
      SB.loadCourses(true);
      load();
    } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
  }

  async function exportCsv() {
    var btn = document.getElementById('exportBtn');
    SB.setBusy(btn, true);
    try {
      var rows = await SB.fetchAll('api/courses', { q: state.q, department: state.department, semester: state.semester });
      SB.downloadCsv('scholarbase-courses.csv', [
        { key: 'courseCode', label: 'Course code' }, { key: 'courseName', label: 'Course name' }, { key: 'department', label: 'Department' },
        { key: 'semester', label: 'Semester' }, { key: 'credits', label: 'Credits' }, { key: 'instructorName', label: 'Instructor' },
        { key: 'enrolledCount', label: 'Enrolled students' }, { key: 'description', label: 'Description' }
      ], rows);
      SB.toast('Exported ' + rows.length + ' courses.');
    } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
    SB.setBusy(btn, false);
  }

  /* ---------- student allocation ---------- */
  async function openStudents(courseId) {
    var changed = false;
    var m = SB.modal({ title: 'Course students', size: 'wide', body: SB.skeleton(5, 3), onClose: function () { if (changed) load(); } });
    var detail, candidates = [], q = '';

    async function refresh() {
      detail = await SB.api.get('api/courses', { id: courseId });
      render();
      loadCandidates();
    }

    async function loadCandidates() {
      var host = m.body.querySelector('#candidates');
      if (!host) return;
      try {
        var res = await SB.api.get('api/students', { q: q, department: q ? '' : detail.course.department, status: 'ACTIVE', size: 40 });
        var enrolled = {};
        detail.students.forEach(function (s) { enrolled[s.id] = true; });
        candidates = res.items.filter(function (s) { return !enrolled[s.id]; });
        host.innerHTML = candidates.length ? candidates.map(function (s) {
          return '<label><input type="checkbox" value="' + s.id + '"><span><strong>' + SB.esc(s.fullName) + '</strong> <span class="muted small">' + SB.esc(s.rollNumber) + ' · ' + SB.esc(SB.abbr(s.department)) + ' · Sem ' + s.semester + '</span></span></label>';
        }).join('') : '<div class="notif-empty">' + (q ? 'No students match your search.' : 'Every active student in this department is already allocated.') + '</div>';
      } catch (e) { host.innerHTML = '<div class="notif-empty">Could not load students.</div>'; }
    }

    function render() {
      var c = detail.course;
      m.el.querySelector('.modal-head h2').textContent = c.courseName;
      m.body.innerHTML =
        '<div class="report-meta"><span><strong>' + SB.esc(c.courseCode) + '</strong></span><span>' + SB.esc(c.department) + '</span><span>Semester ' + c.semester + '</span><span>' + c.credits + ' credits</span><span>Instructor: ' + SB.esc(c.instructorName) + '</span></div>' +
        '<div class="section-title"><span>Enrolled students (' + detail.students.length + ')</span><button type="button" class="btn sm" id="autoBtn">' + SB.icon('userplus', 16) + 'Allocate all matching students</button></div>' +
        (detail.students.length ? '<div class="table-wrap"><table class="data compact"><thead><tr><th>Student</th><th>Roll no.</th><th>Status</th><th></th></tr></thead><tbody>' +
          detail.students.map(function (s) {
            return '<tr><td><div class="cell-person">' + SB.avatar(s.fullName) + '<div><span class="name">' + SB.esc(s.fullName) + '</span><span class="sub">' + SB.esc(s.department) + ' · Sem ' + s.semester + '</span></div></div></td>' +
              '<td>' + SB.esc(s.rollNumber) + '</td><td>' + SB.studentStatus(s.status) + '</td>' +
              '<td class="right"><button type="button" class="icon-action del" data-remove="' + s.id + '" aria-label="Remove ' + SB.esc(s.fullName) + '" title="Remove from course">' + SB.icon('x', 18) + '</button></td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted">No students are allocated yet.</p>') +
        '<div class="section-title">Allocate more students</div>' +
        '<div class="toolbar" style="padding:0 0 12px;border:0"><div class="search-box" style="max-width:none">' + SB.icon('search', 18) + '<input class="input" id="cq" type="search" placeholder="Search by name or roll number (defaults to this department)" aria-label="Search students to allocate" value="' + SB.esc(q) + '"></div></div>' +
        '<div class="checklist" id="candidates"><div class="notif-empty">Loading…</div></div>' +
        '<div style="margin-top:12px"><button type="button" class="btn primary" id="allocBtn">' + SB.icon('plus', 16) + 'Allocate selected</button></div>';

      m.body.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', async function () {
          var s = detail.students.filter(function (x) { return String(x.id) === b.dataset.remove; })[0];
          var ok = await SB.confirm({ title: 'Remove student', confirmText: 'Remove', message: 'Remove <strong>' + SB.esc(s.fullName) + '</strong> from this course? Their attendance and marks for it will also be deleted.' });
          if (!ok) return;
          try {
            var res = await SB.api.post('api/courses', { action: 'deallocate', courseId: courseId, studentId: s.id });
            SB.toast(res.message); changed = true; refresh();
          } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
        });
      });
      m.body.querySelector('#cq').addEventListener('input', SB.debounce(function (e) { q = e.target.value.trim(); loadCandidates(); }, 300));
      m.body.querySelector('#allocBtn').addEventListener('click', async function () {
        var ids = Array.prototype.map.call(m.body.querySelectorAll('#candidates input:checked'), function (i) { return i.value; });
        if (!ids.length) { SB.toast('Tick at least one student first.', 'error'); return; }
        try {
          var res = await SB.api.post('api/courses', { action: 'allocate', courseId: courseId, studentId: ids });
          SB.toast(res.message); changed = true; refresh();
        } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
      });
      m.body.querySelector('#autoBtn').addEventListener('click', async function () {
        try {
          var res = await SB.api.post('api/courses', { action: 'allocateMatching', courseId: courseId });
          SB.toast(res.message); changed = true; refresh();
        } catch (e) { SB.toast(SB.errorMessage(e), 'error'); }
      });
    }

    try { await refresh(); } catch (e) { m.body.innerHTML = SB.empty('alert', 'Could not load course', SB.errorMessage(e)); }
  }

  SB.ready.then(function () {
    shell();
    load();
    if (SB.qs('view')) openStudents(Number(SB.qs('view')));
  });
})();
