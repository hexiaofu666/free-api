/* ============================================================
   夜间模式：html.dark + localStorage 记忆
   用法：theme.js 在 <head> 引入（避免刷新闪白）
   按钮：XFTheme.toggle()
   ============================================================ */
(function () {
  const KEY = "xf_theme";
  let dark = false;
  try { dark = localStorage.getItem(KEY) === "dark"; } catch (e) {}
  if (dark) document.documentElement.classList.add("dark");

  window.XFTheme = {
    isDark: () => document.documentElement.classList.contains("dark"),
    toggle: () => {
      const d = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", d);
      try { localStorage.setItem(KEY, d ? "dark" : "light"); } catch (e) {}
      return d;
    }
  };
})();
