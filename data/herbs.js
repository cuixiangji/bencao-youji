/*!
 * data/herbs.js —— 12 种本草探索对象
 * 来源：04b《12种本草探索对象数据库_最终版》 + 冻结稿 v1.1 附录A 修正
 *
 * 【数据完整性声明】
 *  - 以下字段值一律照录原始资料，未做任何补写或猜测。
 *  - color：仅川贝母在原始资料中给出 HEX（#E9E4D8）；其余 11 种原始资料只给色名，
 *    此处照录色名字符串，渲染用 HEX 统一放在 data/rules.js 的 PALETTE（工程派生色板）。
 *  - category：原始资料仅川贝母标注「根茎类药材」，其余留空字符串（待补）。
 *  - image：只存「资源基名」，由 utils/asset.js 解析为 webp/svg 双源。
 */
(function (BC) {
  'use strict';

  BC.data.herbs = [
    {
      id: 'chuanbeimu', name: '川贝母', latin: 'Fritillaria cirrhosa',
      category: '根茎类药材', image: 'chuanbeimu', image_style: 'flat-botanical',
      color: '#E9E4D8',
      property: '微寒', taste: '甘、苦',
      origin: '四川、青海、西藏等高海拔地区',
      keywords: ['高山植物', '白色珍珠', '润肺清润'],
      description: '生长在高山草甸中的白色鳞茎，如藏在山林里的小珍珠。',
      observation: '它安静生长，却拥有温柔的力量。',
      body_tags: ['热', '燥倾向'],
      tea_ids: ['tea_10'],
      usage_note: ''
    },
    {
      id: 'chuanxiong', name: '川芎', latin: 'Ligusticum chuanxiong',
      category: '', image: 'chuanxiong', image_style: 'flat-botanical',
      color: '青褐',
      property: '温', taste: '辛',
      origin: '四川都江堰、彭州等地',
      keywords: ['川地药香', '流动生命', '植物根茎'],
      description: '地下生长的根茎，是植物储存力量的方式。',
      observation: '它像森林里的地下脉络，连接土地与生命。',
      body_tags: ['气血循环'],
      tea_ids: ['tea_11'],
      usage_note: ''
    },
    {
      id: 'huanglian', name: '黄连', latin: 'Coptis chinensis',
      category: '', image: 'huanglian', image_style: 'flat-botanical',
      color: '苦黄',
      property: '寒', taste: '苦',
      origin: '四川、湖北等地区',
      keywords: ['苦味本草', '山野黄金', '清润守护'],
      description: '小小根茎蕴藏浓烈苦味，是传统本草中的“黄金根”。',
      observation: '苦味之后，是自然给予身体的平衡。',
      body_tags: ['热倾向'],
      tea_ids: ['tea_12'],
      usage_note: ''
    },
    {
      id: 'lianzi', name: '莲子', latin: 'Nelumbo nucifera seed',
      category: '', image: 'lianzi', image_style: 'flat-botanical',
      color: '莲青',
      property: '平', taste: '甘、涩',
      origin: '湖南、江西、福建',
      keywords: ['水中珍宝', '莲心智慧', '平和滋养'],
      description: '从莲花中心孕育而来的种子，拥有自然的清雅气息。',
      observation: '一颗莲子，是一份来自水面的安静力量。',
      body_tags: ['平和调养'],
      tea_ids: ['tea_05', 'tea_07', 'tea_10'],
      usage_note: ''
    },
    {
      id: 'chenpi', name: '陈皮', latin: 'Citrus reticulata peel',
      category: '', image: 'chenpi', image_style: 'flat-botanical',
      color: '暖橙',
      property: '温', taste: '辛、苦',
      origin: '广东新会',
      keywords: ['岁月果香', '时间本草', '橘香记忆'],
      description: '橘皮经过时间沉淀，成为具有独特香气的本草。',
      observation: '时间让普通果皮拥有新的生命。',
      body_tags: ['湿倾向'],
      tea_ids: ['tea_01', 'tea_04', 'tea_06', 'tea_09', 'tea_11'],
      usage_note: ''
    },
    {
      id: 'jinyinhua', name: '金银花', latin: 'Lonicera japonica',
      category: '', image: 'jinyinhua', image_style: 'flat-botanical',
      color: '淡黄绿',
      property: '寒', taste: '甘',
      origin: '山东、河南等地',
      keywords: ['双花相伴', '清香植物', '夏日花草'],
      description: '一株藤蔓，两种花色，记录着自然变化的美。',
      observation: '它像夏天里的绿色微风。',
      body_tags: ['热倾向'],
      tea_ids: ['tea_03'],
      usage_note: ''
    },
    {
      id: 'juhua', name: '菊花', latin: 'Chrysanthemum morifolium',
      category: '', image: 'juhua', image_style: 'flat-botanical',
      color: '淡黄',
      property: '微寒', taste: '甘、苦',
      origin: '浙江、安徽',
      keywords: ['秋日花香', '清雅植物', '自然诗意'],
      description: '秋风中的小花，以清新的姿态记录季节变化。',
      observation: '一朵菊花，就是一片微小的秋天。',
      body_tags: ['热', '燥'],
      tea_ids: ['tea_02', 'tea_03', 'tea_08', 'tea_12'],
      usage_note: ''
    },
    {
      id: 'gouqizi', name: '枸杞子', latin: 'Lycium barbarum',
      category: '', image: 'gouqizi', image_style: 'flat-botanical',
      color: '枸杞红',
      property: '平', taste: '甘',
      origin: '宁夏',
      keywords: ['红色果实', '生命能量', '东方浆果'],
      description: '小小红果，是植物积累阳光后的礼物。',
      observation: '它像秋天留下的一颗红色星星。',
      body_tags: ['气血'],
      tea_ids: ['tea_02', 'tea_07'],
      usage_note: ''
    },
    {
      id: 'fuling', name: '茯苓', latin: 'Poria cocos',
      category: '', image: 'fuling', image_style: 'flat-botanical',
      color: '云白',
      property: '平', taste: '甘、淡',
      origin: '云南、安徽',
      keywords: ['森林菌物', '云朵本草', '自然平衡'],
      description: '藏在松树根下的小小菌核，是森林中的隐藏生命。',
      observation: '它像森林留下的一块白色云朵。',
      body_tags: ['湿倾向'],
      tea_ids: ['tea_05'],
      usage_note: ''
    },
    {
      id: 'gancao', name: '甘草', latin: 'Glycyrrhiza uralensis',
      category: '', image: 'gancao', image_style: 'flat-botanical',
      color: '浅棕',
      property: '平', taste: '甘',
      origin: '内蒙古、甘肃',
      keywords: ['调和百草', '甜味本草', '温和伙伴'],
      description: '在许多本草配方中，它像一位协调不同植物的伙伴。',
      observation: '温和不是平凡，而是一种稳定力量。',
      body_tags: ['平衡调节'],
      tea_ids: ['tea_09'],
      usage_note: ''
    },
    {
      id: 'shanzha', name: '山楂', latin: 'Crataegus pinnatifida',
      category: '', image: 'shanzha', image_style: 'flat-botanical',
      color: '山楂红',
      property: '微温', taste: '酸、甘',
      origin: '山东、河北',
      keywords: ['酸甜果实', '秋日红宝石', '食养记忆'],
      description: '红色小果连接着自然与日常饮食的记忆。',
      observation: '酸甜之间，是植物带来的快乐味道。',
      body_tags: ['饮食调节'],
      tea_ids: ['tea_06'],           // ★冻结修正：原映射含 tea_07（红果莲心饮=枸杞×莲子），已删除
      usage_note: ''
    },
    {
      id: 'bohe', name: '薄荷', latin: 'Mentha haplocalyx',
      category: '', image: 'bohe', image_style: 'flat-botanical',
      color: '薄荷绿',
      property: '凉', taste: '辛',
      origin: '江苏、安徽',
      keywords: ['清凉植物', '绿色气息', '夏日精灵'],
      description: '一片绿色叶片，带来清新的植物气息。',
      observation: '它像森林里吹来的第一阵凉风。',
      body_tags: ['热倾向'],
      tea_ids: ['tea_04', 'tea_08'],
      usage_note: ''
    }
  ];

  // 便捷索引（纯派生，不改数据）
  var byId = {};
  for (var i = 0; i < BC.data.herbs.length; i++) {
    byId[BC.data.herbs[i].id] = BC.data.herbs[i];
  }
  BC.data.herbById = byId;

  // HERB_INDEX：数组顺序即冻结顺序（01–12 → 0–11）
  BC.data.herbIndex = {};
  for (var j = 0; j < BC.data.herbs.length; j++) {
    BC.data.herbIndex[BC.data.herbs[j].id] = j;
  }

})(globalThis.BC);
