# 词海工具箱

![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![API](https://img.shields.io/badge/open--api-6%20endpoints-orange) ![Rate Limit](https://img.shields.io/badge/rate%20limit-100%2Fday%2FIP-red) ![Status](https://img.shields.io/badge/status-%E6%8C%81%E7%BB%AD%E6%9B%B4%E6%96%B0%E4%B8%AD-success)

> 简单实用的免费在线工具大全 · 零依赖 · 纯前端本地处理 · 附开放 API · **每天持续更新**

85 款在线小工具：图片处理、文本转换、加密编码、日期计算、生活查询等。所有工具在浏览器本地完成，不上传用户数据。

🔥 **本项目持续更新中**：不定期新增工具与 API 接口，点右上角 **Star** 关注，不错过每一次更新。最新动态见[更新日志](https://tools.hdemba.cn/tools/changelog.html)。

---

## 📡 开放 API

免费开放的轻量计算接口，**无需注册**。已开启 CORS，可直接在浏览器前端调用。

**Base URL**

```
https://tools.hdemba.cn/api
```

**通用约定**

- 支持 `GET`（query 传参）与 `POST`（JSON body 传参），二者可混用
- 响应统一为 JSON：

```json
// 成功
{ "ok": true, "data": { ... } }

// 失败
{ "ok": false, "error": "错误原因" }
```

### 🔒 限流规则

每个 IP 每天可调用 **100 次**，次日 0 点（UTC+8）自动重置。

| 响应头 | 说明 |
| --- | --- |
| `X-RateLimit-Limit` | 每日配额（100） |
| `X-RateLimit-Remaining` | 当日剩余次数 |
| `X-RateLimit-Reset` | 重置时间 |

超限返回 `429 Too Many Requests`：

```json
{ "ok": false, "error": "今日调用次数已达上限（100 次/天），明日 0 点重置" }
```

### 📖 接口列表

| 接口 | 说明 | 参数 |
| --- | --- | --- |
| `GET /api/md5` | MD5 加密（32 位 / 16 位） | `text` 文本 |
| `GET /api/sha256` | SHA 哈希，`alg` 可选 `sha1`/`sha256`/`sha512` | `text` 文本 |
| `GET /api/base64` | Base64 编码 / 解码 | `text`、`mode`=`encode`\|`decode` |
| `GET /api/url` | URL 编码 / 解码 | `text`、`mode`=`encode`\|`decode` |
| `GET /api/timestamp` | 时间戳转日期，缺省为当前时间 | `ts` 秒级/毫秒级均可 |
| `GET /api/uuid` | 批量生成 UUID v4 | `n` 数量（1–50） |

### 🧪 调用示例

```bash
curl "https://tools.hdemba.cn/api/md5?text=hello"
```

```json
{
  "ok": true,
  "data": {
    "text": "hello",
    "md5": "5d41402abc4b2a76b9719d911017c592",
    "md5_16": "bc4b2a76b9719d91"
  }
}
```

```bash
curl "https://tools.hdemba.cn/api/timestamp?ts=1695456000"
```

```json
{
  "ok": true,
  "data": {
    "timestamp": 1695456000,
    "datetime": "2023-09-23 16:00:00",
    "iso": "2023-09-23T08:00:00.000Z",
    "weekday": "六"
  }
}
```

**JavaScript 调用**

```js
const res = await fetch("https://tools.hdemba.cn/api/base64?text=hello&mode=encode");
const { ok, data } = await res.json();
console.log(data.result); // aGVsbG8=
```

### ⚠️ 使用条款

- 免费开放，请勿用于非法用途或高频滥用
- MD5 / SHA 为单向哈希，仅用于数据校验，不可作密码存储方案
- 接口持续增加中，欢迎提 Issue / PR

---

## 🚀 本地部署

```bash
git clone https://github.com/hexiaofu666/free-api.git
cd free-api
node server.js
# 打开 http://localhost:8080
```

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8080` | 服务端口 |
| `API_DAILY_LIMIT` | `100` | 每 IP 每日 API 调用上限 |

- 零 npm 依赖，只要 Node.js ≥ 14 即可运行
- API 调用计数持久化在 `data/usage-<日期>.json`，按日分文件

## 📁 目录结构

```
├── index.html          # 首页（分类导航 + 搜索 + 卡片墙）
├── server.js           # Node 服务：静态托管 + 开放 API + 限流
├── assets/
│   ├── tools-data.js   # 工具注册清单（加新工具只需加一行）
│   ├── chrome.js       # 内页公共骨架（导航/顶栏/分享/推荐/页脚）
│   ├── theme.js        # 夜间模式（localStorage 记忆）
│   ├── style.css       # 全站样式（含暗色主题）
│   └── lib/            # 第三方库（qrcode 等）
├── tools/              # 84+ 工具页（一工具一页面）
└── data/               # API 限流计数（自动生成）
```

## 🛠 添加新工具

1. 在 `tools/` 下新建 `xxx.html`（复制现有工具页做模板，`body` 上写 `data-tool="xxx"`）
2. 在 `assets/tools-data.js` 的 `TOOLS` 数组加一行注册信息
3. 完成——导航、搜索、相关推荐、分享、夜间模式自动生效

## 📄 License

[MIT](LICENSE)
