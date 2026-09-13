/*!
 * js/pages/page10.js —— PAGE10 本草实验室（HERBAL LAB）
 *
 * 定位（连续叙事）：
 *   P09 本草身体画像（观察结果） → **P10 本草实验室（创造 / 调配）** → P11 专属茶饮配方卡
 * 关键词：HERBAL LAB / MIXING / SPECIMEN / BOTANICAL MATERIAL / DIGITAL HERBAL CULTURE
 * 这里是 H5 从「探索 / 认知」转入「创造 / 调配」的转折页：数字本草实验室、文化探索、轻互动调配。
 *
 * 【本页不是】医疗调理 / 药物配方 / 疾病治疗 / 个体化健康建议；
 * 【本页不出现】治疗 / 改善疾病 / 药效保证 / 适合某疾病 / 你应该喝什么治什么；
 * 【本页使用】「本草文化配方 / 探索饮 / 生活灵感 / 文化体验」语汇。
 *
 * 【算法只调用，不重写】
 *   「一味本草 → 唯一一杯茶饮」的唯一入口是既有 js/logic/teamatch.js：
 *     BC.logic.resolveTea(chosenHerb, explorationType.type)
 *   页面内不建立 tea_ids / TYPE_INDEX / HERB_INDEX / 模糊匹配 / 随机抽取；
 *   resolveTea 是纯函数 → 同一 (explorationType, chosenHerb) 恒定得到同一杯茶。
 *   茶饮对象一律取 BC.data.teaById[teaId]（不手写茶名）；材料一律取
 *   BC.logic.buildIngredients(tea)（不手写材料名）。
 *
 * 【数据来源（只读）】
 *   recommendedHerbs（3 味，由 P09/既有 Logic 产出，本页不重算推荐）
 *   explorationType.type（茶饮匹配的输入）
 *   selectedHerbs（仅供本草色兜底，不修改）
 *
 * 【允许写入（全部为既有字段，不新增核心状态）】
 *   chosenHerb      —— 用户在 3 味推荐中选中的 1 味（原始输入）
 *   selectedTea     —— 由既有 teamatch 解析出的茶饮 id（派生）
 *   teaIngredients  —— 已放入杯中的材料（派生）：元素取自 BC.logic.buildIngredients，
 *                      顺序恒等于 selectedTea.materials 顺序，长度 ∈ {0,1,2}，永不出现第三味
 *   teaBrewStep     —— 调配进度：0 = 未开始（chosenHerb 可切换）/ 1 = 已进入调配（锁定）/ 2 = 两味完成
 *
 * 【本页不改动】bodyAnswers / bodyScores / bodyScoresDisplay / explorationType /
 *              recommendedHerbs / selectedHerbs；也不触碰 calcFingerprint
 *              （保留「输入已变 → 下游需重算」信号）。
 *
 * 【两阶段】
 *   ① 选择阶段：只显示 recommendedHerbs 的 3 张卡（不出现 12 味）；点选 → 选中态，
 *      其余 2 张轻度锁定（.is-dim）；底部固定主按钮「开始调配」在选定 1 味后才可用。
 *   ② 调配阶段：仅显示 selectedTea.materials 的 2 味材料；拖入杯 / 点一下材料 两种路径等价；
 *      两味完成 → 「配方已完成」+ 温和本草色光晕 → 约 1500ms 后 BC.router.go(11)。
 *
 * 复用：BC.store / BC.router / BC.logic / BC.fx / BC.utils（含 createDrag：Pointer→Touch→Click 三级降级）
 *       / BC.render.specimen（hexA / mountFigure / setStageLabel）
 *       / .btn / .btn-text / .page-foot / .tag / .anim-rise。
 * 未复制 P03–P09 的页面代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // hexA / mountFigure / setStageLabel

  var PAGE_ID = 'page-10';
  var LABEL = 'HERBAL LAB';             // 顶部右侧页标
  var REC_TOTAL = 3;                    // 推荐本草固定 3 味
  var MAT_TOTAL = 2;                    // 这一杯茶的材料固定 2 味

  var STATE_MIX_EN = 'LAB / MIXING';
  var STATE_DONE_EN = 'OBSERVATION → MIXED';

  var FALLBACK_REC = '还没有找到你的本草推荐';
  var FALLBACK_TEA = '这次调配暂时无法继续';
  var FALLBACK_CTA = '返回身体画像';

  /* 节奏（只影响观感；lowPerf / reduced / SKIP_ANIMATION 一律直接终态） */
  var COMPLETE_DELAY = 1500;            // 两味完成 → 进入 P11
  var REVEAL_DELAY = 120;               // 卡片首次淡入
  var REVEAL_STEP = 80;                 // 依次淡入间隔
  var REVEAL_PAD = 320;                 // 终态兜底
  var FLY_MS = 420;                     // 材料卡 → 杯子 的飞行时长

  var drags = [];
  var timers = [];
  var flyEl = null;

  var degraded = false;
  var completedNow = false;             // 本次进入页面内刚完成（→ 自动进 P11）；重进则为 false
  var busy = false;

  function root() { return document.getElementById(PAGE_ID); }
  function pad2(n) { return ('0' + n).slice(-2); }

  /* 统一免责文案：直接取冻结数据（data/rules.js），不在此复制一份 */
  function disclaimer() {
    try { return (BC.data.rules && BC.data.rules.DISCLAIMER) || ''; } catch (e) { return ''; }
  }

  /* 茶饮匹配的探索型输入：只读 store，缺省用冻结兜底型（不改写 store） */
  function typeName() {
    var t = '';
    try { t = (BC.store.get('explorationType') || {}).type || ''; } catch (e) { t = ''; }
    if (!t) t = (BC.data.rules && BC.data.rules.FALLBACK_TYPE) || '';
    return t;
  }

  /* 低性能 / 减少动效 / SKIP_ANIMATION → 不做入场编排，直接终态 */
  function skipFx() {
    try { if (BC.compat && BC.compat.lowPerf) return true; } catch (e) { /* ignore */ }
    return BC.fx.shouldSkip();
  }

  /* ─────────── 数据读取（只读；脏数据 → 降级，绝不白屏、绝不自行生成茶饮） ─────────── */

  function isAddedIn(added, herbId) {
    for (var i = 0; i < added.length; i++) { if (added[i].herbId === herbId) return true; }
    return false;
  }

  /**
   * 读取并校验进入本页所需的既有结果。
   * 返回 { bad:'rec'|'tea' } 表示需要降级；否则返回渲染所需快照。
   *
   *  · bad = 'rec'：recommendedHerbs 缺失 / 长度 ≠ 3 / 有无法解析项
   *                 → 「还没有找到你的本草推荐」→ P09
   *  · bad = 'tea'：chosenHerb 无法解析 / Tea Match 无结果 / selectedTea 无效 /
   *                 selectedTea.materials.length ≠ 2
   *                 → 「这次调配暂时无法继续」→ P09
   */
  function readState() {
    var st = BC.store.get();
    if (!st) return { bad: 'rec' };

    var rec = st.recommendedHerbs;
    if (!Array.isArray(rec) || rec.length !== REC_TOTAL) return { bad: 'rec' };
    var herbs = [];
    for (var i = 0; i < REC_TOTAL; i++) {
      var h = BC.data.herbById[rec[i]];
      if (!h) return { bad: 'rec' };              // 推荐项无法解析 → 降级（不猜、不自造）
      herbs.push(h);
    }

    /* 未选择，或选择已失效（推荐集合已变化）→ 回到选择阶段，不判定为异常 */
    var chosen = st.chosenHerb || '';
    var inRec = false;
    for (var r = 0; r < REC_TOTAL; r++) { if (rec[r] === chosen) inRec = true; }
    if (!chosen || !inRec) {
      return {
        herbs: herbs, chosen: '', tea: null, teaId: '', ings: [], added: [],
        phase: 'select'
      };
    }

    if (!BC.data.herbById[chosen]) return { bad: 'tea' };

    /* 唯一匹配入口：既有 teamatch（不重写任何映射表） */
    var rt = null;
    try { rt = BC.logic.resolveTea(chosen, typeName()); } catch (e) { rt = null; }
    if (!rt || !rt.tea || !rt.teaId) return { bad: 'tea' };

    var tea = BC.data.teaById[rt.teaId] || rt.tea;
    if (!tea || !tea.materials || tea.materials.length !== MAT_TOTAL) return { bad: 'tea' };

    /* selectedTea 已存在但指向不存在的茶饮 → 无效 → 降级（绝不自行造一杯） */
    var storedTea = st.selectedTea || '';
    if (storedTea && !BC.data.teaById[storedTea]) return { bad: 'tea' };

    /* selectedTea 缺失或与 teamatch 结果不一致（脏数据 / 上游答案已改）→ 以 teamatch 为准同步。
       同步只写 selectedTea 一个既有字段，仍完全由既有 Logic 决定，不留第二套匹配规则。 */
    if (storedTea !== rt.teaId) {
      try { BC.store.set('selectedTea', rt.teaId); } catch (e2) { /* ignore */ }
    }

    var ings = BC.logic.buildIngredients(tea);
    if (!ings || ings.length !== MAT_TOTAL) return { bad: 'tea' };

    /* teaIngredients：只保留属于这杯茶的 2 味，去重且按 materials 顺序（长度 ≤ 2） */
    var raw = Array.isArray(st.teaIngredients) ? st.teaIngredients : [];
    var seen = [];
    for (var k = 0; k < raw.length; k++) {
      var e = raw[k];
      /* 兼容两种既有写法：buildIngredients 产出的对象，或直接是 herbId 字符串 */
      var hid = (typeof e === 'string') ? e : ((e && (e.herbId || e.id)) || '');
      if (hid && seen.indexOf(hid) === -1 && BC.data.herbById[hid]) seen.push(hid);
    }
    var added = [];
    for (var m = 0; m < ings.length; m++) {
      if (seen.indexOf(ings[m].herbId) !== -1) added.push(ings[m]);
    }

    var step = (typeof st.teaBrewStep === 'number') ? st.teaBrewStep : 0;
    var phase = (step >= 1) ? 'mix' : 'select';   // 已开始调配 → chosenHerb 锁定

    return {
      herbs: herbs, chosen: chosen, tea: tea, teaId: tea.id,
      ings: ings, added: added, step: step, phase: phase
    };
  }

  /* ─────────── 装饰层（极细线，克制；一律 inset:0 + meet，绝不越出容器） ─────────── */

  function traceSVG() {
    return '' +
      '<svg class="hl-trace" viewBox="0 0 320 150" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">' +
      '<circle class="hl-ring-dec" cx="262" cy="40" r="26"/>' +
      '<circle class="hl-ring-dec hl-ring-dec-2" cx="262" cy="40" r="14"/>' +
      '<path class="hl-arc-dec" d="M6 138 C 70 138 108 106 152 80 S 252 36 314 30"/>' +
      '<path class="hl-tick-dec" d="M262 6 V14 M262 66 V74 M234 40 H242 M282 40 H290"/>' +
      '<circle class="hl-dot-dec" cx="152" cy="80" r="1.6"/>' +
      '<circle class="hl-dot-dec" cx="70" cy="138" r="1.6"/>' +
      '</svg>';
  }

  /** 圆形操作台 + 细线轨迹 + 小型刻度 + 材料节点 */
  function benchSVG() {
    return '' +
      '<svg class="hl-bench-svg" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
      '<circle class="hl-bench-c" cx="100" cy="128" r="84"/>' +
      '<circle class="hl-bench-c2" cx="100" cy="128" r="62"/>' +
      '<path class="hl-bench-arc" d="M16 128 A84 84 0 0 1 184 128"/>' +
      '<path class="hl-bench-tick" d="M100 38 V46 M100 210 V202 M10 128 H18 M190 128 H182"/>' +
      '<circle class="hl-bench-node" cx="100" cy="44" r="1.6"/>' +
      '<circle class="hl-bench-node" cx="184" cy="128" r="1.6"/>' +
      '<circle class="hl-bench-node" cx="16" cy="128" r="1.6"/>' +
      '</svg>';
  }

  /** 玻璃杯：透明轮廓 + 1px 细描边 + 杯身刻度 + 底部水平基准线 */
  function cupSVG() {
    return '' +
      '<svg class="hl-cup-svg" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
      '<ellipse class="hl-glass-rim" cx="100" cy="46" rx="46" ry="7"/>' +
      '<path class="hl-glass" d="M54 46 L60 182 Q62 196 76 196 L124 196 Q138 196 140 182 L146 46"/>' +
      '<path class="hl-glass-mouth" d="M60 49 Q100 60 140 49"/>' +
      '<path class="hl-glass-base" d="M38 196 H162"/>' +
      '<path class="hl-glass-tick" d="M148 84 H156 M147 118 H155 M146 152 H154"/>' +
      '</svg>';
  }

  /* ─────────── 阶段一：选择一味本草（只显示 recommendedHerbs 的 3 张） ─────────── */

  function buildCard(herb, i, chosen) {
    var color = BC.render.herbColor(herb.id);
    var on = (chosen === herb.id);

    var btn = document.createElement('button');
    btn.className = 'hl-card';
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-herb', herb.id);
    btn.setAttribute('data-slot', String(i + 1));
    btn.setAttribute('aria-label', herb.name);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { btn.style.setProperty('--hl-herb', color); } catch (e) { /* ignore */ }
    if (on) btn.classList.add('is-on');
    else if (chosen) btn.classList.add('is-dim');

    var fig = U.el('span', 'hl-card-fig');
    var halo = U.el('span', 'hl-card-halo');
    halo.style.background = 'radial-gradient(circle, ' + SP.hexA(color, '.30') + ' 0%, ' +
      SP.hexA(color, '.10') + ' 52%, rgba(12,11,9,0) 78%)';
    fig.appendChild(halo);
    var img = U.el('span', 'hl-card-img');
    fig.appendChild(img);
    btn.appendChild(fig);

    var info = U.el('span', 'hl-card-info');
    info.appendChild(U.el('span', 'hl-card-name', herb.name));
    var kw = (herb.keywords && herb.keywords[0]) ? herb.keywords[0] : '';
    if (kw) info.appendChild(U.el('span', 'hl-card-kw', kw));
    btn.appendChild(info);

    btn.appendChild(U.el('span', 'hl-card-no en', pad2(i + 1)));

    SP.mountFigure(img, herb, 64);              // webp → svg → placeholderSVG（沿用既有机制）
    U.onClick(btn, function () { selectHerb(herb.id); });
    return btn;
  }

  function buildPick(s) {
    var box = U.el('div', 'hl-pick');

    var sec = U.el('div', 'hl-sec');
    sec.appendChild(U.el('div', 'hl-sec-k en', 'SELECT ONE HERB'));
    sec.appendChild(U.el('h2', 'hl-sec-t', '选一味本草'));
    sec.appendChild(U.el('p', 'hl-sec-d', '从你的三味推荐中，挑一味继续探索。'));
    box.appendChild(sec);

    var cards = U.el('div', 'hl-cards');
    for (var i = 0; i < s.herbs.length; i++) cards.appendChild(buildCard(s.herbs[i], i, s.chosen));
    box.appendChild(cards);

    box.appendChild(U.el('p', 'hl-pick-hint', '选中后可随时更换；开始调配后即锁定这一味。'));
    return box;
  }

  /* ─────────── 阶段二：调配（仅 selectedTea.materials 的 2 味） ─────────── */

  function buildLayer(ing, slot, on) {
    var color = ing.color || BC.render.herbColor(ing.herbId);
    var el = U.el('span', 'hl-layer');
    el.setAttribute('data-herb', ing.herbId);
    el.setAttribute('data-slot', String(slot));
    try { el.style.setProperty('--hl-herb', color); } catch (e) { /* ignore */ }
    el.style.background = 'radial-gradient(ellipse at 50% ' + (slot === 1 ? '68%' : '32%') + ', ' +
      SP.hexA(color, '.52') + ' 0%, ' + SP.hexA(color, '.26') + ' 46%, rgba(12,11,9,0) 78%)';
    if (on) el.classList.add('is-on');
    return el;
  }

  function buildMat(ing, slot, on) {
    var herb = BC.data.herbById[ing.herbId] || { id: ing.herbId, name: ing.name, image: ing.image };
    var color = ing.color || BC.render.herbColor(ing.herbId);

    var btn = document.createElement('button');
    btn.className = 'hl-mat';
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-herb', ing.herbId);
    btn.setAttribute('data-slot', String(slot));
    btn.setAttribute('data-added', on ? '1' : '0');
    btn.setAttribute('aria-label', herb.name);
    try { btn.style.setProperty('--hl-herb', color); } catch (e) { /* ignore */ }
    if (on) btn.classList.add('is-added');

    var fig = U.el('span', 'hl-mat-fig');
    var halo = U.el('span', 'hl-mat-halo');
    halo.style.background = 'radial-gradient(circle, ' + SP.hexA(color, '.28') + ' 0%, ' +
      SP.hexA(color, '.10') + ' 52%, rgba(12,11,9,0) 78%)';
    fig.appendChild(halo);
    var img = U.el('span', 'hl-mat-img');
    fig.appendChild(img);
    btn.appendChild(fig);

    var info = U.el('span', 'hl-mat-info');
    info.appendChild(U.el('span', 'hl-mat-name', herb.name));
    if (ing.amount) info.appendChild(U.el('span', 'hl-mat-amt', ing.amount));
    btn.appendChild(info);

    btn.appendChild(U.el('span', 'hl-mat-state', on ? '已加入' : '待加入'));
    btn.appendChild(U.el('span', 'hl-mat-no en', pad2(slot)));

    SP.mountFigure(img, herb, 56);
    return btn;
  }

  function buildMix(s) {
    var complete = (s.added.length >= MAT_TOTAL);
    var tea = BC.data.teaById[BC.store.get('selectedTea')] || s.tea;
    var glowColor = (tea && tea.visual_color) || (s.ings[0] ? s.ings[0].color : '#8A9A7B');

    var box = U.el('div', 'hl-mix');

    /* 顶部状态：LAB / MIXING（完成 → OBSERVATION → MIXED） */
    var st = U.el('div', 'hl-state');
    st.appendChild(U.el('div', 'hl-state-k en', complete ? STATE_DONE_EN : STATE_MIX_EN));
    st.appendChild(U.el('div', 'hl-state-t', '本草调配'));
    var cnt = U.el('div', 'hl-count');
    cnt.appendChild(document.createTextNode('已加入 '));
    cnt.appendChild(U.el('b', '', String(s.added.length)));
    cnt.appendChild(document.createTextNode(' / ' + MAT_TOTAL));
    st.appendChild(cnt);
    box.appendChild(st);

    /* 操作台 + 玻璃杯（杯子命中区 = 整个操作台盒子，宽度 74vw ≥ 屏宽 60%） */
    var lab = U.el('div', 'hl-lab');
    var bench = U.el('div', 'hl-bench');
    bench.insertAdjacentHTML('beforeend', benchSVG());

    var glow = U.el('div', 'hl-glow');
    glow.style.background = 'radial-gradient(circle at 50% 50%, ' + SP.hexA(glowColor, '.30') +
      ' 0%, ' + SP.hexA(glowColor, '.12') + ' 42%, rgba(12,11,9,0) 68%)';
    if (complete) glow.classList.add('is-on');
    bench.appendChild(glow);

    var hit = U.el('div', 'hl-cup-hit');
    hit.insertAdjacentHTML('beforeend', cupSVG());
    var layers = U.el('div', 'hl-layers');
    for (var i = 0; i < s.ings.length; i++) {
      layers.appendChild(buildLayer(s.ings[i], i + 1, isAddedIn(s.added, s.ings[i].herbId)));
    }
    hit.appendChild(layers);
    hit.appendChild(U.el('div', 'hl-plume'));
    bench.appendChild(hit);

    lab.appendChild(bench);
    lab.appendChild(U.el('div', 'hl-cup-cap en', 'BOTANICAL MATERIAL'));
    box.appendChild(lab);

    /* 材料：恰好 2 味（selectedTea.materials），拖入 / 点一下 两种路径等价 */
    var mats = U.el('div', 'hl-mats');
    for (var m = 0; m < s.ings.length; m++) {
      var card = buildMat(s.ings[m], m + 1, isAddedIn(s.added, s.ings[m].herbId));
      mats.appendChild(card);
      bindDrag(card, s.ings[m]);
    }
    box.appendChild(mats);

    var hint = U.el('p', 'hl-mix-hint', '把材料拖入杯中，或直接点一下材料。');
    if (complete) hint.hidden = true;
    box.appendChild(hint);

    /* 完成态（预留高度，避免布局跳动） */
    var done = U.el('div', 'hl-done');
    if (complete) done.classList.add('is-on');
    done.appendChild(U.el('div', 'hl-done-t', complete ? '配方已完成' : ''));
    done.appendChild(U.el('div', 'hl-done-en en', complete ? 'MIXED' : ''));
    box.appendChild(done);

    return box;
  }

  /* ─────────── 拖拽（Pointer → Touch → Click 三级降级，全部走既有 BC.utils.createDrag） ─────────── */

  function resetTransform(el) {
    if (!el) return;
    try {
      el.style.webkitTransform = '';
      el.style.transform = '';
    } catch (e) { /* ignore */ }
  }

  function bindDrag(btn, ing) {
    var d = U.createDrag(btn, {
      onStart: function (el) { if (!skipFx()) el.classList.add('is-drag'); },
      onMove: function (el, dx, dy) {
        if (skipFx()) return;
        var t = 'translate(' + dx + 'px,' + dy + 'px)';
        el.style.webkitTransform = t;
        el.style.transform = t;
      },
      onDrop: function (el) {
        U.removeClass(el, 'is-drag');
        resetTransform(el);
        addMaterial(ing, el);
      },
      onCancel: function (el) {
        U.removeClass(el, 'is-drag');
        resetTransform(el);
      },
      onTap: function (el) { addMaterial(ing, el || btn); },
      hitTest: function (x, y) {
        var el = root();
        var box = el ? el.querySelector('.hl-cup-hit') : null;
        if (!box) return false;
        var r = box.getBoundingClientRect();
        return (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
      }
    });
    drags.push(d);
    return d;
  }

  function destroyDrags() {
    for (var i = 0; i < drags.length; i++) {
      try { drags[i].destroy(); } catch (e) { /* ignore */ }
    }
    drags = [];
  }

  /* ─────────── 加入材料（幂等；数组长度永不 > 2） ─────────── */

  function addMaterial(ing, srcEl) {
    if (busy || degraded) return;
    var s = readState();
    if (s.bad || s.phase !== 'mix' || !ing) return;

    if (isAddedIn(s.added, ing.herbId)) return;          // 重复点击 / 重复拖入 → 不重复添加
    if (s.added.length >= MAT_TOTAL) return;             // 长度上限

    var next = s.added.slice();
    next.push(ing);
    /* 保持 materials 顺序（派生语义：teaIngredients 恒为 selectedTea.materials 的有序子集） */
    var ordered = [];
    for (var k = 0; k < s.ings.length; k++) {
      for (var j = 0; j < next.length; j++) {
        if (next[j].herbId === s.ings[k].herbId) ordered.push(s.ings[k]);
      }
    }

    var full = (ordered.length >= MAT_TOTAL);
    BC.store.set('teaIngredients', ordered);
    BC.store.set('teaBrewStep', full ? 2 : 1);

    flyTo(srcEl, ing);            // 纯视觉：材料卡 → 杯子
    paintCup(ordered);            // 杯中层次
    syncMats(ordered);            // 材料卡状态
    updateCount(ordered.length);

    if (full) completeNow();
  }

  function paintCup(added) {
    var el = root();
    if (!el) return;
    var layers = U.$$('#' + PAGE_ID + ' .hl-layer');
    for (var i = 0; i < layers.length; i++) {
      var on = isAddedIn(added, layers[i].getAttribute('data-herb'));
      if (on) layers[i].classList.add('is-on');
      else layers[i].classList.remove('is-on');
    }
    var plume = el.querySelector('.hl-plume');
    if (plume && !skipFx()) {
      plume.classList.remove('is-pulse');
      void plume.offsetWidth;
      plume.classList.add('is-pulse');
      var id = setTimeout(function () { if (plume) plume.classList.remove('is-pulse'); }, 640);
      timers.push(id);
    }
  }

  function syncMats(added) {
    var el = root();
    if (!el) return;
    var cards = U.$$('#' + PAGE_ID + ' .hl-mat');
    for (var i = 0; i < cards.length; i++) {
      var on = isAddedIn(added, cards[i].getAttribute('data-herb'));
      cards[i].setAttribute('data-added', on ? '1' : '0');
      if (on) cards[i].classList.add('is-added');
      else cards[i].classList.remove('is-added');
      var st = cards[i].querySelector('.hl-mat-state');
      if (st) st.textContent = on ? '已加入' : '待加入';
    }
  }

  function updateCount(n) {
    var el = root();
    if (!el) return;
    var b = el.querySelector('.hl-count b');
    if (b) b.textContent = String(n);
  }

  /** 材料卡 → 杯子：一个本草色形态的飞行（只动 transform / opacity） */
  function flyTo(srcEl, ing) {
    if (skipFx() || !srcEl) return;
    var el = root();
    if (!el) return;
    var cup = el.querySelector('.hl-cup-hit');
    if (!cup) return;

    var a = srcEl.getBoundingClientRect();
    var b = cup.getBoundingClientRect();
    var sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    var tx = b.left + b.width / 2, ty = b.top + b.height * 0.6;
    var color = (ing && ing.color) || '#8A9A7B';

    var dot = U.el('span', 'hl-fly');
    dot.style.left = sx + 'px';
    dot.style.top = sy + 'px';
    dot.style.background = 'radial-gradient(circle, ' + SP.hexA(color, '.55') + ' 0%, ' +
      SP.hexA(color, '.22') + ' 55%, rgba(12,11,9,0) 80%)';
    el.appendChild(dot);
    void dot.offsetWidth;
    var t = 'translate(' + (tx - sx) + 'px,' + (ty - sy) + 'px) scale(.72)';
    dot.style.webkitTransform = t;
    dot.style.transform = t;
    dot.classList.add('is-go');

    flyEl = dot;
    var id = setTimeout(function () {
      if (dot.parentNode) dot.parentNode.removeChild(dot);
      if (flyEl === dot) flyEl = null;
    }, FLY_MS + 120);
    timers.push(id);
  }

  /* ─────────── 完成 ─────────── */

  function completeNow() {
    if (completedNow) return;
    completedNow = true;
    busy = true;

    var el = root();
    if (!el) return;

    var done = el.querySelector('.hl-done');
    if (done) done.classList.add('is-on');
    var dt = el.querySelector('.hl-done-t');
    if (dt) dt.textContent = '配方已完成';
    var de = el.querySelector('.hl-done-en');
    if (de) de.textContent = 'MIXED';

    var glow = el.querySelector('.hl-glow');
    if (glow) glow.classList.add('is-on');

    U.setText(el.querySelector('.hl-state-k'), STATE_DONE_EN);
    var hint = el.querySelector('.hl-mix-hint');
    if (hint) hint.hidden = true;

    var foot = el.querySelector('.hl-foot');
    if (foot) { foot.hidden = true; foot.innerHTML = ''; }

    var id = setTimeout(function () { BC.router.go(11); }, COMPLETE_DELAY);
    timers.push(id);
  }

  /* ─────────── 阶段切换 ─────────── */

  function selectHerb(id) {
    if (busy || degraded) return;
    var s = readState();
    if (s.bad) { showDegraded(s.bad); return; }
    if (s.phase !== 'select') return;                  // 已进入调配 → chosenHerb 锁定
    if (!BC.data.herbById[id]) return;

    var rt = null;
    try { rt = BC.logic.resolveTea(id, typeName()); } catch (e) { rt = null; }
    if (!rt || !rt.tea || !rt.teaId) { showDegraded('tea'); return; }
    var tea = BC.data.teaById[rt.teaId] || rt.tea;
    if (!tea || !tea.materials || tea.materials.length !== MAT_TOTAL) { showDegraded('tea'); return; }

    /* 一次原子写入：选定本草 + 由既有 teamatch 解析出的茶饮（切换本草 → 茶饮随之变化，确定性） */
    BC.store.batch({
      chosenHerb: id,
      selectedTea: rt.teaId,
      teaIngredients: [],
      teaBrewStep: 0
    });
    renderStage();
  }

  function startMix() {
    if (busy || degraded) return;
    var s = readState();
    if (s.bad) { showDegraded(s.bad); return; }
    if (s.phase !== 'select' || !s.chosen) return;

    var rt = null;
    try { rt = BC.logic.resolveTea(s.chosen, typeName()); } catch (e) { rt = null; }
    if (!rt || !rt.tea || !rt.teaId) { showDegraded('tea'); return; }
    var tea = BC.data.teaById[rt.teaId] || rt.tea;
    if (!tea || !tea.materials || tea.materials.length !== MAT_TOTAL) { showDegraded('tea'); return; }

    /* 进入调配：写入 teaBrewStep = 1（onward chosenHerb 锁定），杯内材料从 0 起 */
    BC.store.batch({
      selectedTea: rt.teaId,
      teaIngredients: [],
      teaBrewStep: 1
    });
    completedNow = false;
    renderStage();
    var stage = root() ? root().querySelector('.hl-stage') : null;
    if (stage) BC.fx.play('anim-rise', stage, { duration: 520 });
  }

  /* ─────────── 底部主按钮 ─────────── */

  function renderFoot(s, canStart) {
    var el = root();
    if (!el) return;
    var foot = el.querySelector('.hl-foot');
    if (!foot) return;
    foot.innerHTML = '';

    if (s.phase === 'select') {
      var btn = U.el('button', 'btn hl-cta', '开始调配');
      btn.setAttribute('type', 'button');
      btn.disabled = !canStart;
      if (canStart) U.onClick(btn, function () { startMix(); });
      foot.appendChild(btn);
      foot.hidden = false;
      return;
    }

    /* 已完成（重进页面时的补进按钮；本次会话内刚完成则自动进 P11，不显示按钮） */
    if (!completedNow && s.added.length >= MAT_TOTAL) {
      var b2 = U.el('button', 'btn hl-cta', '前往茶饮配方卡');
      b2.setAttribute('type', 'button');
      U.onClick(b2, function () { BC.router.go(11); });
      foot.appendChild(b2);
      foot.hidden = false;
      return;
    }

    foot.hidden = true;      // 调配中：不设主按钮，避免与拖拽 / 点选抢操作
  }

  /* ─────────── 骨架 / 阶段渲染 ─────────── */

  function renderStage() {
    var el = root();
    if (!el) return;

    var s = readState();
    if (s.bad) { showDegraded(s.bad); return; }

    completedNow = false;
    var stage = el.querySelector('.hl-stage');
    if (!stage) return;

    stage.innerHTML = '';
    destroyDrags();

    stage.appendChild(s.phase === 'select' ? buildPick(s) : buildMix(s));
    renderFoot(s, !!s.chosen);
    revealStage();
  }

  function buildShell() {
    var wrap = U.el('div', 'hl');

    var head = U.el('div', 'hl-head');
    head.appendChild(U.el('div', 'hl-eyebrow en', LABEL));
    head.appendChild(U.el('h1', 'hl-title', '本草实验室'));
    head.appendChild(U.el('p', 'hl-sub', '把刚才遇见的一味本草，带进一场小小的调配实验。'));
    head.insertAdjacentHTML('beforeend', traceSVG());
    wrap.appendChild(head);

    wrap.appendChild(U.el('div', 'hl-stage'));

    var note = disclaimer();
    if (note) wrap.appendChild(U.el('p', 'hl-note', note));

    wrap.appendChild(U.el('div', 'page-foot hl-foot'));
    return wrap;
  }

  /* 入场编排：卡片 / 材料按顺序淡入（只动 opacity / transform） */
  function revealStage() {
    var el = root();
    if (!el) return;
    var items = U.$$('#' + PAGE_ID + ' .hl-card, #' + PAGE_ID + ' .hl-mat');
    if (!items.length) return;

    function settle() {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    }
    if (skipFx()) { settle(); return; }

    for (var j = 0; j < items.length; j++) {
      (function (n, d) {
        timers.push(setTimeout(function () { n.classList.add('is-in'); }, REVEAL_DELAY + d));
      })(items[j], j * REVEAL_STEP);
    }
    timers.push(setTimeout(settle, REVEAL_DELAY + items.length * REVEAL_STEP + REVEAL_PAD));
  }

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
    if (flyEl && flyEl.parentNode) flyEl.parentNode.removeChild(flyEl);
    flyEl = null;
  }

  /* ─────────── 数据异常降级（不白屏，不自造茶饮） ─────────── */

  function degradedView(kind) {
    var wrap = U.el('div', 'hl hl-degraded');

    var head = U.el('div', 'hl-head');
    head.appendChild(U.el('div', 'hl-eyebrow en', LABEL));
    head.appendChild(U.el('h1', 'hl-title', '本草实验室'));
    wrap.appendChild(head);

    var body = U.el('div', 'hl-body');
    var empty = U.el('div', 'hl-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '调', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'hl-empty-msg', kind === 'rec' ? FALLBACK_REC : FALLBACK_TEA));
    wrap.appendChild(body);

    var foot = U.el('div', 'page-foot hl-foot');
    var btn = U.el('button', 'btn hl-cta', FALLBACK_CTA);
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(9); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded(kind) {
    var el = root();
    if (!el) return;
    degraded = true;
    busy = false;
    completedNow = false;
    clearTimers();
    destroyDrags();
    el.innerHTML = '';
    el.appendChild(degradedView(kind || 'tea'));
  }

  /* ─────────── 页面模块 ─────────── */

  var mod = {
    render: function () {
      var el = root();
      if (!el) return;

      clearTimers();
      destroyDrags();
      degraded = false;
      completedNow = false;
      busy = false;

      try {
        el.innerHTML = '';
        var s = readState();
        if (s.bad) { showDegraded(s.bad); return; }
        el.appendChild(buildShell());
        renderStage();
      } catch (e) {
        showDegraded('tea');
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);                 // 顶部右侧：HERBAL LAB
      if (degraded) return;
      var wrap = root() ? root().querySelector('.hl') : null;
      if (wrap) BC.fx.play('anim-rise', wrap, { duration: 600 });
    },

    /* 清理：定时器 + 拖拽监听 + 飞行元素，避免离开后残留 / 误跳 P11 */
    leave: function () {
      clearTimers();
      destroyDrags();
      busy = false;
      completedNow = false;
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p10 = mod;

})(globalThis.BC);
