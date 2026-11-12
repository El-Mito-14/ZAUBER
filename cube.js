/* Zauber – Würfel-Modell (54 Aufkleber, geometrisch erzeugte Züge) */
(function (root) {
  'use strict';
  // Flächen-Reihenfolge: U R F D L B  (Index = Flächen-ID)
  var FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
  var FACE_NORMALS = [[0,1,0],[1,0,0],[0,0,1],[0,-1,0],[-1,0,0],[0,0,-1]];
  // Standard-Farbschema -> Palette-IDs: 0 Weiß, 1 Gelb, 2 Rot, 3 Orange, 4 Grün, 5 Blau
  var SCHEME = [1, 3, 4, 0, 2, 5]; // Gelb oben, Weiß unten, Grün vorne, Blau hinten, Orange rechts, Rot links
  var COLOR_NAMES = ['Weiß', 'Gelb', 'Rot', 'Orange', 'Grün', 'Blau'];

  function faceSticker(f, r, c) {
    switch (f) {
      case 0: return [c - 1, 1, r - 1];
      case 1: return [1, 1 - r, 1 - c];
      case 2: return [c - 1, 1 - r, 1];
      case 3: return [c - 1, -1, 1 - r];
      case 4: return [-1, 1 - r, c - 1];
      default: return [1 - c, 1 - r, -1];
    }
  }
  var stickers = [];
  var indexMap = {};
  function key(p, n) { return p[0] + ',' + p[1] + ',' + p[2] + '|' + n[0] + ',' + n[1] + ',' + n[2]; }
  for (var f = 0; f < 6; f++) for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
    var s = { p: faceSticker(f, r, c), n: FACE_NORMALS[f], face: f, row: r, col: c };
    indexMap[key(s.p, s.n)] = stickers.length;
    stickers.push(s);
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
  // Gather-Permutation: neu[d] = alt[src[d]]; steps = Viertelumdrehungen um +e_k (gegen Uhrzeigersinn von +k aus)
  function layerPerm(k, c, steps) {
    steps = ((steps % 4) + 4) % 4;
    var ck = k + ':' + c + ':' + steps;
    if (permCache[ck]) return permCache[ck];
    var src = new Uint8Array(54);
    for (var j = 0; j < 54; j++) src[j] = j;
    for (j = 0; j < 54; j++) {
      var st = stickers[j];
      if (st.p[k] === c) {
        var np = rotVec(st.p, k, steps), nn = rotVec(st.n, k, steps);
        src[indexMap[key(np, nn)]] = j;
      }
    }
    permCache[ck] = src;
    return src;
  }
  var FACE_AXIS = { U: [1, 1], D: [1, -1], R: [0, 1], L: [0, -1], F: [2, 1], B: [2, -1] };
  // Beliebiger Zug: Außenseiten (R), Doppelschichten (r), Mittelschichten (M E S), Würfeldrehungen (x y z)
  // -> {k, cs (Schichten), c (erste Schicht), steps (-1..2, Viertelumdrehungen um +e_k), name}
  function moveToLayer(name) {
    var t = name.replace(/[()]/g, ''), base = t[0], suf = t.slice(1);
    var amt = suf.indexOf('2') >= 0 ? 2 : (suf.indexOf("'") >= 0 ? 3 : 1), k, cs, dir, up = base.toUpperCase();
    if (FACE_AXIS[base]) { k = FACE_AXIS[base][0]; cs = [FACE_AXIS[base][1]]; dir = -FACE_AXIS[base][1]; }
    else if (FACE_AXIS[up] && base !== up) { k = FACE_AXIS[up][0]; cs = [0, FACE_AXIS[up][1]]; dir = -FACE_AXIS[up][1]; }
    else if (base === 'M') { k = 0; cs = [0]; dir = 1; }
    else if (base === 'E') { k = 1; cs = [0]; dir = 1; }
    else if (base === 'S') { k = 2; cs = [0]; dir = -1; }
    else if (base === 'x') { k = 0; cs = [-1, 0, 1]; dir = -1; }
    else if (base === 'y') { k = 1; cs = [-1, 0, 1]; dir = -1; }
    else if (base === 'z') { k = 2; cs = [-1, 0, 1]; dir = -1; }
    else throw new Error('Unbekannter Zug: ' + name);
    var steps = (((dir * amt) % 4) + 4) % 4;
    if (steps === 3) steps = -1;
    return { k: k, cs: cs, c: cs[0], steps: steps, name: t };
  }
  var MOVE_NAMES = [];
  FACE_NAMES.forEach(function (fn) { MOVE_NAMES.push(fn, fn + "'", fn + '2'); });
  var permMoveCache = {};
  function multiPerm(k, cs, steps) {
    var p = new Uint8Array(54); for (var i = 0; i < 54; i++) p[i] = i;
    cs.forEach(function (c) { p = applyPermRaw(p, layerPerm(k, c, steps)); });
    return p;
  }
  function applyPermRaw(state, perm) { var out = new Uint8Array(54); for (var i = 0; i < 54; i++) out[i] = state[perm[i]]; return out; }
  function permOfMove(name) {
    var t = name.replace(/[()]/g, '');
    if (!permMoveCache[t]) { var l = moveToLayer(t); permMoveCache[t] = multiPerm(l.k, l.cs, l.steps); }
    return permMoveCache[t];
  }
  var MOVE_PERMS = {};
  MOVE_NAMES.forEach(function (m) { MOVE_PERMS[m] = permOfMove(m); });

  function applyPerm(state, perm) {
    var out = new Uint8Array(54);
    for (var i = 0; i < 54; i++) out[i] = state[perm[i]];
    return out;
  }
  function applyMove(state, m) { return applyPerm(state, permOfMove(m)); }
  function applyMoves(state, moves) {
    for (var i = 0; i < moves.length; i++) state = applyMove(state, moves[i]);
    return state;
  }
  function invertMove(m) { return m.length === 1 ? m + "'" : (m[1] === '2' ? m : m[0]); }
  function invertMoves(ms) { return ms.slice().reverse().map(invertMove); }
  function parseAlg(s) {
    return s.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).map(function (t) {
      return t.indexOf('2') >= 0 ? t[0] + '2' : t;
    });
  }
  function faceOfMove(m) { return FACE_NAMES.indexOf(m[0].toUpperCase()); }
  function solvedColors() {
    var a = new Uint8Array(54);
    for (var i = 0; i < 54; i++) a[i] = SCHEME[stickers[i].face];
    return a;
  }
  function isSolved(state) {
    for (var f = 0; f < 6; f++) for (var i = 1; i < 9; i++) if (state[f * 9 + i] !== state[f * 9]) return false;
    return true;
  }
  function simplify(moves) {
    var out = [];
    moves.forEach(function (m) {
      var amt = m.length === 1 ? 1 : (m[1] === '2' ? 2 : 3);
      if (out.length && out[out.length - 1][0] === m[0]) {
        var p = out.pop();
        var pa = p.length === 1 ? 1 : (p[1] === '2' ? 2 : 3);
        var t = (pa + amt) % 4;
        if (t === 0) return;
        out.push(m[0] + (t === 1 ? '' : t === 2 ? '2' : "'"));
      } else out.push(m);
    });
    return out;
  }
  var api = {
    FACE_NAMES: FACE_NAMES, FACE_NORMALS: FACE_NORMALS, SCHEME: SCHEME, COLOR_NAMES: COLOR_NAMES,
    stickers: stickers, indexMap: indexMap, key: key, rotVec: rotVec, layerPerm: layerPerm,
    moveToLayer: moveToLayer, multiPerm: multiPerm, permOfMove: permOfMove, faceOfMove: faceOfMove, MOVE_NAMES: MOVE_NAMES, MOVE_PERMS: MOVE_PERMS,
    applyPerm: applyPerm, applyMove: applyMove, applyMoves: applyMoves, invertMove: invertMove,
    invertMoves: invertMoves, parseAlg: parseAlg, solvedColors: solvedColors, isSolved: isSolved, simplify: simplify
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CubeLib = api;
})(typeof window !== 'undefined' ? window : this);
