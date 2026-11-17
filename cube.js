/* Zauber – Würfel-Modell (NxN, geometrisch erzeugte Züge). CubeLib = 3x3, Cube4 = 4x4 */
(function (root) {
  'use strict';
  var FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
  var FACE_NORMALS = [[0,1,0],[1,0,0],[0,0,1],[0,-1,0],[-1,0,0],[0,0,-1]];
  // Farbschema (Palette-IDs: 0 Weiß, 1 Gelb, 2 Rot, 3 Orange, 4 Grün, 5 Blau): Gelb oben, Grün vorne
  var SCHEME = [1, 3, 4, 0, 2, 5];
  var COLOR_NAMES = ['Weiß', 'Gelb', 'Rot', 'Orange', 'Grün', 'Blau'];
  var FACE_AXIS = { U: [1, 1], D: [1, -1], R: [0, 1], L: [0, -1], F: [2, 1], B: [2, -1] };

  function make(N) {
    var m = (N - 1) / 2, SZ = 6 * N * N;
    function faceSticker(f, r, c) {
      switch (f) {
        case 0: return [c - m, m, r - m];
        case 1: return [m, m - r, m - c];
        case 2: return [c - m, m - r, m];
        case 3: return [c - m, -m, m - r];
        case 4: return [-m, m - r, c - m];
        default: return [m - c, m - r, -m];
      }
    }
    var stickers = [], indexMap = {};
    function key(p, n) { return p[0] + ',' + p[1] + ',' + p[2] + '|' + n[0] + ',' + n[1] + ',' + n[2]; }
    for (var f = 0; f < 6; f++) for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var s = { p: faceSticker(f, r, c), n: FACE_NORMALS[f], face: f, row: r, col: c };
      indexMap[key(s.p, s.n)] = stickers.length; stickers.push(s);
    }
    function rotVec(v, k, steps) {
      steps = ((steps % 4) + 4) % 4;
      var x = v[0], y = v[1], z = v[2], t;
      for (var i = 0; i < steps; i++) {
        if (k === 0) { t = y; y = -z; z = t; }
        else if (k === 1) { t = x; x = z; z = -t; }
        else { t = x; x = -y; y = t; }
      }
      return [x + 0, y + 0, z + 0];
    }
    var permCache = {};
    function layerPerm(k, c, steps) {
      steps = ((steps % 4) + 4) % 4;
      var ck = k + ':' + c + ':' + steps;
      if (permCache[ck]) return permCache[ck];
      var src = new Uint8Array(SZ);
      for (var j = 0; j < SZ; j++) src[j] = j;
      for (j = 0; j < SZ; j++) {
        var st = stickers[j];
        if (st.p[k] === c) {
          var np = rotVec(st.p, k, steps), nn = rotVec(st.n, k, steps);
          src[indexMap[key(np, nn)]] = j;
        }
      }
      permCache[ck] = src; return src;
    }
    var coords = []; for (var i0 = 0; i0 < N; i0++) coords.push(i0 - m);
    function moveToLayer(name) {
      var t = name.replace(/[()]/g, ''), mm = /^(\d?)([UDLRFBudlrfbMESxyz])(.*)$/.exec(t);
      if (!mm) throw new Error('Unbekannter Zug: ' + name);
      var dig = mm[1] ? +mm[1] : 0, base = mm[2], suf = mm[3];
      var amt = suf.indexOf('2') >= 0 ? 2 : (suf.indexOf("'") >= 0 ? 3 : 1), k, cs, dir, up = base.toUpperCase();
      if (dig && FACE_AXIS[base]) { k = FACE_AXIS[base][0]; var s2 = FACE_AXIS[base][1]; cs = [s2 * (m - (dig - 1))]; dir = -s2; }
      else if (FACE_AXIS[base]) { k = FACE_AXIS[base][0]; cs = [FACE_AXIS[base][1] * m]; dir = -FACE_AXIS[base][1]; }
      else if (FACE_AXIS[up] && base !== up) { k = FACE_AXIS[up][0]; var s3 = FACE_AXIS[up][1]; cs = [s3 * m, s3 * (m - 1)]; dir = -s3; }
      else if (base === 'M') { k = 0; cs = [0]; dir = 1; }
      else if (base === 'E') { k = 1; cs = [0]; dir = 1; }
      else if (base === 'S') { k = 2; cs = [0]; dir = -1; }
      else if (base === 'x') { k = 0; cs = coords.slice(); dir = -1; }
      else if (base === 'y') { k = 1; cs = coords.slice(); dir = -1; }
      else { k = 2; cs = coords.slice(); dir = -1; }
      var steps = (((dir * amt) % 4) + 4) % 4; if (steps === 3) steps = -1;
      return { k: k, cs: cs, c: cs[0], steps: steps, name: t };
    }
    function applyPerm(state, perm) { var out = new Uint8Array(SZ); for (var i = 0; i < SZ; i++) out[i] = state[perm[i]]; return out; }
    function multiPerm(k, cs, steps) {
      var p = new Uint8Array(SZ); for (var i = 0; i < SZ; i++) p[i] = i;
      cs.forEach(function (c) { p = applyPerm(p, layerPerm(k, c, steps)); });
      return p;
    }
    var pmc = {};
    function permOfMove(name) {
      var t = name.replace(/[()]/g, '');
      if (!pmc[t]) { var l = moveToLayer(t); pmc[t] = multiPerm(l.k, l.cs, l.steps); }
      return pmc[t];
    }
    var MOVE_NAMES = [], MOVE_PERMS = {};
    FACE_NAMES.forEach(function (fn) { MOVE_NAMES.push(fn, fn + "'", fn + '2'); });
    MOVE_NAMES.forEach(function (mv) { MOVE_PERMS[mv] = permOfMove(mv); });
    function applyMove(state, mv) { return applyPerm(state, permOfMove(mv)); }
    function applyMoves(state, mvs) { for (var i = 0; i < mvs.length; i++) state = applyMove(state, mvs[i]); return state; }
    function invertMove(mv) { return mv.length === 1 ? mv + "'" : (mv[mv.length - 1] === '2' ? mv : (mv[mv.length - 1] === "'" ? mv.slice(0, -1) : mv + "'")); }
    function invertMoves(ms) { return ms.slice().reverse().map(invertMove); }
    function parseAlg(s) {
      return s.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).map(function (t) {
        return t.indexOf('2') >= 0 && !/^2[A-Za-z]$/.test(t.slice(0, 2)) ? t.replace(/2'?$/, '2') : (t.replace(/(2)'$/, '$1'));
      });
    }
    function faceOfMove(mv) { var mm = /^\d?([A-Za-z])/.exec(mv); return mm ? FACE_NAMES.indexOf(mm[1].toUpperCase()) : -1; }
    function solvedColors() { var a = new Uint8Array(SZ); for (var i = 0; i < SZ; i++) a[i] = SCHEME[stickers[i].face]; return a; }
    function isSolved(state) {
      var n2 = N * N;
      for (var f = 0; f < 6; f++) for (var i = 1; i < n2; i++) if (state[f * n2 + i] !== state[f * n2]) return false;
      return true;
    }
    function isCenter(i) { var s = stickers[i], r = s.row, c = s.col; return r > 0 && r < N - 1 && c > 0 && c < N - 1; }
    function simplify(moves) {
      var out = [];
      moves.forEach(function (mv) {
        var amt = mv.length === 1 ? 1 : (mv[1] === '2' ? 2 : 3);
        if (out.length && out[out.length - 1][0] === mv[0]) {
          var p = out.pop(), pa = p.length === 1 ? 1 : (p[1] === '2' ? 2 : 3), t = (pa + amt) % 4;
          if (t === 0) return;
          out.push(mv[0] + (t === 1 ? '' : t === 2 ? '2' : "'"));
        } else out.push(mv);
      });
      return out;
    }
    return {
      N: N, SZ: SZ, FACE_NAMES: FACE_NAMES, FACE_NORMALS: FACE_NORMALS, SCHEME: SCHEME, COLOR_NAMES: COLOR_NAMES,
      stickers: stickers, indexMap: indexMap, key: key, rotVec: rotVec, layerPerm: layerPerm, moveToLayer: moveToLayer,
      multiPerm: multiPerm, permOfMove: permOfMove, faceOfMove: faceOfMove, MOVE_NAMES: MOVE_NAMES, MOVE_PERMS: MOVE_PERMS,
      applyPerm: applyPerm, applyMove: applyMove, applyMoves: applyMoves, invertMove: invertMove, invertMoves: invertMoves,
      parseAlg: parseAlg, solvedColors: solvedColors, isSolved: isSolved, isCenter: isCenter, simplify: simplify
    };
  }
  var api = make(3); api.make = make;
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else { root.CubeLib = api; root.Cube4 = make(4); }
})(typeof window !== 'undefined' ? window : this);
