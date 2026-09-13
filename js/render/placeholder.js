/*! render/placeholder.js —— 本草主题色几何占位图（纯代码生成，非虚假写实插画） */
(function (BC) {
  'use strict';

  var seq = 0;

  /**
   * 生成占位 SVG 字符串
   * @param {string} color 主题色
   * @param {string} char  本草名首字
   * @param {number} [size]
   * @returns {string} SVG 字符串
   * 纯函数（返回字符串，不写 DOM）
   *
   * 【v4.1 修正】渐变 id 由固定 "g" 改为自增唯一 id：
   * 同页渲染 12 张卡片时，重复 id 会让所有图元都指向第一个渐变（颜色全串）。
   */
  function placeholderSVG(color, char, size) {
    var c = color || '#8A9A7B';
    var s = size || 120;
    var txt = char ? String(char).charAt(0) : '';
    var gid = 'bcg' + (++seq);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="' + s + '" height="' + s + '" role="img" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c + '" stop-opacity=".38"/>' +
      '<stop offset="1" stop-color="' + c + '" stop-opacity=".08"/>' +
      '</linearGradient></defs>' +
      '<circle cx="60" cy="60" r="58" fill="url(#' + gid + ')" stroke="' + c + '" stroke-opacity=".5" stroke-width="1"/>' +
      '<path d="M60 92 C60 68 60 56 60 40" stroke="' + c + '" stroke-opacity=".65" stroke-width="1.6" fill="none"/>' +
      '<path d="M60 62 C44 62 34 52 34 40 C48 36 58 46 60 62 Z" fill="' + c + '" fill-opacity=".45"/>' +
      '<path d="M60 54 C76 54 86 44 86 32 C72 28 62 38 60 54 Z" fill="' + c + '" fill-opacity=".28"/>' +
      '<text x="60" y="106" text-anchor="middle" font-size="14" fill="#F2EEE5" fill-opacity=".8" ' +
      'font-family="system-ui,-apple-system,PingFang SC,Microsoft YaHei,sans-serif">' + txt + '</text>' +
      '</svg>';
  }

  /** 取本草渲染色（PALETTE 派生色板） */
  function herbColor(herbId) {
    var pal = BC.data.rules && BC.data.rules.PALETTE;
    return (pal && pal[herbId]) || '#8A9A7B';
  }

  BC.render = BC.render || {};
  BC.render.placeholderSVG = placeholderSVG;
  BC.render.herbColor = herbColor;

})(globalThis.BC);
