/* Lightweight dependency-free SVG charts: bar, horizontal bar, line, donut. */
(function () {
  var COLORS = ['#2f5bd6', '#8f86ee', '#4aa3df', '#13926a', '#e0a030', '#d64545', '#9aa7c7'];
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) { return SB.esc(s); }
  function empty(el, text) { el.innerHTML = '<div class="chart-empty">' + esc(text || 'No data to display yet.') + '</div>'; }
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  function short(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function bar(el, data, o) {
    o = o || {};
    if (!data || !data.length || data.every(function (d) { return !d.value; })) return empty(el, o.emptyText);
    var W = 520, H = 250, L = 38, R = 8, T = 18, B = 44;
    var max = o.max || niceMax(Math.max.apply(null, data.map(function (d) { return d.value; })));
    var iw = W - L - R, ih = H - T - B, slot = iw / data.length, bw = Math.min(46, slot * 0.58);
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Bar chart') + '">';
    for (var i = 0; i <= 4; i++) {
      var y = T + ih - (ih * i / 4);
      svg += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + SB.num(max * i / 4, 0) + (o.unit || '') + '</text>';
    }
    data.forEach(function (d, idx) {
      var h = ih * Math.min(d.value, max) / max, x = L + slot * idx + (slot - bw) / 2, y2 = T + ih - h;
      var color = d.color || o.color || COLORS[o.multicolor ? idx % COLORS.length : 0];
      svg += '<rect class="bar" x="' + x + '" y="' + y2 + '" width="' + bw + '" height="' + Math.max(h, 0) + '" rx="6" fill="' + color + '"><title>' + esc(d.label) + ': ' + SB.num(d.value) + (o.unit || '') + '</title></rect>';
      svg += '<text class="val" x="' + (x + bw / 2) + '" y="' + (y2 - 6) + '" text-anchor="middle">' + SB.num(d.value, 1) + '</text>';
      svg += '<text x="' + (x + bw / 2) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + esc(short(d.label, slot < 40 ? 6 : 12)) + '</text>';
    });
    el.innerHTML = '<div class="chart">' + svg + '</svg></div>';
  }

  function hbar(el, data, o) {
    o = o || {};
    if (!data || !data.length) return empty(el, o.emptyText);
    var rowH = 38, W = 520, L = 190, R = 46, H = data.length * rowH + 6;
    var max = o.max || niceMax(Math.max.apply(null, data.map(function (d) { return d.value; })));
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Bar chart') + '">';
    data.forEach(function (d, i) {
      var y = i * rowH + 6, w = (W - L - R) * d.value / max;
      svg += '<text x="0" y="' + (y + 17) + '" style="fill:var(--text);font-size:12px">' + esc(short(d.label, 30)) + '<title>' + esc(d.label) + '</title></text>';
      svg += '<rect x="' + L + '" y="' + (y + 4) + '" width="' + (W - L - R) + '" height="16" rx="8" fill="#eef1f8"/>';
      svg += '<rect class="bar" x="' + L + '" y="' + (y + 4) + '" width="' + Math.max(w, 6) + '" height="16" rx="8" fill="' + (o.multicolor ? COLORS[i % COLORS.length] : (o.color || COLORS[0])) + '"><title>' + esc(d.label) + ': ' + SB.num(d.value) + (o.unit || '') + '</title></rect>';
      svg += '<text class="val" x="' + (W) + '" y="' + (y + 17) + '" text-anchor="end">' + SB.num(d.value, 1) + (o.unit || '') + '</text>';
    });
    el.innerHTML = '<div class="chart">' + svg + '</svg></div>';
  }

  function line(el, data, o) {
    o = o || {};
    if (!data || data.length < 2) return empty(el, o.emptyText || 'Not enough data to draw a trend yet.');
    var W = 520, H = 230, L = 40, R = 14, T = 16, B = 36;
    var min = o.min === undefined ? 0 : o.min, max = o.max === undefined ? 100 : o.max;
    var iw = W - L - R, ih = H - T - B, step = iw / (data.length - 1);
    function px(i) { return L + step * i; }
    function py(v) { return T + ih - ih * (Math.min(Math.max(v, min), max) - min) / (max - min); }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Line chart') + '">';
    for (var i = 0; i <= 4; i++) {
      var v = min + (max - min) * i / 4, y = py(v);
      svg += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + SB.num(v, 0) + (o.unit || '') + '</text>';
    }
    var pts = data.map(function (d, i) { return px(i) + ',' + py(d.value); });
    var color = o.color || COLORS[0];
    svg += '<defs><linearGradient id="lg' + o.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
    svg += '<polygon points="' + L + ',' + (T + ih) + ' ' + pts.join(' ') + ' ' + px(data.length - 1) + ',' + (T + ih) + '" fill="url(#lg' + o.id + ')"/>';
    svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    data.forEach(function (d, i) {
      svg += '<circle cx="' + px(i) + '" cy="' + py(d.value) + '" r="4" fill="#fff" stroke="' + color + '" stroke-width="2.2"><title>' + esc(d.label) + ': ' + SB.num(d.value, 1) + (o.unit || '') + '</title></circle>';
      if (data.length <= 12 || i % Math.ceil(data.length / 8) === 0) svg += '<text x="' + px(i) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(d.label) + '</text>';
    });
    el.innerHTML = '<div class="chart">' + svg + '</svg></div>';
  }

  function donut(el, data, o) {
    o = o || {};
    var total = (data || []).reduce(function (s, d) { return s + d.value; }, 0);
    if (!total) return empty(el, o.emptyText);
    var S = 180, c = S / 2, r = 66, sw = 26, circ = 2 * Math.PI * r, offset = 0;
    var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" role="img" aria-label="' + esc(o.label || 'Donut chart') + '"><g transform="rotate(-90 ' + c + ' ' + c + ')">';
    svg += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="#eef1f8" stroke-width="' + sw + '"/>';
    data.forEach(function (d, i) {
      if (!d.value) return;
      var len = circ * d.value / total;
      svg += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + (d.color || COLORS[i % COLORS.length]) + '" stroke-width="' + sw + '" stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-offset) + '"><title>' + esc(d.label) + ': ' + d.value + '</title></circle>';
      offset += len;
    });
    svg += '</g><text x="' + c + '" y="' + (c + 2) + '" text-anchor="middle" style="fill:var(--navy-900);font-size:24px;font-weight:700">' + esc(o.centerValue === undefined ? total : o.centerValue) + '</text>';
    svg += '<text x="' + c + '" y="' + (c + 20) + '" text-anchor="middle" style="font-size:11px">' + esc(o.centerLabel || 'Total') + '</text></svg>';
    var legend = '<div class="legend" style="flex-direction:column;margin:0">' + data.map(function (d, i) {
      return '<span><i style="background:' + (d.color || COLORS[i % COLORS.length]) + '"></i>' + esc(d.label) + ' — <b style="color:var(--text)">' + d.value + '</b> (' + Math.round(d.value * 100 / total) + '%)</span>';
    }).join('') + '</div>';
    el.innerHTML = '<div class="donut-wrap"><div class="chart">' + svg + '</div>' + legend + '</div>';
  }

  SB.charts = { bar: bar, hbar: hbar, line: line, donut: donut, colors: COLORS };
})();
