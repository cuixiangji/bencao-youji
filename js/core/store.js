/*! core/store.js —— 单一 appState + 持久化 + 订阅（严格遵循 v1.1 冻结规则） */
(function (BC) {
  'use strict';

  var RUNTIME_KEYS = [
    'lowPerf', 'skipAnimation', 'playedAnimations',
    'storageAvailable', 'isRestored', 'fxHandles'
  ];

  function defaultState() {
    return {
      /* 元信息 */
      schemaVersion: BC.config.SCHEMA_VERSION,
      currentPage: 1,
      pageHistory: [1],
      savedAt: 0,

      /* 模块一：原始输入 */
      selectedHerbs: [],

      /* 模块二：原始输入 */
      bodyAnswers: [null, null, null, null, null],
      currentQuestion: 0,

      /* 模块二：派生 */
      bodyScores: { qi: 40, xue: 40, yin: 40, yang: 40, shi: 40, re: 40 },
      bodyScoresDisplay: { qi: 35, xue: 35, yin: 35, yang: 35, shi: 35, re: 35 },
      explorationType: { type: '', keywords: [], topDim: '', range: 0 },
      calcFingerprint: '',

      /* 模块三 */
      recommendedHerbs: [],
      chosenHerb: '',          // 原始输入
      selectedTea: '',         // 派生
      teaIngredients: [],      // 派生
      teaBrewStep: 0,          // 原始输入（进度）

      /* 成果 */
      archiveData: null,

      /* 运行时（不持久化） */
      lowPerf: false,
      skipAnimation: false,
      playedAnimations: {},
      storageAvailable: true,
      isRestored: false,
      fxHandles: {}
    };
  }

  var state = defaultState();
  var subscribers = [];
  var saveTimer = null;
  var storageOK = true;

  /* ─────────── 持久化 ─────────── */

  function readRaw() {
    try {
      var s = window.localStorage.getItem(BC.config.STORAGE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { storageOK = false; return null; }
  }

  function writeRaw(obj) {
    try {
      window.localStorage.setItem(BC.config.STORAGE_KEY, JSON.stringify(obj));
      return true;
    } catch (e) { storageOK = false; return false; }
  }

  function stripRuntime(obj) {
    var out = {};
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (RUNTIME_KEYS.indexOf(k) !== -1) continue;
      out[k] = obj[k];
    }
    return out;
  }

  /** 快照（剥离运行时字段，保证 100% JSON 可序列化） */
  function snapshot() {
    var s = stripRuntime(state);
    s.savedAt = Date.now();
    s.schemaVersion = BC.config.SCHEMA_VERSION;
    return s;
  }

  /** 立即保存 */
  function saveSession() {
    state.savedAt = Date.now();
    return writeRaw(snapshot());
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      saveSession();
    }, BC.config.SAVE_DEBOUNCE);
  }

  /** 恢复；返回 {ok, page, repaired, reason} */
  function restoreSession() {
    var raw = readRaw();
    if (!raw) return { ok: false, page: 1, repaired: false, reason: 'empty' };

    // TTL 过期
    if (raw.savedAt && (Date.now() - raw.savedAt > BC.config.STORAGE_TTL)) {
      clearSession();
      return { ok: false, page: 1, repaired: false, reason: 'expired' };
    }

    var v = BC.logic.validateSession(raw);
    if (!v.ok) { clearSession(); return v; }

    // 合并（只接受已知字段，防脏数据）
    var def = defaultState();
    for (var k in def) {
      if (!Object.prototype.hasOwnProperty.call(def, k)) continue;
      if (RUNTIME_KEYS.indexOf(k) !== -1) continue;
      if (Object.prototype.hasOwnProperty.call(raw, k) && raw[k] !== undefined) {
        state[k] = raw[k];
      }
    }
    state.currentPage = v.page;
    state.isRestored = true;
    state.storageAvailable = storageOK;

    // 重建历史栈为最短合法路径
    if (!state.pageHistory || !state.pageHistory.length) state.pageHistory = [1];
    if (state.pageHistory[state.pageHistory.length - 1] !== v.page) {
      state.pageHistory = [];
      for (var i = 1; i <= v.page; i++) state.pageHistory.push(i);
    }

    BC.log('restore ->', v);
    return v;
  }

  function clearSession() {
    try { window.localStorage.removeItem(BC.config.STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /** 全量重置（仅「再探索一次」/「重新开始」调用） */
  function reset() {
    clearSession();
    var fresh = defaultState();
    for (var k in fresh) {
      if (Object.prototype.hasOwnProperty.call(fresh, k)) state[k] = fresh[k];
    }
    state.storageAvailable = storageOK;
    BC.log('store.reset');
  }

  /* ─────────── 读写 ─────────── */

  function clone(v) {
    if (v === null || typeof v !== 'object') return v;
    try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
  }

  function get(key) {
    if (key === undefined) return clone(state);
    return clone(state[key]);
  }

  function notify(key) {
    for (var i = 0; i < subscribers.length; i++) {
      try { subscribers[i](key, state); } catch (e) { BC.warn('subscriber error', e && e.message); }
    }
  }

  function set(key, value) {
    if (!(key in state)) { BC.warn('store.set unknown key:', key); return false; }
    state[key] = value;
    scheduleSave();
    notify(key);
    return true;
  }

  function batch(obj) {
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (!(k in state)) { BC.warn('store.batch unknown key:', k); continue; }
      state[k] = obj[k];
    }
    scheduleSave();
    notify('*');
    return true;
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    subscribers.push(fn);
    return function () {
      var i = subscribers.indexOf(fn);
      if (i !== -1) subscribers.splice(i, 1);
    };
  }

  /* ─────────── 指纹 ─────────── */

  /** 重算指纹；返回是否与上次一致 */
  function refreshFingerprint() {
    var fp = BC.logic.computeFingerprint({
      selectedHerbs: state.selectedHerbs,
      bodyAnswers: state.bodyAnswers,
      chosenHerb: state.chosenHerb
    });
    var same = (fp === state.calcFingerprint);
    state.calcFingerprint = fp;
    return same;
  }

  function isFingerprintSame() {
    return BC.logic.computeFingerprint({
      selectedHerbs: state.selectedHerbs,
      bodyAnswers: state.bodyAnswers,
      chosenHerb: state.chosenHerb
    }) === state.calcFingerprint;
  }

  /* ─────────── 生命周期 ─────────── */

  function installLifecycle() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    // iOS Safari 不保证 unload，必须同时用 pagehide + visibilitychange
    BC.safeOn(window, 'pagehide', function () { saveSession(); });
    BC.safeOn(document, 'visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveSession();
    });
  }

  function init() {
    storageOK = !!(BC.compat && BC.compat.localStorage);
    state.storageAvailable = storageOK;
    state.lowPerf = !!(BC.compat && BC.compat.lowPerf);
    state.skipAnimation = !!(BC.compat && BC.compat.reducedMotion);
    installLifecycle();
    BC.log('store.init storageOK =', storageOK);
  }

  BC.store = {
    init: init,
    get: get,
    set: set,
    batch: batch,
    subscribe: subscribe,
    reset: reset,
    snapshot: snapshot,
    save: saveSession,
    restore: restoreSession,
    clear: clearSession,
    refreshFingerprint: refreshFingerprint,
    isFingerprintSame: isFingerprintSame,
    defaults: defaultState,
    _raw: function () { return state; }   // 仅供 dev-test 使用
  };

})(globalThis.BC);
