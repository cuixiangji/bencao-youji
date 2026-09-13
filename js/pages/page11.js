/*!
 * js/pages/page11.js —— PAGE11 专属茶饮配方卡（TEA FORMULA）
 *
 * 定位（连续叙事的收束）：
 *   P10 本草实验室（调配完成） → **P11 专属茶饮配方卡（成果呈现）** → P12 探索档案 → P13 分享
 * 关键词：TEA FORMULA / SPECIMEN PLATE / BOTANICAL ILLUSTRATION / DIGITAL HERBAL MUSEUM
 *
 * 【本页不是】医疗调理 / 药物配方 / 疾病治疗 / 个体化健康建议；
 * 【本页不出现】功效保证 / 疾病治疗 / 个体化用药 / 医学诊断 / 体质诊断；
 * 【本页使用】「本草灵感饮 / 本草组成 / 风味联想 / 植物意象 / 文化探索」语汇。
 *
 * 【视觉目标（图文并茂，而非文字卡片）】
 *   大面积本草插画主视觉 + 醒目大标题 + 两味本草明确识别 + 图文标注关系 +
 *   元素轻微突破卡片边界 + 信息分层明确但不堆叠小模块。
 *   保持「数字本草博物馆 / 当代本草插画 / 东方自然感 / 年轻化 / 平面设计感」，
 *   不复制任何外部参考图的插画、文字、版式或传统中式视觉。
 *
 * 【数据读取（严格只读，绝不重算、绝不修改）】
 *   selectedTea     —— Store 中是茶饮 **id**（字符串），本页解析 BC.data.teaById[id] 取
 *                      { name, materials, keywords, visual_color }；不自行匹配、不随机。
 *   chosenHerb      —— 仅用于一致性标记（data-chosen），不驱动布局。
 *   teaIngredients   —— 仅用于在「本草组成」里标记已入杯项（data-in-tea）。
 *   teaBrewStep      —— 仅用于一致性标记（data-brew-step），不驱动布局。
 *   **本页不写入任何 store 键**（不 set / 不 batch / 不 refreshFingerprint）。
 *
 * 【不重算】探索型 / 雷达图 / 推荐本草 / 用户答案 —— 全部不读不写；本页只用 selectedTea。
 * 【不修改】bodyAnswers / explorationType / selectedHerbs / recommendedHerbs。
 *
 * 复用：BC.store（只读）/ BC.router / BC.data / BC.render.specimen（hexA / setStageLabel）
 *       / BC.render.herbColor / BC.fx / BC.utils（含 toast）/ .btn / .btn-ghost / .page-foot。
 * 未复制 P03–P10 的页面代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // hexA / setStageLabel

  var PAGE_ID = 'page-11';
  var LABEL = 'CREATE / TEA FORMULA';   // 顶部右侧页标
  var STAGE_KEY = '05 / TEA FORMULA';   // 卡片内小号英文编号
  var KICKER = '我的本草灵感饮';          // 主标题区固定小标
  var MAT_TOTAL = 2;                    // 这一杯固定 2 味材料

  var FALLBACK_MSG = '暂时无法生成配方卡';
  var FALLBACK_CTA = '返回本草实验室';

  /* 卡片内插画/标注最多 4 个（本页固定 2 味 → 2 个标注） */
  var ANNOT_MAX = 4;

  /* 入场节奏：总时长 ≈ 740ms（落在 500–800ms 区间内）；
     只影响观感，lowPerf / reduced / SKIP_ANIMATION 一律直接终态 */
  var T_CARD = 40;
  var T_FIG_A = 160;
  var T_FIG_B = 260;
  var T_VESSEL = 360;
  var T_ANNOT = 470;
  var T_NAME = 620;
  var T_SETTLE = 780;

  var timers = [];
  var busy = false;
  var saved = false;                    // 页面内保存状态（不写 store）

  function root() { return document.getElementById(PAGE_ID); }
  function pad2(n) { return ('0' + n).slice(-2); }

  /* ── 颜色工具 ─────────────────────────────────────────────── */

  /** #RRGGBB → [r,g,b]；非法值返回 null */
  function rgbOf(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    if (h.length !== 6) return null;
    var n = parseInt(h, 16);
    if (isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /**
   * 把本草主题色向暖深褐（#5B4638）混合，得到在暖米白卡面上可读的「标本墨色」。
   * k = 0 → 原色；k = 1 → 纯 #5B4638。纯展示用途，不改数据色板。
   */
  function deepen(hex, k) {
    var c = rgbOf(hex);
    if (!c) return '#5B4638';
    var t = rgbOf('#5B4638');
    var out = [
      Math.round(c[0] * (1 - k) + t[0] * k),
      Math.round(c[1] * (1 - k) + t[1] * k),
      Math.round(c[2] * (1 - k) + t[2] * k)
    ];
    return '#' + out.map(function (n) {
      var s = n.toString(16).toUpperCase();
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }

  function disclaimer() {
    try { return (BC.data.rules && BC.data.rules.DISCLAIMER) || ''; } catch (e) { return ''; }
  }

  /* 相对亮度（0–1）：用于判断本草色在暖米白卡面上的可读性 */
  function lumOf(hex) {
    var c = rgbOf(hex);
    if (!c) return 0;
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  }

  /**
   * 标本墨色的靠拢系数 k（纯展示用途，不改数据色板）：
   * PALETTE 里川贝母 #E9E4D8 / 茯苓 #E3E0D5 近白，若按同一系数描边会在米白卡面上糊掉，
   * 故越浅的本草色越向暖深褐 #5B4638 靠拢，保证轮廓始终可读（仍是低饱和植物色）。
   */
  function inkK(base) {
    var L = lumOf(base);
    if (L > 0.82) return 0.72;
    if (L > 0.70) return 0.56;
    return 0.42;
  }

  function skipFx() {
    try { if (BC.compat && BC.compat.lowPerf) return true; } catch (e) { /* ignore */ }
    return BC.fx.shouldSkip();
  }

  /* ── 页面内展示文案表（非算法、非数据结构；仅用于标注与列表英文小标） ──
     中文名一律取数据（herb.name），此处只补一个等价的英文短标注。 */
  var EN_LABEL = {
    chuanbeimu: 'FRITILLARY BULB', chuanxiong: 'SICHUAN LOVAGE', huanglian: 'COPTIS ROOT',
    lianzi: 'LOTUS SEED', chenpi: 'CITRUS PEEL', jinyinhua: 'HONEYSUCKLE',
    juhua: 'CHRYSANTHEMUM', gouqizi: 'GOJI BERRY', fuling: 'PORIA',
    gancao: 'LICORICE ROOT', shanzha: 'HAWTHORN', bohe: 'MINT LEAF'
  };

  /* 形态原型（页面内展示用；决定占位插画的轮廓差异，不改数据） */
  var FORM = {
    chuanbeimu: 'bulb', chuanxiong: 'rhizome', huanglian: 'rootlet',
    lianzi: 'seed', chenpi: 'peel', jinyinhua: 'bud',
    juhua: 'flower', gouqizi: 'berry', fuling: 'sclerotium',
    gancao: 'root', shanzha: 'fruit', bohe: 'leaf'
  };

  function enOf(herbId) { return EN_LABEL[herbId] || String(herbId || '').toUpperCase(); }
  function formOf(herbId) { return FORM[herbId] || 'leaf'; }

  /* ── 差异化本草轮廓（页面内 inline SVG，每味按形态原型区分） ────────────
     轮廓差异：根茎 / 鳞茎 / 果实 / 种子 / 花 / 花蕾 / 浆果 / 菌核 / 根 /
               果皮 / 叶 / 簇根 —— 12 味各不相同。
     颜色：fill = 标本墨色 30% 淡染，stroke = 标本墨色 80% 轮廓（低饱和）。 */
  function figureSVG(herb) {
    var base = BC.render.herbColor(herb && herb.id);
    var k = inkK(base);
    var ink = deepen(base, k);
    var f = SP.hexA(deepen(base, Math.max(0.14, k - 0.24)), '.30');
    var s = ink;
    var w = '1.2';
    var form = formOf(herb && herb.id);
    var d = '';

    if (form === 'bulb') {
      /* 川贝母：两枚抱合鳞瓣（松贝「怀中抱月」）+ 基部须根 */
      d = '<path d="M50 90 C35 90 23 77 23 58 C23 39 33 23 44 11 C42 34 46 57 50 75 Z" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M50 90 C65 90 77 77 77 58 C77 39 67 23 56 11 C58 34 54 57 50 75 Z" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M50 75 V90" stroke="' + s + '" stroke-width=".9" fill="none" opacity=".6"/>' +
        '<path d="M32 34 C36 45 39 55 43 64" stroke="' + s + '" stroke-width=".7" fill="none" opacity=".45"/>' +
        '<path d="M68 34 C64 45 61 55 57 64" stroke="' + s + '" stroke-width=".7" fill="none" opacity=".45"/>' +
        '<path d="M50 90 C47 94 43 96 39 97 M50 90 C53 94 57 96 61 97" stroke="' + s + '" stroke-width=".9" fill="none" opacity=".55"/>';
    } else if (form === 'peel') {
      /* 陈皮：卷曲果皮 + 香气弧线 */
      d = '<path d="M23 34 C35 15 68 13 79 30 C88 45 80 61 66 64 C72 51 65 38 54 34 C42 29 31 37 29 50 C27 62 34 74 45 78 C29 80 18 67 19 52 C19 44 21 38 23 34 Z" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M62 20 C71 23 77 30 79 38" stroke="' + s + '" stroke-width=".8" fill="none" opacity=".55"/>' +
        '<path d="M50 70 C54 66 60 65 65 67" stroke="' + s + '" stroke-width=".8" fill="none" opacity=".45"/>' +
        '<path d="M40 82 C44 79 49 79 53 81" stroke="' + s + '" stroke-width=".8" fill="none" opacity=".4"/>';
    } else if (form === 'seed') {
      /* 莲子：椭圆种子 + 顶部小芽 + 内部种脐 */
      d = '<ellipse cx="50" cy="58" rx="23" ry="28" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M50 30 C50 22 45 16 38 13" stroke="' + s + '" stroke-width="1.1" fill="none"/>' +
        '<path d="M38 13 C44 10 49 14 50 20" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<ellipse cx="50" cy="58" rx="11" ry="14" fill="none" stroke="' + s + '" stroke-width=".7" opacity=".45"/>' +
        '<path d="M50 44 C46 49 46 56 50 62 C54 56 54 49 50 44 Z" fill="none" stroke="' + s + '" stroke-width=".8" opacity=".5"/>';
    } else if (form === 'flower') {
      /* 菊花：放射花瓣 rosette + 花心 */
      var petals = '';
      for (var i = 0; i < 12; i++) {
        petals += '<ellipse cx="50" cy="24" rx="6" ry="15" fill="' + f + '" stroke="' + s +
          '" stroke-width=".7" transform="rotate(' + (i * 30) + ' 50 50)"/>';
      }
      d = petals +
        '<circle cx="50" cy="50" r="10" fill="' + f + '" stroke="' + s + '" stroke-width="1"/>' +
        '<circle cx="50" cy="50" r="4" fill="' + s + '" opacity=".4"/>';
    } else if (form === 'bud') {
      /* 金银花：细长花蕾 + 双瓣 + 茎 + 叶 */
      d = '<path d="M50 80 C50 58 50 40 50 24" stroke="' + s + '" stroke-width="1.4" fill="none"/>' +
        '<path d="M50 32 C42 27 35 31 33 39 C42 42 48 39 50 32 Z" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<path d="M50 32 C58 27 65 31 67 39 C58 42 52 39 50 32 Z" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<path d="M50 24 C47 17 50 11 57 9" stroke="' + s + '" stroke-width="1" fill="none"/>' +
        '<path d="M50 64 C41 57 32 59 28 66 C37 72 46 70 50 64 Z" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>';
    } else if (form === 'berry') {
      /* 枸杞子：浆果cluster + 短梗 */
      d = '<path d="M50 84 C50 66 50 52 50 38" stroke="' + s + '" stroke-width="1.3" fill="none"/>' +
        '<ellipse cx="39" cy="62" rx="9" ry="13" fill="' + f + '" stroke="' + s + '" stroke-width=".9" transform="rotate(-18 39 62)"/>' +
        '<ellipse cx="61" cy="59" rx="8" ry="12" fill="' + f + '" stroke="' + s + '" stroke-width=".9" transform="rotate(16 61 59)"/>' +
        '<ellipse cx="50" cy="39" rx="7" ry="10" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<path d="M50 29 C44 25 40 27 38 32" stroke="' + s + '" stroke-width=".9" fill="none"/>';
    } else if (form === 'leaf') {
      /* 薄荷：茎 + 两对锯齿叶 */
      var leafL = 'M50 40 C34 40 21 32 17 19 C34 17 48 26 50 40 Z';
      var leafR = 'M50 56 C66 56 79 48 83 35 C66 33 52 42 50 56 Z';
      d = '<path d="M50 90 C50 66 50 44 50 20" stroke="' + s + '" stroke-width="1.2" fill="none"/>' +
        '<path d="' + leafL + '" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<path d="' + leafR + '" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<path d="M50 70 C38 70 28 64 24 54 C38 52 49 59 50 70 Z" fill="' + f + '" stroke="' + s + '" stroke-width=".9" opacity=".8"/>' +
        '<path d="M50 40 H32 M50 56 H70" stroke="' + s + '" stroke-width=".6" opacity=".5"/>';
    } else if (form === 'sclerotium') {
      /* 茯苓：不规则菌核（云朵状）+ 细小斑点 */
      d = '<path d="M27 45 C29 30 44 23 57 28 C71 33 79 46 74 60 C70 73 57 81 45 78 C31 75 23 62 27 45 Z" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M35 50 C40 45 47 45 51 50" stroke="' + s + '" stroke-width=".7" fill="none" opacity=".5"/>' +
        '<circle cx="61" cy="57" r="1.7" fill="' + s + '" opacity=".45"/>' +
        '<circle cx="44" cy="64" r="1.3" fill="' + s + '" opacity=".4"/>' +
        '<circle cx="53" cy="38" r="1.2" fill="' + s + '" opacity=".38"/>';
    } else if (form === 'root') {
      /* 甘草：波浪状根条束 */
      d = '<path d="M29 16 C40 33 29 50 41 66 C50 79 43 87 39 92" stroke="' + s + '" stroke-width="2.6" fill="none" opacity=".55"/>' +
        '<path d="M51 12 C62 31 49 48 60 64 C67 75 63 85 58 92" stroke="' + s + '" stroke-width="3" fill="none" opacity=".45"/>' +
        '<path d="M70 22 C77 39 68 54 75 71" stroke="' + s + '" stroke-width="2.2" fill="none" opacity=".35"/>' +
        '<path d="M36 36 H44 M45 56 H53 M63 44 H71" stroke="' + s + '" stroke-width=".7" opacity=".4"/>';
    } else if (form === 'fruit') {
      /* 山楂：圆形果实 + 顶部萼 + 一叶 */
      d = '<circle cx="50" cy="59" r="24" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<path d="M50 35 V24" stroke="' + s + '" stroke-width="1.2" fill="none"/>' +
        '<path d="M43 31 C49 26 55 26 60 31" stroke="' + s + '" stroke-width="1" fill="none"/>' +
        '<path d="M50 30 C60 21 73 21 79 27 C71 36 58 36 50 30 Z" fill="' + f + '" stroke="' + s + '" stroke-width=".9"/>' +
        '<circle cx="42" cy="52" r="2" fill="' + s + '" opacity=".32"/>' +
        '<circle cx="58" cy="66" r="1.6" fill="' + s + '" opacity=".28"/>';
    } else if (form === 'rhizome') {
      /* 川芎：不规则块状根茎 + 环节 */
      d = '<path d="M25 41 C34 30 48 30 56 38 C64 30 77 33 79 43 C85 53 76 63 66 65 C62 76 49 79 41 72 C31 79 19 70 21 58 C17 50 19 45 25 41 Z" fill="' + f + '" stroke="' + s + '" stroke-width="' + w + '"/>' +
        '<circle cx="40" cy="49" r="2.4" fill="none" stroke="' + s + '" stroke-width=".8" opacity=".6"/>' +
        '<circle cx="60" cy="52" r="2" fill="none" stroke="' + s + '" stroke-width=".8" opacity=".55"/>' +
        '<path d="M33 62 C38 58 44 58 48 62" stroke="' + s + '" stroke-width=".7" fill="none" opacity=".5"/>' +
        '<path d="M54 68 C59 65 64 65 68 68" stroke="' + s + '" stroke-width=".7" fill="none" opacity=".45"/>';
    } else {
      /* 黄连带 rootlet：簇生细根 */
      d = '<path d="M50 22 C50 40 46 60 40 84" stroke="' + s + '" stroke-width="2.4" fill="none" opacity=".6"/>' +
        '<path d="M50 22 C52 42 54 62 58 84" stroke="' + s + '" stroke-width="1.8" fill="none" opacity=".5"/>' +
        '<path d="M50 26 C42 34 34 52 30 76" stroke="' + s + '" stroke-width="1.6" fill="none" opacity=".45"/>' +
        '<path d="M50 26 C60 34 68 52 72 76" stroke="' + s + '" stroke-width="1.6" fill="none" opacity=".45"/>' +
        '<path d="M50 20 C50 16 50 14 50 11" stroke="' + s + '" stroke-width="1.6" fill="none" opacity=".7"/>' +
        '<path d="M38 60 H44 M56 54 H62 M46 74 H52" stroke="' + s + '" stroke-width=".7" opacity=".4"/>';
    }

    return '<svg class="tp-fig-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false">' + d + '</svg>';
  }

  /* ── 茶盏（透明轮廓 + 1px 细描边 + 底部基准线） ── */
  function vesselSVG(color) {
    var ink = deepen(color, 0.5);
    var soft = SP.hexA(deepen(color, 0.3), '.16');
    return '<svg class="tp-vessel-svg" viewBox="0 0 120 132" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="40" rx="43" ry="8" fill="' + soft + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M17 40 L24 100 Q25 114 40 114 L80 114 Q95 114 96 100 L103 40" fill="none" stroke="' + ink + '" stroke-opacity=".42" stroke-width="1"/>' +
      '<path d="M24 44 Q60 56 96 44" fill="none" stroke="' + ink + '" stroke-opacity=".3" stroke-width="1"/>' +
      '<path d="M10 114 H110" fill="none" stroke="' + ink + '" stroke-opacity=".34" stroke-width="1"/>' +
      '<path d="M98 58 H107 M96 80 H105 M94 100 H103" fill="none" stroke="' + ink + '" stroke-opacity=".26" stroke-width="1"/>' +
      '</svg>';
  }

  /* ── 标本台面装饰：极细基准线 + 刻度 + 轨道弧（克制，不越出容器） ── */
  function traceSVG(color) {
    var ink = deepen(color, 0.5);
    return '<svg class="tp-trace" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false">' +
      '<path d="M14 132 H306" stroke="' + ink + '" stroke-opacity=".16" stroke-width="1"/>' +
      '<path d="M40 128 V136 M120 128 V136 M200 128 V136 M280 128 V136" stroke="' + ink + '" stroke-opacity=".13" stroke-width="1"/>' +
      '<path d="M24 30 A120 120 0 0 1 296 30" stroke="' + ink + '" stroke-opacity=".12" stroke-width="1" fill="none" stroke-dasharray="2 7"/>' +
      '<circle cx="160" cy="132" r="1.5" fill="' + ink + '" opacity=".22"/>' +
      '<circle cx="40" cy="132" r="1.5" fill="' + ink + '" opacity=".18"/>' +
      '<circle cx="280" cy="132" r="1.5" fill="' + ink + '" opacity=".18"/>' +
      '</svg>';
  }

  /* ── 数据读取（只读；脏数据 → 降级，绝不白屏、绝不自行生成） ─────────── */

  /**
   * @returns {{bad:boolean, tea?:Object, mats?:Array, step?:number, chosen?:string, inTea?:Object}}
   */
  function readState() {
    var st = BC.store.get();
    if (!st) return { bad: true };

    /* P10 最终完成状态：selectedTea 是茶饮 id（字符串） */
    var teaId = st.selectedTea;
    if (!teaId || typeof teaId !== 'string') return { bad: true };

    var tea = BC.data.teaById[teaId];
    if (!tea) return { bad: true };
    if (!tea.materials || tea.materials.length !== MAT_TOTAL) return { bad: true };

    var mats = [];
    for (var i = 0; i < MAT_TOTAL; i++) {
      var m = tea.materials[i];
      if (!m || !m.herbId) return { bad: true };
      var herb = BC.data.herbById[m.herbId];
      if (!herb) return { bad: true };            // 无法解析 → 降级（不猜、不造）
      mats.push(herb);
    }

    /* teaIngredients 仅用于在列表中标记「已入杯」项（兼容对象 / 字符串） */
    var inTea = {};
    var raw = Array.isArray(st.teaIngredients) ? st.teaIngredients : [];
    for (var k = 0; k < raw.length; k++) {
      var e = raw[k];
      var hid = (typeof e === 'string') ? e : ((e && (e.herbId || e.id)) || '');
      if (hid) inTea[hid] = true;
    }

    var step = (typeof st.teaBrewStep === 'number') ? st.teaBrewStep : 0;

    return {
      bad: false, tea: tea, teaId: teaId, mats: mats,
      chosen: st.chosenHerb || '', step: step, inTea: inTea
    };
  }

  /* ── 描述（通用模板；现有数据没有 tea.description，故不擅自改数据结构） ── */
  function descOf(tea, mats) {
    var h1 = mats[0] ? mats[0].name : '';
    var h2 = mats[1] ? mats[1].name : '';
    return '「' + h1 + '」与「' + h2 + '」的植物意象交织，组成一杯属于本次探索的本草灵感饮。';
  }

  function flavorOf(tea) {
    var kws = (tea && tea.keywords) || [];
    if (!kws.length) return '';
    return kws.slice(0, 3).join(' · ');   /* 轻量「风味联想」：中点分隔，非标签云 */
  }

  /* ── 构图：卡片 ───────────────────────────────────────────── */

  function buildCard(s) {
    var tea = s.tea;
    var mats = s.mats;
    var color = tea.visual_color || BC.render.herbColor(mats[0].id);

    var card = U.el('div', 'tp-card');
    card.setAttribute('data-tea', tea.id);
    card.setAttribute('data-brew-step', String(s.step));
    if (s.chosen) card.setAttribute('data-chosen', s.chosen);

    /* ── 顶部：小号英文编号 + 主标题区 ── */
    var head = U.el('div', 'tp-head');
    head.appendChild(U.el('div', 'tp-idx en', STAGE_KEY));
    head.appendChild(U.el('div', 'tp-kicker', KICKER));
    head.appendChild(U.el('h1', 'tp-tea-name', tea.name));           // 动态茶饮名（大标题）
    head.appendChild(U.el('div', 'tp-herb-x', mats[0].name + ' × ' + mats[1].name));
    card.appendChild(head);

    /* ── 主视觉：茶盏 + 两味本草组合插画 + 图文标注 ── */
    var visual = U.el('div', 'tp-visual');
    visual.insertAdjacentHTML('beforeend', traceSVG(color));

    var vessel = U.el('div', 'tp-vessel');
    vessel.insertAdjacentHTML('beforeend', vesselSVG(color));
    visual.appendChild(vessel);

    /* 一味在左上、一味在右下；两者与茶盏形成前后遮挡（figB 在 figA 之前） */
    var figA = U.el('div', 'tp-fig tp-fig-a');
    figA.setAttribute('data-herb', mats[0].id);
    figA.setAttribute('data-role', 'A');
    figA.insertAdjacentHTML('beforeend', figureSVG(mats[0]));
    figA.appendChild(U.el('span', 'tp-fig-halo'));
    visual.appendChild(figA);

    var figB = U.el('div', 'tp-fig tp-fig-b');
    figB.setAttribute('data-herb', mats[1].id);
    figB.setAttribute('data-role', 'B');
    figB.insertAdjacentHTML('beforeend', figureSVG(mats[1]));
    figB.appendChild(U.el('span', 'tp-fig-halo'));
    visual.appendChild(figB);

    /* 图文标注（细线连接到对应本草插画；本页 2 个，≤ ANNOT_MAX） */
    visual.appendChild(buildAnnot(mats[0], 'A', 'tp-annot-a'));
    visual.appendChild(buildAnnot(mats[1], 'B', 'tp-annot-b'));

    card.appendChild(visual);

    /* ── 信息区：本草组成 + 风味联想（动态） ── */
    var info = U.el('div', 'tp-info');
    var infoHead = U.el('div', 'tp-info-head');
    infoHead.appendChild(U.el('span', 'tp-info-t', '本草组成'));
    infoHead.appendChild(U.el('span', 'tp-info-en en', 'COMPOSITION'));
    info.appendChild(infoHead);

    var list = U.el('div', 'tp-list');
    for (var i = 0; i < MAT_TOTAL; i++) {
      var herb = mats[i];
      var row = U.el('div', 'tp-item');
      row.setAttribute('data-herb', herb.id);
      if (s.inTea[herb.id]) row.setAttribute('data-in-tea', '1');
      row.appendChild(U.el('span', 'tp-item-n en', pad2(i + 1)));
      var mid = U.el('span', 'tp-item-m');
      mid.appendChild(U.el('span', 'tp-item-name', herb.name));
      mid.appendChild(U.el('span', 'tp-item-en en', enOf(herb.id)));
      row.appendChild(mid);
      var dot = U.el('span', 'tp-item-dot');
      dot.style.background = SP.hexA(BC.render.herbColor(herb.id), '.85');
      row.appendChild(dot);
      list.appendChild(row);
    }
    info.appendChild(list);

    var desc = U.el('p', 'tp-desc', descOf(tea, mats));
    info.appendChild(desc);

    var flavor = flavorOf(tea);
    if (flavor) {
      var fl = U.el('div', 'tp-flavor');
      fl.appendChild(U.el('span', 'tp-flavor-k en', 'FLAVOR NOTES'));
      fl.appendChild(U.el('span', 'tp-flavor-v', flavor));
      info.appendChild(fl);
    }

    card.appendChild(info);

    /* 卡片底部角标（标本馆语汇，纯装饰） */
    var plate = U.el('div', 'tp-plate en', 'DIGITAL HERBAL MUSEUM · ' + String(tea.id).toUpperCase());
    card.appendChild(plate);

    return card;
  }

  function buildAnnot(herb, role, cls) {
    var wrap = U.el('div', 'tp-annot ' + cls);
    wrap.setAttribute('data-herb', herb.id);
    wrap.setAttribute('data-role', role);
    wrap.appendChild(U.el('span', 'tp-annot-line'));
    var txt = U.el('span', 'tp-annot-tx');
    txt.appendChild(U.el('span', 'tp-annot-cn', herb.name));
    txt.appendChild(U.el('span', 'tp-annot-en en', enOf(herb.id)));
    wrap.appendChild(txt);
    return wrap;
  }

  /* ── 底部：保存入口 + 继续探索 ───────────────────────────── */

  function buildFoot() {
    var foot = U.el('div', 'page-foot tp-foot');

    var save = U.el('button', 'btn tp-save', '保存我的配方卡');
    save.setAttribute('type', 'button');
    U.onClick(save, function () { doSave(save); });
    foot.appendChild(save);

    var next = U.el('button', 'btn-ghost tp-next', '继续探索');
    next.setAttribute('type', 'button');
    U.onClick(next, function () { BC.router.go(12); });
    foot.appendChild(next);

    return foot;
  }

  /**
   * 保存入口：当前不引入登录 / 支付 / 后端 / 外部依赖，
   * 实现为「页面状态内可用的保存入口」——标记卡片为已保存 + 轻提示 + 长按保存引导。
   * 不写入任何 store 键（Store API 冻结，不新增字段）。
   */
  function doSave(btn) {
    var el = root();
    var card = el ? el.querySelector('.tp-card') : null;
    if (card) card.classList.add('is-saved');
    if (btn) {
      btn.classList.add('is-saved');
      U.setText(btn, '已保存');
    }
    var hint = el ? el.querySelector('.tp-save-hint') : null;
    if (hint) hint.hidden = false;
    saved = true;
    if (U.toast) U.toast('配方卡已保存到本次体验');
  }

  /* ── 降级视图（不白屏） ───────────────────────────────────── */

  function degradedView() {
    var wrap = U.el('div', 'tp tp-degraded');

    var card = U.el('div', 'tp-card tp-card-empty');
    card.appendChild(U.el('div', 'tp-idx en', STAGE_KEY));
    card.appendChild(U.el('div', 'tp-kicker', KICKER));

    var fig = U.el('div', 'tp-empty-fig');
    fig.innerHTML = BC.render.placeholderSVG('#8A9A7B', '草', 140);
    card.appendChild(fig);
    card.appendChild(U.el('p', 'tp-empty-msg', FALLBACK_MSG));
    wrap.appendChild(card);

    var foot = U.el('div', 'page-foot tp-foot');
    var btn = U.el('button', 'btn tp-save', FALLBACK_CTA);
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(10); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded() {
    var el = root();
    if (!el) return;
    busy = false;
    saved = false;
    clearTimers();
    el.innerHTML = '';
    el.appendChild(degradedView());
  }

  /* ── 入场编排（setTimeout 驱动；绝不等 animationend） ───────── */

  function reveal() {
    var el = root();
    if (!el) return;

    function q(sel) { return el.querySelector(sel); }
    var card = q('.tp-card');
    var nameEl = q('.tp-tea-name');
    var figA = q('.tp-fig-a');
    var figB = q('.tp-fig-b');
    var vessel = q('.tp-vessel');
    var annotA = q('.tp-annot-a');
    var annotB = q('.tp-annot-b');

    var all = [card, nameEl, figA, figB, vessel, annotA, annotB];

    function settle() {
      for (var i = 0; i < all.length; i++) {
        if (all[i]) all[i].classList.add('is-in');
      }
    }
    if (skipFx()) { settle(); return; }

    /* 图鉴展开：卡片 → 两味本草（异向进入）→ 茶盏 → 标注线 → 茶饮名（总时长 ~780ms） */
    if (card) timers.push(setTimeout(function () { card.classList.add('is-in'); }, T_CARD));
    if (figA) timers.push(setTimeout(function () { figA.classList.add('is-in'); }, T_FIG_A));
    if (figB) timers.push(setTimeout(function () { figB.classList.add('is-in'); }, T_FIG_B));
    if (vessel) timers.push(setTimeout(function () { vessel.classList.add('is-in'); }, T_VESSEL));
    if (annotA) timers.push(setTimeout(function () { annotA.classList.add('is-in'); }, T_ANNOT));
    if (annotB) timers.push(setTimeout(function () { annotB.classList.add('is-in'); }, T_ANNOT + 60));
    if (nameEl) timers.push(setTimeout(function () { nameEl.classList.add('is-in'); }, T_NAME));
    timers.push(setTimeout(settle, T_SETTLE));
  }

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
  }

  /* ── 页面模块 ─────────────────────────────────────────────── */

  var mod = {
    render: function () {
      var el = root();
      if (!el) return;

      clearTimers();
      busy = false;
      saved = false;

      try {
        el.innerHTML = '';
        var s = readState();
        if (s.bad) { showDegraded(); return; }

        var wrap = U.el('div', 'tp');
        wrap.appendChild(buildCard(s));

        var note = disclaimer();
        if (note) wrap.appendChild(U.el('p', 'tp-note', note));

        var hint = U.el('p', 'tp-save-hint', '长按配方卡可保存为图片');
        hint.hidden = true;
        wrap.appendChild(hint);

        wrap.appendChild(buildFoot());
        el.appendChild(wrap);
      } catch (e) {
        showDegraded();
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);            // 顶部右侧：CREATE / TEA FORMULA
      var el = root();
      if (!el || el.querySelector('.tp-degraded')) return;
      reveal();
    },

    leave: function () {
      clearTimers();
      busy = false;
    }
  };

  BC.pages = BC.pages || {};
  BC.pages.p11 = mod;

})(globalThis.BC);
