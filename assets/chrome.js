/* ============================================================
   内页公共骨架：左侧导航 + 顶栏 + 相关推荐 + 页脚
   用法（工具页）：
   <body data-tool="tomato" data-cat="life">
   ...页面内容...
   <script src="../assets/tools-data.js"></script>
   <script src="../assets/chrome.js"></script>
   ============================================================ */
(function () {
  const P = "../"; // 工具页都在 tools/ 下
  const GITHUB_URL = "https://github.com/hexiaofu666/free-api"; 
  const GITHUB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>';
  const cat  = document.body.dataset.cat  || "";
  const tool = document.body.dataset.tool || "";

  /* ---------- 左侧导航 ---------- */
  const navHtml = `
  <div class="left-nav" id="leftNav">
    <div class="logo"><a href="${P}index.html">词海工具箱</a></div>
    <ul class="nav">
      ${CATS.map(c => `
      <li><a class="${c.id === cat ? "act" : ""}" href="${P}index.html#${c.id}">
        <i class="ico layui-icon ${NAV_ICONS[c.id] || "layui-icon-app"}"></i><span>${c.name}</span></a></li>`).join("")}
    </ul>
  </div>`;

  /* ---------- 顶栏 ---------- */
  const headHtml = `
  <div class="head_div">
    <i class="headerbut menu-btn" id="menuBtn"><i class="layui-icon layui-icon-spread-left"></i></i>
    <div class="search_div">
      <div class="search" id="searchBox">
        <span class="search-tip">共<strong>${TOOLS.length}</strong>款工具，持续更新中</span>
        <input type="text" id="searchInput" title="工具搜索">
        <i class="search-icon"><i class="layui-icon layui-icon-search"></i></i>
      </div>
    </div>
    <div class="headbut">
      <i class="headerbut" title="夜间模式" id="nightBtn"><i class="layui-icon layui-icon-moon"></i></i>
      <a class="headerbut" title="更新日志" href="${P}tools/changelog.html"><i class="layui-icon layui-icon-log"></i></a>
      <a class="headerbut" title="GitHub 仓库" href="${GITHUB_URL}" target="_blank" rel="noopener">${GITHUB_SVG}</a>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("afterbegin", navHtml + headHtml);

  /* ---------- 工具信息条（由 data-tool 自动生成） ---------- */
  const toolsBox = document.querySelector(".tools");
  const info = TOOLS.find(t => t.id === tool);
  if (toolsBox && info) {
    toolsBox.insertAdjacentHTML("afterbegin", `
      <div class="tools-info">
        <i class="imgs layui-icon ${info.ico}" style="background:${info.color}"></i>
        <div>
          <div class="title"><h1>${info.name}</h1></div>
          <p class="pingfens">
            <i class="layui-icon layui-icon-rate-solid"></i><i class="layui-icon layui-icon-rate-solid"></i><i class="layui-icon layui-icon-rate-solid"></i><i class="layui-icon layui-icon-rate-solid"></i><i class="layui-icon layui-icon-rate-solid"></i>
            <span>5.0</span>
          </p>
        </div>
        <i class="layui-icon layui-icon-share sharetool" title="分享" onclick="XFShare.open()"></i>
      </div>`);
  }

  /* 搜索：回车跳回首页搜索 */
  const si = document.getElementById("searchInput");
  si.addEventListener("keydown", e => {
    if (e.key === "Enter" && si.value.trim())
      location.href = `${P}index.html?kw=${encodeURIComponent(si.value.trim())}`;
  });
  si.addEventListener("focus", () => document.getElementById("searchBox").classList.add("focused"));
  si.addEventListener("blur", () => { if (!si.value) document.getElementById("searchBox").classList.remove("focused"); });
  /* 菜单按钮：桌面端收缩/展开导航，移动端开合抽屉 */
  const bodyEl = document.body;
  const mqDesktop = window.matchMedia("(min-width: 769px)");
  try { if (localStorage.getItem("xf_nav") === "collapsed") bodyEl.classList.add("nav-collapsed"); } catch (e) {}
  document.getElementById("menuBtn").onclick = () => {
    if (mqDesktop.matches) {
      const collapsed = bodyEl.classList.toggle("nav-collapsed");
      try { localStorage.setItem("xf_nav", collapsed ? "collapsed" : "open"); } catch (e) {}
    } else {
      document.getElementById("leftNav").classList.toggle("open");
    }
  };

  /* 夜间模式 */
  const nb = document.getElementById("nightBtn");
  const setNightIcon = () => {
    nb.firstElementChild.className = "layui-icon " + (XFTheme.isDark() ? "layui-icon-light" : "layui-icon-moon");
  };
  nb.onclick = () => { XFTheme.toggle(); setNightIcon(); };
  setNightIcon();

  /* ---------- 相关推荐（同分类的其他工具，最多 3 个） ---------- */
  if (toolsBox && tool) {
    const related = TOOLS.filter(t => t.cat === cat && t.id !== tool).slice(0, 3);
    if (related.length) {
      toolsBox.insertAdjacentHTML("beforeend", `
        <div class="related">
          <h1 class="moder_h2"><i>●</i>相关工具</h1>
          <ul class="moder">
            ${related.map(t => `
            <li><a href="${t.id}.html">
              <i class="imgs layui-icon ${t.ico}" style="background:${t.color}"></i>
              <div><h3>${t.name}</h3><p>${t.desc}</p></div>
            </a></li>`).join("")}
          </ul>
        </div>`);
    }
  }

  /* ---------- 页脚 ---------- */
  document.body.insertAdjacentHTML("beforeend",
    `<footer class="footer">词海工具箱 · 简单实用的免费在线工具</footer>`);

  /* ---------- 分享弹层 ---------- */
  window.XFShare = {
    _built: false,
    open() {
      if (!this._built) this._build();
      document.getElementById("shareMask").classList.add("on");
      this._qr();
    },
    close() { document.getElementById("shareMask").classList.remove("on"); },
    _build() {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="share-mask" id="shareMask" onclick="if(event.target===this)XFShare.close()">
          <div class="share-panel">
            <i class="layui-icon layui-icon-close share-x" onclick="XFShare.close()"></i>
            <h3>分享给朋友</h3>
            <div class="share-qr" id="shareQr"></div>
            <p>微信扫一扫，在手机上打开</p>
            <div class="sp-btns">
              <button class="fbtn orange" id="shareCopy">复制链接</button>
              <button class="fbtn plain" id="shareSys" style="display:none;">更多分享</button>
            </div>
          </div>
        </div>`);
      this._built = true;
      document.getElementById("shareCopy").onclick = async () => {
        const url = location.href;
        try { await navigator.clipboard.writeText(url); }
        catch (e) {
          const ta = document.createElement("textarea");
          ta.value = url; document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
        }
        const b = document.getElementById("shareCopy");
        b.textContent = "已复制 ✓";
        setTimeout(() => b.textContent = "复制链接", 1500);
      };
      if (navigator.share) {
        const sb = document.getElementById("shareSys");
        sb.style.display = "block";
        sb.onclick = () => navigator.share({ title: document.title, url: location.href }).catch(() => {});
      }
    },
    _qr() {
      const box = document.getElementById("shareQr");
      box.innerHTML = "";
      this._loadQrLib(() => {
        try {
          const qr = qrcode(0, "M");
          qr.addData(location.href);
          qr.make();
          box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0 });
        } catch (e) {
          box.innerHTML = '<span style="font-size:12px;color:#999;">二维码生成失败</span>';
        }
      });
    },
    _loadQrLib(cb) {
      if (window.qrcode) return cb();
      const s = document.createElement("script");
      s.src = "../assets/lib/qrcode.js";
      s.onload = cb;
      s.onerror = () => {
        document.getElementById("shareQr").innerHTML =
          '<span style="font-size:12px;color:#999;">二维码组件加载失败</span>';
      };
      document.head.appendChild(s);
    }
  };
})();
