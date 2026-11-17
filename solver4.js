/* Zauber – Löser für den 4x4-Würfel (Reduktionsmethode: Zentren, Kanten paaren, Parität, dann 3x3) */
(function (root) {
  'use strict';
  var C4 = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./cube.js').make(4) : root.Cube4;
  var S = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./solver.js') : root.SolverLib;
  var st = C4.stickers, SZ = 96;
  var BASES = {"cSmall": ["2U L 2U' 2L 2U L' 2U' 2L'", "2U' F 2U 2B 2U' F' 2U 2B'", "2D' L 2D 2R 2D' L' 2D 2R'", "2L B 2L' 2F 2L B' 2L' 2F'", "2R F 2R' 2F 2R F' 2R' 2F'", "2F D 2F' 2U 2F D' 2F' 2U'", "2B U 2B' 2U 2B U' 2B' 2U'", "2B' L 2B 2R 2B' L' 2B 2R'", "2U' L 2U 2R2 2U' L' 2U 2R2", "2D F 2D' 2F2 2D F' 2D' 2F2", "2L U 2L' 2U2 2L U' 2L' 2U2", "2L' D2 2L 2U 2L' D2 2L 2U'", "2R B 2R' 2F2 2R B' 2R' 2F2", "2F D 2F' 2U2 2F D' 2F' 2U2", "2F' L2 2F 2R 2F' L2 2F 2R'", "2B' U 2B 2D2 2B' U' 2B 2D2", "2D L2 2D' 2L2 2D L2 2D' 2L2", "2R' U2 2R 2U2 2R' U2 2R 2U2"], "cBig": ["2U L 2U' 2L 2U L' 2U' 2L'", "2U L' 2U' 2L 2U L 2U' 2L'", "2U R 2U' 2L' 2U R' 2U' 2L", "2U R' 2U' 2R 2U R 2U' 2R'", "2U F 2U' 2B' 2U F' 2U' 2B", "2U B 2U' 2F 2U B' 2U' 2F'", "2U B' 2U' 2F 2U B 2U' 2F'", "2U' L 2U 2R' 2U' L' 2U 2R", "2U' R' 2U 2R 2U' R 2U 2R'", "2U' F' 2U 2F' 2U' F 2U 2F", "2D L 2D' 2L 2D L' 2D' 2L'", "2D L' 2D' 2L 2D L 2D' 2L'", "2D R 2D' 2L' 2D R' 2D' 2L", "2D R' 2D' 2R 2D R 2D' 2R'", "2D F 2D' 2B' 2D F' 2D' 2B", "2D B 2D' 2F 2D B' 2D' 2F'", "2D B' 2D' 2F 2D B 2D' 2F'", "2D' L 2D 2R' 2D' L' 2D 2R", "2D' R' 2D 2R 2D' R 2D 2R'", "2D' F' 2D 2F' 2D' F 2D 2F", "2L U 2L' 2U 2L U' 2L' 2U'", "2L U' 2L' 2U 2L U 2L' 2U'", "2L D 2L' 2U' 2L D' 2L' 2U", "2L D' 2L' 2D 2L D 2L' 2D'", "2L F 2L' 2B' 2L F' 2L' 2B", "2L B 2L' 2F 2L B' 2L' 2F'", "2L B' 2L' 2F 2L B 2L' 2F'", "2L' U 2L 2D' 2L' U' 2L 2D", "2L' D' 2L 2D 2L' D 2L 2D'", "2L' F' 2L 2F' 2L' F 2L 2F", "2R U 2R' 2U 2R U' 2R' 2U'", "2R U' 2R' 2U 2R U 2R' 2U'", "2R D 2R' 2U' 2R D' 2R' 2U", "2R D' 2R' 2D 2R D 2R' 2D'", "2R F 2R' 2B' 2R F' 2R' 2B", "2R B 2R' 2F 2R B' 2R' 2F'", "2R B' 2R' 2F 2R B 2R' 2F'", "2R' U 2R 2D' 2R' U' 2R 2D", "2R' D' 2R 2D 2R' D 2R 2D'", "2R' F' 2R 2F' 2R' F 2R 2F", "2F U 2F' 2U 2F U' 2F' 2U'", "2F U' 2F' 2U 2F U 2F' 2U'", "2F D 2F' 2U' 2F D' 2F' 2U", "2F D' 2F' 2D 2F D 2F' 2D'", "2F L 2F' 2R' 2F L' 2F' 2R", "2F R 2F' 2L 2F R' 2F' 2L'", "2F R' 2F' 2L 2F R 2F' 2L'", "2F' U 2F 2D' 2F' U' 2F 2D", "2F' D' 2F 2D 2F' D 2F 2D'", "2F' L' 2F 2L' 2F' L 2F 2L", "2B U 2B' 2U 2B U' 2B' 2U'", "2B U' 2B' 2U 2B U 2B' 2U'", "2B D 2B' 2U' 2B D' 2B' 2U", "2B D' 2B' 2D 2B D 2B' 2D'", "2B L 2B' 2R' 2B L' 2B' 2R", "2B R 2B' 2L 2B R' 2B' 2L'", "2B R' 2B' 2L 2B R 2B' 2L'", "2B' U 2B 2D' 2B' U' 2B 2D", "2B' D' 2B 2D 2B' D 2B 2D'", "2B' L' 2B 2L' 2B' L 2B 2L", "2U L 2U' 2L2 2U L' 2U' 2L2", "2U L2 2U' 2L 2U L2 2U' 2L'", "2U R 2U' 2R2 2U R' 2U' 2R2", "2U R2 2U' 2R 2U R2 2U' 2R'", "2U F' 2U' 2B2 2U F 2U' 2B2", "2U B 2U' 2F2 2U B' 2U' 2F2", "2U B2 2U' 2F 2U B2 2U' 2F'", "2U' L' 2U 2L2 2U' L 2U 2L2", "2U' R 2U 2L2 2U' R' 2U 2L2", "2U' R2 2U 2R' 2U' R2 2U 2R", "2U' F2 2U 2B 2U' F2 2U 2B'", "2U' B2 2U 2F 2U' B2 2U 2F'", "2D L 2D' 2R2 2D L' 2D' 2R2", "2D L2 2D' 2R 2D L2 2D' 2R'", "2D R' 2D' 2R2 2D R 2D' 2R2", "2D F 2D' 2F2 2D F' 2D' 2F2", "2D F2 2D' 2F 2D F2 2D' 2F'", "2D B 2D' 2B2 2D B' 2D' 2B2", "2D B2 2D' 2B 2D B2 2D' 2B'", "2D' L2 2D 2L' 2D' L2 2D 2L", "2D' R2 2D 2L 2D' R2 2D 2L'", "2D' F 2D 2B2 2D' F' 2D 2B2", "2D' F2 2D 2B' 2D' F2 2D 2B", "2D' B2 2D 2B 2D' B2 2D 2B'", "2L U' 2L' 2D2 2L U 2L' 2D2", "2L D 2L' 2U2 2L D' 2L' 2U2", "2L D2 2L' 2U 2L D2 2L' 2U'", "2L F 2L' 2B2 2L F' 2L' 2B2", "2L F2 2L' 2B 2L F2 2L' 2B'", "2L B' 2L' 2B2 2L B 2L' 2B2", "2L' U 2L 2D2 2L' U' 2L 2D2", "2L' U2 2L 2D 2L' U2 2L 2D'", "2L' D2 2L 2U' 2L' D2 2L 2U", "2L' F2 2L 2F 2L' F2 2L 2F'", "2L' B' 2L 2B2 2L' B 2L 2B2", "2R U 2R' 2U2 2R U' 2R' 2U2", "2R U2 2R' 2U 2R U2 2R' 2U'", "2R D 2R' 2D2 2R D' 2R' 2D2", "2R D2 2R' 2D 2R D2 2R' 2D'", "2R F' 2R' 2B2 2R F 2R' 2B2", "2R B 2R' 2F2 2R B' 2R' 2F2", "2R B2 2R' 2F 2R B2 2R' 2F'", "2R' U' 2R 2U2 2R' U 2R 2U2", "2R' D 2R 2U2 2R' D' 2R 2U2", "2R' D2 2R 2D' 2R' D2 2R 2D", "2R' F2 2R 2B 2R' F2 2R 2B'", "2R' B2 2R 2F 2R' B2 2R 2F'", "2F U 2F' 2D2 2F U' 2F' 2D2", "2F U2 2F' 2D 2F U2 2F' 2D'", "2F D' 2F' 2D2 2F D 2F' 2D2", "2F L 2F' 2L2 2F L' 2F' 2L2", "2F L2 2F' 2L 2F L2 2F' 2L'", "2F R 2F' 2R2 2F R' 2F' 2R2", "2F R2 2F' 2R 2F R2 2F' 2R'", "2F' U2 2F 2U' 2F' U2 2F 2U", "2F' D2 2F 2U 2F' D2 2F 2U'", "2F' L 2F 2R2 2F' L' 2F 2R2", "2F' L2 2F 2R' 2F' L2 2F 2R", "2F' R2 2F 2R 2F' R2 2F 2R'", "2B U' 2B' 2D2 2B U 2B' 2D2", "2B D 2B' 2U2 2B D' 2B' 2U2", "2B D2 2B' 2U 2B D2 2B' 2U'", "2B L 2B' 2R2 2B L' 2B' 2R2", "2B L2 2B' 2R 2B L2 2B' 2R'", "2B R' 2B' 2R2 2B R 2B' 2R2", "2B' U 2B 2D2 2B' U' 2B 2D2", "2B' U2 2B 2D 2B' U2 2B 2D'", "2B' D2 2B 2U' 2B' D2 2B 2U", "2B' L2 2B 2L 2B' L2 2B 2L'", "2B' R' 2B 2R2 2B' R 2B 2R2", "2U L2 2U' 2L2 2U L2 2U' 2L2", "2U F2 2U' 2F2 2U F2 2U' 2F2", "2U' L2 2U 2R2 2U' L2 2U 2R2", "2U' B2 2U 2F2 2U' B2 2U 2F2", "2D R2 2D' 2R2 2D R2 2D' 2R2", "2D' L2 2D 2L2 2D' L2 2D 2L2", "2D' F2 2D 2F2 2D' F2 2D 2F2", "2L U2 2L' 2D2 2L U2 2L' 2D2", "2L B2 2L' 2F2 2L B2 2L' 2F2", "2L' D2 2L 2D2 2L' D2 2L 2D2", "2R U2 2R' 2U2 2R U2 2R' 2U2", "2R F2 2R' 2F2 2R F2 2R' 2F2", "2R' U2 2R 2D2 2R' U2 2R 2D2", "2R' B2 2R 2F2 2R' B2 2R 2F2", "2F D2 2F' 2D2 2F D2 2F' 2D2", "2F' U2 2F 2U2 2F' U2 2F 2U2", "2F' L2 2F 2L2 2F' L2 2F 2L2", "2B U2 2B' 2D2 2B U2 2B' 2D2", "2B R2 2B' 2L2 2B R2 2B' 2L2", "2B' D2 2B 2D2 2B' D2 2B 2D2"], "wSmall": ["2U L 2U' R 2U L' 2U' R'", "2U' L' 2U R' 2U' L 2U R", "2D R' 2D' L 2D R 2D' L'", "2D' F 2D B' 2D' F' 2D B", "2L B 2L' F 2L B' 2L' F'", "2L' B' 2L F' 2L' B 2L F", "2R' U' 2R D 2R' U 2R D'", "2F D 2F' U' 2F D' 2F' U", "2F' L 2F R 2F' L' 2F R'", "2B L' 2B' R' 2B L 2B' R", "2B' R' 2B L 2B' R 2B L'", "2U' L' 2U R2 2U' L 2U R2", "2D R 2D' L2 2D R' 2D' L2", "2D' R2 2D L' 2D' R2 2D L", "2L F2 2L' B 2L F2 2L' B'", "2L' B' 2L F2 2L' B 2L F2", "2R' U 2R D2 2R' U' 2R D2", "2F U2 2F' D' 2F U2 2F' D", "2F' D2 2F U 2F' D2 2F U'", "2B L' 2B' R2 2B L 2B' R2", "2B' R 2B L2 2B' R' 2B L2", "2D' B2 2D F2 2D' B2 2D F2", "2F L2 2F' R2 2F L2 2F' R2", "2U2 F2 2U2 2R2 2U2 F2 2U2 2R2"], "wBig": ["2U L 2U' R 2U L' 2U' R'", "2U L' 2U' R' 2U L 2U' R", "2U R' 2U' L 2U R 2U' L'", "2U F 2U' B' 2U F' 2U' B", "2U B 2U' F 2U B' 2U' F'", "2U B' 2U' F' 2U B 2U' F", "2U' L' 2U R 2U' L 2U R'", "2U' R 2U L' 2U' R' 2U L", "2U' F 2U B 2U' F' 2U B'", "2U' F' 2U B' 2U' F 2U B", "2U' B' 2U F 2U' B 2U F'", "2D L 2D' R' 2D L' 2D' R", "2D R 2D' L 2D R' 2D' L'", "2D R' 2D' L' 2D R 2D' L", "2D F' 2D' B 2D F 2D' B'", "2D B 2D' F' 2D B' 2D' F", "2D' L 2D R 2D' L' 2D R'", "2D' L' 2D R' 2D' L 2D R", "2D' R' 2D L 2D' R 2D L'", "2D' F 2D B' 2D' F' 2D B", "2D' B 2D F 2D' B' 2D F'", "2D' B' 2D F' 2D' B 2D F", "2L U' 2L' D 2L U 2L' D'", "2L D 2L' U' 2L D' 2L' U", "2L F 2L' B 2L F' 2L' B'", "2L B 2L' F 2L B' 2L' F'", "2L B' 2L' F' 2L B 2L' F", "2L' U' 2L D 2L' U 2L D'", "2L' D 2L U' 2L' D' 2L U", "2L' F 2L B 2L' F' 2L B'", "2L' F' 2L B' 2L' F 2L B", "2L' B' 2L F 2L' B 2L F'", "2R U 2R' D' 2R U' 2R' D", "2R D 2R' U 2R D' 2R' U'", "2R D' 2R' U' 2R D 2R' U", "2R F' 2R' B 2R F 2R' B'", "2R B 2R' F' 2R B' 2R' F", "2R' U 2R D 2R' U' 2R D'", "2R' U' 2R D' 2R' U 2R D", "2R' D' 2R U 2R' D 2R U'", "2R' F 2R B' 2R' F' 2R B", "2R' B 2R F 2R' B' 2R F'", "2R' B' 2R F' 2R' B 2R F", "2F U' 2F' D 2F U 2F' D'", "2F D 2F' U' 2F D' 2F' U", "2F L 2F' R 2F L' 2F' R'", "2F L' 2F' R' 2F L 2F' R", "2F R' 2F' L 2F R 2F' L'", "2F' U 2F D' 2F' U' 2F D", "2F' D 2F U 2F' D' 2F U'", "2F' L 2F R 2F' L' 2F R'", "2F' L' 2F R' 2F' L 2F R", "2F' R' 2F L 2F' R 2F L'", "2B U 2B' D' 2B U' 2B' D", "2B D 2B' U 2B D' 2B' U'", "2B D' 2B' U' 2B D 2B' U", "2B L' 2B' R 2B L 2B' R'", "2B R 2B' L' 2B R' 2B' L", "2B' U 2B D 2B' U' 2B D'", "2B' U' 2B D' 2B' U 2B D", "2B' D' 2B U 2B' D 2B U'", "2B' L 2B R' 2B' L' 2B R", "2B' R 2B L 2B' R' 2B L'", "2B' R' 2B L' 2B' R 2B L", "2U L2 2U' R 2U L2 2U' R'", "2U R' 2U' L2 2U R 2U' L2", "2U F 2U' B2 2U F' 2U' B2", "2U F2 2U' B' 2U F2 2U' B", "2U B2 2U' F 2U B2 2U' F'", "2U' L' 2U R2 2U' L 2U R2", "2U' R 2U L2 2U' R' 2U L2", "2U' R2 2U L' 2U' R2 2U L", "2U' F2 2U B 2U' F2 2U B'", "2U' B' 2U F2 2U' B 2U F2", "2D L 2D' R2 2D L' 2D' R2", "2D R 2D' L2 2D R' 2D' L2", "2D R2 2D' L' 2D R2 2D' L", "2D F2 2D' B 2D F2 2D' B'", "2D B' 2D' F2 2D B 2D' F2", "2D' L 2D R2 2D' L' 2D R2", "2D' L2 2D R' 2D' L2 2D R", "2D' R2 2D L 2D' R2 2D L'", "2D' F' 2D B2 2D' F 2D B2", "2D' B 2D F2 2D' B' 2D F2", "2D' B2 2D F' 2D' B2 2D F", "2L U2 2L' D 2L U2 2L' D'", "2L D' 2L' U2 2L D 2L' U2", "2L F 2L' B2 2L F' 2L' B2", "2L F2 2L' B' 2L F2 2L' B", "2L B2 2L' F 2L B2 2L' F'", "2L' U' 2L D2 2L' U 2L D2", "2L' D 2L U2 2L' D' 2L U2", "2L' D2 2L U' 2L' D2 2L U", "2L' F2 2L B 2L' F2 2L B'", "2L' B' 2L F2 2L' B 2L F2", "2R U 2R' D2 2R U' 2R' D2", "2R U2 2R' D' 2R U2 2R' D", "2R D2 2R' U 2R D2 2R' U'", "2R F' 2R' B2 2R F 2R' B2", "2R B 2R' F2 2R B' 2R' F2", "2R' U 2R D2 2R' U' 2R D2", "2R' U2 2R D' 2R' U2 2R D", "2R' D2 2R U 2R' D2 2R U'", "2R' F' 2R B2 2R' F 2R B2", "2R' B 2R F2 2R' B' 2R F2", "2R' B2 2R F' 2R' B2 2R F", "2F U2 2F' D 2F U2 2F' D'", "2F D' 2F' U2 2F D 2F' U2", "2F L 2F' R2 2F L' 2F' R2", "2F L2 2F' R' 2F L2 2F' R", "2F R2 2F' L 2F R2 2F' L'", "2F' U' 2F D2 2F' U 2F D2", "2F' D 2F U2 2F' D' 2F U2", "2F' D2 2F U' 2F' D2 2F U", "2F' L2 2F R 2F' L2 2F R'", "2F' R' 2F L2 2F' R 2F L2", "2B U 2B' D2 2B U' 2B' D2", "2B U2 2B' D' 2B U2 2B' D", "2B D2 2B' U 2B D2 2B' U'", "2B L' 2B' R2 2B L 2B' R2", "2B R 2B' L2 2B R' 2B' L2", "2B R2 2B' L' 2B R2 2B' L", "2B' U2 2B D 2B' U2 2B D'", "2B' D' 2B U2 2B' D 2B U2", "2B' L 2B R2 2B' L' 2B R2", "2B' R 2B L2 2B' R' 2B L2", "2B' R2 2B L' 2B' R2 2B L", "2U F2 2U' B2 2U F2 2U' B2", "2U' R2 2U L2 2U' R2 2U L2", "2D L2 2D' R2 2D L2 2D' R2", "2D B2 2D' F2 2D B2 2D' F2", "2D' F2 2D B2 2D' F2 2D B2", "2L D2 2L' U2 2L D2 2L' U2", "2L' U2 2L D2 2L' U2 2L D2", "2L' B2 2L F2 2L' B2 2L F2", "2R F2 2R' B2 2R F2 2R' B2", "2R' D2 2R U2 2R' D2 2R U2", "2F U2 2F' D2 2F U2 2F' D2", "2F R2 2F' L2 2F R2 2F' L2", "2F' L2 2F R2 2F' L2 2F R2", "2B D2 2B' U2 2B D2 2B' U2", "2B' U2 2B D2 2B' U2 2B D2", "2B' R2 2B L2 2B' R2 2B L2", "2U2 R2 2U2 2F2 2U2 R2 2U2 2F2", "2U2 F2 2U2 2R2 2U2 F2 2U2 2R2", "2L2 U2 2L2 2F2 2L2 U2 2L2 2F2", "2L2 D2 2L2 2B2 2L2 D2 2L2 2B2", "2L2 B2 2L2 2U2 2L2 B2 2L2 2U2", "2F2 U2 2F2 2R2 2F2 U2 2F2 2R2", "2F2 L2 2F2 2U2 2F2 L2 2F2 2U2"]};
  var types = st.map(function (s) { var e = s.p.filter(function (v) { return Math.abs(v) === 1.5; }).length; return e === 3 ? 'c' : e === 2 ? 'w' : 'm'; });
  function subsystem(t) {
    var idx = [], pos = {}; st.forEach(function (s, i) { if (types[i] === t) { pos[i] = idx.length; idx.push(i); } });
    return { idx: idx, pos: pos, n: idx.length };
  }
  var CS = subsystem('m'), WS = subsystem('w');
  var FACES = ['U', 'D', 'L', 'R', 'F', 'B'], SFX = ['', "'", '2'];
  var M36 = []; FACES.forEach(function (f) { SFX.forEach(function (s) { M36.push(f + s); }); }); FACES.forEach(function (f) { SFX.forEach(function (s) { M36.push('2' + f + s); }); });
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
  function greedy(sys, st0, scoreFn, small, big, label, limit) {
    var cur = st0, out = [], guard = 0;
    var levels = [{ b: small, w: words(), k: 'w2' }, { b: big, w: words(), k: 'w2' }, { b: big, w: wordsDeep(), k: 'w3' }];
    while (guard++ < limit) {
      var cs = scoreFn(cur); if (cs.total === cs.max) break;
      var best = null;
      for (var li = 0; li < levels.length && !best; li++) {
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
  var solvedC = C4.solvedColors();
  var centerTarget = CS.idx.map(function (i) { return solvedC[i]; });
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
    oll: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
    pll: "2R2 U2 2R2 u2 2R2 2U2"
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

  function solve4(colors) {
    var v = validate4(colors); if (!v.ok) return v;
    var state = Uint8Array.from(colors), phases = [], pCenters = [], pEdges = [], pPar = [], guard = 0;
    var cB = baseList(BASES.cSmall, CS), cBig = baseList(BASES.cBig, CS), wB = baseList(BASES.wSmall, WS), wBig = baseList(BASES.wBig, WS);
    var three = null;
    while (guard++ < 6) {
      // 1. Zentren
      var cur = CS.idx.map(function (i) { return state[i]; });
      var r1 = greedy(CS, Uint8Array.from(cur), makeCenterScore(), cB, cBig, 'centers', 60);
      if (!r1) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
      state = applySegs(state, r1.segs); pCenters = pCenters.concat(r1.segs);
      // 2. Kanten paaren
      var w0 = WS.idx.map(function (i) { return state[i]; });
      var r2 = greedy(WS, Uint8Array.from(w0), pairScore, wB, wBig, 'pairs', 60);
      if (!r2) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
      state = applySegs(state, r2.segs); pEdges = pEdges.concat(r2.segs);
      // 3. Reduktion auf 3x3 prüfen
      var red = reduce(state), val = S.validate(red);
      if (val.ok) { three = S.solve(red); break; }
      if (val.kind === 'flip') { var m1 = C4.parseAlg(PAR.oll); pPar.push({ k: 'parityOLL', moves: m1 }); state = C4.applyMoves(state, m1); continue; }
      if (val.kind === 'perm') { var m2 = C4.parseAlg(PAR.pll); pPar.push({ k: 'parityPLL', moves: m2 }); state = C4.applyMoves(state, m2); continue; }
      return { ok: false, error: val.error, args: [] };
    }
    if (!three || !three.ok) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
    function mk(no, segs, name) { var f = []; segs.forEach(function (s) { f = f.concat(s.moves); }); return { no: no, name: name, segs: segs, moves: f }; }
    phases.push(mk(1, pCenters, 'Zentren')); phases.push(mk(2, pEdges, 'Kanten paaren')); phases.push(mk(3, pPar, 'Parität'));
    three.phases.forEach(function (p) { var q = mk(p.no + 3, p.segs, p.name); q.desc = p.desc; q.sub = p.no; phases.push(q); });
    var total = 0; phases.forEach(function (p) { total += p.moves.length; });
    // Kontrolle
    var fin = state; three.phases.forEach(function (p) { fin = C4.applyMoves(fin, p.moves); });
    if (!C4.isSolved(fin)) return { ok: false, error: 'Für diese Eingabe konnte keine Lösung berechnet werden. Bitte alle Farben noch einmal prüfen.', args: [] };
    return { ok: true, phases: phases, total: total, threeStart: 4 };
  }
  var api = { solve4: solve4, validate4: validate4, reduce: reduce, PAR: PAR, types: types };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Solver4Lib = api;
})(typeof window !== 'undefined' ? window : this);
