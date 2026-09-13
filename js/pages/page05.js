/*!
 * js/pages/page05.js —— PAGE05 第二味本草（数字本草图鉴卡 02 / 03）
 *
 * 取数：BC.store.selectedHerbs[1]
 * 叙事：继续深入 —— 强调发现
 * 底部：认识下一味 → router.go(6)
 */
(function (BC) {
  'use strict';

  BC.pages = BC.pages || {};
  BC.pages.p05 = BC.render.specimen.pager({
    page: 5,
    slot: 2,
    total: 3,
    copyTitle: '继续深入',
    copyDesc: '换一个角度观察，你会发现更多细节。',
    ctaText: '认识下一味',
    nextPage: 6
  });

})(globalThis.BC);
