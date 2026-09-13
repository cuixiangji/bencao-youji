/*! 能力探测 + 低性能判定（启动一次，各模块只读结果） */
(function (BC) {
  'use strict';

  function hasWebp() {
    try {
      var c = document.createElement('canvas');
      if (!c.getContext || !c.getContext('2d')) return false;
      return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { return false; }
  }

  function hasLocalStorage() {
    try {
      var k = '__bc_t__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  function hasPointer() {
    try { return !!window.PointerEvent && ('onpointerdown' in window); } catch (e) { return false; }
  }

  function hasCanvas() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext && c.getContext('2d'));
    } catch (e) { return false; }
  }

  function hasReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function hasShare() { try { return !!navigator.share; } catch (e) { return false; } }

  function hasEnvSafeArea() {
    try {
      return !!(window.CSS && CSS.supports && CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)'));
    } catch (e) { return false; }
  }

  function detectLowPerf() {
    try {
      var cores = navigator.hardwareConcurrency;
      var mem = navigator.deviceMemory;
      if (typeof cores === 'number' && cores > 0 && cores <= 4) return true;
      if (typeof mem === 'number' && mem > 0 && mem <= 4) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function detect() {
    var dpr = 1;
    try { dpr = window.devicePixelRatio || 1; } catch (e) { dpr = 1; }

    var c = {
      webp: hasWebp(),
      localStorage: hasLocalStorage(),
      pointerEvents: hasPointer(),
      canvas: hasCanvas(),
      dpr: Math.min(dpr, 2),              // 截图统一上限 2
      reducedMotion: hasReducedMotion(),
      share: hasShare(),
      envSafeArea: hasEnvSafeArea(),
      lowPerf: false,                     // 需 DOM 就绪后再测
      ua: '',
      isWeChat: false,
      isIOS: false,
      isAndroid: false
    };

    try {
      c.ua = navigator.userAgent || '';
      c.isWeChat = /MicroMessenger/i.test(c.ua);
      c.isIOS = /iPhone|iPad|iPod/i.test(c.ua);
      c.isAndroid = /Android/i.test(c.ua);
    } catch (e) { /* ignore */ }

    c.lowPerf = detectLowPerf();

    BC.compat = c;

    // 输出到 html[data-*]，供 CSS 使用
    try {
      var html = document.documentElement;
      html.setAttribute('data-lowperf', c.lowPerf ? '1' : '0');
      html.setAttribute('data-reduced', c.reducedMotion ? '1' : '0');
      html.setAttribute('data-wechat', c.isWeChat ? '1' : '0');
    } catch (e) { /* ignore */ }

    BC.log('compat', c);
    return c;
  }

  BC.compatDetect = detect;

  // 非浏览器环境（Node 单测）下给出安全默认值
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    BC.compat = {
      webp: false, localStorage: false, pointerEvents: false, canvas: false,
      dpr: 1, reducedMotion: false, share: false, envSafeArea: false,
      lowPerf: false, ua: 'node', isWeChat: false, isIOS: false, isAndroid: false
    };
  }

})(globalThis.BC);
