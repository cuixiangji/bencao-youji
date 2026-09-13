/*! utils/asset.js —— 资源路径解析 + 图片失败占位（WebP/SVG 双源） */
(function (BC) {
  'use strict';

  /**
   * 解析资源基名 → {webp, svg}
   * 以后只放同名 .webp 即可自动优先加载正式插画，无需改代码与数据
   */
  function resolve(base, dir) {
    var d = dir || BC.config.ASSET.herbDir;
    return { webp: d + base + '.webp', svg: d + base + '.svg', base: base };
  }

  /** 生成 <picture> HTML 字符串（webp 优先，svg 兜底） */
  function pictureHTML(base, dir, alt) {
    var p = resolve(base, dir);
    return '<picture>' +
      '<source srcset="' + p.webp + '" type="image/webp">' +
      '<img src="' + p.svg + '" alt="' + escapeAttr(alt || '') + '" loading="lazy" decoding="async">' +
      '</picture>';
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 绑定图片失败兜底：显示本草主题色渐变块 + 名称首字
   * 不白块、不破图、不阻断
   */
  function attachFallback(imgEl, color, char) {
    if (!imgEl) return;
    BC.safeOn(imgEl, 'error', function () {
      try {
        imgEl.style.display = 'none';
        var ph = document.createElement('span');
        ph.className = 'bc-ph';
        ph.style.background = 'linear-gradient(150deg,' + (color || '#8A9A7B') + '33,' + (color || '#8A9A7B') + '11)';
        ph.style.borderColor = (color || '#8A9A7B') + '66';
        ph.textContent = char ? String(char).charAt(0) : '';
        if (imgEl.parentNode) imgEl.parentNode.insertBefore(ph, imgEl.nextSibling);
      } catch (e) { /* ignore */ }
    });
  }

  BC.utils = BC.utils || {};
  BC.utils.asset = { resolve: resolve, pictureHTML: pictureHTML, attachFallback: attachFallback };

})(globalThis.BC);
