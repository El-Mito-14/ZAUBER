/* Zauber – Lektionen (Struktur angelehnt an F2L / OLL / PLL) */
(function (root) {
  'use strict';
  var C = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js') : root.CubeLib;
  var S = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./solver.js') : root.SolverLib;
  function rep(a, n) { var o = []; for (var i = 0; i < n; i++) o.push(a); return o.join(' '); }
  var TRIG = "R U R' U'";
  function L(name, alg, desc) { return { name: name, alg: alg, desc: desc || '' }; }

  var SECTIONS = [
    { id: 'basic', name: 'Anfänger', kind: 'iso', groups: [
      { name: 'Erste Schicht', items: [
        L('Trigger', TRIG, 'Der wichtigste Baustein der Anfängermethode. Er holt Ecken heraus oder setzt sie ein. Sechsmal ausgeführt ergibt er wieder den Ausgangszustand.'),
        L('Ecke einsetzen – Weiß zeigt nach rechts', rep(TRIG, 1), 'Die Ecke steht oben rechts vorne, ihr weißer Aufkleber zeigt nach rechts: Trigger einmal.'),
        L('Ecke einsetzen – Weiß zeigt nach oben', rep(TRIG, 3), 'Die Ecke steht oben rechts vorne, ihr weißer Aufkleber zeigt nach oben: Trigger dreimal.'),
        L('Ecke einsetzen – Weiß zeigt nach vorne', rep(TRIG, 5), 'Die Ecke steht oben rechts vorne, ihr weißer Aufkleber zeigt nach vorne: Trigger fünfmal.')
      ] },
      { name: 'Zweite Schicht', items: [
        L('Kante nach rechts einsetzen', "U R U' R' U' F' U F", 'Die Kante oben vorne gehört in den Platz vorne rechts der mittleren Schicht.'),
        L('Kante nach links einsetzen', "U' L' U L U F U' F'", 'Die Kante oben vorne gehört in den Platz vorne links der mittleren Schicht.')
      ] },
      { name: 'Letzte Schicht: Kreuz', items: [
        L('Kreuz-Algorithmus A', "F R U R' U' F'", 'Dreht die Kanten oben, bis ein Kreuz entsteht.'),
        L('Kreuz-Algorithmus B', "F U R U' R' F'", 'Alternative zu A mit ähnlichem Ergebnis.')
      ] }
    ] },
    { id: 'f2l', name: 'F2L', kind: 'iso', groups: [
      { name: 'Grundfälle', items: [
        L('F2L 1.1', "R U R'"), L('F2L 1.2', "F' U' F"), L('F2L 1.3', "U R U' R'"), L('F2L 1.4', "U' F' U F")
      ] },
      { name: 'Ecke und Kante oben', items: [
        L('F2L 2.1', "(U' R U') (R' U R) U R'"), L('F2L 2.2', "(U F' U) (F U' F') U' F"), L('F2L 2.3', "(U' R U) (R' U R) U R'"),
        L('F2L 2.4', "(U F' U') (F U' F') U' F"), L('F2L 2.5', "d (R' U2 R) d' (R U R')"), L('F2L 2.6', "U' (R U2 R') d (R' U' R)"),
        L('F2L 2.7', "(R U' R' U) d (R' U' R)"), L('F2L 2.8', "(F' U F U') d' (F U F')"), L('F2L 2.9', "(U F' U2 F) (U F' U2 F)"),
        L('F2L 2.10', "(U' R U2 R') (U' R U2 R')"), L('F2L 2.11', "(U F' U' F) (U F' U2 F)"), L('F2L 2.12', "(U' R U R') (U' R U2 R')")
      ] },
      { name: 'Ecke zeigt nach oben, Kante oben', items: [
        L('F2L 3.1', "(R U2 R' U') (R U R')"), L('F2L 3.2', "(F' U2 F U) (F' U' F)"), L('F2L 3.3', "(U R U2 R') (U R U' R')"),
        L('F2L 3.4', "(U' F' U2 F) (U' F' U F)"), L('F2L 3.5', "U2 (R U R' U) (R U' R')"), L('F2L 3.6', "U2 (F' U' F U') (F' U F)"),
        L('F2L 3.7', "(R U R' U') U' (R U R' U') (R U R')"), L('F2L 3.8', "y' (R' U' R U) U (R' U' R U) (R' U' R)")
      ] },
      { name: 'Ecke oben, Kante in der Mitte', items: [
        L('F2L 4.1', "(U F' U F) (U F' U2 F)"), L('F2L 4.2', "(U' R U' R') (U' R U2 R')"), L('F2L 4.3', "(U F' U' F) (d' F U F')"),
        L('F2L 4.4', "(U' R U R') (d R' U' R)"), L('F2L 4.5', "(R U' R') (d R' U R)"), L('F2L 4.6', "(R U R' U') (R U R' U') (R U R')")
      ] },
      { name: 'Ecke unten, Kante oben', items: [
        L('F2L 5.1', "(U R U' R') (U' F' U F)"), L('F2L 5.2', "(U' F' U F) (U R U' R')"), L('F2L 5.3', "(F' U F) (U' F' U F)"),
        L('F2L 5.4', "(R U' R') (U R U' R')"), L('F2L 5.5', "(R U R') (U' R U R')"), L('F2L 5.6', "(F' U' F) (U F' U' F)")
      ] },
      { name: 'Ecke unten, Kante in der Mitte', items: [
        L('F2L 6.1', "(R U' R' U) R U2 R' (U R U' R')"), L('F2L 6.2', "(R U' R' U') (R U R' U') (R U2 R')"),
        L('F2L 6.3', "(R U R' U') (R U' R') U d (R' U' R)"), L('F2L 6.4', "(R U' R') d (R' U' R U') (R' U' R)"),
        L('F2L 6.5', "(R U' R' d R' U2 R) (U R' U2 R)")
      ] }
    ] },
    { id: 'oll', name: 'OLL', kind: 'oll', groups: [
      { name: 'Kreuze', items: [
        L('OLL 27', "(R' U2 R) U (R' U R)"), L('OLL 26', "(R U2 R') U' (R U' R')"), L('OLL 25', "F' (r U R' U') (r' F R)"),
        L('OLL 24', "(r U R' U') (r' F R F')"), L('OLL 22', "R U2 (R2 U' R2 U') (R2 U2 R)"), L('OLL 21', "(R U R') U (R U' R') U (R U2 R')"),
        L('OLL 23', "R2 D (R' U2 R) D' (R' U2 R')")
      ] },
      { name: 'Punkte', items: [
        L('OLL 1', "(R U2 R') (R' F R F') U2 (R' F R F')"), L('OLL 2', "F (R U R' U') F' f (R U R' U') f'"),
        L('OLL 4', "f (R U R' U') f' U F (R U R' U') F'"), L('OLL 3', "f (R U R' U') f' U' F (R U R' U') F'"),
        L('OLL 19', "M U (R U R' U') M' (R' F R F')"), L('OLL 18', "F (R U R' U) y' R' U2 (R' F R F')"),
        L('OLL 17', "(R U R' U) (R' F R F') U2 (R' F R F')"), L('OLL 20', "M U (R U R' U') M2 (U R U' r')")
      ] },
      { name: 'Alle Ecken', items: [ L('OLL 57', "(R U R' U') M' (U R U' r')"), L('OLL 28', "M' U' M U2 M' U' M") ] },
      { name: 'Linien', items: [
        L('OLL 55', "R U2 R2 (U' R U' R') U2 (F R F')"), L('OLL 52', "(R U R' U) R d' R U' R' F'"),
        L('OLL 51', "f (R U R' U') (R U R' U') f'"), L('OLL 56', "F (R U R' U') R F' (r U R' U') r'")
      ] },
      { name: 'T-Formen', items: [ L('OLL 45', "F (R U R' U') F'"), L('OLL 33', "(R U R' U') (R' F R F')") ] },
      { name: 'Z-Formen', items: [ L('OLL 40', "R' F (R U R' U') F' U R"), L('OLL 39', "L F' (L' U' L U) F U' L'") ] },
      { name: 'Große L', items: [
        L('OLL 14', "(R' F R) U (R' F' R) y' (R U' R')"), L('OLL 13', "F (U R U' R2) F' (R U R U' R')"),
        L('OLL 16', "r U r' (R U R' U') r U' r'"), L('OLL 15', "l' U' l (L' U' L U) l' U l")
      ] },
      { name: 'C-Formen', items: [ L('OLL 46', "R' U' (R' F R F') U R"), L('OLL 34', "(R U R' U') x D' R' U R U' D x'") ] },
      { name: 'W-Formen', items: [ L('OLL 38', "(R U R' U) (R U' R' U') (R' F R F')"), L('OLL 36', "(L' U' L U') (L' U L U) (L F' L' F)") ] },
      { name: 'P-Formen', items: [
        L('OLL 44', "f (R U R' U') f'"), L('OLL 43', "f' (L' U' L U) f"), L('OLL 31', "R' U' F U R U' R' F' R"), L('OLL 32', "F U R U' F' r U R' U' r'")
      ] },
      { name: 'Quadrate', items: [
        L('OLL 35', "(R U2 R') (R' F R F') (R U2 R')"), L('OLL 37', "F R' F' R U R U' R'"), L('OLL 5', "r' U2 (R U R' U) r"), L('OLL 6', "r U2 R' U' R U' r'")
      ] },
      { name: 'Kleine L', items: [
        L('OLL 48', "F (R U R' U') (R U R' U') F'"), L('OLL 47', "F' (L' U' L U) (L' U' L U) F"), L('OLL 50', "R' F R2 B' R2 F' R2 B R'"),
        L('OLL 49', "(R' F R' F') R2 U2 y (R' F R F')"), L('OLL 53', "(l' U' L U') (L' U L U') L' U2 l"), L('OLL 54', "(r U R' U) (R U' R' U) R U2 r'")
      ] },
      { name: 'Weitere Formen', items: [
        L('OLL 11', "F' (L' U' L U) F y F (R U R' U') F'"), L('OLL 12', "F (R U R' U') F' U F (R U R' U') F'"), L('OLL 7', "(r U R' U) R U2 r'"),
        L('OLL 8', "r' U' R U' R' U2 r"), L('OLL 10', "(R U R' U) (R' F R F') R U2 R'"), L('OLL 9', "(R U R' U') R' F R2 U R' U' F'"),
        L('OLL 29', "(R U R' U') R U' R' F' U' (F R U R')"), L('OLL 42', "(R' F R F') (R' F R F') (R U R' U') (R U R')"),
        L('OLL 41', "(R U R' U) R U2 R' F (R U R' U') F'"), L('OLL 30', "(L F' L' F) L' U2 L d (R U R')")
      ] }
    ] },
    { id: 'pll', name: 'PLL', kind: 'pll', groups: [
      { name: 'Nur Kanten', items: [
        L('H-Perm', "(M2 U M2) U2 (M2 U M2)"), L('Z-Perm', "R' U' R2 U (R U R' U') R U R U' R U' R' U2"),
        L('Ua-Perm', "R2 U' (R' U' R) U R U (R U' R)"), L('Ub-Perm', "(R' U R' U') R' U' (R' U R) U R2")
      ] },
      { name: 'Nur Ecken', items: [
        L('Aa-Perm', "x z' R2 U2 (R' D' R) U2 (R' D R') z x'"), L('Ab-Perm', "x R2 D2 (R U R') D2 (R U' R) x'"),
        L('E-Perm', "R2 U R' U' y (R U R' U') (R U R' U') (R U R') y' (R U' R2)")
      ] },
      { name: 'Ecken und Kanten', items: [
        L('T-Perm', "(R U R' U') R' F R2 U' R' U' R U R' F'"), L('Y-Perm', "(F R U' R') U' (R U R' F') (R U R' U') (R' F R F')"),
        L('F-Perm', "U' (R' U R U') R2 (F' U' F U) x (R U R' U') R2 x'"), L('V-Perm', "(R' U R' U') y (R' D R' D') R2 y' (R' B' R B R)"),
        L('Ja-Perm', "L' U' L F (L' U' L U) L F' L2 U L U"), L('Jb-Perm', "R U R' F' (R U R' U') R' F R2 U' R' U'"),
        L('Ra-Perm', "(L U2 L') U2 L F' (L' U' L U) L F L2 U"), L('Rb-Perm', "(R' U2 R) U2 R' F (R U R' U') R' F' R2 U'"),
        L('Na-Perm', "(R U R' U) (R U R' F') (R U R' U') R' F R2 U' R' U2 (R U' R')"),
        L('Nb-Perm', "(R' U R U') R' (F' U' F) (R U R' F) R' F' (R U' R)"),
        L('Ga-Perm', "y R2 u (R' U R' U') (R u' R2) y' (R' U R)"), L('Gb-Perm', "(R' U' R) y R2 u (R' U R U') (R u' R2)"),
        L('Gc-Perm', "y R2 u' R U' (R U R' u) R2 y (R U' R')"), L('Gd-Perm', "y2 (R U R') y' (R2 u' R) U' (R' U R') u R2")
      ] }
    ] }
  ];

  // ---------- Analyse ----------
  var identity = new Uint8Array(54); for (var q = 0; q < 54; q++) identity[q] = q;
  function comp(a, b) { var o = new Uint8Array(54); for (var i = 0; i < 54; i++) o[i] = a[b[i]]; return o; } // erst a, dann b
  function inverse(p) { var o = new Uint8Array(54); for (var i = 0; i < 54; i++) o[p[i]] = i; return o; }
  var rotations = (function () {
    var seen = {}, list = [], queue = [identity];
    seen[identity.join()] = 1; list.push(identity);
    var gens = ['x', 'y', 'z'].map(C.permOfMove);
    while (queue.length) {
      var cur = queue.shift();
      gens.forEach(function (g) { var n = comp(cur, g), k = n.join(); if (!seen[k]) { seen[k] = 1; list.push(n); queue.push(n); } });
    }
    return list;
  })();
  function centerSig(p) { var s = []; for (var f = 0; f < 6; f++) s.push(Math.floor(p[4 + 9 * f] / 9)); return s.join(); }
  var faceOfColor = []; C.SCHEME.forEach(function (c, f) { faceOfColor[c] = f; });
  var st = C.stickers;
  function topLayer(i) { return st[i].p[1] === 1; }
  function inSlot(i) { // Ecke DFR und Kante FR (F2L-Platz vorne rechts)
    var p = st[i].p; return (p[0] === 1 && p[1] === -1 && p[2] === 1) || (p[0] === 1 && p[1] === 0 && p[2] === 1);
  }
  function analyze(it) {
    if (it._a) return it._a;
    var moves = C.parseAlg(it.alg), total = identity;
    moves.forEach(function (m) { total = comp(total, C.permOfMove(m)); });
    var sig = centerSig(total), rot = identity;
    for (var r = 0; r < rotations.length; r++) if (centerSig(rotations[r]) === sig) { rot = rotations[r]; break; }
    var rinv = inverse(rot), nonrot = new Uint8Array(54);
    for (var e = 0; e < 54; e++) nonrot[e] = total[rinv[e]];
    var ninv = inverse(nonrot), solved = C.solvedColors(), full = new Uint8Array(54), gray = new Uint8Array(54), moved = [];
    for (var j = 0; j < 54; j++) { full[j] = solved[ninv[j]]; if (nonrot[j] !== j) moved.push(j); }
    for (j = 0; j < 54; j++) gray[j] = nonrot[j] !== j ? full[j] : 6;
    // Ergebnis des Algorithmus auf dem gelösten Würfel (ohne Drehung) – für Prüfung/Zusammenfassung
    var after = C.applyPerm(solved, nonrot), norm = new Uint8Array(54);
    for (j = 0; j < 54; j++) norm[j] = faceOfColor[after[j]];
    var lo = S.locate(norm), edgeSlots = S.edgeSlots, cornerSlots = S.cornerSlots;
    var info = { eMap: {}, cMap: {}, flipE: 0, twistC: 0 };
    for (var h = 0; h < 12; h++) { var sl = lo.e[h] >> 1, o = lo.e[h] & 1; if (sl !== h) info.eMap[h] = sl; else if (o) info.flipE++; }
    for (h = 0; h < 8; h++) { var sc = (lo.c[h] / 3) | 0, oc = lo.c[h] % 3; if (sc !== h) info.cMap[h] = sc; else if (oc) info.twistC++; }
    // Pfeile: Stein steht im Ausgangsfall bei "to", geht an seinen Platz "from"=home. (after: Stein h liegt bei Platz sl)
    var arrows = [];
    Object.keys(info.eMap).forEach(function (hh) { arrows.push({ from: edgeSlots[hh].p, to: edgeSlots[info.eMap[hh]].p, kind: 'e' }); });
    Object.keys(info.cMap).forEach(function (hh) { arrows.push({ from: cornerSlots[hh].p, to: cornerSlots[info.cMap[hh]].p, kind: 'c' }); });
    var uColor = solved[0], yBefore = 0; for (j = 0; j < 9; j++) if (full[j] === uColor) yBefore++;
    var inU = moved.every(topLayer), inF2L = moved.every(function (i) { return topLayer(i) || inSlot(i); });
    var uKept = true; for (j = 0; j < 9; j++) if (after[j] !== uColor) uKept = false;
    it._a = { after: C.applyPerm(gray, nonrot), moves: moves, start: gray, full: full, moved: moved, rot: rot !== identity, info: info, arrows: arrows, yBefore: yBefore, inU: inU, inF2L: inF2L, uKept: uKept, nonrot: nonrot };
    return it._a;
  }
  function cycles(map) {
    var seen = {}, out = [];
    Object.keys(map).forEach(function (k) {
      if (seen[k]) return; var n = 0, cur = +k;
      while (!seen[cur]) { seen[cur] = 1; cur = map[cur]; n++; if (cur === undefined) break; }
      if (n > 1) out.push(n);
    });
    return out;
  }
  function summary(sec, it) {
    var a = analyze(it), i = a.info, parts = [];
    if (sec.id === 'oll') {
      parts.push('Macht die Oberseite komplett gelb (vorher ' + a.yBefore + ' von 9 Feldern gelb).');
      return parts.join(' ');
    }
    var ce = cycles(i.eMap), cc = cycles(i.cMap);
    function txt(cy, w) {
      if (!cy.length) return null;
      var c3 = cy.filter(function (n) { return n === 3; }).length, c2 = cy.filter(function (n) { return n === 2; }).length;
      var r = [];
      if (c3) r.push(c3 === 1 ? '3 ' + w + ' wandern im Kreis' : c3 + ' Dreierzyklen von ' + w);
      if (c2) r.push(c2 === 1 ? '2 ' + w + ' tauschen die Plätze' : c2 + ' Paare von ' + w + ' tauschen');
      cy.filter(function (n) { return n > 3; }).forEach(function (n) { r.push(n + ' ' + w + ' wandern im Kreis'); });
      return r.join(', ');
    }
    var te = txt(ce, 'Kanten'), tc = txt(cc, 'Ecken');
    if (sec.id === 'pll') {
      if (te) parts.push(te.charAt(0).toUpperCase() + te.slice(1) + '.');
      if (tc) parts.push((te ? '' : '') + tc.charAt(0).toUpperCase() + tc.slice(1) + '.');
      parts.push('Die Oberseite bleibt gelb.');
      return parts.join(' ');
    }
    if (sec.id === 'f2l') return 'Bringt Eckstein und Kantenstein zusammen in den Platz vorne rechts, ohne die fertigen Teile zu zerstören.';
    return it.desc || '';
  }
  function validFor(sec, it) {
    var a = analyze(it);
    if (sec.id === 'oll') return a.inU && a.moved.length > 0;
    if (sec.id === 'pll') return a.inU && a.uKept && a.moved.length > 0;
    if (sec.id === 'f2l') return a.inF2L && a.moved.length > 0;
    return a.moved.length > 0;
  }
  var api = { SECTIONS: SECTIONS, analyze: analyze, summary: summary, validFor: validFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LessonLib = api;
})(typeof window !== 'undefined' ? window : this);
