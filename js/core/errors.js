/*! 全局异常捕获 + 安全包装（目标：任何错误都不白屏、不阻断流程） */
(function (BC) {
  'use strict';

  var errors = {
    count: 0,
    lastMessage: ''
  };

  /**
   * 安全执行：出错返回兜底值，绝不抛出
   * @param {Function} fn
   * @param {*} fallback
   * @param {string} [tag]
   */
  function tryWrap(fn, fallback, tag) {
    if (typeof fn !== 'function') return fallback;
    try {
      return fn();
    } catch (e) {
      errors.count++;
      errors.lastMessage = (tag || '') + ' ' + (e && e.message ? e.message : String(e));
      BC.warn('tryWrap caught:', errors.lastMessage);
      return fallback;
    }
  }

  /**
   * 安全绑定事件：监听器内部异常被吞掉，不影响页面
   */
  function safeOn(el, type, handler, opts) {
    if (!el || !el.addEventListener) return function () {};
    var wrapped = function (ev) {
      try { return handler(ev); } catch (e) { BC.warn('event error:', type, e && e.message); }
    };
    el.addEventListener(type, wrapped, opts || false);
    return function () { try { el.removeEventListener(type, wrapped, opts || false); } catch (e) {} };
  }

  function onGlobalError(message, source, lineno, colno, error) {
    errors.count++;
    errors.lastMessage = String(message || '');
    BC.warn('window.error:', errors.lastMessage);
    // 只记录 + 清理装饰层，绝不跳转/刷新/弹系统错误
    try {
      var fx = BC.fx;
      if (fx && typeof fx.stopAll === 'function') fx.stopAll();
    } catch (e) { /* ignore */ }
    return false;
  }

  function onRejection(ev) {
    errors.count++;
    var r = ev && ev.reason;
    errors.lastMessage = (r && r.message) ? r.message : String(r);
    BC.warn('unhandledrejection:', errors.lastMessage);
    try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (e) { /* ignore */ }
  }

  function install() {
    if (typeof window === 'undefined') return;
    try {
      window.addEventListener('error', onGlobalError, false);
      window.addEventListener('unhandledrejection', onRejection, false);
    } catch (e) { /* ignore */ }
  }

  /**
   * JS 加载失败守护：超过 timeout 仍未就绪则显示兜底提示（不白屏）
   */
  function bootGuard(timeout) {
    if (typeof document === 'undefined') return;
    setTimeout(function () {
      try {
        if (BC.ready) return;
        var sk = document.getElementById('bc-boot');
        if (sk) sk.setAttribute('data-state', 'error');
      } catch (e) { /* ignore */ }
    }, timeout || 6000);
  }

  BC.errors = errors;
  BC.tryWrap = tryWrap;
  BC.safeOn = safeOn;
  BC.errorsInstall = install;
  BC.bootGuard = bootGuard;

})(globalThis.BC);
