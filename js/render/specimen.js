/*!
 * render/specimen.js —— 「数字本草图鉴卡」共享渲染层（P04 / P05 / P06 共用）
 *
 * 设计目标：
 *  1. 三页版式完全一致 → 只写一份，避免 page04/05/06 复制粘贴
 *  2. 正式素材优先：assets/herbs/{基名}.webp →（失败）{基名}.svg →（失败）placeholderSVG
 *     不修改现有 placeholder API（BC.render.placeholderSVG 原样调用）
 *  3. 纯节点构建；除读取 BC.store.selectedHerbs 外不读不写任何 store 状态
 *     顺序即卡片顺序：[0]→P04(01)、[1]→P05(02)、[2]→P06(03)，不重排 / 不重算 / 不复制
 *
 * 【实现要点】
 *  - hexA()：把 PALETTE 的 #RRGGBB 转成 rgba()，规避旧 X5 内核不支持 8 位 hex 的问题
 *  - insertAdjacentHTML()：新增装饰层时不重序列化已有子节点（比 innerHTML += 安全）
 *  - 不足 3 味 → buildFallback()，绝不白屏
 */
(function (BC) {
  'use strict';

  var U = BC.utils;

  /* 图片可用性记忆：base → 'webp' | 'svg' | 'placeholder'（避免每次重进都重复探测） */
  var imgCache = {};

  function pad2(n) { return ('0' + n).slice(-2); }

  function baseOf(herb) { return (herb && (herb.image || herb.id)) || ''; }

  function colorOf(herb) { return BC.render.herbColor(herb.id); }

  /** #RRGGBB / #RGB → rgba(r,g,b,alpha)；非法值退回本草默认绿 */
  function hexA(hex, alpha) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    var n = (h.length === 6) ? parseInt(h, 16) : NaN;
    if (isNaN(n)) return 'rgba(138,154,123,' + alpha + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  /* ─────────── 主视觉：正式图优先，逐级降级 ─────────── */

  function mountFigure(box, herb, sizePx) {
    if (!box) return;
    var base = baseOf(herb);
    var color = colorOf(herb);
    var known = imgCache[base];

    // 无资源基名 / 无 asset 工具 / 已知只能用几何占位 → 直接占位
    if (known === 'placeholder' || !base || !BC.utils.asset) {
      box.innerHTML = BC.render.placeholderSVG(color, herb.name, sizePx);
      return;
    }

    var paths = BC.utils.asset.resolve(base);

    var img = document.createElement('img');
    img.className = 'sp-img anim-fade';
    img.alt = herb.name;
    img.setAttribute('decoding', 'async');

    img.onerror = function () {
      imgCache[base] = 'placeholder';         // SVG 缺失 → 几何占位（不破图）
      box.innerHTML = BC.render.placeholderSVG(color, herb.name, sizePx);
    };
    img.onload = function () {
      imgCache[base] = 'svg';
      img.className = 'sp-img is-ready';
    };

    img.setAttribute('src', paths.svg);       // 当前仅有 SVG 资产，直接读取
    box.innerHTML = '';
    box.appendChild(img);
  }

  /* ─────────── 标本装饰层（细线圆环 / 定位线 / 坐标点 / 轨道弧） ───────────
     全部为极细线，样式在 css/pages/specimen.css 中按 CSS 变量统一调控，
     每页只改变量、不改结构 —— 三页共用同一视觉系统。 */

  function frameSVG() {
    return '' +
      '<svg class="sp-rings" viewBox="0 0 240 240" aria-hidden="true" focusable="false">' +
      '<circle class="sp-r1" cx="120" cy="120" r="112"/>' +
      '<circle class="sp-r2" cx="120" cy="120" r="84"/>' +
      '<path class="sp-axis" d="M6 120 H234"/>' +
      '<path class="sp-axis" d="M120 6 V234"/>' +
      '<path class="sp-tick" d="M120 4 V14 M120 226 V236 M4 120 H14 M226 120 H236"/>' +
      '<circle class="sp-dot" cx="120" cy="8" r="1.6"/>' +
      '<circle class="sp-dot" cx="232" cy="120" r="1.6"/>' +
      '<circle class="sp-dot" cx="120" cy="232" r="1.6"/>' +
      '<circle class="sp-dot" cx="8" cy="120" r="1.6"/>' +
      '<path class="sp-orbit" d="M120 32 A88 88 0 0 1 208 120"/>' +
      '</svg>';
  }

  /* ─────────── 信息行 ─────────── */

  function row(label, value) {
    if (!value) return null;
    var r = U.el('div', 'sp-row');
    r.appendChild(U.el('span', 'sp-row-k', label));
    r.appendChild(U.el('span', 'sp-row-v', value));
    return r;
  }

  /**
   * 构建一张图鉴卡
   * @param {Object} herb  BC.data.herbs 中的对象
   * @param {Object} opts  { slot, total, copyTitle, copyDesc, ctaText, onCta, note }
   * @returns {Element}
   */
  function build(herb, opts) {
    var o = opts || {};
    var total = o.total || 3;
    var slot = o.slot || 1;
    var color = colorOf(herb);

    var root = U.el('div', 'sp');
    root.setAttribute('data-herb', herb.id);
    root.setAttribute('data-slot', String(slot));
    root.setAttribute('data-total', String(total));

    /* ── 中部主体 ── */
    var body = U.el('div', 'sp-body');

    // 药材位序（例如 01 / 03）
    var slotEl = U.el('div', 'sp-slot');
    slotEl.innerHTML = '<b>' + pad2(slot) + '</b><span> / ' + pad2(total) + '</span>';
    body.appendChild(slotEl);

    body.appendChild(U.el('h1', 'sp-name', herb.name));
    body.appendChild(U.el('div', 'sp-latin en', herb.latin || ''));

    var kws = U.el('div', 'sp-kws');
    (herb.keywords || []).forEach(function (k) { kws.appendChild(U.el('span', 'tag', k)); });
    body.appendChild(kws);

    /* ── 主视觉（约页面高度 30%–38%） ── */
    var visual = U.el('div', 'sp-visual');
    var halo = U.el('div', 'sp-halo');
    halo.style.background = 'radial-gradient(circle, ' + hexA(color, '.28') + ' 0%, ' +
      hexA(color, '.10') + ' 46%, rgba(12,11,9,0) 72%)';
    visual.appendChild(halo);
    visual.insertAdjacentHTML('beforeend', frameSVG());   // 不重序列化已有子节点
    var fig = U.el('div', 'sp-figure');
    visual.appendChild(fig);
    body.appendChild(visual);
    mountFigure(fig, herb, 220);

    /* ── 叙事辅助文案（三页各一句，串联成一条连续叙事） ── */
    if (o.copyTitle) {
      var copy = U.el('div', 'sp-copy');
      copy.appendChild(U.el('div', 'sp-copy-t', o.copyTitle));
      if (o.copyDesc) copy.appendChild(U.el('div', 'sp-copy-d', o.copyDesc));
      body.appendChild(copy);
    }

    /* ── 信息区：标签行（非大段文字墙） ── */
    var rows = U.el('div', 'sp-rows');
    var list = [
      row('性味', (herb.property || '') + (herb.taste ? ' · ' + herb.taste : '')),
      row('产地', herb.origin || ''),
      row('观察', herb.observation || '')
    ];
    list.forEach(function (r) { if (r) rows.appendChild(r); });
    body.appendChild(rows);

    if (herb.description) {
      var desc = U.el('div', 'sp-desc');
      desc.appendChild(U.el('div', 'sp-label', '标本记述'));
      desc.appendChild(U.el('p', 'sp-desc-p', herb.description));
      body.appendChild(desc);
    }

    if (o.note) body.appendChild(U.el('div', 'sp-note', o.note));

    root.appendChild(body);

    /* ── 底部操作（固定底栏，安全区已计入） ── */
    var foot = U.el('div', 'page-foot sp-foot');
    var btn = U.el('button', 'btn sp-cta', o.ctaText || '继续');
    btn.setAttribute('type', 'button');
    if (typeof o.onCta === 'function') U.onClick(btn, o.onCta);
    foot.appendChild(btn);
    root.appendChild(foot);

    return root;
  }

  /* ── 安全降级视图（selectedHerbs 缺失 / 不足 3 味）：绝不白屏 ── */
  function buildFallback(message, ctaText, onCta) {
    var root = U.el('div', 'sp sp-degraded');
    root.setAttribute('data-degrade', '1');
    var body = U.el('div', 'sp-body');
    body.appendChild(U.el('div', 'sp-slot'));
    body.appendChild(U.el('h1', 'sp-name', '本草图鉴'));

    var visual = U.el('div', 'sp-visual');
    visual.appendChild(U.el('div', 'sp-halo'));
    visual.insertAdjacentHTML('beforeend', frameSVG());
    var fig = U.el('div', 'sp-figure');
    visual.appendChild(fig);
    fig.innerHTML = BC.render.placeholderSVG('#8A9A7B', '草', 220);
    body.appendChild(visual);

    body.appendChild(U.el('div', 'sp-copy-d', message || '请先完成三味本草选择'));
    root.appendChild(body);

    var foot = U.el('div', 'page-foot sp-foot');
    var btn = U.el('button', 'btn sp-cta', ctaText || '返回本草探索');
    btn.setAttribute('type', 'button');
    if (typeof onCta === 'function') U.onClick(btn, onCta);
    foot.appendChild(btn);
    root.appendChild(foot);
    return root;
  }

  /* ── 顶栏阶段位文案（写入现有 #bc-stage-label，不新增 UI 元素） ──
     写入时机：enter()（router 先 setStageIndicator 再调 enter，故此处覆盖生效） */
  function setStageLabel(text) {
    if (typeof document === 'undefined') return false;
    var el = document.getElementById('bc-stage-label');
    if (!el) return false;
    el.textContent = text || '';
    el.style.display = text ? '' : 'none';
    return true;
  }

  /* ── 右上英文页标（图鉴卡专用写法：HERBAL SPECIMEN 01/03） ── */
  function setSpecimenLabel(slot, total) {
    return setStageLabel('HERBAL SPECIMEN ' + pad2(slot) + '/' + pad2(total || 3));
  }

  /* ── 安全降级：回到 P03 ──
     只走 Router 公开 API，不直接操作 history。
     这里选 replace 而非 back：降级属于异常兜底路径（正常经 router.go 进入时
     canEnter 已保证 selectedHerbs 满 3），历史栈不保证含有 P03；且 back() 依赖
     popstate 异步落地，无法在同一次调用内确认结果。 */
  function backToP03() {
    BC.router.replace(3);
  }

  /**
   * 生成一个图鉴卡页面模块（P04 / P05 / P06 共用）
   * @param {Object} cfg { page, slot, total, copyTitle, copyDesc, ctaText, nextPage, note, onCta }
   * @returns {{render:Function, enter:Function, leave:Function}}
   */
  function pager(cfg) {
    var c = cfg || {};
    var slot = c.slot || 1;
    var total = c.total || 3;
    var pageId = 'page-' + pad2(c.page);

    return {
      render: function () {
        var root = (typeof document === 'undefined') ? null : document.getElementById(pageId);
        if (!root) return;
        root.innerHTML = '';

        var sel = BC.store.get('selectedHerbs');
        var list = Array.isArray(sel) ? sel : [];

        // 顺序即卡片顺序：selectedHerbs[slot-1] —— 不重排、不重算、不复制状态
        // 不足 total 味 → 安全降级（不白屏），并给出回 P03 的入口
        if (list.length < total) {
          root.appendChild(buildFallback('请先完成三味本草选择', '返回本草探索', backToP03));
          return;
        }
        var herb = BC.data.herbById[list[slot - 1]];
        if (!herb) {
          root.appendChild(buildFallback('请先完成三味本草选择', '返回本草探索', backToP03));
          return;
        }

        root.appendChild(build(herb, {
          slot: slot,
          total: total,
          copyTitle: c.copyTitle,
          copyDesc: c.copyDesc,
          ctaText: c.ctaText,
          note: c.note,
          onCta: function () {
            if (typeof c.onCta === 'function') { c.onCta(); return; }
            if (c.nextPage) BC.router.go(c.nextPage);
          }
        }));
      },

      enter: function () {
        setSpecimenLabel(slot, total);
        var body = document.querySelector('#' + pageId + ' .sp-body');
        if (body) BC.fx.play('anim-rise', body, { duration: 600 });
      },

      // 无定时器 / 无 rAF / 无全局监听 → 无需清理
      leave: function () {}
    };
  }

  BC.render = BC.render || {};
  BC.render.specimen = {
    build: build,
    buildFallback: buildFallback,
    mountFigure: mountFigure,
    setSpecimenLabel: setSpecimenLabel,
    setStageLabel: setStageLabel,
    pager: pager,
    backToP03: backToP03,
    hexA: hexA,
    _imgCache: imgCache
  };

})(globalThis.BC);
