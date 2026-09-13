/*!
 * BC 命名空间 —— 必须在所有脚本之前加载
 * 同时兼容浏览器与 Node（供 tests/ 下的逻辑单测直接 require）
 */
(function (g) {
  'use strict';

  var BC = g.BC || (g.BC = {});

  BC.version = '4.0.0';
  BC.ready = false;

  // 各层命名空间容器（后续文件按需挂载）
  BC.config = BC.config || {};
  BC.compat = BC.compat || {};
  BC.data = BC.data || {};
  BC.logic = BC.logic || {};
  BC.utils = BC.utils || {};
  BC.render = BC.render || {};
  BC.fx = BC.fx || {};
  BC.share = BC.share || {};
  BC.pages = BC.pages || {};
  BC.store = BC.store || null;   // 由 core/store.js 赋真实实现
  BC.router = BC.router || null; // 由 core/router.js 赋真实实现

  // 简易日志（仅开发环境输出，不影响界面）
  BC.log = function () {
    if (!BC.config || !BC.config.DEBUG) return;
    try {
      var args = Array.prototype.slice.call(arguments);
      if (typeof console !== 'undefined' && console.log) console.log.apply(console, ['[BC]'].concat(args));
    } catch (e) { /* 静默 */ }
  };

  BC.warn = function () {
    try {
      var args = Array.prototype.slice.call(arguments);
      if (typeof console !== 'undefined' && console.warn) console.warn.apply(console, ['[BC]'].concat(args));
    } catch (e) { /* 静默 */ }
  };

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
