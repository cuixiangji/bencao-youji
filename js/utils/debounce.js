/*! utils/debounce.js + toast.js */
(function (BC) {
  'use strict';

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var ctx = this, args = arguments;
      if (t) clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(ctx, args); }, wait || 200);
    };
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last < (wait || 100)) return;
      last = now;
      return fn.apply(this, arguments);
    };
  }

  /* ───── toast ───── */
  var lastMsg = '', lastTime = 0, timer = null;

  function toast(msg, duration) {
    if (typeof document === 'undefined') return;
    var now = Date.now();
    if (msg === lastMsg && now - lastTime < 3000) return;   // 3s 内同文案不重复
    lastMsg = msg; lastTime = now;

    var box = document.getElementById('bc-toast');
    if (!box) return;
    box.textContent = String(msg == null ? '' : msg);
    box.hidden = false;
    box.classList.add('is-show');
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      box.classList.remove('is-show');
      setTimeout(function () { box.hidden = true; }, 250);
    }, duration || 2000);
  }

  BC.utils = BC.utils || {};
  BC.utils.debounce = debounce;
  BC.utils.throttle = throttle;
  BC.utils.toast = toast;

})(globalThis.BC);
