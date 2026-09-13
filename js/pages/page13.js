/*!
 * js/pages/page13.js —— PAGE13 分享与保存（MY HERBAL JOURNEY · 本草探索成果卡 / 项目最终页）
 *
 * 定位（13 屏连续叙事的终点）：
 *   P12 我的本草探索档案（保存 archiveData + router.go(13)）→ **P13 分享与保存（成果卡结算）**
 * 关键词：MY HERBAL JOURNEY / 本草探索成果卡 / 数字植物标本 / 旅程收束与留念
 *
 * 【本页不是】医学诊断 / 体质诊断 / 健康结论 / 治疗 / 功效保证；
 * 【本页不出现】「你属于某某体质」「治疗」「改善疾病」「功效保证」；
 * 【本页使用】「探索型 / 探索轨迹 / 成果卡 / 专属茶饮 / 观察记录」语汇。
 *
 * 【数据读取（严格只读，绝不重算、绝不重建）】
 *   唯一来源：BC.store.get('archiveData') —— P12「保存我的探索档案」写入的冻结快照。
 *   读取：arch.archiveNo / arch.createdAt / arch.typeName / arch.typeKeywords /
 *         arch.radar / arch.herbs（3 味）/ arch.teaName / arch.teaMaterialsText /
 *         arch.teaVisualColor / arch.teaId。
 *   缺失 / 无 teaName → 降级视图（不白屏、不自造内容），入口返回 P12。
 *
 * 【分享图实现（不依赖 html2canvas / 不新增任何依赖）】
 *   独立 SVG 成果卡（1080×1440，自包含 <style>，不引用外部资源）→
 *   dataURL → new Image() → Canvas 2D 绘制 → toDataURL('image/png')。
 *   生成失败逐级降级：PNG → 直接展示 SVG 图（<img> 可渲染）→ 文案提示，绝不白屏。
 *   雷达复用 BC.render.radar.svg()（只读消费展示值），通过注入 x/y/width/height 与
 *   自包含 <style> 使其在 <img> 加载的 SVG 内正常显示（外部页面 CSS 不会生效）。
 *
 * 【外部操作】
 *   生成分享图（主） / 保存图片（download 属性可用时触发，微信 / iOS 一律长按保存）/
 *   重新探索（BC.store.reset() + BC.router.replace(1)，与 P12 同一机制）/
 *   分享我的成果（仅 navigator.share 可用时出现，BC.compat.share 探测）。
 *
 * 复用：BC.store / BC.router / BC.compat / BC.fx / BC.utils（el / onClick / setText / toast）/
 *       BC.render.specimen（hexA / mountFigure / setStageLabel）/ BC.render.radar /
 *       BC.render.placeholderSVG / BC.data（teaById 只读查色点）/ .btn / .btn-ghost / .tag / .en。
 * 未复制 P01–P12 的页面代码；未修改 Router 核心 / Store API / Logic 核心算法 / 数据规则。
 */
