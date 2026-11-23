/* Zauber - Berechnung im Hintergrund (Web Worker), damit die Oberfläche beim Rechnen bedienbar bleibt */
importScripts('cube.js', 'solver.js', 'twophase.js', 'solver4.js');
self.onmessage = function (e) {
  var d = e.data, r;
  if (d.warm) {
    try { TwoPhase.build(); if (d.warm === 4) Solver4Lib.warm(); } catch (x) {}
    return;
  }
  try { r = d.n === 4 ? Solver4Lib.solve4(d.colors, d.level) : SolverLib.solve(d.colors, d.level); }
  catch (x) { r = { ok: false, error: 'Unerwarteter Fehler bei der Berechnung.' }; }
  self.postMessage({ id: d.id, r: r });
};
