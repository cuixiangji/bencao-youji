/*! core/router.js —— 13 屏路由 + 历史栈 + 返回（严格遵循 v1.1） */
(function (BC) {
  'use strict';

  var isProgrammaticPop = false;  // 防止 popstate 循环
  var exitArmed = false;          // PAGE01「再按一次退出」
  var current = 1;
  var started = false;

  function pageEl(page) {
    if (typeof document === 'undefined') return null;
    return document.getElementById('page-' + ('0' + page).slice(-2));
  }

  function moduleOf(page) {
    var key = BC.config.PAGE_KEY[page];
    return (BC.pages && key && BC.pages[key]) ? BC.pages[key] : null;
  }

  /** 前置数据校验：返回允许进入的页码 */
  function canEnter(page) {
    var st = BC.store ? BC.store.get() : null;
    if (!st) return 1;
    var herbs3 = st.selectedHerbs && st.selectedHerbs.length === 3;
    var scoreOK = !!(st.bodyScores && typeof st.bodyScores.qi === 'number' && st.explorationType && st.explorationType.type);
    var teaOK = !!(st.selectedTea && BC.data.teaById[st.selectedTea]);
    var archiveOK = !!(st.archiveData && st.archiveData.teaName);

    var t = page;
    if (t >= 13 && !archiveOK) t = 12;
    if (t >= 12 && !(herbs3 && scoreOK && teaOK)) t = 11;
    if (t >= 11 && !teaOK) t = 10;
    if (t >= 10 && !scoreOK) t = 9;
    if (t >= 8 && !herbs3) t = 7;
    if ((t >= 4 && t <= 7) && !herbs3) t = 3;
    return t;
  }

  function hideAll() {
    for (var p = 1; p <= BC.config.TOTAL_PAGES; p++) {
      var el = pageEl(p);
      if (el) el.hidden = true;
    }
  }

  function showPage(page) {
    var el = pageEl(page);
    if (el) el.hidden = false;
  }

  function setStageIndicator(page) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('bc-stage-label');
    if (!el) return;
    var label = BC.config.STAGE[page] || '';
    el.textContent = label;
    el.style.display = label ? '' : 'none';
  }

  function setBackButton(page) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('bc-back');
    if (!el) return;
    el.style.display = (page <= 1) ? 'none' : '';
  }

  /** 实际执行页面切换（不含 history 操作） */
  function swap(to, ctx) {
    var from = current;
    var fromMod = moduleOf(from);
    if (fromMod && typeof fromMod.leave === 'function') {
      try { fromMod.leave(ctx || {}); } catch (e) { BC.warn('leave error', from, e && e.message); }
    }

    hideAll();
    current = to;
    showPage(to);
    setStageIndicator(to);
    setBackButton(to);
    BC.store.set('currentPage', to);

    var toMod = moduleOf(to);
    if (toMod) {
      if (typeof toMod.render === 'function') {
        try { toMod.render(ctx || {}); } catch (e) { BC.warn('render error', to, e && e.message); }
      }
      if (typeof toMod.enter === 'function') {
        try { toMod.enter(ctx || {}); } catch (e) { BC.warn('enter error', to, e && e.message); }
      }
    }
    BC.log('router.swap', from, '->', to);
  }

  /** 前进：pushState + 入栈 */
  function go(page, ctx) {
    page = Math.max(1, Math.min(BC.config.TOTAL_PAGES, page | 0));
    var target = canEnter(page);
    if (target !== page) { BC.log('router.go redirect', page, '->', target); }
    if (target === current) return;

    var hist = BC.store.get('pageHistory') || [1];
    if (hist[hist.length - 1] !== current) hist.push(current);
    hist.push(target);
    BC.store.set('pageHistory', hist);

    try {
      history.pushState({ page: target }, '', '#' + target);
    } catch (e) { /* ignore */ }

    swap(target, ctx);
  }

  /** 替换：不产生新历史 */
  function replace(page, ctx) {
    page = Math.max(1, Math.min(BC.config.TOTAL_PAGES, page | 0));
    var hist = BC.store.get('pageHistory') || [1];
    hist[hist.length - 1] = page;
    BC.store.set('pageHistory', hist);
    try { history.replaceState({ page: page }, '', '#' + page); } catch (e) { /* ignore */ }
    swap(page, ctx);
  }

  /** 返回上一实际页面 */
  function back(ctx) {
    var hist = BC.store.get('pageHistory') || [];
    // 弹掉当前
    if (hist.length) hist.pop();
    if (!hist.length) {
      // 已在 PAGE01：不响应（哨兵 + 二次确认退出由 popstate 处理）
      BC.store.set('pageHistory', [1]);
      return false;
    }
    var prev = hist[hist.length - 1];
    BC.store.set('pageHistory', hist);

    isProgrammaticPop = true;
    try { history.back(); } catch (e) { isProgrammaticPop = false; swap(prev, ctx); return true; }
    // 真实切换发生在 popstate
    pendingCtx = ctx;
    return true;
  }

  var pendingCtx = null;

  function onPopState(ev) {
    var st = (ev && ev.state) || {};
    var page = st.page;

    if (page === undefined || page === null) {
      // 退回哨兵之外（用户想离开）
      if (exitArmed) { return; }  // 真的离开
      exitArmed = true;
      // 重新推回 PAGE01，拦截退出
      try { history.pushState({ page: 1, sentinel: true }, '', '#1'); } catch (e) { /* ignore */ }
      try { if (BC.utils && BC.utils.toast) BC.utils.toast('再按一次返回键离开'); } catch (e) { /* ignore */ }
      setTimeout(function () { exitArmed = false; }, 1500);
      if (current !== 1) swap(1, {});
      return;
    }

    if (isProgrammaticPop) {
      isProgrammaticPop = false;
      var ctx = pendingCtx; pendingCtx = null;
      swap(page, ctx || {});
      return;
    }

    // 被动返回（物理键 / 左滑）：同步历史栈
    var hist = BC.store.get('pageHistory') || [1];
    if (hist.length > 1) hist.pop();
    if (!hist.length) hist = [1];
    BC.store.set('pageHistory', hist);
    swap(page, {});
  }

  /** 启动 */
  function start(page, ctx) {
    if (started) return;
    started = true;

    // PAGE01 哨兵：replaceState 建立基点，再 pushState 一层用于拦截
    try {
      history.replaceState({ page: 1, sentinel: true }, '', '#1');
      history.pushState({ page: 1 }, '', '#1');
    } catch (e) { /* ignore */ }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', function (ev) {
        try { onPopState(ev); } catch (e) { BC.warn('popstate error', e && e.message); }
      }, false);
    }

    var p = page || 1;
    swap(p, ctx || {});
    BC.log('router.start at', p);
  }

  BC.router = {
    go: go,
    back: back,
    replace: replace,
    start: start,
    canEnter: canEnter,
    currentPage: function () { return current; },
    isStarted: function () { return started; }
  };

})(globalThis.BC);
