/*! 全局常量配置 */
(function (BC) {
  'use strict';

  BC.config = {
    DEBUG: true,                       // 上线前置为 false

    STORAGE_KEY: 'bencao_h5_session_v1',
    SCHEMA_VERSION: 1,
    STORAGE_TTL: 7 * 24 * 3600 * 1000, // 7 天

    SAVE_DEBOUNCE: 300,                // store 持久化防抖
    CLICK_DEBOUNCE: 300,               // 按钮防抖
    DRAG_THRESHOLD: 8,                 // 拖拽判定阈值 px

    ANIM_PADDING: 800,                 // 动画超时保险冗余 ms
    TOTAL_PAGES: 13,

    // 页面枚举
    PAGE: {
      P01: 1, P02: 2, P03: 3, P04: 4, P05: 5, P06: 6, P07: 7,
      P08: 8, P09: 9, P10: 10, P11: 11, P12: 12, P13: 13
    },

    // 页面模块名映射
    PAGE_KEY: {
      1: 'p01', 2: 'p02', 3: 'p03', 4: 'p04', 5: 'p05', 6: 'p06', 7: 'p07',
      8: 'p08', 9: 'p09', 10: 'p10', 11: 'p11', 12: 'p12', 13: 'p13'
    },

    // 阶段指示器（跨端规范：不显示 13 屏编号）
    STAGE: {
      1: '', 2: 'EXPLORE', 3: 'EXPLORE', 4: 'EXPLORE', 5: 'EXPLORE', 6: 'EXPLORE', 7: 'EXPLORE',
      8: 'PROFILE', 9: 'PROFILE',
      10: 'CREATE', 11: 'CREATE', 12: 'CREATE', 13: 'CREATE'
    },

    ASSET: {
      herbDir: 'assets/herbs/',
      brandDir: 'assets/brand/',
      iconDir: 'assets/icons/',
      bgDir: 'assets/bg/'
    }
  };

})(globalThis.BC);
