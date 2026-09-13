/*!
 * js/pages/page02.js —— PAGE02 本草秘境（世界观 + 12 种本草漂浮 + 少量装饰粒子）
 *
 * 数据：全部来自 BC.data.herbs（名称与数量均不硬编码）
 * 约束：
 *  - Canvas 仅做装饰；lowPerf / reducedMotion / 无 canvas → 直接不开粒子
 *  - 粒子在 leave() 停止 rAF，绝不阻塞页面
 *  - 装饰层 pointer-events: none，不吃点击
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var rafId = null;
  var canvasEl = null;

  function stopParticles() {
    if (rafId !== null) {
      try { cancelAnimationFrame(rafId); } catch (e) { /* ignore */ }
      rafId = null;
    }
    if (canvasEl) {
      try {
        var ctx = canvasEl.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      } catch (e) { /* ignore */ }
    }
  }

  /** 极轻量装饰粒子：14 个点，慢速漂移；任何异常都静默退出 */
  function startParticles(cv) {
    var compat = BC.compat || {};
    if (!compat.canvas || compat.lowPerf || compat.reducedMotion) return;
    if (BC.fx.shouldSkip()) return;
    if (typeof requestAnimationFrame !== 'function') return;

    var ctx;
    try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return;

    var w = cv.clientWidth || 320, h = cv.clientHeight || 320;
    var dpr = Math.min(compat.dpr || 1, 2);
    try {
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } catch (e) { /* ignore */ }

    var n = 14, dots = [], i;
    for (i = 0; i < n; i++) {
      dots.push({
        x: (i * 37 % 100) / 100 * w,
        y: (i * 53 % 100) / 100 * h,
        r: 0.8 + (i % 3) * 0.5,
        vx: ((i % 5) - 2) * 0.05,
        vy: -0.06 - (i % 4) * 0.02,
        a: 0.10 + (i % 4) * 0.05
      });
    }

    var alive = true;
    function frame() {
      if (!alive) return;
      try {
        ctx.clearRect(0, 0, w, h);
        for (var k = 0; k < dots.length; k++) {
          var d = dots[k];
          d.x += d.vx; d.y += d.vy;
          if (d.y < -6) { d.y = h + 4; }
          if (d.x < -6) { d.x = w + 4; }
          if (d.x > w + 6) { d.x = -4; }
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(233,228,216,' + d.a.toFixed(2) + ')';
          ctx.fill();
        }
      } catch (e) { alive = false; return; }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // 与页面生命周期绑定：离开即停
    cv.__bcStop = function () { alive = false; stopParticles(); };
  }

  var mod = {
    render: function () {
      var root = document.getElementById('page-02');
      if (!root) return;
      root.innerHTML = '';

      var herbs = BC.data.herbs || [];
      var wrap = U.el('div', 'p02');

      /* 文案 */
      var head = U.el('div', 'p02-head');
      head.innerHTML =
        '<div class="p02-eyebrow en">HERBAL REALM</div>' +
        '<h1 class="p02-title">本草秘境</h1>' +
        '<p class="p02-desc">十二种来自山野、田间与高原的植物伙伴，正在这里生长。' +
        '它们没有标签，只有气味与时间留下的痕迹。</p>' +
        '<div class="p02-count"><i></i>' + herbs.length + ' 种 · 等待被认识</div>';
      wrap.appendChild(head);

      /* 秘境舞台 */
      var field = U.el('div', 'p02-field');
      var cv = document.createElement('canvas');
      cv.className = 'p02-particles';
      cv.setAttribute('aria-hidden', 'true');
      field.appendChild(cv);
      canvasEl = cv;

      for (var i = 0; i < herbs.length; i++) {
        var h = herbs[i];
        var color = BC.render.herbColor(h.id);
        var item = U.el('div', 'p02-item');
        item.setAttribute('data-herb', h.id);
        item.innerHTML =
          '<div class="p02-item-svg">' + BC.render.placeholderSVG(color, h.name, 96) + '</div>' +
          '<div class="p02-item-name"></div>';
        var nm = item.querySelector('.p02-item-name');
        if (nm) nm.textContent = h.name;
        field.appendChild(item);
      }
      wrap.appendChild(field);

      /* CTA */
      var foot = U.el('div', 'page-foot p02-foot');
      var btn = U.el('button', 'btn p02-cta', '开始寻找');
      btn.setAttribute('type', 'button');
      U.onClick(btn, function () { BC.router.go(3); });
      var note = U.el('div', 'p02-foot-note', '选择 3 味与你相近的本草，开始这次探索');
      foot.appendChild(btn);
      foot.appendChild(note);
      wrap.appendChild(foot);

      root.appendChild(wrap);
    },

    enter: function () {
      var head = document.querySelector('#page-02 .p02-head');
      if (head) BC.fx.play('anim-rise', head, { duration: 600 });

      var items = U.$$('#page-02 .p02-item');
      for (var i = 0; i < items.length; i++) {
        var svg = items[i].querySelector('.p02-item-svg');
        if (!svg) continue;
        items[i].classList.add('is-float');
        // 错落延迟（内联 style，避免 nth-child 硬编码）
        svg.style.animationDelay = (i % 6) * 0.45 + 's';
        svg.style.animationDuration = (4.2 + (i % 4) * 0.6) + 's';
      }

      var cv = document.querySelector('#page-02 .p02-particles');
      if (cv) startParticles(cv);
    },

    leave: function () {
      var cv = document.querySelector('#page-02 .p02-particles');
      if (cv && typeof cv.__bcStop === 'function') { try { cv.__bcStop(); } catch (e) { /* ignore */ } }
      stopParticles();
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p02 = mod;

})(globalThis.BC);
