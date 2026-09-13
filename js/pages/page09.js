/*!
 * js/pages/page09.js —— PAGE09 本草身体画像（BODY PROFILE）
 *
 * 定位（连续叙事）：
 *   P03 选择 → P04–P06 认识 → P07 收束记录 → P08 我的身体观察 → **P09 本草身体画像（观察结果呈现）**
 * 关键词：BODY PROFILE / 身体观察画像 / 探索类型 / 数字植物标本馆
 *
 * 【本页不是】医学诊断 / 体质诊断 / 疾病判断 / 治疗建议 / 医学结论；
 * 【本页不出现】「你属于某某体质」「你患有…」「你存在健康问题」「治疗」「改善疾病」；
 * 【本页使用】「你的探索类型 / 身体观察画像 / 生活状态倾向 / 本草探索关键词 / 生活观察建议」语汇。
 *
 * 【只读展示层 —— 绝不重算算法】
 *   P09 只读取既有 Store / Logic 结果：
 *     bodyScores / bodyScoresDisplay / explorationType / recommendedHerbs
 *   绝不在页面内重新实现：TYPE_MAP / TIE_ORDER / BALANCED_RANGE / 推荐矩阵 / 雷达归一化。
 *   雷达半径唯一的来源是 bodyScoresDisplay（D = 35~100）→ 渲染层等价换算 r = D / 100，
 *   与冻结稿 r = 0.35 + 0.65 * v、D = 35 + 65 * v 完全等价（细节见 js/render/radar.js 头部说明）。
 *
 * 【唯一会写 store 的动作】无 —— 本页不写任何 store 键。
 *   返回：顶部左上返回按钮 → BC.router.back() → P08（不清空任何数据，返回逻辑在 js/app.js 统一绑定）。
 *   重看：次要动作「调整我的观察」→ BC.router.replace(8, { q: 0 }) → P08（不清空数据；
 *        P08 会定位到第 1 题让用户修改，改完后 store 重算，再次进入 P09 即为新结果）。
 *
 * 复用：BC.store / BC.router / BC.fx / BC.utils / BC.render.specimen（hexA / mountFigure / setStageLabel）
 *       / BC.render.radar（六维 SVG 雷达）/ .btn / .btn-ghost / .btn-text / .tag / .page-foot / .anim-rise。
 * 未复制 P03–P08 的页面代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // hexA / mountFigure / setStageLabel

  var PAGE_ID = 'page-09';
  var REC_TOTAL = 3;                    // 推荐本草固定 3 味（顺序即 recommendedHerbs 顺序）
  var LABEL = 'BODY PROFILE';           // 顶部右侧页标（12 字符）
  var LEAD = '你的这次探索，更接近＿＿。';

  var FALLBACK_MSG = '你的观察记录还没有完成';
  var FALLBACK_CTA = '继续身体观察';

  /* 动效节奏（只影响观感，不参与任何逻辑；lowPerf / reduced / SKIP 直接给终态） */
  var DRAW_DELAY = 180;                 // 标题与探索型已就位 → 雷达开始生长
  var CARD_DELAY = 380;                 // 推荐本草首次淡入
  var CARD_STEP  = 90;                  // 推荐本草依次淡入间隔
  var FINAL_PAD  = 320;                 // 终态兜底（防止任何一环失败导致卡片停在透明态）

  var timerDraw = null;
  var timerFinal = null;
  var timersCard = [];

  var degraded = false;
  var sheetEl = null;

  /* ─────────── 展示文案（IS-DISPLAY-ONLY） ───────────
     这里只有「替代写法」的展示句子，不参与任何判定/计算；探索型名称 100% 取自 store。
     文案语汇刻意使用「身体感受 / 生活状态倾向」，避免任何医学结论式表达。 */
  var DESC = {
    '元气探索型': '身体感受整体偏向充盈与活跃，像向阳生长的枝芽。',
    '温衡探索型': '身体感受整体偏向温和与稳当，像被日光照过的土壤。',
    '清润探索型': '身体感受整体偏向清润与柔和，像雨后初晴的叶片。',
    '轻盈探索型': '身体感受整体偏向轻盈与通透，像风穿过疏朗的林梢。',
    '清爽探索型': '身体感受整体偏向清爽与明快，像清晨带凉意的空气。',
    '平和探索型': '身体感受整体均衡安稳，像四季如常的庭院。'
  };
  var DESC_FALLBACK = '这一次的身体观察，已经留下了一份属于你的记录。';

  function root() { return document.getElementById(PAGE_ID); }
  function pad2(n) { return ('0' + n).slice(-2); }
  function radarRender() { return (BC.render && BC.render.radar) ? BC.render.radar : null; }

  /* 统一免责文案：直接取冻结数据（data/rules.js），不在此复制一份 */
  function disclaimer() {
    try { return (BC.data.rules && BC.data.rules.DISCLAIMER) || ''; } catch (e) { return ''; }
  }

  function descOf(typeName) { return DESC[typeName] || DESC_FALLBACK; }

  /* 低性能 / 减少动效 / SKIP_ANIMATION → 不做入场编排，直接终态 */
  function skipFx() {
    try { if (BC.compat && BC.compat.lowPerf) return true; } catch (e) { /* ignore */ }
    return BC.fx.shouldSkip();
  }

  /* 本草主题色：优先取「本次探索」对应的第一味推荐本草，退回已选本草，最后退回默认绿。
     全部来自既有 PALETTE（BC.render.herbColor），未新增任何颜色。 */
  function accentOf(ids) {
    var color = '';
    try { color = BC.render.herbColor((ids && ids.length) ? ids[0] : '') || ''; } catch (e) { color = ''; }
    if (!color) {
      try {
        var sel = BC.store.get('selectedHerbs');
        color = BC.render.herbColor((Array.isArray(sel) && sel.length) ? sel[0] : '') || '';
      } catch (e2) { color = ''; }
    }
    return color || '#8A9A7B';
  }

  /* ─────────── 数据读取（只读；脏数据 → 降级，绝不白屏） ─────────── */

  /**
   * 读取既有结果。任一必需键缺失/非法 → 返回 null（页面转降级视图）。
   * 必需：bodyScores（数值六维）/ explorationType.type / recommendedHerbs（恰好 3 味且都能解析）
   * 展示值：优先 store.bodyScoresDisplay；缺失时用既有 Logic BC.logic.normalizeRadar 取 display
   *         （复用既有归一化，不在页面里重写公式）。
   */
  function readResult() {
    var st = BC.store.get();
    if (!st) return null;

    var scores = st.bodyScores;
    if (!scores || typeof scores.qi !== 'number') return null;

    var type = st.explorationType;
    if (!type || !type.type) return null;

    var rec = st.recommendedHerbs;
    if (!Array.isArray(rec) || rec.length !== REC_TOTAL) return null;

    var display = st.bodyScoresDisplay;
    if (!display || typeof display.qi !== 'number') {
      try { display = BC.logic.normalizeRadar(scores).display; } catch (e) { display = null; }
    }
    if (!display) return null;

    var herbs = [];
    for (var i = 0; i < REC_TOTAL; i++) {
      var h = BC.data.herbById[rec[i]];
      if (!h) return null;                       // 推荐项无法解析 → 降级（不猜、不自造结果）
      herbs.push(h);
    }

    return { type: type, display: display, ids: rec.slice(), herbs: herbs };
  }

  /* ─────────── 顶部装饰层：极淡圆环 + 细轨迹线 + 坐标点（克制，不越出容器） ─────────── */

  function traceSVG() {
    return '' +
      '<svg class="bp-trace" viewBox="0 0 320 150" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">' +
      '<circle class="bp-ring-dec" cx="262" cy="40" r="26"/>' +
      '<circle class="bp-ring-dec bp-ring-dec-2" cx="262" cy="40" r="14"/>' +
      '<path class="bp-arc-dec" d="M6 138 C 70 138 108 106 152 80 S 252 36 314 30"/>' +
      '<path class="bp-tick-dec" d="M262 6 V14 M262 66 V74 M234 40 H242 M282 40 H290"/>' +
      '<circle class="bp-dot-dec" cx="152" cy="80" r="1.6"/>' +
      '<circle class="bp-dot-dec" cx="70" cy="138" r="1.6"/>' +
      '</svg>';
  }

  /* ─────────── 推荐本草卡（整卡可点 → 信息浮层） ─────────── */

  function buildCard(herb, i) {
    var color = BC.render.herbColor(herb.id);

    var btn = document.createElement('button');
    btn.className = 'bp-card';
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-herb', herb.id);
    btn.setAttribute('data-slot', String(i + 1));
    btn.setAttribute('aria-label', herb.name);
    try { btn.style.setProperty('--bp-herb', color); } catch (e) { /* ignore */ }

    var fig = U.el('span', 'bp-card-fig');
    var halo = U.el('span', 'bp-card-halo');
    halo.style.background = 'radial-gradient(circle, ' + SP.hexA(color, '.30') + ' 0%, ' +
      SP.hexA(color, '.10') + ' 52%, rgba(12,11,9,0) 78%)';
    fig.appendChild(halo);
    var img = U.el('span', 'bp-card-img');
    fig.appendChild(img);
    btn.appendChild(fig);

    var info = U.el('span', 'bp-card-info');
    info.appendChild(U.el('span', 'bp-card-name', herb.name));
    var kw = (herb.keywords && herb.keywords[0]) ? herb.keywords[0] : '';
    if (kw) info.appendChild(U.el('span', 'bp-card-kw', kw));
    btn.appendChild(info);

    btn.appendChild(U.el('span', 'bp-card-no en', pad2(i + 1)));

    SP.mountFigure(img, herb, 72);              // webp → svg → placeholderSVG（沿用既有机制）
    U.onClick(btn, function () { openSheet(herb.id); });
    return btn;
  }

  /* ─────────── 本草信息浮层（复用 P03 的信息结构；不出现「重新选择」） ─────────── */

  function buildSheet() {
    var el = U.el('div', 'bp-sheet');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="bp-sheet-inner">' +
      '<button class="bp-sheet-x" type="button" aria-label="关闭">✕</button>' +
      '<div class="bp-sheet-top">' +
      '<span class="bp-sheet-fig"></span>' +
      '<span class="bp-sheet-head">' +
      '<span class="bp-sheet-name"></span>' +
      '<span class="bp-sheet-latin en"></span>' +
      '</span>' +
      '</div>' +
      '<div class="bp-sheet-kws"></div>' +
      '<div class="bp-sheet-rows"></div>' +
      '<p class="bp-sheet-desc"></p>' +
      '<div class="bp-sheet-foot"><button class="btn-ghost bp-sheet-close" type="button">关闭</button></div>' +
      '<div class="bp-sheet-hint">图示为几何占位，非官方本草插画</div>' +
      '</div>';

    U.onClick(el.querySelector('.bp-sheet-x'), closeSheet);
    U.onClick(el.querySelector('.bp-sheet-close'), closeSheet);
    U.onClick(el, function (ev) { if (ev && ev.target === el) closeSheet(); });
    return el;
  }

  function openSheet(id) {
    var h = BC.data.herbById[id];
    if (!h || !sheetEl) return;
    var color = BC.render.herbColor(h.id);

    var fig = sheetEl.querySelector('.bp-sheet-fig');
    if (fig) {
      fig.innerHTML = '';
      var img = U.el('span', 'bp-sheet-img');
      fig.appendChild(img);
      SP.mountFigure(img, h, 72);
    }
    U.setText(sheetEl.querySelector('.bp-sheet-name'), h.name);
    U.setText(sheetEl.querySelector('.bp-sheet-latin'), h.latin || '');
    U.setText(sheetEl.querySelector('.bp-sheet-desc'), h.description || '');

    var kws = sheetEl.querySelector('.bp-sheet-kws');
    if (kws) {
      kws.innerHTML = '';
      var list = h.keywords || [];
      for (var i = 0; i < list.length; i++) kws.appendChild(U.el('span', 'tag', list[i]));
    }

    var rows = sheetEl.querySelector('.bp-sheet-rows');
    if (rows) {
      rows.innerHTML = '';
      var data = [
        ['性味', (h.property || '') + (h.taste ? ' · ' + h.taste : '')],
        ['产地', h.origin || ''],
        ['观察', h.observation || '']
      ];
      for (var r = 0; r < data.length; r++) {
        if (!data[r][1]) continue;
        var row = U.el('div', 'bp-row');
        row.appendChild(U.el('div', 'bp-row-k', data[r][0]));
        row.appendChild(U.el('div', 'bp-row-v', data[r][1]));
        rows.appendChild(row);
      }
    }

    sheetEl.style.setProperty('--bp-sheet-accent', color);
    sheetEl.classList.add('is-open');
    sheetEl.setAttribute('aria-hidden', 'false');
  }

  function closeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('is-open');
    sheetEl.setAttribute('aria-hidden', 'true');
  }

  /* ─────────── 正常视图 ─────────── */

  function build(res) {
    var color = accentOf(res.ids);

    var wrap = U.el('div', 'bp');
    try { wrap.style.setProperty('--bp-accent', color); } catch (e) { /* ignore */ }

    /* ① 顶部：眉标 + 主标题 + 副标题 + 极淡装饰层 */
    var head = U.el('div', 'bp-head');
    head.appendChild(U.el('div', 'bp-eyebrow en', LABEL));
    head.appendChild(U.el('h1', 'bp-title', '本草身体画像'));
    head.appendChild(U.el('p', 'bp-sub', '从五次观察，看看此刻的你。'));
    head.insertAdjacentHTML('beforeend', traceSVG());
    wrap.appendChild(head);

    /* ② 探索类型 + 关键词（名称与关键词 100% 取自 store.explorationType，不手写第二套映射） */
    var typeBox = U.el('div', 'bp-type');
    typeBox.appendChild(U.el('div', 'bp-type-k en', 'EXPLORATION TYPE'));
    typeBox.appendChild(U.el('div', 'bp-type-name', res.type.type));
    var kws = U.el('div', 'bp-type-kws');
    var kwList = Array.isArray(res.type.keywords) ? res.type.keywords : [];
    for (var i = 0; i < kwList.length; i++) kws.appendChild(U.el('span', 'tag bp-kw', kwList[i]));
    typeBox.appendChild(kws);
    wrap.appendChild(typeBox);

    /* ③ 六维雷达：顺序 气 / 血 / 阴 / 阳 / 湿 / 热（由渲染层按 DIM_ORDER 输出） */
    var radarWrap = U.el('div', 'bp-radar-wrap');
    var box = U.el('div', 'bp-radar-box');
    box.innerHTML = radarRender().svg(res.display, { color: color });
    radarWrap.appendChild(box);
    var cap = U.el('div', 'bp-radar-cap en', 'BODY OBSERVATION · SIX DIMENSIONS');
    radarWrap.appendChild(cap);
    wrap.appendChild(radarWrap);

    /* ④ 探索描述（短） */
    var desc = U.el('div', 'bp-desc');
    desc.appendChild(U.el('p', 'bp-desc-lead', LEAD));
    desc.appendChild(U.el('p', 'bp-desc-line', descOf(res.type.type)));
    wrap.appendChild(desc);

    /* ⑤ 推荐本草：固定 3 张卡，顺序严格 = recommendedHerbs，不重排 / 不重算 */
    var rec = U.el('div', 'bp-rec');
    var recHead = U.el('div', 'bp-rec-head');
    recHead.appendChild(U.el('h2', 'bp-rec-title', '与你的探索气质相近'));
    recHead.appendChild(U.el('span', 'bp-rec-sub en', 'CLOSE IN SPIRIT'));
    rec.appendChild(recHead);

    var cards = U.el('div', 'bp-cards');
    for (var c = 0; c < res.herbs.length; c++) cards.appendChild(buildCard(res.herbs[c], c));
    rec.appendChild(cards);
    wrap.appendChild(rec);

    /* ⑥ 次要动作：调整我的观察 → P08 第 1 题（不清空任何数据） */
    var actions = U.el('div', 'bp-actions');
    var adjust = U.el('button', 'btn-text bp-adjust', '调整我的观察');
    adjust.setAttribute('type', 'button');
    U.onClick(adjust, function () { BC.router.replace(8, { q: 0 }); });
    actions.appendChild(adjust);
    wrap.appendChild(actions);

    /* ⑥b 主按钮：进入本草实验室 → P10（冻结稿「P09 底部按钮统一为『进入本草实验室』」）
       Step 5 验收发现缺失入口，最小修复补上；只推进，不写任何 store 键。 */
    var foot = U.el('div', 'page-foot bp-foot');
    var lab = U.el('button', 'btn bp-cta', '进入本草实验室');
    lab.setAttribute('type', 'button');
    U.onClick(lab, function () { BC.router.go(10); });
    foot.appendChild(lab);
    wrap.appendChild(foot);

    /* ⑦ 统一免责声明（冻结稿第 14 节 #10：P08 / P09 / P11 / P12 / P13 同一文案） */
    var note = disclaimer();
    if (note) wrap.appendChild(U.el('p', 'bp-note', note));

    /* ⑧ 本草信息浮层 */
    sheetEl = buildSheet();
    wrap.appendChild(sheetEl);

    return wrap;
  }

  /* ─────────── 入场编排：标题/探索型 → 雷达生长 → 推荐本草依次淡入 ─────────── */

  function clearTimers() {
    if (timerDraw) { clearTimeout(timerDraw); timerDraw = null; }
    if (timerFinal) { clearTimeout(timerFinal); timerFinal = null; }
    for (var i = 0; i < timersCard.length; i++) clearTimeout(timersCard[i]);
    timersCard = [];
  }

  function reveal() {
    var el = root();
    if (!el) return;
    var radarEl = el.querySelector('.bp-radar');
    var cards = U.$$('#' + PAGE_ID + ' .bp-card');

    function drawRadar() { if (radarEl) radarEl.classList.add('is-draw'); }
    function showCards() {
      for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
    }
    function settle() { drawRadar(); showCards(); }

    if (skipFx()) { settle(); return; }

    timerDraw = setTimeout(drawRadar, DRAW_DELAY);
    for (var i = 0; i < cards.length; i++) {
      (function (card, delay) {
        timersCard.push(setTimeout(function () { card.classList.add('is-in'); },
          CARD_DELAY + delay));
      })(cards[i], i * CARD_STEP);
    }
    /* 终态兜底：即便某一环被禁用/异常，也会落到与 reduced-motion 相同的最终观感 */
    timerFinal = setTimeout(settle, CARD_DELAY + cards.length * CARD_STEP + FINAL_PAD);
  }

  /* ─────────── 数据异常降级（不白屏，不自造结果） ─────────── */

  function degradedView() {
    var wrap = U.el('div', 'bp bp-degraded');

    var head = U.el('div', 'bp-head');
    head.appendChild(U.el('div', 'bp-eyebrow en', LABEL));
    head.appendChild(U.el('h1', 'bp-title', '本草身体画像'));
    wrap.appendChild(head);

    var body = U.el('div', 'bp-body');
    var empty = U.el('div', 'bp-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '画', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'bp-empty-msg', FALLBACK_MSG));
    wrap.appendChild(body);

    var foot = U.el('div', 'page-foot bp-foot');
    var btn = U.el('button', 'btn bp-cta', FALLBACK_CTA);
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(8); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded() {
    var el = root();
    if (!el) return;
    degraded = true;
    clearTimers();
    sheetEl = null;
    el.innerHTML = '';
    el.appendChild(degradedView());
  }

  /* ─────────── 页面模块 ─────────── */

  var mod = {
    render: function () {
      var el = root();
      if (!el) return;

      clearTimers();
      degraded = false;
      sheetEl = null;

      try {
        el.innerHTML = '';

        var res = readResult();
        if (!res || !radarRender()) { showDegraded(); return; }

        el.appendChild(build(res));
        reveal();
      } catch (e) {
        showDegraded();
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);                 // 顶部右侧：BODY PROFILE
      if (degraded) return;
      var wrap = root() ? root().querySelector('.bp') : null;
      if (wrap) BC.fx.play('anim-rise', wrap, { duration: 600 });
    },

    /* 清理：三个定时器都要清掉；顺带收起浮层，避免离开后残留 */
    leave: function () {
      clearTimers();
      closeSheet();
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p09 = mod;

})(globalThis.BC);