(function (BC) {
  'use strict';

  var U = BC.utils;
  var SP = BC.render.specimen;          // hexA / mountFigure / setStageLabel

  var PAGE_ID = 'page-13';
  var LABEL = 'MY HERBAL JOURNEY';      // 顶部右侧页标（与 index.js titles[13] 一致）

  /* 入场节奏（总时长 ≈ 860ms，落在 600–900ms 区间内）；
     只影响观感，lowPerf / reduced / SKIP_ANIMATION 一律直接终态 */
  var T_HEAD = 60;                      // 卡头（眉标 + 标题 + 编号）
  var T_TYPE = 240;                     // 探索型
  var T_RADAR = 400;                    // 六维雷达
  var T_HERB = 520;                     // 三味本草首个
  var T_HERB_STEP = 80;                 // 三味逐个间隔
  var T_TEA = 700;                      // 专属茶饮
  var T_CLOSE = 820;                    // 结语 + 落款
  var T_OPS = 860;                      // 操作区
  var T_SETTLE = 920;                   // 终态兜底

  /* 分享图尺寸（冻结：1080 × 1440） */
  var SHARE_W = 1080;
  var SHARE_H = 1440;

  var timers = [];
  var archNow = null;                   // 当前渲染所用的档案快照（只读）
  var shareImgSrc = '';                 // 最近一次生成的图片（PNG dataURL 优先）

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

  /* createdAt（ms 时间戳）→ 展示串；缺失 → 空（不硬编码日期） */
  function fmtDate(ts) {
    if (!ts || typeof ts !== 'number') return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) +
      '  ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ── 数据读取（只读冻结快照；缺失 → 降级，绝不白屏、绝不重建） ─────────── */

  /**
   * @returns {{bad:boolean, arch?:Object}}
   */
  function readState() {
    var st = null;
    try { st = BC.store.get(); } catch (e) { return { bad: true }; }
    if (!st) return { bad: true };

    var arch = st.archiveData;
    if (!arch || typeof arch !== 'object') return { bad: true };
    if (!arch.teaName || !arch.archiveNo) return { bad: true };
    if (!arch.herbs || arch.herbs.length !== 3) return { bad: true };
    if (!arch.radar || typeof arch.radar !== 'object') return { bad: true };

    return { bad: false, arch: arch };
  }

  /* ── 小型茶盏（透明轮廓 + 1px 细描边 + 底部基准线，语汇与 P11/P12 一致） ── */
  function vesselSVG(color) {
    var ink = color || '#8A9A7B';
    return '<svg class="jc-vessel-svg" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" ' +
      'aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="34" rx="40" ry="7" fill="' + SP.hexA(ink, '.14') + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M20 34 L27 94 Q28 108 42 108 L78 108 Q92 108 93 94 L100 34" fill="none" stroke="' + ink + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M27 38 Q60 50 93 38" fill="none" stroke="' + ink + '" stroke-opacity=".32" stroke-width="1"/>' +
      '<path d="M12 108 H108" fill="none" stroke="' + ink + '" stroke-opacity=".34" stroke-width="1"/>' +
      '</svg>';
  }

  /* ── 成果卡 DOM ───────────────────────────────────────────── */

  /* 卡头：MY HERBAL JOURNEY / 我的本草探索成果 / 档案编号 + 创建时间 */
  function buildCardHead(arch) {
    var head = U.el('div', 'jc-head jc-block');

    head.appendChild(U.el('div', 'jc-eyebrow en', 'MY HERBAL JOURNEY'));
    head.appendChild(U.el('h1', 'jc-title', '我的本草探索成果'));

    var no = U.el('div', 'jc-no');
    no.appendChild(U.el('span', 'jc-no-id en', arch.archiveNo || ''));
    var dateStr = fmtDate(arch.createdAt);
    if (dateStr) no.appendChild(U.el('span', 'jc-no-date en', dateStr));
    head.appendChild(no);

    return head;
  }

  /* 我的探索型 + 关键词（探索语汇，非体质 / 诊断 / 医学结论） */
  function buildType(arch) {
    var box = U.el('div', 'jc-type jc-block');

    box.appendChild(U.el('div', 'jc-sec-k en', 'EXPLORATION TYPE'));
    box.appendChild(U.el('div', 'jc-type-name', arch.typeName || ''));

    var kws = U.el('div', 'jc-type-kws');
    var list = Array.isArray(arch.typeKeywords) ? arch.typeKeywords : [];
    for (var i = 0; i < list.length; i++) kws.appendChild(U.el('span', 'tag', list[i]));
    if (list.length) box.appendChild(kws);

    return box;
  }

  /* 六维探索图（复用 radar.svg，尺寸小于 P12：180–210px） */
  function buildRadar(arch) {
    var wrap = U.el('div', 'jc-radar-wrap jc-block');
    var box = U.el('div', 'jc-radar-box');
    try {
      box.innerHTML = BC.render.radar.svg(arch.radar, {
        color: arch.teaVisualColor || '#8A9A7B',
        label: '气血阴阳湿热'
      });
    } catch (e) { box.innerHTML = ''; }
    wrap.appendChild(box);
    wrap.appendChild(U.el('div', 'jc-radar-cap en', '六维观察 · SIX DIMENSIONS'));
    return wrap;
  }

  /* 我的三味本草（标本陈列：横向三列，复用 specimen 渲染机制） */
  function herbField(herb) {
    var prop = (herb.property || '') + (herb.taste ? ' · ' + herb.taste : '');
    if (prop) return '性味 · ' + prop;
    if (herb.origin) return '产地 · ' + herb.origin;
    return '';
  }

  function buildHerbs(arch) {
    var sec = U.el('div', 'jc-sec');
    var head = U.el('div', 'jc-sec-head');
    head.appendChild(U.el('h2', 'jc-sec-t', '我的三味本草'));
    head.appendChild(U.el('span', 'jc-sec-en en', 'MY HERBS'));
    sec.appendChild(head);

    var row = U.el('div', 'jc-herb-row');
    var herbs = arch.herbs || [];
    for (var i = 0; i < herbs.length; i++) {
      var herb = herbs[i];
      var card = U.el('div', 'jc-herb jc-block');
      card.setAttribute('data-herb', herb.id);
      card.setAttribute('data-order', pad2(i + 1));
      try { card.style.setProperty('--jc-herb', herb.color || herbColor(herb.id)); } catch (e) { /* ignore */ }

      card.appendChild(U.el('div', 'jc-herb-no en', pad2(i + 1)));

      var fig = U.el('div', 'jc-herb-fig');
      var halo = U.el('div', 'jc-herb-halo');
      var hc = herb.color || herbColor(herb.id);
      halo.style.background = 'radial-gradient(circle, ' + SP.hexA(hc, '.26') + ' 0%, ' +
        SP.hexA(hc, '.09') + ' 52%, rgba(242,238,229,0) 78%)';
      fig.appendChild(halo);
      var img = U.el('div', 'jc-herb-img');
      fig.appendChild(img);
      SP.mountFigure(img, herb, 64);     // webp → svg → placeholderSVG（沿用既有机制）
      card.appendChild(fig);

      card.appendChild(U.el('div', 'jc-herb-name', herb.name || ''));
      if (herb.latin) card.appendChild(U.el('div', 'jc-herb-latin en', herb.latin));

      var field = herbField(herb);
      if (field) card.appendChild(U.el('div', 'jc-herb-field', field));

      row.appendChild(card);
    }
    sec.appendChild(row);
    return sec;
  }

  /* 我的专属茶饮（MY TEA FORMULA + 茶名 + 组成 + 小茶盏 + 两味色点） */
  function buildTea(arch) {
    var sec = U.el('div', 'jc-sec');
    var head = U.el('div', 'jc-sec-head');
    head.appendChild(U.el('h2', 'jc-sec-t', '我的专属茶饮'));
    head.appendChild(U.el('span', 'jc-sec-en en', 'MY TEA FORMULA'));
    sec.appendChild(head);

    var card = U.el('div', 'jc-tea jc-block');
    try { card.style.setProperty('--jc-tea', arch.teaVisualColor || '#8A9A7B'); } catch (e) { /* ignore */ }

    var top = U.el('div', 'jc-tea-top');
    var vessel = U.el('div', 'jc-tea-vessel');
    vessel.insertAdjacentHTML('beforeend', vesselSVG(arch.teaVisualColor));
    top.appendChild(vessel);

    /* 两味本草色点：只读查既有 teaById（与 P12 同一取法），缺失则不出现 */
    var dots = U.el('div', 'jc-tea-dots');
    var tea = (arch.teaId && BC.data.teaById && BC.data.teaById[arch.teaId]) || null;
    var mats = tea ? (tea.materials || []) : [];
    for (var i = 0; i < mats.length && i < 2; i++) {
      var dot = U.el('span', 'jc-tea-dot');
      dot.style.background = herbColor(mats[i].herbId);
      dots.appendChild(dot);
    }
    top.appendChild(dots);
    card.appendChild(top);

    card.appendChild(U.el('div', 'jc-tea-name', arch.teaName || ''));
    if (arch.teaMaterialsText) {
      card.appendChild(U.el('div', 'jc-tea-mats', arch.teaMaterialsText));
    }

    sec.appendChild(card);
    return sec;
  }

  /* 成果卡底部：结语 + 本草有迹落款 + 统一免责小字 */
  function buildClosing(arch) {
    var box = U.el('div', 'jc-close jc-block');

    box.appendChild(U.el('p', 'jc-close-p',
      '这份成果来自你一步步的观察与选择，愿这缕草木气息陪你记得这段旅程。'));
    box.appendChild(U.el('div', 'jc-sign en', '本草有迹 · HERBAL TRACES'));

    var note = disclaimer();
    if (note) box.appendChild(U.el('p', 'jc-note', note));

    return box;
  }

  /* ── 外部操作区（常规文档流，非固定底栏：成果卡与按钮同页滚动，无遮挡问题） ── */
  function buildOps() {
    var ops = U.el('div', 'jc-ops jc-block');

    var gen = U.el('button', 'btn jc-gen', '生成分享图');
    gen.setAttribute('type', 'button');
    U.onClick(gen, function () { doGen(gen); });
    ops.appendChild(gen);

    var save = U.el('button', 'btn-ghost jc-save', '保存图片');
    save.setAttribute('type', 'button');
    U.onClick(save, function () { doSave(save); });
    ops.appendChild(save);

    var restart = U.el('button', 'btn-ghost jc-restart', '重新探索');
    restart.setAttribute('type', 'button');
    U.onClick(restart, function () { doRestart(); });
    ops.appendChild(restart);

    /* 系统分享增强：仅 navigator.share 可用时出现（BC.compat.share 启动时已探测） */
    var canShare = false;
    try { canShare = !!(BC.compat && BC.compat.share); } catch (e) { canShare = false; }
    if (canShare) {
      var sys = U.el('button', 'btn-ghost jc-sys', '分享我的成果');
      sys.setAttribute('type', 'button');
      U.onClick(sys, function () { doSysShare(); });
      ops.appendChild(sys);
    }

    return ops;
  }

  /* ── 分享图浮层（固定层，挂 .page 直下，避免被入场 transform 捕获） ── */
  function buildMask() {
    var mask = U.el('div', 'jc-mask');
    mask.setAttribute('role', 'dialog');
    mask.setAttribute('aria-label', '本草探索成果图');

    var inner = U.el('div', 'jc-share');

    var x = U.el('button', 'jc-share-x');
    x.setAttribute('type', 'button');
    x.setAttribute('aria-label', '关闭');
    x.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F2EEE5" ' +
      'stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>';
    U.onClick(x, function () { closeMask(); });
    inner.appendChild(x);

    inner.appendChild(U.el('div', 'jc-share-t', '你的本草探索成果图已生成'));
    var imgWrap = U.el('div', 'jc-share-imgw');
    var img = U.el('img', 'jc-share-img');
    img.setAttribute('alt', '本草探索成果图');
    imgWrap.appendChild(img);
    inner.appendChild(imgWrap);
    inner.appendChild(U.el('div', 'jc-share-hint', '长按图片保存到相册'));
    inner.appendChild(U.el('div', 'jc-share-hint2', '生成失败时会展示矢量卡片图，同样可以长按保存'));

    mask.appendChild(inner);
    U.onClick(mask, function (ev) {
      var t = ev && ev.target;
      if (t && t.classList && t.classList.contains('jc-mask')) closeMask();
    });

    return { mask: mask, img: img };
  }

  /* ── 分享图：独立自包含 SVG（1080×1440，可脱离页面样式独立渲染） ── */

  /** XML 文本转义（成果卡内文字一律经过转义，保证 Blob/dataURL 解析稳定） */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /* 分享卡配色：暖米白纸面 + 深棕墨色（与 P12 专属茶饮卡同一色系） */
  var C_PAPER = '#F2EEE5';
  var C_INK = '#3A332B';      // 主标题
  var C_SUB = '#5B4638';      // 区块 / 结构线
  var C_MUTE = '#8A7F6F';     // 次要文字
  var C_FAINT = '#A29886';    // 眉标 / 弱说明
  var C_DARK = '#0C0B09';     // 外围底色

  /** 简约叶片（闭合双弧 + 中脉），自包含矢量，不引用外部资源 */
  function leaf(cx, cy, r, color) {
    var w = r * 0.62;
    return '<g stroke="' + color + '" stroke-opacity=".62" stroke-width="1.5" fill="none">' +
      '<path d="M' + cx + ' ' + (cy - r) + ' C' + (cx + w) + ' ' + (cy - r * 0.42) + ' ' + (cx + w) + ' ' + (cy + r * 0.42) + ' ' + cx + ' ' + (cy + r) +
      ' C' + (cx - w) + ' ' + (cy + r * 0.42) + ' ' + (cx - w) + ' ' + (cy - r * 0.42) + ' ' + cx + ' ' + (cy - r) + ' Z"/>' +
      '<path d="M' + cx + ' ' + (cy - r * 0.72) + ' L' + cx + ' ' + (cy + r * 0.72) + '" stroke-opacity=".4"/>' +
      '</g>';
  }

  /**
   * 生成独立分享卡 SVG 字符串（纯函数，不写 DOM；_buildShareSVG 供测试读取）
   * 1080×1440：暗底 + 居中暖米白成果卡 + 自包含 <style>（雷达网格 / 文字色在此定义，
   * <img> 加载的 SVG 不继承页面 CSS，必须全部内联）。
   */
  function buildShareSVG(arch) {
    if (!arch || !arch.teaName) return '';
    var accent = arch.teaVisualColor || '#8A9A7B';
    var dateStr = fmtDate(arch.createdAt);
    var noLine = esc(arch.archiveNo || '') + (dateStr ? '　·　' + esc(dateStr) : '');
    var kwLine = (Array.isArray(arch.typeKeywords) ? arch.typeKeywords : []).join(' · ');

    /* 雷达：复用 radar.svg，注入嵌套视口；外部 CSS 不生效 → 自包含 <style> 补齐网格色 */
    var radar = '';
    try {
      radar = BC.render.radar.svg(arch.radar, { color: accent, label: '气血阴阳湿热' })
        .replace('<svg ', '<svg x="375" y="515" width="330" height="330" ');
    } catch (e) { radar = ''; }

    /* 三味本草：叶片纹样 + 名称 + 拉丁（自包含矢量，不引用外部图片） */
    var herbs = arch.herbs || [];
    var herbCols = [300, 540, 780];
    var herbSvg = '';
    for (var i = 0; i < herbs.length && i < 3; i++) {
      var h = herbs[i];
      var hc = h.color || '#8A9A7B';
      var cx = herbCols[i];
      herbSvg += '<circle cx="' + cx + '" cy="1036" r="52" fill="' + SP.hexA(hc, '.10') + '" stroke="' + hc + '" stroke-opacity=".4" stroke-width="1"/>' +
        leaf(cx, 1036, 30, hc) +
        '<text x="' + cx + '" y="1122" text-anchor="middle" font-size="27" fill="' + C_INK + '" letter-spacing="2">' + esc(h.name || '') + '</text>' +
        '<text x="' + cx + '" y="1152" text-anchor="middle" font-size="17" font-style="italic" fill="' + C_MUTE + '">' + esc(h.latin || '') + '</text>';
    }

    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="' + SHARE_W + '" height="' + SHARE_H + '" ' +
      'viewBox="0 0 ' + SHARE_W + ' ' + SHARE_H + '" font-family="PingFang SC, HarmonyOS Sans SC, MiSans, Source Han Sans CN, Noto Sans CJK SC, Microsoft YaHei, sans-serif">';
    s += '<style>' +
      '.bp-ring{fill:none;stroke:#5B4638;stroke-opacity:.14;stroke-width:1}' +
      '.bp-axis{stroke:#5B4638;stroke-opacity:.16;stroke-width:1}' +
      '.bp-orbit{fill:none;stroke:#5B4638;stroke-opacity:.2;stroke-width:1;stroke-dasharray:1 5;stroke-linecap:round}' +
      '.bp-node{fill:#5B4638;fill-opacity:.3}' +
      '.bp-axis-label{fill:#8A7F6F;font-family:PingFang SC, HarmonyOS Sans SC, Microsoft YaHei, sans-serif}' +
      '.bp-data-fill{opacity:1}' +
      '.bp-node-data{opacity:1}' +
      '.bp-data-line{stroke-dashoffset:0}' +
      '</style>';

    /* 暗底 + 纸面成果卡 */
    s += '<rect width="' + SHARE_W + '" height="' + SHARE_H + '" fill="' + C_DARK + '"/>';
    s += '<rect x="54" y="48" width="972" height="1344" rx="44" fill="' + C_PAPER + '"/>';
    s += '<rect x="80" y="74" width="920" height="1292" rx="30" fill="none" stroke="' + C_SUB + '" stroke-opacity=".16" stroke-width="1"/>';
    /* 纸面极淡装饰（克制的圆环，标本记录纸语汇） */
    s += '<circle cx="880" cy="196" r="130" fill="none" stroke="' + C_SUB + '" stroke-opacity=".06" stroke-width="1"/>';
    s += '<circle cx="168" cy="1256" r="104" fill="none" stroke="' + C_SUB + '" stroke-opacity=".05" stroke-width="1"/>';

    /* 卡头 */
    s += '<text x="540" y="166" text-anchor="middle" font-size="24" letter-spacing="7" fill="' + C_FAINT + '">MY HERBAL JOURNEY</text>';
    s += '<text x="540" y="230" text-anchor="middle" font-size="54" font-weight="500" letter-spacing="9" fill="' + C_INK + '">我的本草探索成果</text>';
    s += '<text x="540" y="288" text-anchor="middle" font-size="24" letter-spacing="3" fill="' + C_MUTE + '">' + noLine + '</text>';
    s += '<path d="M150 326 H930" stroke="' + C_SUB + '" stroke-opacity=".15" stroke-width="1"/>';

    /* 探索型 */
    s += '<text x="540" y="382" text-anchor="middle" font-size="20" letter-spacing="7" fill="' + C_FAINT + '">EXPLORATION TYPE</text>';
    s += '<text x="540" y="438" text-anchor="middle" font-size="46" font-weight="500" letter-spacing="5" fill="' + C_INK + '">' + esc(arch.typeName || '') + '</text>';
    if (kwLine) {
      s += '<text x="540" y="488" text-anchor="middle" font-size="24" letter-spacing="2" fill="' + C_MUTE + '">' + esc(kwLine) + '</text>';
    }

    /* 六维雷达（复用既有渲染，注入自包含样式） */
    if (radar) s += radar;
    s += '<text x="540" y="876" text-anchor="middle" font-size="19" letter-spacing="5" fill="' + C_FAINT + '">六维观察 · SIX DIMENSIONS</text>';
    s += '<path d="M150 912 H930" stroke="' + C_SUB + '" stroke-opacity=".15" stroke-width="1"/>';

    /* 我的三味本草 */
    s += '<text x="540" y="962" text-anchor="middle" font-size="27" letter-spacing="4" fill="' + C_SUB + '">我的三味本草 · MY HERBS</text>';
    s += herbSvg;

    /* 我的专属茶饮 */
    s += '<text x="540" y="1202" text-anchor="middle" font-size="20" letter-spacing="7" fill="' + C_FAINT + '">MY TEA FORMULA</text>';
    s += '<text x="540" y="1250" text-anchor="middle" font-size="40" font-weight="500" letter-spacing="4" fill="' + C_INK + '">' + esc(arch.teaName || '') + '</text>';
    if (arch.teaMaterialsText) {
      s += '<text x="540" y="1290" text-anchor="middle" font-size="23" letter-spacing="2" fill="' + C_MUTE + '">' + esc(arch.teaMaterialsText) + '</text>';
    }
    s += '<path d="M150 1318 H930" stroke="' + C_SUB + '" stroke-opacity=".15" stroke-width="1"/>';

    /* 结语 + 本草有迹落款 */
    s += '<text x="540" y="1350" text-anchor="middle" font-size="21" letter-spacing="2" fill="' + C_SUB + '">愿这缕草木气息，陪你记得这段旅程</text>';
    s += '<text x="540" y="1378" text-anchor="middle" font-size="17" letter-spacing="5" fill="' + C_FAINT + '">本草有迹 · HERBAL TRACES</text>';

    /* 卡外暗底统一免责小字 */
    var note = disclaimer();
    if (note) {
      s += '<text x="540" y="1424" text-anchor="middle" font-size="16" letter-spacing="1" fill="#81796C">' + esc(note) + '</text>';
    }

    s += '</svg>';
    return s;
  }

  /** SVG 字符串 → dataURL（encodeURIComponent 规避 Blob URL 兼容差异） */
  function svgDataUrl(svgStr) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }

  /**
   * SVG → Image → Canvas → PNG dataURL（BC.compat.canvas 已在启动时探测）。
   * 任何一步失败都回调 ''，由调用方降级为直接展示 SVG 图。
   */
  function rasterSVG(svgStr, cb) {
    if (!svgStr || !BC.compat || !BC.compat.canvas) { cb(''); return; }
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = SHARE_W;
          c.height = SHARE_H;
          var ctx = c.getContext('2d');
          if (!ctx) { cb(''); return; }
          ctx.drawImage(img, 0, 0, SHARE_W, SHARE_H);
          cb(c.toDataURL('image/png'));
        } catch (e) { cb(''); }
      };
      img.onerror = function () { cb(''); };
      img.src = svgDataUrl(svgStr);
    } catch (e) { cb(''); }
  }

  /* ── 浮层开关 ── */
  var maskRef = null;

  function openMask() {
    if (!maskRef) return;
    try { maskRef.img.setAttribute('src', shareImgSrc); } catch (e) { /* ignore */ }
    maskRef.mask.classList.add('is-open');
  }

  function closeMask() {
    if (!maskRef) return;
    maskRef.mask.classList.remove('is-open');
  }

  /* ── 动作：生成分享图 ── */
  function doGen(btn) {
    if (!archNow) return;
    var prevText = '生成分享图';
    if (btn) { btn.disabled = true; U.setText(btn, '生成中…'); }

    var svgStr = '';
    try { svgStr = buildShareSVG(archNow); } catch (e) { svgStr = ''; }
    if (!svgStr) {
      if (btn) { btn.disabled = false; U.setText(btn, prevText); }
      if (U.toast) U.toast('暂时无法生成，请稍后再试');
      return;
    }

    rasterSVG(svgStr, function (png) {
      if (btn) { btn.disabled = false; U.setText(btn, prevText); }
      shareImgSrc = png || svgDataUrl(svgStr);   // PNG 失败 → 直接展示矢量卡（同样可长按）
      openMask();
      if (U.toast) U.toast('你的本草探索成果图已生成');
    });
  }

  /* ── 动作：保存图片（download 可用则触发；微信 / iOS 一律长按保存，绝不白屏） ──
     BC_TEST_NO_DL：测试钩子（无头环境 pending download 会卡住 virtual-time，
     探针页置 true 时跳过真实下载、直接走「展示图片 + 长按保存」路径；真机不受影响） */
  function doSave(btn) {
    var testNoDl = false;
    try { testNoDl = window.BC_TEST_NO_DL === true; } catch (e) { testNoDl = false; }

    function deliver(src) {
      if (!src) {
        if (U.toast) U.toast('暂时无法保存，请稍后再试');
        return;
      }
      var c = BC.compat || {};
      var a = document.createElement('a');
      var canDownload = ('download' in a) && !c.isWeChat && !c.isIOS && !testNoDl;
      if (canDownload) {
        try {
          a.href = src;
          a.download = 'bencao-journey-' + ((archNow && archNow.archiveNo) || 'card').replace(/\s+/g, '') + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (U.toast) U.toast('已开始保存，若未弹出请长按图片保存');
          if (c.isIOS) openMask();       // iOS download 行为不可靠 → 直接给出长按路径
        } catch (e) {
          openMask();
        }
      } else {
        openMask();                       // 微信内置 / 旧内核 → 展示图片引导长按
      }
    }

    if (shareImgSrc) { deliver(shareImgSrc); return; }

    var svgStr = '';
    try { svgStr = buildShareSVG(archNow); } catch (e) { svgStr = ''; }
    if (!svgStr) {
      if (U.toast) U.toast('暂时无法保存，请稍后再试');
      return;
    }
    rasterSVG(svgStr, function (png) {
      shareImgSrc = png || svgDataUrl(svgStr);
      deliver(shareImgSrc);
    });
  }

  /* ── 动作：系统分享增强（仅 navigator.share 可用时绑定的按钮会调用） ── */
  function doSysShare() {
    try {
      var r = navigator.share({
        title: '本草有迹',
        text: '我的本草探索成果 · ' + ((archNow && archNow.typeName) || '')
      });
      if (r && typeof r.catch === 'function') r.catch(function () { /* 用户取消等，忽略 */ });
    } catch (e) { /* ignore */ }
  }

  /* ── 动作：重新探索（沿用项目已有重新开始逻辑，与 P12 / BC.debug.reset 同一机制） ── */
  function doRestart() {
    try { BC.store.reset(); } catch (e) { /* ignore */ }
    try { BC.router.replace(1); } catch (e) { /* ignore */ }
  }

  /* ── 降级视图（archiveData 缺失 / 不完整：不白屏、不自造内容） ── */
  function degradedView() {
    var wrap = U.el('div', 'jc jc-degraded');

    var body = U.el('div', 'jc-dg-body');
    var empty = U.el('div', 'jc-dg-empty');
    empty.innerHTML = BC.render.placeholderSVG('#8A9A7B', '迹', 120);
    body.appendChild(empty);
    body.appendChild(U.el('p', 'jc-dg-msg', '探索成果卡还没有生成'));
    body.appendChild(U.el('p', 'jc-dg-sub', '请先在「我的本草探索档案」保存你的档案'));
    wrap.appendChild(body);

    var foot = U.el('div', 'jc-dg-foot');
    var btn = U.el('button', 'btn jc-dg-back', '返回我的档案');
    btn.setAttribute('type', 'button');
    U.onClick(btn, function () { BC.router.replace(12); });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    return wrap;
  }

  function showDegraded() {
    var el = root();
    if (!el) return;
    clearTimers();
    archNow = null;
    shareImgSrc = '';
    maskRef = null;
    el.innerHTML = '';
    el.appendChild(degradedView());
  }

  /* ── 入场编排（setTimeout 驱动；绝不等 animationend） ── */
  function reveal() {
    var el = root();
    if (!el) return;

    function q(sel) { return el.querySelector(sel); }
    function qa(sel) { return el.querySelectorAll(sel); }

    var radarEl = q('.jc-radar-box .bp-radar');
    var herbs = qa('.jc-herb');

    function drawRadar() { if (radarEl) radarEl.classList.add('is-draw'); }
    function showAll() {
      var blocks = qa('.jc-block');
      for (var i = 0; i < blocks.length; i++) blocks[i].classList.add('is-in');
      for (var j = 0; j < herbs.length; j++) herbs[j].classList.add('is-in');
      drawRadar();
    }
    if (skipFx()) { showAll(); return; }

    timers.push(setTimeout(function () { var h = q('.jc-head'); if (h) h.classList.add('is-in'); }, T_HEAD));
    timers.push(setTimeout(function () { var t = q('.jc-type'); if (t) t.classList.add('is-in'); }, T_TYPE));
    timers.push(setTimeout(drawRadar, T_RADAR));
    for (var k = 0; k < herbs.length; k++) {
      (function (node, delay) {
        timers.push(setTimeout(function () { node.classList.add('is-in'); }, delay));
      })(herbs[k], T_HERB + k * T_HERB_STEP);
    }
    timers.push(setTimeout(function () { var t = q('.jc-tea'); if (t) t.classList.add('is-in'); }, T_TEA));
    timers.push(setTimeout(function () { var t = q('.jc-close'); if (t) t.classList.add('is-in'); }, T_CLOSE));
    timers.push(setTimeout(function () { var t = q('.jc-ops'); if (t) t.classList.add('is-in'); }, T_OPS));
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
      archNow = null;
      shareImgSrc = '';
      maskRef = null;

      try {
        el.innerHTML = '';
        var s = readState();
        if (s.bad) { showDegraded(); return; }
        archNow = s.arch;

        var inner = U.el('div', 'jc');
        inner.appendChild(buildCardHead(s.arch));
        inner.appendChild(buildType(s.arch));
        inner.appendChild(buildRadar(s.arch));
        inner.appendChild(buildHerbs(s.arch));
        inner.appendChild(buildTea(s.arch));
        inner.appendChild(buildClosing(s.arch));

        var card = U.el('div', 'jc-card');   // 米白成果卡（入场 anim-rise 载体）
        card.appendChild(inner);

        var cardBox = U.el('div', 'jc-cardbox');
        cardBox.appendChild(card);
        el.appendChild(cardBox);

        el.appendChild(buildOps());

        var m = buildMask();
        maskRef = m;
        el.appendChild(m.mask);           // 固定浮层挂 .page 直下（不受入场 transform 影响）

        reveal();
      } catch (e) {
        showDegraded();
      }
    },

    enter: function () {
      SP.setStageLabel(LABEL);            // 顶部右侧：MY HERBAL JOURNEY
      var el = root();
      if (!el || el.querySelector('.jc-degraded')) return;
      var card = el.querySelector('.jc-card');
      if (card) BC.fx.play('anim-rise', card, { duration: 600 });
    },

    leave: function () {
      clearTimers();
    },

    /* —— 仅供测试读取（非公开 UI 能力） —— */
    _buildShareSVG: buildShareSVG,
    _svgDataUrl: svgDataUrl
  };

  BC.pages = BC.pages || {};
  BC.pages.p13 = mod;

})(globalThis.BC);
