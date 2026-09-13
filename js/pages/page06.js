/*!
 * js/pages/page06.js —— PAGE06 第三味本草（数字本草图鉴卡 03 / 03）
 *
 * 取数：BC.store.selectedHerbs[2]（顺序即卡片顺序，不重排、不重算、不复制状态）
 * 叙事：留下记录 —— 收束本次探索（三味本草 = 第一份记录）
 * 底部：查看我的三味本草 → router.go(7)
 * 版式与交互复用 BC.render.specimen（共享渲染层）
 */
(function (BC) {
  'use strict';

  BC.pages = BC.pages || {};
  BC.pages.p06 = BC.render.specimen.pager({
    page: 6,
    slot: 3,
    total: 3,
    copyTitle: '留下记录',
    copyDesc: '三味本草，组成这次探索的第一份记录。',
    ctaText: '查看我的三味本草',
    nextPage: 7
  });

})(globalThis.BC);
