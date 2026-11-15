/* EasyCaddy repository site interactions.
 * Theme toggle, mobile navigation, tabs, copy buttons, scroll progress.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var progress = document.getElementById("progress");
  var nav = document.getElementById("nav");
  function tr(key, fallback) {
    return (window.EasyCaddyI18n && window.EasyCaddyI18n.t(key)) || fallback;
  }

  /* Theme ---------------------------------------------------------------- */
  var themeBtn = document.getElementById("theme");
  function storeTheme(value) {
    try { localStorage.setItem("easycaddy.theme", value); } catch (e) {}
  }
  function currentDark() {
    if (root.dataset.theme === "dark") return true;
    if (root.dataset.theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function updateThemeMeta(theme) {
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#141714" : "#f5f2eb");
  }
  updateThemeMeta(currentDark() ? "dark" : "light");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentDark() ? "light" : "dark";
      root.dataset.theme = next;
      updateThemeMeta(next);
      storeTheme(next);
    });
  }

  /* Scroll progress + sticky nav ---------------------------------------- */
  var ticking = false;
  function updateScroll() {
    var max = root.scrollHeight - root.clientHeight;
    var top = window.scrollY || root.scrollTop || 0;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(top / max, 1) : 0) + ")";
    if (nav) nav.classList.toggle("scrolled", top > 8);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener("resize", updateScroll, { passive: true });
  updateScroll();

  /* Mobile menu ---------------------------------------------------------- */
  var menuBtn = document.getElementById("menu");
  var mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      var open = mobileMenu.hasAttribute("hidden");
      if (open) mobileMenu.removeAttribute("hidden"); else mobileMenu.setAttribute("hidden", "");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? tr("nav.closeMenu", "关闭导航菜单") : tr("nav.menu", "打开导航菜单"));
    });
    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        mobileMenu.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Tabs ----------------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.tabIndex = selected ? 0 : -1;
      var panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) {
        panel.classList.toggle("active", selected);
        if (selected) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      }
    });
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (event) {
      var next = null;
      if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); selectTab(next); next.focus(); }
    });
  });

  /* Copy buttons --------------------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy") ? resolve() : reject(new Error("copy failed")); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(area); }
    });
  }
  function flash(button, label) {
    if (button.dataset.busy) return;
    button.dataset.busy = "1";
    var labelKey = button.getAttribute("data-i18n");
    button.textContent = label || tr("misc.copied", "已复制");
    button.classList.add("done");
    window.setTimeout(function () {
      button.textContent = labelKey ? tr(labelKey, button.textContent) : tr("misc.copy", "复制");
      button.classList.remove("done");
      delete button.dataset.busy;
    }, 1600);
  }
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-copy")).then(function () { flash(button); }, function () { flash(button, tr("misc.copyFailed", "复制失败")); });
    });
  });
  document.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.getElementById(button.getAttribute("data-copy-target"));
      if (!target) return;
      copyText(target.textContent.trim()).then(function () { flash(button); }, function () { flash(button, tr("misc.copyFailed", "复制失败")); });
    });
  });

})();
