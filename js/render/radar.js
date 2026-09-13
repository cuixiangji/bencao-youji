/*!
 * render/radar.js —— 六维「身体观察画像」雷达渲染层（P09 专用，纯展示）
 *
 * 【定位】数字植物标本馆语汇下的「身体观察记录仪」：
 *   六边形细网格 + 细坐标线 + 六个维度节点 + 极淡轨道弧 + 数据点，
 *   数据区用当前探索主题色低透明度填充 + 细描边。
 *   刻意不出现：医疗器械界面 / 医院报告单 / 科技驾驶舱 / 复杂 BI 图表。
 *
 * 【严格只读展示 —— 本文件不实现任何算法】
 *   · 维度顺序 100% 取自 BC.data.rules.DIM_ORDER（气 / 血 / 阴 / 阳 / 湿 / 热），不另立顺序。
 *   · 维度文字取自 BC.data.rules.DIM_LABEL。
 *   · 半径只消费「已完成归一化的展示值」bodyScoresDisplay（D = 35 ~ 100）：
 *         r = R * (D / 100)
 *     与冻结稿 r = 0.35 + 0.65 * v、D = 35 + 65 * v 完全等价 —— 因此这里
 *     **不做归一化、不做钳制、不重算分数**；归一化一律来自 BC.logic.normalizeRadar。
 *   · 不读取 store，不写入任何状态；调用方（page09）把展示值传进来。
 *   · 界面上不出现任何原始分数数字（40 / 41 / 42 …）。仅供测试的
 *     data-d / data-dims 是机器可读钩子，不是可见文本。
 *
 * 【几何】viewBox 0 0 240 240，圆心 (120,120)，外环半径 R=78（0 号维度在正上方，顺时针每 60°）。
 *         所有装饰均落在 viewBox 内（最大描边/文字外扩 ≤ 216 < 240），不会产生横向溢出。
 *
 * 【生长动效】数据环描边路径带 .bc-radar-path（过渡样式在 css/animations.css）；
 *   初始 stroke-dashoffset = 周长（由 --bp-perim 变量给出），根节点加 .is-draw 后归零完成「画线」。
 *   lowPerf / reduced-motion / SKIP_ANIMATION 由页面直接加 .is-draw（终态），无过渡。
 */
