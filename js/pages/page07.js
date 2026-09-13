/*!
 * js/pages/page07.js —— PAGE07 我的三味本草
 *
 * 定位（连续叙事）：
 *   P03 选择 → P04–P06 认识 → **P07 收束、形成个人探索记录** → P08 我的身体观察
 * 关键词：MY HERBAL ARCHIVE / 探索记录 / 个人本草档案 / 数字植物标本馆
 * 不是普通列表页，也不是重新选择页 —— 这里展示的是「已经选定的结果」。
 *
 * 数据：唯一来源 BC.store.get('selectedHerbs')
 *   顺序即档案顺序  [0] 第一味 · [1] 第二味 · [2] 第三味
 *   不排序 / 不去重 / 不重新计算 / 不复制核心状态
 *
 * 复用：BC.render.specimen 的 mountFigure（正式图优先递减机制）、hexA（本草色）、
 *       setStageLabel（顶栏文案）；样式复用 .btn / .btn-text / .tag / page-foot 固定底栏范式。
 *       未复制 P04–P06 的图鉴卡代码。
 *
 * 冻结规则：本页唯一会写 store 的动作是「重新选择本草」——只清 selectedHerbs，
 *           其余 Store 数据（bodyAnswers / 探索结果 / 茶饮 / 档案等）一律不动。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;

  var PAGE_ID = 'page-07';
  var TOTAL = 3;

  /* 三味的档案短注（只有三行，不新增大量文案） */
  var NOTES = [
    { no: '01', en: 'FIRST ENCOUNTER' },
    { no: '02', en: 'DEEPER OBSERVATION' },
    { no: '03', en: 'FINAL RECORD' }
  ];

  function root() { return document.getElementById(PAGE_ID); }

  /* ─────────── 顶部装饰：细圆环 + 低透明度轨迹线 + 小型坐标点（克制） ───────────
     全部包在 inset:0 的 SVG 内，不越出容器，保证不产生横向溢出。 */
  function traceSVG() {
    return '' +
      '<svg class="ar-trace" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">' +
      '<circle class="ar-ring" cx="252" cy="46" r="30"/>' +
      '<circle class="ar-ring ar-ring-2" cx="252" cy="46" r="18"/>' +
      '<path class="ar-arc" d="M8 168 C 78 168 118 128 168 92 S 268 40 314 34"/>' +
      '<path class="ar-tick" d="M252 8 V16 M252 76 V84 M214 46 H222 M282 46 H290"/>' +
      '<circle class="ar-dot" cx="168" cy="92" r="1.6"/>' +
      '<circle class="ar-dot" cx="78" cy="168" r="1.6"/>' +
      '</svg>';
  }

  /* ─────────── 小本草色视觉（正式图优先，沿用既有机制） ─────────── */
  function figure(herb) {
    var color = BC.render.herbColor(herb.id);

    var box = U.el('div', 'ar-figure');
    var halo = U.el('div', 'ar-halo');
    halo.style.background = 'radial-gradient(circle, ' + SP.hexA(color, '.30') + ' 0%, ' +
      SP.hexA(color, '.10') + ' 52%, rgba(12,11,9,0) 78%)';
    box.appendChild(halo);

    var fig = U.el('div', 'ar-img');
    box.appendChild(fig);
    SP.mountFigure(fig, herb, 96);   // webp → svg → placeholderSVG（不修改 placeholder API）

    return box;
  }

  /* ─────────── 一条档案条目（第一味 / 第二味 / 第三味） ─────────── */
  function item(herb, i) {
    var note = NOTES[i] || NOTES[NOTES.length - 1];

    var row = U.el('div', 'ar-item');
    row.setAttribute('data-herb', herb.id);
    row.setAttribute('data-order', note.no);

    /* 细线连接 + 坐标点 */
    var rail = U.el('div', 'ar-rail');
    rail.appendChild(U.el('span', 'ar-node'));
    row.appendChild(rail);

    row.appendChild(figure(herb));

    var info = U.el('div', 'ar-info');

    var idx = U.el('div', 'ar-index en');
    idx.innerHTML = '<b>' + note.no + '</b><span> / ' + note.en + '</span>';
    info.appendChild(idx);

    info.appendChild(U.el('h2', 'ar-name', herb.name));
    info.appendChild(U.el('div', 'ar-latin en', herb.latin || ''));

    var kw = herb.keywords && herb.keywords[0];
    if (kw) info.appendChild(U.el('span', 'tag ar-kw', kw));

    row.appendChild(info);
    return row;
  }

  /* ─────────── 正常档案页 ─────────── */
  function build(herbs) {
    var wrap = U.el('div', 'ar');

    /* 顶部：档案编号 + 大标题 + 副标题 */
    var head = U.el('div', 'ar-head');
    head.appendChild(U.el('div', 'ar-eyebrow en', 'MY HERBAL ARCHIVE'));
    head.appendChild(U.el('h1', 'ar-title', '我的三味本草'));
    head.appendChild(U.el('p', 'ar-sub', '这一次，你与三味本草相遇。'));
    head.insertAdjacentHTML('beforeend', traceSVG());
    wrap.appendChild(head);

    /* 档案编号 + 次要动作（重新选择本草） */
    var meta = U.el('div', 'ar-meta');
    meta.appendChild(U.el('span', 'ar-meta-no en', 'ARCHIVE · 03 SPECIMENS'));

    var reset = U.el('button', 'btn-text ar-reset', '重新选择本草');
    reset.setAttribute('type', 'button');
    U.onClick(reset, function () {
      // 冻结规则：只清 selectedHerbs，其余 Store 数据一律不动
      BC.store.set('selectedHerbs', []);
      BC.router.replace(3);
    });
    meta.appendChild(reset);
    wrap.appendChild(meta);

    /* 三味本草：细线连接的纵向档案 */
    var list = U.el('div', 'ar-list');
    for (var i = 0; i < herbs.length; i++) list.appendChild(item(herbs[i], i));
    wrap.appendChild(list);

    /* 底部主按钮 */
    var foot = U.el('div', 'page-foot ar-foot');
    var cta = U.el('button', 'btn ar-cta', '开始身体观察');
    cta.setAttribute('type', 'button');
    U.onClick(cta, function () { BC.router.go(8); });
    foot.appendChild(cta);
    wrap.appendChild(foot);

    return wrap;
  }

  /* ─────────── 降级（selectedHerbs 不是 3 味）：不白屏 ─────────── */
  function degraded() {
    var wrap = U.el('div', 'ar ar-degraded');

    var head = U.el('div', 'ar-head');
    head.appendChild(U.el('div', 'ar-eyebrow en', 'MY HERBAL ARCHIVE'));
    head.appendChild(U.el('h1', 'ar-title', '我的三味本草'));
    wrap.appendChild(head);

    var body = U.el('div', 'ar-body');
    var empty = U.el('div', 'ar-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '草', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'ar-empty-msg', '还没有完成三味本草选择'));
    wrap.appendChild(body);

    var foot = U.el('div', 'page-foot ar-foot');
    var btn = U.el('button', 'btn ar-cta', '返回本草探索');
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(3); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  var mod = {
    render: function () {
      var el = root();
      if (!el) return;
      el.innerHTML = '';

      var sel = BC.store.get('selectedHerbs');
      var list = Array.isArray(sel) ? sel : [];

      if (list.length !== TOTAL) {
        el.appendChild(degraded());
        return;
      }

      var herbs = [];
      for (var i = 0; i < TOTAL; i++) {
        var h = BC.data.herbById[list[i]];
        if (!h) { el.appendChild(degraded()); return; }
        herbs.push(h);
      }
      el.appendChild(build(herbs));
    },

    enter: function () {
      SP.setStageLabel('MY HERBAL ARCHIVE');
      var wrap = document.querySelector('#' + PAGE_ID + ' .ar');
      if (wrap) BC.fx.play('anim-rise', wrap, { duration: 600 });
    },

    // 无定时器 / 无 rAF / 无全局监听 → 无需清理
    leave: function () {}
  };

  BC.pages = BC.pages || {};
  BC.pages.p07 = mod;

})(globalThis.BC);
