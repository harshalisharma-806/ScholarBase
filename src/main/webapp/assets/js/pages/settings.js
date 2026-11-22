/* Settings: profile, password change and the read-only academic rules (configured in grading.properties). */
(function () {
  var page = document.getElementById('page');

  function field(name, label, input, hint) {
    return '<div class="field"><label for="' + name + '">' + label + '</label>' + input + (hint ? '<div class="field-hint">' + hint + '</div>' : '') + '<div class="field-error" role="alert"></div></div>';
  }

  function render(settings) {
    var a = SB.admin, g = settings.grading;
    page.innerHTML = '<div class="page-head"><div><h1>Settings</h1><p>Your account and the academic rules used across ScholarBase.</p></div></div>' +
      '<div class="grid cols-2">' +
      '<section class="card"><div class="card-head"><div><h2>Profile</h2><p>Your administrator details</p></div></div><div class="card-body">' +
        '<div class="profile-head" style="margin-bottom:18px">' + SB.avatar(a.fullName, 'lg navy') + '<div><h3>' + SB.esc(a.fullName) + '</h3><div class="muted">@' + SB.esc(a.username) + ' · Last sign-in ' + SB.fmtDateTime(a.lastLogin) + '</div></div></div>' +
        '<form id="profileForm" novalidate><div class="alert error form-alert" role="alert" hidden><span></span></div><div class="form-grid">' +
        field('p_fullName', 'Full name', '<input class="input" id="p_fullName" name="fullName" maxlength="100" required value="' + SB.esc(a.fullName) + '">') +
        field('p_username', 'Username', '<input class="input" id="p_username" value="' + SB.esc(a.username) + '" disabled>', 'Usernames cannot be changed.') +
        '<div class="full">' + field('p_email', 'Email', '<input class="input" id="p_email" name="email" type="email" maxlength="120" required value="' + SB.esc(a.email) + '">') + '</div></div>' +
        '<div style="margin-top:16px"><button type="submit" class="btn primary" id="profileBtn">Save profile</button></div></form></div></section>' +

      '<section class="card" id="security"><div class="card-head"><div><h2>Change password</h2><p>Use at least 8 characters with letters and numbers</p></div></div><div class="card-body">' +
        '<form id="pwForm" novalidate autocomplete="off"><div class="alert error form-alert" role="alert" hidden><span></span></div><div class="form-grid" style="grid-template-columns:1fr">' +
        field('currentPassword', 'Current password', pw('currentPassword', 'current-password')) +
        field('newPassword', 'New password', pw('newPassword', 'new-password')) +
        field('confirmPassword', 'Confirm new password', pw('confirmPassword', 'new-password')) + '</div>' +
        '<div style="margin-top:16px"><button type="submit" class="btn primary" id="pwBtn">Update password</button></div></form></div></section></div>' +

      '<section class="card mt"><div class="card-head"><div><h2>Academic rules</h2><p>Defined in <code>grading.properties</code>. Edit the file and redeploy to change them.</p></div></div><div class="card-body">' +
        '<div class="summary-cards" style="margin-bottom:20px">' +
          mini('Pass mark', g.passPercentage + '%') + mini('Minimum attendance', g.attendanceMinimum + '%') + mini('Default maximum marks', g.defaultMaxMarks) + '</div>' +
        '<div class="table-wrap"><table class="data compact" style="max-width:520px"><thead><tr><th>Grade</th><th>Minimum %</th><th>Grade points</th></tr></thead><tbody>' +
        g.scale.map(function (b) { return '<tr><td>' + SB.gradeBadge(b.grade) + '</td><td>' + b.minimum + '%</td><td>' + b.points + '</td></tr>'; }).join('') + '</tbody></table></div></div></section>' +

      '<section class="card mt"><div class="card-head"><div><h2>About ScholarBase</h2><p>Smarter Student Management, Better Academic Insights.</p></div></div><div class="card-body"><dl class="kv">' +
        kv('Version', '1.0.0') + kv('Backend', 'Java Servlets (Jakarta 6.0) on Tomcat 10.1') + kv('Database', 'MySQL via JDBC') + '</dl></div></section>';

    SB.bindPasswordToggles(page);
    var profile = document.getElementById('profileForm'), pwForm = document.getElementById('pwForm');

    profile.addEventListener('submit', async function (e) {
      e.preventDefault();
      SB.clearErrors(profile);
      var d = SB.formData(profile), errs = {};
      if (d.fullName.length < 2) errs.fullName = 'Enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errs.email = 'Enter a valid email address.';
      if (Object.keys(errs).length) { SB.showErrors(profile, errs); return; }
      var btn = document.getElementById('profileBtn');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/settings', { action: 'updateProfile', fullName: d.fullName, email: d.email });
        SB.toast(res.message);
        SB.admin = res.admin;
        render(settings);
        document.querySelector('#profileWrap strong').textContent = res.admin.fullName;
        document.querySelector('#profileWrap .avatar').textContent = SB.initials(res.admin.fullName);
      } catch (err) { SB.setBusy(btn, false); SB.showErrors(profile, err.errors, err.message); }
    });

    pwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      SB.clearErrors(pwForm);
      var d = { currentPassword: pwForm.currentPassword.value, newPassword: pwForm.newPassword.value, confirmPassword: pwForm.confirmPassword.value }, errs = {};
      if (!d.currentPassword) errs.currentPassword = 'Enter your current password.';
      if (d.newPassword.length < 8) errs.newPassword = 'Use at least 8 characters.';
      else if (!/[A-Za-z]/.test(d.newPassword) || !/\d/.test(d.newPassword)) errs.newPassword = 'Include both letters and numbers.';
      if (d.confirmPassword !== d.newPassword) errs.confirmPassword = 'Passwords do not match.';
      if (Object.keys(errs).length) { SB.showErrors(pwForm, errs); return; }
      var btn = document.getElementById('pwBtn');
      SB.setBusy(btn, true);
      try {
        var res = await SB.api.post('api/settings', Object.assign({ action: 'changePassword' }, d));
        SB.toast(res.message);
        pwForm.reset();
      } catch (err) { SB.showErrors(pwForm, err.errors, err.message); }
      SB.setBusy(btn, false);
    });

    if (location.hash === '#security') document.getElementById('security').scrollIntoView();
  }

  function pw(name, autocomplete) {
    return '<div class="input-wrap"><input class="input" id="' + name + '" name="' + name + '" type="password" autocomplete="' + autocomplete + '" style="padding-right:48px">' +
      '<button type="button" class="icon-action toggle" data-toggle-password="' + name + '" aria-label="Show password">' + SB.icon('eye') + '</button></div>';
  }
  function mini(l, v) { return '<div class="mini"><div class="l">' + l + '</div><div class="v">' + SB.esc(v) + '</div></div>'; }
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + SB.esc(v) + '</dd></div>'; }

  SB.ready.then(function () {
    return SB.api.get('api/settings').then(render);
  }).catch(function (e) {
    page.innerHTML = '<div class="card">' + SB.empty('alert', 'Could not load settings', SB.errorMessage(e)) + '</div>';
  });
})();
