/* Zauber – Lektionen (Struktur angelehnt an F2L / OLL / PLL) */
(function (root) {
  'use strict';
  var C = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js') : root.CubeLib;
  var S = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./solver.js') : root.SolverLib;
  var C4 = (typeof require !== 'undefined' && typeof module !== 'undefined') ? C.make(4) : root.Cube4;
  function rep(a, n) { var o = []; for (var i = 0; i < n; i++) o.push(a); return o.join(' '); }
  var TRIG = "R U R' U'";
  function L(name, alg, desc) { return { name: name, alg: alg, desc: desc || '' }; }

  var FD = { U: 'Oben', D: 'Unten', L: 'Links', R: 'Rechts', F: 'Vorne', B: 'Hinten' };
  var T_CW = 'Außenseite {0}: eine Viertelumdrehung im Uhrzeigersinn (mit Blick direkt auf diese Seite).';
  var T_CCW = "Außenseite {0}: eine Viertelumdrehung gegen den Uhrzeigersinn. Der Apostroph bedeutet gegen den Uhrzeigersinn.";
  var T_HALF = 'Außenseite {0}: eine halbe Umdrehung. Die 2 bedeutet zweimal, die Richtung ist egal.';
  var T_WIDE = '{0} und die Schicht dahinter gemeinsam im Uhrzeigersinn drehen (zwei Schichten).';
  var T_INNER = 'Nur die zweite Schicht von {0} drehen (nicht die Außenseite).';
  function N(tok, tpl, arg) { return { name: tok, alg: tok, tpl: [tpl].concat(arg ? [FD[arg]] : []) }; }
  function faces(map, tpl) { return 'UDLRFB'.split('').map(function (f) { return N(map(f), tpl, f); }); }
  var NOT3 = { id: 'not3', name: 'Notation', kind: 'iso', lib: 3, groups: [
    { name: 'Außenseiten', items: faces(function (f) { return f; }, T_CW) },
    { name: 'Richtungen', items: [N("R", T_CW, 'R'), N("R'", T_CCW, 'R'), N('R2', T_HALF, 'R')] },
    { name: 'Zwei Schichten', items: faces(function (f) { return f.toLowerCase(); }, T_WIDE) },
    { name: 'Mittelschichten', items: [
      { name: 'M', alg: 'M', tpl: ['Die mittlere Schicht zwischen Links und Rechts, in Richtung von L.'] },
      { name: 'E', alg: 'E', tpl: ['Die mittlere Schicht zwischen Oben und Unten, in Richtung von D.'] },
      { name: 'S', alg: 'S', tpl: ['Die mittlere Schicht zwischen Vorne und Hinten, in Richtung von F.'] }] },
    { name: 'Würfeldrehung', items: [
      { name: 'x', alg: 'x', tpl: ['Den ganzen Würfel drehen wie die Seite {0} (nur die Blickrichtung ändert sich, die Teile bleiben zusammen).', FD.R] },
      { name: 'y', alg: 'y', tpl: ['Den ganzen Würfel drehen wie die Seite {0} (nur die Blickrichtung ändert sich, die Teile bleiben zusammen).', FD.U] },
      { name: 'z', alg: 'z', tpl: ['Den ganzen Würfel drehen wie die Seite {0} (nur die Blickrichtung ändert sich, die Teile bleiben zusammen).', FD.F] }] }
  ] };
  var NOT4 = { id: 'not4', name: 'Notation', kind: 'iso', lib: 4, groups: [
    { name: 'Außenseiten', items: faces(function (f) { return f; }, T_CW) },
    { name: 'Richtungen', items: [N("R", T_CW, 'R'), N("R'", T_CCW, 'R'), N('R2', T_HALF, 'R')] },
    { name: 'Zwei Außenschichten', items: faces(function (f) { return f + f.toLowerCase(); }, T_WIDE) },
    { name: 'Innere Schicht', items: faces(function (f) { return f.toLowerCase(); }, T_INNER) },
    { name: 'Würfeldrehung', items: NOT3.groups[4].items }
  ] };
  var SECTIONS = [NOT3, NOT4,
    { id: 'x4', name: '4x4', kind: 'iso', lib: 4, groups: [
      { name: 'Zentren', items: [
        L('Zentren-Dreiertausch A', "u L u' l u L' u' l'", 'Tauscht drei Zentrumssteine im Kreis, alles andere bleibt. Mit kurzen Vorbereitungszügen holst du damit jeden Zentrumsstein an seinen Platz.'),
        L('Zentren-Dreiertausch B', "r F r' f r F' r' f'", 'Gleiches Prinzip mit anderen Seiten: Eine Innenschicht wird bewegt, eine Außenseite gedreht, dann wird alles zurückgedreht.'),
        L('Zentren-Dreiertausch C', "u' L u r2 u' L' u r2", 'Dreht eine Innenschicht weg und holt sie von der anderen Seite zurück, so wandern drei Zentrumssteine.'),
        L('Zentren-Dreiertausch D', "l B l' f l B' l' f'", 'Dieselbe Idee an der linken und rechten Innenschicht.')
      ] },
      { name: 'Kanten paaren', items: [
        L('Kantenpaare A', "u L u' R u L' u' R'", 'Bewegt zwei Dreiergruppen von Kantenteilen gleichzeitig. Damit setzt du ein passendes Kantenteil neben sein Gegenstück.'),
        L('Kantenpaare B', "l B l' F l B' l' F'", 'Gleiches Prinzip an den Seiten links, hinten und vorne.'),
        L('Kantenpaare C', "r' U' r D r' U r D'", 'Gleiches Prinzip mit rechter Innenschicht.'),
        L('Kantenpaare D', "f D f' U' f D' f' U", 'Gleiches Prinzip mit vorderer Innenschicht.')
      ] },
      { name: 'Parität', items: [
        L('OLL-Parität', "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2", 'Behebt den Fall, dass bei der letzten Ebene eine einzelne Kante falsch herum steht (beim 3x3 unmöglich). Die Kante wird umgedreht, alles andere bleibt.'),
        L('PLL-Parität', "r2 U2 r2 Uu2 r2 u2", 'Behebt den Fall, dass zwei Kanten vertauscht werden müssen (beim 3x3 unmöglich). Vertauscht zwei Kantenpaare, alles andere bleibt.')
      ] }
    ] },
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
  function mkId(n) { var a = new Uint8Array(n); for (var i = 0; i < n; i++) a[i] = i; return a; }
  function comp(a, b) { var o = new Uint8Array(a.length); for (var i = 0; i < a.length; i++) o[i] = a[b[i]]; return o; } // erst a, dann b
  function inverse(p) { var o = new Uint8Array(p.length); for (var i = 0; i < p.length; i++) o[p[i]] = i; return o; }
  var identity = mkId(54);
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
  function inSlot(i) { var p = st[i].p; return (p[0] === 1 && p[1] === -1 && p[2] === 1) || (p[0] === 1 && p[1] === 0 && p[2] === 1); }
  function analyzeNot(it) {
    var Lb = it._n === 4 ? C4 : C, l = Lb.moveToLayer(it.alg), solved = Lb.solvedColors(), gray = new Uint8Array(Lb.SZ), moved = [];
    for (var j = 0; j < Lb.SZ; j++) { var inL = l.cs.indexOf(Lb.stickers[j].p[l.k]) >= 0; gray[j] = inL ? solved[j] : 6; if (inL) moved.push(j); }
    it._a = { lib: Lb, moves: [it.alg], start: gray, full: solved, after: Lb.applyMove(gray, it.alg), moved: moved, rot: false, arrows: [], yBefore: 0, inU: false, inF2L: false, uKept: true };
    return it._a;
  }
  function analyzePattern(it, lib, moves, finalState) {
    var Lb = lib, mv = moves || Lb.parseAlg(it.alg), solved = Lb.solvedColors();
    it._a = { lib: Lb, moves: mv, start: solved, full: solved, after: finalState || Lb.applyMoves(solved, mv), moved: [1], rot: false, arrows: [], yBefore: 0, inU: false, inF2L: false, uKept: true };
    return it._a;
  }
  function analyze4(it) {
    var Lb = C4, moves = Lb.parseAlg(it.alg), total = mkId(Lb.SZ);
    moves.forEach(function (m) { total = comp(total, Lb.permOfMove(m)); });
    var ninv = inverse(total), solved = Lb.solvedColors(), full = new Uint8Array(Lb.SZ), gray = new Uint8Array(Lb.SZ), moved = [], rel = {};
    for (var j = 0; j < Lb.SZ; j++) { full[j] = solved[ninv[j]]; if (total[j] !== j) { moved.push(j); rel[Lb.stickers[j].p.join()] = 1; } }
    for (j = 0; j < Lb.SZ; j++) gray[j] = rel[Lb.stickers[j].p.join()] ? full[j] : 6;
    it._a = { lib: Lb, moves: moves, start: gray, full: full, after: Lb.applyPerm(gray, total), moved: moved, rot: false, arrows: [], yBefore: 0, inU: false, inF2L: false, uKept: true, nonrot: total };
    return it._a;
  }
  function analyze(it) {
    if (it._a) return it._a;
    if (it._kind === 'not') return analyzeNot(it);
    if (it._n === 4) return analyze4(it);
    var moves = C.parseAlg(it.alg), total = identity;
    moves.forEach(function (m) { total = comp(total, C.permOfMove(m)); });
    var sig = centerSig(total), rot = identity;
    for (var r = 0; r < rotations.length; r++) if (centerSig(rotations[r]) === sig) { rot = rotations[r]; break; }
    var rinv = inverse(rot), nonrot = new Uint8Array(54);
    for (var e = 0; e < 54; e++) nonrot[e] = total[rinv[e]];
    var ninv = inverse(nonrot), solved = C.solvedColors(), full = new Uint8Array(54), gray = new Uint8Array(54), moved = [], relPos = {};
    for (var j = 0; j < 54; j++) { full[j] = solved[ninv[j]]; if (nonrot[j] !== j) { moved.push(j); relPos[st[j].p.join()] = 1; } }
    // Beteiligte Ebene: alle Steine der oberen Schicht sowie jeder bewegte Stein werden farbig gezeigt, alles andere grau
    for (j = 0; j < 54; j++) if (topLayer(j)) relPos[st[j].p.join()] = 1;
    for (j = 0; j < 54; j++) gray[j] = relPos[st[j].p.join()] ? full[j] : 6;
    var after = C.applyPerm(solved, nonrot), norm = new Uint8Array(54);
    for (j = 0; j < 54; j++) norm[j] = faceOfColor[after[j]];
    var lo = S.locate(norm), edgeSlots = S.edgeSlots, cornerSlots = S.cornerSlots;
    var info = { eMap: {}, cMap: {}, flipE: 0, twistC: 0 };
    for (var h = 0; h < 12; h++) { var sl = lo.e[h] >> 1, o = lo.e[h] & 1; if (sl !== h) info.eMap[h] = sl; else if (o) info.flipE++; }
    for (h = 0; h < 8; h++) { var sc = (lo.c[h] / 3) | 0, oc = lo.c[h] % 3; if (sc !== h) info.cMap[h] = sc; else if (oc) info.twistC++; }
    var arrows = [];
    Object.keys(info.eMap).forEach(function (hh) { arrows.push({ from: edgeSlots[hh].p, to: edgeSlots[info.eMap[hh]].p, kind: 'e' }); });
    Object.keys(info.cMap).forEach(function (hh) { arrows.push({ from: cornerSlots[hh].p, to: cornerSlots[info.cMap[hh]].p, kind: 'c' }); });
    var uColor = solved[0], yBefore = 0; for (j = 0; j < 9; j++) if (full[j] === uColor) yBefore++;
    var inU = moved.every(topLayer), inF2L = moved.every(function (i) { return topLayer(i) || inSlot(i); });
    var uKept = true; for (j = 0; j < 9; j++) if (after[j] !== uColor) uKept = false;
    it._a = { lib: C, after: C.applyPerm(gray, nonrot), moves: moves, start: gray, full: full, moved: moved, rot: rot !== identity, info: info, arrows: arrows, yBefore: yBefore, inU: inU, inF2L: inF2L, uKept: uKept, nonrot: nonrot };
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
  function summary(sec, it, tr) {
    tr = tr || function (t, a) { return (a || []).reduce(function (x, v, i) { return x.replace('{' + i + '}', v); }, t); };
    var a = analyze(it), i = a.info, parts = [];
    if (sec.id === 'x4') return tr(it.desc);
    if (sec.id === 'not3' || sec.id === 'not4') return tr(it.tpl[0], it.tpl.slice(1).map(function (x) { return tr(x); }));
    if (sec.id === 'pat') return tr(it.desc || '');
    if (sec.id === 'oll') return tr('Macht die Oberseite komplett gelb (vorher {0} von 9 Feldern gelb).', [a.yBefore]);
    var ce = cycles(i.eMap), cc = cycles(i.cMap);
    function txt(cy, kind) {
      var out = [], c3 = cy.filter(function (n) { return n === 3; }).length, c2 = cy.filter(function (n) { return n === 2; }).length;
      if (c3) out.push(c3 === 1 ? tr(kind === 'e' ? '3 Kanten wandern im Kreis' : '3 Ecken wandern im Kreis') : tr(kind === 'e' ? '{0} Dreierzyklen von Kanten' : '{0} Dreierzyklen von Ecken', [c3]));
      if (c2) out.push(c2 === 1 ? tr(kind === 'e' ? '2 Kanten tauschen die Plätze' : '2 Ecken tauschen die Plätze') : tr(kind === 'e' ? '{0} Paare von Kanten tauschen' : '{0} Paare von Ecken tauschen', [c2]));
      cy.filter(function (n) { return n > 3; }).forEach(function (n) { out.push(tr(kind === 'e' ? '{0} Kanten wandern im Kreis' : '{0} Ecken wandern im Kreis', [n])); });
      return out.length ? out.join(', ') : null;
    }
    var te = txt(ce, 'e'), tc = txt(cc, 'c');
    if (sec.id === 'pll') {
      if (te) parts.push(te.charAt(0).toUpperCase() + te.slice(1) + '.');
      if (tc) parts.push(tc.charAt(0).toUpperCase() + tc.slice(1) + '.');
      parts.push(tr('Die Oberseite bleibt gelb.'));
      return parts.join(' ');
    }
    if (sec.id === 'f2l') return tr('Bringt Eckstein und Kantenstein zusammen in den Platz vorne rechts, ohne die fertigen Teile zu zerstören.');
    return tr(it.desc || '');
  }
  function validFor(sec, it) {
    var a = analyze(it);
    if (sec.id === 'x4' || sec.id === 'not3' || sec.id === 'not4') return a.moved.length > 0;
    if (sec.id === 'oll') return a.inU && a.moved.length > 0;
    if (sec.id === 'pll') return a.inU && a.uKept && a.moved.length > 0;
    if (sec.id === 'f2l') return a.inF2L && a.moved.length > 0;
    return a.moved.length > 0;
  }
  SECTIONS.forEach(function (sec) { sec.lib = sec.lib === 4 ? C4 : C; sec.groups.forEach(function (g) { g.items.forEach(function (it) { it._n = sec.lib.N; it._kind = sec.id.indexOf('not') === 0 ? 'not' : ''; }); }); });
  var PAT3 = [
    L('Schachbrett', 'R2 L2 U2 D2 F2 B2', 'Auf jeder Seite wechseln sich zwei Farben wie auf einem Schachbrett ab.'),
    L('Superflip', "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2", 'Alle Teile sind am richtigen Platz, aber jede Kante ist umgedreht. Das schwerste Muster: Es braucht mindestens 20 Züge.'),
    L('Vier Punkte', "F2 B2 U D' R2 L2 U D'", 'Vier Seiten haben einen farbigen Punkt in der Mitte, die Gegenfarbe füllt den Rest. Oben und unten bleiben einfarbig.'),
    L('Würfel im Würfel', "F L F U' R U F2 L2 U' L' B D' B' L2 U", 'Es sieht aus, als steckte ein kleinerer Würfel im Würfel.'),
    L('Würfel im Würfel im Würfel', "U' L' U' F' R2 B' R F U B2 U B' L U' F U R F'", 'Noch eine Stufe weiter: ein Würfel im Würfel im Würfel.'),
    L('Streifen', "F U F R L2 B D' R D2 L D' B R2 L F U F", 'Auf den Seiten laufen senkrechte Streifen in drei Farben.'),
    L('Tetris', "L R F B U' D' L' R'", 'Die Seiten zeigen Formen wie Tetris-Steine.'),
    L('Python', "F2 R' B' U R' L F' L F' B D' R B L2", 'Ein Muster aus Streifen und Blöcken, das an eine Schlange erinnert.'),
    L('Twister', "F R' U L F' L' F U' R U L' U' L F'", 'Ein bekanntes verdrehtes Muster mit hoher Symmetrie.'),
    L('Anaconda', "L U B' U' R L' B R' F B' D R D' F'", 'Ein bekanntes Muster mit schlangenartigen Farbbändern.')
  ];
  var PAT4 = [
    L('Schachbrett', 'R2 L2 U2 D2 F2 B2', 'Auf jeder Seite wechseln sich zwei Farben wie auf einem Schachbrett ab.')
  ];
  var api = { SECTIONS: SECTIONS, analyze: analyze, analyzePattern: analyzePattern, PAT3: PAT3, PAT4: PAT4, summary: summary, validFor: validFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LessonLib = api;
})(typeof window !== 'undefined' ? window : this);
