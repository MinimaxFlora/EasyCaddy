/* EasyCaddy hero field.
 * A lightweight, dependency-free canvas layer with slow diagonal crawlers.
 * It pauses when the hero is off-screen or the tab is hidden and becomes a
 * static composition under prefers-reduced-motion.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var palette = ["--accent-2", "--blue", "--violet", "--teal"];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var lanes = [];
  var crawlers = [];
  var colors = [];
  var frameId = 0;
  var lastTime = 0;
  var onScreen = true;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function readColors() {
    var style = getComputedStyle(document.documentElement);
    return palette.map(function (name) {
      return style.getPropertyValue(name).trim() || "#7fa98b";
    });
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lanes = [];
    var spacing = Math.max(26, Math.min(52, height / 11));
    for (var y = spacing * 0.55; y < height + spacing; y += spacing) {
      lanes.push({
        y: y,
        slope: random(-0.06, 0.06),
        alpha: random(0.05, 0.1)
      });
    }

    crawlers = [];
    var count = Math.max(10, Math.round(width / 120) + 8);
    for (var i = 0; i < count; i += 1) {
      crawlers.push(makeCrawler(true));
    }
  }

  function makeCrawler(initial) {
    var lane = lanes[Math.floor(Math.random() * lanes.length)];
    return {
      lane: lane,
      x: initial ? random(0, width) : -random(40, 260),
      length: random(60, 190),
      speed: random(12, 42),
      alpha: random(0.18, 0.38),
      lineWidth: random(1.2, 2.8),
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function draw(dt) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";

    for (var l = 0; l < lanes.length; l += 1) {
      var lane = lanes[l];
      ctx.globalAlpha = lane.alpha;
      ctx.strokeStyle = colors[1] || "#7fa98b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lane.y);
      ctx.lineTo(width, lane.y + lane.slope * width);
      ctx.stroke();
    }

    for (var i = 0; i < crawlers.length; i += 1) {
      var crawler = crawlers[i];
      if (!crawler.lane) continue;
      crawler.x += crawler.speed * dt;
      if (crawler.x > width + crawler.length + 20) {
        crawlers[i] = makeCrawler(false);
        continue;
      }
      var lane = crawler.lane;
      var startX = crawler.x;
      var startY = lane.y + lane.slope * startX;
      var endX = startX + crawler.length;
      var endY = lane.y + lane.slope * endX;
      ctx.globalAlpha = crawler.alpha;
      ctx.strokeStyle = crawler.color || colors[0] || "#7fa98b";
      ctx.lineWidth = crawler.lineWidth;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    if (!lastTime) lastTime = time;
    var dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    draw(dt);
    frameId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (frameId || reduceMotion.matches) return;
    lastTime = 0;
    frameId = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function redraw() {
    colors = readColors();
    build();
    draw(0);
  }

  if (typeof window.ResizeObserver === "function") {
    new ResizeObserver(function () {
      redraw();
      if (!reduceMotion.matches && onScreen) start();
    }).observe(canvas);
  } else {
    window.addEventListener("resize", redraw, { passive: true });
  }

  if (typeof window.IntersectionObserver === "function") {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(canvas.parentElement || canvas);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else if (onScreen) start();
  });

  new MutationObserver(function () {
    colors = readColors();
    if (reduceMotion.matches) draw(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  reduceMotion.addEventListener("change", function () {
    stop();
    if (reduceMotion.matches) {
      redraw();
    } else if (onScreen) {
      start();
    }
  });

  colors = readColors();
  build();
  draw(0);
  start();
})();
