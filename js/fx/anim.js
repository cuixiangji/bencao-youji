/*!
 * fx/anim.js —— 统一动画出口
 * 硬要求：动画不能阻塞逻辑 → 「animationend OR 超时」双保险 + once 标志
 */
(function (BC) {
  'use strict';

  var handles = [];

  function shouldSkip() {
    var st = (BC.store && BC.store.get) ? BC.store.get('skipAnimation') : false;
    return !!(st || (BC.compat && BC.compat.reducedMotion));
  }

  /**
   * @param {string} name  动画 class 名（anim-fade / anim-rise / anim-grow …）
   * @param {Element} el
   * @param {Object} [opts] { duration: 毫秒 }
   * @param {Function} [done]
   * @returns {{cancel:Function}}
   */
  function play(name, el, opts, done) {
    var o = opts || {};
    var duration = typeof o.duration === 'number' ? o.duration : 600;
    var cb = typeof done === 'function' ? done : function () {};

    if (!el) { safeDone(cb); return { cancel: function () {} }; }

    // 短路：SKIP_ANIMATION / prefers-reduced-motion
    if (shouldSkip()) {
      try { el.classList.add(name); } catch (e) { /* ignore */ }
      safeDone(cb);
      return { cancel: function () {} };
    }

    var fired = false;
    var timer = null;
    var offEvt = null;

    function finish() {
      if (fired) return;
      fired = true;
      if (timer) { clearTimeout(timer); timer = null; }
      if (offEvt) { try { offEvt(); } catch (e) { /* ignore */ } offEvt = null; }
      safeDone(cb);
    }

    try {
      el.classList.remove(name);
      // 强制回流，保证重复播放
      void el.offsetWidth;
      el.classList.add(name);
    } catch (e) {
      finish();
      return { cancel: function () {} };
    }

    offEvt = BC.safeOn(el, 'animationend', finish);

    // 超时保险（关键：动画事件不触发也必须继续）
    timer = setTimeout(finish, duration + BC.config.ANIM_PADDING);

    var h = { cancel: finish };
    handles.push(h);
    return h;
  }

  function safeDone(cb) {
    try { cb(); } catch (e) { BC.warn('fx done error', e && e.message); }
  }

  function stopAll() {
    for (var i = 0; i < handles.length; i++) {
      try { handles[i].cancel(); } catch (e) { /* ignore */ }
    }
    handles = [];
  }

  BC.fx = BC.fx || {};
  BC.fx.play = play;
  BC.fx.stopAll = stopAll;
  BC.fx.shouldSkip = shouldSkip;

})(globalThis.BC);
