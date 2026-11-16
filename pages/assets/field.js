/* EasyCaddy hero field.
 * Muted capsules and dots drift across the hero on diagonal paths, inspired by
 * the FlClash site's field visual. Original implementation: no GPL code is
 * copied. It pauses off-screen and becomes static under reduced motion.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fieldVars = ["--field-1", "--field-2", "--field-3", "--field-4", "--field-5", "--field-6"];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var colors = [];
  var capsules = [];
  var dots = [];
  var boxes = [];
  var frameId = 0;
  var lastTime = 0;
  var onScreen = true;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function readColors() {
    var style = getComputedStyle(document.documentElement);
    return fieldVars.map(function (name) {
      return style.getPropertyValue(name).trim();
    }).filter(Boolean);
  }

  function readBoxes() {
    var canvasRect = canvas.getBoundingClientRect();
    boxes = [];
    var selectors = ".eyebrow, .display, .lede, .cta, .hero-meta, .terminal, .stats";
    document.querySelectorAll(selectors).forEach(function (node) {
      var rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      boxes.push({
        left: rect.left - canvasRect.left + 8,
        right: rect.right - canvasRect.left - 8,
        top: rect.top - canvasRect.top + 8,
        bottom: rect.bottom - canvasRect.top - 8
      });
    });
  }

  function inBox(x, y) {
    for (var i = 0; i < boxes.length; i += 1) {
      var box = boxes[i];
      if (x > box.left && x < box.right && y > box.top && y < box.bottom) return true;
    }
    return false;
  }

  function makeCapsule(initial) {
    var angle = (Math.random() < 0.5 ? 1 : -1) * random(0.36, 0.62);
    var color = colors[Math.floor(Math.random() * colors.length)] || "#a2b09b";
    return {
      x: initial ? random(width * 0.08, width * 0.92) : random(0, width),
      y: initial ? random(height * 0.08, height * 0.92) : random(0, height),
      angle: angle,
      length: random(72, 196),
      thickness: random(18, 34),
      speed: random(5, 14),
      alpha: random(0.45, 0.78),
      color: color,
      phase: random(0, Math.PI * 2),
      wobble: random(0.7, 1.8)
    };
  }

  function makeDot(initial) {
    return {
      x: initial ? random(width * 0.06, width * 0.94) : random(0, width),
      y: initial ? random(height * 0.06, height * 0.94) : random(0, height),
      angle: random(0, Math.PI * 2),
      radius: random(6, 17),
      speed: random(3, 9),
      alpha: random(0.5, 0.82),
      color: colors[Math.floor(Math.random() * colors.length)] || "#98a9b8"
    };
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    colors = readColors();
    readBoxes();

    capsules = [];
    var capsuleCount = Math.max(9, Math.round(width / 145));
    for (var i = 0; i < capsuleCount; i += 1) {
      capsules.push(makeCapsule(true));
    }
    dots = [];
    for (var d = 0; d < 6; d += 1) {
      dots.push(makeDot(true));
    }
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  function wrap(shape, margin) {
    var pad = margin + 260;
    if (shape.x < -pad) shape.x = width + pad;
    if (shape.x > width + pad) shape.x = -pad;
    if (shape.y < -pad) shape.y = height + pad;
    if (shape.y > height + pad) shape.y = -pad;
  }

  function draw(time, dt) {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < capsules.length; i += 1) {
      var capsule = capsules[i];
      capsule.x += Math.cos(capsule.angle) * capsule.speed * dt;
      capsule.y += Math.sin(capsule.angle) * capsule.speed * dt;
      wrap(capsule, capsule.length);
      if (inBox(capsule.x, capsule.y)) continue;

      var breathe = 1 + 0.07 * Math.sin(time * 0.001 * capsule.wobble + capsule.phase);
      var length = capsule.length * breathe;
      ctx.save();
      ctx.translate(capsule.x, capsule.y);
      ctx.rotate(capsule.angle);
      ctx.globalAlpha = capsule.alpha;
      ctx.fillStyle = capsule.color;
      roundedRect(-length / 2, -capsule.thickness / 2, length, capsule.thickness, capsule.thickness / 2);
      ctx.fill();
      ctx.restore();
    }

    for (var d = 0; d < dots.length; d += 1) {
      var dot = dots[d];
      dot.x += Math.cos(dot.angle) * dot.speed * dt;
      dot.y += Math.sin(dot.angle) * dot.speed * dt;
      wrap(dot, dot.radius);
      if (inBox(dot.x, dot.y)) continue;
      ctx.globalAlpha = dot.alpha;
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    if (!lastTime) lastTime = time;
    var dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    draw(time, dt);
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
    build();
    draw(performance.now(), 0);
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
    for (var i = 0; i < capsules.length; i += 1) {
      capsules[i].color = colors[Math.floor(Math.random() * colors.length)] || capsules[i].color;
    }
    for (var d = 0; d < dots.length; d += 1) {
      dots[d].color = colors[Math.floor(Math.random() * colors.length)] || dots[d].color;
    }
    if (reduceMotion.matches) draw(performance.now(), 0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  reduceMotion.addEventListener("change", function () {
    stop();
    if (reduceMotion.matches) redraw(); else if (onScreen) start();
  });

  colors = readColors();
  build();
  draw(performance.now(), 0);
  start();
})();
