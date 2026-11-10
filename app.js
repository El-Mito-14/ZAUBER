(function () {
  'use strict';
  var C = CubeLib, S = SolverLib, $ = function (id) { return document.getElementById(id); };
  var FACE_DE = { U: 'Oben', D: 'Unten', L: 'Links', R: 'Rechts', F: 'Vorne', B: 'Hinten' };
  var FACE_IDX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
  var SPEEDS = [['sehr langsam', 1200], ['langsam', 700], ['normal', 350], ['schnell', 150], ['sehr schnell', 70]];
  ['selSpeedCube', 'selSpeed'].forEach(function (id) {
    SPEEDS.forEach(function (s) {
      var o = document.createElement('option'); o.value = s[1]; o.textContent = 'Tempo: ' + s[0]; if (s[1] === 350) o.selected = true; $(id).appendChild(o);
    });
  });

  // ---------- Info-Fenster ----------
  var INFO = {
    cube: '<p><b>Schicht drehen:</b> Auf einen Stein des Würfels tippen und in die gewünschte Richtung wischen. Die Schicht dreht sich mit.</p>' +
      '<p><b>Ansicht drehen:</b> Neben den Würfel wischen. Alternativ „👁 Ansicht drehen“ einschalten – dann dreht jede Wischgeste nur die Ansicht.</p>' +
      '<p><b>Mischen / Zurück / Neu:</b> Mischen verdreht den Würfel zufällig, Zurück macht den letzten Zug rückgängig, Neu setzt den Würfel zurück.</p>' +
      '<p><b>Lösen:</b> Der Würfel löst sich selbst. Du kannst jederzeit pausieren oder stoppen und das Tempo ändern.</p>',
    input: '<p><b>So geht’s:</b> Tippe ein Feld auf dem Würfel an. Oben erscheint die Farbauswahl – tippe die passende Farbe an, dann wird das Feld eingefärbt. Auch bereits eingefärbte Felder kannst du erneut antippen und korrigieren.</p>' +
      '<p><b>Ansicht drehen:</b> Wische auf dem Würfel oder daneben, um ihn zu drehen und auch Unterseite und Rückseite zu erreichen.</p>' +
      '<p><b>Mittelsteine</b> sind fest und nicht veränderbar. Halte deinen Würfel so: <b>Weiß oben, Grün vorne</b> (dann ist Rot rechts, Blau hinten, Orange links, Gelb unten). Hat dein Würfel ein anderes Farbschema, wähle die Haltung so, dass die Mittelsteine zu den Farben im Modell passen.</p>' +
      '<p>Jede Farbe kommt genau 9-mal vor (Zähler an der Farbauswahl).</p>' +
      '<p><b>Leeren</b> löscht alle Felder außer den Mittelsteinen. <b>Vom 3D-Würfel</b> übernimmt den Zustand aus dem Reiter „Würfel“.</p>',
    solve: '<p><b>U</b> = Oben, <b>D</b> = Unten, <b>L</b> = Links, <b>R</b> = Rechts, <b>F</b> = Vorne, <b>B</b> = Hinten.</p>' +
      '<p>Ohne Zusatz: diese Seite eine Viertelumdrehung im Uhrzeigersinn drehen (mit Blick direkt auf die Seite). <b>\'</b> = gegen den Uhrzeigersinn. <b>2</b> = halbe Umdrehung.</p>' +
      '<p>Den Würfel während der Lösung nicht umdrehen – genau so halten wie bei der Eingabe. Die rot umrandete Seite im 3D-Würfel und im Netz ist die Seite, die du drehen musst.</p>'
  };
  document.querySelectorAll('.info').forEach(function (b) {
    b.onclick = function () { $('modalText').innerHTML = INFO[b.dataset.info]; $('modal').hidden = false; };
  });
  $('modalClose').onclick = function () { $('modal').hidden = true; };
  $('modal').onclick = function (e) { if (e.target === $('modal')) $('modal').hidden = true; };

  // ---------- Tabs ----------
  var cubeView, previewView, solveView;
  function showTab(name) {
    ['cube', 'solve'].forEach(function (n) {
      $('screen-' + n).classList.toggle('active', n === name);
      $('tab-' + n).classList.toggle('active', n === name);
    });
    setTimeout(function () { [cubeView, previewView, solveView].forEach(function (v) { v && v.resize(); }); }, 30);
  }
  $('tab-cube').onclick = function () { showTab('cube'); };
  $('tab-solve').onclick = function () { showTab('solve'); };

  // ---------- Funktion 1: freier 3D-Würfel ----------
  var history = [], moves = 0;
  var autoRun = false, autoPaused = false, autoMoves = [], autoIdx = 0;
  cubeView = new CubeView($('cube3d'), {
    onTurn: function (t) { history.push(t); moves++; updStatus(); }
  });
  function updStatus(txt) { $('cubeStatus').textContent = txt || ('Züge: ' + moves + (C.isSolved(cubeView.state) && moves ? ' · Gelöst! 🎉' : '')); }
  $('btnViewMode').onclick = function () {
    cubeView.viewMode = !cubeView.viewMode; this.classList.toggle('on', cubeView.viewMode);
  };
  function busy() { return cubeView.isBusy() || autoRun; }
  $('btnReset').onclick = function () {
    stopAuto(); cubeView.clearQueue(); cubeView.anim = null; cubeView.setState(C.solvedColors());
    history = []; moves = 0; updStatus();
  };
  $('btnUndo').onclick = function () {
    if (busy() || !history.length) return;
    var t = history.pop(); moves = Math.max(0, moves - 1);
    cubeView.enqueue({ k: t.k, c: t.c, steps: -t.steps }, 200, function () { updStatus(); });
  };
  $('btnScramble').onclick = function () {
    if (busy()) return;
    history = []; moves = 0; var last = -1, n = 0;
    while (n < 22) {
      var m = C.MOVE_NAMES[Math.floor(Math.random() * 18)];
      if (FACE_IDX[m[0]] === last) continue;
      last = FACE_IDX[m[0]]; n++; cubeView.enqueueName(m, 90);
    }
    updStatus('Mischen …');
    cubeView.queue[cubeView.queue.length - 1].cb = function () { updStatus(); };
  };
  // Automatische Lösung (pausierbar, Tempo einstellbar)
  function speedCube() { return parseInt($('selSpeedCube').value, 10); }
  function autoStep() {
    if (!autoRun || autoPaused) return;
    if (autoIdx >= autoMoves.length) { stopAuto(); history = []; moves = 0; updStatus('Gelöst! 🎉'); return; }
    var m = autoMoves[autoIdx];
    updStatus('Lösen: Zug ' + (autoIdx + 1) + ' von ' + autoMoves.length + ' (' + m + ')');
    cubeView.enqueueName(m, speedCube(), function () { autoIdx++; setTimeout(autoStep, 80); });
  }
  function stopAuto() {
    autoRun = false; autoPaused = false; $('autoBar').hidden = true; cubeView.layerDrag = true;
    $('aPause').textContent = '⏸ Pause';
  }
  $('btnAutoSolve').onclick = function () {
    if (busy()) return;
    if (C.isSolved(cubeView.state)) { updStatus('Der Würfel ist schon gelöst.'); return; }
    updStatus('Berechne Lösung …');
    setTimeout(function () {
      var r = S.solve(cubeView.state);
      if (!r.ok) { updStatus(r.error); return; }
      autoMoves = []; r.phases.forEach(function (p) { autoMoves = autoMoves.concat(p.moves); });
      autoIdx = 0; autoRun = true; autoPaused = false; cubeView.layerDrag = false;
      $('autoBar').hidden = false; $('aPause').textContent = '⏸ Pause';
      autoStep();
    }, 30);
  };
  $('aPause').onclick = function () {
    if (!autoRun) return;
    autoPaused = !autoPaused;
    this.textContent = autoPaused ? '▶ Weiter' : '⏸ Pause';
    if (autoPaused) updStatus('Pausiert (Zug ' + autoIdx + ' von ' + autoMoves.length + ')');
    else autoStep();
  };
  $('aStop').onclick = function () {
    stopAuto(); cubeView.clearQueue(); history = []; moves = 0; updStatus('Gestoppt');
  };

  // ---------- Funktion 2: Muster direkt am 3D-Würfel eingeben ----------
  var inp = new Int8Array(54), sel = -1, toastT = null;
  function clearInput() { inp.fill(-1); for (var f = 0; f < 6; f++) inp[f * 9 + 4] = C.SCHEME[f]; sel = -1; }
  clearInput();
  var pal = $('palette');
  for (var c = 0; c < 6; c++) (function (c) {
    var b = document.createElement('button'); b.className = 'sw'; b.style.background = PALETTE[c];
    b.setAttribute('aria-label', C.COLOR_NAMES[c]); b.innerHTML = '<i></i>';
    b.onclick = function () { if (sel >= 0) { inp[sel] = c; closePalette(); $('errBox').hidden = true; refreshInput(); } };
    pal.appendChild(b);
  })(c);
  var xb = document.createElement('button'); xb.className = 'x'; xb.textContent = '✕'; xb.setAttribute('aria-label', 'Schließen');
  xb.onclick = function () { closePalette(); }; pal.appendChild(xb);
  function closePalette() { sel = -1; previewView.selected = -1; pal.hidden = true; }
  function toast(t) { $('inToast').textContent = t; clearTimeout(toastT); toastT = setTimeout(function () { $('inToast').textContent = ''; }, 2000); }
  previewView = new CubeView($('preview3d'), {
    layerDrag: false,
    onTap: function (i) {
      if (i % 9 === 4) { toast('Mittelsteine sind fest.'); return; }
      sel = i; previewView.selected = i; pal.hidden = false; refreshInput();
    }
  });
  function refreshInput() {
    var cnt = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 54; i++) if (inp[i] >= 0) cnt[inp[i]]++;
    for (var c = 0; c < 6; c++) { var b = pal.children[c].firstChild; b.textContent = cnt[c] + '/9'; b.className = cnt[c] === 9 ? 'ok' : (cnt[c] > 9 ? 'bad' : ''); }
    previewView.setState(inp);
  }
  refreshInput();
  $('btnClear').onclick = function () { clearInput(); closePalette(); $('errBox').hidden = true; refreshInput(); };
  $('btnFromCube').onclick = function () { inp = Int8Array.from(cubeView.state); closePalette(); $('errBox').hidden = true; refreshInput(); toast('Zustand aus dem Reiter „Würfel“ übernommen.'); };

  // ---------- Lösung abspielen ----------
  solveView = new CubeView($('solve3d'), { layerDrag: false });
  var flat = [], states = [], idx = 0, auto = false;
  $('btnCompute').onclick = function () {
    var err = $('errBox'); err.hidden = true; closePalette();
    $('btnCompute').textContent = 'Berechne …'; $('btnCompute').disabled = true;
    setTimeout(function () {
      var r;
      try { r = S.solve(Array.prototype.slice.call(inp)); } catch (e) { r = { ok: false, error: 'Unerwarteter Fehler bei der Berechnung.' }; }
      $('btnCompute').textContent = 'Lösung berechnen'; $('btnCompute').disabled = false;
      if (!r.ok) { err.textContent = r.error; err.hidden = false; return; }
      startPlan(r);
    }, 40);
  };
  function startPlan(r) {
    flat = []; states = [Uint8Array.from(inp)];
    r.phases.forEach(function (p) { p.moves.forEach(function (m, i) { flat.push({ m: m, p: p, first: i === 0 }); }); });
    flat.forEach(function (st, i) { states.push(C.applyMove(states[i], st.m)); });
    idx = 0; auto = false; $('bAuto').textContent = '▶ Auto';
    $('inputPane').hidden = true; $('solvePane').hidden = false;
    var ch = $('chips'); ch.innerHTML = '';
    flat.forEach(function (st, i) {
      if (st.first) { var l = document.createElement('div'); l.className = 'chip ph'; l.textContent = 'Phase ' + st.p.no; ch.appendChild(l); }
      var c = document.createElement('div'); c.className = 'chip'; c.textContent = st.m; c.id = 'chip' + i;
      c.onclick = function () { jump(i); }; ch.appendChild(c);
    });
    setTimeout(function () { solveView.resize(); solveView.setState(states[0]); renderStep(); }, 30);
  }
  function describe(m) {
    var t = m.length === 1 ? 'im Uhrzeigersinn' : (m[1] === '2' ? 'halbe Umdrehung (2×)' : 'gegen den Uhrzeigersinn');
    return FACE_DE[m[0]] + ' · ' + t;
  }
  function renderStep() {
    var n = flat.length, st = flat[idx];
    for (var i = 0; i < n; i++) $('chip' + i).className = 'chip' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
    var cur = $('chip' + Math.min(idx, n - 1)); if (cur) { var chs = $('chips'); chs.scrollLeft = cur.offsetLeft - chs.clientWidth / 2; }
    if (st) {
      $('moveBig').textContent = st.m; $('moveDesc').textContent = describe(st.m);
      $('phaseTitle').textContent = 'Phase ' + st.p.no + ' von 7 · ' + st.p.name; $('phaseDesc').textContent = st.p.desc;
      solveView.highlight = FACE_IDX[st.m[0]];
      if ($('chkFollow').checked) solveView.setViewFor(FACE_IDX[st.m[0]]);
    } else {
      $('moveBig').textContent = '🎉'; $('moveDesc').textContent = 'Der Würfel ist gelöst!';
      $('phaseTitle').textContent = 'Fertig'; $('phaseDesc').textContent = 'Alle ' + n + ' Züge ausgeführt.';
      solveView.highlight = -1;
    }
    $('stepInfo').textContent = 'Zug ' + Math.min(idx + (st ? 1 : 0), n) + ' von ' + n;
    drawNet($('netMini'), solveView.state, st ? FACE_IDX[st.m[0]] : -1);
  }
  function dur() { return parseInt($('selSpeed').value, 10); }
  function next(cb) {
    if (solveView.isBusy() || idx >= flat.length) { auto = false; $('bAuto').textContent = '▶ Auto'; return; }
    var m = flat[idx].m; idx++; solveView.highlight = -1;
    solveView.enqueueName(m, dur(), function () { renderStep(); if (cb) cb(); });
  }
  function back() {
    if (solveView.isBusy() || idx <= 0) return;
    idx--; solveView.highlight = -1; solveView.enqueueName(C.invertMove(flat[idx].m), dur(), renderStep);
  }
  function jump(i) {
    solveView.clearQueue(); solveView.anim = null; auto = false; $('bAuto').textContent = '▶ Auto';
    idx = i; solveView.setState(states[i]); renderStep();
  }
  $('bNext').onclick = function () { auto = false; $('bAuto').textContent = '▶ Auto'; next(); };
  $('bBack').onclick = function () { auto = false; $('bAuto').textContent = '▶ Auto'; back(); };
  $('bStart').onclick = function () { jump(0); };
  $('bAuto').onclick = function () {
    if (auto) { auto = false; this.textContent = '▶ Auto'; return; }
    if (idx >= flat.length) jump(0);
    auto = true; this.textContent = '⏸ Pause';
    (function step() { if (!auto) return; next(function () { setTimeout(step, 120); }); })();
  };
  $('chkFollow').onchange = renderStep;
  $('btnBackInput').onclick = function () {
    auto = false; solveView.clearQueue(); solveView.anim = null;
    $('solvePane').hidden = true; $('inputPane').hidden = false; setTimeout(function () { previewView.resize(); }, 30);
  };

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
