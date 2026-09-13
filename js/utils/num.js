/*! utils/num.js —— 数值安全 */
(function (BC) {
  'use strict';

  function safeNum(v, fallback) {
    var f = (typeof fallback === 'number') ? fallback : 0;
    var n = (typeof v === 'number') ? v : parseFloat(v);
    if (!isFinite(n)) return f;
    return n;
  }

  function clamp(v, min, max) {
    var n = safeNum(v, min);
    return n < min ? min : (n > max ? max : n);
  }

  function round(v, digits) {
    var d = (typeof digits === 'number') ? digits : 0;
    var p = Math.pow(10, d);
    return Math.round(safeNum(v, 0) * p) / p;
  }

  BC.utils = BC.utils || {};
  BC.utils.safeNum = safeNum;
  BC.utils.clamp = clamp;
  BC.utils.round = round;

})(globalThis.BC);
