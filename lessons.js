/* Zauber – Lektionen: gängige Algorithmen */
(function (root) {
  'use strict';
  var C = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js') : root.CubeLib;
  function rep(a, n) { var o = []; for (var i = 0; i < n; i++) o.push(a); return o.join(' '); }
  var TRIG = "R U R' U'";
  var LESSONS = [
    { cat: 'Grundbausteine & erste Schicht', items: [
      { id: 'trigger', name: 'Trigger', alg: TRIG, desc: 'Der wichtigste Baustein der Anfängermethode („Sexy Move“). Er holt eine Ecke aus der unteren Schicht heraus bzw. setzt sie ein und kehrt nach 6 Wiederholungen zum Ausgangszustand zurück.' },
      { id: 'corner1', name: 'Ecke einsetzen – Weiß zeigt nach rechts', alg: rep(TRIG, 1), desc: 'Die weiße Ecke steht oben rechts vorne und ihr weißer Aufkleber zeigt nach rechts: Trigger einmal ausführen.' },
      { id: 'corner3', name: 'Ecke einsetzen – Weiß zeigt nach oben', alg: rep(TRIG, 3), desc: 'Die weiße Ecke steht oben rechts vorne und der weiße Aufkleber zeigt nach oben: Trigger dreimal hintereinander.' },
      { id: 'corner5', name: 'Ecke einsetzen – Weiß zeigt nach vorne', alg: rep(TRIG, 5), desc: 'Die weiße Ecke steht oben rechts vorne und der weiße Aufkleber zeigt nach vorne: Trigger fünfmal hintereinander.' }
    ] },
    { cat: 'Zweite Schicht (mittlere Kanten)', items: [
      { id: 'edgeR', name: 'Kante nach rechts einsetzen', alg: "U R U' R' U' F' U F", desc: 'Die Kante oben vorne gehört in den Platz vorne rechts in der mittleren Schicht.' },
      { id: 'edgeL', name: 'Kante nach links einsetzen', alg: "U' L' U L U F U' F'", desc: 'Die Kante oben vorne gehört in den Platz vorne links in der mittleren Schicht.' }
    ] },
    { cat: 'Letzte Schicht: Kreuz', top: true, items: [
      { id: 'cross1', name: 'Kreuz-Algorithmus A', alg: "F R U R' U' F'", desc: 'Bringt die Kanten oben in die richtige Orientierung (Kreuz). Bei einer Linie waagerecht halten, bei einem „L“ in die linke obere Ecke.' },
      { id: 'cross2', name: 'Kreuz-Algorithmus B', alg: "F U R U' R' F'", desc: 'Alternative zum Kreuz-Algorithmus A mit ähnlichem Ergebnis.' }
    ] },
    { cat: 'Letzte Schicht: Ecken drehen (Oberseite einfarbig)', top: true, items: [
      { id: 'sune', name: 'Sune', alg: "R U R' U R U2 R'", desc: 'Der bekannteste Algorithmus für die Oberseite. Er dreht Ecken, ohne das Kreuz zu zerstören.' },
      { id: 'antisune', name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", desc: 'Die Umkehrung der Sune – für den gespiegelten Fall.' },
      { id: 'ollH', name: 'Doppel-Fall „H“', alg: "F R U R' U' R U R' U' R U R' U' F'", desc: 'Alle vier Ecken sind falsch gedreht, zwei davon zeigen mit dem Aufkleber zur Seite.' },
      { id: 'ollPi', name: 'Doppel-Fall „Pi“', alg: "R U2 R2 U' R2 U' R2 U2 R", desc: 'Alle vier Ecken sind falsch gedreht, in einem „Pi“-Muster.' },
      { id: 'ollU', name: 'Doppel-Fall „Scheinwerfer“', alg: "R2 D R' U2 R D' R' U2 R'", desc: 'Zwei Ecken gegenüber sind falsch gedreht – Scheinwerfer-Muster.' }
    ] },
    { cat: 'Letzte Schicht: Ecken platzieren', top: true, items: [
      { id: 'aa', name: 'Ecken-Dreierzyklus (A-Perm)', alg: "R' F R' B2 R F' R' B2 R2", desc: 'Tauscht drei obere Ecken im Kreis, alle Kanten und die vierte Ecke bleiben.' },
      { id: 'ab', name: 'Ecken-Dreierzyklus rückwärts', alg: "R2 B2 R F R' B2 R F' R", desc: 'Die Umkehrung des A-Perm – tauscht drei Ecken in die andere Richtung.' }
    ] },
    { cat: 'Letzte Schicht: Kanten platzieren', top: true, items: [
      { id: 'ua', name: 'Kanten-Dreierzyklus (U-Perm a)', alg: "R U' R U R U R U' R' U' R2", desc: 'Tauscht drei obere Kanten im Kreis, alles andere bleibt unverändert.' },
      { id: 'ub', name: 'Kanten-Dreierzyklus (U-Perm b)', alg: "R2 U R U R' U' R' U' R' U R'", desc: 'Die Gegenrichtung des U-Perm a.' },
      { id: 'hperm', name: 'H-Perm', alg: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2", desc: 'Tauscht zwei gegenüberliegende Kantenpaare gleichzeitig.' }
    ] },
    { cat: 'Fortgeschritten: Zwei Steine tauschen', top: true, items: [
      { id: 'tperm', name: 'T-Perm', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", desc: 'Tauscht zwei obere Ecken und zwei Kanten (rechts).' },
      { id: 'yperm', name: 'Y-Perm', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", desc: 'Tauscht zwei diagonale Ecken und zwei Kanten.' },
      { id: 'jbperm', name: 'J-Perm', alg: "R U R' F' R U R' U' R' F R2 U' R' U'", desc: 'Tauscht zwei Ecken und zwei Kanten nebeneinander.' }
    ] }
  ];
  // Beispielzustand: gelöster Würfel, rückwärts durch den Algorithmus – nur bewegte Steine farbig, Rest grau (6)
  function build(alg) {
    var moves = C.parseAlg(alg), solved = C.solvedColors();
    var start = C.applyMoves(solved, C.invertMoves(moves));
    var perm = new Uint8Array(54); for (var i = 0; i < 54; i++) perm[i] = i;
    moves.forEach(function (m) { perm = C.applyPerm(perm, C.MOVE_PERMS[m]); });
    var out = new Uint8Array(54);
    for (i = 0; i < 54; i++) out[i] = perm[i] !== i ? start[i] : 6;
    // Mittelsteine bleiben grau, die Seite wird sonst unübersichtlich
    return { moves: moves, state: out };
  }
  var api = { LESSONS: LESSONS, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LessonLib = api;
})(typeof window !== 'undefined' ? window : this);
