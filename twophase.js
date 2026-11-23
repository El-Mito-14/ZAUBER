/* Zauber – Zwei-Phasen-Löser (nach Kociemba) für den 3x3. Findet kurze Lösungen (meist 19-22 Züge). */
(function (root) {
  'use strict';
  var C = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js') : root.CubeLib;
  var S = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./solver.js') : root.SolverLib;
  var eSlots = S.edgeSlots, cSlots = S.cornerSlots, SOLVED = S.SOLVED_NORM;
  var MN = C.MOVE_NAMES; // 18 Züge: U U' U2 R R' R2 F F' F2 D D' D2 L L' L2 B B' B2

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function cubieOf(s) {
    var l = S.locate(s), ep = new Uint8Array(12), eo = new Uint8Array(12), cp = new Uint8Array(8), co = new Uint8Array(8), i, loc;
    for (i = 0; i < 12; i++) { loc = l.e[i]; ep[loc >> 1] = i; eo[loc >> 1] = loc & 1; }
    for (i = 0; i < 8; i++) { loc = l.c[i]; cp[(loc / 3) | 0] = i; co[(loc / 3) | 0] = loc % 3; }
    return { ep: ep, eo: eo, cp: cp, co: co };
  }
  function mul(X, M) {
    var ep = new Uint8Array(12), eo = new Uint8Array(12), cp = new Uint8Array(8), co = new Uint8Array(8), i;
    for (i = 0; i < 12; i++) { ep[i] = X.ep[M.ep[i]]; eo[i] = (X.eo[M.ep[i]] + M.eo[i]) & 1; }
    for (i = 0; i < 8; i++) { cp[i] = X.cp[M.cp[i]]; co[i] = (X.co[M.cp[i]] + M.co[i]) % 3; }
    return { ep: ep, eo: eo, cp: cp, co: co };
  }
  var MOVES = MN.map(function (mv) { return cubieOf(C.applyMove(SOLVED, mv)); });
  var FACE_OF = MN.map(function (mv) { return C.FACE_NAMES.indexOf(mv[0]); });
  var P2 = []; MN.forEach(function (mv, i) { var f = mv[0]; if (f === 'U' || f === 'D' || mv.length === 2 && mv[1] === '2') P2.push(i); });
  var NP2 = P2.length;

  // ---- Koordinaten ----
  var isSlicePiece = [], sliceSlots = [], udSlots = [], udPieceRank = [], slicePieceRank = [], udSlotIdx = [], sliceSlotIdx = [];
  (function () {
    var i, a = 0, b = 0;
    for (i = 0; i < 12; i++) { isSlicePiece[i] = eSlots[i].p[1] === 0; }
    for (i = 0; i < 12; i++) {
      if (eSlots[i].p[1] === 0) { sliceSlotIdx[i] = sliceSlots.length; sliceSlots.push(i); } else { udSlotIdx[i] = udSlots.length; udSlots.push(i); }
      if (isSlicePiece[i]) slicePieceRank[i] = b++; else udPieceRank[i] = a++;
    }
  })();
  var combIdx = new Int16Array(4096).fill(-1), combMask = [];
  (function () { for (var m = 0; m < 4096; m++) { var c = 0; for (var b = 0; b < 12; b++) if (m >> b & 1) c++; if (c === 4) { combIdx[m] = combMask.length; combMask.push(m); } } })();
  var SLICE_SOLVED = (function () { var m = 0; sliceSlots.forEach(function (s) { m |= 1 << s; }); return combIdx[m]; })();
  function twistOf(co) { var v = 0; for (var i = 0; i < 7; i++) v = v * 3 + co[i]; return v; }
  function twistDec(v) { var co = new Uint8Array(8), sum = 0; for (var i = 6; i >= 0; i--) { co[i] = v % 3; sum += co[i]; v = (v / 3) | 0; } co[7] = (3 - sum % 3) % 3; return co; }
  function flipOf(eo) { var v = 0; for (var i = 0; i < 11; i++) v = v * 2 + eo[i]; return v; }
  function flipDec(v) { var eo = new Uint8Array(12), sum = 0; for (var i = 10; i >= 0; i--) { eo[i] = v & 1; sum += eo[i]; v >>= 1; } eo[11] = sum & 1; return eo; }
  function sliceOf(ep) { var m = 0; for (var i = 0; i < 12; i++) if (isSlicePiece[ep[i]]) m |= 1 << i; return combIdx[m]; }
  function rankPerm(a, n) { var r = 0; for (var i = 0; i < n; i++) { var c = 0; for (var j = i + 1; j < n; j++) if (a[j] < a[i]) c++; r = r * (n - i) + c; } return r; }
  function unrankPerm(r, n) {
    var a = new Uint8Array(n), c = new Array(n), i, j;
    for (i = n - 1; i >= 0; i--) { var base = n - i; c[i] = r % base; r = (r / base) | 0; }
    var used = []; for (i = 0; i < n; i++) used.push(false);
    for (i = 0; i < n; i++) { var k = c[i]; for (j = 0; j < n; j++) { if (!used[j]) { if (k === 0) break; k--; } } a[i] = j; used[j] = true; }
    return a;
  }
  var FACT8 = 40320;

  var T = null;
  function build() {
    if (T) return T;
    var t = {}, m, i, v;
    t.tw = new Uint16Array(2187 * 18); t.fl = new Uint16Array(2048 * 18); t.sl = new Uint16Array(495 * 18);
    for (m = 0; m < 18; m++) {
      var M = MOVES[m];
      for (v = 0; v < 2187; v++) { var co = twistDec(v), nc = new Uint8Array(8); for (i = 0; i < 8; i++) nc[i] = (co[M.cp[i]] + M.co[i]) % 3; t.tw[v * 18 + m] = twistOf(nc); }
      for (v = 0; v < 2048; v++) { var eo = flipDec(v), ne = new Uint8Array(12); for (i = 0; i < 12; i++) ne[i] = (eo[M.ep[i]] + M.eo[i]) & 1; t.fl[v * 18 + m] = flipOf(ne); }
      for (v = 0; v < 495; v++) {
        var mk = combMask[v], nm = 0;
        for (i = 0; i < 12; i++) if (mk >> M.ep[i] & 1) nm |= 1 << i;
        t.sl[v * 18 + m] = combIdx[nm];
      }
    }
    t.cp = new Uint16Array(FACT8 * NP2); t.ep = new Uint16Array(FACT8 * NP2); t.sp = new Uint8Array(24 * NP2);
    for (var pi = 0; pi < NP2; pi++) {
      var M2 = MOVES[P2[pi]];
      for (v = 0; v < FACT8; v++) {
        var a = unrankPerm(v, 8), b = new Uint8Array(8);
        for (i = 0; i < 8; i++) b[i] = a[M2.cp[i]];
        t.cp[v * NP2 + pi] = rankPerm(b, 8);
        var b2 = new Uint8Array(8);
        for (i = 0; i < 8; i++) b2[i] = a[udSlotIdx[M2.ep[udSlots[i]]]];
        t.ep[v * NP2 + pi] = rankPerm(b2, 8);
      }
      for (v = 0; v < 24; v++) {
        var a4 = unrankPerm(v, 4), b4 = new Uint8Array(4);
        for (i = 0; i < 4; i++) b4[i] = a4[sliceSlotIdx[M2.ep[sliceSlots[i]]]];
        t.sp[v * NP2 + pi] = rankPerm(b4, 4);
      }
    }
    function prune(n1, n2, mv1, mv2, nm, goal) {
      var tab = new Uint8Array(n1 * n2).fill(255), d = 0, cnt = 1; tab[goal] = 0;
      while (cnt > 0) {
        cnt = 0;
        for (var idx = 0; idx < tab.length; idx++) {
          if (tab[idx] !== d) continue;
          var a1 = (idx / n2) | 0, b1 = idx - a1 * n2;
          for (var mm = 0; mm < nm; mm++) {
            var ni = mv1[a1 * nm + mm] * n2 + mv2[b1 * nm + mm];
            if (tab[ni] === 255) { tab[ni] = d + 1; cnt++; }
          }
        }
        d++;
      }
      return tab;
    }
    t.p1a = prune(2187, 495, t.tw, t.sl, 18, 0 * 495 + SLICE_SOLVED);
    t.p1b = prune(2048, 495, t.fl, t.sl, 18, 0 * 495 + SLICE_SOLVED);
    t.p2a = prune(FACT8, 24, t.cp, t.sp, NP2, 0);
    t.p2b = prune(FACT8, 24, t.ep, t.sp, NP2, 0);
    T = t; return t;
  }

  // good = sofort fertig, ok/ms = nach ms Millisekunden reicht eine Lösung mit höchstens ok Zügen, hard = absolute Zeitgrenze
  var LEVELS = { 1: { good: 24, ok: 26, ms: 150, hard: 700 }, 2: { good: 21, ok: 22, ms: 800, hard: 3000 }, 3: { good: 18, ok: 20, ms: 3000, hard: 10000 } };

  // state: normalisierte Farben (54, Seitennummern). level 1 Blitz, 2 mittel, 3 tief. onProgress optional.
  function solve(state, level, onProgress, limits) {
    var t = build(), lv = LEVELS[level] || LEVELS[2];
    if (limits) lv = limits;
    var init = cubieOf(state);
    var tw0 = twistOf(init.co), fl0 = flipOf(init.eo), sl0 = sliceOf(init.ep);
    var best = null, bestLen = 99, t0 = now(), stop = false, nodes = 0, path = new Int8Array(40), path2 = new Int8Array(40);
    var tw = t.tw, fl = t.fl, sl = t.sl, p1a = t.p1a, p1b = t.p1b, p2a = t.p2a, p2b = t.p2b, cpT = t.cp, epT = t.ep, spT = t.sp;
    var cp0, ep0, sp0, found2 = 0;
    function dfs2(cp, ep, sp, left, lastFace, n2) {
      if (left === 0) { if (cp === 0 && ep === 0 && sp === 0) { found2 = n2; return true; } return false; }
      for (var pi = 0; pi < NP2; pi++) {
        var m = P2[pi], f = FACE_OF[m];
        if (f === lastFace) continue;
        if (lastFace >= 0 && f === (lastFace + 3) % 6 && f < lastFace) continue;
        var ncp = cpT[cp * NP2 + pi], nsp = spT[sp * NP2 + pi], nep = epT[ep * NP2 + pi];
        var h = p2a[ncp * 24 + nsp], h2 = p2b[nep * 24 + nsp]; if (h2 > h) h = h2;
        if (h > left - 1) continue;
        path2[n2] = m;
        if (dfs2(ncp, nep, nsp, left - 1, f, n2 + 1)) return true;
      }
      return false;
    }
    function finish(n) {
      var X = init, i;
      for (i = 0; i < n; i++) X = mul(X, MOVES[path[i]]);
      var a = rankPerm(X.cp, 8), e8 = new Uint8Array(8), s4 = new Uint8Array(4);
      for (i = 0; i < 8; i++) e8[i] = udPieceRank[X.ep[udSlots[i]]];
      for (i = 0; i < 4; i++) s4[i] = slicePieceRank[X.ep[sliceSlots[i]]];
      var e = rankPerm(e8, 8), s = rankPerm(s4, 4);
      var maxD = Math.min(bestLen - 1 - n, 18); if (best === null) maxD = Math.min(maxD, 16);
      var lastF = n ? FACE_OF[path[n - 1]] : -1;
      for (var d = 0; d <= maxD; d++) {
        if (dfs2(a, e, s, d, lastF, 0)) {
          var sol = []; for (i = 0; i < n; i++) sol.push(MN[path[i]]);
          for (i = 0; i < found2; i++) sol.push(MN[path2[i]]);
          if (sol.length < bestLen) { best = sol; bestLen = sol.length; best.p1 = n; if (onProgress) onProgress(bestLen); }
          return;
        }
      }
    }
    function dfs1(tw1, fl1, sl1, left, lastFace, n) {
      if ((++nodes & 1023) === 0 && best !== null) { var el = now() - t0; if (el > lv.hard || (el > lv.ms && bestLen <= lv.ok)) stop = true; }
      if (stop) return;
      if (left === 0) { if (tw1 === 0 && fl1 === 0 && sl1 === SLICE_SOLVED) { finish(n); if (bestLen <= lv.good) stop = true; } return; }
      for (var m = 0; m < 18; m++) {
        var f = FACE_OF[m];
        if (f === lastFace) continue;
        if (lastFace >= 0 && f === (lastFace + 3) % 6 && f < lastFace) continue;
        var nt = tw[tw1 * 18 + m], nf = fl[fl1 * 18 + m], ns = sl[sl1 * 18 + m];
        var h = p1a[nt * 495 + ns], h2 = p1b[nf * 495 + ns]; if (h2 > h) h = h2;
        if (h > left - 1) continue;
        path[n] = m;
        dfs1(nt, nf, ns, left - 1, f, n + 1);
        if (stop) return;
      }
    }
    for (var d1 = 0; d1 <= 12 && d1 < bestLen - 1 && !stop; d1++) dfs1(tw0, fl0, sl0, d1, -1, 0);
    if (!best) return null;
    var res = C.compact(best); return { moves: res.moves, p1: Math.min(best.p1, res.moves.length), ms: now() - t0 };
  }

  var api = { build: build, solve: solve, LEVELS: LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TwoPhase = api;
})(typeof window !== 'undefined' ? window : this);
