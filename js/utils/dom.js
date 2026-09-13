/*! utils/dom.js —— DOM 助手（所有文本写入一律 textContent，防 XSS） */
(function (BC) {
  'use strict';

  function $(sel, root) {
    try { return (root || document).querySelector(sel); } catch (e) { return null; }
  }
  function $$(sel, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (e) { return []; }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = sanitize(String(text));
    return e;
  }

  /** 渲染前清洗：去掉会导致界面出现 undefined/null/NaN 的脏值 */
  function sanitize(s) {
    return String(s)
      .replace(/undefined/g, '')
      .replace(/\bnull\b/g, '')
      .replace(/NaN/g, '')
      .replace(/\[object Object\]/g, '');
  }

  function setText(node, text) {
    if (!node) return;
    node.textContent = sanitize(text === undefined || text === null ? '' : String(text));
  }

  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }

  function addClass(node, c) { if (node && node.classList) node.classList.add(c); }
  function removeClass(node, c) { if (node && node.classList) node.classList.remove(c); }

  /** 防抖点击绑定（300ms 内只响应一次） */
  function onClick(node, handler) {
    if (!node) return function () {};
    var last = 0;
    return BC.safeOn(node, 'click', function (ev) {
      var now = Date.now();
      if (now - last < BC.config.CLICK_DEBOUNCE) {
        try { ev.preventDefault(); } catch (e) { /* ignore */ }
        return;
      }
      last = now;
      return handler(ev);
    });
  }

  BC.utils = BC.utils || {};
  BC.utils.$ = $;
  BC.utils.$$ = $$;
  BC.utils.el = el;
  BC.utils.sanitize = sanitize;
  BC.utils.setText = setText;
  BC.utils.show = show;
  BC.utils.hide = hide;
  BC.utils.addClass = addClass;
  BC.utils.removeClass = removeClass;
  BC.utils.onClick = onClick;

})(globalThis.BC);
