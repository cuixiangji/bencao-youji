/*! logic/scoring.js —— 六维加权累加（纯函数） */
(function (BC) {
  'use strict';

  var DIM = ['qi', 'xue', 'yin', 'yang', 'shi', 're'];

  /**
   * 计算六维原始分
   * @param {Array<string|null>} answers 长度 5，元素为 'A'|'B'|'C'|null
   * @returns {Object|null} 未答满 5 题返回 null；否则返回六维原始分（40–49）
   *
   * 纯函数：不碰 DOM / store / router，无随机、无副作用
   */
  function calcBodyScores(answers) {
    var qs = BC.data.questions;
    if (!qs || qs.length !== 5) return null;
    if (!answers || answers.length < 5) return null;

    var scores = { qi: 40, xue: 40, yin: 40, yang: 40, shi: 40, re: 40 };

    for (var i = 0; i < 5; i++) {
      var key = answers[i];
      if (key !== 'A' && key !== 'B' && key !== 'C') return null; // 未答或非法
      var opts = qs[i].options;
      var picked = null;
      for (var j = 0; j < opts.length; j++) {
        if (opts[j].key === key) { picked = opts[j]; break; }
      }
      if (!picked) return null;
      for (var d = 0; d < DIM.length; d++) {
        var dim = DIM[d];
        var w = picked.w[dim];
        scores[dim] += (typeof w === 'number' ? w : 0);
      }
    }
    return scores;
  }

  BC.logic = BC.logic || {};
  BC.logic.calcBodyScores = calcBodyScores;

})(globalThis.BC);
