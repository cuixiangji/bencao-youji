/*!
 * js/pages/page08.js —— PAGE08 我的身体观察（BODY OBSERVATION）
 *
 * 定位（连续叙事）：
 *   P07 我的三味本草（收束记录） → **P08 我的身体观察（生活状态观察 / 身体感受记录）** → P09 本草身体画像
 * 关键词：OBSERVATION / FIELD NOTE / BODY RHYTHM / BOTANICAL RECORD
 * 数字植物标本馆语境下的「田野记录」：细线、坐标点、极淡圆环、进度线、小面积本草色。
 *
 * 【本页不是】体质诊断 / 疾病判断 / 治疗建议 / 医学结论；
 *           不出现「你属于某某体质」「你存在某某问题」等判定式表达；
 *           不出现雷达图 / 结果图表 / 复杂数据可视化 / 传统中医诊断界面 / 医疗器械界面（雷达留给 P09）。
 * 语言一律为「观察 / 记录 / 感受」，选项文案 100% 取自 data/questions.js（冻结文本，不重写）。
 *
 * 数据：
 *   唯一原始输入 = BC.store.get('bodyAnswers')（长度 5，元素 'A'|'B'|'C'|null）
 *   进度游标     = BC.store.get('currentQuestion')
 *   本页只写 bodyAnswers / currentQuestion；完成第 5 题时调用既有 Logic 写入派生结果。
 *
 * 【G1 断点续答（保留既有核心语义，正式接入视觉）】
 *   进入 P08 时定位到 bodyAnswers 中「第一个未答项」（而非 currentQuestion 的下一题，避免跳题）。
 *   例：bodyAnswers = ["B","B","B","A",null] → 直接到 05 / 05，而不是从 01 / 05 重来。
 *   中途返回 P07 → 不清空 bodyAnswers / currentQuestion → 再次进入从未答处继续，已答保持原答案。
 *
 * 【不重复计分】计分是纯函数 calcBodyScores(完整 answers)：每次都从整份答案重算，
 *   因此「修改已答题」天然是覆盖语义 —— 不存在累加、不会出现分数叠加。
 *
 * 复用：BC.store / BC.router / BC.logic / BC.fx / BC.utils / BC.render.specimen（hexA 色值转换）
 *       / .btn / .page-foot / .anim-fade / .anim-fade-out / .anim-rise。
 * 未复制 P04–P07 的图鉴卡与档案页代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // 复用 hexA（#RRGGBB → rgba，规避旧 X5 8 位 hex 问题）

  var PAGE_ID = 'page-08';
  var TOTAL = 5;
  var DONE_DELAY = 800;                 // 「观察记录完成」过渡时长（700–1000ms）
  var FADE_MS = 160;                    // 切题时「当前题淡出」时长
  var LABEL = 'BODY OBSERVATION';       // 顶部右侧页标
  var FALLBACK_MSG = '观察记录暂时无法继续';
  var FALLBACK_CTA = '返回三味本草';

  /* 统一免责文案：直接取冻结数据（data/rules.js），不在此复制一份 */
  function disclaimer() {
    try {
      return (BC.data.rules && BC.data.rules.DISCLAIMER) || '';
    } catch (e) { return ''; }
  }

  var timer = null;                     // 完成过渡定时器（leave 必须清理）
  var switchTimer = null;               // 切题定时器（leave 必须清理）
  var busy = false;                     // 切题 / 完成期间锁定点击
  var completing = false;               // 是否已进入完成流程

  function root() { return document.getElementById(PAGE_ID); }
  function pad2(n) { return ('0' + n).slice(-2); }
  function isKey(k) { return k === 'A' || k === 'B' || k === 'C'; }

  /* 低性能 / 减少动效 / SKIP_ANIMATION → 直接切换，不阻塞 */
  function skipFx() {
    try { if (BC.compat && BC.compat.lowPerf) return true; } catch (e) { /* ignore */ }
    return BC.fx.shouldSkip();
  }

  /* ───────────────── 数据读取与规范化（脏数据不白屏） ───────────────── */

  function readAnswers() {
    var a = BC.store.get('bodyAnswers');
    if (!Array.isArray(a) || a.length !== TOTAL) {
      a = [null, null, null, null, null];
      BC.store.set('bodyAnswers', a);          // 用现有 Store API 初始化
      return a;
    }
    var out = [];
    var dirty = false;
    for (var i = 0; i < TOTAL; i++) {
      var v = a[i];
      if (isKey(v)) out.push(v);
      else { out.push(null); if (v !== null && v !== undefined) dirty = true; }
    }
    if (dirty) BC.store.set('bodyAnswers', out);
    return out;
  }

  /** 第一个未答题的下标；全答完返回 -1 */
  function firstUnanswered(answers) {
    for (var i = 0; i < TOTAL; i++) { if (!isKey(answers[i])) return i; }
    return -1;
  }

  /**
   * 定位当前应显示的题号。
   *  · 默认：bodyAnswers 中第一个未答项（G1 断点续答的唯一依据）
   *  · 全部答完：返回 TOTAL（不重新从第 1 题开始，直接进入完成确认）
   *  · ctx.q：仅供「回看 / 修改已答题」的内部入口（普通进入不带），仍会先做范围校验
   */
  function locate(answers, ctx) {
    if (ctx && typeof ctx.q === 'number' && ctx.q >= 0 && ctx.q < TOTAL && ctx.q % 1 === 0) {
      return ctx.q;
    }
    var first = firstUnanswered(answers);
    return first === -1 ? TOTAL : first;
  }

  /* 本草主题色：仅取既有 PALETTE（经 render.herbColor），不新增颜色 */
  function accentColor() {
    var sel = BC.store.get('selectedHerbs');
    var id = (Array.isArray(sel) && sel.length) ? sel[0] : '';
    var color = '';
    try { color = BC.render.herbColor(id) || ''; } catch (e) { color = ''; }
    return color || '#8A9A7B';
  }

  /* ───────────────── 顶部装饰层：极淡圆环 + 细轨迹线 + 坐标点 ───────────────── */

  function traceSVG() {
    return '' +
      '<svg class="bo-trace" viewBox="0 0 320 128" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">' +
      '<circle class="bo-ring" cx="266" cy="34" r="26"/>' +
      '<circle class="bo-ring bo-ring-2" cx="266" cy="34" r="14"/>' +
      '<path class="bo-arc" d="M6 116 C 68 116 106 86 148 62 S 250 32 314 26"/>' +
      '<path class="bo-tick" d="M266 4 V12 M266 56 V64 M236 34 H244 M288 34 H296"/>' +
      '<circle class="bo-node" cx="148" cy="62" r="1.6"/>' +
      '<circle class="bo-node" cx="68" cy="116" r="1.6"/>' +
      '</svg>';
  }

  /* ───────────────── 进度：01 / 05 + 细进度线 ───────────────── */

  function updateProgress(n) {
    var el = root();
    if (!el) return;
    var step = el.querySelector('.bo-step');
    if (step) step.textContent = pad2(n) + ' / ' + pad2(TOTAL);
    var fill = el.querySelector('.bo-bar > i');
    if (fill) fill.style.width = Math.round((Math.min(n, TOTAL) / TOTAL) * 100) + '%';
  }

  /* ───────────────── 骨架 ───────────────── */

  function build() {
    var wrap = U.el('div', 'bo');
    try { wrap.style.setProperty('--bo-accent', accentColor()); } catch (e) { /* ignore */ }

    /* 顶部：英文眉标 + 主标题 + 副标题（+ 装饰层） */
    var head = U.el('div', 'bo-head');
    head.appendChild(U.el('div', 'bo-eyebrow en', 'FIELD NOTE'));
    head.appendChild(U.el('h1', 'bo-title', '我的身体观察'));
    head.appendChild(U.el('p', 'bo-sub', '从日常感受出发，记录此刻的自己。'));
    head.insertAdjacentHTML('beforeend', traceSVG());
    wrap.appendChild(head);

    /* 进度：01 / 05 + 细进度线 */
    var prog = U.el('div', 'bo-progress');
    prog.appendChild(U.el('div', 'bo-step en', pad2(1) + ' / ' + pad2(TOTAL)));
    var bar = U.el('div', 'bo-bar');
    bar.appendChild(U.el('i', ''));
    prog.appendChild(bar);
    wrap.appendChild(prog);

    /* 中部：单题流水线容器（切题动画作用于此层） */
    wrap.appendChild(U.el('div', 'bo-stage'));

    /* 底部：极轻提示（无长说明文案） */
    var hint = U.el('div', 'bo-hint', '凭第一感觉选择即可');
    wrap.appendChild(hint);

    /* 免责声明（冻结稿第 14 节 #10：P08 / P09 / P11 / P12 / P13 统一文案） */
    var note = disclaimer();
    if (note) wrap.appendChild(U.el('p', 'bo-note', note));

    return wrap;
  }

  /* ───────────────── 题目渲染 ───────────────── */

  function optionBtn(opt, idx, answers) {
    var b = U.el('button', 'bo-opt');
    b.setAttribute('type', 'button');
    b.setAttribute('data-key', opt.key);
    b.setAttribute('aria-pressed', 'false');

    b.appendChild(U.el('span', 'bo-opt-key en', opt.key));
    b.appendChild(U.el('span', 'bo-opt-text', opt.text));
    b.appendChild(U.el('span', 'bo-opt-dot'));

    /* 已答题回显：进入该题时恢复之前的选项（可再次修改，覆盖写入） */
    if (answers[idx] === opt.key) {
      b.classList.add('is-on');
      b.setAttribute('aria-pressed', 'true');
    }

    U.onClick(b, function () { select(idx, opt.key); });
    return b;
  }

  function paint(idx, animate) {
    var el = root();
    if (!el) return;
    var stage = el.querySelector('.bo-stage');
    if (!stage) return;

    U.removeClass(stage, 'anim-fade-out');
    stage.innerHTML = '';

    var q = (BC.data.questions || [])[idx];
    if (!q) { showDegraded(); return; }

    var answers = BC.store.get('bodyAnswers');
    if (!Array.isArray(answers)) answers = [null, null, null, null, null];

    var qWrap = U.el('div', 'bo-q');
    qWrap.setAttribute('data-q', String(idx + 1));
    qWrap.appendChild(U.el('h2', 'bo-q-title', q.title));

    var opts = U.el('div', 'bo-options');
    for (var i = 0; i < q.options.length; i++) {
      opts.appendChild(optionBtn(q.options[i], idx, answers));
    }
    qWrap.appendChild(opts);
    stage.appendChild(qWrap);

    updateProgress(idx + 1);

    if (animate !== false) BC.fx.play('anim-rise', stage, { duration: 420 });
  }

  /** 选中态立即回显（只改视觉，不动数据） */
  function markSelected(idx, key) {
    var el = root();
    if (!el) return;
    var q = el.querySelector('.bo-q[data-q="' + (idx + 1) + '"]');
    if (!q) return;
    var btns = q.querySelectorAll('.bo-opt');
    for (var i = 0; i < btns.length; i++) {
      var on = (btns[i].getAttribute('data-key') === key);
      if (on) btns[i].classList.add('is-on');
      else btns[i].classList.remove('is-on');
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  /* ───────────────── 选择：记录 → 进度 → 下一题（无独立确认步骤） ───────────────── */

  function select(idx, key) {
    if (busy || completing) return;

    var cur = BC.store.get('bodyAnswers');
    if (!Array.isArray(cur) || cur.length !== TOTAL) cur = [null, null, null, null, null];
    cur = cur.slice();
    cur[idx] = key;                                  // 覆盖写：不累加、不追加、不去重
    busy = true;

    BC.store.set('bodyAnswers', cur);                // ① 写入答案（唯一原始输入）
    markSelected(idx, key);                          // ② 立即显示选中状态

    var next = firstUnanswered(cur);
    BC.store.set('currentQuestion', next === -1 ? TOTAL : next);   // ③ 更新进度游标

    if (next === -1) { complete(); return; }          // ④ 第 5 题完成 → 结算并进入过渡态
    advance(next);                                    //    否则 → 进入下一题
  }

  /**
   * 切到下一题：当前题淡出 → 下一题淡入 + 轻微上移。
   *
   * 编排由定时器驱动，而不是等 animationend：
   *   动画只负责「好看」，绝不参与流程推进 —— 一旦 animationend 未触发
   *  （动画被禁用 / 内核差异 / 元素被重建），流程仍会在 FADE_MS 内完成切换，
   *   不会把 busy 永久卡住。低性能 / 减少动效 / SKIP_ANIMATION 则直接切换。
   */
  function advance(next) {
    var el = root();
    var stage = el ? el.querySelector('.bo-stage') : null;

    if (!stage || skipFx()) { busy = false; paint(next); return; }

    BC.fx.play('anim-fade-out', stage, { duration: FADE_MS });   // 纯视觉

    if (switchTimer) clearTimeout(switchTimer);
    switchTimer = setTimeout(function () {
      switchTimer = null;
      U.removeClass(stage, 'anim-fade-out');
      busy = false;
      paint(next);
    }, FADE_MS);
  }

  /* ───────────────── 完成：调用既有 Logic 结算 → 过渡态 → P09 ───────────────── */

  /**
   * 结果就绪检查 + （必要时）结算。
   * 计分是「完整答案」的纯函数：只要算出的分与已存分一致，就什么都不写 ——
   * 既不重算、也不动指纹（避免把下游页依赖的「输入已变」信号抹掉）。
   */
  function ensureResults(answers) {
    var scores = BC.logic.calcBodyScores(answers);       // 纯函数：从整份答案重算
    if (!scores) return false;                           // 数据异常

    var st = BC.store.get();
    var ready = !!(st.bodyScores && st.explorationType && st.explorationType.type);
    if (ready) {
      var sameScores = false;
      try { sameScores = (JSON.stringify(st.bodyScores) === JSON.stringify(scores)); }
      catch (e) { sameScores = false; }
      if (sameScores) return true;                       // 结果一致 → 不写、不刷新指纹
    }

    var norm = BC.logic.normalizeRadar(scores);
    var type = BC.logic.detectExplorationType(scores);    // type.keywords 即 explorationKeyword

    BC.store.batch({
      bodyScores: scores,
      bodyScoresDisplay: norm.display,
      explorationType: type,
      recommendedHerbs: BC.logic.recommendHerbs(type.type)
    });
    try { BC.store.refreshFingerprint(); } catch (e) { /* ignore */ }
    return true;
  }

  function schedule9() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      BC.router.go(9);
    }, DONE_DELAY);
  }

  function showDone() {
    var el = root();
    if (!el) return;
    var stage = el.querySelector('.bo-stage');
    if (stage) {
      U.removeClass(stage, 'anim-fade-out');
      stage.innerHTML = '';
      var box = U.el('div', 'bo-done');
      box.appendChild(U.el('div', 'bo-done-ring'));
      box.appendChild(U.el('div', 'bo-done-t', '观察记录完成'));
      box.appendChild(U.el('div', 'bo-done-en en', 'OBSERVATION RECORDED'));
      stage.appendChild(box);
      BC.fx.play('anim-fade', box, { duration: 420 });
    }
    updateProgress(TOTAL);
    var hint = el.querySelector('.bo-hint');
    if (hint) hint.hidden = true;
  }

  /** 完成流程：结算 → 过渡态 → 自动进入 P09（数据异常则降级，不白屏） */
  function finish(answers) {
    if (!ensureResults(answers)) { showDegraded(); return false; }
    showDone();
    schedule9();
    return true;
  }

  function complete() {
    completing = true;
    busy = true;
    finish(BC.store.get('bodyAnswers'));
  }

  /* ───────────────── 数据异常降级（不白屏） ───────────────── */

  function degradedView() {
    var wrap = U.el('div', 'bo bo-degraded');

    var head = U.el('div', 'bo-head');
    head.appendChild(U.el('div', 'bo-eyebrow en', 'FIELD NOTE'));
    head.appendChild(U.el('h1', 'bo-title', '我的身体观察'));
    wrap.appendChild(head);

    var body = U.el('div', 'bo-body');
    var empty = U.el('div', 'bo-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '观', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'bo-empty-msg', FALLBACK_MSG));
    wrap.appendChild(body);

    var foot = U.el('div', 'page-foot bo-foot');
    var btn = U.el('button', 'btn bo-cta', FALLBACK_CTA);
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(7); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded() {
    var el = root();
    if (!el) return;
    completing = false;
    busy = false;
    if (timer) { clearTimeout(timer); timer = null; }
    el.innerHTML = '';
    el.appendChild(degradedView());
  }

  /* ───────────────── 页面模块 ───────────────── */

  var mod = {
    render: function (ctx) {
      var el = root();
      if (!el) return;

      completing = false;
      busy = false;
      if (timer) { clearTimeout(timer); timer = null; }
      if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; }

      try {
        el.innerHTML = '';

        var answers = readAnswers();
        var idx = locate(answers, ctx);

        /* 5 题已全部答完：不重新从第 1 题开始，直接进入完成确认 → P09 */
        if (idx >= TOTAL) {
          el.appendChild(build());
          completing = true;
          busy = true;
          finish(answers);
          return;
        }

        BC.store.set('currentQuestion', idx);   // G1：当前题号 = 第一个未答项
        el.appendChild(build());
        paint(idx, false);                      // 首屏由 enter() 统一做入场动画
      } catch (e) {
        showDegraded();
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);                  // 顶部右侧：BODY OBSERVATION
      var el = root();
      if (!el || completing) return;
      var wrap = el.querySelector('.bo');
      if (wrap) BC.fx.play('anim-rise', wrap, { duration: 600 });
    },

    /* 清理：两个定时器都要清掉，避免离开后误跳下一题 / 误跳 P09 */
    leave: function () {
      if (timer) { clearTimeout(timer); timer = null; }
      if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; }
      busy = false;
      completing = false;
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p08 = mod;

})(globalThis.BC);
