/*! utils/storage.js + fingerprint.js —— 薄封装，实际逻辑在 core/store.js 与 logic/archive.js */
(function (BC) {
  'use strict';

  /* storage：store 之外的轻量直读写（带 try/catch 与内存降级） */
  function read(key) {
    try {
      var s = window.localStorage.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function write(key, obj) {
    try { window.localStorage.setItem(key, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }
  function remove(key) {
    try { window.localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  /* fingerprint：直接代理 logic 层纯函数 */
  function fingerprint(state) { return BC.logic.computeFingerprint(state || {}); }

  BC.utils = BC.utils || {};
  BC.utils.storage = { read: read, write: write, remove: remove };
  BC.utils.fingerprint = fingerprint;

})(globalThis.BC);
