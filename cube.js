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
      var t = name.replace(/[()]/g, '');
      if (N === 4) {
        // 4x4-Notation: R = äußere Schicht, Rr (oder Rw) = äußere zwei Schichten, r = nur die innere (zweite) Schicht, x y z = ganzer Würfel
        var w4 = /^([UDLRFB])([udlrfbw])(.*)$/.exec(t), o4 = /^([UDLRFB])(.*)$/.exec(t), i4 = /^([udlrfb])(.*)$/.exec(t), r4 = /^([xyz])(.*)$/.exec(t), g, suf4, cs4, k4, dir4;
        if (w4 && (w4[2] === 'w' || w4[2] === w4[1].toLowerCase())) { g = w4[1]; suf4 = w4[3]; k4 = FACE_AXIS[g][0]; cs4 = [FACE_AXIS[g][1] * m, FACE_AXIS[g][1] * (m - 1)]; dir4 = -FACE_AXIS[g][1]; }
        else if (o4) { g = o4[1]; suf4 = o4[2]; k4 = FACE_AXIS[g][0]; cs4 = [FACE_AXIS[g][1] * m]; dir4 = -FACE_AXIS[g][1]; }
        else if (i4) { g = i4[1].toUpperCase(); suf4 = i4[2]; k4 = FACE_AXIS[g][0]; cs4 = [FACE_AXIS[g][1] * (m - 1)]; dir4 = -FACE_AXIS[g][1]; }
        else if (r4) { k4 = { x: 0, y: 1, z: 2 }[r4[1]]; suf4 = r4[2]; cs4 = coords.slice(); dir4 = -1; }
        else throw new Error('Unbekannter Zug: ' + name);
        var am4 = suf4.indexOf('2') >= 0 ? 2 : (suf4.indexOf("'") >= 0 ? 3 : 1), st4 = (((dir4 * am4) % 4) + 4) % 4; if (st4 === 3) st4 = -1;
        return { k: k4, cs: cs4, c: cs4[0], steps: st4, name: t };
      }
      var mm = /^(\d?)([UDLRFBudlrfbMESxyz])(.*)$/.exec(t);
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
    // Zusammenfassen: Folgen von Zügen auf derselben Achse (z. B. u' u u') werden auf die kürzeste gleichwertige Folge gekürzt.
    // tags (optional) = Array gleicher Länge; ein zusammengefasster Zug erhält die Markierung des letzten beteiligten Zuges.
    var vocab = null, axisTab = null;
    function buildVocab() {
      var names = [], seen = {};
      function add(b) { ["", "'", "2"].forEach(function (sf) { names.push(b + sf); }); }
      FACE_NAMES.forEach(function (f) {
        add(f);
        if (N === 4) { add(f + f.toLowerCase()); add(f.toLowerCase()); } else if (N === 3) add(f.toLowerCase());
      });
      if (N === 3) ['M', 'E', 'S'].forEach(add);
      vocab = [[], [], []];
      names.forEach(function (nm) {
        var l; try { l = moveToLayer(nm); } catch (e) { return; }
        if (l.cs.length >= N) return;
        var vec = new Array(N).fill(0);
        l.cs.forEach(function (c) { vec[Math.round(c + m)] += l.steps; });
        var sig = l.k + ':' + vec.map(function (v) { return ((v % 4) + 4) % 4; }).join('');
        if (seen[sig]) return; seen[sig] = 1;
        vocab[l.k].push({ name: nm, vec: vec.map(function (v) { return ((v % 4) + 4) % 4; }) });
      });
      // BFS je Achse über alle 4^N Drehvektoren
      axisTab = [];
      for (var k = 0; k < 3; k++) {
        var total = Math.pow(4, N), dist = new Int16Array(total).fill(-1), par = new Int16Array(total), via = new Int16Array(total);
        dist[0] = 0; var queue = [0];
        for (var qi = 0; qi < queue.length; qi++) {
          var cur = queue[qi];
          for (var vi = 0; vi < vocab[k].length; vi++) {
            var vv = vocab[k][vi].vec, nx = 0, pw = 1, cd = cur;
            for (var i = 0; i < N; i++) { nx += (((cd % 4) + vv[i]) % 4) * pw; cd = (cd / 4) | 0; pw *= 4; }
            if (dist[nx] < 0) { dist[nx] = dist[cur] + 1; par[nx] = cur; via[nx] = vi; queue.push(nx); }
          }
        }
        axisTab.push({ dist: dist, par: par, via: via });
      }
    }
    function compact(moves, tags) {
      if (!vocab) buildVocab();
      var outM = [], outT = [], i = 0;
      while (i < moves.length) {
        var l0; try { l0 = moveToLayer(moves[i]); } catch (e) { l0 = null; }
        if (!l0 || l0.cs.length >= N) { outM.push(moves[i]); outT.push(tags ? tags[i] : 0); i++; continue; }
        var k = l0.k, j = i, vec = new Array(N).fill(0);
        while (j < moves.length) {
          var lj; try { lj = moveToLayer(moves[j]); } catch (e) { lj = null; }
          if (!lj || lj.cs.length >= N || lj.k !== k) break;
          lj.cs.forEach(function (c) { vec[Math.round(c + m)] += lj.steps; });
          j++;
        }
        var code = 0, pw2 = 1;
        for (var q = 0; q < N; q++) { code += (((vec[q] % 4) + 4) % 4) * pw2; pw2 *= 4; }
        var tab = axisTab[k], seq = [], cur2 = code;
        if (tab.dist[code] < 0 || tab.dist[code] > j - i) { for (var z = i; z < j; z++) { outM.push(moves[z]); outT.push(tags ? tags[z] : 0); } }
        else {
          while (cur2 !== 0) { seq.push(vocab[k][tab.via[cur2]].name); cur2 = tab.par[cur2]; }
          seq.reverse();
          if (seq.length === j - i) { for (var z2 = i; z2 < j; z2++) { outM.push(moves[z2]); outT.push(tags ? tags[z2] : 0); } }
          else seq.forEach(function (nm) { outM.push(nm); outT.push(tags ? tags[j - 1] : 0); });
        }
        i = j;
      }
      return { moves: outM, tags: outT };
    }
    return {
      compact: compact,
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
