(function () {
  'use strict';
  var C = CubeLib, S = SolverLib, $ = function (id) { return document.getElementById(id); };
  var FACE_DE = { U: 'Oben', D: 'Unten', L: 'Links', R: 'Rechts', F: 'Vorne', B: 'Hinten' };
  var FACE_IDX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

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
  $('btnToSolver').onclick = function () { showTab('solve'); };

  // ---------- Funktion 1: freier 3D-Würfel ----------
  var history = [], moves = 0, busyAuto = false;
  cubeView = new CubeView($('cube3d'), {
    onTurn: function (t) { history.push(t); moves++; updStatus(); }
  });
  function updStatus(txt) { $('cubeStatus').textContent = txt || ('Züge: ' + moves + (C.isSolved(cubeView.state) && moves ? ' · Gelöst! 🎉' : '')); }
  $('chkViewMode').onchange = function () { cubeView.viewMode = this.checked; };
  $('btnReset').onclick = function () {
    cubeView.clearQueue(); cubeView.anim = null; cubeView.setState(C.solvedColors());
    history = []; moves = 0; busyAuto = false; updStatus();
  };
  $('btnUndo').onclick = function () {
    if (cubeView.isBusy() || !history.length) return;
    var t = history.pop(); moves = Math.max(0, moves - 1);
    cubeView.enqueue({ k: t.k, c: t.c, steps: -t.steps }, 200, updStatus);
  };
  $('btnScramble').onclick = function () {
    if (cubeView.isBusy()) return;
    history = []; moves = 0; var last = -1, n = 0;
    while (n < 22) {
      var m = C.MOVE_NAMES[Math.floor(Math.random() * 18)];
      if (FACE_IDX[m[0]] === last) continue;
      last = FACE_IDX[m[0]]; n++; cubeView.enqueueName(m, 90);
    }
    updStatus('Mischen …');
    cubeView.queue[cubeView.queue.length - 1].cb = function () { updStatus(); };
  };
  $('btnAutoSolve').onclick = function () {
    if (cubeView.isBusy()) return;
    if (C.isSolved(cubeView.state)) { updStatus('Der Würfel ist schon gelöst.'); return; }
    updStatus('Berechne Lösung …');
    setTimeout(function () {
      var r = S.solve(cubeView.state);
      if (!r.ok) { updStatus(r.error); return; }
      history = []; moves = 0;
      var all = []; r.phases.forEach(function (p) { all = all.concat(p.moves); });
      all.forEach(function (m) { cubeView.enqueueName(m, 140); });
      updStatus('Lösung mit ' + all.length + ' Zügen …');
      cubeView.queue[cubeView.queue.length - 1].cb = function () { updStatus('Gelöst! 🎉'); };
    }, 30);
  };

  // ---------- Funktion 2: Muster eingeben ----------
  var inp = Int8Array.from(C.solvedColors()), brush = 0;
  var COLORHEX = PALETTE;
  var NET = [{ f: 0, x: 1, y: 0, t: 'Oben' }, { f: 4, x: 0, y: 1, t: 'Links' }, { f: 2, x: 1, y: 1, t: 'Vorne' },
             { f: 1, x: 2, y: 1, t: 'Rechts' }, { f: 5, x: 3, y: 1, t: 'Hinten' }, { f: 3, x: 1, y: 2, t: 'Unten' }];
  var cells = [];
  (function buildInput() {
    var pal = $('palette');
    for (var c = 0; c < 6; c++) (function (c) {
      var b = document.createElement('button'); b.className = 'sw'; b.style.background = COLORHEX[c];
      b.setAttribute('aria-label', C.COLOR_NAMES[c]); b.innerHTML = '<i></i>';
      b.onclick = function () { brush = c; refreshInput(); };
      pal.appendChild(b);
    })(c);
    var net = $('net');
    for (var y = 0; y < 3; y++) for (var x = 0; x < 4; x++) {
      var def = NET.filter(function (n) { return n.x === x && n.y === y; })[0], d = document.createElement('div');
      if (!def) { d.className = 'face empty'; d.innerHTML = '<div class="cap">.</div><div class="grid3" style="aspect-ratio:1"></div>'; net.appendChild(d); continue; }
      d.className = 'face'; d.innerHTML = '<div class="cap">' + def.t + '</div>';
      var g = document.createElement('div'); g.className = 'grid3';
      for (var i = 0; i < 9; i++) (function (idx) {
        var cell = document.createElement('button'); cell.className = 'cell' + (idx % 9 === 4 ? ' c' : '');
        cell.onclick = function () { inp[idx] = brush; $('errBox').hidden = true; refreshInput(); };
        g.appendChild(cell); cells[idx] = cell;
      })(def.f * 9 + i);
      d.appendChild(g); net.appendChild(d);
    }
  })();
  function refreshInput() {
    var cnt = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 54; i++) {
      cells[i].style.background = inp[i] >= 0 ? COLORHEX[inp[i]] : '#9a9ca3';
      if (inp[i] >= 0) cnt[inp[i]]++;
    }
    var sw = $('palette').children;
    for (var c = 0; c < 6; c++) {
      sw[c].classList.toggle('sel', c === brush);
      var b = sw[c].firstChild; b.textContent = cnt[c] + '/9'; b.className = cnt[c] === 9 ? 'ok' : (cnt[c] > 9 ? 'bad' : '');
    }
    if (previewView) previewView.setState(inp);
  }
  previewView = new CubeView($('preview3d'), { layerDrag: false });
  refreshInput();
  $('btnStd').onclick = function () { inp = Int8Array.from(C.solvedColors()); $('errBox').hidden = true; refreshInput(); };
  $('btnClear').onclick = function () { inp.fill(-1); for (var f = 0; f < 6; f++) inp[f * 9 + 4] = C.SCHEME[f]; $('errBox').hidden = true; refreshInput(); };
  $('btnFromCube').onclick = function () { inp = Int8Array.from(cubeView.state); $('errBox').hidden = true; refreshInput(); };

  // ---------- Lösung abspielen ----------
  solveView = new CubeView($('solve3d'), { layerDrag: false });
  var plan = null, states = [], flat = [], idx = 0, auto = false;
  $('btnCompute').onclick = function () {
    var err = $('errBox'); err.hidden = true;
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
    plan = r; flat = []; states = [Uint8Array.from(inp)];
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
    var f = FACE_DE[m[0]], t = m.length === 1 ? 'im Uhrzeigersinn' : (m[1] === '2' ? 'halbe Umdrehung (2×)' : 'gegen den Uhrzeigersinn');
    return f + ' · ' + t;
  }
  function renderStep() {
    var n = flat.length, st = flat[idx];
    for (var i = 0; i < n; i++) {
      var c = $('chip' + i); c.className = 'chip' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
    }
    var cur = $('chip' + Math.min(idx, n - 1)); if (cur && cur.scrollIntoView) { var ch = $('chips'); ch.scrollLeft = cur.offsetLeft - ch.clientWidth / 2; }
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
    var m = flat[idx].m; idx++;
    solveView.highlight = -1;
    solveView.enqueueName(m, dur(), function () { renderStep(); if (cb) cb(); });
  }
  function back() {
    if (solveView.isBusy() || idx <= 0) return;
    idx--; solveView.enqueueName(C.invertMove(flat[idx].m), dur(), renderStep);
  }
  function jump(i) {
    solveView.clearQueue(); solveView.anim = null; auto = false; $('bAuto').textContent = '▶ Auto';
    idx = i; solveView.setState(states[i]); renderStep();
  }
  $('bNext').onclick = function () { auto = false; next(); };
  $('bBack').onclick = function () { auto = false; back(); };
  $('bStart').onclick = function () { jump(0); };
  $('bAuto').onclick = function () {
    if (auto) { auto = false; this.textContent = '▶ Auto'; return; }
    if (idx >= flat.length) jump(0);
    auto = true; this.textContent = '⏸ Pause';
    (function step() { if (!auto) return; next(function () { setTimeout(step, 150); }); })();
  };
  $('chkFollow').onchange = renderStep;
  $('btnBackInput').onclick = function () {
    auto = false; solveView.clearQueue(); solveView.anim = null;
    $('solvePane').hidden = true; $('inputPane').hidden = false; setTimeout(function () { previewView.resize(); }, 30);
  };

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
