/*! utils/gesture.js —— 拖拽（Pointer → Touch → 点击 三级降级） */
(function (BC) {
  'use strict';

  /**
   * 创建可拖拽元素
   * @param {Element} el
   * @param {Object} opts {onStart,onMove,onDrop(targetHit),onCancel,onTap,hitTest(x,y)}
   * @returns {{destroy:Function}}
   *
   * 三级降级：Pointer Events → Touch Events → 点击（onTap 永远可用）
   */
  function createDrag(el, opts) {
    if (!el) return { destroy: function () {} };
    var o = opts || {};
    var threshold = BC.config.DRAG_THRESHOLD || 8;
    var active = false, sx = 0, sy = 0, moved = false, pid = null;
    var offs = [];

    function pt(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function lockScroll(on) {
      try { document.body.style.overflow = on ? 'hidden' : ''; } catch (e) { /* ignore */ }
    }

    function start(e) {
      var p = pt(e);
      active = true; moved = false; sx = p.x; sy = p.y;
      pid = (e.pointerId !== undefined) ? e.pointerId : null;
      try { if (el.setPointerCapture && pid !== null) el.setPointerCapture(pid); } catch (err) { /* ignore */ }
      try { if (o.onStart) o.onStart(el); } catch (err2) { BC.warn('drag onStart', err2); }
    }

    function move(e) {
      if (!active) return;
      var p = pt(e);
      var dx = p.x - sx, dy = p.y - sy;
      if (!moved && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
        moved = true;
        lockScroll(true);
      }
      if (!moved) return;
      try { if (e.preventDefault) e.preventDefault(); } catch (err) { /* ignore */ }
      try { if (o.onMove) o.onMove(el, dx, dy, p); } catch (err2) { BC.warn('drag onMove', err2); }
    }

    function end(e) {
      if (!active) return;
      active = false;
      lockScroll(false);
      var p = pt(e);
      try { if (el.releasePointerCapture && pid !== null) el.releasePointerCapture(pid); } catch (err) { /* ignore */ }

      if (!moved) {
        // 未超过阈值 → 视为点击（关键降级路径）
        try { if (o.onTap) o.onTap(el); } catch (err2) { BC.warn('drag onTap', err2); }
        return;
      }
      var hit = false;
      try { if (o.hitTest) hit = !!o.hitTest(p.x, p.y); } catch (err3) { hit = false; }
      if (hit) {
        try { if (o.onDrop) o.onDrop(el, p); } catch (err4) { BC.warn('drag onDrop', err4); }
      } else {
        try { if (o.onCancel) o.onCancel(el); } catch (err5) { BC.warn('drag onCancel', err5); }
      }
    }

    var hasPointer = !!(BC.compat && BC.compat.pointerEvents);
    if (hasPointer) {
      offs.push(BC.safeOn(el, 'pointerdown', start));
      offs.push(BC.safeOn(el, 'pointermove', move));
      offs.push(BC.safeOn(el, 'pointerup', end));
      offs.push(BC.safeOn(el, 'pointercancel', end));
    } else {
      offs.push(BC.safeOn(el, 'touchstart', start, { passive: true }));
      offs.push(BC.safeOn(el, 'touchmove', move, { passive: false }));
      offs.push(BC.safeOn(el, 'touchend', end));
      offs.push(BC.safeOn(el, 'touchcancel', end));
      offs.push(BC.safeOn(el, 'mousedown', start));
      offs.push(BC.safeOn(window, 'mousemove', function (e) { if (active) move(e); }));
      offs.push(BC.safeOn(window, 'mouseup', function (e) { if (active) end(e); }));
    }

    // 点击兜底（任何环境下都可用）
    offs.push(BC.utils.onClick(el, function () { if (o.onTap) o.onTap(el); }));

    try { el.style.touchAction = 'none'; } catch (e) { /* ignore */ }

    return {
      destroy: function () { offs.forEach(function (f) { try { f(); } catch (e) {} }); offs = []; }
    };
  }

  BC.utils = BC.utils || {};
  BC.utils.createDrag = createDrag;

})(globalThis.BC);
