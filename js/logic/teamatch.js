/*! logic/teamatch.js —— 本草 + 探索型 → 唯一茶饮 + 2 种材料（纯函数，确定性） */
(function (BC) {
  'use strict';

  function teaNum(id) {
    var m = /(\d+)$/.exec(String(id || ''));
    return m ? parseInt(m[1], 10) : 0;
  }

  /**
   * 冻结稿第〇部分 四：
   *   candidates = herb.tea_ids（按 tea id 升序）
   *   len === 1 → candidates[0]
   *   else      → idx = (TYPE_INDEX[type] + HERB_INDEX[herb]) % len
   *
   * @param {string} herbId  用户选中的本草 id
   * @param {string} typeName 探索型名称
   * @returns {{teaId:string, tea:Object, ingredients:Array, index:number, candidates:Array}}
   * 纯函数：同输入永远同输出，无随机
   */
  function resolveTea(herbId, typeName) {
    var rules = BC.data.rules;
    var herb = BC.data.herbById[herbId];
    var fallbackTea = BC.data.teaById[rules.FALLBACK_TEA];

    // 本草不存在或 tea_ids 为空 → 兜底 tea_01
    if (!herb || !herb.tea_ids || !herb.tea_ids.length) {
      return {
        teaId: rules.FALLBACK_TEA, tea: fallbackTea,
        ingredients: buildIngredients(fallbackTea), index: 0,
        candidates: [rules.FALLBACK_TEA], fallback: true
      };
    }

    var candidates = herb.tea_ids.slice().sort(function (a, b) { return teaNum(a) - teaNum(b); });

    var tIdx = rules.TYPE_INDEX[typeName];
    if (typeof tIdx !== 'number') tIdx = rules.TYPE_INDEX[rules.BALANCED_TYPE];
    var hIdx = BC.data.herbIndex[herbId];
    if (typeof hIdx !== 'number') hIdx = 0;

    var idx = candidates.length === 1 ? 0 : ((tIdx + hIdx) % candidates.length);
    var teaId = candidates[idx];
    var tea = BC.data.teaById[teaId] || fallbackTea;

    return {
      teaId: teaId, tea: tea,
      ingredients: buildIngredients(tea), index: idx,
      candidates: candidates, fallback: false
    };
  }

  /** 把 tea.materials 组装为带本草主题色/资源基名的渲染用材料数组 */
  function buildIngredients(tea) {
    if (!tea || !tea.materials) return [];
    var pal = BC.data.rules.PALETTE;
    return tea.materials.map(function (m) {
      var h = BC.data.herbById[m.herbId] || {};
      return {
        herbId: m.herbId,
        name: m.name || (h.name || ''),
        amount: m.amount || '',
        color: pal[m.herbId] || '#8A9A7B',
        image: h.image || ''
      };
    });
  }

  BC.logic = BC.logic || {};
  BC.logic.resolveTea = resolveTea;
  BC.logic.buildIngredients = buildIngredients;

})(globalThis.BC);
