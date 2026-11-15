/* Critical theme bootstrap.
 * Loaded in <head> so a stored light preference is applied before first paint.
 * The default theme is dark, matching the repository site design.
 */
(function () {
  "use strict";
  var root = document.documentElement;
  try {
    var stored = localStorage.getItem("easycaddy.theme");
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);
  } catch (e) {}
  var theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#141714" : "#f5f2eb");
})();
