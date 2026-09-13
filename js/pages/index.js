/*!
 * js/pages/index.js —— 页面模块注册入口
 *
 * 【Step 4.1】P01 / P02 / P03 已实现为真实页面，占位不再生成：
 *   js/pages/page01.js  开场动画
 *   js/pages/page02.js  本草秘境
 *   js/pages/page03.js  本草探索（12 选 3）
 * 三者在本文件之后加载，并覆盖写入 BC.pages.p01 / p02 / p03。
 *
 * 【Step 4.2】P04 / P05 / P06 已实现为真实页面，占位不再生成：
 *   js/pages/page04.js  图鉴卡 01 / 03
 *   js/pages/page05.js  图鉴卡 02 / 03
 *   js/pages/page06.js  图鉴卡 03 / 03
 * 三者复用共享渲染层 js/render/specimen.js，在本文件之后加载并覆盖写入 BC.pages.p04/p05/p06。
 *
 * 【Step 4.3】P07 已实现为真实页面，占位不再生成：
 *   js/pages/page07.js  我的三味本草（MY HERBAL ARCHIVE）
 * 复用 js/render/specimen.js 的 mountFigure / hexA / setStageLabel，在本文件之后加载。
 *
 * 【Step 4.4】P08 已实现为真实页面，占位与旧 DEV 骨架一并移除：
 *   js/pages/page08.js  我的身体观察（BODY OBSERVATION）
 * G1 断点续答语义（定位到 bodyAnswers 第一个未答项）已原样迁移进 page08.js，
 * 本文件不再承载任何 P08 逻辑。
 *
 * 【Step 4.5】P09 已实现为真实页面，占位与旧 DEV 骨架一并移除：
 *   js/pages/page09.js  本草身体画像（BODY PROFILE）
 * 只读展示层：结果全部来自既有 Store/Logic（bodyScores / bodyScoresDisplay /
 * explorationType / recommendedHerbs），页面内不重算任何算法；
 * 六维雷达经共享渲染层 js/render/radar.js 输出（顺序取 DIM_ORDER：气/血/阴/阳/湿/热）。
 * 本文件不再承载任何 P09 逻辑。
 *
 * 【Step 4.6】P10 已实现为真实页面，占位与旧 DEV 骨架一并移除：
 *   js/pages/page10.js  本草实验室（HERBAL LAB）
 * 两阶段：选择一味本草（只显示 recommendedHerbs 的 3 味）→ 本草调配（只显示
 * selectedTea.materials 的 2 味，拖入 / 点一下 等价）→「配方已完成」→ P11。
 * 本草 → 茶饮的唯一匹配走既有 js/logic/teamatch.js（BC.logic.resolveTea），
 * 页面内不重写任何映射表 / 不做随机；只写 chosenHerb / selectedTea /
 * teaIngredients / teaBrewStep 四个既有字段。本文件不再承载任何 P10 逻辑。
 *
 * 【Step 4.7】P11 已实现为真实页面，占位与旧 DEV 骨架一并移除：
 *   js/pages/page11.js  专属茶饮配方卡（TEA FORMULA）
 * 只读展示层：selectedTea（Store 中是茶饮 id，页面解析 BC.data.teaById）→ 暖米白配方卡 +
 * 两味本草组合插画（差异化轮廓）+ 大标题茶饮名 + 图文标注 + 本草组成；只读
 * chosenHerb / teaIngredients / teaBrewStep，**不写入任何 store 键**，不重算任何算法。
 * 本文件不再承载任何 P11 逻辑。
 *
 * 【仍为占位】P12–P13 保留 DEV 脚手架（标题 + 前进/返回），
 * 供 Router / Store 回归测试使用，后续阶段逐个替换。
 *
 * 页面模块契约：{ render(ctx), enter(ctx), leave(ctx) }
 */
(function (BC) {
  'use strict';

  var U = BC.utils;

  function base(page, title, sub) {
    return {
      render: function () {
        var root = document.getElementById('page-' + ('0' + page).slice(-2));
        if (!root) return;
        root.innerHTML = '';

        var h = U.el('div', 't1', title);
        var en = U.el('div', 't4 en', sub || '');
        var num = U.el('div', 't4', 'PAGE ' + ('0' + page).slice(-2));
        root.appendChild(h);
        root.appendChild(en);
        root.appendChild(num);

        // DEV 导航（正式页面开发时移除）
        var nav = U.el('div', 'page-foot');
        if (page < 13) {
          var next = U.el('button', 'btn', '下一步 (DEV)');
          U.onClick(next, function () { BC.router.go(page + 1); });
          nav.appendChild(next);
        }
        var prev = U.el('button', 'btn-ghost', '返回上一页 (DEV)');
        U.onClick(prev, function () { BC.router.back(); });
        nav.appendChild(prev);
        root.appendChild(nav);
      },
      enter: function () {
        var root = document.getElementById('page-' + ('0' + page).slice(-2));
        if (root) BC.fx.play('anim-rise', root, { duration: 600 });
      },
      leave: function () {}
    };
  }

  var mods = {};
  var titles = {
    1: ['开场', 'HERBAL EXPLORATION'],
    2: ['本草秘境', 'HERBAL REALM'],
    3: ['本草探索', 'EXPLORE'],
    4: ['图鉴卡 01', 'MY HERBAL FRIEND 01'],
    5: ['图鉴卡 02', 'MY HERBAL FRIEND 02'],
    6: ['图鉴卡 03', 'MY HERBAL FRIEND 03'],
    7: ['我的三味本草', 'MY HERBAL COLLECTION'],
    8: ['我的身体观察', 'MY BODY'],
    9: ['本草身体画像', 'MY BODY PROFILE'],
    10: ['本草实验室', 'HERBAL LAB'],
    11: ['专属茶饮配方卡', 'YOUR HERBAL TEA'],
    12: ['我的本草探索档案', 'HERBAL EXPLORER'],
    13: ['分享与保存', 'MY HERBAL JOURNEY']
  };

  for (var p = 4; p <= 13; p++) {          // P01–P03 由 page01–03.js 提供
    if (p === 4 || p === 5 || p === 6) continue;   // P04–P06 由 page04–06.js 提供（Step 4.2）
    if (p === 7) continue;                  // P07 由 page07.js 提供（Step 4.3）
    if (p === 8) continue;                  // P08 由 page08.js 提供（Step 4.4）
    if (p === 9) continue;                  // P09 由 page09.js 提供（Step 4.5）
    if (p === 10) continue;                 // P10 由 page10.js 提供（Step 4.6）
    if (p === 11) continue;                 // P11 由 page11.js 提供（Step 4.7）
    mods[BC.config.PAGE_KEY[p]] = base(p, titles[p][0], titles[p][1]);
  }

  // 合并已注册的页面模块（page01–page11.js 可能先于本文件加载）
  var prev = BC.pages || {};
  for (var k in prev) {
    if (Object.prototype.hasOwnProperty.call(prev, k)) mods[k] = prev[k];
  }
  BC.pages = mods;

})(globalThis.BC);
