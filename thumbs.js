/* Zauber – kleine Grafiken (Vorschaubilder) für die Lektionen */
(function (root) {
  'use strict';
  var C = root.CubeLib;
  function prep(canvas) {
    var r = canvas.getBoundingClientRect(), d = root.devicePixelRatio || 1;
    if (!r.width) return null;
    var w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { W: r.width, H: r.height, d: d, ctx: canvas.getContext('2d') };
  }
  function accent() { return (root.getComputedStyle(root.document.documentElement).getPropertyValue('--accent') || '#d62828').trim(); }

  // 3D-Würfel, kleine Ansicht
  function iso(canvas, state, yaw, pitch) {
    var p = prep(canvas); if (!p) return;
    root.paintCube(p.ctx, p.W, p.H, p.d, state, yaw === undefined ? -0.6 : yaw, pitch === undefined ? 0.5 : pitch, null, -1, -1);
  }

  // Ansicht von oben: Oberseite + Seitenstreifen der oberen Schicht
  // mode 'oll': nur Gelb/Grau, mode 'pll': echte Farben außen + Pfeile
  function top(canvas, full, mode, arrows) {
    var p = prep(canvas); if (!p) return;
    var ctx = p.ctx, N = Math.min(p.W, p.H), u = N / 3.9, t = u * 0.3, gap = u * 0.07, ox = (p.W - 3 * u) / 2, oy = (p.H - 3 * u) / 2;
    ctx.setTransform(p.d, 0, 0, p.d, 0, 0); ctx.clearRect(0, 0, p.W, p.H);
    var uCol = C.SCHEME[0], YEL = '#ffd500', DIM = '#5a5d66', P = root.PALETTE;
    function fill(x, y, w, h, col) {
      ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.18); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    }
    C.stickers.forEach(function (s, i) {
      if (s.p[1] !== 1) return;
      var v = full[i], col;
      if (mode === 'oll') col = v === uCol ? YEL : DIM; else col = P[v];
      if (mode === 'pll' && s.n[1] === 1) col = YEL;
      var cx = ox + (s.p[0] + 1) * u, cy = oy + (s.p[2] + 1) * u;
      if (s.n[1] === 1) fill(cx + gap, cy + gap, u - 2 * gap, u - 2 * gap, col);
      else if (s.n[2] !== 0) fill(cx + u * 0.08, s.n[2] > 0 ? oy + 3 * u + gap : oy - gap - t, u * 0.84, t, col);
      else fill(s.n[0] > 0 ? ox + 3 * u + gap : ox - gap - t, cy + u * 0.08, t, u * 0.84, col);
    });
    if (arrows && arrows.length) {
      var ac = accent();
      arrows.forEach(function (a) {
        var x1 = ox + (a.from[0] + 1.5) * u, y1 = oy + (a.from[2] + 1.5) * u, x2 = ox + (a.to[0] + 1.5) * u, y2 = oy + (a.to[2] + 1.5) * u;
        var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 1) return;
        var ux = dx / len, uy = dy / len, nx = -uy * u * 0.11, ny = ux * u * 0.11, sh = u * 0.28;
        var sx = x1 + ux * sh + nx, sy = y1 + uy * sh + ny, ex = x2 - ux * sh + nx, ey = y2 - uy * sh + ny, hs = u * 0.26;
        ctx.strokeStyle = ac; ctx.fillStyle = ac; ctx.lineWidth = Math.max(2, u * 0.09); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex - ux * hs * 0.6, ey - uy * hs * 0.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - ux * hs - uy * hs * 0.55, ey - uy * hs + ux * hs * 0.55); ctx.lineTo(ex - ux * hs + uy * hs * 0.55, ey - uy * hs - ux * hs * 0.55); ctx.closePath(); ctx.fill();
      });
    }
  }
  root.Thumbs = { iso: iso, top: top };
})(window);
