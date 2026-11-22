/* Thin fetch wrapper: form-encoded POSTs, CSRF header, uniform errors, redirect to login on 401. */
(function () {
  SB.csrf = '';

  function toQuery(data, keepEmpty) {
    var params = new URLSearchParams();
    Object.keys(data || {}).forEach(function (k) {
      var v = data[k];
      if (v === undefined || v === null) return;
      (Array.isArray(v) ? v : [v]).forEach(function (item) {
        if (item === undefined || item === null) return;
        if (!keepEmpty && String(item) === '') return;
        params.append(k, item);
      });
    });
    return params.toString();
  }

  async function request(method, path, data) {
    var url = SB.url(path);
    var opts = { method: method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (method === 'GET') {
      var qs = toQuery(data, false);
      if (qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
    } else {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      opts.headers['X-CSRF-Token'] = SB.csrf || '';
      opts.body = toQuery(data, true);
    }
    var res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw { status: 0, message: 'Cannot reach the server. Check your connection and try again.', errors: {} };
    }
    var body = null;
    try { body = await res.json(); } catch (e) { /* non-JSON response */ }
    if (res.status === 401 && body && body.unauthenticated) {
      window.location.href = SB.url('login.html');
      throw { status: 401, message: 'Please sign in to continue.', errors: {} };
    }
    if (!res.ok) {
      throw {
        status: res.status,
        message: (body && body.message) || 'The request failed (HTTP ' + res.status + ').',
        errors: (body && body.errors) || {}
      };
    }
    return body;
  }

  SB.api = {
    get: function (path, data) { return request('GET', path, data); },
    post: function (path, data) { return request('POST', path, data); }
  };
})();
