/*!
 * data/questions.js —— 5 道身体观察题 × 3 选项 × 六维权值
 * 来源：04a 文档权重表（气/血/阴/阳/湿/热），逐值照录，未做任何调整
 */
(function (BC) {
  'use strict';

  BC.data.questions = [
    {
      id: 'Q1', title: '最近的你，更接近哪种状态？',
      options: [
        { key: 'A', text: '一吹空调就觉得冷', w: { qi: 0, xue: 0, yin: 0, yang: 2, shi: 0, re: 0 } },
        { key: 'B', text: '冷热都还比较舒服', w: { qi: 1, xue: 1, yin: 1, yang: 1, shi: 1, re: 1 } },
        { key: 'C', text: '稍微热一点就觉得闷热', w: { qi: 0, xue: 0, yin: 1, yang: 0, shi: 0, re: 2 } }
      ]
    },
    {
      id: 'Q2', title: '运动或玩耍之后，你通常是？',
      options: [
        { key: 'A', text: '很容易累，休息很久才缓过来', w: { qi: 2, xue: 1, yin: 0, yang: 0, shi: 1, re: 0 } },
        { key: 'B', text: '出一点汗，休息一下就好', w: { qi: 1, xue: 1, yin: 1, yang: 1, shi: 0, re: 0 } },
        { key: 'C', text: '特别容易出汗，感觉身体很热', w: { qi: 0, xue: 1, yin: 1, yang: 0, shi: 1, re: 2 } }
      ]
    },
    {
      id: 'Q3', title: '一天里，你通常更喜欢哪种喝水方式？',
      options: [
        { key: 'A', text: '不太觉得渴，想起来才喝', w: { qi: 1, xue: 0, yin: 0, yang: 1, shi: 1, re: 0 } },
        { key: 'B', text: '口渴了就正常喝水', w: { qi: 1, xue: 1, yin: 1, yang: 1, shi: 0, re: 0 } },
        { key: 'C', text: '经常想喝水，尤其喜欢冰饮', w: { qi: 0, xue: 0, yin: 2, yang: 0, shi: 1, re: 2 } }
      ]
    },
    {
      id: 'Q4', title: '最近的身体状态，更像哪一种？',
      options: [
        { key: 'A', text: '轻松顺畅，没有特别感觉', w: { qi: 1, xue: 1, yin: 1, yang: 1, shi: 0, re: 0 } },
        { key: 'B', text: '偶尔觉得身体有点沉、懒得动', w: { qi: 0, xue: 0, yin: 0, yang: 0, shi: 2, re: 0 } },
        { key: 'C', text: '吃得较多或油腻时，容易觉得肚子胀胀的', w: { qi: 0, xue: 0, yin: 0, yang: 0, shi: 2, re: 1 } }
      ]
    },
    {
      id: 'Q5', title: '今天的小观察：你的舌面看起来更接近？',
      options: [
        { key: 'A', text: '颜色偏淡', w: { qi: 1, xue: 0, yin: 0, yang: 2, shi: 1, re: 0 } },
        { key: 'B', text: '红润自然', w: { qi: 1, xue: 1, yin: 1, yang: 1, shi: 0, re: 0 } },
        { key: 'C', text: '颜色偏红', w: { qi: 0, xue: 0, yin: 1, yang: 0, shi: 0, re: 2 } }
      ]
    }
  ];

  // 答案键 → 索引（用于档案编号计算）
  BC.data.answerIndex = { A: 0, B: 1, C: 2 };

})(globalThis.BC);
