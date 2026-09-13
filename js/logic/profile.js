/*! logic/profile.js —— 雷达视觉归一化 + 探索型判定（纯函数） */
(function (BC) {
  'use strict';

  var R = function () { return BC.data.rules; };

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  /**
   * 雷达视觉归一化（冻结稿第〇部分 二）
   *   v = (raw - 40) / 9
   *   r = 0.35 + 0.65 * v        → 0.35 ~ 1.00
   *   D = round(35 + 65 * v)     → 35 ~ 100
   *
   * @param {Object} scores 六维原始分
   * @returns {{raw:Object, v:Object, r:Object, display:Object}}
   * 纯函数
   */
  function normalizeRadar(scores) {
    var rules = R();
    var span = rules.RAW_MAX - rules.RAW_MIN; // 9
    var out = { raw: {}, v: {}, r: {}, display: {} };
    var dims = rules.DIM_ORDER;

    for (var i = 0; i < dims.length; i++) {
      var d = dims[i];
      var raw = (scores && typeof scores[d] === 'number') ? scores[d] : rules.RAW_MIN;
      var v = clamp01((raw - rules.RAW_MIN) / span);
      out.raw[d] = raw;
      out.v[d] = v;
      out.r[d] = rules.R_MIN + (rules.R_MAX - rules.R_MIN) * v;
      out.display[d] = Math.round(rules.D_MIN + (rules.D_MAX - rules.D_MIN) * v);
    }
    return out;
  }

  /**
   * 探索型判定（冻结稿第〇部分 三）
   *
   *   Step1 range = max - min
   *   Step2 range <= 2                     → 平和探索型（关键词固定「稳定/自在」）
   *                                          阈值来自 rules.BALANCED_RANGE（v1.2 起为 2）
   *   Step3 降序排序（同分按 TIE_ORDER）    → top1 / top2
   *         主型 = TYPE_MAP[top1]
   *         关键词 = [KEYWORD[top1]]；top1-top2 < 2 时追加 KEYWORD[top2]
   *
   * @param {Object} scores 六维原始分
   * @returns {{type:string, keywords:Array<string>, topDim:string, range:number, sorted:Array}}
   * 纯函数：确定性，无随机
   */
  function detectExplorationType(scores) {
    var rules = R();
    var dims = rules.DIM_ORDER;
    var tie = rules.TIE_ORDER;

    // 防御：分数缺失或非法 → 全部按 RAW_MIN
    var safe = {};
    for (var i = 0; i < dims.length; i++) {
      var d = dims[i];
      var val = (scores && typeof scores[d] === 'number' && isFinite(scores[d])) ? scores[d] : rules.RAW_MIN;
      safe[d] = val;
    }

    var maxV = -Infinity, minV = Infinity;
    for (var m = 0; m < dims.length; m++) {
      if (safe[dims[m]] > maxV) maxV = safe[dims[m]];
      if (safe[dims[m]] < minV) minV = safe[dims[m]];
    }
    var range = maxV - minV;

    // 排序：分数降序；同分按 TIE_ORDER 先后
    var sorted = dims.slice().sort(function (a, b) {
      if (safe[b] !== safe[a]) return safe[b] - safe[a];
      return tie.indexOf(a) - tie.indexOf(b);
    });

    var top1 = sorted[0];
    var top2 = sorted[1];
    var gap = safe[top1] - safe[top2];

    if (range <= rules.BALANCED_RANGE) {
      return {
        type: rules.BALANCED_TYPE,
        keywords: rules.BALANCED_KEYWORDS.slice(),
        topDim: top1,
        range: range,
        sorted: sorted
      };
    }

    var type = rules.TYPE_MAP[top1] || rules.BALANCED_TYPE;
    var keywords = [rules.KEYWORD[top1]];
    if (gap < rules.KEYWORD_GAP && rules.KEYWORD[top2] && rules.KEYWORD[top2] !== rules.KEYWORD[top1]) {
      keywords.push(rules.KEYWORD[top2]);
    }

    return { type: type, keywords: keywords, topDim: top1, range: range, sorted: sorted };
  }

  BC.logic = BC.logic || {};
  BC.logic.normalizeRadar = normalizeRadar;
  BC.logic.detectExplorationType = detectExplorationType;

})(globalThis.BC);
