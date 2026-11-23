/* Zauber – 3D-Darstellung (Canvas 2D, ohne Bibliotheken) */
(function (root) {
  'use strict';
  var C = root.CubeLib;
  var PALETTE = ['#ffffff', '#ffd500', '#c8102e', '#ff7f11', '#009b48', '#0a4fb4'];
  var GRAY = '#9a9ca3', BODY = '#1c1c1f', ACCENT = '#d62828';
  root.setCubeAccent = function (c) { ACCENT = c; };
  var H = 0.485, SH = 0.425, CAM = 9;
  var VIEWS = [ // Ansicht je Fläche U R F D L B (yaw, pitch)
    [-0.5, 0.8], [-1.05, 0.35], [-0.45, 0.35], [-0.5, -0.7], [1.05, 0.35], [2.7, 0.35]
  ];

  // ---- Drehmatrix der Ansicht (Zeilen = Bildschirm-x, -y, -z in Weltkoordinaten) ----
  function eulerR(yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [cy, 0, sy, sy * sp, cp, -cy * sp, -sy * cp, sp, cy * cp];
  }
  function mmul(A, B) {
    var o = new Array(9);
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return o;
  }
  function mT(A) { return [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]]; }
  function axisRot(ax, ay, az, a) {
    var l = Math.hypot(ax, ay, az); if (l < 1e-9) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    ax /= l; ay /= l; az /= l;
    var c = Math.cos(a), s2 = Math.sin(a), t = 1 - c;
    return [t * ax * ax + c, t * ax * ay - s2 * az, t * ax * az + s2 * ay, t * ax * ay + s2 * az, t * ay * ay + c, t * ay * az - s2 * ax, t * ax * az - s2 * ay, t * ay * az + s2 * ax, t * az * az + c];
  }
  function ortho(A) { // Gram-Schmidt gegen Rechenabweichung
    var x = [A[0], A[1], A[2]], y = [A[3], A[4], A[5]], d, l;
    l = Math.hypot(x[0], x[1], x[2]); x = x.map(function (v) { return v / l; });
    d = x[0] * y[0] + x[1] * y[1] + x[2] * y[2]; y = [y[0] - d * x[0], y[1] - d * x[1], y[2] - d * x[2]];
    l = Math.hypot(y[0], y[1], y[2]); y = y.map(function (v) { return v / l; });
    return [x[0], x[1], x[2], y[0], y[1], y[2], x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  }
  function relAngle(A, B) { var Q = mmul(B, mT(A)), c = (Q[0] + Q[4] + Q[8] - 1) / 2; return Math.acos(Math.max(-1, Math.min(1, c))); }
  function stepTo(A, B, frac) { // A ein Stück (frac) in Richtung B drehen, immer auf kürzestem Weg
    var Q = mmul(B, mT(A)), ang = Math.acos(Math.max(-1, Math.min(1, (Q[0] + Q[4] + Q[8] - 1) / 2)));
    if (ang < 1e-6) return B;
    var ax = Q[7] - Q[5], ay = Q[2] - Q[6], az = Q[3] - Q[1];
    if (Math.hypot(ax, ay, az) < 1e-6) { // ca. 180 Grad: Achse aus Q + I
      var best = [Q[0] + 1, Q[3], Q[6]], c2 = [Q[1], Q[4] + 1, Q[7]], c3 = [Q[2], Q[5], Q[8] + 1];
      [c2, c3].forEach(function (c) { if (Math.hypot(c[0], c[1], c[2]) > Math.hypot(best[0], best[1], best[2])) best = c; });
      ax = best[0]; ay = best[1]; az = best[2];
    }
    return ortho(mmul(axisRot(ax, ay, az, ang * frac), A));
  }
  // Blickrichtung d (Weltvektor, zeigt zum Betrachter), "oben" möglichst = Würfel-Oben
  function lookDir(d) {
    var l = Math.hypot(d[0], d[1], d[2]), z = [d[0] / l, d[1] / l, d[2] / l], up = Math.abs(z[1]) > 0.99 ? [0, 0, -Math.sign(z[1])] : [0, 1, 0];
    var dd = up[0] * z[0] + up[1] * z[1] + up[2] * z[2], y = [up[0] - dd * z[0], up[1] - dd * z[1], up[2] - dd * z[2]], ly = Math.hypot(y[0], y[1], y[2]); y = y.map(function (v) { return v / ly; });
    var x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
    return [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]];
  }

  function CubeView(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.G = opts.lib || C; this.state = this.G.solvedColors();
    this.R = eulerR(-0.55, 0.5); this.zoom = 1; this.target = null; this.ptr = {}; this.pinch = null;
    this.layerDrag = opts.layerDrag !== false; this.mode = 'free'; // free | view | layer
    this.queue = []; this.anim = null; this.highlight = null;
    this.onTurn = opts.onTurn || null; this.onTap = opts.onTap || null; this.selected = -1; this.polys = []; this.drag = null; this.busy = false;
    var self = this;
    this.resize();
    if (root.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(canvas.parentElement || canvas);
    root.addEventListener('resize', function () { self.resize(); });
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) { self.down(e); });
    canvas.addEventListener('pointermove', function (e) { self.move(e); });
    canvas.addEventListener('pointerup', function (e) { self.up(e); });
    canvas.addEventListener('pointercancel', function (e) { self.up(e); });
    canvas.addEventListener('lostpointercapture', function (e) { self.up(e); });
    (function loop() { self.frame(); root.requestAnimationFrame(loop); })();
  }
  var P = CubeView.prototype;
  P.resize = function () {
    var r = this.canvas.getBoundingClientRect(), d = root.devicePixelRatio || 1;
    this.W = Math.max(50, r.width); this.H = Math.max(50, r.height); this.dpr = d;
    this.canvas.width = Math.round(this.W * d); this.canvas.height = Math.round(this.H * d);
  };
  P.setState = function (s) { this.state = Uint8Array.from(s); };
  P.setViewFor = function (face) { this.target = eulerR(VIEWS[face][0], VIEWS[face][1]); this.exact = false; };
  P.isBusy = function () { return !!this.anim || this.queue.length > 0; };
  P.clearQueue = function () { this.queue = []; };
  // Zug einreihen: {k,c,steps}, dur in ms, cb nach Abschluss
  P.enqueue = function (layer, dur, cb) { this.queue.push({ k: layer.k, cs: layer.cs || [layer.c], steps: layer.steps, dur: dur || 260, cb: cb }); };
  P.enqueueName = function (name, dur, cb) { this.enqueue(this.G.moveToLayer(name), dur, cb); };
  P.setLib = function (lib) { this.G = lib; this.queue = []; this.anim = null; this.state = lib.solvedColors(); this.selected = -1; };

  P.frame = function () {
    var now = performance.now();
    if (!this.anim && this.queue.length) {
      var q = this.queue.shift();
      this.anim = { k: q.k, cs: q.cs, from: 0, to: q.steps * Math.PI / 2, t0: now, dur: q.dur, cb: q.cb, live: false };
    }
    var a = this.anim;
    if (a && !a.live) {
      var t = Math.min(1, (now - a.t0) / a.dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      a.angle = a.from + (a.to - a.from) * e;
      if (t >= 1) this.finish();
    }
    if (this.target) {
      var ang = relAngle(this.R, this.target);
      if (ang < 0.004) { if (this.exact) this.R = this.target; this.target = null; this.exact = false; }
      else this.R = stepTo(this.R, this.target, Math.max(0.14, Math.min(1, 0.012 / ang)));
    }
    this.draw(); this.drawVC();
  };
  P.finish = function () {
    var a = this.anim, steps = Math.round(a.to / (Math.PI / 2));
    this.anim = null;
    if (steps !== 0) this.state = this.G.applyPerm(this.state, this.G.multiPerm(a.k, a.cs, steps));
    if (steps !== 0 && a.user && this.onTurn) this.onTurn({ k: a.k, c: a.cs[0], steps: steps });
    if (a.cb) a.cb(steps);
  };

  function rotLayer(v, k, th) {
    var cs = Math.cos(th), sn = Math.sin(th), x = v[0], y = v[1], z = v[2];
    if (k === 0) return [x, y * cs - z * sn, y * sn + z * cs];
    if (k === 1) return [x * cs + z * sn, y, -x * sn + z * cs];
    return [x * cs - y * sn, x * sn + y * cs, z];
  }
  function paintCube(ctx, W, Hh, dpr, state, yaw, pitch, an, highlight, selected, G, zoom) {
    G = G || C; var N = G.N, mm = (N - 1) / 2, CAMN = CAM * N / 3;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    var scale = Math.min(W, Hh) / (5.3 * N / 3) * (zoom || 1), cx = W / 2, cy = Hh / 2, f = scale * CAMN;
    var RM = (typeof yaw === 'number') ? eulerR(yaw, pitch) : yaw;
    function view(v) { return [RM[0] * v[0] + RM[1] * v[1] + RM[2] * v[2], RM[3] * v[0] + RM[4] * v[1] + RM[5] * v[2], RM[6] * v[0] + RM[7] * v[1] + RM[8] * v[2]]; }
    var polys = [], i, a, sgn, ax1, ax2;
    var cc = []; for (var q0 = 0; q0 < N; q0++) cc.push(q0 - mm);
    for (var xi = 0; xi < N; xi++) for (var yi = 0; yi < N; yi++) for (var zi = 0; zi < N; zi++) {
      var x = cc[xi], y = cc[yi], z = cc[zi];
      if (N === 3 && !x && !y && !z) continue;
      var p = [x, y, z], inL = an && an.cs.indexOf(p[an.k]) >= 0, th = inL ? an.angle || 0 : 0;
      for (a = 0; a < 3; a++) for (sgn = -1; sgn <= 1; sgn += 2) {
        var n = [0, 0, 0]; n[a] = sgn;
        ax1 = (a + 1) % 3; ax2 = (a + 2) % 3;
        var outer = p[a] === sgn * mm;
        var nn = view(inL ? rotLayer(n, an.k, th) : n);
        var ctr = [p[0] + n[0] * H, p[1] + n[1] * H, p[2] + n[2] * H];
        var cv = view(inL ? rotLayer(ctr, an.k, th) : ctr);
        var dx = -cv[0], dy2 = -cv[1], dz = CAMN - cv[2];
        if (nn[0] * dx + nn[1] * dy2 + nn[2] * dz <= 0) continue;
        var dist = dx * dx + dy2 * dy2 + dz * dz;
        var mk = function (h, off) {
          var out = [], sg = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
          for (var q = 0; q < 4; q++) {
            var v = [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off];
            v[ax1] += sg[q][0] * h; v[ax2] += sg[q][1] * h;
            var w = view(inL ? rotLayer(v, an.k, th) : v), s = f / (CAMN - w[2]);
            out.push([cx + w[0] * s, cy - w[1] * s]);
          }
          return out;
        };
        polys.push({ pts: mk(H, H), d: dist, c: BODY, body: true, hit: outer ? { p: p, n: n } : null });
        if (outer) {
          var fi = G.indexMap[G.key(p, n)], col = state[fi];
          polys.push({ pts: mk(SH, H + 0.004), d: dist - 0.02, c: col < 6 ? PALETTE[col] : GRAY, sticker: true, idx: fi, sel: selected === fi, face: G.stickers[fi].face, hl: !!highlight && highlight.cs.indexOf(p[highlight.k]) >= 0, px: scale });
        }
      }
    }
    polys.sort(function (u, v) { return v.d - u.d; });
    ctx.lineJoin = 'round';
    for (i = 0; i < polys.length; i++) {
      var pl = polys[i], pts = pl.pts;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var q = 1; q < 4; q++) ctx.lineTo(pts[q][0], pts[q][1]);
      ctx.closePath();
      if (pl.body) { ctx.fillStyle = BODY; ctx.fill(); ctx.strokeStyle = BODY; ctx.lineWidth = 1; ctx.stroke(); }
      else {
        ctx.fillStyle = pl.c; ctx.strokeStyle = pl.c; ctx.lineWidth = pl.px * 0.04; ctx.fill(); ctx.stroke();
        if (pl.sel) { ctx.strokeStyle = ACCENT; ctx.lineWidth = Math.max(3, pl.px * 0.12); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, pl.px * 0.04); ctx.stroke(); }
        if (pl.hl) { ctx.strokeStyle = ACCENT; ctx.lineWidth = Math.max(2, pl.px * 0.07); ctx.stroke(); }
      }
    }
    return polys;
  }
  P.draw = function () {
    this.polys = paintCube(this.ctx, this.W, this.H, this.dpr, this.state, this.R, 0, this.anim, this.highlight, this.selected, this.G, this.zoom);
  };


  // ---- Ansichtswürfel (kleiner Würfel unten rechts, dreht sich mit; Tipp auf eine Seite richtet den Würfel aus) ----
  var VC_TARGETS = [[0, Math.PI / 2], [-Math.PI / 2, 0], [0, 0], [0, -Math.PI / 2], [Math.PI / 2, 0], [Math.PI, 0]];
  var VC_LETTERS = ['U', 'R', 'F', 'D', 'L', 'B'];
  P.attachViewCube = function () {
    var self = this, c = root.document.createElement('canvas'); c.className = 'vcube';
    this.canvas.parentNode.appendChild(c); this.vc = c; this.vcPolys = []; this.vcKey = ''; this.vcDraw = null;
    var d = root.devicePixelRatio || 1; c.width = Math.round(64 * d); c.height = Math.round(64 * d);
    c.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var Rm = self.R, best = null, bd = 1e9, S = 15.5, i, j, k2;
      // Ecken und Kantenmitten (nur sichtbare) haben kleine Trefferflächen, sonst zählt die Seite
      function consider(dv, rad) {
        var wz = Rm[6] * dv[0] + Rm[7] * dv[1] + Rm[8] * dv[2]; if (wz < 0.05) return;
        var sx = 32 + (Rm[0] * dv[0] + Rm[1] * dv[1] + Rm[2] * dv[2]) * S, sy = 32 - (Rm[3] * dv[0] + Rm[4] * dv[1] + Rm[5] * dv[2]) * S, dd = Math.hypot(sx - x, sy - y);
        if (dd < rad && dd < bd) { bd = dd; best = dv; }
      }
      for (i = -1; i <= 1; i += 2) for (j = -1; j <= 1; j += 2) for (k2 = -1; k2 <= 1; k2 += 2) consider([i, j, k2], 6.5);
      if (!best) { bd = 1e9; for (i = -1; i <= 1; i += 2) for (j = -1; j <= 1; j += 2) { consider([i, j, 0], 5.5); consider([i, 0, j], 5.5); consider([0, i, j], 5.5); } }
      if (best) { self.lookAtDir(best); return; }
      for (i = self.vcPolys.length - 1; i >= 0; i--) if (inPoly(self.vcPolys[i].pts, x, y)) { self.lookAt(self.vcPolys[i].face); break; }
    });
  };
  P.lookAt = function (face) { this.target = eulerR(VC_TARGETS[face][0], VC_TARGETS[face][1]); this.exact = true; };
  P.lookAtDir = function (d) { this.target = lookDir(d); this.exact = true; };
  P.drawVC = function () {
    var c = this.vc; if (!c) return;
    var de = root.document.documentElement, key = this.R.map(function (v) { return v.toFixed(3); }).join(',') + '|' + de.getAttribute('data-theme') + '|' + de.style.getPropertyValue('--accent');
    if (key === this.vcKey) return; this.vcKey = key;
    var d = root.devicePixelRatio || 1, ctx = c.getContext('2d'), dark = de.getAttribute('data-theme') === 'dark';
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, 64, 64);
    var RM = this.R, S = 15.5, polys = [];
    function view(v) { return [RM[0] * v[0] + RM[1] * v[1] + RM[2] * v[2], RM[3] * v[0] + RM[4] * v[1] + RM[5] * v[2], RM[6] * v[0] + RM[7] * v[1] + RM[8] * v[2]]; }
    var N3 = C.FACE_NORMALS, f;
    for (f = 0; f < 6; f++) {
      var n = N3[f], a = n[0] ? 0 : n[1] ? 1 : 2, a1 = (a + 1) % 3, a2 = (a + 2) % 3, nv = view(n);
      if (nv[2] <= 0.001) continue;
      var pts = [], sg = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
      for (var q = 0; q < 4; q++) { var v = [n[0], n[1], n[2]]; v[a1] += sg[q][0]; v[a2] += sg[q][1]; var w = view(v); pts.push([32 + w[0] * S, 32 - w[1] * S]); }
      polys.push({ pts: pts, face: f, z: nv[2] });
    }
    polys.sort(function (u, v) { return u.z - v.z; }); this.vcPolys = polys;
    var best = polys.length ? polys[polys.length - 1].face : -1, acc = de.style.getPropertyValue('--accent') || '#d62828';
    ctx.lineJoin = 'round';
    polys.forEach(function (p) {
      ctx.beginPath(); ctx.moveTo(p.pts[0][0], p.pts[0][1]); for (var i = 1; i < 4; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]); ctx.closePath();
      ctx.fillStyle = p.face === best ? acc : (dark ? '#3a3d45' : '#e6e7eb'); ctx.fill();
      ctx.strokeStyle = dark ? '#8d929c' : '#6b6e75'; ctx.lineWidth = 1.2; ctx.stroke();
      var cx = 0, cyy = 0; p.pts.forEach(function (q) { cx += q[0] / 4; cyy += q[1] / 4; });
      var sz = Math.max(7, 13 * Math.min(1, p.z + 0.25)); ctx.font = '700 ' + sz.toFixed(0) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = p.face === best ? '#fff' : (dark ? '#eceef2' : '#222427'); ctx.fillText(VC_LETTERS[p.face], cx, cyy + 0.5);
    });
    // kleine Punkte an sichtbaren Ecken und Kantenmitten (antippbar)
    ctx.fillStyle = dark ? 'rgba(236,238,242,.75)' : 'rgba(34,36,39,.6)';
    var dots = [], ii, jj, kk;
    for (ii = -1; ii <= 1; ii += 2) for (jj = -1; jj <= 1; jj += 2) { for (kk = -1; kk <= 1; kk += 2) dots.push([ii, jj, kk, 1.9]); dots.push([ii, jj, 0, 1.5]); dots.push([ii, 0, jj, 1.5]); dots.push([0, ii, jj, 1.5]); }
    dots.forEach(function (dv) { var w = view(dv); if (w[2] < 0.05) return; ctx.beginPath(); ctx.arc(32 + w[0] * S, 32 - w[1] * S, dv[3], 0, 6.2832); ctx.fill(); });
  };

  // ---- Bedienung ----
  function inPoly(pts, x, y) {
    var ins = false;
    for (var i = 0, j = 3; i < 4; j = i++) {
      if (((pts[i][1] > y) !== (pts[j][1] > y)) && (x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) ins = !ins;
    }
    return ins;
  }
  P.hitTest = function (x, y) {
    for (var i = this.polys.length - 1; i >= 0; i--) {
      var pl = this.polys[i];
      if (pl.body && pl.hit && inPoly(pl.pts, x, y)) return pl.hit;
    }
    return null;
  };
  P.localXY = function (e) { var r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  P.viewVec = function (v) {
    var RM = this.R;
    return [RM[0] * v[0] + RM[1] * v[1] + RM[2] * v[2], RM[3] * v[0] + RM[4] * v[1] + RM[5] * v[2]];
  };
  P.down = function (e) {
    this.ptr[e.pointerId] = this.localXY(e);
    if (this.drag) { // zweiter Finger: Drehen (Verdrehen), Ziehen und Zoomen der Ansicht
      if (!this.pinch && this.drag.mode === 'view' && e.pointerId !== this.drag.id) {
        this.canvas.setPointerCapture(e.pointerId);
        var a = this.ptr[this.drag.id], b = this.ptr[e.pointerId]; if (!a) return;
        this.pinch = { id2: e.pointerId, a: a.slice(), b: b.slice() };
      }
      return;
    }
    if (this.anim && this.anim.live) return;
    var xy = this.localXY(e), hit = (this.layerDrag && this.mode !== 'view' && !this.isBusy()) ? this.hitTest(xy[0], xy[1]) : null;
    this.canvas.setPointerCapture(e.pointerId);
    this.target = null;
    this.drag = { id: e.pointerId, x0: xy[0], y0: xy[1], x: xy[0], y: xy[1], hit: hit, maxMove: 0, tapHit: this.onTap ? this.hitTest(xy[0], xy[1]) : null, mode: hit ? 'pending' : (this.mode === 'layer' && this.layerDrag ? 'none' : 'view') };
  };
  function rollView(self, dx, dy) { // Bildschirmbezogene Drehung (Trackball): wie ein Ball unter dem Finger
    var k = 0.0078; self.R = ortho(mmul(mmul(axisRot(1, 0, 0, dy * k), axisRot(0, 1, 0, dx * k)), self.R));
  }
  P.move = function (e) {
    if (this.ptr[e.pointerId]) this.ptr[e.pointerId] = this.localXY(e);
    var pc = this.pinch;
    if (pc) {
      var d0 = this.drag; if (!d0) return;
      var pa = (e.pointerId === d0.id) ? this.ptr[d0.id] : pc.a, pb = (e.pointerId === pc.id2) ? this.ptr[pc.id2] : pc.b;
      if (e.pointerId !== d0.id && e.pointerId !== pc.id2) return;
      var a0 = Math.atan2(pc.b[1] - pc.a[1], pc.b[0] - pc.a[0]), a1 = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), da = a1 - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
      var l0 = Math.hypot(pc.b[0] - pc.a[0], pc.b[1] - pc.a[1]), l1 = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      var mx = ((pa[0] + pb[0]) - (pc.a[0] + pc.b[0])) / 2, my = ((pa[1] + pb[1]) - (pc.a[1] + pc.b[1])) / 2;
      this.R = ortho(mmul(axisRot(0, 0, 1, -da), this.R));
      rollView(this, mx, my);
      if (l0 > 20) this.zoom = Math.max(0.6, Math.min(2.4, this.zoom * l1 / l0));
      pc.a = pa.slice(); pc.b = pb.slice(); return;
    }
    var d = this.drag; if (!d || e.pointerId !== d.id) return;
    var xy = this.localXY(e), dx = xy[0] - d.x, dy = xy[1] - d.y; d.x = xy[0]; d.y = xy[1];
    d.maxMove = Math.max(d.maxMove, Math.hypot(xy[0] - d.x0, xy[1] - d.y0));
    if (d.mode === 'none') return;
    if (d.mode === 'view') {
      rollView(this, dx, dy); return;
    }
    var tx = xy[0] - d.x0, ty = xy[1] - d.y0;
    if (d.mode === 'pending') {
      if (Math.hypot(tx, ty) < 10) return;
      var n = d.hit.n, a = n[0] ? 0 : n[1] ? 1 : 2, best = null;
      for (var o = 1; o <= 2; o++) {
        var ta = (a + o) % 3, t = [0, 0, 0]; t[ta] = 1;
        var sv = this.viewVec(t), sx = sv[0], sy = -sv[1], len = Math.hypot(sx, sy);
        if (len < 0.12) continue;
        var pr = (tx * sx + ty * sy) / len;
        if (!best || Math.abs(pr) > Math.abs(best.pr)) best = { ta: ta, pr: pr, sx: sx / len, sy: sy / len };
      }
      if (!best) { d.mode = this.mode === 'layer' ? 'none' : 'view'; return; }
      var tv = [0, 0, 0]; tv[best.ta] = best.pr >= 0 ? 1 : -1;
      var w = [n[1] * tv[2] - n[2] * tv[1], n[2] * tv[0] - n[0] * tv[2], n[0] * tv[1] - n[1] * tv[0]];
      var k = w[0] ? 0 : w[1] ? 1 : 2, sig = w[k];
      d.mode = 'layer'; d.k = k; d.sig = sig; d.c = d.hit.p[k]; d.dir = [best.sx * (best.pr >= 0 ? 1 : -1), best.sy * (best.pr >= 0 ? 1 : -1)];
      d.px = Math.min(this.W, this.H) / (5.3 * this.G.N / 3) * this.zoom * 1.7;
      this.anim = { k: d.k, cs: [d.c], angle: 0, live: true, user: true, to: 0, from: 0 };
    }
    if (d.mode === 'layer') {
      var proj = tx * d.dir[0] + ty * d.dir[1];
      this.anim.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d.sig * proj / d.px * Math.PI / 2));
    }
  };
  P.up = function (e) {
    delete this.ptr[e.pointerId];
    if (this.pinch) { if (this.drag && (e.pointerId === this.drag.id || e.pointerId === this.pinch.id2)) { this.pinch = null; this.drag = null; } return; }
    var d = this.drag; if (!d || (e.pointerId !== undefined && e.pointerId !== d.id)) return; this.drag = null;
    if (d.mode !== 'layer' && d.maxMove < 9 && this.onTap && e.type === 'pointerup') { this.onTap(d.tapHit ? this.G.indexMap[this.G.key(d.tapHit.p, d.tapHit.n)] : -1); return; }
    if (d.mode === 'layer' && this.anim) {
      var a = this.anim, to = Math.abs(a.angle) > Math.PI / 2 * 0.3 ? Math.sign(a.angle) * Math.PI / 2 : 0;
      a.live = false; a.from = a.angle; a.to = to; a.t0 = performance.now();
      a.dur = 40 + 160 * Math.abs(to - a.angle) / (Math.PI / 2);
    }
  };

  // ---- 2D-Netz ----
  function drawNet(canvas, state, hlFace, N) {
    N = N || 3;
    var r = canvas.getBoundingClientRect(), d = root.devicePixelRatio || 1;
    var W = r.width, H = r.height; if (!W) return;
    if (canvas.width !== Math.round(W * d)) { canvas.width = Math.round(W * d); canvas.height = Math.round(H * d); }
    var ctx = canvas.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    var cell = Math.min(W / (4.2 * N), H / (3.2 * N)), gap = cell * 0.3;
    var ox = (W - (4 * N * cell + 3 * gap)) / 2, oy = (H - (3 * N * cell + 2 * gap)) / 2;
    var pos = [[1, 0], [2, 1], [1, 1], [1, 2], [0, 1], [3, 1]]; // U R F D L B
    for (var f = 0; f < 6; f++) {
      var bx = ox + pos[f][0] * (N * cell + gap), by = oy + pos[f][1] * (N * cell + gap);
      for (var i = 0; i < N * N; i++) {
        var col = state[f * N * N + i];
        ctx.fillStyle = col < 6 ? PALETTE[col] : GRAY; ctx.strokeStyle = '#1c1c1f'; ctx.lineWidth = 1;
        ctx.fillRect(bx + (i % N) * cell, by + ((i / N) | 0) * cell, cell, cell);
        ctx.strokeRect(bx + (i % N) * cell, by + ((i / N) | 0) * cell, cell, cell);
      }
      if (f === hlFace) { ctx.strokeStyle = ACCENT; ctx.lineWidth = 3; ctx.strokeRect(bx - 1, by - 1, N * cell + 2, N * cell + 2); }
    }
  }
  root.paintCube = paintCube; root.CubeView = CubeView; root.drawNet = drawNet; root.PALETTE = PALETTE;
})(window);
