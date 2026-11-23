(function () {
  'use strict';
  var C3 = CubeLib, C4 = Cube4, S = SolverLib, S4 = Solver4Lib, LL = LessonLib, $ = function (id) { return document.getElementById(id); };
  var T = I18n.t;
  var FACE_DE = { U: 'Oben', D: 'Unten', L: 'Links', R: 'Rechts', F: 'Vorne', B: 'Hinten' };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  var hlOn = store.get('zauber.hl') !== '0';
  function hlSpec(lib, m) { if (!hlOn) return null; var l = lib.moveToLayer(m); return l.cs.length === lib.N ? null : { k: l.k, cs: l.cs }; }
  function netFace(lib, m) { if (!hlOn) return -1; var ch = m[0], i = 'UDLRFB'.indexOf(ch); if (i >= 0) return lib.FACE_NAMES.indexOf(ch); if (lib.N === 3 && 'udlrfb'.indexOf(ch) >= 0) return lib.FACE_NAMES.indexOf(ch.toUpperCase()); return -1; }

  // ---------- Würfelgröße ----------
  var cubeN = store.get('zauber.n') === '4' ? 4 : 3;
  var G = cubeN === 4 ? C4 : C3;

  // ---------- Symbole ----------
  var IC = {
    start: '<svg viewBox="0 0 24 24"><path d="M6 5v14"/><path d="M17 6l-7 6 7 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path class="f" d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path class="f" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.4z"/></svg>'
  };
  var SPD_IC = {
    vslow: '<svg viewBox="0 0 32 32"><g transform="translate(32 0) scale(-1 1)"><circle cx="19" cy="14" r="8"/><circle cx="19" cy="14" r="3.4"/><path d="M3 26h22.5c1.8 0 2.8-1.2 2.8-2.6"/><path d="M5 26c-2-4-1-8 2-10"/><path d="M7 16l-1.6-4M9.4 16.6l1-4"/></g></svg>',
    slow: '<svg viewBox="0 0 32 32"><path d="M5 22a11 9.5 0 0 1 22 0z"/><circle cx="28.6" cy="19.4" r="2.3"/><path d="M10 22v3.6M22 22v3.6"/></svg>',
    normal: '<svg viewBox="0 0 32 32"><circle cx="16" cy="5.6" r="2.6"/><path d="M16 9v10"/><path d="M16 11.5l-6 5M16 11.5l6 4"/><path d="M16 19l-5.5 9M16 19l5.5 9"/></svg>',
    fast: '<svg viewBox="0 0 32 32"><path d="M5 21.5c0-4.8 4-8.2 9.5-8.2 3.4 0 6.2 1 8 2.6"/><path d="M5 21.5c0 1.8 1.8 3.2 4.2 3.2h9.6c2.2 0 3.6-1.2 3.6-2.8"/><path d="M22.8 15.9c.6-1.6 2.2-2.4 3.7-2.1 1.2.2 2 1.2 2.1 2.4.1 1.4-.6 2.2-1.8 2.9-1.5.8-3.4.7-4.2-.4"/><path d="M24.8 13.6c-1.4-2.4-1.3-5.6.2-7 1.5 1.4 1.8 4.4 1.3 7.1M27.2 14c.8-2.3 2.2-4.2 3.5-4.1.5 1.8-.3 3.8-1.9 5.3"/><circle cx="4.4" cy="19.4" r="1.6"/><path d="M9.5 24.7l-3 2.6h4.2M19 24.5l3.4 2.8h-4"/></svg>',
    vfast: '<svg viewBox="0 0 32 32"><path d="M16 3c5 5 5 12 4 18h-8c-1-6-1-13 4-18z"/><circle cx="16" cy="12" r="2.2"/><path d="M12 18l-4 5 4-1M20 18l4 5-4-1"/><path d="M14 24c0 3 2 5 2 5s2-2 2-5"/></svg>'
  };
  var SPEEDS = [{ id: 'vslow', ms: 4200, label: 'sehr langsam' }, { id: 'slow', ms: 1000, label: 'langsam' }, { id: 'normal', ms: 350, label: 'normal' }, { id: 'fast', ms: 150, label: 'schnell' }, { id: 'vfast', ms: 70, label: 'sehr schnell' }];
  var speedIdx = parseInt(store.get('zauber.speed'), 10); if (!(speedIdx >= 0 && speedIdx < 5)) speedIdx = 2;
  function dur() { return SPEEDS[speedIdx].ms; }
  function gap() { return Math.max(60, Math.round(dur() * 0.25)); }
  function renderSpeedBtns() {
    ['spdCube', 'spdSolve', 'spdLesson'].forEach(function (id) { $(id).innerHTML = SPD_IC[SPEEDS[speedIdx].id] + '<span>' + T(SPEEDS[speedIdx].label) + '</span>'; });
  }
  function setIcon(id, k) { $(id).innerHTML = IC[k]; }
  function setAutoIcon(id, playing) { setIcon(id, playing ? 'pause' : 'play'); }
  setIcon('bStart', 'start'); setIcon('bBack', 'back'); setIcon('bNext', 'next'); setAutoIcon('bAuto', false);
  setIcon('lStart', 'start'); setIcon('lBackStep', 'back'); setIcon('lNext', 'next'); setAutoIcon('lAuto', false);


  // ---------- Berechnungstiefe ----------
  function gearPoly(cx, cy, n, rIn, rOut) {
    var pts = [], st2 = Math.PI * 2 / n, i2;
    for (i2 = 0; i2 < n; i2++) {
      var a0 = i2 * st2 - st2 * 0.5, w = st2 * 0.2, o = st2 * 0.12;
      [[a0 + st2 * 0.5 - w - o, rIn], [a0 + st2 * 0.5 - w, rOut], [a0 + st2 * 0.5 + w, rOut], [a0 + st2 * 0.5 + w + o, rIn]].forEach(function (q) { pts.push((cx + Math.cos(q[0]) * q[1]).toFixed(2) + ' ' + (cy + Math.sin(q[0]) * q[1]).toFixed(2)); });
    }
    return 'M' + pts.join('L') + 'Z';
  }
  var BRAIN = '<svg viewBox="0 0 32 32"><path d="M6.5 17.5C4 15 4.6 10.6 8 8.8 9 5.8 13 4.6 15.6 6.2 18 3.9 22.6 4.6 24.2 7.6 27.6 8 29 11.8 27.6 14.6 29 17.2 27.4 20.4 24.4 20.6 23.2 22.4 20.6 22.4 19.4 21.4 17.4 23.4 14 22.8 12.8 21 10 21.6 7.6 20.2 6.5 17.5Z"/><path d="M11 12.6C12.6 11 15 11.4 15.6 13.4M15.8 8.4C16 10 17.2 11 18.8 11M20 14.4C21.6 12.6 24.2 13 24.6 15.4M10.4 17C12 16.6 13.6 17.2 14.6 18.6M18 17.4C19.6 16.6 21.6 17.2 22.2 18.8"/><path d="M20 22.6C20.6 25.6 24.2 26.4 25.4 24.2M15.6 23.2V28"/></svg>';
  var DEPTH_IC = {
    1: '<svg viewBox="0 0 32 32"><path d="M19 3L8.5 18H15.6L13 29L23.8 13.4H16.6Z"/></svg>',
    2: '<svg viewBox="0 0 32 32"><path d="' + gearPoly(16, 16, 8, 8.6, 12.4) + '"/><circle cx="16" cy="16" r="3.6"/></svg>',
    3: BRAIN
  };
  var DEPTHS = [{ id: 1, label: 'Schnell', desc: 'Sofort fertig, die Lösung ist etwas länger.' }, { id: 2, label: 'Mittel', desc: 'Kurze Wartezeit, kürzere Lösung.' }, { id: 3, label: 'Tief', desc: 'Kürzeste Lösung, die Berechnung dauert länger.' }];
  var depth = parseInt(store.get('zauber.depth'), 10); if (!(depth >= 1 && depth <= 3)) depth = 2;
  function renderDepthBtn() { var b = $('depthBtn'); b.innerHTML = DEPTH_IC[depth]; b.setAttribute('aria-label', T('Berechnungstiefe')); b.setAttribute('title', T('Berechnungstiefe')); }
  function depthRows() {
    var h = '';
    DEPTHS.forEach(function (d) { h += '<button class="spdRow depthRow' + (d.id === depth ? ' on' : '') + '" data-d="' + d.id + '">' + DEPTH_IC[d.id] + '<span><b>' + T(d.label) + '</b><small>' + T(d.desc) + '</small></span></button>'; });
    return h;
  }
  function renderDepthList() { $('depthList').innerHTML = depthRows(); }
  function setDepth(d) { depth = d; store.set('zauber.depth', String(d)); renderDepthBtn(); renderDepthList(); }
  function openDepthDialog() { openModal('<div class="spdTitle">' + T('Berechnungstiefe') + '</div>' + depthRows() + '<p class="lDesc" style="margin:10px 0 0">' + T('Je tiefer die Berechnung, desto weniger Züge braucht die Lösung. Beim 3x3 sind es meist etwa 20 Züge, beim 4x4 rund 100. Die Berechnung läuft im Hintergrund.') + '</p>', 'speed'); }
  $('depthBtn').onclick = openDepthDialog;
  $('depthList').addEventListener('click', function (e) { var el = e.target.closest ? e.target.closest('.depthRow') : null; if (el) setDepth(parseInt(el.dataset.d, 10)); });

  // Berechnung im Hintergrund (Web Worker), mit Rückfall auf den Hauptprozess
  var wk = null, wkFailed = false, wid = 0, pending = {}, calcBusy = false;
  function runMain(p) {
    setTimeout(function () {
      var r; try { r = p.n === 4 ? S4.solve4(p.colors, p.level) : S.solve(p.colors, p.level); } catch (e) { r = { ok: false, error: 'Unerwarteter Fehler bei der Berechnung.' }; }
      p.cb(r);
    }, 30);
  }
  function startWorker() {
    if (wk || wkFailed) return;
    try {
      wk = new Worker('solvework.js');
      wk.onmessage = function (e) { var m = e.data; if (m && m.id && pending[m.id]) { var p = pending[m.id]; delete pending[m.id]; p.cb(m.r); } };
      wk.onerror = function () { wkFailed = true; wk = null; var ps = pending; pending = {}; Object.keys(ps).forEach(function (k) { runMain(ps[k]); }); };
    } catch (e) { wkFailed = true; wk = null; }
  }
  function solveAsync(colors, cb) {
    startWorker();
    var p = { n: G.N, colors: colors, level: depth, cb: cb };
    if (wk) { var id = ++wid; pending[id] = p; wk.postMessage({ id: id, n: p.n, colors: colors, level: depth }); } else runMain(p);
  }
  function warmUp() { startWorker(); if (wk) wk.postMessage({ warm: cubeN }); }
  setTimeout(warmUp, 1200);

  // ---------- Zurück-Taste (Android) ----------
  var backStack = [], ignorePop = 0;
  function pushBack(id, fn) { backStack.push({ id: id, fn: fn }); history.pushState({ z: 1 }, ''); }
  function popBack(id) {
    var top = backStack[backStack.length - 1];
    if (top && top.id === id) { backStack.pop(); ignorePop++; history.back(); }
    else backStack = backStack.filter(function (e) { return e.id !== id; });
  }
  window.addEventListener('popstate', function () {
    if (ignorePop > 0) { ignorePop--; return; }
    var e = backStack.pop(); if (e) e.fn();
  });
  var modalOpen = false, modalKind = '';
  function openModal(html, kind) {
    $('modalText').innerHTML = html; modalKind = kind || ''; $('modalClose').hidden = (kind === 'speed' || kind === 'name' || kind === 'confirm'); $('modal').hidden = false;
    if (!modalOpen) { modalOpen = true; pushBack('modal', hideModal); }
  }
  function hideModal() { $('modal').className = ''; $('modal').hidden = true; modalOpen = false; modalKind = ''; }
  function closeModal() { if (modalOpen) { hideModal(); popBack('modal'); } }
  $('modalClose').onclick = closeModal;
  $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };

  function legendHtml() {
    return '<p>' + T('<b>U</b> = Oben, <b>D</b> = Unten, <b>L</b> = Links, <b>R</b> = Rechts, <b>F</b> = Vorne, <b>B</b> = Hinten.') + '</p>' +
      '<p>' + T("Ohne Zusatz: diese Seite eine Viertelumdrehung im Uhrzeigersinn drehen (mit Blick direkt auf die Seite). <b>'</b> = gegen den Uhrzeigersinn. <b>2</b> = halbe Umdrehung.") + '</p>' +
      (cubeN === 4 ? '<p>' + T('Beim 4x4: <b>R</b> dreht nur die äußere Schicht, <b>Rr</b> die äußeren zwei Schichten zugleich, <b>r</b> nur die innere (zweite) Schicht. Genauso bei U, F, L, D und B. x, y und z drehen den ganzen Würfel.') + '</p>' : '<p>' + T('Kleine Buchstaben (r, l, u, d, f, b) drehen zwei Schichten zugleich, M, E und S die mittlere Schicht, x, y und z den ganzen Würfel.') + '</p>');
  }
  function infoHtml(kind) {
    if (kind === 'cube') return '<p>' + T('<b>Schicht drehen:</b> Auf einen Stein tippen und in die gewünschte Richtung wischen. Die Schicht dreht sich mit.') + '</p>' +
      '<p>' + T('<b>Ansicht drehen:</b> Neben den Würfel wischen.') + '</p>' +
      '<p>' + T('<b>Bedienung wählen:</b> <b>Frei</b> = nichts ist fixiert (auf dem Würfel dreht eine Schicht, daneben die Ansicht). <b>Nur Ansicht</b> = jede Wischgeste dreht nur die Ansicht. <b>Nur Ebenen</b> = die Ansicht ist fixiert, es lassen sich nur Schichten des Würfels drehen.') + '</p>' +
      '<p>' + T('<b>Mischen</b> verdreht den Würfel zufällig, <b>Zurück</b> macht den letzten Zug rückgängig, <b>Neu</b> setzt zurück.') + '</p>' +
      '<p>' + T('<b>Lösen:</b> Der Würfel löst sich selbst. Du kannst pausieren, stoppen und das Tempo ändern.') + '</p>';
    if (kind === 'patedit') return '<p>' + T('Hier entwirfst du ein eigenes Muster: Tippe Felder an und färbe sie ein. Danach berechnet die App eine Anleitung, die den gelösten Würfel Schritt für Schritt in dein Muster verwandelt. Das klappt nur, wenn das Muster auf einem echten Würfel überhaupt möglich ist.') + '</p>' + infoHtml('input');
    return '<p>' + T('<b>So geht es:</b> Tippe ein Feld auf dem Würfel an. Oben erscheint die Farbauswahl. Tippe die passende Farbe an, dann wird das Feld eingefärbt. Bereits gefärbte Felder kannst du erneut antippen und korrigieren. Die Auswahl schließt sich, wenn du eine Farbe wählst, irgendwo anders hintippst oder die Zurück-Taste deines Handys drückst.') + '</p>' +
      '<p>' + T('<b>Ansicht drehen:</b> Wische auf dem Würfel oder daneben, um auch Unterseite und Rückseite zu erreichen.') + '</p>' +
      (G.N === 3 ? '<p>' + T('<b>Mittelsteine</b> sind fest. Halte deinen Würfel so: <b>Gelb oben, Grün vorne</b> (dann ist Orange rechts, Rot links, Blau hinten, Weiß unten).') + '</p>' : '<p>' + T('Beim 4x4 gibt es keine festen Mittelsteine: Färbe alle {0} Felder selbst ein, auch die Mitten. Du kannst den Würfel beliebig halten.', [G.SZ]) + '</p>') +
      '<p>' + T('Jede Farbe kommt genau {0}-mal vor (Zähler an der Farbauswahl).', [G.N * G.N]) + '</p>' +
      '<p>' + (G.N === 3 ? T('<b>Leeren</b> löscht alle Felder außer den Mittelsteinen. <b>Vom 3D-Würfel</b> übernimmt den Zustand aus dem Reiter Würfel.') : T('<b>Leeren</b> löscht alle Felder. <b>Vom 3D-Würfel</b> übernimmt den Zustand aus dem Reiter Würfel.')) + '</p>';
  }
  document.querySelectorAll('[data-info]').forEach(function (b) { b.onclick = function () { openModal(infoHtml(b.dataset.info)); }; });

  // ---------- Tabs / Einstellungen ----------
  var cubeView, previewView, solveView, lessonView, editView, curTab = 'cube', settingsOpen = false;
  function showTab(name) {
    curTab = name; settingsOpen = false;
    ['cube', 'solve', 'lessons', 'patterns', 'settings'].forEach(function (n) { $('screen-' + n).classList.toggle('active', n === name); });
    ['cube', 'solve', 'lessons', 'patterns'].forEach(function (n) { $('tab-' + n).classList.toggle('active', n === name); });
    setTimeout(function () { [cubeView, previewView, solveView, lessonView, editView].forEach(function (v) { v && v.resize(); }); if (name === 'patterns' && $('patEdit').hidden) renderPatterns(); if (!$('solvePane').hidden && name === 'solve') renderStep(); if (name === 'lessons' && !lOpen) renderLessonList(); }, 30);
  }
  $('tab-cube').onclick = function () { showTab('cube'); };
  $('tab-solve').onclick = function () { showTab('solve'); };
  $('tab-lessons').onclick = function () { showTab('lessons'); };
  $('tab-patterns').onclick = function () { if (curTab === 'patterns' && !settingsOpen && !$('patEdit').hidden) { edLeave(); return; } showTab('patterns'); };
  function hideSettings() { if (!settingsOpen) return; settingsOpen = false; pendHue = hue; updateRingBtn(); showTab(curTab); }
  function openSettings() {
    if (settingsOpen) return;
    settingsOpen = true;
    ['cube', 'solve', 'lessons', 'patterns'].forEach(function (n) { $('screen-' + n).classList.remove('active'); $('tab-' + n).classList.remove('active'); });
    $('screen-settings').classList.add('active'); pushBack('settings', hideSettings);
    setTimeout(function () { drawRing(); updateRingBtn(); }, 30);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.gear'), function (g) { g.onclick = function () { if (settingsOpen) closeSettings(); else openSettings(); }; });
  function closeSettings() { if (settingsOpen) { hideSettings(); popBack('settings'); } }
  $('setBack').onclick = closeSettings;
  Array.prototype.forEach.call(document.querySelectorAll('.accHead'), function (b) {
    b.onclick = function () {
      var acc = b.parentNode, open = acc.classList.contains('open');
      Array.prototype.forEach.call(document.querySelectorAll('.acc'), function (x) { x.classList.remove('open'); });
      if (!open) acc.classList.add('open');
      if (acc.id === 'acc-design' && !open) setTimeout(function () { drawRing(); updateRingBtn(); }, 30);
    };
  });

  // ---------- Tempo-Fenster ----------
  function openSpeedDialog() {
    var h = '<div class="spdTitle">' + T('Geschwindigkeit') + '</div>';
    SPEEDS.forEach(function (s, i) { h += '<button class="spdRow' + (i === speedIdx ? ' on' : '') + '" data-s="' + i + '">' + SPD_IC[s.id] + '<span>' + T(s.label) + '</span></button>'; });
    openModal(h, 'speed');
  }
  ['spdCube', 'spdSolve', 'spdLesson'].forEach(function (id) { $(id).onclick = openSpeedDialog; });
  $('modalText').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.spdRow') : null;
    if (!el) return;
    if (el.dataset.d !== undefined) { setDepth(parseInt(el.dataset.d, 10)); closeModal(); return; }
    speedIdx = parseInt(el.dataset.s, 10); store.set('zauber.speed', String(speedIdx)); renderSpeedBtns(); closeModal();
  });

  // ---------- Funktion 1: freier 3D-Würfel ----------
  var undoStack = [], moves = 0;
  var autoRun = false, autoPaused = false, autoMoves = [], autoIdx = 0;
  cubeView = new CubeView($('cube3d'), { lib: G, onTurn: function (t) { undoStack.push(t); moves++; updStatus(); } });
  cubeView.attachViewCube();
  var statusKey = null;
  function updStatus(txt, args) {
    statusKey = txt ? [txt, args] : null;
    $('cubeStatus').textContent = txt ? T(txt, args) : (T('Züge: {0}', [moves]) + (G.isSolved(cubeView.state) && moves ? ' - ' + T('Gelöst!') : ''));
  }
  Array.prototype.forEach.call($('modeSeg').children, function (b) {
    b.onclick = function () {
      cubeView.mode = b.dataset.m;
      Array.prototype.forEach.call($('modeSeg').children, function (x) { x.className = x === b ? 'on' : ''; });
    };
  });
  function busy() { return cubeView.isBusy() || autoRun || calcBusy; }
  $('btnReset').onclick = function () {
    stopAuto(); cubeView.clearQueue(); cubeView.anim = null; cubeView.setState(G.solvedColors());
    undoStack = []; moves = 0; updStatus();
  };
  $('btnUndo').onclick = function () {
    if (busy() || !undoStack.length) return;
    var t = undoStack.pop(); moves = Math.max(0, moves - 1);
    cubeView.enqueue({ k: t.k, c: t.c, steps: -t.steps }, 200, function () { updStatus(); });
  };
  $('btnScramble').onclick = function () {
    if (busy()) return;
    undoStack = []; moves = 0; var last = '', n = 0, pool = G.MOVE_NAMES.slice();
    if (G.N === 4) G.FACE_NAMES.forEach(function (f) { var lf = f.toLowerCase(); pool.push(lf, lf + "'", lf + '2'); });
    var count = G.N === 4 ? 30 : 22;
    while (n < count) {
      var m = pool[Math.floor(Math.random() * pool.length)];
      if (m.replace(/[2']/g, '') === last) continue;
      last = m.replace(/[2']/g, ''); n++; cubeView.enqueueName(m, 90);
    }
    updStatus('Mischen ...');
    cubeView.queue[cubeView.queue.length - 1].cb = function () { updStatus(); };
  };
  function autoStep() {
    if (!autoRun || autoPaused) return;
    if (autoIdx >= autoMoves.length) { stopAuto(); undoStack = []; moves = 0; updStatus('Gelöst!'); return; }
    var m = autoMoves[autoIdx];
    updStatus('Lösen: Zug {0} von {1} ({2})', [autoIdx + 1, autoMoves.length, m]);
    cubeView.enqueueName(m, dur(), function () { autoIdx++; setTimeout(autoStep, gap()); });
  }
  function stopAuto() { autoRun = false; autoPaused = false; $('autoBar').hidden = true; cubeView.layerDrag = true; $('aPause').textContent = T('Pause'); }
  function errText(r) { return T(r.error, (r.args || []).map(function (a) { return T(a); })); }
  $('aPause').onclick = function () {
    if (!autoRun) return;
    autoPaused = !autoPaused; this.textContent = T(autoPaused ? 'Weiter' : 'Pause');
    if (autoPaused) updStatus('Pausiert (Zug {0} von {1})', [autoIdx, autoMoves.length]); else autoStep();
  };
  $('aStop').onclick = function () { stopAuto(); cubeView.clearQueue(); undoStack = []; moves = 0; updStatus('Gestoppt'); };

  // ---------- Funktion 2: Muster direkt am 3D-Würfel eingeben ----------
  var inp, sel = -1, toastT = null;
  function clearInput() {
    inp = new Int8Array(G.SZ); inp.fill(-1);
    if (G.N === 3) for (var i = 0; i < G.SZ; i++) if (G.isCenter(i)) inp[i] = G.SCHEME[G.stickers[i].face];
    sel = -1;
  }
  clearInput();
  var pal = $('palette'), palOpen = false, PAL = root_palette();
  function root_palette() { return window.PALETTE; }
  for (var c = 0; c < 6; c++) (function (c) {
    var b = document.createElement('button'); b.className = 'sw'; b.style.background = PAL[c];
    b.innerHTML = '<i></i>';
    b.onclick = function () { if (sel >= 0) { inp[sel] = c; closePalette(); $('errBox').hidden = true; refreshInput(); } };
    pal.appendChild(b);
  })(c);
  function hidePalette() { sel = -1; palOpen = false; if (previewView) previewView.selected = -1; pal.hidden = true; $('preview3d').parentNode.classList.remove('pal'); }
  function closePalette() { if (palOpen) { hidePalette(); popBack('pal'); } }
  function toast(t, args) { $('inToast').textContent = T(t, args); clearTimeout(toastT); toastT = setTimeout(function () { $('inToast').textContent = ''; }, 2000); }
  previewView = new CubeView($('preview3d'), {
    layerDrag: false, lib: G,
    onTap: function (i) {
      if (i < 0) { closePalette(); return; }
      if (G.N === 3 && G.isCenter(i)) { closePalette(); toast('Mittelsteine sind fest.'); return; }
      sel = i; previewView.selected = i; pal.hidden = false; $('preview3d').parentNode.classList.add('pal');
      if (!palOpen) { palOpen = true; pushBack('pal', hidePalette); }
    }
  });
  previewView.attachViewCube();
  document.addEventListener('pointerdown', function (e) {
    if (!palOpen) return;
    if (pal.contains(e.target) || e.target === $('preview3d')) return;
    closePalette();
  }, true);
  function refreshInput() {
    var cnt = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < G.SZ; i++) if (inp[i] >= 0) cnt[inp[i]]++;
    for (var c2 = 0; c2 < 6; c2++) {
      var b = pal.children[c2].firstChild; b.textContent = cnt[c2] + '/' + G.N * G.N;
      b.className = cnt[c2] === G.N * G.N ? 'ok' : (cnt[c2] > G.N * G.N ? 'bad' : '');
    }
    previewView.setState(inp);
  }
  refreshInput();
  $('btnClear').onclick = function () { clearInput(); closePalette(); $('errBox').hidden = true; refreshInput(); };
  $('btnFromCube').onclick = function () { inp = Int8Array.from(cubeView.state); closePalette(); $('errBox').hidden = true; refreshInput(); toast('Zustand aus dem Reiter Würfel übernommen.'); };

  // ---------- Lösung abspielen ----------
  solveView = new CubeView($('solve3d'), { layerDrag: false, lib: G });
  solveView.attachViewCube();
  var flat = [], states = [], idx = 0, auto = false, follow = false, plan = null, LABELS = S.LABELS;
  var LABELS4 = {
    centers: ['Zentren-Dreiertausch', 'Tauscht drei Zentrumssteine im Kreis, alles andere bleibt.'],
    pairs: ['Kantenpaare', 'Bewegt Kantenteile so, dass zwei passende Teile nebeneinander liegen.'],
    parityOLL: ['OLL-Parität', 'Dreht eine einzelne Kante um. Das gibt es nur beim 4x4.'],
    parityPLL: ['PLL-Parität', 'Vertauscht zwei Kantenpaare. Das gibt es nur beim 4x4.'],
    centerStage: ['Zentren-Zugfolge', 'Bringt Zentrumssteine mit wenigen Zügen an ihre Seite.']
  };
  function labelOf(k) { return LABELS4[k] || LABELS[k] || ['Zugfolge', '']; }
  $('btnCompute').onclick = function () {
    var err = $('errBox'); err.hidden = true; closePalette();
    if (calcBusy) return; calcBusy = true;
    $('btnCompute').textContent = T('Berechne ...'); $('btnCompute').disabled = true;
    solveAsync(Array.prototype.slice.call(inp), function (r) {
      calcBusy = false;
      $('btnCompute').textContent = T('Lösung berechnen'); $('btnCompute').disabled = false;
      if (!r.ok) { err.textContent = errText(r); err.hidden = false; return; }
      startPlan(r);
    });
  };
  function phaseCount() { return plan.phases.length; }
  function pName(p) { return T(p.name); }
  function pDesc(p) {
    if (plan.N === 4 && p.no === 1) return T('Bringe auf jeder Seite die vier Zentrumssteine in die Farbe der Seite. Danach verhalten sie sich wie die festen Mittelsteine eines 3x3.');
    if (plan.N === 4 && p.no === 2) return T('Setze die zwei Kantenteile jeder Kante zu einem Paar zusammen (gleiche Farben nebeneinander). Danach ist jede Kante wie beim 3x3.');
    if (plan.N === 4 && p.no === 3) return T('Diesen Fall gibt es nur beim 4x4. Ein besonderer Algorithmus korrigiert ihn, danach geht es wie beim 3x3 weiter.');
    return T(p.desc || '');
  }
  function startPlan(r) {
    plan = r; plan.N = G.N; flat = []; states = [Uint8Array.from(inp)];
    r.phases.forEach(function (p) {
      p.startIdx = -1;
      p.segs.forEach(function (sg) {
        sg.moves.forEach(function (m, j) { if (p.startIdx < 0) p.startIdx = flat.length; flat.push({ m: m, p: p, seg: sg, pos: j, first: p.startIdx === flat.length }); });
      });
    });
    flat.forEach(function (st, i) { states.push(G.applyMove(states[i], st.m)); });
    idx = 0; auto = false; setAutoIcon('bAuto', false);
    $('inputPane').hidden = true; $('solvePane').hidden = false;
    var ch = $('chips'); ch.innerHTML = '';
    flat.forEach(function (st, i) {
      if (st.first) { var l = document.createElement('div'); l.className = 'chip ph'; l.textContent = 'P' + st.p.no; ch.appendChild(l); }
      var c3 = document.createElement('div'); c3.className = 'chip'; c3.textContent = st.m; c3.id = 'chip' + i;
      c3.onclick = function () { jump(i); }; ch.appendChild(c3);
    });
    setTimeout(function () { solveView.resize(); solveView.setState(states[0]); renderStep(); }, 40);
  }
  function describe(m) {
    var wide = G.N === 4 ? /^([UDLRFB])([udlrfbw])(.*)$/.exec(m) : null, inner = G.N === 4 ? /^([udlrfb])(.*)$/.exec(m) : null, std = /^([UDLRFBudlrfb])(.*)$/.exec(m);
    var letter, suf, kind;
    if (wide && (wide[2] === 'w' || wide[2] === wide[1].toLowerCase())) { letter = wide[1]; suf = wide[3]; kind = 'wide'; }
    else if (inner) { letter = inner[1].toUpperCase(); suf = inner[2]; kind = 'inner'; }
    else if (std) { letter = std[1].toUpperCase(); suf = std[2]; kind = (G.N === 3 && std[1] !== letter) ? 'wide' : 'face'; }
    else return m;
    var t = suf === '' ? T('im Uhrzeigersinn') : (suf.indexOf('2') >= 0 ? T('halbe Umdrehung') : T('gegen den Uhrzeigersinn'));
    var face = T(FACE_DE[letter]);
    if (kind === 'inner') return T('Zweite Schicht von {0}', [face]) + ', ' + t;
    if (kind === 'wide') return T('{0}, zwei Schichten', [face]) + ', ' + t;
    return face + ', ' + t;
  }
  function algHtml(st) {
    if (!st) return '<p>' + T('Keine weiteren Züge.') + '</p>';
    var lab = labelOf(st.seg.k);
    return '<div class="algName" style="margin-top:0">' + T(lab[0]) + '</div><div class="algMoves">' + st.seg.moves.map(function (m, j) {
      return '<span class="' + (j < st.pos ? 'done' : j === st.pos ? 'cur' : '') + '">' + m + '</span>';
    }).join('') + '</div><div class="algText">' + T(lab[1]) + '</div>';
  }
  function renderStep() {
    if (!plan) return;
    var n = flat.length, st = flat[idx];
    for (var i = 0; i < n; i++) $('chip' + i).className = 'chip' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
    var cur = $('chip' + Math.min(idx, n - 1)); if (cur) { var chs = $('chips'); chs.scrollLeft = cur.offsetLeft - chs.clientWidth / 2; }
    if (st) {
      $('moveBig').textContent = st.m; $('moveDesc').textContent = describe(st.m);
      $('phaseTitle').textContent = T('Phase {0} von {1}', [st.p.no, phaseCount()]) + ': ' + pName(st.p);
      solveView.highlight = hlSpec(G, st.m);
      if (follow && G.faceOfMove(st.m) >= 0) solveView.setViewFor(G.faceOfMove(st.m));
    } else {
      $('moveBig').textContent = T('Fertig'); $('moveDesc').textContent = T('Der Würfel ist gelöst!');
      $('phaseTitle').textContent = T('Fertig'); solveView.highlight = null;
    }
    if (modalOpen && modalKind === 'alg') $('modalText').innerHTML = algHtml(st);
    $('stepInfo').textContent = T('Zug {0} von {1}', [Math.min(idx + (st ? 1 : 0), n), n]);
    drawNet($('netMini'), solveView.state, st ? netFace(G, st.m) : -1, G.N);
  }
  function next(cb) {
    if (solveView.isBusy() || idx >= flat.length) { auto = false; setAutoIcon('bAuto', false); return; }
    var m = flat[idx].m; idx++; solveView.highlight = null;
    solveView.enqueueName(m, dur(), function () { renderStep(); if (cb) cb(); });
  }
  function back() {
    if (solveView.isBusy() || idx <= 0) return;
    idx--; solveView.highlight = null; solveView.enqueueName(G.invertMove(flat[idx].m), dur(), renderStep);
  }
  function jump(i) {
    solveView.clearQueue(); solveView.anim = null; auto = false; setAutoIcon('bAuto', false);
    idx = i; solveView.setState(states[i]); renderStep();
  }
  $('bNext').onclick = function () { auto = false; setAutoIcon('bAuto', false); next(); };
  $('bBack').onclick = function () { auto = false; setAutoIcon('bAuto', false); back(); };
  $('bStart').onclick = function () { jump(0); };
  $('bAuto').onclick = function () {
    if (auto) { auto = false; setAutoIcon('bAuto', false); return; }
    if (idx >= flat.length) jump(0);
    auto = true; setAutoIcon('bAuto', true);
    (function step() { if (!auto) return; next(function () { setTimeout(step, gap()); }); })();
  };
  $('btnFollow').onclick = function () { follow = !follow; this.classList.toggle('on', follow); renderStep(); };
  $('btnAlg').onclick = function () { openModal(algHtml(flat[idx]), 'alg'); };
  $('btnPhaseInfo').onclick = function () {
    var st = flat[idx];
    openModal((st ? '<p><b>' + pName(st.p) + '</b></p><p>' + pDesc(st.p) + '</p>' : '') + legendHtml() +
      '<p>' + T('<b>Folgen:</b> Die Ansicht dreht sich automatisch zu der Seite, die gedreht wird. <b>Umrandung</b> = Seite, die du drehen musst. Das kleine Netz oben rechts zeigt alle sechs Seiten.') + '</p>');
  };
  $('btnBackInput').onclick = function () {
    auto = false; solveView.clearQueue(); solveView.anim = null; plan = null;
    $('solvePane').hidden = true; $('inputPane').hidden = false; setTimeout(function () { previewView.resize(); }, 30);
  };
  $('btnRecipe').onclick = function () {
    if (!plan) return;
    var h = '<p><b>' + T('Rezept') + '</b></p><p>' + T('Die Lösung besteht aus {0} Schritten. Tippe auf einen Schritt, um dorthin zu springen.', [phaseCount()]) + '</p>';
    plan.phases.forEach(function (p) {
      var algs = [], seen = {};
      p.segs.forEach(function (sg) {
        var uniq = (sg.k !== 'centerStage' && sg.k !== 'prep' && sg.k !== 'finish'); if (sg.k === 'turn' || (uniq && seen[sg.k])) return; seen[sg.k] = 1;
        algs.push('<code>' + T(labelOf(sg.k)[0]) + ': ' + sg.moves.join(' ') + '</code>');
      });
      var done = p.moves.length === 0;
      h += '<div class="rcard' + (done ? ' done' : '') + '" data-start="' + (done ? -1 : p.startIdx) + '"><span class="no">' + p.no + '</span><b>' + pName(p) + '</b>' +
        '<div style="font-size:12px;margin-top:4px">' + pDesc(p) + '</div>' +
        '<div class="meta">' + (done ? T('schon erledigt') : T('{0} Züge', [p.moves.length])) + '</div>' + (done ? '' : algs.join('')) + '</div>';
    });
    openModal(h);
  };
  $('modalText').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.rcard') : null;
    if (!el) return; var st = parseInt(el.dataset.start, 10);
    if (st >= 0) { closeModal(); jump(st); }
  });

  // ---------- Lektionen ----------
  var curSec = cubeN === 4 ? 'x4' : 'basic', lMoves = [], lStates = [], lIdx = 0, lAuto = false, lOpen = false, lCur = null;
  lessonView = new CubeView($('lesson3d'), { layerDrag: false, lib: C3 });
  lessonView.attachViewCube();
  function secById(id) { return LL.SECTIONS.filter(function (x) { return x.id === id; })[0]; }
  function firstSentence(t) { var i = t.search(/[.。](\s|$)/); return i > 0 ? t.slice(0, i) : t; }
  function cardHint(sec, it) {
    var a = LL.analyze(it);
    if (sec.id === 'oll') return T('Oben {0}/9 gelb, danach 9/9', [a.yBefore]);
    if (sec.id === 'pll') return LL.summary(sec, it, T).replace(' ' + T('Die Oberseite bleibt gelb.'), '');
    if (sec.id === 'f2l') return T('Paar einsetzen');
    return firstSentence(T(it.desc || ''));
  }
  function drawThumb(cv, sec, it) {
    var a = LL.analyze(it);
    if (sec.kind === 'oll') Thumbs.top(cv, a.full, 'oll');
    else if (sec.kind === 'pll') Thumbs.top(cv, a.full, 'pll', a.arrows);
    else Thumbs.iso(cv, a.start, undefined, undefined, sec.lib);
  }
  function renderLessonList() {
    var tabs = $('lessonTabs'); tabs.innerHTML = '';
    if (curSec === 'not3' && cubeN === 4) curSec = 'not4'; if (curSec === 'not4' && cubeN === 3) curSec = 'not3';
    LL.SECTIONS.forEach(function (sec) {
      if ((sec.id === 'not3' && cubeN === 4) || (sec.id === 'not4' && cubeN === 3)) return;
      var b = document.createElement('button'); b.textContent = T(sec.name); if (sec.id === curSec) b.className = 'on';
      b.onclick = function () { curSec = sec.id; renderLessonList(); $('lessonListWrap').scrollTop = 0; };
      tabs.appendChild(b);
    });
    var sec = secById(curSec), h = '';
    sec.groups.forEach(function (g, gi) {
      h += '<div class="cat">' + T(g.name) + '</div><div class="lgrid">';
      g.items.forEach(function (it, ii) {
        if (!LL.validFor(sec, it)) return;
        h += '<button class="lcard" data-g="' + gi + '" data-i="' + ii + '"><canvas class="thumb"></canvas><b>' + T(it.name) + '</b><span class="hint">' + cardHint(sec, it) + '</span><small>' + it.alg + '</small></button>';
      });
      h += '</div>';
    });
    var box = $('lessonList'); box.innerHTML = h;
    box.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('.lcard') : null; if (!b) return;
      openLesson(sec, sec.groups[+b.dataset.g], sec.groups[+b.dataset.g].items[+b.dataset.i]);
    };
    setTimeout(function () {
      box.querySelectorAll('.lcard').forEach(function (b) { drawThumb(b.querySelector('canvas'), sec, sec.groups[+b.dataset.g].items[+b.dataset.i]); });
    }, 20);
  }
  function drawLessonThumbs() {
    if (!lCur) return; var a = LL.analyze(lCur.it), sec = lCur.sec;
    if (sec.kind === 'oll') { Thumbs.top($('lBefore'), a.full, 'oll'); Thumbs.top($('lAfter'), C3.solvedColors(), 'oll'); }
    else if (sec.kind === 'pll') { Thumbs.top($('lBefore'), a.full, 'pll', a.arrows); Thumbs.top($('lAfter'), C3.solvedColors(), 'pll'); }
    else { Thumbs.iso($('lBefore'), a.start, undefined, undefined, sec.lib); Thumbs.iso($('lAfter'), a.after, undefined, undefined, sec.lib); }
  }
  var detailReturn = null;
  function openLesson(sec, grp, it, ret) {
    detailReturn = ret || null;
    if (ret) { ['cube', 'solve', 'lessons', 'patterns', 'settings'].forEach(function (n) { $('screen-' + n).classList.toggle('active', n === 'lessons'); }); }
    var a = LL.analyze(it); lCur = { sec: sec, grp: grp, it: it }; lMoves = a.moves; lStates = [a.start];
    lessonView.setLib(sec.lib);
    lMoves.forEach(function (m, i) { lStates.push(sec.lib.applyMove(lStates[i], m)); });
    lIdx = 0; lAuto = false; setAutoIcon('lAuto', false);
    $('lTitle').textContent = T(it.name);
    $('lessonListWrap').hidden = true; $('lessonDetail').hidden = false;
    if (!lOpen) { lOpen = true; pushBack('lesson', hideLesson); }
    setTimeout(function () {
      lessonView.resize(); lessonView.clearQueue(); lessonView.anim = null; lessonView.setState(lStates[0]); renderLesson(); drawLessonThumbs();
    }, 40);
  }
  $('btnLInfo').onclick = function () {
    if (!lCur) return;
    openModal('<div class="lGroup">' + T(lCur.sec.name) + ' / ' + T(lCur.grp.name) + '</div><p><b>' + T(lCur.it.name) + '</b></p><p>' + LL.summary(lCur.sec, lCur.it, T) + '</p>' +
      '<div class="notation">' + lCur.it.alg + '</div>' + legendHtml() +
      '<p>' + T('Farbig sind die beteiligten Steine, grau alle anderen. Umrandung = Seite, die gedreht wird. Oben im Bild siehst du den Zustand vorher und nachher.') + '</p>');
  };
  function hideLesson() {
    lAuto = false; lOpen = false; lessonView.clearQueue(); lessonView.anim = null; $('lessonDetail').hidden = true; $('lessonListWrap').hidden = false;
    if (detailReturn) { var r = detailReturn; detailReturn = null; showTab(r); } else renderLessonList();
  }
  function closeLesson() { if (lOpen) { hideLesson(); popBack('lesson'); } }
  $('lBack').onclick = closeLesson;
  function renderLesson() {
    $('lMoves').innerHTML = lMoves.map(function (m, j) { return '<span class="' + (j < lIdx ? 'done' : j === lIdx ? 'cur' : '') + '">' + m + '</span>'; }).join('');
    var cur = $('lMoves').children[Math.min(lIdx, lMoves.length - 1)]; if (cur) $('lMoves').scrollLeft = cur.offsetLeft - $('lMoves').clientWidth / 2;
    $('lInfo').textContent = lIdx >= lMoves.length ? T('Fertig: Die beteiligten Steine sind an ihrem Platz.') : T('Zug {0} von {1}', [lIdx + 1, lMoves.length]);
    lessonView.highlight = lIdx < lMoves.length ? hlSpec(lCur.sec.lib, lMoves[lIdx]) : null;
  }
  function lNext(cb) {
    if (lessonView.isBusy() || lIdx >= lMoves.length) { lAuto = false; setAutoIcon('lAuto', false); return; }
    var m = lMoves[lIdx]; lIdx++; lessonView.highlight = null;
    lessonView.enqueueName(m, dur(), function () { renderLesson(); if (cb) cb(); });
  }
  function lPrev() {
    if (lessonView.isBusy() || lIdx <= 0) return;
    lIdx--; lessonView.highlight = null; lessonView.enqueueName(lCur.sec.lib.invertMove(lMoves[lIdx]), dur(), renderLesson);
  }
  function lJump(i) { lessonView.clearQueue(); lessonView.anim = null; lAuto = false; setAutoIcon('lAuto', false); lIdx = i; lessonView.setState(lStates[i]); renderLesson(); }
  $('lNext').onclick = function () { lAuto = false; setAutoIcon('lAuto', false); lNext(); };
  $('lBackStep').onclick = function () { lAuto = false; setAutoIcon('lAuto', false); lPrev(); };
  $('lStart').onclick = function () { lJump(0); };
  $('lAuto').onclick = function () {
    if (lAuto) { lAuto = false; setAutoIcon('lAuto', false); return; }
    if (lIdx >= lMoves.length) lJump(0);
    lAuto = true; setAutoIcon('lAuto', true);
    (function step() { if (!lAuto) return; lNext(function () { setTimeout(step, gap()); }); })();
  };

  // ---------- Muster ----------
  var PATSEC = function () { return { id: 'pat', name: 'Muster', kind: 'iso', lib: G }; };
  function patItems() { return G.N === 4 ? LL.PAT4 : LL.PAT3; }

  // ---------- Würfel-Schaltflächen als Symbole ----------
  var undoOn = store.get('zauber.undo') === '1';
  var SHUFFLE_IC = '<svg viewBox="0 0 28 28" class="shufIco"><path d="M3 8h4.5c5.5 0 5.5 12 11 12H24M3 20h4.5c2 0 3.4-1 4.6-2.5M15.6 10.6C16.8 9.2 17.9 8 20 8H24"/><path d="M21.5 5.2L24.6 8L21.5 10.8M21.5 17.2L24.6 20L21.5 22.8"/></svg>';
  var UNDO_IC = '<svg viewBox="0 0 28 28"><path d="M10 6L4 12l6 6"/><path d="M4.5 12H16a7 7 0 0 1 0 14h-3"/></svg>';
  function renderCubeBtns() {
    $('btnScramble').innerHTML = '<span class="duo">' + cubeIcon(false, G.N) + SHUFFLE_IC + '</span>';
    $('btnReset').innerHTML = cubeIcon(false, G.N);
    $('btnUndo').innerHTML = UNDO_IC; $('btnUndo').hidden = !undoOn;
    var t = $('undoToggle'); t.textContent = T(undoOn ? 'An' : 'Aus'); t.classList.toggle('on', undoOn);
  }
  $('undoToggle').onclick = function () { undoOn = !undoOn; store.set('zauber.undo', undoOn ? '1' : '0'); renderCubeBtns(); };
  var DEL_IC = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function renderPatterns() {
    var items = patItems(), h = '', mine = loadMine().filter(function (m) { return m.n === G.N; });
    if (mine.length) {
      h += '<div class="cat">' + T('Meine Muster') + '</div><div class="lgrid">';
      mine.forEach(function (m) {
        h += '<div class="lcardWrap"><button class="lcard" data-m="' + m.id + '"><canvas class="thumb"></canvas><b>' + esc(m.name) + '</b><span class="sub">' + T('{0} Züge', [m.alg.split(' ').length]) + '</span></button><button class="delPat" data-del="' + m.id + '" aria-label="' + T('Löschen') + '">' + DEL_IC + '</button></div>';
      });
      h += '</div>';
    }
    h += '<div class="cat">' + T('Katalog') + '</div><div class="lgrid">';
    items.forEach(function (it, i) {
      var a = (it._a && it._a.lib === G) ? it._a : LL.analyzePattern(it, G);
      h += '<button class="lcard" data-i="' + i + '"><canvas class="thumb"></canvas><b>' + T(it.name) + '</b><span class="sub">' + T('{0} Züge', [a.moves.length]) + '</span><small>' + it.alg + '</small></button>';
    });
    h += '</div>';
    var box = $('patList'); box.innerHTML = h;
    box.onclick = function (e) {
      var d = e.target.closest ? e.target.closest('.delPat') : null;
      if (d) { confirmDelete(+d.dataset.del); return; }
      var b = e.target.closest ? e.target.closest('.lcard') : null; if (!b) return;
      if (b.dataset.m) { var m = mine.filter(function (x) { return x.id === +b.dataset.m; })[0]; if (m) openPatternView(m.name, m.alg, m.c); return; }
      var it = items[+b.dataset.i]; LL.analyzePattern(it, G);
      openLesson(PATSEC(), { name: 'Katalog' }, it, 'patterns');
    };
    setTimeout(function () {
      box.querySelectorAll('.lcard').forEach(function (b) {
        if (b.dataset.m) { var m = mine.filter(function (x) { return x.id === +b.dataset.m; })[0]; if (m) Thumbs.iso(b.querySelector('canvas'), Uint8Array.from(m.c), undefined, undefined, G); }
        else Thumbs.iso(b.querySelector('canvas'), items[+b.dataset.i]._a.after, undefined, undefined, G);
      });
    }, 20);
  }
  // Editor für eigene Muster
  var edInp, edSel = -1, edPalOpen = false, edToastT = null, edPal = $('pePalette');
  function edReset() { edInp = Int8Array.from(G.solvedColors()); edSel = -1; }
  function edClear() { edInp = new Int8Array(G.SZ); edInp.fill(-1); if (G.N === 3) for (var i = 0; i < G.SZ; i++) if (G.isCenter(i)) edInp[i] = G.SCHEME[G.stickers[i].face]; edSel = -1; }
  edReset();
  for (var ec = 0; ec < 6; ec++) (function (c) {
    var b = document.createElement('button'); b.className = 'sw'; b.style.background = PAL[c]; b.innerHTML = '<i></i>';
    b.onclick = function () { if (edSel >= 0) { edInp[edSel] = c; edClose(); $('peErr').hidden = true; edRefresh(); } };
    edPal.appendChild(b);
  })(ec);
  function edHide() { edSel = -1; edPalOpen = false; if (editView) editView.selected = -1; edPal.hidden = true; $('pe3d').parentNode.classList.remove('pal'); }
  function edClose() { if (edPalOpen) { edHide(); popBack('edpal'); } }
  function edToast(t) { $('peToast').textContent = T(t); clearTimeout(edToastT); edToastT = setTimeout(function () { $('peToast').textContent = ''; }, 2000); }
  editView = new CubeView($('pe3d'), {
    layerDrag: false, lib: G,
    onTap: function (i) {
      if (i < 0) { edClose(); return; }
      if (G.N === 3 && G.isCenter(i)) { edClose(); edToast('Mittelsteine sind fest.'); return; }
      edSel = i; editView.selected = i; edPal.hidden = false; $('pe3d').parentNode.classList.add('pal');
      if (!edPalOpen) { edPalOpen = true; pushBack('edpal', edHide); }
    }
  });
  editView.attachViewCube();
  document.addEventListener('pointerdown', function (e) {
    if (!edPalOpen) return;
    if (edPal.contains(e.target) || e.target === $('pe3d')) return;
    edClose();
  }, true);
  function edRefresh() {
    var cnt = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < G.SZ; i++) if (edInp[i] >= 0) cnt[edInp[i]]++;
    for (var c2 = 0; c2 < 6; c2++) { var b = edPal.children[c2].firstChild; b.textContent = cnt[c2] + '/' + G.N * G.N; b.className = cnt[c2] === G.N * G.N ? 'ok' : (cnt[c2] > G.N * G.N ? 'bad' : ''); }
    editView.setState(edInp);
  }
  edRefresh();
  // Symbole für den Editor: gelöster Würfel (bunt / grau), Gehirn, Speichern
  function cubeIcon(gray, n) {
    var faces = [{ o: [20, 4], u: [14, 7], v: [-14, 7], c: 1, g: '#c4c6cc' }, { o: [6, 11], u: [14, 7], v: [0, 16], c: 4, g: '#a9abb2' }, { o: [20, 18], u: [14, -7], v: [0, 16], c: 3, g: '#92949c' }], h = '';
    faces.forEach(function (f) {
      for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) {
        var pt = function (x, y) { return (f.o[0] + f.u[0] * x / n + f.v[0] * y / n).toFixed(2) + ',' + (f.o[1] + f.u[1] * x / n + f.v[1] * y / n).toFixed(2); };
        h += '<polygon points="' + pt(a, b) + ' ' + pt(a + 1, b) + ' ' + pt(a + 1, b + 1) + ' ' + pt(a, b + 1) + '" fill="' + (gray ? f.g : PAL[f.c]) + '"/>';
      }
    });
    return '<svg viewBox="4 2 32 34" class="cubeIco"><g stroke="#1c1c1f" stroke-width="0.9" stroke-linejoin="round">' + h + '</g><path d="M20 4L34 11V27L20 34L6 27V11Z" fill="none" stroke="#1c1c1f" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  var SAVE_IC = '<svg viewBox="0 0 32 32"><path d="M6 5h16l4 4v18H6z"/><path d="M10 5v7h10V5"/><path d="M10 27v-8h12v8"/></svg>';
  function renderEdIcons() { $('peReset').innerHTML = cubeIcon(false, G.N); $('peClear').innerHTML = cubeIcon(true, G.N); $('peCompute').innerHTML = BRAIN; $('peSave').innerHTML = SAVE_IC; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadMine() { try { var a = JSON.parse(store.get('zauber.mypat') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveMine(a) { store.set('zauber.mypat', JSON.stringify(a)); }
  var edOpen = false;
  $('patNew').onclick = function () {
    $('patListWrap').hidden = true; $('patEdit').hidden = false; setTimeout(function () { editView.resize(); }, 30);
    if (!edOpen) { edOpen = true; pushBack('edit', edHideScreen); }
  };
  function edHideScreen() { edClose(); edOpen = false; $('patEdit').hidden = true; $('patListWrap').hidden = false; renderPatterns(); }
  function edLeave() { if (edOpen) { edHideScreen(); popBack('edit'); } }
  $('peReset').onclick = function () { edClose(); edReset(); $('peErr').hidden = true; edRefresh(); };
  $('peClear').onclick = function () { edClose(); edClear(); $('peErr').hidden = true; edRefresh(); };
  function edCompute(cb) {
    var err = $('peErr'); err.hidden = true; edClose();
    if (calcBusy) return; calcBusy = true;
    var bc = $('peCompute'); bc.classList.add('busy'); bc.disabled = true; $('peSave').disabled = true;
    solveAsync(Array.prototype.slice.call(edInp), function (r) {
      calcBusy = false; bc.classList.remove('busy'); bc.disabled = false; $('peSave').disabled = false;
      if (!r.ok) { err.textContent = errText(r); err.hidden = false; return; }
      var all = []; r.phases.forEach(function (p) { all = all.concat(p.moves); });
      if (!all.length) { err.textContent = T('Das ist der gelöste Würfel - es gibt nichts zu bauen.'); err.hidden = false; return; }
      var build = G.invertMoves(all), made = G.applyMoves(G.solvedColors(), build), same = true;
      for (var i = 0; i < G.SZ; i++) if (made[i] !== edInp[i]) { same = false; break; }
      if (!same) { err.textContent = T('Für dieses Muster konnte keine Anleitung berechnet werden.'); err.hidden = false; return; }
      cb(build);
    });
  }
  function openPatternView(name, alg, colors) {
    var it = { name: name, alg: alg, desc: 'Diese Anleitung verwandelt den gelösten Würfel in dein Muster.' };
    LL.analyzePattern(it, G, G.parseAlg(alg), Uint8Array.from(colors));
    openLesson(PATSEC(), { name: 'Eigenes Muster' }, it, 'patterns');
  }
  $('peCompute').onclick = function () { edCompute(function (build) { openPatternView('Eigenes Muster', build.join(' '), edInp); }); };
  $('peSave').onclick = function () {
    edCompute(function (build) {
      var mine = loadMine(), def = T('Muster {0}', [mine.filter(function (m) { return m.n === G.N; }).length + 1]);
      openNameDialog(def, function (nm) {
        var arr = loadMine();
        arr.push({ id: Date.now(), name: nm, n: G.N, c: Array.prototype.slice.call(edInp), alg: build.join(' ') });
        saveMine(arr); edToast('Gespeichert.');
      });
    });
  };
  // Eigene Tastatur (passt sich Hell/Dunkel und Akzentfarbe an)
  var KB_ROWS = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'], ['SHIFT', 'y', 'x', 'c', 'v', 'b', 'n', 'm', 'BACK']];
  var KB_BACK = '<svg viewBox="0 0 28 20"><path d="M9 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9L2 10z"/><path d="M13.5 7l6 6M19.5 7l-6 6"/></svg>';
  var KB_SHIFT = '<svg viewBox="0 0 24 24"><path d="M12 4l8 9h-5v7H9v-7H4z"/></svg>';
  function openNameDialog(def, done) {
    var val = def, shift = false, kb = '';
    KB_ROWS.forEach(function (row) {
      kb += '<div class="kbRow">';
      row.forEach(function (k) {
        if (k === 'SHIFT') kb += '<button class="kbKey wide" data-k="SHIFT" aria-label="Shift">' + KB_SHIFT + '</button>';
        else if (k === 'BACK') kb += '<button class="kbKey wide" data-k="BACK" aria-label="Löschen">' + KB_BACK + '</button>';
        else kb += '<button class="kbKey" data-k="' + k + '">' + k + '</button>';
      });
      kb += '</div>';
    });
    kb += '<div class="kbRow"><button class="kbKey" data-k="-">-</button><button class="kbKey" data-k=".">.</button><button class="kbKey space" data-k=" ">&nbsp;</button><button class="kbKey" data-k="ß">ß</button><button class="kbKey ok" data-k="OK">' + T('Speichern') + '</button></div>';
    openModal('<div class="spdTitle">' + T('Name des Musters') + '</div><div id="saveName" class="txtIn"></div><div id="kb">' + kb + '</div>', 'name');
    $('modal').classList.add('kbd');
    function show() {
      $('saveName').innerHTML = esc(val) + '<span class="caret"></span>';
      Array.prototype.forEach.call(document.querySelectorAll('#kb .kbKey'), function (b) {
        var k = b.dataset.k; if (k.length === 1 && k !== ' ') b.textContent = shift ? k.toUpperCase() : k;
        if (k === 'SHIFT') b.classList.toggle('on', shift);
      });
    }
    $('kb').onclick = function (e) {
      var b = e.target.closest ? e.target.closest('.kbKey') : null; if (!b) return;
      var k = b.dataset.k;
      if (k === 'SHIFT') shift = !shift;
      else if (k === 'BACK') { val = val.slice(0, -1); if (!val) shift = true; }
      else if (k === 'OK') { var nm = val.trim() || def; closeModal(); done(nm); return; }
      else if (val.length < 30) { val += shift ? (k === 'ß' ? 'ß' : k.toUpperCase()) : k; shift = false; }
      show();
    };
    shift = !val; show();
  }
  function confirmDelete(id) {
    var m = loadMine().filter(function (x) { return x.id === id; })[0]; if (!m) return;
    openModal('<div class="spdTitle bigT">' + T('Muster löschen?') + '</div><p class="bigP">' + esc(m.name) + '</p><div class="row bigRow"><button id="delNo">' + T('Abbrechen') + '</button><button id="delYes" class="primary">' + T('Löschen') + '</button></div>', 'confirm');
    $('modal').classList.add('big'); $('delNo').onclick = closeModal;
    $('delYes').onclick = function () { saveMine(loadMine().filter(function (x) { return x.id !== id; })); closeModal(); renderPatterns(); };
  }

  // ---------- Design: Hell/Dunkel + Akzentfarbe ----------
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var theme = store.get('zauber.theme') || (mq && mq.matches ? 'dark' : 'light');
  if (theme !== 'dark' && theme !== 'light') theme = 'light';
  var hue = parseFloat(store.get('zauber.hue')); if (isNaN(hue)) hue = 0;
  var pendHue = hue;
  function hsl2hex(h, s, l) {
    s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { var v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return ('0' + Math.round(v * 255).toString(16)).slice(-2); };
    return '#' + f(0) + f(8) + f(4);
  }
  function accentOf(h) { return hsl2hex(h, 72, theme === 'dark' ? 58 : 46); }
  function onAccent(col) {
    var r = parseInt(col.substr(1, 2), 16), g = parseInt(col.substr(3, 2), 16), b = parseInt(col.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#111' : '#fff';
  }
  var SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.4" stroke="none"/><g stroke-width="2" stroke-linecap="round" fill="none"><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></g></svg>';
  var MOON = '<svg viewBox="0 0 24 24"><path stroke="none" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>';
  function applyDesign() {
    var dark = theme === 'dark', root = document.documentElement, col = accentOf(hue);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.style.setProperty('--accent', col); root.style.setProperty('--on-accent', onAccent(col));
    if (window.setCubeAccent) setCubeAccent(col);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', dark ? '#1a1b1e' : '#2b2d31');
    var tb = $('themeBtn');
    tb.className = 'themeBtn ' + (dark ? 'toLight' : 'toDark');
    tb.innerHTML = (dark ? SUN : MOON) + '<span>' + T(dark ? 'Lightmode' : 'Darkmode') + '</span>';
    updateRingBtn(); drawRing();
    if ($('screen-lessons').classList.contains('active')) { if (lOpen && lCur) drawLessonThumbs(); else renderLessonList(); }
    if (plan && !$('solvePane').hidden) renderStep();
  }
  $('themeBtn').onclick = function () { theme = theme === 'dark' ? 'light' : 'dark'; store.set('zauber.theme', theme); applyDesign(); };
  function updateRingBtn() {
    var c4 = accentOf(pendHue), b = $('ringOk');
    b.style.background = c4; b.style.color = onAccent(c4);
    $('themeBtn').style.setProperty('--prev', c4);
    var sc = $('screen-settings'); sc.style.setProperty('--accent', c4); sc.style.setProperty('--on-accent', onAccent(c4));
  }
  var ring = $('ring'), ringCache = null, ringRect = null;
  function buildRingCache(W, d) {
    var cv = document.createElement('canvas'); cv.width = Math.round(W * d); cv.height = Math.round(W * d);
    var ctx = cv.getContext('2d'), cx = W / 2, rad = W * 0.415, th = W * 0.06;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineWidth = th + 0.8;
    for (var a2 = 0; a2 < 360; a2 += 1) {
      ctx.strokeStyle = 'hsl(' + a2 + ',75%,52%)'; ctx.beginPath();
      ctx.arc(cx, cx, rad, (a2 - 90.6) * Math.PI / 180, (a2 - 89.4) * Math.PI / 180); ctx.stroke();
    }
    return { cv: cv, w: cv.width };
  }
  function drawRing() {
    var r = ring.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    if (ring.width !== Math.round(r.width * d)) { ring.width = Math.round(r.width * d); ring.height = Math.round(r.height * d); }
    if (!ringCache || ringCache.w !== ring.width) ringCache = buildRingCache(r.width, d);
    var ctx = ring.getContext('2d'), W = r.width, cx = W / 2, rad = W * 0.415, th = W * 0.06;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ring.width, ring.height); ctx.drawImage(ringCache.cv, 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    var ang = (pendHue - 90) * Math.PI / 180, mx = cx + Math.cos(ang) * rad, my = cx + Math.sin(ang) * rad;
    ctx.beginPath(); ctx.arc(mx, my, th * 1.05, 0, Math.PI * 2); ctx.fillStyle = hsl2hex(pendHue, 75, 52); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(mx, my, th * 1.05 + 2, 0, Math.PI * 2); ctx.stroke();
  }
  var ringDrag = false, ringPt = null, ringRaf = 0;
  function ringFrame() {
    ringRaf = 0; if (!ringPt || !ringRect) return;
    var x = ringPt[0] - ringRect.left - ringRect.width / 2, y = ringPt[1] - ringRect.top - ringRect.height / 2;
    pendHue = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360; updateRingBtn(); drawRing();
  }
  function ringPick(e) { ringPt = [e.clientX, e.clientY]; if (!ringRaf) ringRaf = requestAnimationFrame(ringFrame); }
  ring.addEventListener('pointerdown', function (e) { ringDrag = true; ringRect = ring.getBoundingClientRect(); ring.setPointerCapture(e.pointerId); ringPick(e); });
  ring.addEventListener('pointermove', function (e) {
    if (!ringDrag) return;
    var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    ringPick(ev && ev.length ? ev[ev.length - 1] : e);
  });
  ring.addEventListener('pointerup', function () { ringDrag = false; });
  ring.addEventListener('pointercancel', function () { ringDrag = false; });
  $('ringOk').onclick = function () { hue = pendHue; store.set('zauber.hue', String(Math.round(hue))); applyDesign(); $('acc-design').classList.remove('open'); };

  // ---------- Würfelgröße wechseln ----------
  function renderSizeSeg() { Array.prototype.forEach.call($('sizeSeg').children, function (b) { b.className = (+b.dataset.n === cubeN) ? 'on' : ''; }); }
  Array.prototype.forEach.call($('sizeSeg').children, function (b) {
    b.onclick = function () {
      var n = +b.dataset.n; if (n === cubeN) return;
      cubeN = n; store.set('zauber.n', String(n)); G = n === 4 ? C4 : C3;
      stopAuto(); cubeView.setLib(G); previewView.setLib(G); solveView.setLib(G);
      undoStack = []; moves = 0; updStatus();
      closePalette(); clearInput(); refreshInput(); $('errBox').hidden = true;
      edClose(); editView.setLib(G); edReset(); edRefresh(); $('peErr').hidden = true; renderPatterns();
      auto = false; plan = null; $('solvePane').hidden = true; $('inputPane').hidden = false;
      curSec = n === 4 ? (curSec === 'not3' ? 'not4' : curSec === 'basic' ? 'x4' : curSec) : (curSec === 'x4' ? 'basic' : curSec === 'not4' ? 'not3' : curSec);
      renderSizeSeg(); renderEdIcons(); renderCubeBtns(); warmUp();
    };
  });

  function renderHlToggle() { var b = $('hlToggle'); b.textContent = T(hlOn ? 'An' : 'Aus'); b.classList.toggle('on', hlOn); }
  $('hlToggle').onclick = function () {
    hlOn = !hlOn; store.set('zauber.hl', hlOn ? '1' : '0'); renderHlToggle();
    if (plan && !$('solvePane').hidden) renderStep();
    if (lOpen && lCur) renderLesson();
  };

  // ---------- Sprache ----------
  var FLAGS = {
    de: '<rect width="60" height="13.4" fill="#000"/><rect y="13.4" width="60" height="13.3" fill="#d00"/><rect y="26.7" width="60" height="13.3" fill="#ffce00"/>',
    en: '<rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/>',
    es: '<rect width="60" height="40" fill="#aa151b"/><rect y="10" width="60" height="20" fill="#f1bf00"/>',
    fr: '<rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ef4135"/>',
    it: '<rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ce2b37"/>',
    th: '<rect width="60" height="40" fill="#a51931"/><rect y="6.7" width="60" height="26.6" fill="#f4f5f8"/><rect y="13.3" width="60" height="13.4" fill="#2d2a4a"/>'
  };
  function flagSvg(id) { return '<svg class="flag" viewBox="0 0 60 40" preserveAspectRatio="none">' + FLAGS[id] + '</svg>'; }
  function renderLangList() {
    var h = '';
    I18n.LANGS.forEach(function (l) { h += '<button class="langRow' + (l.id === I18n.getLang() ? ' on' : '') + '" data-l="' + l.id + '">' + flagSvg(l.id) + '<span>' + l.name + '</span></button>'; });
    $('langList').innerHTML = h;
  }
  $('langList').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.langRow') : null; if (!el) return;
    I18n.setLang(el.dataset.l); store.set('zauber.lang', el.dataset.l); refreshLang();
  });
  function refreshLang() {
    I18n.apply(); renderSpeedBtns(); renderLangList(); renderSizeSeg(); renderHlToggle(); renderDepthBtn(); renderDepthList(); renderEdIcons(); renderCubeBtns();
    $('aPause').textContent = T(autoPaused ? 'Weiter' : 'Pause');
    if (statusKey) updStatus(statusKey[0], statusKey[1]); else updStatus();
    applyDesign();
    if (plan && !$('solvePane').hidden) renderStep();
    if (lOpen && lCur) { $('lTitle').textContent = T(lCur.it.name); renderLesson(); } else if ($('screen-lessons').classList.contains('active')) renderLessonList();
    if ($('patEdit').hidden) renderPatterns();
  }
  I18n.setLang(store.get('zauber.lang') || 'de');
  refreshLang();
  updStatus();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
