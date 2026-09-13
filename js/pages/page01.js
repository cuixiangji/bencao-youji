/*!
 * js/pages/page01.js —— PAGE01 开场动画（品牌沉浸入口）
 *
 * 契约：BC.pages.p01 = { render(ctx), enter(ctx), leave(ctx) }（由 router 调用）
 * 硬约束：
 *  - 动画绝不阻塞逻辑：主按钮「开启探索」始终可点，不等 animationend
 *  - 任意点击动画区 → 立即跳到完成态（skip）
 *  - 遵守 SKIP_ANIMATION / lowPerf / reducedMotion（走 BC.fx + BC.compat）
 *  - P01 不显示返回按钮（router 已按 page<=1 隐藏，此处不再处理）
 *  - 不写 store、不改路由、不动核心算法
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var timers = [];
  var played = false;      // 本次会话是否已播完（从 P02 返回 P01 不重播）
  var stageEl = null, plantEl = null, hintEl = null;

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
  }

  /** 植物 SVG（种子 / 茎 / 双叶 / 花苞 / 土线），阶段由 data-stage 驱动 CSS 过渡 */
  function plantSVG() {
    return '' +
      '<svg class="p01-plant" viewBox="0 0 120 140" role="img" aria-label="本草生长" data-stage="seed">' +
      '<line class="p01-soil" x1="26" y1="120" x2="94" y2="120" />' +
      '<ellipse class="p01-seed" cx="60" cy="112" rx="9" ry="6.5" />' +
      '<path class="p01-stem" d="M60 112 C60 92 60 74 60 46" />' +
      '<g class="g-l"><path class="p01-leaf" d="M60 88 C44 88 34 76 34 62 C50 58 60 70 60 88 Z" /></g>' +
      '<g class="g-r"><path class="p01-leaf" d="M60 72 C76 72 86 60 86 46 C70 42 60 54 60 72 Z" /></g>' +
      '<circle class="p01-bud" cx="60" cy="40" r="7" />' +
      '</svg>';
  }

  function setStage(s) {
    if (plantEl) plantEl.setAttribute('data-stage', s);
  }

  /** 跳到完成态：清定时器 + 置完成态 + 收提示（任何时候调用都安全） */
  function finish() {
    clearTimers();
    played = true;
    setStage('grown');
    if (hintEl) hintEl.setAttribute('data-done', '1');
  }

  /** 播放：seed → sprout → grown。使用定时器推进，不依赖 animationend */
  function start() {
    clearTimers();
    setStage('seed');
    if (hintEl) hintEl.setAttribute('data-done', '0');

    // 降级：SKIP_ANIMATION / prefers-reduced-motion / 低端机 → 直接完成态
    if (BC.fx.shouldSkip() || (BC.compat && BC.compat.lowPerf)) {
      finish();
      return;
    }

    timers.push(setTimeout(function () {
      setStage('sprout');
      if (plantEl) BC.fx.play('anim-grow', plantEl, { duration: 600 });
    }, 620));
    timers.push(setTimeout(finish, 1900));
  }

  var mod = {
    render: function () {
      var root = document.getElementById('page-01');
      if (!root) return;
      root.innerHTML = '';

      var wrap = U.el('div', 'p01');

      /* 动画舞台（点击跳过） */
      stageEl = U.el('div', 'p01-stage');
      stageEl.setAttribute('role', 'button');
      stageEl.setAttribute('aria-label', '跳过开场动画');
      stageEl.innerHTML = '<div class="p01-ring"></div>' + plantSVG();
      plantEl = stageEl.querySelector('.p01-plant');
      wrap.appendChild(stageEl);

      /* 品牌区 */
      var brand = U.el('div', 'p01-brand');
      brand.innerHTML =
        '<div class="p01-logo"><span class="p01-logo-mark"></span>本草有迹</div>' +
        '<h1 class="p01-title">我的本草旅程</h1>' +
        '<div class="p01-sub en">DIGITAL BOTANICAL MUSEUM</div>';
      wrap.appendChild(brand);

      /* 底部 */
      var foot = U.el('div', 'page-foot p01-foot');
      var btn = U.el('button', 'btn p01-start', '开启探索');
      btn.setAttribute('type', 'button');
      U.onClick(btn, function () {
        // 不等待动画：无论处于哪个阶段都允许继续
        finish();
        BC.router.go(2);
      });
      hintEl = U.el('div', 'p01-hint', '轻触植物可跳过动画');
      foot.appendChild(btn);
      foot.appendChild(hintEl);
      wrap.appendChild(foot);

      root.appendChild(wrap);

      // 跳过：动画区任意点击
      U.onClick(stageEl, function () { finish(); });
    },

    enter: function () {
      if (played) { finish(); return; }
      start();
      var brand = document.querySelector('#page-01 .p01-brand');
      if (brand) BC.fx.play('anim-rise', brand, { duration: 600 });
    },

    leave: function () {
      clearTimers();
    },

    /* 仅供测试探针使用 */
    _dev: {
      reset: function () { played = false; },
      stage: function () { return plantEl ? plantEl.getAttribute('data-stage') : ''; }
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p01 = mod;

})(globalThis.BC);
