/*!
 * js/pages/page04.js —— PAGE04 第一味本草（数字本草图鉴卡 01 / 03）
 *
 * 取数：BC.store.selectedHerbs[0]（顺序即卡片顺序，不重排、不重算、不复制状态）
 * 叙事：第一次遇见 —— 强调认识、观察
 * 底部：认识下一味 → router.go(5)
 * 版式与交互复用 BC.render.specimen（共享渲染层）
 */
(function (BC) {
  'use strict';

  BC.pages = BC.pages || {};
  BC.pages.p04 = BC.render.specimen.pager({
    page: 4,
    slot: 1,
    total: 3,
    copyTitle: '第一次遇见',
    copyDesc: '从名字、气味与生长痕迹开始认识它。',
    ctaText: '认识下一味',
    nextPage: 5
  });

})(globalThis.BC);
