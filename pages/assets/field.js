/* EasyCaddy hero field.
 * An original isometric lattice with slow traveling capsules, inspired by the
 * FlClash site's field visual. It is dependency-free, pauses off-screen, and
 * draws a static composition under prefers-reduced-motion.
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
  var lattice = [];
  var capsules = [];
  var frameId = 0;
  var lastTime = 0;
  var onScreen = true;
  var slope = Math.tan(Math.PI / 6); // 30 degrees

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function readColors() {
    var style = getComputedStyle(document.documentElement);
    var values = fieldVars.map(function (name) {
      return style.getPropertyValue(name).trim();
    });
    return values.filter(Boolean);
  }

  function lineAt(x, offset, direction) {
    return offset + direction * slope * x;
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var spacing = Math.max(24, Math.min(46, width * 0.032));
    lattice = [];
    for (var offset = -width * slope - spacing; offset < height + spacing; offset += spacing) {
      lattice.push({ offset: offset, direction: 1 });
    }
    for (var cross = -height; cross < height + width * slope + spacing; cross += spacing) {
      lattice.push({ offset: cross, direction: -1 });
    }

    capsules = [];
    var count = Math.max(14, Math.round(width / 105) + 8);
    for (var i = 0; i < count; i += 1) {
      capsules.push(makeCapsule(true));
    }
  }

  function makeCapsule(initial) {
    var direction = Math.random() < 0.75 ? 1 : -1;
    var laneOffset = direction === 1
      ? random(-height * 0.3, height + height * 0.2)
      : random(-height * 0.4, height);
    return {
      direction: direction,
      offset: laneOffset,
      x: initial ? random(-width * 0.1, width * 1.1) : (direction === 1 ? -random(40, 220) : width + random(40, 220)),
      length: random(42, 176),
      speed: random(11, 38),
      alpha: random(0.36, 0.66),
      lineWidth: random(1.2, 2.8),
      color: colors[Math.floor(Math.random() * colors.length)] || "#a2b09b",
      wobble: random(0.5, 1.8),
      phase: random(0, Math.PI * 2)
    };
  }

  function draw(time, dt) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";

    // Faint isometric lattice.
    for (var i = 0; i < lattice.length; i += 1) {
      var lane = lattice[i];
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = colors[3] || colors[4] || "#a2b09b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lane.offset);
      ctx.lineTo(width, lane.offset + lane.direction * slope * width);
      ctx.stroke();
    }

    // Traveling capsules along the +30 degree lanes.
    for (var c = 0; c < capsules.length; c += 1) {
      var capsule = capsules[c];
      var direction = capsule.direction;
      capsule.x += direction * capsule.speed * (dt / 0.016);
      if (direction === 1 && capsule.x > width + capsule.length + 40) {
        capsules[c] = makeCapsule(false);
        continue;
      }
      if (direction === -1 && capsule.x < -capsule.length - 40) {
        capsules[c] = makeCapsule(false);
        continue;
      }

      var wobble = 1 + 0.16 * Math.sin(time * 0.001 * capsule.wobble + capsule.phase);
      var length = capsule.length * wobble;
      var startX = capsule.x;
      var startY = lineAt(startX, capsule.offset, direction);
      var endX = startX + direction * length;
      var endY = lineAt(endX, capsule.offset, direction);

      ctx.globalAlpha = capsule.alpha;
      ctx.strokeStyle = capsule.color;
      ctx.lineWidth = capsule.lineWidth;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // A slightly brighter head makes the motion readable without a glow.
      ctx.globalAlpha = Math.min(0.7, capsule.alpha + 0.16);
      ctx.lineWidth = capsule.lineWidth * 0.85;
      ctx.beginPath();
      ctx.moveTo(endX - direction * 3, endY - direction * slope * 3);
      ctx.lineTo(endX, endY);
      ctx.stroke();
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
    colors = readColors();
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
    if (reduceMotion.matches) draw(performance.now(), 0);
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
  draw(performance.now(), 0);
  start();
})();