(function (BC) {
  'use strict';

  var VIEW = 240;
  var CX = 120;
  var CY = 120;
  var R = 78;                                  // 数据最大半径（外层六边形）
  var LABEL_R = 94;                            // 维度文字半径（略在外环之外）
  var RINGS = [0.25, 0.5, 0.75, 1];            // 六边形网格环
  var START_DEG = -90;                         // 0 号维度（气）在正上方
  var STEP_DEG = 60;                           // 六等分
  var FALLBACK_DIMS = ['qi', 'xue', 'yin', 'yang', 'shi', 're'];
  var FALLBACK_LABEL = { qi: '气', xue: '血', yin: '阴', yang: '阳', shi: '湿', re: '热' };
  var FALLBACK_COLOR = '#8A9A7B';

  function rules() {
    try { return BC.data.rules || {}; } catch (e) { return {}; }
  }

  function dims() {
    var d = rules().DIM_ORDER;
    return (d && d.length === 6) ? d.slice() : FALLBACK_DIMS.slice();
  }

  function labelOf(dim) {
    var m = rules().DIM_LABEL || FALLBACK_LABEL;
    return m[dim] || FALLBACK_LABEL[dim] || '';
  }

  /** 极坐标点：0 号在正上方，顺时针递增 */
  function pt(i, radius) {
    var rad = (START_DEG + i * STEP_DEG) * Math.PI / 180;
    return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
  }

  function n(x) { return Math.round(x * 100) / 100; }

  /** 正六边形闭合路径 */
  function hexPath(radius) {
    var d = '';
    for (var i = 0; i < 6; i++) {
      var p = pt(i, radius);
      d += (i ? 'L' : 'M') + n(p.x) + ' ' + n(p.y) + ' ';
    }
    return d + 'Z';
  }

  /** #RRGGBB → rgba()（沿用 specimen.hexA，规避旧 X5 不支持 8 位 hex） */
  function hexA(hex, alpha) {
    if (BC.render && BC.render.specimen && BC.render.specimen.hexA) {
      return BC.render.specimen.hexA(hex, alpha);
    }
    var h = String(hex || '').replace('#', '');
    var v = (h.length === 6) ? parseInt(h, 16) : NaN;
    if (isNaN(v)) return 'rgba(138,154,123,' + alpha + ')';
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + alpha + ')';
  }

  /**
   * 取展示值 D（35~100）。只认 bodyScoresDisplay；缺失/非法时退回本条维度的下限线索，
   * 不做任何数学变换（保证「不在渲染层重算算法」）。
   */
  function displayOf(display, dim) {
    var v = display && display[dim];
    return (typeof v === 'number' && isFinite(v)) ? v : 0;
  }

  /**
   * 生成雷达 SVG 字符串（纯函数，不写 DOM）
   * @param {Object} display bodyScoresDisplay（{dim: D}）
   * @param {Object} [opts] { color, label }
   * @returns {string} SVG 字符串
   */
  function svg(display, opts) {
    var o = opts || {};
    var color = o.color || FALLBACK_COLOR;
    var ds = dims();
    var i;

    /* ── 数据点（半径 = R * D/100；D 来自既有归一化结果） ── */
    var pts = [];
    var perim = 0;
    for (i = 0; i < 6; i++) {
      var d = displayOf(display, ds[i]);
      var v = d / 100;
      if (v < 0) v = 0;
      if (v > 1) v = 1;
      pts.push(pt(i, R * v));
    }
    for (i = 0; i < 6; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % 6];
      perim += Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    }
    perim = Math.ceil(perim) + 2;

    var dataPath = '';
    for (i = 0; i < 6; i++) {
      dataPath += (i ? 'L' : 'M') + n(pts[i].x) + ' ' + n(pts[i].y) + ' ';
    }
    dataPath += 'Z';

    /* ── 极淡轨道弧（装饰，落在 viewBox 内） ── */
    var rr = R + 9;
    var oa = pt2(-104, rr);
    var ob = pt2(104, rr);
    var orbit = 'M' + n(oa.x) + ' ' + n(oa.y) + ' A' + n(rr) + ' ' + n(rr) + ' 0 0 1 ' + n(ob.x) + ' ' + n(ob.y);

    var s = '';
    s += '<svg class="bp-radar" data-dims="' + ds.join(',') + '"' +
      ' viewBox="0 0 ' + VIEW + ' ' + VIEW + '" preserveAspectRatio="xMidYMid meet"' +
      ' role="img" aria-label="六维身体观察画像"' +
      ' focusable="false">';

    /* 网格：六边形细环 */
    s += '<g class="bp-grid" aria-hidden="true">';
    for (i = 0; i < RINGS.length; i++) {
      s += '<path class="bp-ring" d="' + hexPath(R * RINGS[i]) + '"/>';
    }
    /* 细坐标线：圆心 → 六个顶点 */
    for (i = 0; i < 6; i++) {
      var p = pt(i, R);
      s += '<path class="bp-axis" d="M' + CX + ' ' + CY + 'L' + n(p.x) + ' ' + n(p.y) + '"/>';
    }
    /* 极淡轨道弧 */
    s += '<path class="bp-orbit" d="' + orbit + '"/>';
    s += '</g>';

    /* 数据区：低透明度本草主题色填充（生长时淡入） */
    s += '<path class="bp-data-fill" d="' + dataPath + '" fill="' + hexA(color, '.16') +
      '" stroke="none"/>';

    /* 数据区描边：以周长做 dasharray 的「画线」生长 */
    s += '<path class="bp-data-line bc-radar-path" d="' + dataPath + '"' +
      ' fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linejoin="round"' +
      ' stroke-dasharray="' + perim + '" style="--bp-perim:' + perim + '"/>';

    /* 六个维度节点（外环顶点，极淡） */
    for (i = 0; i < 6; i++) {
      var q = pt(i, R);
      s += '<circle class="bp-node" cx="' + n(q.x) + '" cy="' + n(q.y) + '" r="1.5"/>';
    }

    /* 数据点（每个维度一个，随生长淡入；data-d 仅供测试读取，非可见文本） */
    for (i = 0; i < 6; i++) {
      s += '<circle class="bp-node-data" data-dim="' + ds[i] + '" data-d="' +
        Math.round(displayOf(display, ds[i])) + '" cx="' + n(pts[i].x) + '" cy="' + n(pts[i].y) +
        '" r="1.9" fill="' + color + '"/>';
    }

    /* 圆心：极淡本草色（标本台面上的定位点） */
    s += '<circle class="bp-center" cx="' + CX + '" cy="' + CY + '" r="2.2" fill="' + hexA(color, '.55') + '"/>';

    /* 六个维度文字（气 / 血 / 阴 / 阳 / 湿 / 热 —— 顺序即 DIM_ORDER） */
    for (i = 0; i < 6; i++) {
      var t = pt(i, LABEL_R);
      var anchor = 'middle';
      if (i === 1 || i === 2) anchor = 'start';
      if (i === 4 || i === 5) anchor = 'end';
      s += '<text class="bp-axis-label" data-dim="' + ds[i] + '" data-i="' + i + '"' +
        ' x="' + n(t.x) + '" y="' + n(t.y + 4) + '" text-anchor="' + anchor + '"' +
        ' font-size="11" fill="#B9B2A5">' + labelOf(ds[i]) + '</text>';
    }

    s += '</svg>';
    return s;
  }

  /** 任意角度极坐标（供装饰弧使用）；角度制，0° 指向右侧、顺时针为正（SVG 坐标系） */
  function pt2(deg, radius) {
    var rad = deg * Math.PI / 180;
    return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
  }

  BC.render = BC.render || {};
  BC.render.radar = {
    svg: svg,
    R: R,
    VIEW: VIEW,
    RINGS: RINGS.slice()
  };

})(globalThis.BC);
