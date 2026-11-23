/* Zauber – Löser für den 4x4-Würfel (Reduktionsmethode: Zentren, Kanten paaren, Parität, dann 3x3) */
(function (root) {
  'use strict';
  var C4 = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js').make(4) : root.Cube4;
  var S = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./solver.js') : root.SolverLib;
  var st = C4.stickers, SZ = 96;
  var BASES = {"cSmall": ["u L u' l u L' u' l'", "u' F u b u' F' u b'", "d' L d r d' L' d r'", "l B l' f l B' l' f'", "r F r' f r F' r' f'", "f D f' u f D' f' u'", "b U b' u b U' b' u'", "b' L b r b' L' b r'", "u' L u r2 u' L' u r2", "d F d' f2 d F' d' f2", "l U l' u2 l U' l' u2", "l' D2 l u l' D2 l u'", "r B r' f2 r B' r' f2", "f D f' u2 f D' f' u2", "f' L2 f r f' L2 f r'", "b' U b d2 b' U' b d2", "d L2 d' l2 d L2 d' l2", "r' U2 r u2 r' U2 r u2"], "cBig": ["u L u' l u L' u' l'", "u L' u' l u L u' l'", "u R u' l' u R' u' l", "u R' u' r u R u' r'", "u F u' b' u F' u' b", "u B u' f u B' u' f'", "u B' u' f u B u' f'", "u' L u r' u' L' u r", "u' R' u r u' R u r'", "u' F' u f' u' F u f", "d L d' l d L' d' l'", "d L' d' l d L d' l'", "d R d' l' d R' d' l", "d R' d' r d R d' r'", "d F d' b' d F' d' b", "d B d' f d B' d' f'", "d B' d' f d B d' f'", "d' L d r' d' L' d r", "d' R' d r d' R d r'", "d' F' d f' d' F d f", "l U l' u l U' l' u'", "l U' l' u l U l' u'", "l D l' u' l D' l' u", "l D' l' d l D l' d'", "l F l' b' l F' l' b", "l B l' f l B' l' f'", "l B' l' f l B l' f'", "l' U l d' l' U' l d", "l' D' l d l' D l d'", "l' F' l f' l' F l f", "r U r' u r U' r' u'", "r U' r' u r U r' u'", "r D r' u' r D' r' u", "r D' r' d r D r' d'", "r F r' b' r F' r' b", "r B r' f r B' r' f'", "r B' r' f r B r' f'", "r' U r d' r' U' r d", "r' D' r d r' D r d'", "r' F' r f' r' F r f", "f U f' u f U' f' u'", "f U' f' u f U f' u'", "f D f' u' f D' f' u", "f D' f' d f D f' d'", "f L f' r' f L' f' r", "f R f' l f R' f' l'", "f R' f' l f R f' l'", "f' U f d' f' U' f d", "f' D' f d f' D f d'", "f' L' f l' f' L f l", "b U b' u b U' b' u'", "b U' b' u b U b' u'", "b D b' u' b D' b' u", "b D' b' d b D b' d'", "b L b' r' b L' b' r", "b R b' l b R' b' l'", "b R' b' l b R b' l'", "b' U b d' b' U' b d", "b' D' b d b' D b d'", "b' L' b l' b' L b l", "u L u' l2 u L' u' l2", "u L2 u' l u L2 u' l'", "u R u' r2 u R' u' r2", "u R2 u' r u R2 u' r'", "u F' u' b2 u F u' b2", "u B u' f2 u B' u' f2", "u B2 u' f u B2 u' f'", "u' L' u l2 u' L u l2", "u' R u l2 u' R' u l2", "u' R2 u r' u' R2 u r", "u' F2 u b u' F2 u b'", "u' B2 u f u' B2 u f'", "d L d' r2 d L' d' r2", "d L2 d' r d L2 d' r'", "d R' d' r2 d R d' r2", "d F d' f2 d F' d' f2", "d F2 d' f d F2 d' f'", "d B d' b2 d B' d' b2", "d B2 d' b d B2 d' b'", "d' L2 d l' d' L2 d l", "d' R2 d l d' R2 d l'", "d' F d b2 d' F' d b2", "d' F2 d b' d' F2 d b", "d' B2 d b d' B2 d b'", "l U' l' d2 l U l' d2", "l D l' u2 l D' l' u2", "l D2 l' u l D2 l' u'", "l F l' b2 l F' l' b2", "l F2 l' b l F2 l' b'", "l B' l' b2 l B l' b2", "l' U l d2 l' U' l d2", "l' U2 l d l' U2 l d'", "l' D2 l u' l' D2 l u", "l' F2 l f l' F2 l f'", "l' B' l b2 l' B l b2", "r U r' u2 r U' r' u2", "r U2 r' u r U2 r' u'", "r D r' d2 r D' r' d2", "r D2 r' d r D2 r' d'", "r F' r' b2 r F r' b2", "r B r' f2 r B' r' f2", "r B2 r' f r B2 r' f'", "r' U' r u2 r' U r u2", "r' D r u2 r' D' r u2", "r' D2 r d' r' D2 r d", "r' F2 r b r' F2 r b'", "r' B2 r f r' B2 r f'", "f U f' d2 f U' f' d2", "f U2 f' d f U2 f' d'", "f D' f' d2 f D f' d2", "f L f' l2 f L' f' l2", "f L2 f' l f L2 f' l'", "f R f' r2 f R' f' r2", "f R2 f' r f R2 f' r'", "f' U2 f u' f' U2 f u", "f' D2 f u f' D2 f u'", "f' L f r2 f' L' f r2", "f' L2 f r' f' L2 f r", "f' R2 f r f' R2 f r'", "b U' b' d2 b U b' d2", "b D b' u2 b D' b' u2", "b D2 b' u b D2 b' u'", "b L b' r2 b L' b' r2", "b L2 b' r b L2 b' r'", "b R' b' r2 b R b' r2", "b' U b d2 b' U' b d2", "b' U2 b d b' U2 b d'", "b' D2 b u' b' D2 b u", "b' L2 b l b' L2 b l'", "b' R' b r2 b' R b r2", "u L2 u' l2 u L2 u' l2", "u F2 u' f2 u F2 u' f2", "u' L2 u r2 u' L2 u r2", "u' B2 u f2 u' B2 u f2", "d R2 d' r2 d R2 d' r2", "d' L2 d l2 d' L2 d l2", "d' F2 d f2 d' F2 d f2", "l U2 l' d2 l U2 l' d2", "l B2 l' f2 l B2 l' f2", "l' D2 l d2 l' D2 l d2", "r U2 r' u2 r U2 r' u2", "r F2 r' f2 r F2 r' f2", "r' U2 r d2 r' U2 r d2", "r' B2 r f2 r' B2 r f2", "f D2 f' d2 f D2 f' d2", "f' U2 f u2 f' U2 f u2", "f' L2 f l2 f' L2 f l2", "b U2 b' d2 b U2 b' d2", "b R2 b' l2 b R2 b' l2", "b' D2 b d2 b' D2 b d2"], "wSmall": ["u L u' R u L' u' R'", "u' L' u R' u' L u R", "d R' d' L d R d' L'", "d' F d B' d' F' d B", "l B l' F l B' l' F'", "l' B' l F' l' B l F", "r' U' r D r' U r D'", "f D f' U' f D' f' U", "f' L f R f' L' f R'", "b L' b' R' b L b' R", "b' R' b L b' R b L'", "u' L' u R2 u' L u R2", "d R d' L2 d R' d' L2", "d' R2 d L' d' R2 d L", "l F2 l' B l F2 l' B'", "l' B' l F2 l' B l F2", "r' U r D2 r' U' r D2", "f U2 f' D' f U2 f' D", "f' D2 f U f' D2 f U'", "b L' b' R2 b L b' R2", "b' R b L2 b' R' b L2", "d' B2 d F2 d' B2 d F2", "f L2 f' R2 f L2 f' R2", "u2 F2 u2 r2 u2 F2 u2 r2"], "wBig": ["u L u' R u L' u' R'", "u L' u' R' u L u' R", "u R' u' L u R u' L'", "u F u' B' u F' u' B", "u B u' F u B' u' F'", "u B' u' F' u B u' F", "u' L' u R u' L u R'", "u' R u L' u' R' u L", "u' F u B u' F' u B'", "u' F' u B' u' F u B", "u' B' u F u' B u F'", "d L d' R' d L' d' R", "d R d' L d R' d' L'", "d R' d' L' d R d' L", "d F' d' B d F d' B'", "d B d' F' d B' d' F", "d' L d R d' L' d R'", "d' L' d R' d' L d R", "d' R' d L d' R d L'", "d' F d B' d' F' d B", "d' B d F d' B' d F'", "d' B' d F' d' B d F", "l U' l' D l U l' D'", "l D l' U' l D' l' U", "l F l' B l F' l' B'", "l B l' F l B' l' F'", "l B' l' F' l B l' F", "l' U' l D l' U l D'", "l' D l U' l' D' l U", "l' F l B l' F' l B'", "l' F' l B' l' F l B", "l' B' l F l' B l F'", "r U r' D' r U' r' D", "r D r' U r D' r' U'", "r D' r' U' r D r' U", "r F' r' B r F r' B'", "r B r' F' r B' r' F", "r' U r D r' U' r D'", "r' U' r D' r' U r D", "r' D' r U r' D r U'", "r' F r B' r' F' r B", "r' B r F r' B' r F'", "r' B' r F' r' B r F", "f U' f' D f U f' D'", "f D f' U' f D' f' U", "f L f' R f L' f' R'", "f L' f' R' f L f' R", "f R' f' L f R f' L'", "f' U f D' f' U' f D", "f' D f U f' D' f U'", "f' L f R f' L' f R'", "f' L' f R' f' L f R", "f' R' f L f' R f L'", "b U b' D' b U' b' D", "b D b' U b D' b' U'", "b D' b' U' b D b' U", "b L' b' R b L b' R'", "b R b' L' b R' b' L", "b' U b D b' U' b D'", "b' U' b D' b' U b D", "b' D' b U b' D b U'", "b' L b R' b' L' b R", "b' R b L b' R' b L'", "b' R' b L' b' R b L", "u L2 u' R u L2 u' R'", "u R' u' L2 u R u' L2", "u F u' B2 u F' u' B2", "u F2 u' B' u F2 u' B", "u B2 u' F u B2 u' F'", "u' L' u R2 u' L u R2", "u' R u L2 u' R' u L2", "u' R2 u L' u' R2 u L", "u' F2 u B u' F2 u B'", "u' B' u F2 u' B u F2", "d L d' R2 d L' d' R2", "d R d' L2 d R' d' L2", "d R2 d' L' d R2 d' L", "d F2 d' B d F2 d' B'", "d B' d' F2 d B d' F2", "d' L d R2 d' L' d R2", "d' L2 d R' d' L2 d R", "d' R2 d L d' R2 d L'", "d' F' d B2 d' F d B2", "d' B d F2 d' B' d F2", "d' B2 d F' d' B2 d F", "l U2 l' D l U2 l' D'", "l D' l' U2 l D l' U2", "l F l' B2 l F' l' B2", "l F2 l' B' l F2 l' B", "l B2 l' F l B2 l' F'", "l' U' l D2 l' U l D2", "l' D l U2 l' D' l U2", "l' D2 l U' l' D2 l U", "l' F2 l B l' F2 l B'", "l' B' l F2 l' B l F2", "r U r' D2 r U' r' D2", "r U2 r' D' r U2 r' D", "r D2 r' U r D2 r' U'", "r F' r' B2 r F r' B2", "r B r' F2 r B' r' F2", "r' U r D2 r' U' r D2", "r' U2 r D' r' U2 r D", "r' D2 r U r' D2 r U'", "r' F' r B2 r' F r B2", "r' B r F2 r' B' r F2", "r' B2 r F' r' B2 r F", "f U2 f' D f U2 f' D'", "f D' f' U2 f D f' U2", "f L f' R2 f L' f' R2", "f L2 f' R' f L2 f' R", "f R2 f' L f R2 f' L'", "f' U' f D2 f' U f D2", "f' D f U2 f' D' f U2", "f' D2 f U' f' D2 f U", "f' L2 f R f' L2 f R'", "f' R' f L2 f' R f L2", "b U b' D2 b U' b' D2", "b U2 b' D' b U2 b' D", "b D2 b' U b D2 b' U'", "b L' b' R2 b L b' R2", "b R b' L2 b R' b' L2", "b R2 b' L' b R2 b' L", "b' U2 b D b' U2 b D'", "b' D' b U2 b' D b U2", "b' L b R2 b' L' b R2", "b' R b L2 b' R' b L2", "b' R2 b L' b' R2 b L", "u F2 u' B2 u F2 u' B2", "u' R2 u L2 u' R2 u L2", "d L2 d' R2 d L2 d' R2", "d B2 d' F2 d B2 d' F2", "d' F2 d B2 d' F2 d B2", "l D2 l' U2 l D2 l' U2", "l' U2 l D2 l' U2 l D2", "l' B2 l F2 l' B2 l F2", "r F2 r' B2 r F2 r' B2", "r' D2 r U2 r' D2 r U2", "f U2 f' D2 f U2 f' D2", "f R2 f' L2 f R2 f' L2", "f' L2 f R2 f' L2 f R2", "b D2 b' U2 b D2 b' U2", "b' U2 b D2 b' U2 b D2", "b' R2 b L2 b' R2 b L2", "u2 R2 u2 f2 u2 R2 u2 f2", "u2 F2 u2 r2 u2 F2 u2 r2", "l2 U2 l2 f2 l2 U2 l2 f2", "l2 D2 l2 b2 l2 D2 l2 b2", "l2 B2 l2 u2 l2 B2 l2 u2", "f2 U2 f2 r2 f2 U2 f2 r2", "f2 L2 f2 u2 f2 L2 f2 u2"]};
  var types = st.map(function (s) { var e = s.p.filter(function (v) { return Math.abs(v) === 1.5; }).length; return e === 3 ? 'c' : e === 2 ? 'w' : 'm'; });
  function subsystem(t) {
    var idx = [], pos = {}; st.forEach(function (s, i) { if (types[i] === t) { pos[i] = idx.length; idx.push(i); } });
    return { idx: idx, pos: pos, n: idx.length };
  }
  var CS = subsystem('m'), WS = subsystem('w');
  var FACES = ['U', 'D', 'L', 'R', 'F', 'B'], SFX = ['', "'", '2'];
  var M36 = []; FACES.forEach(function (f) { SFX.forEach(function (s) { M36.push(f + s); }); }); FACES.forEach(function (f) { SFX.forEach(function (s) { M36.push(f.toLowerCase() + s); }); });
  function ident(n) { var a = new Uint8Array(n); for (var i = 0; i < n; i++) a[i] = i; return a; }
  function comp(a, b) { var o = new Uint8Array(a.length); for (var i = 0; i < a.length; i++) o[i] = a[b[i]]; return o; }
  function inv(p) { var o = new Uint8Array(p.length); for (var i = 0; i < p.length; i++) o[p[i]] = i; return o; }
  function subPerm(sys, m) { var p = C4.permOfMove(m); return Uint8Array.from(sys.idx.map(function (i) { return sys.pos[p[i]]; })); }
  function seqPerm(sys, moves) { var p = ident(sys.n); moves.forEach(function (m) { p = comp(p, subPerm(sys, m)); }); return p; }
  function baseList(strs, sys) { return strs.map(function (s) { var mv = C4.parseAlg(s); return { moves: mv, p: seqPerm(sys, mv) }; }); }
  var setupWords = null;
  function words() {
    if (setupWords) return setupWords;
    var w = [[]]; M36.forEach(function (a) { w.push([a]); });
    var base = function (m) { return m.replace(/['2]/, ''); };
    M36.forEach(function (a) { M36.forEach(function (b) { if (base(a) !== base(b)) w.push([a, b]); }); });
    setupWords = w; return w;
  }
  var words3 = null;
  function wordsDeep() {
    if (words3) return words3;
    var w = [], base = function (m) { return m.replace(/['2]/, ''); };
    M36.forEach(function (a) { M36.forEach(function (b) { if (base(a) === base(b)) return; M36.forEach(function (c) { if (base(b) !== base(c)) w.push([a, b, c]); }); }); });
    words3 = w; return w;
  }
  var cache = {};
  function wordPerms(sys, list, key) {
    if (cache[key]) return cache[key];
    var sp = list.map(function (w) { return seqPerm(sys, w); });
    return (cache[key] = { sp: sp, spi: sp.map(inv) });
  }
  var CB = {}, WBs = {};
  // Gemeinsame Greedy-Suche: sys = Teilsystem, state = Array der Aufkleber im Teilsystem, score(state) -> {n, ok(i)} Verlustprüfung
  function greedy(sys, st0, scoreFn, small, big, label, limit, thorough) {
    var cur = st0, out = [], guard = 0;
    var levels = [{ b: small, w: words(), k: 'w2' }, { b: big, w: words(), k: 'w2' }, { b: big, w: wordsDeep(), k: 'w3' }];
    while (guard++ < limit) {
      var cs = scoreFn(cur); if (cs.total === cs.max) break;
      var best = null;
      for (var li = 0; li < levels.length && (!best || thorough >= 2 || (thorough === 1 && li < 2)); li++) {
        var L = levels[li], wp = wordPerms(sys, L.w, sys.n + L.k);
        for (var si = 0; si < L.w.length; si++) for (var bi = 0; bi < L.b.length; bi++) {
          var M = comp(comp(wp.sp[si], L.b[bi].p), wp.spi[si]);
          var nw = new Uint8Array(sys.n); for (var i = 0; i < sys.n; i++) nw[i] = cur[M[i]];
          var ns = scoreFn(nw, cs);
          if (ns.lost || ns.total <= cs.total) continue;
          var len = L.w[si].length * 2 + L.b[bi].moves.length, val = (ns.total - cs.total) / len;
          if (!best || val > best.val) best = { val: val, si: si, bi: bi, len: len, nw: nw, L: L };
        }
      }
      if (!best) return null;
      var wd = best.L.w[best.si], moves = wd.concat(best.L.b[best.bi].moves, C4.invertMoves(wd));
      out.push({ k: label, moves: moves }); cur = best.nw;
    }
    return { state: cur, segs: out };
  }
  // ---------- Schnelle Zentren-Lösung: drei Stufen, jeweils kürzeste Zugfolge per Breitensuche ----------
  var CF = null;
  function centerTables() {
    if (CF) return CF;
    var packPos = [], bitOf = new Array(24), a, f, j;
    for (a = 0; a < 3; a++) for (f = a; f < 6; f += 3) for (j = 0; j < CS.n; j++) if (st[CS.idx[j]].face === f) { bitOf[j] = packPos.length; packPos.push(j); }
    var faceOfBit = packPos.map(function (jj) { return st[CS.idx[jj]].face; });
    var binom = []; for (var n0 = 0; n0 <= 24; n0++) { binom[n0] = []; for (var k0 = 0; k0 <= 8; k0++) binom[n0][k0] = (k0 === 0) ? 1 : (n0 === 0 ? 0 : binom[n0 - 1][k0 - 1] + binom[n0 - 1][k0]); }
    var POP = new Uint8Array(256); for (var pv = 1; pv < 256; pv++) POP[pv] = POP[pv >> 1] + (pv & 1);
    var RT = [0, 1, 2].map(function (bt) { var tb = []; for (var cc = 0; cc <= 8; cc++) { var arr = new Int32Array(256); for (var vv = 0; vv < 256; vv++) { var k = cc, r = 0; for (var bp = 0; bp < 8; bp++) if (vv >> bp & 1) { k++; r += binom[bt * 8 + bp][k] || 0; } arr[vv] = r; } tb.push(arr); } return tb; });
    function rank8(mask) { var b0 = mask & 255, b1 = (mask >> 8) & 255, b2 = (mask >> 16) & 255; return RT[0][0][b0] + RT[1][POP[b0]][b1] + RT[2][POP[b0] + POP[b1]][b2]; }
    var idx70 = new Int16Array(256).fill(-1), c70 = 0; for (var v = 0; v < 256; v++) { var pc = 0; for (var q = 0; q < 8; q++) pc += v >> q & 1; if (pc === 4) idx70[v] = c70++; }
    var tabs = {};
    function moveTab(name) {
      if (tabs[name]) return tabs[name];
      var g = subPerm(CS, name), dest = new Array(24); // neu[j] = alt[g[j]]
      for (var jj = 0; jj < 24; jj++) dest[bitOf[g[jj]]] = bitOf[jj];
      var t = [new Int32Array(256), new Int32Array(256), new Int32Array(256)];
      for (var bt = 0; bt < 3; bt++) for (var val = 0; val < 256; val++) { var o = 0; for (var bb = 0; bb < 8; bb++) if (val >> bb & 1) o |= 1 << dest[bt * 8 + bb]; t[bt][val] = o; }
      return (tabs[name] = t);
    }
    function app(t, m) { return t[0][m & 255] | t[1][(m >> 8) & 255] | t[2][(m >> 16) & 255]; }
    function names(kind) {
      var out = [];
      FACES.forEach(function (fc) { SFX.forEach(function (sf) { out.push(fc + sf); }); });
      FACES.forEach(function (fc) {
        var lc = fc.toLowerCase();
        SFX.forEach(function (sf) {
          if (kind === 1) out.push(lc + sf);
          else if (kind === 2) { if ((lc === 'u' || lc === 'd') || sf === '2') out.push(lc + sf); }
          else if (sf === '2') out.push(lc + sf);
        });
      });
      return out;
    }
    function bfs(kind, goal, keyFn) {
      var mv = names(kind).map(function (nm) { return { name: nm, t: moveTab(nm) }; }), dist = keyFn.size ? new Uint8Array(keyFn.size).fill(255) : null, map = dist ? null : new Map();
      var queue = [goal], head = 0;
      function get(m) { return dist ? dist[keyFn(m)] : (map.has(m) ? map.get(m) : 255); }
      function set(m, d) { if (dist) dist[keyFn(m)] = d; else map.set(m, d); }
      set(goal, 0);
      while (head < queue.length) {
        var cur = queue[head++], d = get(cur);
        for (var i = 0; i < mv.length; i++) { var nm2 = app(mv[i].t, cur); if (get(nm2) === 255) { set(nm2, d + 1); queue.push(nm2); } }
      }
      return { mv: mv, get: get };
    }
    function k1(m) { return rank8(m); } k1.size = binom[24][8];
    function k3(m) { return (idx70[m & 255] * 70 + idx70[(m >> 8) & 255]) * 70 + idx70[(m >> 16) & 255]; } k3.size = 70 * 70 * 70;
    var goal1 = 0, goal2 = 0, goal3 = 0;
    for (var b = 0; b < 24; b++) { var fb = faceOfBit[b]; if (fb === 0 || fb === 3) goal1 |= 1 << b; if (fb === 1 || fb === 4) goal2 |= 1 << b; if (fb < 3) goal3 |= 1 << b; }
    CF = { packPos: packPos, bitOf: bitOf, faceOfBit: faceOfBit, goal: [0, goal1, goal2, goal3], app: app,
      s1: bfs(1, goal1, k1), s2: bfs(2, goal2, function () { return 0; }), s3: bfs(3, goal3, k3) };
    return CF;
  }
  function descend(stage, mask, goal, out) {
    var cur = mask, d = stage.get(cur), guard = 0;
    if (d === 255) return false;
    while (d > 0 && guard++ < 40) {
      var found = false;
      for (var i = 0; i < stage.mv.length; i++) { var nm = CF.app(stage.mv[i].t, cur); if (stage.get(nm) === d - 1) { out.push(stage.mv[i].name); cur = nm; d--; found = true; break; } }
      if (!found) return false;
    }
    return cur === goal;
  }
  function centersFast(state, T) {
    var F = centerTables(), col = function (j) { return state[CS.idx[j]]; }, out = [], b, j, mask;
    var segs = [];
    function mk(f) { var m = 0; for (b = 0; b < 24; b++) { if (f(col(F.packPos[b]), F.faceOfBit[b])) m |= 1 << b; } return m; }
    var cur = Uint8Array.from(state), st1 = [], st2 = [], st3 = [];
    mask = mk(function (c) { return c === T[0] || c === T[3]; });
    if (!descend(F.s1, mask, F.goal[1], st1)) return null;
    cur = C4.applyMoves(cur, st1);
    mask = mk2(cur, function (c, f) { return f !== 0 && f !== 3 && (c === T[1] || c === T[4]); });
    if (!descend(F.s2, mask, F.goal[2], st2)) return null;
    cur = C4.applyMoves(cur, st2);
    mask = mk2(cur, function (c, f) { return c === T[f % 3]; });
    if (!descend(F.s3, mask, F.goal[3], st3)) return null;
    function mk2(stt, f) { var m = 0; for (var bb = 0; bb < 24; bb++) { if (f(stt[CS.idx[F.packPos[bb]]], F.faceOfBit[bb])) m |= 1 << bb; } return m; }
    [st1, st2, st3].forEach(function (a) { if (a.length) segs.push({ k: 'centerStage', moves: a }); });
    return segs;
  }
  var centerTarget = null;
  // Eckplätze (Aufkleber gegen den Uhrzeigersinn geordnet) – daraus lässt sich die Farbverteilung des Würfels ableiten
  var cornerSlots4 = (function () {
    var g = {}; st.forEach(function (s, i) { if (types[i] === 'c') (g[s.p.join(',')] = g[s.p.join(',')] || { p: s.p, idx: [] }).idx.push(i); });
    return Object.keys(g).map(function (k) {
      var o = g[k], by = []; o.idx.forEach(function (i) { var n = st[i].n; by[n[0] ? 0 : n[1] ? 1 : 2] = i; });
      var ord = [by[0], by[1], by[2]]; if (o.p[0] * o.p[1] * o.p[2] < 0) ord = [by[0], by[2], by[1]];
      return ord;
    });
  })();
  function rot3(t3, r) { return [t3[r % 3], t3[(r + 1) % 3], t3[(r + 2) % 3]]; }
  // Zielfarben je Seite (U R F D L B) aus den Eckteilen und der Lage der Zentren bestimmen (beim 4x4 gibt es keine festen Zentren)
  var STD = [1, 3, 4, 0, 2, 5];
  function deriveTargets(colors) {
    var pieces = cornerSlots4.map(function (ord) { return ord.map(function (i) { return colors[i]; }); }), adj = {}, tset = {};
    pieces.forEach(function (p) { p.forEach(function (c) { adj[c] = adj[c] || {}; p.forEach(function (d) { if (d !== c) adj[c][d] = 1; }); }); for (var r = 0; r < 3; r++) tset[rot3(p, r).join()] = 1; });
    var opp = {};
    for (var c = 0; c < 6; c++) {
      if (!adj[c] || Object.keys(adj[c]).length !== 4) return null;
      var o = [0, 1, 2, 3, 4, 5].filter(function (d) { return d !== c && !adj[c][d]; });
      if (o.length !== 1) return null; opp[c] = o[0];
    }
    var best = null, bestScore = -1;
    pieces.forEach(function (p) {
      for (var r = 0; r < 3; r++) {
        var tt = rot3(p, r), T = [tt[1], tt[0], tt[2]]; // U R F  (Ecke rechts-oben-vorne: Reihenfolge R, U, F)
        T = [tt[1], tt[0], tt[2], 0, 0, 0]; T[3] = opp[T[0]]; T[4] = opp[T[1]]; T[5] = opp[T[2]];
        var uniq = {}; T.forEach(function (v) { uniq[v] = 1; }); if (Object.keys(uniq).length !== 6) continue;
        // Reihenfolge der Seiten: 0 U, 1 R, 2 F -> T = [U, R, F, D, L, B]
        T = [tt[1], tt[0], tt[2], opp[tt[1]], opp[tt[0]], opp[tt[2]]];
        T = [T[0], T[1], T[2], T[3], T[4], T[5]];
        var ok = cornerSlots4.every(function (ord) { return !!tset[ord.map(function (i) { return T[st[i].face]; }).join()]; });
        if (!ok) continue;
        var sc = 0; CS.idx.forEach(function (i) { if (colors[i] === T[st[i].face]) sc++; });
        // Wenn das Standard-Farbschema (Gelb oben, Grün vorne ...) zu den Ecken passt, wird es bevorzugt: so endet der Würfel in der gewohnten Ausrichtung
        if (T.every(function (c, f) { return c === STD[f]; })) sc += 1000;
        if (sc > bestScore) { bestScore = sc; best = T; }
      }
    });
    return best;
  }
  function centerScore(cur, prev) {
    var t = 0, lost = false;
    for (var i = 0; i < CS.n; i++) { var ok = cur[i] === centerTarget[i]; if (ok) t++; }
    return { total: t, max: CS.n, lost: false, _: prev };
  }
  function centerScoreLoss(cs0) {
    return function (cur, prev) {
      var t = 0, lost = false;
      for (var i = 0; i < CS.n; i++) { var ok = cur[i] === centerTarget[i]; if (ok) t++; else if (prev && prevOK(prev, i)) lost = true; }
      return { total: t, max: CS.n, lost: lost };
    };
  }
  // Wir merken uns den vorherigen Zustand über eine Closure
  function makeCenterScore() {
    var prevState = null;
    return function (cur, prevScore) {
      var t = 0, lost = false;
      for (var i = 0; i < CS.n; i++) { if (cur[i] === centerTarget[i]) t++; }
      if (prevScore && prevScore.arr) { for (var j = 0; j < CS.n; j++) if (prevScore.arr[j] && cur[j] !== centerTarget[j]) { lost = true; break; } }
      var arr = new Uint8Array(CS.n); for (var k = 0; k < CS.n; k++) arr[k] = cur[k] === centerTarget[k] ? 1 : 0;
      return { total: t, max: CS.n, lost: lost, arr: arr };
    };
  }
  // Kanten: Paare
  var slotDefs = (function () {
    var cub = {};
    WS.idx.forEach(function (i) { var k = st[i].p.join(','); (cub[k] = cub[k] || []).push(i); });
    var byslot = {};
    Object.keys(cub).forEach(function (k) {
      var p = k.split(',').map(Number), sk = p.map(function (v) { return Math.abs(v) === 1.5 ? (v > 0 ? 1 : -1) : 0; }).join(',');
      (byslot[sk] = byslot[sk] || []).push(cub[k]);
    });
    return Object.keys(byslot).map(function (k) {
      var pair = byslot[k], L = pair[0], R = pair[1], out = [];
      L.forEach(function (a) { var f = st[a].face, b = R.filter(function (x) { return st[x].face === f; })[0]; out.push([WS.pos[a], WS.pos[b]]); });
      return out;
    });
  })();
  function pairMask(w) { return slotDefs.map(function (s) { return (w[s[0][0]] === w[s[0][1]] && w[s[1][0]] === w[s[1][1]]) ? 1 : 0; }); }
  function pairScore(cur, prev) {
    var m = pairMask(cur), t = 0, lost = false;
    for (var i = 0; i < m.length; i++) { t += m[i]; if (prev && prev.arr && prev.arr[i] && !m[i]) lost = true; }
    return { total: t, max: 12, lost: lost, arr: m };
  }
  var PAR = {
    oll: "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2",
    pll: "r2 U2 r2 Uu2 r2 u2"
  };
  function reduce(s4) {
    var map = [0, 1, 3], o = [];
    for (var f = 0; f < 6; f++) for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) o.push(s4[f * 16 + map[r] * 4 + map[c]]);
    return o;
  }
  function validate4(colors) {
    var i, counts = [0, 0, 0, 0, 0, 0];
    for (i = 0; i < SZ; i++) { if (colors[i] === null || colors[i] === undefined || colors[i] < 0) return { ok: false, error: 'Es sind noch nicht alle Felder ausgefüllt.', args: [] }; counts[colors[i]]++; }
    for (i = 0; i < 6; i++) if (counts[i] !== 16) return { ok: false, error: '{0} kommt {1}-mal vor - es müssen genau 16 Felder pro Farbe sein.', args: [C4.COLOR_NAMES[i], counts[i]], colorIdx: i };
    return { ok: true };
  }
  function applySegs(state, segs) { segs.forEach(function (sg) { state = C4.applyMoves(state, sg.moves); }); return state; }
  function subToState(sys, sub, base) { var o = Uint8Array.from(base); sys.idx.forEach(function (i, k) { o[i] = sub[k]; }); return o; }

  function solve4(colors, level) {
    var v = validate4(colors); if (!v.ok) return v;
    var T = deriveTargets(colors);
    if (!T) return { ok: false, error: 'Die Eckteile passen nicht zusammen. Bitte die Farben der Ecken prüfen.', args: [] };
    centerTarget = CS.idx.map(function (i) { return T[st[i].face]; });
    var state = Uint8Array.from(colors), phases = [], pCenters = [], pEdges = [], pPar = [], guard = 0;
    var cB = baseList(BASES.cSmall, CS), cBig = baseList(BASES.cBig, CS), wB = baseList(BASES.wSmall, WS), wBig = baseList(BASES.wBig, WS);
    var three = null;
    while (guard++ < 6) {
      // 1. Zentren
      var cur = CS.idx.map(function (i) { return state[i]; });
      var fast = null; try { fast = centersFast(state, T); } catch (e) { fast = null; }
      var r1 = fast ? { segs: fast } : greedy(CS, Uint8Array.from(cur), makeCenterScore(), cB, cBig, 'centers', 60);
      if (!r1) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
      state = applySegs(state, r1.segs); pCenters = pCenters.concat(r1.segs);
      // 2. Kanten paaren
      var w0 = WS.idx.map(function (i) { return state[i]; }), r2 = null, bestCost = 1e9, tries = (level === 3) ? 4 : 1;
      for (var tr = 0; tr < tries; tr++) {
        var wb = wB.slice(), wbg = wBig.slice();
        if (tr > 0) { wb.sort(function () { return Math.random() - 0.5; }); wbg.sort(function () { return Math.random() - 0.5; }); }
        var rr = greedy(WS, Uint8Array.from(w0), pairScore, wb, wbg, 'pairs', 60, (level || 2) >= 2 ? 1 : 0);
        if (!rr) continue;
        var cost = 0; rr.segs.forEach(function (sg) { cost += sg.moves.length; });
        var vv = S.validate(reduce(applySegs(state, rr.segs))); if (!vv.ok) cost += vv.kind === 'flip' ? 15 : (vv.kind === 'perm' ? 6 : 0);
        if (cost < bestCost) { bestCost = cost; r2 = rr; }
      }
      if (!r2) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
      state = applySegs(state, r2.segs); pEdges = pEdges.concat(r2.segs);
      // 3. Reduktion auf 3x3 prüfen
      var red = reduce(state), val = S.validate(red);
      if (val.ok) { three = S.solve(red, level); break; }
      if (val.kind === 'flip') { var m1 = C4.parseAlg(PAR.oll); pPar.push({ k: 'parityOLL', moves: m1 }); state = C4.applyMoves(state, m1); continue; }
      if (val.kind === 'perm') { var m2 = C4.parseAlg(PAR.pll); pPar.push({ k: 'parityPLL', moves: m2 }); state = C4.applyMoves(state, m2); continue; }
      return { ok: false, error: val.error, args: [] };
    }
    if (!three || !three.ok) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
    var raw = [{ no: 1, name: 'Zentren', segs: pCenters }, { no: 2, name: 'Kanten paaren', segs: pEdges }, { no: 3, name: 'Parität', segs: pPar }];
    three.phases.forEach(function (p) { raw.push({ no: p.no + 3, name: p.name, desc: p.desc, sub: p.no, segs: p.segs }); });
    // Alles zusammenfassen: unnötige Zugfolgen (z. B. u' u u') entfernen, auch über Abschnittsgrenzen hinweg
    var allM = [], allT = [];
    raw.forEach(function (ph, pi) { ph.segs.forEach(function (sg, si) { sg.moves.forEach(function (m) { allM.push(m); allT.push(pi * 10000 + si); }); }); });
    var cp = C4.compact(allM, allT), fin2 = C4.applyMoves(Uint8Array.from(colors), cp.moves);
    if (!C4.isSolved(fin2)) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
    var phases = [], total = 0;
    raw.forEach(function (ph, pi) {
      var segs = [], last = -1, flatM = [];
      cp.moves.forEach(function (m, i) {
        var tg = cp.tags[i]; if (((tg / 10000) | 0) !== pi) return;
        var kind = ph.segs[tg % 10000].k;
        if (tg !== last) { segs.push({ k: kind, moves: [] }); last = tg; }
        segs[segs.length - 1].moves.push(m); flatM.push(m);
      });
      var q = { no: ph.no, name: ph.name, segs: segs, moves: flatM }; if (ph.desc) q.desc = ph.desc; if (ph.sub) q.sub = ph.sub;
      phases.push(q); total += flatM.length;
    });
    return { ok: true, phases: phases, total: total, threeStart: 4, targets: T };
  }
  var api = { warm: function () { centerTables(); }, solve4: solve4, validate4: validate4, reduce: reduce, PAR: PAR, types: types };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Solver4Lib = api;
})(typeof window !== 'undefined' ? window : this);
