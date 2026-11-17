/* Professional Master — Job Fair ID Card Studio */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- Data ---------------- */
  var TRACKS = {
    swd: {
      label: 'AI Powered Software Development',
      short: 'AI SOFTWARE DEVELOPMENT',
      blurb: 'Intelligent software engineering',
      jobs: ['AI Software Engineer', 'Full-Stack AI Developer', 'AI Solutions Developer', 'Backend Engineer (AI Systems)', 'MLOps Engineer']
    },
    ds: {
      label: 'Artificial Intelligence & Data Science',
      short: 'AI & DATA SCIENCE',
      blurb: 'Signature gold edition',
      jobs: ['Machine Learning Engineer', 'Data Scientist', 'AI Engineer', 'Generative AI Engineer', 'NLP Engineer', 'Computer Vision Engineer', 'Data Analyst']
    },
    cyber: {
      label: 'Cyber Security',
      short: 'CYBER SECURITY',
      blurb: 'Defend & secure systems',
      jobs: ['Cyber Security Analyst', 'SOC Analyst', 'Penetration Tester', 'Security Engineer', 'Incident Response Analyst', 'Cloud Security Engineer']
    }
  };
  var ORDER = ['swd', 'ds', 'cyber'];

  var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICON_BODY = {
    ds: '<path d="M5 6.5 12 4M5 6.5 12 12M5 17.5 12 12M5 17.5 12 20M12 4l7 4M12 12l7-4M12 12l7 4M12 20l7-4" stroke-width="1.3"/>' +
        '<g fill="currentColor" stroke="none"><circle cx="5" cy="6.5" r="1.9"/><circle cx="5" cy="17.5" r="1.9"/><circle cx="12" cy="4" r="1.9"/>' +
        '<circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="20" r="1.9"/><circle cx="19" cy="8" r="1.9"/><circle cx="19" cy="16" r="1.9"/></g>',
    cyber: '<path d="M12 2.5 19.5 5.5v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z"/>' +
           '<rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10.2 11V9.6a1.8 1.8 0 0 1 3.6 0V11"/>',
    swd: '<path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.6 5.5l-3.2 13"/>' +
         '<path d="M19.6 1.6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="currentColor" stroke="none"/>'
  };
  function icon(k) { return ICON_BODY[k] ? SVG_OPEN + ICON_BODY[k] + '</svg>' : ''; }

  /* ---------------- State ---------------- */
  var KEY = 'pm-idcard-v1';
  var DEFAULTS = { name: '', email: '', track: '', job: '', link: '', photo: '', zoom: 1, px: 0.5, py: 0.3 };
  var state = assign({}, DEFAULTS);
  var persist = true;

  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i]; if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        for (var k in DEFAULTS) if (s && s[k] !== undefined) state[k] = s[k];
      }
    } catch (e) { /* storage unavailable */ }
    if (!TRACKS[state.track]) state.track = '';
  }
  function save() {
    if (!persist) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      try { localStorage.setItem(KEY, JSON.stringify(assign({}, state, { photo: '' }))); } catch (e2) { /* ignore */ }
    }
  }
  var saveTimer = 0;
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); }

  /* ---------------- Elements ---------------- */
  var el = {};
  ['inName', 'inEmail', 'inJob', 'inLink', 'inPhoto', 'inZoom', 'nameNote', 'linkNote', 'testLink',
   'trackPick', 'jobChips', 'drop', 'dropThumb', 'dropTitle', 'photoTools', 'dragTip', 'photoErr',
   'btnPhotoReset', 'btnPrint', 'btnReset', 'paperFit', 'sheet',
   'fName', 'fRole', 'fTrack', 'fTrackDd', 'fTrackIco', 'fEmail', 'fProgram', 'seal', 'fNet',
   'phBox', 'phImg', 'qrTile'
  ].forEach(function (id) { el[id] = $(id); });

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function setText(node, value, placeholder) {
    node.textContent = value || placeholder;
    node.classList.toggle('is-ph', !value);
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------------- Decorative generators ---------------- */
  function constellation(svg, w, h, count, seed, o) {
    var r = rng(seed), pts = [], tries = 0, avoid = o.avoid || [];
    var blocked = function (x, y) {
      for (var a = 0; a < avoid.length; a++) {
        var q = avoid[a];
        if (x > q[0] && x < q[2] && y > q[1] && y < q[3]) return true;
      }
      return false;
    };
    var crosses = function (p, q) {
      for (var t = 0; t <= 1; t += 0.05) if (blocked(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)) return true;
      return false;
    };
    while (pts.length < count && tries++ < count * 30) {
      var x = r() * w, y = r() * h;
      if (blocked(x, y)) continue;
      var near = false;
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i][0] - x, dy = pts[i][1] - y;
        if (dx * dx + dy * dy < o.minDist * o.minDist) { near = true; break; }
      }
      if (!near) pts.push([x, y]);
    }
    var seen = {}, d = '';
    pts.forEach(function (p, i) {
      var ds = pts.map(function (q, j) {
        return [j, (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1])];
      }).filter(function (a) { return a[0] !== i; }).sort(function (a, b) { return a[1] - b[1]; });
      for (var k = 0; k < o.links && k < ds.length; k++) {
        var j = ds[k][0], key = i < j ? i + '-' + j : j + '-' + i;
        if (seen[key] || Math.sqrt(ds[k][1]) > o.maxLen || crosses(p, pts[j])) continue;
        seen[key] = 1;
        d += 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + 'L' + pts[j][0].toFixed(2) + ' ' + pts[j][1].toFixed(2);
      }
    });
    var nodes = '', halos = '';
    pts.forEach(function (p, i) {
      var big = i % 5 === 0;
      nodes += '<circle cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="' + (big ? o.node * 1.8 : o.node) + '"/>';
      if (big) halos += '<circle cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="' + (o.node * 3.6) + '"/>';
    });
    svg.innerHTML =
      '<path d="' + d + '" fill="none" stroke="' + o.color + '" stroke-opacity="' + o.lineOpacity + '" stroke-width="' + o.stroke + '"/>' +
      '<g fill="none" stroke="' + o.color + '" stroke-opacity="' + (o.lineOpacity * .9) + '" stroke-width="' + (o.stroke * .8) + '">' + halos + '</g>' +
      '<g fill="' + o.color + '" fill-opacity="' + o.nodeOpacity + '">' + nodes + '</g>';
  }

  function sealSVG(t) {
    var tr = TRACKS[t], ds = t === 'ds', id = 'seal-' + (t || 'none');
    var top = 'PROFESSIONAL MASTER';
    var bottom = tr ? tr.short : 'SELECT YOUR TRACK';
    var textFill = ds ? '#001631' : '#FABD0F';
    var innerStroke = t === 'cyber' ? '#B90E31' : (ds ? 'url(#' + id + 'g)' : '#FABD0F');
    var fit = function (txt, arc) { return Math.min(6.4, (arc * 0.84) / (txt.length * 0.9)).toFixed(2); };
    var edge;
    if (ds) {
      var p = [];
      for (var i = 0; i < 96; i++) {
        var a = i * Math.PI / 48, rr = i % 2 ? 46.8 : 49.6;
        p.push((50 + rr * Math.cos(a)).toFixed(2) + ',' + (50 + rr * Math.sin(a)).toFixed(2));
      }
      edge = '<polygon points="' + p.join(' ') + '" fill="url(#' + id + 'g)"/>' +
             '<circle cx="50" cy="50" r="45.4" fill="url(#' + id + 'g)" stroke="#7A5806" stroke-opacity=".35" stroke-width=".4"/>';
    } else {
      edge = '<circle cx="50" cy="50" r="49" fill="#002452"/>' +
             '<circle cx="50" cy="50" r="49" fill="none" stroke="#FABD0F" stroke-opacity=".8" stroke-width=".8"/>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#FCEBB0"/><stop offset=".3" stop-color="#D9A932"/>' +
          '<stop offset=".55" stop-color="#F7DC86"/><stop offset=".8" stop-color="#B8860B"/><stop offset="1" stop-color="#E7C25E"/>' +
        '</linearGradient>' +
        '<path id="' + id + 't" d="M11.5,50 A38.5,38.5 0 0,1 88.5,50"/>' +
        '<path id="' + id + 'b" d="M6.5,50 A43.5,43.5 0 0,0 93.5,50"/>' +
      '</defs>' +
      edge +
      '<circle cx="50" cy="50" r="' + (ds ? 43.6 : 45.6) + '" fill="none" stroke="' + (ds ? '#001631' : '#FABD0F') + '" stroke-opacity=".5" stroke-width=".5"/>' +
      '<text font-family="Montserrat, Arial, sans-serif" font-weight="700" font-size="' + fit(top, 121) + '" letter-spacing=".14em" fill="' + textFill + '" text-anchor="middle">' +
        '<textPath href="#' + id + 't" startOffset="50%">' + top + '</textPath></text>' +
      '<text font-family="Montserrat, Arial, sans-serif" font-weight="700" font-size="' + fit(bottom, 128) + '" letter-spacing=".14em" fill="' + textFill + '" text-anchor="middle">' +
        '<textPath href="#' + id + 'b" startOffset="50%">' + esc(bottom) + '</textPath></text>' +
      '<circle cx="9.6" cy="50" r="1.5" fill="' + textFill + '"/><circle cx="90.4" cy="50" r="1.5" fill="' + textFill + '"/>' +
      '<circle cx="50" cy="50" r="29.5" fill="#001631"/>' +
      '<circle cx="50" cy="50" r="29.5" fill="none" stroke="' + innerStroke + '" stroke-width="' + (t === 'cyber' ? 1.8 : 1.2) + '"/>' +
      '<circle cx="50" cy="50" r="26.6" fill="none" stroke="#FABD0F" stroke-opacity=".35" stroke-width=".4"/>' +
      (tr
        ? '<g transform="translate(34 34) scale(1.333)" color="' + (ds ? '#F3D27A' : '#FABD0F') + '" fill="none" stroke="currentColor"' +
          ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
          ICON_BODY[t].replace('stroke-width="1.3"', 'stroke-width="1.1"') + '</g>'
        : '<text x="50" y="58" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="24" fill="#FABD0F">M</text>') +
      '</svg>';
  }

  /* ---------------- QR ---------------- */
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }
  var lastLink = null;
  function renderQR() {
    var v = state.link.trim();
    if (v === lastLink) return;
    lastLink = v;
    if (!v || !window.qrcode) {
      el.qrTile.innerHTML = '<div class="qr-empty"><span>Your QR code<br>appears here</span></div>';
      return;
    }
    try {
      var qr = qrcode(0, 'M');
      qr.addData(v);
      qr.make();
      var n = qr.getModuleCount(), m = 1, d = '';
      for (var r = 0; r < n; r++) {
        var c = 0;
        while (c < n) {
          if (qr.isDark(r, c)) {
            var s = c;
            while (c < n && qr.isDark(r, c)) c++;
            d += 'M' + s + ' ' + r + 'h' + (c - s) + 'v1h-' + (c - s) + 'z';
          } else c++;
        }
      }
      var size = n + 2 * m;
      el.qrTile.innerHTML =
        '<svg viewBox="' + (-m) + ' ' + (-m) + ' ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
        '<rect x="' + (-m) + '" y="' + (-m) + '" width="' + size + '" height="' + size + '" fill="#fff"/>' +
        '<path d="' + d + '" fill="#001631"/></svg>';
    } catch (e) {
      el.qrTile.innerHTML = '<div class="qr-empty"><span>Link is<br>too long</span></div>';
    }
  }

  /* ---------------- Photo ---------------- */
  function photoGeom() {
    var fw = el.phBox.clientWidth, fh = el.phBox.clientHeight;
    var iw = el.phImg.naturalWidth, ih = el.phImg.naturalHeight;
    if (!fw || !fh || !iw || !ih) return null;
    var s = Math.max(fw / iw, fh / ih) * state.zoom;
    return { fw: fw, fh: fh, dw: iw * s, dh: ih * s };
  }
  function layoutPhoto() {
    if (!state.photo) return;
    var g = photoGeom(); if (!g) return;
    var x = (g.fw - g.dw) * state.px, y = (g.fh - g.dh) * state.py;
    var st = el.phImg.style;
    st.width = (g.dw / g.fw * 100) + '%';
    st.height = (g.dh / g.fh * 100) + '%';
    st.left = (x / g.fw * 100) + '%';
    st.top = (y / g.fh * 100) + '%';
  }
  el.phImg.addEventListener('load', layoutPhoto);

  function renderPhoto() {
    var has = !!state.photo;
    el.phBox.classList.toggle('has', has);
    if (has && el.phImg.getAttribute('src') !== state.photo) el.phImg.src = state.photo;
    if (!has) el.phImg.removeAttribute('src');
    el.photoTools.hidden = !has;
    el.dragTip.hidden = !has;
    el.dropThumb.style.backgroundImage = has ? 'url("' + state.photo + '")' : '';
    el.dropThumb.innerHTML = has ? '' :
      '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
    el.dropTitle.textContent = has ? 'Change photo' : 'Upload your photo';
    el.inZoom.value = state.zoom;
    layoutPhoto();
  }

  function showPhotoErr(msg) { el.photoErr.textContent = msg; el.photoErr.hidden = !msg; }

  function readPhoto(file) {
    showPhotoErr('');
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      showPhotoErr('Please use a JPG or PNG photo. (iPhone HEIC photos: export or share them as JPG first.)');
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 1400 / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      state.photo = c.toDataURL('image/jpeg', 0.92);
      state.zoom = 1; state.px = 0.5; state.py = 0.3;
      renderPhoto(); save();
      if (Math.min(w, h) < 350) showPhotoErr('This photo is quite small — it may look blurry when printed.');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      showPhotoErr('This image could not be read. Please try a JPG or PNG file.');
    };
    img.src = url;
  }

  el.inPhoto.addEventListener('change', function () { readPhoto(this.files && this.files[0]); this.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    el.drop.addEventListener(ev, function () { el.drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    el.drop.addEventListener(ev, function () { el.drop.classList.remove('over'); });
  });
  el.inZoom.addEventListener('input', function () { state.zoom = parseFloat(this.value) || 1; layoutPhoto(); saveSoon(); });
  el.btnPhotoReset.addEventListener('click', function () {
    state.zoom = 1; state.px = 0.5; state.py = 0.3; el.inZoom.value = 1; layoutPhoto(); save();
  });

  // drag to reposition / wheel to zoom, on the card preview
  var drag = null, viewScale = 1;
  el.phBox.addEventListener('pointerdown', function (e) {
    if (!state.photo) return;
    e.preventDefault();
    try { el.phBox.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    drag = { x: e.clientX, y: e.clientY, px: state.px, py: state.py };
    el.phBox.classList.add('dragging');
  });
  el.phBox.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var g = photoGeom(); if (!g) return;
    var sx = g.fw - g.dw, sy = g.fh - g.dh;
    var dx = (e.clientX - drag.x) / viewScale, dy = (e.clientY - drag.y) / viewScale;
    if (sx < -0.5) state.px = clamp(drag.px + dx / sx, 0, 1);
    if (sy < -0.5) state.py = clamp(drag.py + dy / sy, 0, 1);
    layoutPhoto();
  });
  function endDrag() { if (drag) { drag = null; el.phBox.classList.remove('dragging'); save(); } }
  el.phBox.addEventListener('pointerup', endDrag);
  el.phBox.addEventListener('pointercancel', endDrag);
  el.phBox.addEventListener('wheel', function (e) {
    if (!state.photo) return;
    e.preventDefault();
    state.zoom = clamp(state.zoom + (e.deltaY < 0 ? 0.05 : -0.05), 1, 2.5);
    el.inZoom.value = state.zoom; layoutPhoto(); saveSoon();
  }, { passive: false });

  /* ---------------- Track picker & job chips ---------------- */
  function buildTracks() {
    el.trackPick.innerHTML = ORDER.map(function (k) {
      var t = TRACKS[k];
      return '<button type="button" role="radio" class="track-opt t-' + k + '" data-k="' + k + '" aria-checked="false">' +
        '<span class="ti">' + icon(k) + '</span>' +
        '<span class="tt"><b>' + esc(t.label) + '</b><small>' + esc(t.blurb) + '</small></span>' +
        (k === 'ds' ? '<span class="tag">Signature</span>' : '') +
        '</button>';
    }).join('');
    el.trackPick.addEventListener('click', function (e) {
      var b = e.target.closest('.track-opt'); if (!b) return;
      state.track = b.getAttribute('data-k');
      render(); save();
    });
  }
  var chipsFor = null;
  function renderChips() {
    if (chipsFor === state.track) return;
    chipsFor = state.track;
    var t = TRACKS[state.track];
    el.jobChips.innerHTML = t
      ? t.jobs.map(function (j) { return '<button type="button" class="chip">' + esc(j) + '</button>'; }).join('')
      : '<span class="chip-hint">Pick a track to see suggestions.</span>';
  }
  el.jobChips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    e.preventDefault();
    state.job = b.textContent; el.inJob.value = state.job;
    render(); save();
  });

  /* ---------------- Notes ---------------- */
  function setNote(node, cls, msg) { node.className = 'note' + (cls ? ' ' + cls : ''); node.textContent = msg || ''; }
  function nameNote() {
    var words = state.name.trim().split(/\s+/).filter(Boolean).length;
    if (!state.name.trim()) setNote(el.nameNote, '', '');
    else if (/[؀-ۿ]/.test(state.name)) setNote(el.nameNote, 'bad', 'Please write your name in English letters.');
    else if (words < 4) setNote(el.nameNote, 'warn', 'The card asks for your full four-part name (' + words + ' entered).');
    else setNote(el.nameNote, 'ok', '✓ Looks good.');
  }
  function linkNote() {
    var v = state.link.trim(), valid = /^https?:\/\/\S+$/i.test(v);
    el.testLink.hidden = !valid;
    if (valid) el.testLink.href = v;
    if (!v) setNote(el.linkNote, '', '');
    else if (!valid) setNote(el.linkNote, 'bad', 'The link must start with https://');
    else if (!/^https:\/\/(drive|docs)\.google\.com\//i.test(v)) setNote(el.linkNote, 'warn', 'This is not a Google Drive link — make sure it opens your folder.');
    else if (!/\/folders\//i.test(v)) setNote(el.linkNote, 'warn', 'This looks like a single file. A folder link (with CV, LinkedIn & Infographic) is recommended.');
    else setNote(el.linkNote, 'ok', '✓ QR code generated. Scan it with your phone to double-check.');
  }

  /* ---------------- Auto-fit text ---------------- */
  function fitLine(node, base, min) {
    var s = base, g = 0;
    node.style.fontSize = s + 'pt';
    while (node.scrollWidth > node.clientWidth + 0.5 && s > min && g++ < 120) { s -= 0.25; node.style.fontSize = s + 'pt'; }
  }
  function fitAll() {
    fitLine(el.fName, 17, 9);
    fitLine(el.fRole, 7.2, 4.8);
    fitLine(el.fProgram, 8, 5.2);
    fitLine(el.fTrackDd, 8, 5.2);
    fitLine(el.fEmail, 8, 5.2);
  }

  /* ---------------- Render ---------------- */
  var lastTrack = null;
  function render() {
    var t = TRACKS[state.track];
    el.sheet.setAttribute('data-track', state.track || '');

    var name = state.name.trim().replace(/\s+/g, ' ');
    var job = state.job.trim();
    var email = state.email.trim().toLowerCase();
    setText(el.fName, name, 'Your Full Name');
    setText(el.fRole, job, 'Job Profile');
    setText(el.fTrack, t ? t.label : '', 'Select your track');
    setText(el.fEmail, email, 'name@example.com');

    if (lastTrack !== state.track) {
      lastTrack = state.track;
      el.fTrackIco.innerHTML = icon(state.track);
      el.seal.innerHTML = sealSVG(state.track);
      Array.prototype.forEach.call(el.trackPick.querySelectorAll('.track-opt'), function (b) {
        b.setAttribute('aria-checked', b.getAttribute('data-k') === state.track ? 'true' : 'false');
      });
    }
    renderChips();
    renderQR();
    renderPhoto();
    nameNote();
    linkNote();
    fitAll();
  }

  function syncForm() {
    el.inName.value = state.name;
    el.inEmail.value = state.email;
    el.inJob.value = state.job;
    el.inLink.value = state.link;
    el.inZoom.value = state.zoom;
  }

  function bindInput(node, key) {
    node.addEventListener('input', function () { state[key] = node.value; render(); saveSoon(); });
  }
  bindInput(el.inName, 'name');
  bindInput(el.inEmail, 'email');
  bindInput(el.inJob, 'job');
  bindInput(el.inLink, 'link');

  /* ---------------- Preview scaling ---------------- */
  function scalePreview() {
    var avail = el.paperFit.clientWidth;
    var W = el.sheet.offsetWidth, H = el.sheet.offsetHeight;
    if (!avail || !W) return;
    viewScale = Math.min(1, avail / W);
    el.sheet.style.transform = 'scale(' + viewScale + ')';
    el.sheet.style.left = Math.max(0, (avail - W * viewScale) / 2) + 'px';
    el.paperFit.style.height = (H * viewScale) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(scalePreview).observe(el.paperFit);
  window.addEventListener('resize', scalePreview);

  /* ---------------- Actions ---------------- */
  el.btnPrint.addEventListener('click', function () {
    var miss = [];
    if (!state.name.trim()) miss.push('full name');
    if (!state.email.trim()) miss.push('email');
    if (!state.track) miss.push('track');
    if (!state.job.trim()) miss.push('job profile');
    if (!state.photo) miss.push('photo');
    if (!state.link.trim()) miss.push('Drive folder link');
    if (miss.length && !window.confirm('Still missing: ' + miss.join(', ') + '.\n\nPrint anyway?')) return;
    var go = function () { fitAll(); window.print(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
  });
  window.addEventListener('beforeprint', fitAll);

  el.btnReset.addEventListener('click', function () {
    if (!window.confirm('Clear all your details and photo?')) return;
    state = assign({}, DEFAULTS);
    save(); syncForm(); showPhotoErr(''); render();
  });

  /* ---------------- Init ---------------- */
  constellation(el.fNet, 80, 62, 26, 7, {
    minDist: 7, links: 2, maxLen: 22, node: .42, stroke: .17,
    color: '#A47A10', lineOpacity: .5, nodeOpacity: .75,
    // keep the network clear of the name, job profile and field values
    avoid: [[-1, 6, 52, 23], [-1, 25, 38, 54]]
  });
  buildTracks();
  load();
  syncForm();
  render();
  scalePreview();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitAll(); layoutPhoto(); });

  /* Hook for prefilling (used for testing). */
  window.CardApp = {
    apply: function (data, opts) {
      persist = !(opts && opts.persist === false);
      assign(state, data);
      syncForm(); render(); save();
    }
  };
})();
