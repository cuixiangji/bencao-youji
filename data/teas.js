/*!
 * data/teas.js —— 12 种本草灵感饮
 * 来源：04a《体质测试_雷达计算_茶饮匹配_最终版》第八节
 *
 * 【数据完整性声明】
 *  - materials[].amount：原始资料仅 01/02 给出生活化用量；其余留空字符串（待补），
 *    渲染时 amount 为空则只显示材料名，不做任何虚构。
 *  - visual_color：原始资料仅 01/02/04/05/06 给出；其余 7 条按冻结稿附录A #8
 *    「按两种材料本草主题色各 50% 混合生成」在下方代码内派生填充（见 fillVisualColor）。
 *  - steps：冻结为不入库，全站共用 rules.BREW_STEPS。
 *  - cultural_note：09/10/11/12 为 true（冻结稿附录A #11）。
 */
(function (BC) {
  'use strict';

  BC.data.teas = [
    {
      id: 'tea_01', name: '橘香莲子饮',
      keywords: ['清香', '温润', '自然'],
      materials: [
        { herbId: 'chenpi', name: '陈皮', amount: '1小片' },
        { herbId: 'lianzi', name: '莲子', amount: '3～5粒' }
      ],
      visual_color: '', suitable_tags: ['轻盈探索型'],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_02', name: '秋日菊果饮',
      keywords: ['花香', '果香', '清新'],
      materials: [
        { herbId: 'juhua', name: '菊花', amount: '3～5朵' },
        { herbId: 'gouqizi', name: '枸杞', amount: '5～8粒' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_03', name: '双花清香饮',
      keywords: ['花香', '清爽', '夏日'],
      materials: [
        { herbId: 'jinyinhua', name: '金银花', amount: '' },
        { herbId: 'juhua', name: '菊花', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_04', name: '薄荷橘香饮',
      keywords: ['清凉', '柑橘', '活力'],
      materials: [
        { herbId: 'bohe', name: '薄荷', amount: '' },
        { herbId: 'chenpi', name: '陈皮', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_05', name: '云莲轻饮',
      keywords: ['素雅', '云白', '轻盈'],
      materials: [
        { herbId: 'lianzi', name: '莲子', amount: '' },
        { herbId: 'fuling', name: '茯苓', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_06', name: '山野果香饮',
      keywords: ['酸甜', '果香', '山野'],
      materials: [
        { herbId: 'shanzha', name: '山楂', amount: '' },
        { herbId: 'chenpi', name: '陈皮', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_07', name: '红果莲心饮',
      keywords: ['果实', '莲子', '自然'],
      materials: [
        { herbId: 'gouqizi', name: '枸杞', amount: '' },
        { herbId: 'lianzi', name: '莲子', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_08', name: '清风花草饮',
      keywords: ['花香', '薄荷', '清新'],
      materials: [
        { herbId: 'juhua', name: '菊花', amount: '' },
        { herbId: 'bohe', name: '薄荷', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: false
    },
    {
      id: 'tea_09', name: '橘甘和韵饮',
      keywords: ['柑香', '甘润', '和谐'],
      materials: [
        { herbId: 'chenpi', name: '陈皮', amount: '' },
        { herbId: 'gancao', name: '甘草', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: true
    },
    {
      id: 'tea_10', name: '山野贝莲饮',
      keywords: ['高山', '白色', '本草'],
      materials: [
        { herbId: 'chuanbeimu', name: '川贝母', amount: '' },
        { herbId: 'lianzi', name: '莲子', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: true
    },
    {
      id: 'tea_11', name: '川地本草饮',
      keywords: ['川味', '根茎', '柑香'],
      materials: [
        { herbId: 'chuanxiong', name: '川芎', amount: '' },
        { herbId: 'chenpi', name: '陈皮', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: true
    },
    {
      id: 'tea_12', name: '苦叶清识饮',
      keywords: ['苦味', '植物', '自然观察'],
      materials: [
        { herbId: 'huanglian', name: '黄连', amount: '' },
        { herbId: 'juhua', name: '菊花', amount: '' }
      ],
      visual_color: '', suitable_tags: [],
      steps: [], image: '', usage_display: '', category: 'cultural_exploration',
      cultural_note: true
    }
  ];

  var byId = {};
  for (var i = 0; i < BC.data.teas.length; i++) byId[BC.data.teas[i].id] = BC.data.teas[i];
  BC.data.teaById = byId;

  /**
   * 冻结稿附录A #8：7 条缺失 visual_color 的茶饮，按两种材料的本草主题色各 50% 混合生成。
   * 依赖 rules.PALETTE —— 必须在 rules.js 之后调用（由 data/rules.js 末尾触发）。
   */
  BC.data.fillVisualColor = function () {
    var pal = BC.data.rules && BC.data.rules.PALETTE;
    if (!pal) return;
    function hex2rgb(h) {
      h = String(h).replace('#', '');
      if (h.length !== 6) return null;
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    function mix(a, b) {
      var A = hex2rgb(a), B = hex2rgb(b);
      if (!A || !B) return '';
      var r = Math.round((A[0] + B[0]) / 2), g = Math.round((A[1] + B[1]) / 2), bl = Math.round((A[2] + B[2]) / 2);
      return '#' + [r, g, bl].map(function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
    }
    for (var i = 0; i < BC.data.teas.length; i++) {
      var t = BC.data.teas[i];
      if (t.visual_color) continue;
      var m = t.materials || [];
      var c1 = m[0] && pal[m[0].herbId], c2 = m[1] && pal[m[1].herbId];
      t.visual_color = (c1 && c2) ? mix(c1, c2) : (c1 || c2 || '#8A9A7B');
    }
  };

})(globalThis.BC);
