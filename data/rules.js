/*!
 * data/rules.js —— 算法常量与映射表
 * 来源：冻结稿 v1.2 第〇部分「二/三/四/六」+ 附录A
 * 【v1.2 变更】BALANCED_RANGE: 4 → 2（唯一变更项，其余规则全部保持不变）
 *
 * 【PALETTE 说明】
 *  原始资料仅川贝母给出 HEX（#E9E4D8）。以下 11 个 HEX 为「工程派生渲染色板」，
 *  依据 04b 给出的色名（青褐/苦黄/莲青/暖橙/淡黄绿/淡黄/枸杞红/云白/浅棕/山楂红/薄荷绿）
 *  取低饱和值，仅用于渲染与 visual_color 派生，**不等同于原始设计数据，待设计师确认后可整体替换**。
 */
(function (BC) {
  'use strict';

  BC.data.rules = {
    /* ── 雷达视觉映射（冻结稿第〇部分 二） ── */
    RAW_MIN: 40,
    RAW_MAX: 49,
    R_MIN: 0.35,
    R_MAX: 1.00,
    D_MIN: 35,
    D_MAX: 100,

    /* ── 探索型判定（冻结稿第〇部分 三） ── */
    BALANCED_RANGE: 2,   // 六维极差 ≤2 → 平和探索型（v1.2 修正：原 4，见冻结稿 v1.2 变更记录）
    KEYWORD_GAP: 2,      // top1-top2 < 2 → 显示双关键词

    DIM_ORDER: ['qi', 'xue', 'yin', 'yang', 'shi', 're'],
    DIM_LABEL: { qi: '气', xue: '血', yin: '阴', yang: '阳', shi: '湿', re: '热' },
    TIE_ORDER: ['shi', 're', 'yang', 'yin', 'qi', 'xue'],

    TYPE_MAP: {
      qi: '元气探索型', xue: '元气探索型',
      yang: '温衡探索型', yin: '清润探索型',
      shi: '轻盈探索型', re: '清爽探索型'
    },
    KEYWORD: { qi: '活力', xue: '平衡', yang: '温暖', yin: '清润', shi: '轻盈', re: '清爽' },
    BALANCED_TYPE: '平和探索型',
    BALANCED_KEYWORDS: ['稳定', '自在'],

    /* ── 茶饮匹配（冻结稿第〇部分 四） ── */
    TYPE_INDEX: {
      '元气探索型': 0, '温衡探索型': 1, '清润探索型': 2,
      '轻盈探索型': 3, '清爽探索型': 4, '平和探索型': 5
    },

    RECOMMEND_MAP: {
      '元气探索型': ['gouqizi', 'lianzi', 'shanzha'],
      '温衡探索型': ['chenpi', 'lianzi', 'gancao'],
      '清润探索型': ['lianzi', 'juhua', 'jinyinhua'],
      '轻盈探索型': ['chenpi', 'fuling', 'lianzi'],
      '清爽探索型': ['jinyinhua', 'juhua', 'bohe'],
      '平和探索型': ['lianzi', 'gouqizi', 'chenpi']
    },

    /* ── 页面文案与常量 ── */
    BREW_STEPS: ['01 准备材料', '02 加入热水', '03 静置片刻'],
    DISCLAIMER: '本页面仅用于本草文化互动体验，不作为医学诊断或个体化健康建议。',
    FALLBACK_TEA: 'tea_01',
    FALLBACK_TYPE: '平和探索型',

    /* ── 渲染用工程派生色板（12 种本草） ── */
    PALETTE: {
      chuanbeimu: '#E9E4D8',
      chuanxiong: '#6B7255',
      huanglian:  '#C6A64B',
      lianzi:     '#6F9080',
      chenpi:     '#D2874A',
      jinyinhua:  '#BFCB87',
      juhua:      '#DDCB79',
      gouqizi:    '#C05B4D',
      fuling:     '#E3E0D5',
      gancao:     '#B39268',
      shanzha:    '#C04A3E',
      bohe:       '#86B894'
    }
  };

  // 茶饮食用色派生（7 条缺失者）
  try { BC.data.fillVisualColor(); } catch (e) { /* 静默，不影响流程 */ }

})(globalThis.BC);
