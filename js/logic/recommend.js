/*! logic/recommend.js —— 探索型 → 推荐 3 种本草（纯函数） */
(function (BC) {
  'use strict';

  /**
   * @param {string} typeName 探索型名称（如 '轻盈探索型'）
   * @returns {Array<string>} [herbId, herbId, herbId]；未知类型回退平和组
   * 纯函数
   */
  function recommendHerbs(typeName) {
    var map = BC.data.rules.RECOMMEND_MAP;
    var list = map[typeName];
    if (!list || !list.length) {
      list = map[BC.data.rules.BALANCED_TYPE];
    }
    return list.slice();
  }

  BC.logic = BC.logic || {};
  BC.logic.recommendHerbs = recommendHerbs;

})(globalThis.BC);
