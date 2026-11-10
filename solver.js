/* Zauber – Lösungsalgorithmus (Anfängermethode, Schicht für Schicht) */
(function (root) {
  'use strict';
  var C = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js') : root.CubeLib;
  var st = C.stickers;

  // ---------- Slots ----------
  var edgeSlots = [], cornerSlots = [];
  (function () {
    var groups = {};
    st.forEach(function (s, i) { var k = s.p.join(','); (groups[k] = groups[k] || { p: s.p, idx: [] }).idx.push(i); });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], nz = g.p.filter(function (v) { return v !== 0; }).length;
      if (nz === 2) {
        // Primär: U/D-Fläche, sonst F/B-Fläche
        g.idx.sort(function (a, b) { return pri(st[a]) - pri(st[b]); });
        edgeSlots.push({ p: g.p, idx: g.idx });
      } else if (nz === 3) {
        var byAxis = [];
        g.idx.forEach(function (i) { var n = st[i].n; byAxis[n[0] !== 0 ? 0 : n[1] !== 0 ? 1 : 2] = i; });
        var order = [byAxis[0], byAxis[1], byAxis[2]];
        if (g.p[0] * g.p[1] * g.p[2] === -1) order = [byAxis[0], byAxis[2], byAxis[1]];
        // so rotieren, dass die U/D-Fläche zuerst kommt
        while (st[order[0]].n[1] === 0) order.push(order.shift());
        cornerSlots.push({ p: g.p, idx: order });
      }
    });
    function pri(s) { return s.n[1] !== 0 ? 0 : (s.n[2] !== 0 ? 1 : 2); }
  })();

  var edgeLookup = new Int8Array(36).fill(-1), cornerLookup = new Int8Array(216).fill(-1);
  edgeSlots.forEach(function (sl, h) {
    var a = st[sl.idx[0]].face, b = st[sl.idx[1]].face;
    edgeLookup[a * 6 + b] = h * 2; edgeLookup[b * 6 + a] = h * 2 + 1;
  });
  cornerSlots.forEach(function (sl, h) {
    var t = sl.idx.map(function (i) { return st[i].face; });
    for (var r = 0; r < 3; r++) cornerLookup[t[r] * 36 + t[(r + 1) % 3] * 6 + t[(r + 2) % 3]] = h * 3 + r;
  });

  function locate(s) {
    var eLoc = new Int8Array(12).fill(-1), cLoc = new Int8Array(8).fill(-1);
    for (var e = 0; e < 12; e++) {
      var i = edgeSlots[e].idx, v = edgeLookup[s[i[0]] * 6 + s[i[1]]];
      if (v >= 0) eLoc[v >> 1] = e * 2 + (v & 1);
    }
    for (var c = 0; c < 8; c++) {
      var j = cornerSlots[c].idx, w = cornerLookup[s[j[0]] * 36 + s[j[1]] * 6 + s[j[2]]];
      if (w >= 0) cLoc[(w / 3) | 0] = c * 3 + (w % 3);
    }
    return { e: eLoc, c: cLoc };
  }
  function slotIds(kind, layer) {
    var arr = kind === 'e' ? edgeSlots : cornerSlots, out = [];
    arr.forEach(function (sl, h) { if (sl.p[1] === layer) out.push(h); });
    return out;
  }
  var D_EDGES = slotIds('e', -1), M_EDGES = slotIds('e', 0), U_EDGES = slotIds('e', 1);
  var D_CORNERS = slotIds('c', -1), U_CORNERS = slotIds('c', 1);

  // ---------- Makros ----------
  var ROT = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' };
  function rotAlg(moves) { return moves.map(function (m) { return ROT[m[0]] + m.slice(1); }); }
  function makeMacro(moves, label) {
    var perm = new Uint8Array(54); for (var i = 0; i < 54; i++) perm[i] = i;
    moves.forEach(function (m) { perm = C.applyPerm(perm, C.MOVE_PERMS[m]); });
    return { moves: moves, perm: perm, cost: moves.length, label: label || 'turn' };
  }
  function rotations(alg, label) {
    var out = [], cur = C.parseAlg(alg);
    for (var r = 0; r < 4; r++) { out.push(makeMacro(cur, label)); cur = rotAlg(cur); }
    return out;
  }
  var UMOVES = ['U', "U'", 'U2'].map(function (m) { return makeMacro([m], 'turn'); });
  var ALG = {
    trigger: "R U R' U'",
    edgeR: "U R U' R' U' F' U F",
    edgeL: "U' L' U L U F U' F'",
    ollCross1: "F R U R' U' F'",
    ollCross2: "F U R U' R' F'",
    sune: "R U R' U R U2 R'",
    cornerCycle: "R' F R' B2 R F' R' B2 R2",
    edgeCycleA: "R U' R U R U R U' R' U' R2",
    edgeCycleB: "R2 U R U R' U' R' U' R' U R'"
  };

  // ---------- Suche (Dijkstra über Makros, mit Schlüssel-Zusammenfassung) ----------
  function search(start, macros, keyFn, isGoalKey, limit) {
    var nodes = [{ s: start, c: 0, p: -1, m: -1, k: keyFn(start) }];
    var best = {}; best[nodes[0].k] = 0;
    var buckets = [[0]];
    limit = limit || 90;
    for (var cost = 0; cost <= limit; cost++) {
      var b = buckets[cost]; if (!b) continue;
      for (var bi = 0; bi < b.length; bi++) {
        var nd = nodes[b[bi]];
        if (best[nd.k] < nd.c) continue;
        if (isGoalKey(nd.k)) {
          var path = [], cur = nd;
          while (cur.p >= 0) { path.push(cur.m); cur = nodes[cur.p]; }
          path.reverse();
          var moves = [], segs = []; path.forEach(function (mi) { moves = moves.concat(macros[mi].moves); segs.push({ k: macros[mi].label, moves: macros[mi].moves.slice() }); });
          return { moves: moves, segs: segs, cost: nd.c, state: nd.s };
        }
        for (var mi2 = 0; mi2 < macros.length; mi2++) {
          var mc = macros[mi2], ns = C.applyPerm(nd.s, mc.perm), nk = keyFn(ns), nc = nd.c + mc.cost;
          if (best[nk] === undefined || best[nk] > nc) {
            best[nk] = nc;
            nodes.push({ s: ns, c: nc, p: b[bi], m: mi2, k: nk });
            (buckets[nc] || (buckets[nc] = [])).push(nodes.length - 1);
          }
        }
      }
    }
    return null;
  }
  function pieceKey(eIds, cIds) {
    return function (s) {
      var l = locate(s), k = 0, i;
      for (i = 0; i < eIds.length; i++) k = k * 32 + l.e[eIds[i]];
      for (i = 0; i < cIds.length; i++) k = k * 32 + l.c[cIds[i]];
      return k;
    };
  }
  var SOLVED = C.solvedColors();
  var SOLVED_NORM = new Uint8Array(54); for (var q = 0; q < 54; q++) SOLVED_NORM[q] = st[q].face;
  function goalOf(keyFn) { var g = keyFn(SOLVED_NORM); return function (k) { return k === g; }; }

  // ---------- Normalisieren / Prüfen ----------
  function normalize(colors) {
    var map = {}, i;
    for (i = 0; i < 6; i++) map[colors[i * 9 + 4]] = i;
    var out = new Uint8Array(54);
    for (i = 0; i < 54; i++) out[i] = map[colors[i]];
    return out;
  }
  function parity(arr) {
    var seen = [], p = 0;
    for (var i = 0; i < arr.length; i++) {
      if (seen[i]) continue;
      var j = i, len = 0; while (!seen[j]) { seen[j] = true; j = arr[j]; len++; }
      p += len - 1;
    }
    return p % 2;
  }
  function validate(colors) {
    var i, counts = [0, 0, 0, 0, 0, 0];
    for (i = 0; i < 54; i++) {
      if (colors[i] === null || colors[i] === undefined || colors[i] < 0) return { ok: false, error: 'Es sind noch nicht alle Felder ausgefüllt.' };
      counts[colors[i]]++;
    }
    for (i = 0; i < 6; i++) if (counts[i] !== 9) return { ok: false, error: C.COLOR_NAMES[i] + ' kommt ' + counts[i] + '-mal vor – es müssen genau 9 Felder pro Farbe sein.' };
    var centers = {}; for (i = 0; i < 6; i++) centers[colors[i * 9 + 4]] = 1;
    if (Object.keys(centers).length !== 6) return { ok: false, error: 'Jede Seite braucht eine andere Mittelfarbe (die Mittelsteine sind immer 6 verschiedene Farben).' };
    var s = normalize(colors), eSeen = {}, cSeen = {}, eSlot = [], cSlot = [], flip = 0, twist = 0;
    for (i = 0; i < 12; i++) {
      var idx = edgeSlots[i].idx, v = edgeLookup[s[idx[0]] * 6 + s[idx[1]]];
      if (v < 0) return { ok: false, error: 'Eine Kante hat eine Farbkombination, die es nicht gibt (z. B. zwei gegenüberliegende Farben). Bitte Kanten prüfen.' };
      if (eSeen[v >> 1]) return { ok: false, error: 'Eine Kante ist doppelt eingetragen. Bitte die Kantensteine prüfen.' };
      eSeen[v >> 1] = 1; eSlot[v >> 1] = i; flip += v & 1;
    }
    for (i = 0; i < 8; i++) {
      var j = cornerSlots[i].idx, w = cornerLookup[s[j[0]] * 36 + s[j[1]] * 6 + s[j[2]]];
      if (w < 0) return { ok: false, error: 'Eine Ecke hat eine unmögliche Farbkombination (oder die Farbreihenfolge ist gespiegelt). Bitte Ecken prüfen.' };
      if (cSeen[(w / 3) | 0]) return { ok: false, error: 'Eine Ecke ist doppelt eingetragen. Bitte die Ecksteine prüfen.' };
      cSeen[(w / 3) | 0] = 1; cSlot[(w / 3) | 0] = i;
    }
    // Drehungs-Prüfungen relativ zur U/D-Farbe
    flip = 0; twist = 0;
    for (i = 0; i < 12; i++) {
      var ii = edgeSlots[i].idx, a = s[ii[0]], b = s[ii[1]];
      var pa = (a === 0 || a === 3) ? 0 : (a === 2 || a === 5) ? 1 : 2, pb = (b === 0 || b === 3) ? 0 : (b === 2 || b === 5) ? 1 : 2;
      if (pa > pb) flip++;
    }
    if (flip % 2) return { ok: false, error: 'Eine einzelne Kante ist falsch herum eingetragen (gedreht). Bitte die Farben der Kanten prüfen.' };
    for (i = 0; i < 8; i++) {
      var jj = cornerSlots[i].idx;
      for (var t = 0; t < 3; t++) { var col = s[jj[t]]; if (col === 0 || col === 3) { twist += t; break; } }
    }
    if (twist % 3) return { ok: false, error: 'Eine einzelne Ecke ist verdreht eingetragen. Bitte die Farben der Ecken prüfen.' };
    if (parity(eSlot) !== parity(cSlot)) return { ok: false, error: 'Zwei Steine scheinen vertauscht zu sein – das ist bei einem echten Würfel nicht möglich. Bitte Kanten und Ecken prüfen.' };
    return { ok: true, normalized: s };
  }

  // ---------- Lösen ----------
  function solveNormalized(s0) {
    var s = s0, phases = [];
    function add(no, segs, state) {
      var out = [];
      segs.forEach(function (sg) {
        var last = out[out.length - 1];
        if (sg.k === 'turn' && last && last.k === 'turn') last.moves = C.simplify(last.moves.concat(sg.moves));
        else out.push({ k: sg.k, moves: sg.moves.slice() });
      });
      out = out.filter(function (sg) { return sg.moves.length; });
      var flat = []; out.forEach(function (sg) { flat = flat.concat(sg.moves); });
      phases.push({ no: no, segs: out, moves: flat }); return state;
    }

    // Phase 1: Kreuz unten (alle 4 Kanten zugleich, freie Züge)
    var freeMacros = C.MOVE_NAMES.map(function (m) { return makeMacro([m], 'cross'); });
    var kf = pieceKey(D_EDGES, []);
    var r = search(s, freeMacros, kf, goalOf(kf), 12);
    if (!r) return null;
    s = add(1, [{ k: 'cross', moves: C.simplify(r.moves) }], r.state);

    // Phase 2: untere Ecken
    var cornerMacros = UMOVES.slice();
    for (var q = 0, cur = C.parseAlg(ALG.trigger); q < 4; q++, cur = rotAlg(cur)) {
      cornerMacros.push(makeMacro(cur, 'trigger')); cornerMacros.push(makeMacro(C.invertMoves(cur), 'triggerInv'));
    }
    var movesP = [], todo = D_CORNERS.slice();
    while (todo.length) {
      var l = locate(s), solved = D_CORNERS.filter(function (h) { return l.c[h] === h * 3; });
      todo = D_CORNERS.filter(function (h) { return l.c[h] !== h * 3; });
      if (!todo.length) break;
      var bestR = null;
      todo.forEach(function (h) {
        var kfn = pieceKey([], solved.concat([h])), res = search(s, cornerMacros, kfn, goalOf(kfn), 60);
        if (res && (!bestR || res.cost < bestR.cost)) bestR = res;
      });
      if (!bestR) return null;
      movesP = movesP.concat(bestR.segs); s = bestR.state;
    }
    s = add(2, movesP, s);

    // Phase 3: mittlere Kanten
    var edgeMacros = UMOVES.slice();
    for (q = 0, cur = C.parseAlg(ALG.edgeR); q < 4; q++, cur = rotAlg(cur)) edgeMacros.push(makeMacro(cur, 'edgeR'));
    for (q = 0, cur = C.parseAlg(ALG.edgeL); q < 4; q++, cur = rotAlg(cur)) edgeMacros.push(makeMacro(cur, 'edgeL'));
    movesP = [];
    for (;;) {
      var l2 = locate(s), solvedE = M_EDGES.filter(function (h) { return l2.e[h] === h * 2; });
      var todoE = M_EDGES.filter(function (h) { return l2.e[h] !== h * 2; });
      if (!todoE.length) break;
      var bestE = null;
      todoE.forEach(function (h) {
        var kfn = pieceKey(solvedE.concat([h]), []), res = search(s, edgeMacros, kfn, goalOf(kfn), 80);
        if (res && (!bestE || res.cost < bestE.cost)) bestE = res;
      });
      if (!bestE) return null;
      movesP = movesP.concat(bestE.segs); s = bestE.state;
    }
    s = add(3, movesP, s);

    // Phase 4: oberes Kreuz (Kanten oben auf die Oberseite drehen)
    var topEdgeIdx = U_EDGES.map(function (h) { return edgeSlots[h].idx[0]; }); // primärer Aufkleber = U-Fläche
    var cornTopIdx = U_CORNERS.map(function (h) { return cornerSlots[h].idx; });
    function edgeMask(x) { var m = 0; topEdgeIdx.forEach(function (i, n) { if (x[i] === 0) m |= 1 << n; }); return m; }
    function cornDigits(x) {
      var k = 0; cornTopIdx.forEach(function (ix) { var d = 0; for (var t = 0; t < 3; t++) if (x[ix[t]] === 0) d = t; k = k * 3 + d; }); return k;
    }
    var m4 = UMOVES.concat([makeMacro(C.parseAlg(ALG.ollCross1), 'ollCross'), makeMacro(C.parseAlg(ALG.ollCross2), 'ollCross')]);
    var r4 = search(s, m4, edgeMask, function (k) { return k === 15; }, 40);
    if (!r4) return null; s = add(4, r4.segs, r4.state);

    // Phase 5: obere Ecken drehen (Oberseite einfarbig)
    var k5 = function (x) { return cornDigits(x) * 16 + edgeMask(x); };
    var m5 = UMOVES.concat([makeMacro(C.parseAlg(ALG.sune), 'sune'), makeMacro(C.invertMoves(C.parseAlg(ALG.sune)), 'antisune')]);
    var r5 = search(s, m5, k5, goalOf(k5), 50);
    if (!r5) return null; s = add(5, r5.segs, r5.state);

    // Phase 6: obere Ecken an die richtige Stelle
    var k6 = pieceKey([], U_CORNERS);
    var m6 = UMOVES.concat(rotations(ALG.cornerCycle, 'cornerCycle'));
    var r6 = search(s, m6, k6, goalOf(k6), 60);
    if (!r6) return null; s = add(6, r6.segs, r6.state);

    // Phase 7: obere Kanten an die richtige Stelle (Würfel gelöst)
    var k7 = pieceKey(U_EDGES, U_CORNERS);
    var m7 = UMOVES.concat(rotations(ALG.edgeCycleA, 'edgeCycle')).concat(rotations(ALG.edgeCycleB, 'edgeCycle'));
    var r7 = search(s, m7, k7, goalOf(k7), 80);
    if (!r7) return null; s = add(7, r7.segs, r7.state);

    for (var i = 0; i < 54; i++) if (s[i] !== SOLVED_NORM[i]) return null;
    return phases;
  }

  var ADJ_N = ['Weißes', 'Gelbes', 'Rotes', 'Oranges', 'Grünes', 'Blaues'];
  var ADJ_P = ['Weiße', 'Gelbe', 'Rote', 'Orange', 'Grüne', 'Blaue'];
  var LABELS = {
    turn: ['Oberseite drehen', 'Die obere Schicht wird gedreht, damit der nächste Stein passend steht.'],
    cross: ['Kreuz-Züge', 'Eine kurze Zugfolge, die die vier Kanten der unteren Schicht an ihren Platz bringt.'],
    trigger: ['Trigger (Ecke einsetzen)', 'Der Grundbaustein „R U R\' U\'“. Er wird so oft wiederholt, bis die Ecke richtig sitzt.'],
    triggerInv: ['Trigger rückwärts', 'Der Trigger in umgekehrter Reihenfolge – ebenfalls zum Einsetzen der Ecke.'],
    edgeR: ['Kante nach rechts einsetzen', 'Setzt eine Kante aus der oberen Schicht in die mittlere Schicht ein (nach rechts).'],
    edgeL: ['Kante nach links einsetzen', 'Setzt eine Kante aus der oberen Schicht in die mittlere Schicht ein (nach links).'],
    ollCross: ['Kreuz-Algorithmus', 'Dreht die Kanten oben, bis ein Kreuz auf der Oberseite entsteht.'],
    sune: ['Sune', 'Dreht obere Ecken, ohne das Kreuz oben zu zerstören.'],
    antisune: ['Anti-Sune', 'Die Umkehrung der Sune – dreht obere Ecken in die andere Richtung.'],
    cornerCycle: ['Ecken-Dreierzyklus', 'Tauscht drei obere Ecken im Kreis, alles andere bleibt unverändert.'],
    edgeCycle: ['Kanten-Dreierzyklus', 'Tauscht drei obere Kanten im Kreis, alles andere bleibt unverändert.']
  };
  function phaseName(no, colors) {
    var d = colors[3 * 9 + 4], u = colors[4];
    return [
      '', ADJ_N[d] + ' Kreuz', ADJ_P[d] + ' Ecken', 'Mittlere Kanten', ADJ_N[u] + ' Kreuz', ADJ_P[u] + ' Ecken drehen', 'Ecken platzieren', 'Kanten platzieren'
    ][no];
  }
  function phaseDesc(no, colors) {
    var n = C.COLOR_NAMES, d = n[colors[3 * 9 + 4]], u = n[colors[4]];
    return [
      '',
      'Bringe die vier ' + d + '-Kanten unten an ihren Platz. Sie bilden ein Kreuz, und die Seitenfarben passen zu den Mittelsteinen.',
      'Setze die vier ' + d + '-Ecken unten ein. Danach ist die untere Schicht komplett ' + d + ' und die Seitenränder passen.',
      'Setze die vier Kanten der mittleren Schicht ein. Danach sind zwei Schichten fertig.',
      'Drehe die Kanten oben so, dass auf der Oberseite (' + u + ') ein Kreuz entsteht.',
      'Drehe die oberen Ecken, bis die ganze Oberseite einfarbig (' + u + ') ist.',
      'Bringe die oberen Ecken an den richtigen Platz (die Seitenfarben passen zu den Mittelsteinen).',
      'Zum Schluss werden die letzten Kanten an ihren Platz getauscht – der Würfel ist dann gelöst.'
    ][no];
  }
  function solve(colors) {
    var v = validate(colors);
    if (!v.ok) return v;
    var raw = solveNormalized(v.normalized);
    if (!raw) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.' };
    var phases = raw.map(function (p) {
      return { no: p.no, name: phaseName(p.no, colors), desc: phaseDesc(p.no, colors), moves: p.moves, segs: p.segs };
    });
    var total = 0; phases.forEach(function (p) { total += p.moves.length; });
    return { ok: true, phases: phases, total: total };
  }

  var api = { LABELS: LABELS, validate: validate, solve: solve, ALG: ALG, makeMacro: makeMacro, locate: locate, edgeSlots: edgeSlots, cornerSlots: cornerSlots, SOLVED_NORM: SOLVED_NORM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SolverLib = api;
})(typeof window !== 'undefined' ? window : this);
