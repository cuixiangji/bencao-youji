/*!
 * js/pages/page03.js —— PAGE03 本草探索：从 12 种本草中选择 3 味伙伴
 *
 * 数据与状态：
 *  - 卡片数据全部来自 BC.data.herbs（数量、名称、印象词均不硬编码）
 *  - 选中状态唯一来源 = BC.store.selectedHerbs（页面内不另存一套核心状态）
 *  - 每次 render / 变更都从 store 重新读取，返回再进入自动恢复
 *
 * 交互（v1.2 冻结规则）：
 *  - 最多 3 个；允许取消；保留选择顺序
 *  - 满 3 后其余本草不可选（点击给 toast，不静默）
 *  - 返回走 BC.router.back()（顶栏统一按钮），不直接操作 history
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var MAX = 3;

  var sheetEl = null;
  var sheetSvg = null, sheetName = null, sheetLatin = null;
  var sheetKws = null, sheetRows = null, sheetDesc = null, sheetCta = null;
  var currentId = '';

  function getSelected() {
    var s = BC.store.get('selectedHerbs');
    return Array.isArray(s) ? s.slice() : [];
  }

  function herbById(id) {
    var list = BC.data.herbs || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ─────────── 选中 / 取消 ─────────── */

  function toggle(id) {
    var sel = getSelected();
    var i = sel.indexOf(id);
    if (i >= 0) {
      sel.splice(i, 1);
      BC.store.set('selectedHerbs', sel);
      return 'off';
    }
    if (sel.length >= MAX) {
      U.toast('已选择 ' + MAX + ' 味本草，取消一个再选吧');
      return 'full';
    }
    sel.push(id);
    BC.store.set('selectedHerbs', sel);
    return 'on';
  }

  /* ─────────── 信息浮层 ─────────── */

  function openSheet(id) {
    var h = herbById(id);
    if (!h || !sheetEl) return;
    currentId = id;

    var color = BC.render.herbColor(h.id);
    /* 植物插画：浮层同样复用 specimen.mountFigure（与卡片一致，Step 7） */
    if (sheetSvg) {
      if (BC.render.specimen && BC.render.specimen.mountFigure) {
        BC.render.specimen.mountFigure(sheetSvg, h, 96);
      } else {
        sheetSvg.innerHTML = BC.render.placeholderSVG(color, h.name, 96);
      }
    }
    if (sheetName) sheetName.textContent = h.name;
    if (sheetLatin) sheetLatin.textContent = h.latin || '';
    if (sheetDesc) sheetDesc.textContent = h.description || '';

    if (sheetKws) {
      sheetKws.innerHTML = '';
      var kws = h.keywords || [];
      for (var i = 0; i < kws.length; i++) {
        sheetKws.appendChild(U.el('span', 'tag', kws[i]));
      }
    }

    if (sheetRows) {
      sheetRows.innerHTML = '';
      var rows = [
        ['性味', (h.property || '') + (h.taste ? ' · ' + h.taste : '')],
        ['产地', h.origin || ''],
        ['观察', h.observation || '']
      ];
      for (var r = 0; r < rows.length; r++) {
        if (!rows[r][1]) continue;
        var row = U.el('div', 'p03-row');
        row.appendChild(U.el('div', 'p03-row-k', rows[r][0]));
        row.appendChild(U.el('div', 'p03-row-v', rows[r][1]));
        sheetRows.appendChild(row);
      }
    }
    syncSheetCta();

    sheetEl.classList.add('is-open');
    sheetEl.setAttribute('aria-hidden', 'false');
  }

  function closeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('is-open');
    sheetEl.setAttribute('aria-hidden', 'true');
    currentId = '';
  }

  function syncSheetCta() {
    if (!sheetCta) return;
    var on = getSelected().indexOf(currentId) >= 0;
    if (on) {
      sheetCta.textContent = '取消选择';
      sheetCta.classList.add('btn-ghost');
    } else {
      sheetCta.textContent = '加入我的本草';
      sheetCta.classList.remove('btn-ghost');
    }
  }

  /* ─────────── UI 同步（唯一入口：读 store → 刷 DOM） ─────────── */

  function syncUI() {
    var sel = getSelected();
    var full = sel.length >= MAX;

    var countEl = document.querySelector('#page-03 .p03-count b');
    if (countEl) countEl.textContent = String(sel.length);
    var bar = document.querySelector('#page-03 .p03-progress > i');
    if (bar) bar.style.width = (sel.length / MAX * 100) + '%';

    var cards = U.$$('#page-03 .p03-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var id = card.getAttribute('data-herb');
      var idx = sel.indexOf(id);
      var btn = card.querySelector('.p03-card-btn');

      if (idx >= 0) {
        card.classList.add('is-on');
        card.classList.remove('is-locked');
        var ord = card.querySelector('.p03-card-order');
        if (ord) ord.textContent = String(idx + 1);
        if (btn) btn.setAttribute('aria-pressed', 'true');
      } else {
        card.classList.remove('is-on');
        card.classList.toggle('is-locked', full);
        if (btn) btn.setAttribute('aria-pressed', 'false');
      }
    }

    var next = document.querySelector('#page-03 .p03-next');
    if (next) {
      var ok = sel.length === MAX;
      next.disabled = !ok;
      next.textContent = ok ? '继续' : '还需选择 ' + (MAX - sel.length) + ' 味';
    }
    syncSheetCta();
  }

  /* ─────────── 渲染 ─────────── */

  var mod = {
    render: function () {
      var root = document.getElementById('page-03');
      if (!root) return;
      root.innerHTML = '';

      var herbs = BC.data.herbs || [];
      var wrap = U.el('div', 'p03');

      /* 头部 */
      var head = U.el('div', 'p03-head');
      head.innerHTML =
        '<h1 class="p03-title">选择你的三味本草</h1>' +
        '<div class="p03-meta">' +
        '<span class="p03-tip">凭第一感觉，选出 3 味想继续认识的本草</span>' +
        '<span class="p03-count"><b>0</b>/' + MAX + '</span>' +
        '</div>' +
        '<div class="bc-progress p03-progress"><i></i></div>';
      wrap.appendChild(head);

      /* 12 张卡片 */
      var grid = U.el('div', 'p03-grid');
      for (var i = 0; i < herbs.length; i++) {
        (function (h) {
          var card = U.el('div', 'p03-card');
          card.setAttribute('data-herb', h.id);

          var btn = document.createElement('button');
          btn.className = 'p03-card-btn';
          btn.setAttribute('type', 'button');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', h.name);

          var color = BC.render.herbColor(h.id);
          btn.innerHTML =
            '<span class="p03-card-order"></span>' +
            '<span class="p03-card-svg"></span>' +
            '<span class="p03-card-name"></span>' +
            '<span class="p03-card-kw"></span>';
          /* 植物插画：复用 specimen.mountFigure（webp→svg→几何占位 三级降级链，Step 7 视觉补强） */
          var svgBox = btn.querySelector('.p03-card-svg');
          if (svgBox && BC.render.specimen && BC.render.specimen.mountFigure) {
            BC.render.specimen.mountFigure(svgBox, h, 96);
          } else if (svgBox) {
            svgBox.innerHTML = BC.render.placeholderSVG(color, h.name, 96);
          }
          var nm = btn.querySelector('.p03-card-name');
          var kw = btn.querySelector('.p03-card-kw');
          if (nm) nm.textContent = h.name;
          if (kw) kw.textContent = (h.keywords && h.keywords[0]) ? h.keywords[0] : '';

          U.onClick(btn, function () {
            var sel = getSelected();
            if (sel.indexOf(h.id) < 0 && sel.length >= MAX) {
              U.toast('已选择 ' + MAX + ' 味本草，取消一个再选吧');
              return;
            }
            openSheet(h.id);
          });

          card.appendChild(btn);
          grid.appendChild(card);
        })(herbs[i]);
      }
      wrap.appendChild(grid);

      /* 底部主按钮 */
      var foot = U.el('div', 'page-foot p03-foot');
      var next = U.el('button', 'btn p03-next', '还需选择 ' + MAX + ' 味');
      next.setAttribute('type', 'button');
      next.disabled = true;
      U.onClick(next, function () {
        if (getSelected().length !== MAX) return;
        BC.router.go(4);
      });
      foot.appendChild(next);
      wrap.appendChild(foot);

      /* 信息浮层 */
      sheetEl = U.el('div', 'p03-sheet');
      sheetEl.setAttribute('aria-hidden', 'true');
      sheetEl.innerHTML =
        '<div class="p03-sheet-inner">' +
        '<button class="p03-sheet-close" type="button" aria-label="关闭">✕</button>' +
        '<div class="p03-sheet-top">' +
        '<span class="p03-sheet-svg"></span>' +
        '<span><span class="p03-sheet-name"></span>' +
        '<span class="p03-sheet-latin en"></span></span>' +
        '</div>' +
        '<div class="p03-sheet-kws"></div>' +
        '<div class="p03-sheet-rows"></div>' +
        '<p class="p03-sheet-desc"></p>' +
        '<div class="p03-sheet-cta"><button class="btn" type="button">加入我的本草</button></div>' +
        '<div class="p03-note">图示为几何占位，非官方本草插画</div>' +
        '</div>';

      sheetSvg = sheetEl.querySelector('.p03-sheet-svg');
      sheetName = sheetEl.querySelector('.p03-sheet-name');
      sheetLatin = sheetEl.querySelector('.p03-sheet-latin');
      sheetKws = sheetEl.querySelector('.p03-sheet-kws');
      sheetRows = sheetEl.querySelector('.p03-sheet-rows');
      sheetDesc = sheetEl.querySelector('.p03-sheet-desc');
      sheetCta = sheetEl.querySelector('.p03-sheet-cta .btn');

      // 关闭：按钮 / 点遮罩
      U.onClick(sheetEl.querySelector('.p03-sheet-close'), closeSheet);
      U.onClick(sheetEl, function (ev) {
        if (ev && ev.target === sheetEl) closeSheet();
      });
      U.onClick(sheetCta, function () {
        if (!currentId) return;
        toggle(currentId);
        closeSheet();
        syncUI();
      });

      wrap.appendChild(sheetEl);
      root.appendChild(wrap);

      syncUI();
    },

    enter: function () {
      syncUI();
      var head = document.querySelector('#page-03 .p03-head');
      if (head) BC.fx.play('anim-rise', head, { duration: 600 });
    },

    leave: function () {
      closeSheet();
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p03 = mod;

})(globalThis.BC);
