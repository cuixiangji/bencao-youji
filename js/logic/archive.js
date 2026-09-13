/*! logic/archive.js —— 档案编号 / 档案快照 / 指纹 / 会话校验（纯函数） */
(function (BC) {
  'use strict';

  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = '0' + s;
    return s;
  }

  /**
   * 确定性档案编号（冻结稿第 11 节）
   *   no = 1 + ((ΣHERB_INDEX(selectedHerbs) + ΣanswerIdx×7 + teaNum×13) % 9999)
   *
   * @param {{herbIds:Array, answers:Array, teaId:string}} input
   * @returns {string} 'NO.0258'
   * 纯函数
   */
  function buildArchiveNo(input) {
    var herbIds = (input && input.herbIds) || [];
    var answers = (input && input.answers) || [];
    var teaId = (input && input.teaId) || '';

    var herbSum = 0, i;
    for (i = 0; i < herbIds.length; i++) {
      var hi = BC.data.herbIndex[herbIds[i]];
      if (typeof hi === 'number') herbSum += hi;
    }

    var ansSum = 0;
    var A = BC.data.answerIndex || { A: 0, B: 1, C: 2 };
    for (i = 0; i < answers.length; i++) {
      var v = A[answers[i]];
      if (typeof v === 'number') ansSum += v;
    }

    var m = /(\d+)$/.exec(String(teaId));
    var teaNum = m ? parseInt(m[1], 10) : 0;

    var no = 1 + ((herbSum + ansSum * 7 + teaNum * 13) % 9999);
    return 'NO.' + pad4(no);
  }

  /**
   * 组装档案快照（生成后冻结，不再随状态变化）
   * @param {Object} state 类 appState 对象
   * @returns {Object} archiveData
   * 纯函数
   */
  function buildArchive(state) {
    var s = state || {};
    var pal = BC.data.rules.PALETTE;
    var out = {
      herbs: [], radar: {}, typeName: '', typeKeywords: [],
      teaName: '', teaMaterialsText: '', teaVisualColor: '',
      archiveNo: 'NO.0001', createdAt: 0
    };

    var ids = s.selectedHerbs || [];
    for (var i = 0; i < ids.length; i++) {
      var h = BC.data.herbById[ids[i]];
      if (!h) continue;
      out.herbs.push({
        id: h.id, name: h.name, latin: h.latin,
        color: pal[h.id] || '#8A9A7B', image: h.image,
        property: h.property, taste: h.taste, origin: h.origin,
        observation: h.observation, description: h.description
      });
    }

    var disp = (s.bodyScoresDisplay) || {};
    out.radar = {
      qi: disp.qi || 35, xue: disp.xue || 35, yin: disp.yin || 35,
      yang: disp.yang || 35, shi: disp.shi || 35, re: disp.re || 35
    };

    var t = s.explorationType || {};
    out.typeName = t.type || BC.data.rules.FALLBACK_TYPE;
    out.typeKeywords = (t.keywords || []).slice();

    var tea = (s.selectedTea && BC.data.teaById[s.selectedTea]) || null;
    if (tea) {
      out.teaName = tea.name;
      out.teaMaterialsText = (tea.materials || []).map(function (m) { return m.name; }).join(' × ');
      out.teaVisualColor = tea.visual_color || '#8A9A7B';
      out.teaId = tea.id;
      out.culturalNote = !!tea.cultural_note;
    }

    out.archiveNo = buildArchiveNo({
      herbIds: ids, answers: s.bodyAnswers || [], teaId: s.selectedTea || ''
    });
    out.createdAt = (typeof s.savedAt === 'number' && s.savedAt) ? s.savedAt : 0;

    return out;
  }

  /**
   * 输入指纹（防重复计算 / 防重复状态）
   * @param {{selectedHerbs:Array, bodyAnswers:Array, chosenHerb:string}} state
   * @returns {string}
   * 纯函数
   */
  function computeFingerprint(state) {
    var s = state || {};
    var herbs = (s.selectedHerbs || []).join(',');
    var answers = (s.bodyAnswers || []).map(function (a) { return a || '-'; }).join('');
    var chosen = s.chosenHerb || '';
    return 'h[' + herbs + ']a[' + answers + ']c[' + chosen + ']';
  }

  /**
   * 会话快照完整性校验（跨端规范 D.3）
   * @param {Object} snap
   * @returns {{ok:boolean, page:number, repaired:boolean, reason:string}}
   * 纯函数
   */
  function validateSession(snap) {
    var rules = BC.data.rules;
    if (!snap || typeof snap !== 'object') {
      return { ok: false, page: 1, repaired: false, reason: 'empty' };
    }
    if (snap.schemaVersion !== BC.config.SCHEMA_VERSION) {
      return { ok: false, page: 1, repaired: false, reason: 'version' };
    }

    var herbs3 = (snap.selectedHerbs && snap.selectedHerbs.length === 3);
    var scoreOK = !!(snap.bodyScores && typeof snap.bodyScores.qi === 'number');
    var typeOK = !!(snap.explorationType && snap.explorationType.type);
    var teaOK = !!(snap.selectedTea && BC.data.teaById[snap.selectedTea]);
    var archiveOK = !!(snap.archiveData && snap.archiveData.teaName);

    var page = snap.currentPage;
    if (typeof page !== 'number' || page < 1 || page > BC.config.TOTAL_PAGES) page = 1;

    var target = page;
    if (target >= 13 && !archiveOK) target = 12;
    if (target >= 12 && !(herbs3 && typeOK && teaOK)) target = 11;
    if (target >= 11 && !(teaOK)) target = 10;
    if (target >= 10 && !(typeOK)) target = 9;
    if (target >= 9 && !(scoreOK)) target = 8;
    if (target >= 8 && !herbs3) target = 7;
    if ((target >= 7 || target >= 4) && !herbs3) target = 3;

    return {
      ok: true,
      page: target,
      repaired: target !== page,
      reason: target !== page ? 'fallback' : ''
    };
  }

  BC.logic = BC.logic || {};
  BC.logic.buildArchiveNo = buildArchiveNo;
  BC.logic.buildArchive = buildArchive;
  BC.logic.computeFingerprint = computeFingerprint;
  BC.logic.validateSession = validateSession;

})(globalThis.BC);
