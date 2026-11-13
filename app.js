(function () {
  'use strict';
  var C = CubeLib, S = SolverLib, LL = LessonLib, $ = function (id) { return document.getElementById(id); };
  var FACE_DE = { U: 'Oben', D: 'Unten', L: 'Links', R: 'Rechts', F: 'Vorne', B: 'Hinten' };
  var FACE_IDX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
  var SPEEDS = [['sehr langsam', 1200], ['langsam', 700], ['normal', 350], ['schnell', 150], ['sehr schnell', 70]];
  [['selSpeedCube', 350], ['selSpeed', 350], ['selSpeedLesson', 700]].forEach(function (a) {
    SPEEDS.forEach(function (s) {
      var o = document.createElement('option'); o.value = s[1]; o.textContent = s[0]; if (s[1] === a[1]) o.selected = true; $(a[0]).appendChild(o);
    });
  });

  var LEGEND = '<p><b>U</b> = Oben, <b>D</b> = Unten, <b>L</b> = Links, <b>R</b> = Rechts, <b>F</b> = Vorne, <b>B</b> = Hinten.</p>' +
    '<p>Ohne Zusatz: diese Seite eine Viertelumdrehung im Uhrzeigersinn drehen (mit Blick direkt auf die Seite). <b>\'</b> = gegen den Uhrzeigersinn. <b>2</b> = halbe Umdrehung.</p>' +
    '<p>Kleine Buchstaben (r, l, u, d, f, b) drehen zwei Schichten zugleich, M, E und S die mittlere Schicht, x, y und z den ganzen Würfel.</p>';
  var INFO = {
    cube: '<p><b>Schicht drehen:</b> Auf einen Stein tippen und in die gewünschte Richtung wischen. Die Schicht dreht sich mit.</p>' +
      '<p><b>Ansicht drehen:</b> Neben den Würfel wischen.</p>' +
      '<p><b>Bedienung wählen:</b> <b>Frei</b> = nichts ist fixiert (auf dem Würfel dreht eine Schicht, daneben die Ansicht). <b>Nur Ansicht</b> = jede Wischgeste dreht nur die Ansicht. <b>Nur Ebenen</b> = die Ansicht ist fixiert, es lassen sich nur Schichten des Würfels drehen.</p>' +
      '<p><b>Mischen</b> verdreht den Würfel zufällig, <b>Zurück</b> macht den letzten Zug rückgängig, <b>Neu</b> setzt zurück.</p>' +
      '<p><b>Lösen:</b> Der Würfel löst sich selbst. Du kannst pausieren, stoppen und das Tempo ändern.</p>',
    input: '<p><b>So geht es:</b> Tippe ein Feld auf dem Würfel an. Oben erscheint die Farbauswahl. Tippe die passende Farbe an, dann wird das Feld eingefärbt. Bereits gefärbte Felder kannst du erneut antippen und korrigieren. Die Auswahl schließt sich, wenn du eine Farbe wählst, irgendwo anders hintippst oder die Zurück-Taste deines Handys drückst.</p>' +
      '<p><b>Ansicht drehen:</b> Wische auf dem Würfel oder daneben, um auch Unterseite und Rückseite zu erreichen.</p>' +
      '<p><b>Mittelsteine</b> sind fest. Halte deinen Würfel so: <b>Gelb oben, Grün vorne</b> (dann ist Orange rechts, Rot links, Blau hinten, Weiß unten).</p>' +
      '<p>Jede Farbe kommt genau 9-mal vor (Zähler an der Farbauswahl).</p>' +
      '<p><b>Leeren</b> löscht alle Felder außer den Mittelsteinen. <b>Vom 3D-Würfel</b> übernimmt den Zustand aus dem Reiter Würfel.</p>'
  };

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
    $('modalText').innerHTML = html; modalKind = kind || ''; $('modal').hidden = false;
    if (!modalOpen) { modalOpen = true; pushBack('modal', hideModal); }
  }
  function hideModal() { $('modal').hidden = true; modalOpen = false; modalKind = ''; }
  function closeModal() { if (modalOpen) { hideModal(); popBack('modal'); } }
  document.querySelectorAll('[data-info]').forEach(function (b) { b.onclick = function () { openModal(INFO[b.dataset.info]); }; });
  $('modalClose').onclick = closeModal;
  $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };

  // ---------- Tabs ----------
  var cubeView, previewView, solveView, lessonView;
  function showTab(name) {
    ['cube', 'solve', 'lessons', 'settings'].forEach(function (n) {
      $('screen-' + n).classList.toggle('active', n === name);
      $('tab-' + n).classList.toggle('active', n === name);
    });
    setTimeout(function () { [cubeView, previewView, solveView, lessonView].forEach(function (v) { v && v.resize(); }); if (solveView && !$('solvePane').hidden) renderStep(); }, 30);
  }
  $('tab-cube').onclick = function () { showTab('cube'); };
  $('tab-solve').onclick = function () { showTab('solve'); };
  $('tab-lessons').onclick = function () { showTab('lessons'); if (!lOpen) renderLessonList(); };
  $('tab-settings').onclick = function () { showTab('settings'); pendHue = hue; setTimeout(function () { drawRing(); updateRingBtn(); }, 30); };

  // ---------- Funktion 1: freier 3D-Würfel ----------
  var undoStack = [], moves = 0;
  var autoRun = false, autoPaused = false, autoMoves = [], autoIdx = 0;
  cubeView = new CubeView($('cube3d'), { onTurn: function (t) { undoStack.push(t); moves++; updStatus(); } });
  function updStatus(txt) { $('cubeStatus').textContent = txt || ('Züge: ' + moves + (C.isSolved(cubeView.state) && moves ? ' - Gelöst!' : '')); }
  Array.prototype.forEach.call($('modeSeg').children, function (b) {
    b.onclick = function () {
      cubeView.mode = b.dataset.m;
      Array.prototype.forEach.call($('modeSeg').children, function (x) { x.className = x === b ? 'on' : ''; });
    };
  });
  function busy() { return cubeView.isBusy() || autoRun; }
  $('btnReset').onclick = function () {
    stopAuto(); cubeView.clearQueue(); cubeView.anim = null; cubeView.setState(C.solvedColors());
    undoStack = []; moves = 0; updStatus();
  };
  $('btnUndo').onclick = function () {
    if (busy() || !undoStack.length) return;
    var t = undoStack.pop(); moves = Math.max(0, moves - 1);
    cubeView.enqueue({ k: t.k, c: t.c, steps: -t.steps }, 200, function () { updStatus(); });
  };
  $('btnScramble').onclick = function () {
    if (busy()) return;
    undoStack = []; moves = 0; var last = -1, n = 0;
    while (n < 22) {
      var m = C.MOVE_NAMES[Math.floor(Math.random() * 18)];
      if (FACE_IDX[m[0]] === last) continue;
      last = FACE_IDX[m[0]]; n++; cubeView.enqueueName(m, 90);
    }
    updStatus('Mischen ...');
    cubeView.queue[cubeView.queue.length - 1].cb = function () { updStatus(); };
  };
  function speedCube() { return parseInt($('selSpeedCube').value, 10); }
  function autoStep() {
    if (!autoRun || autoPaused) return;
    if (autoIdx >= autoMoves.length) { stopAuto(); undoStack = []; moves = 0; updStatus('Gelöst!'); return; }
    var m = autoMoves[autoIdx];
    updStatus('Lösen: Zug ' + (autoIdx + 1) + ' von ' + autoMoves.length + ' (' + m + ')');
    cubeView.enqueueName(m, speedCube(), function () { autoIdx++; setTimeout(autoStep, 80); });
  }
  function stopAuto() {
    autoRun = false; autoPaused = false; $('autoBar').hidden = true; cubeView.layerDrag = true; $('aPause').textContent = 'Pause';
  }
  $('btnAutoSolve').onclick = function () {
    if (busy()) return;
    if (C.isSolved(cubeView.state)) { updStatus('Der Würfel ist schon gelöst.'); return; }
    updStatus('Berechne Lösung ...');
    setTimeout(function () {
      var r = S.solve(cubeView.state);
      if (!r.ok) { updStatus(r.error); return; }
      autoMoves = []; r.phases.forEach(function (p) { autoMoves = autoMoves.concat(p.moves); });
      autoIdx = 0; autoRun = true; autoPaused = false; cubeView.layerDrag = false;
      $('autoBar').hidden = false; $('aPause').textContent = 'Pause';
      autoStep();
    }, 30);
  };
  $('aPause').onclick = function () {
    if (!autoRun) return;
    autoPaused = !autoPaused; this.textContent = autoPaused ? 'Weiter' : 'Pause';
    if (autoPaused) updStatus('Pausiert (Zug ' + autoIdx + ' von ' + autoMoves.length + ')'); else autoStep();
  };
  $('aStop').onclick = function () { stopAuto(); cubeView.clearQueue(); undoStack = []; moves = 0; updStatus('Gestoppt'); };

  // ---------- Funktion 2: Muster direkt am 3D-Würfel eingeben ----------
  var inp = new Int8Array(54), sel = -1, toastT = null;
  function clearInput() { inp.fill(-1); for (var f = 0; f < 6; f++) inp[f * 9 + 4] = C.SCHEME[f]; sel = -1; }
  clearInput();
  var pal = $('palette'), palOpen = false;
  for (var c = 0; c < 6; c++) (function (c) {
    var b = document.createElement('button'); b.className = 'sw'; b.style.background = PALETTE[c];
    b.setAttribute('aria-label', C.COLOR_NAMES[c]); b.innerHTML = '<i></i>';
    b.onclick = function () { if (sel >= 0) { inp[sel] = c; closePalette(); $('errBox').hidden = true; refreshInput(); } };
    pal.appendChild(b);
  })(c);
  function hidePalette() { sel = -1; palOpen = false; if (previewView) previewView.selected = -1; pal.hidden = true; }
  function closePalette() { if (palOpen) { hidePalette(); popBack('pal'); } }
  function toast(t) { $('inToast').textContent = t; clearTimeout(toastT); toastT = setTimeout(function () { $('inToast').textContent = ''; }, 2000); }
  previewView = new CubeView($('preview3d'), {
    layerDrag: false,
    onTap: function (i) {
      if (i < 0) { closePalette(); return; }
      if (i % 9 === 4) { closePalette(); toast('Mittelsteine sind fest.'); return; }
      sel = i; previewView.selected = i; pal.hidden = false;
      if (!palOpen) { palOpen = true; pushBack('pal', hidePalette); }
    }
  });
  document.addEventListener('pointerdown', function (e) {
    if (!palOpen) return;
    if (pal.contains(e.target) || e.target === $('preview3d')) return;
    closePalette();
  }, true);
  function refreshInput() {
    var cnt = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 54; i++) if (inp[i] >= 0) cnt[inp[i]]++;
    for (var c2 = 0; c2 < 6; c2++) { var b = pal.children[c2].firstChild; b.textContent = cnt[c2] + '/9'; b.className = cnt[c2] === 9 ? 'ok' : (cnt[c2] > 9 ? 'bad' : ''); }
    previewView.setState(inp);
  }
  refreshInput();
  $('btnClear').onclick = function () { clearInput(); closePalette(); $('errBox').hidden = true; refreshInput(); };
  $('btnFromCube').onclick = function () { inp = Int8Array.from(cubeView.state); closePalette(); $('errBox').hidden = true; refreshInput(); toast('Zustand aus dem Reiter Würfel übernommen.'); };

  // ---------- Lösung abspielen ----------
  solveView = new CubeView($('solve3d'), { layerDrag: false });
  var flat = [], states = [], idx = 0, auto = false, follow = false, plan = null, LABELS = S.LABELS;
  $('btnCompute').onclick = function () {
    var err = $('errBox'); err.hidden = true; closePalette();
    $('btnCompute').textContent = 'Berechne ...'; $('btnCompute').disabled = true;
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
    r.phases.forEach(function (p) {
      p.startIdx = -1;
      p.segs.forEach(function (sg) {
        sg.moves.forEach(function (m, j) { if (p.startIdx < 0) p.startIdx = flat.length; flat.push({ m: m, p: p, seg: sg, pos: j, first: p.startIdx === flat.length }); });
      });
    });
    flat.forEach(function (st, i) { states.push(C.applyMove(states[i], st.m)); });
    idx = 0; auto = false; $('bAuto').textContent = 'Auto';
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
    var t = m.length === 1 ? 'im Uhrzeigersinn' : (m[1] === '2' ? 'halbe Umdrehung' : 'gegen den Uhrzeigersinn');
    return FACE_DE[m[0]] + ', ' + t;
  }
  function algHtml(st) {
    if (!st) return '<p>Keine weiteren Züge.</p>';
    var lab = LABELS[st.seg.k] || ['Zugfolge', ''];
    return '<div class="algName" style="margin-top:0">' + lab[0] + '</div><div class="algMoves">' + st.seg.moves.map(function (m, j) {
      return '<span class="' + (j < st.pos ? 'done' : j === st.pos ? 'cur' : '') + '">' + m + '</span>';
    }).join('') + '</div><div class="algText">' + lab[1] + '</div>';
  }
  function renderStep() {
    var n = flat.length, st = flat[idx];
    for (var i = 0; i < n; i++) $('chip' + i).className = 'chip' + (i < idx ? ' done' : '') + (i === idx ? ' cur' : '');
    var cur = $('chip' + Math.min(idx, n - 1)); if (cur) { var chs = $('chips'); chs.scrollLeft = cur.offsetLeft - chs.clientWidth / 2; }
    if (st) {
      $('moveBig').textContent = st.m; $('moveDesc').textContent = describe(st.m);
      $('phaseTitle').textContent = 'Phase ' + st.p.no + ' von 7: ' + st.p.name;
      solveView.highlight = FACE_IDX[st.m[0]];
      if (follow) solveView.setViewFor(FACE_IDX[st.m[0]]);
    } else {
      $('moveBig').textContent = 'Fertig'; $('moveDesc').textContent = 'Der Würfel ist gelöst!';
      $('phaseTitle').textContent = 'Fertig'; solveView.highlight = -1;
    }
    if (modalOpen && modalKind === 'alg') $('modalText').innerHTML = algHtml(st);
    $('stepInfo').textContent = 'Zug ' + Math.min(idx + (st ? 1 : 0), n) + ' von ' + n;
    drawNet($('netMini'), solveView.state, st ? FACE_IDX[st.m[0]] : -1);
  }
  function dur() { return parseInt($('selSpeed').value, 10); }
  function next(cb) {
    if (solveView.isBusy() || idx >= flat.length) { auto = false; $('bAuto').textContent = 'Auto'; return; }
    var m = flat[idx].m; idx++; solveView.highlight = -1;
    solveView.enqueueName(m, dur(), function () { renderStep(); if (cb) cb(); });
  }
  function back() {
    if (solveView.isBusy() || idx <= 0) return;
    idx--; solveView.highlight = -1; solveView.enqueueName(C.invertMove(flat[idx].m), dur(), renderStep);
  }
  function jump(i) {
    solveView.clearQueue(); solveView.anim = null; auto = false; $('bAuto').textContent = 'Auto';
    idx = i; solveView.setState(states[i]); renderStep();
  }
  $('bNext').onclick = function () { auto = false; $('bAuto').textContent = 'Auto'; next(); };
  $('bBack').onclick = function () { auto = false; $('bAuto').textContent = 'Auto'; back(); };
  $('bStart').onclick = function () { jump(0); };
  $('bAuto').onclick = function () {
    if (auto) { auto = false; this.textContent = 'Auto'; return; }
    if (idx >= flat.length) jump(0);
    auto = true; this.textContent = 'Pause';
    (function step() { if (!auto) return; next(function () { setTimeout(step, 120); }); })();
  };
  $('btnFollow').onclick = function () { follow = !follow; this.classList.toggle('on', follow); renderStep(); };
  $('btnAlg').onclick = function () { openModal(algHtml(flat[idx]), 'alg'); };
  $('btnPhaseInfo').onclick = function () {
    var st = flat[idx];
    openModal((st ? '<p><b>' + st.p.name + '</b></p><p>' + st.p.desc + '</p>' : '') + LEGEND +
      '<p><b>Folgen:</b> Die Ansicht dreht sich automatisch zu der Seite, die gedreht wird. <b>Rote Umrandung</b> = Seite, die du drehen musst. Das kleine Netz oben rechts zeigt alle sechs Seiten.</p>');
  };
  $('btnBackInput').onclick = function () {
    auto = false; solveView.clearQueue(); solveView.anim = null;
    $('solvePane').hidden = true; $('inputPane').hidden = false; setTimeout(function () { previewView.resize(); }, 30);
  };
  $('btnRecipe').onclick = function () {
    if (!plan) return;
    var h = '<p><b>Rezept: Schicht für Schicht</b></p><p>Die Lösung besteht aus 7 Schritten. Tippe auf einen Schritt, um dorthin zu springen.</p>';
    plan.phases.forEach(function (p) {
      var algs = [], seen = {};
      p.segs.forEach(function (sg) {
        if (sg.k === 'turn' || seen[sg.k]) return; seen[sg.k] = 1;
        algs.push('<code>' + (LABELS[sg.k] ? LABELS[sg.k][0] : sg.k) + ': ' + sg.moves.join(' ') + '</code>');
      });
      var done = p.moves.length === 0;
      h += '<div class="rcard' + (done ? ' done' : '') + '" data-start="' + (done ? -1 : p.startIdx) + '"><span class="no">' + p.no + '</span><b>' + p.name + '</b>' +
        '<div style="font-size:12px;margin-top:4px">' + p.desc + '</div>' +
        '<div class="meta">' + (done ? 'schon erledigt' : p.moves.length + ' Züge') + '</div>' + (done ? '' : algs.join('')) + '</div>';
    });
    openModal(h);
  };
  $('modalText').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.rcard') : null;
    if (!el) return; var st = parseInt(el.dataset.start, 10);
    if (st >= 0) { closeModal(); jump(st); }
  });

  // ---------- Lektionen ----------
  var curSec = 'basic', lMoves = [], lStates = [], lIdx = 0, lAuto = false, lOpen = false, lCur = null;
  lessonView = new CubeView($('lesson3d'), { layerDrag: false });
  function secById(id) { return LL.SECTIONS.filter(function (x) { return x.id === id; })[0]; }
  function cardHint(sec, it) {
    var a = LL.analyze(it);
    if (sec.id === 'oll') return 'Oben ' + a.yBefore + '/9 gelb, danach 9/9';
    if (sec.id === 'pll') return LL.summary(sec, it).replace(' Die Oberseite bleibt gelb.', '');
    if (sec.id === 'f2l') return 'Paar einsetzen';
    return it.desc ? it.desc.split('. ')[0].replace(/\.$/, '') : '';
  }
  function drawThumb(cv, sec, it) {
    var a = LL.analyze(it);
    if (sec.kind === 'oll') Thumbs.top(cv, a.full, 'oll');
    else if (sec.kind === 'pll') Thumbs.top(cv, a.full, 'pll', a.arrows);
    else Thumbs.iso(cv, a.start);
  }
  function renderLessonList() {
    var tabs = $('lessonTabs'); tabs.innerHTML = '';
    LL.SECTIONS.forEach(function (sec) {
      var b = document.createElement('button'); b.textContent = sec.name; if (sec.id === curSec) b.className = 'on';
      b.onclick = function () { curSec = sec.id; renderLessonList(); $('lessonListWrap').scrollTop = 0; };
      tabs.appendChild(b);
    });
    var sec = secById(curSec), h = '';
    sec.groups.forEach(function (g, gi) {
      h += '<div class="cat">' + g.name + '</div><div class="lgrid">';
      g.items.forEach(function (it, ii) {
        if (!LL.validFor(sec, it)) return;
        h += '<button class="lcard" data-g="' + gi + '" data-i="' + ii + '"><canvas class="thumb"></canvas><b>' + it.name + '</b><span class="hint">' + cardHint(sec, it) + '</span><small>' + it.alg + '</small></button>';
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
    if (sec.kind === 'oll') { Thumbs.top($('lBefore'), a.full, 'oll'); Thumbs.top($('lAfter'), C.solvedColors(), 'oll'); }
    else if (sec.kind === 'pll') { Thumbs.top($('lBefore'), a.full, 'pll', a.arrows); Thumbs.top($('lAfter'), C.solvedColors(), 'pll'); }
    else { Thumbs.iso($('lBefore'), a.start); Thumbs.iso($('lAfter'), a.after); }
  }
  function openLesson(sec, grp, it) {
    var a = LL.analyze(it); lCur = { sec: sec, grp: grp, it: it }; lMoves = a.moves; lStates = [a.start];
    lMoves.forEach(function (m, i) { lStates.push(C.applyMove(lStates[i], m)); });
    lIdx = 0; lAuto = false; $('lAuto').textContent = 'Auto';
    $('lTitle').textContent = it.name;
    $('lessonListWrap').hidden = true; $('lessonDetail').hidden = false;
    if (!lOpen) { lOpen = true; pushBack('lesson', hideLesson); }
    setTimeout(function () {
      lessonView.resize(); lessonView.clearQueue(); lessonView.anim = null; lessonView.setState(lStates[0]); renderLesson(); drawLessonThumbs();
    }, 40);
  }
  $('btnLInfo').onclick = function () {
    if (!lCur) return;
    openModal('<div class="lGroup">' + lCur.sec.name + ' / ' + lCur.grp.name + '</div><p><b>' + lCur.it.name + '</b></p><p>' + LL.summary(lCur.sec, lCur.it) + '</p>' +
      '<div class="notation">' + lCur.it.alg + '</div>' + LEGEND +
      '<p>Farbig sind die beteiligten Steine, grau alle anderen. Rote Umrandung = Seite, die gedreht wird. Oben im Bild siehst du den Zustand vorher und nachher.</p>');
  };
  function hideLesson() { lAuto = false; lOpen = false; lessonView.clearQueue(); lessonView.anim = null; $('lessonDetail').hidden = true; $('lessonListWrap').hidden = false; renderLessonList(); }
  function closeLesson() { if (lOpen) { hideLesson(); popBack('lesson'); } }
  $('lBack').onclick = closeLesson;
  function renderLesson() {
    $('lMoves').innerHTML = lMoves.map(function (m, j) { return '<span class="' + (j < lIdx ? 'done' : j === lIdx ? 'cur' : '') + '">' + m + '</span>'; }).join('');
    var cur = $('lMoves').children[Math.min(lIdx, lMoves.length - 1)]; if (cur) $('lMoves').scrollLeft = cur.offsetLeft - $('lMoves').clientWidth / 2;
    $('lInfo').textContent = lIdx >= lMoves.length ? 'Fertig: Die beteiligten Steine sind an ihrem Platz.' : 'Zug ' + (lIdx + 1) + ' von ' + lMoves.length;
    lessonView.highlight = lIdx < lMoves.length ? C.faceOfMove(lMoves[lIdx]) : -1;
  }
  function lDur() { return parseInt($('selSpeedLesson').value, 10); }
  function lNext(cb) {
    if (lessonView.isBusy() || lIdx >= lMoves.length) { lAuto = false; $('lAuto').textContent = 'Auto'; return; }
    var m = lMoves[lIdx]; lIdx++; lessonView.highlight = -1;
    lessonView.enqueueName(m, lDur(), function () { renderLesson(); if (cb) cb(); });
  }
  function lPrev() {
    if (lessonView.isBusy() || lIdx <= 0) return;
    lIdx--; lessonView.highlight = -1; lessonView.enqueueName(C.invertMove(lMoves[lIdx]), lDur(), renderLesson);
  }
  function lJump(i) { lessonView.clearQueue(); lessonView.anim = null; lAuto = false; $('lAuto').textContent = 'Auto'; lIdx = i; lessonView.setState(lStates[i]); renderLesson(); }
  $('lNext').onclick = function () { lAuto = false; $('lAuto').textContent = 'Auto'; lNext(); };
  $('lBackStep').onclick = function () { lAuto = false; $('lAuto').textContent = 'Auto'; lPrev(); };
  $('lStart').onclick = function () { lJump(0); };
  $('lAuto').onclick = function () {
    if (lAuto) { lAuto = false; this.textContent = 'Auto'; return; }
    if (lIdx >= lMoves.length) lJump(0);
    lAuto = true; this.textContent = 'Pause';
    (function step() { if (!lAuto) return; lNext(function () { setTimeout(step, 150); }); })();
  };

  // ---------- Design: Hell/Dunkel + Akzentfarbe ----------
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
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
    tb.innerHTML = (dark ? SUN : MOON) + '<span>' + (dark ? 'Lightmode' : 'Darkmode') + '</span>';
    updateRingBtn(); drawRing();
    if ($('screen-lessons').classList.contains('active')) { if (lOpen && lCur) drawLessonThumbs(); else renderLessonList(); }
    if (!$('solvePane').hidden) renderStep();
  }
  $('themeBtn').onclick = function () { theme = theme === 'dark' ? 'light' : 'dark'; store.set('zauber.theme', theme); applyDesign(); };
  function updateRingBtn() { var c4 = accentOf(pendHue), b = $('ringOk'); b.style.background = c4; b.style.color = onAccent(c4); }
  var ring = $('ring');
  function drawRing() {
    var r = ring.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    if (ring.width !== Math.round(r.width * d)) { ring.width = Math.round(r.width * d); ring.height = Math.round(r.height * d); }
    var ctx = ring.getContext('2d'), W = r.width, cx = W / 2, rad = W * 0.415, th = W * 0.06;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, W); ctx.lineWidth = th + 0.8;
    for (var a = 0; a < 360; a += 1) {
      ctx.strokeStyle = 'hsl(' + a + ',75%,52%)'; ctx.beginPath();
      ctx.arc(cx, cx, rad, (a - 90.6) * Math.PI / 180, (a - 89.4) * Math.PI / 180); ctx.stroke();
    }
    var ang = (pendHue - 90) * Math.PI / 180, mx = cx + Math.cos(ang) * rad, my = cx + Math.sin(ang) * rad;
    ctx.beginPath(); ctx.arc(mx, my, th * 1.05, 0, Math.PI * 2); ctx.fillStyle = hsl2hex(pendHue, 75, 52); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(mx, my, th * 1.05 + 2, 0, Math.PI * 2); ctx.stroke();
  }
  var ringDrag = false;
  function ringPick(e) {
    var r = ring.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    pendHue = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360; updateRingBtn(); drawRing();
  }
  ring.addEventListener('pointerdown', function (e) { ringDrag = true; ring.setPointerCapture(e.pointerId); ringPick(e); });
  ring.addEventListener('pointermove', function (e) { if (ringDrag) ringPick(e); });
  ring.addEventListener('pointerup', function () { ringDrag = false; });
  ring.addEventListener('pointercancel', function () { ringDrag = false; });
  $('ringOk').onclick = function () { hue = pendHue; store.set('zauber.hue', String(Math.round(hue))); applyDesign(); };
  $('accReset').onclick = function () { pendHue = 0; updateRingBtn(); drawRing(); };
  applyDesign();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
