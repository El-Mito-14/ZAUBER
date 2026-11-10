/* Zauber – 3D-Darstellung (Canvas 2D, ohne Bibliotheken) */
(function (root) {
  'use strict';
  var C = root.CubeLib;
  var PALETTE = ['#ffffff', '#ffd500', '#c8102e', '#ff7f11', '#009b48', '#0a4fb4'];
  var GRAY = '#9a9ca3', BODY = '#1c1c1f', ACCENT = '#d62828';
  var H = 0.485, SH = 0.4, CAM = 9;
  var VIEWS = [ // Ansicht je Fläche U R F D L B (yaw, pitch)
    [-0.5, 0.8], [-1.05, 0.35], [-0.45, 0.35], [-0.5, -0.7], [1.05, 0.35], [2.7, 0.35]
  ];

  function CubeView(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.state = C.solvedColors();
    this.yaw = -0.55; this.pitch = 0.5; this.target = null;
    this.layerDrag = opts.layerDrag !== false; this.viewMode = false;
    this.queue = []; this.anim = null; this.highlight = -1;
    this.onTurn = opts.onTurn || null; this.polys = []; this.drag = null; this.busy = false;
    var self = this;
    this.resize();
    if (root.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(canvas.parentElement || canvas);
    root.addEventListener('resize', function () { self.resize(); });
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) { self.down(e); });
    canvas.addEventListener('pointermove', function (e) { self.move(e); });
    canvas.addEventListener('pointerup', function (e) { self.up(e); });
    canvas.addEventListener('pointercancel', function (e) { self.up(e); });
    (function loop() { self.frame(); root.requestAnimationFrame(loop); })();
  }
  var P = CubeView.prototype;
  P.resize = function () {
    var r = this.canvas.getBoundingClientRect(), d = root.devicePixelRatio || 1;
    this.W = Math.max(50, r.width); this.H = Math.max(50, r.height); this.dpr = d;
    this.canvas.width = Math.round(this.W * d); this.canvas.height = Math.round(this.H * d);
  };
  P.setState = function (s) { this.state = Uint8Array.from(s); };
  P.setViewFor = function (face) { this.target = VIEWS[face]; };
  P.isBusy = function () { return !!this.anim || this.queue.length > 0; };
  P.clearQueue = function () { this.queue = []; };
  // Zug einreihen: {k,c,steps}, dur in ms, cb nach Abschluss
  P.enqueue = function (layer, dur, cb) { this.queue.push({ k: layer.k, c: layer.c, steps: layer.steps, dur: dur || 260, cb: cb }); };
  P.enqueueName = function (name, dur, cb) { this.enqueue(C.moveToLayer(name), dur, cb); };

  P.frame = function () {
    var now = performance.now();
    if (!this.anim && this.queue.length) {
      var q = this.queue.shift();
      this.anim = { k: q.k, c: q.c, from: 0, to: q.steps * Math.PI / 2, t0: now, dur: q.dur, cb: q.cb, live: false };
    }
    var a = this.anim;
    if (a && !a.live) {
      var t = Math.min(1, (now - a.t0) / a.dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      a.angle = a.from + (a.to - a.from) * e;
      if (t >= 1) this.finish();
    }
    if (this.target) {
      var dy = this.target[0] - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      this.yaw += dy * 0.14; this.pitch += (this.target[1] - this.pitch) * 0.14;
      if (Math.abs(dy) < 0.003 && Math.abs(this.target[1] - this.pitch) < 0.003) this.target = null;
    }
    this.draw();
  };
  P.finish = function () {
    var a = this.anim, steps = Math.round(a.to / (Math.PI / 2));
    this.anim = null;
    if (steps !== 0) this.state = C.applyPerm(this.state, C.layerPerm(a.k, a.c, steps));
    if (steps !== 0 && a.user && this.onTurn) this.onTurn({ k: a.k, c: a.c, steps: steps });
    if (a.cb) a.cb(steps);
  };

  function rotLayer(v, k, th) {
    var cs = Math.cos(th), sn = Math.sin(th), x = v[0], y = v[1], z = v[2];
    if (k === 0) return [x, y * cs - z * sn, y * sn + z * cs];
    if (k === 1) return [x * cs + z * sn, y, -x * sn + z * cs];
    return [x * cs - y * sn, x * sn + y * cs, z];
  }
  P.draw = function () {
    var ctx = this.ctx, W = this.W, Hh = this.H, self = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    var scale = Math.min(W, Hh) / 5.3, cx = W / 2, cy = Hh / 2, f = scale * CAM;
    var cyw = Math.cos(this.yaw), syw = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var an = this.anim;
    function view(v) {
      var x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw, y1 = v[1];
      return [x1, y1 * cp - z1 * sp, y1 * sp + z1 * cp];
    }
    var polys = [], i, a, sgn, ax1, ax2;
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      var p = [x, y, z], inL = an && p[an.k] === an.c, th = inL ? an.angle || 0 : 0;
      for (a = 0; a < 3; a++) for (sgn = -1; sgn <= 1; sgn += 2) {
        var n = [0, 0, 0]; n[a] = sgn;
        ax1 = (a + 1) % 3; ax2 = (a + 2) % 3;
        var outer = p[a] === sgn;
        var nn = view(inL ? rotLayer(n, an.k, th) : n);
        var ctr = [p[0] + n[0] * H, p[1] + n[1] * H, p[2] + n[2] * H];
        var cv = view(inL ? rotLayer(ctr, an.k, th) : ctr);
        var dx = -cv[0], dy2 = -cv[1], dz = CAM - cv[2];
        if (nn[0] * dx + nn[1] * dy2 + nn[2] * dz <= 0) continue;
        var dist = dx * dx + dy2 * dy2 + dz * dz;
        var mk = function (h, off) {
          var out = [], sg = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
          for (var q = 0; q < 4; q++) {
            var v = [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off];
            v[ax1] += sg[q][0] * h; v[ax2] += sg[q][1] * h;
            var w = view(inL ? rotLayer(v, an.k, th) : v), s = f / (CAM - w[2]);
            out.push([cx + w[0] * s, cy - w[1] * s]);
          }
          return out;
        };
        polys.push({ pts: mk(H, H), d: dist, c: BODY, body: true, hit: outer ? { p: p, n: n } : null });
        if (outer) {
          var fi = C.indexMap[C.key(p, n)], col = this.state[fi];
          polys.push({ pts: mk(SH, H + 0.004), d: dist - 0.02, c: col < 6 ? PALETTE[col] : GRAY, sticker: true, face: C.stickers[fi].face, hl: this.highlight === C.stickers[fi].face, px: scale });
        }
      }
    }
    polys.sort(function (u, v) { return v.d - u.d; });
    this.polys = polys;
    ctx.lineJoin = 'round';
    for (i = 0; i < polys.length; i++) {
      var pl = polys[i], pts = pl.pts;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var q = 1; q < 4; q++) ctx.lineTo(pts[q][0], pts[q][1]);
      ctx.closePath();
      if (pl.body) { ctx.fillStyle = BODY; ctx.fill(); ctx.strokeStyle = BODY; ctx.lineWidth = 1; ctx.stroke(); }
      else {
        ctx.fillStyle = pl.c; ctx.strokeStyle = pl.c; ctx.lineWidth = pl.px * 0.1; ctx.fill(); ctx.stroke();
        if (pl.hl) { ctx.strokeStyle = ACCENT; ctx.lineWidth = Math.max(2, pl.px * 0.07); ctx.stroke(); }
      }
    }
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
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
    return [x1, v[1] * cp - z1 * sp];
  };
  P.down = function (e) {
    if (this.anim && this.anim.live) return;
    var xy = this.localXY(e), hit = (this.layerDrag && !this.viewMode && !this.isBusy()) ? this.hitTest(xy[0], xy[1]) : null;
    this.canvas.setPointerCapture(e.pointerId);
    this.target = null;
    this.drag = { x0: xy[0], y0: xy[1], x: xy[0], y: xy[1], hit: hit, mode: hit ? 'pending' : 'view' };
  };
  P.move = function (e) {
    var d = this.drag; if (!d) return;
    var xy = this.localXY(e), dx = xy[0] - d.x, dy = xy[1] - d.y; d.x = xy[0]; d.y = xy[1];
    if (d.mode === 'view') {
      this.yaw += dx * 0.01; this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + dy * 0.01)); return;
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
      if (!best) { d.mode = 'view'; return; }
      var tv = [0, 0, 0]; tv[best.ta] = best.pr >= 0 ? 1 : -1;
      var w = [n[1] * tv[2] - n[2] * tv[1], n[2] * tv[0] - n[0] * tv[2], n[0] * tv[1] - n[1] * tv[0]];
      var k = w[0] ? 0 : w[1] ? 1 : 2, sig = w[k];
      d.mode = 'layer'; d.k = k; d.sig = sig; d.c = d.hit.p[k]; d.dir = [best.sx * (best.pr >= 0 ? 1 : -1), best.sy * (best.pr >= 0 ? 1 : -1)];
      d.px = Math.min(this.W, this.H) / 5.3 * 1.7;
      this.anim = { k: d.k, c: d.c, angle: 0, live: true, user: true, to: 0, from: 0 };
    }
    if (d.mode === 'layer') {
      var proj = tx * d.dir[0] + ty * d.dir[1];
      this.anim.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d.sig * proj / d.px * Math.PI / 2));
    }
  };
  P.up = function (e) {
    var d = this.drag; this.drag = null; if (!d) return;
    if (d.mode === 'layer' && this.anim) {
      var a = this.anim, to = Math.abs(a.angle) > Math.PI / 2 * 0.3 ? Math.sign(a.angle) * Math.PI / 2 : 0;
      a.live = false; a.from = a.angle; a.to = to; a.t0 = performance.now();
      a.dur = 40 + 160 * Math.abs(to - a.angle) / (Math.PI / 2);
    }
  };

  // ---- 2D-Netz ----
  function drawNet(canvas, state, hlFace) {
    var r = canvas.getBoundingClientRect(), d = root.devicePixelRatio || 1;
    var W = r.width, H = r.height; if (!W) return;
    if (canvas.width !== Math.round(W * d)) { canvas.width = Math.round(W * d); canvas.height = Math.round(H * d); }
    var ctx = canvas.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    var cell = Math.min(W / 12.6, H / 9.5), gap = cell * 0.3;
    var ox = (W - (12 * cell + 3 * gap)) / 2, oy = (H - (9 * cell + 2 * gap)) / 2;
    var pos = [[1, 0], [2, 1], [1, 1], [1, 2], [0, 1], [3, 1]]; // U R F D L B
    for (var f = 0; f < 6; f++) {
      var bx = ox + pos[f][0] * (3 * cell + gap), by = oy + pos[f][1] * (3 * cell + gap);
      for (var i = 0; i < 9; i++) {
        var col = state[f * 9 + i];
        ctx.fillStyle = col < 6 ? PALETTE[col] : GRAY; ctx.strokeStyle = '#1c1c1f'; ctx.lineWidth = 1;
        ctx.fillRect(bx + (i % 3) * cell, by + ((i / 3) | 0) * cell, cell, cell);
        ctx.strokeRect(bx + (i % 3) * cell, by + ((i / 3) | 0) * cell, cell, cell);
      }
      if (f === hlFace) { ctx.strokeStyle = ACCENT; ctx.lineWidth = 3; ctx.strokeRect(bx - 1, by - 1, 3 * cell + 2, 3 * cell + 2); }
    }
  }
  root.CubeView = CubeView; root.drawNet = drawNet; root.PALETTE = PALETTE;
})(window);
