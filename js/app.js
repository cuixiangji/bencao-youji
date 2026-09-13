/*! app.js —— 启动引导（唯一入口） */
(function (BC) {
  'use strict';

  function boot() {
    // 1. 能力探测
    BC.compatDetect();

    // 2. 全局异常捕获
    BC.errorsInstall();

    // 3. Store
    BC.store.init();

    // 4. 恢复会话
    var r = { ok: false, page: 1, repaired: false, reason: 'none' };
    try { r = BC.store.restore(); } catch (e) { BC.warn('restore failed', e && e.message); }

    // 5. 显示容器
    var root = document.getElementById('h5-root');
    if (root) root.hidden = false;

    // 6. Router 启动
    BC.router.start(r.page || 1, {});

    // 7. 绑定统一返回按钮
    var backBtn = document.getElementById('bc-back');
    if (backBtn) {
      BC.utils.onClick(backBtn, function () { BC.router.back(); });
    }

    // 8. 隐藏骨架
    var bootEl = document.getElementById('bc-boot');
    if (bootEl) {
      bootEl.setAttribute('data-state', 'done');
      setTimeout(function () { bootEl.hidden = true; }, 200);
    }

    // 9. 恢复提示
    if (r.ok && r.repaired) {
      BC.utils.toast('已恢复上次的探索进度');
    } else if (r.ok && r.page > 1) {
      BC.utils.toast('已恢复上次的探索进度');
    }

    BC.ready = true;
    BC.log('boot done, page =', r.page, 'reason =', r.reason);

    // 开发调试入口
    BC.debug = {
      state: function () { return BC.store.get(); },
      goto: function (p) { BC.router.go(p); },
      reset: function () { BC.store.reset(); BC.router.replace(1); }
    };
  }

  function safeBoot() {
    try {
      boot();
    } catch (e) {
      BC.warn('boot failed', e && e.message);
      // 兜底：即使启动失败也不白屏（骨架保持可见并切错误态）
      try {
        var b = document.getElementById('bc-boot');
        if (b) b.setAttribute('data-state', 'error');
      } catch (e2) { /* ignore */ }
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', safeBoot, false);
    } else {
      safeBoot();
    }
  }
  BC.bootGuard(6000);

})(globalThis.BC);
