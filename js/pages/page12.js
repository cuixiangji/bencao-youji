/*!
 * js/pages/page12.js —— PAGE12 我的本草探索档案（MY HERBAL EXPLORER）
 *
 * 定位（连续叙事的收束页）：
 *   P11 专属茶饮配方卡 → **P12 我的本草探索档案（最终档案）** → P13 分享与保存（未开发）
 * 关键词：MY HERBAL EXPLORER / 个人探索档案 / 数字植物标本 / 当代博物馆记录卡 / 本草探索旅程收束页
 *
 * 【本页不是】医学诊断 / 体质诊断 / 健康结论 / 治疗 / 功效保证；
 * 【本页不出现】「你属于某某体质」「治疗」「改善疾病」「功效保证」；
 * 【本页使用】「探索型 / 探索轨迹 / 本草档案 / 专属茶饮 / 观察记录」语汇。
 *
 * 【数据读取（严格只读，绝不重算、绝不修改）】
 *   唯一来源：BC.store.get() → 经 BC.logic.buildArchive(state) 即时生成档案快照。
 *   读取：arch.archiveNo / arch.createdAt / arch.typeName / arch.typeKeywords /
 *         arch.radar / arch.herbs（3 味）/ arch.teaName / arch.teaMaterialsText /
 *         arch.teaVisualColor。
 *   不写任何算法、不重新计算六维、不重写探索型映射。
 *
 * 【唯一会写 store 的动作】「保存我的探索档案」→ BC.store.set('archiveData', arch)
 *   （复用既有键，不新增字段）。该键供后续 P13 结算页复用（router 的 archiveOK 校验），
 *   本页不依赖它已被写入即可渲染。
 *
 * 【重新探索】沿用项目已有的重新开始逻辑：BC.store.reset() + BC.router.replace(1)
 *   （与 js/app.js 的 BC.debug.reset 同一套机制，不自行发明清理方案）。
 *
 * 复用：BC.store / BC.router / BC.logic.buildArchive / BC.data / BC.render.specimen
 *       （hexA / mountFigure / setStageLabel）/ BC.render.radar（六维 SVG 雷达）/
 *       BC.render.herbColor / BC.render.placeholderSVG / BC.fx / BC.utils（toast 等）/
 *       .btn / .btn-ghost / .tag / .page-foot / .en。
 * 未复制 P01–P11 的页面代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // hexA / mountFigure / setStageLabel

  var PAGE_ID = 'page-12';
  var LABEL = 'HERBAL EXPLORER';        // 顶部右侧页标（与 index.js titles[12] 一致）
  var SAVE_KEY = 'archiveData';         // 既有 store 键，不新增字段

  /* 入场节奏（总时长 ≈ 860ms，落在 600–900ms 区间内）；
     只影响观感，lowPerf / reduced / SKIP_ANIMATION 一律直接终态 */
  var T_HEAD = 60;
  var T_NO = 180;
  var T_TYPE = 280;
  var T_RADAR = 420;
  var T_HERB = 540;                     // 三味本草首个
  var T_HERB_STEP = 80;                 // 三味逐个间隔
  var T_TEA = 800;
  var T_TRAIL = 860;
  var T_SETTLE = 920;                   // 终态兜底

  var timers = [];
  var saved = false;                    // 页面内保存状态（不写 store，仅 UI 标记）

  function root() { return document.getElementById(PAGE_ID); }
  function pad2(n) { return ('0' + n).slice(-2); }

  function herbColor(id) {
    try { return BC.render.herbColor(id) || '#8A9A7B'; } catch (e) { return '#8A9A7B'; }
  }

  function disclaimer() {
    try { return (BC.data.rules && BC.data.rules.DISCLAIMER) || ''; } catch (e) { return ''; }
  }

  function skipFx() {
    try { if (BC.compat && BC.compat.lowPerf) return true; } catch (e) { /* ignore */ }
    return BC.fx.shouldSkip();
  }

  /* createdAt（ms 时间戳）→ 展示串；缺失 → 空 */
  function fmtDate(ts) {
    if (!ts || typeof ts !== 'number') return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) +
      '  ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ── 数据读取（只读；脏数据 → 降级，绝不白屏） ─────────── */

  /**
   * @returns {{bad:boolean, arch?:Object, st?:Object}}
   */
  function readState() {
    var st = BC.store.get();
    if (!st) return { bad: true };

    /* 与 router.canEnter(t>=12) 同一组前置条件，保证 P12 可达时数据齐备 */
    var herbs3 = st.selectedHerbs && st.selectedHerbs.length === 3;
    var scoreOK = !!(st.bodyScores && typeof st.bodyScores.qi === 'number' &&
      st.explorationType && st.explorationType.type);
    var teaOK = !!(st.selectedTea && BC.data.teaById[st.selectedTea]);
    if (!(herbs3 && scoreOK && teaOK)) return { bad: true };

    var arch;
    try { arch = BC.logic.buildArchive(st); } catch (e) { return { bad: true }; }
    if (!arch || !arch.herbs || arch.herbs.length !== 3 || !arch.teaName) return { bad: true };

    return { bad: false, arch: arch, st: st };
  }

  /* ── 顶部装饰：极淡圆环 + 低透明度轨迹线 + 坐标点（克制，不越出容器） ── */
  function traceSVG() {
    return '' +
      '<svg class="ar2-trace" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">' +
      '<circle class="ar2-ring" cx="252" cy="46" r="30"/>' +
      '<circle class="ar2-ring ar2-ring-2" cx="252" cy="46" r="18"/>' +
      '<path class="ar2-arc" d="M8 168 C 78 168 118 128 168 92 S 268 40 314 34"/>' +
      '<path class="ar2-tick" d="M252 8 V16 M252 76 V84 M214 46 H222 M282 46 H290"/>' +
      '<circle class="ar2-dot" cx="168" cy="92" r="1.6"/>' +
      '<circle class="ar2-dot" cx="78" cy="168" r="1.6"/>' +
      '</svg>';
  }

  /* ── 小型茶盏（透明轮廓 + 1px 细描边 + 底部基准线，呼应 P11） ── */
  function vesselSVG(color) {
    var ink = color || '#8A9A7B';
    return '<svg class="ar2-vessel-svg" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="34" rx="40" ry="7" fill="' + SP.hexA(ink, '.16') + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M20 34 L27 94 Q28 108 42 108 L78 108 Q92 108 93 94 L100 34" fill="none" stroke="' + ink + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M27 38 Q60 50 93 38" fill="none" stroke="' + ink + '" stroke-opacity=".32" stroke-width="1"/>' +
      '<path d="M12 108 H108" fill="none" stroke="' + ink + '" stroke-opacity=".34" stroke-width="1"/>' +
      '</svg>';
  }

  /* ── 01 档案身份 ── */
  function buildIdentity(arch) {
    var head = U.el('div', 'ar2-head ar2-block');

    var eyebrow = U.el('div', 'ar2-eyebrow en', 'MY HERBAL EXPLORER');
    head.appendChild(eyebrow);

    head.appendChild(U.el('h1', 'ar2-title', '我的本草探索档案'));
    head.insertAdjacentHTML('beforeend', traceSVG());

    /* 档案编号 + 创建时间 */
    var meta = U.el('div', 'ar2-no ar2-block');
    meta.appendChild(U.el('span', 'ar2-no-id en', arch.archiveNo || ''));
    var dateStr = fmtDate(arch.createdAt);
    if (dateStr) meta.appendChild(U.el('span', 'ar2-no-date en', dateStr));

    return { head: head, meta: meta };
  }

  /* ── 02 探索型 + 六维雷达 ── */
  function buildType(arch) {
    var box = U.el('div', 'ar2-type ar2-block');

    box.appendChild(U.el('div', 'ar2-sec-k en', 'EXPLORATION TYPE'));
    box.appendChild(U.el('div', 'ar2-type-name', arch.typeName || ''));

    var kws = U.el('div', 'ar2-type-kws');
    var list = Array.isArray(arch.typeKeywords) ? arch.typeKeywords : [];
    for (var i = 0; i < list.length; i++) kws.appendChild(U.el('span', 'tag', list[i]));
    if (list.length) box.appendChild(kws);

    return box;
  }

  function buildRadar(arch) {
    var wrap = U.el('div', 'ar2-radar-wrap ar2-block');
    var box = U.el('div', 'ar2-radar-box');
    try {
      box.innerHTML = BC.render.radar.svg(arch.radar, {
        color: arch.teaVisualColor || '#8A9A7B',
        label: '气血阴阳湿热'
      });
    } catch (e) { box.innerHTML = ''; }
    wrap.appendChild(box);
    wrap.appendChild(U.el('div', 'ar2-radar-cap en', '六维观察 · SIX DIMENSIONS'));
    return wrap;
  }

  /* ── 03 我的三味本草（标本陈列） ── */
  function herbField(herb) {
    var prop = (herb.property || '') + (herb.taste ? ' · ' + herb.taste : '');
    if (prop) return '性味 · ' + prop;
    if (herb.origin) return '产地 · ' + herb.origin;
    return '';
  }

  function buildHerbs(arch) {
    var sec = U.el('div', 'ar2-sec');
    var head = U.el('div', 'ar2-sec-head');
    head.appendChild(U.el('h2', 'ar2-sec-t', '我的三味本草'));
    head.appendChild(U.el('span', 'ar2-sec-en en', 'MY HERBS'));
    sec.appendChild(head);

    var row = U.el('div', 'ar2-herb-row');
    var herbs = arch.herbs || [];
    for (var i = 0; i < herbs.length; i++) {
      var herb = herbs[i];
      var card = U.el('div', 'ar2-herb ar2-block');
      card.setAttribute('data-herb', herb.id);
      card.setAttribute('data-order', pad2(i + 1));

      card.appendChild(U.el('div', 'ar2-herb-no en', pad2(i + 1)));

      var fig = U.el('div', 'ar2-herb-fig');
      var halo = U.el('div', 'ar2-herb-halo');
      halo.style.background = 'radial-gradient(circle, ' + SP.hexA(herb.color || '#8A9A7B', '.30') + ' 0%, ' +
        SP.hexA(herb.color || '#8A9A7B', '.10') + ' 52%, rgba(12,11,9,0) 78%)';
      fig.appendChild(halo);
      var img = U.el('div', 'ar2-herb-img');
      fig.appendChild(img);
      SP.mountFigure(img, herb, 72);     // webp → svg → placeholderSVG（沿用既有机制）
      card.appendChild(fig);

      card.appendChild(U.el('div', 'ar2-herb-name', herb.name || ''));
      if (herb.latin) card.appendChild(U.el('div', 'ar2-herb-latin en', herb.latin));

      var field = herbField(herb);
      if (field) card.appendChild(U.el('div', 'ar2-herb-field', field));

      row.appendChild(card);
    }
    sec.appendChild(row);
    return sec;
  }

  /* ── 04 我的专属茶饮（呼应 P11） ── */
  function buildTea(arch, st) {
    var sec = U.el('div', 'ar2-sec');
    var head = U.el('div', 'ar2-sec-head');
    head.appendChild(U.el('h2', 'ar2-sec-t', '我的专属茶饮'));
    head.appendChild(U.el('span', 'ar2-sec-en en', 'MY TEA FORMULA'));
    sec.appendChild(head);

    var card = U.el('div', 'ar2-tea-card ar2-block');
    try { card.style.setProperty('--ar2-tea', arch.teaVisualColor || '#8A9A7B'); } catch (e) { /* ignore */ }

    /* 小茶盏 + 两味本草色点 */
    var top = U.el('div', 'ar2-tea-top');
    var vessel = U.el('div', 'ar2-tea-vessel');
    vessel.insertAdjacentHTML('beforeend', vesselSVG(arch.teaVisualColor));
    top.appendChild(vessel);

    var dots = U.el('div', 'ar2-tea-dots');
    var tea = (st && st.selectedTea && BC.data.teaById[st.selectedTea]) || null;
    var mats = tea ? (tea.materials || []) : [];
    for (var i = 0; i < mats.length && i < 2; i++) {
      var dot = U.el('span', 'ar2-tea-dot');
      dot.style.background = herbColor(mats[i].herbId);
      dots.appendChild(dot);
    }
    top.appendChild(dots);
    card.appendChild(top);

    card.appendChild(U.el('div', 'ar2-tea-name', arch.teaName || ''));
    if (arch.teaMaterialsText) {
      card.appendChild(U.el('div', 'ar2-tea-mats', arch.teaMaterialsText));
    }

    sec.appendChild(card);
    return sec;
  }

  /* ── 05 探索轨迹说明 ── */
  function buildTrail() {
    var sec = U.el('div', 'ar2-sec ar2-block');
    var head = U.el('div', 'ar2-sec-head');
    head.appendChild(U.el('h2', 'ar2-sec-t', '探索轨迹'));
    head.appendChild(U.el('span', 'ar2-sec-en en', 'EXPLORATION TRAIL'));
    sec.appendChild(head);

    sec.appendChild(U.el('p', 'ar2-trail-p',
      '这份档案记录你从本草浏览、身体观察、三味选择，到最终茶饮生成的探索路径。'));
    return sec;
  }

  /* ── 06 操作按钮（固定底栏） ── */
  function buildFoot() {
    var foot = U.el('div', 'page-foot ar2-foot');

    var save = U.el('button', 'btn ar2-save', '保存我的探索档案');
    save.setAttribute('type', 'button');
    U.onClick(save, function () { doSave(save); });
    foot.appendChild(save);

    var restart = U.el('button', 'btn-ghost ar2-restart', '重新探索');
    restart.setAttribute('type', 'button');
    U.onClick(restart, function () { doRestart(); });
    foot.appendChild(restart);

    return foot;
  }

  /**
   * 保存：复用既有 store 键 archiveData（不新增字段），把当前档案快照固化，
   * 供后续 P13 结算页复用。仅页面内标记 + 轻提示，不改任何探索结果。
   */
  function doSave(btn, arch) {
    var el = root();
    var cur = archNow;
    if (!cur) return;
    try { BC.store.set(SAVE_KEY, cur); } catch (e) { /* ignore */ }
    saved = true;
    if (btn) U.setText(btn, '已保存');
    if (U.toast) U.toast('探索档案已保存到本次体验');
    /* P13 入口（Step 4.9-A）：保存成功后进入「分享与保存」结算页。
       延时让「已保存」+ 轻提示先可感知；走 timers，leave() 时自动清理。
       archiveData 此时已写入 → router.canEnter(13) 放行，back() 可回到本页。 */
    timers.push(setTimeout(function () {
      try { BC.router.go(13); } catch (e) { /* ignore */ }
    }, 420));
  }

  /** 重新探索：沿用项目已有重新开始逻辑，不自行发明清理方案 */
  function doRestart() {
    try { BC.store.reset(); } catch (e) { /* ignore */ }
    try { BC.router.replace(1); } catch (e) { /* ignore */ }
  }

  /* ── 降级视图（不白屏，不自造结果） ── */
  function degradedView() {
    var wrap = U.el('div', 'ar2 ar2-degraded');

    var head = U.el('div', 'ar2-head');
    head.appendChild(U.el('div', 'ar2-eyebrow en', 'MY HERBAL EXPLORER'));
    head.appendChild(U.el('h1', 'ar2-title', '我的本草探索档案'));
    wrap.appendChild(head);

    var body = U.el('div', 'ar2-body');
    var empty = U.el('div', 'ar2-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '档', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'ar2-empty-msg', '探索档案还没有完成'));
    wrap.appendChild(body);

    var foot = U.el('div', 'page-foot ar2-foot');
    var btn = U.el('button', 'btn ar2-save', '返回本草探索');
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(11); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded() {
    var el = root();
    if (!el) return;
    clearTimers();
    saved = false;
    archNow = null;
    el.innerHTML = '';
    el.appendChild(degradedView());
    syncFootPad();
  }

  /* ── 正常视图组装 ── */
  var archNow = null;   // 供 doSave 读取（页面内，不写 store）

  function build(arch, st) {
    archNow = arch;
    var wrap = U.el('div', 'ar2');

    var id = buildIdentity(arch);
    wrap.appendChild(id.head);
    wrap.appendChild(id.meta);

    wrap.appendChild(buildType(arch));
    wrap.appendChild(buildRadar(arch));
    wrap.appendChild(buildHerbs(arch));
    wrap.appendChild(buildTea(arch, st));
    wrap.appendChild(buildTrail());

    var note = disclaimer();
    if (note) wrap.appendChild(U.el('p', 'ar2-note', note));

    /* 固定底栏移出 .ar2：避免被 enter() 的 anim-rise（both 填充模式，永久保留 transform）
       建立的包含块捕获，从而保持真正 viewport 固定。底栏由 render() 直接挂到 .page。 */
    return wrap;
  }

  /* ── 固定底栏高度 → CSS 变量（避免遮挡正文：真实高度 + 安全区 + 余量，动态计算） ── */
  function syncFootPad() {
    var el = root();
    if (!el) return;
    var foot = el.querySelector('.ar2-foot');
    if (!foot) return;
    var h = 0;
    try { h = foot.getBoundingClientRect().height; } catch (e) { h = 0; }
    if (!h || !isFinite(h)) h = 136;   // 兜底：两枚按钮纵向堆叠的估算高度
    el.style.setProperty('--ar2-foot-h', Math.round(h) + 'px');
  }

  /* ── 入场编排（setTimeout 驱动；绝不等 animationend） ── */
  function reveal() {
    var el = root();
    if (!el) return;

    function q(sel) { return el.querySelector(sel); }
    function qa(sel) { return el.querySelectorAll(sel); }

    var radarEl = q('.ar2-radar-box .bp-radar');
    var blocks = qa('.ar2-block');
    var herbs = qa('.ar2-herb');

    function drawRadar() { if (radarEl) radarEl.classList.add('is-draw'); }
    function showAll() {
      for (var i = 0; i < blocks.length; i++) blocks[i].classList.add('is-in');
      for (var j = 0; j < herbs.length; j++) herbs[j].classList.add('is-in');
      drawRadar();
    }
    if (skipFx()) { showAll(); return; }

    timers.push(setTimeout(function () { var h = q('.ar2-head'); if (h) h.classList.add('is-in'); }, T_HEAD));
    timers.push(setTimeout(function () { var m = q('.ar2-no'); if (m) m.classList.add('is-in'); }, T_NO));
    timers.push(setTimeout(function () { var t = q('.ar2-type'); if (t) t.classList.add('is-in'); }, T_TYPE));
    timers.push(setTimeout(drawRadar, T_RADAR));
    for (var k = 0; k < herbs.length; k++) {
      (function (node, delay) {
        timers.push(setTimeout(function () { node.classList.add('is-in'); }, delay));
      })(herbs[k], T_HERB + k * T_HERB_STEP);
    }
    timers.push(setTimeout(function () { var t = q('.ar2-tea-card'); if (t) t.classList.add('is-in'); }, T_TEA));
    timers.push(setTimeout(function () { var t = q('.ar2-trail'); if (t) t.classList.add('is-in'); }, T_TRAIL));
    /* 终态兜底：即便某一环异常，也落到与 reduced-motion 相同的最终观感 */
    timers.push(setTimeout(showAll, T_SETTLE));
  }

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
  }

  /* ── 页面模块 ── */
  var mod = {
    render: function () {
      var el = root();
      if (!el) return;

      clearTimers();
      saved = false;
      archNow = null;

      try {
        el.innerHTML = '';
        var s = readState();
        if (s.bad) { showDegraded(); return; }
        el.appendChild(build(s.arch, s.st));
        el.appendChild(buildFoot());      // 固定底栏作为 .page 直接子节点（不受 .ar2 的 transform 影响）
        syncFootPad();                    // 实测底栏高度 → --ar2-foot-h，驱动 .ar2 动态底部 padding
        reveal();
      } catch (e) {
        showDegraded();
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);            // 顶部右侧：HERBAL EXPLORER
      var el = root();
      if (!el || el.querySelector('.ar2-degraded')) return;
      var wrap = el.querySelector('.ar2');
      if (wrap) BC.fx.play('anim-rise', wrap, { duration: 600 });
      syncFootPad();                      // 入场后再校准一次（字体/布局落定后底栏高度可能微调）
    },

    leave: function () {
      clearTimers();
      saved = false;
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p12 = mod;

})(globalThis.BC);
