# SideMemo·侧边便签
> 厌倦了在纷乱的标签页中寻找记事本？SideMemo 将便签功能完美集成在浏览器侧边栏，基于 Chrome 原生 Side Panel API，随叫随到，不占网页视口。

零框架、零依赖，纯原生 HTML + CSS + JavaScript 实现。
<br>
## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 📌 **原生侧边栏** | 基于 Chrome Side Panel API（`chrome.sidePanel`），侧边栏固定在浏览器右侧，非弹窗，浏览网页时始终可见 |
| ⚡ **一键粘贴** | 点击任意便签卡片，内容自动填入当前网页光标所在输入框，告别手动复制粘贴 |
| ✏️ **便签管理** | 新建 / 编辑 / 复制 / 删除，点击编辑按钮即可修改已有便签，卡片高亮提示 |
| 📐 **自适应高度** | 输入框默认 6 行，内容越多自动变高，超过 280px 才出滚动条 |
| 🔄 **多窗口同步** | 基于 `chrome.storage.onChanged`，多个窗口数据实时同步 |
| 🌐 **中英双语** | 根据浏览器系统语言自动切换中英文界面，无需手动设置 |
| ⌨️ **快捷键** | `Ctrl/Cmd + Enter` 或 `Ctrl/Cmd + S` 快速保存 |
| 🔒 **隐私安全** | 所有数据仅存储在本地（`chrome.storage.local`），不上传任何云端 |

---

## 🏗️ 架构概览

```
用户点击工具栏图标
        │
        ▼
  background.js（Service Worker）
  ├── chrome.sidePanel.setPanelBehavior()  ← 安装时配置
  └── chrome.sidePanel.open()              ← 用户手势回调中打开
        │
        ▼
  sidepanel.html / sidepanel.js（侧边栏 UI）
  ├── chrome.storage.local  ← 读写便签数据
  ├── chrome.scripting      ← 点击卡片时注入脚本
  └── i18n.js               ← 中英文自动切换
        │
        ▼
  content-inject.js（网页端注入脚本）
  ├── focusin 事件记忆最后焦点输入框
  └── setRangeText() 将文本插入光标位置
```

---

## 📁 文件结构

```
SideMemo-v1.0/
├── manifest.json              # MV3 扩展配置：权限、Service Worker、Side Panel 路径
├── background.js               # Service Worker：监听图标点击 → 打开侧边栏
├── sidepanel.html             # 侧边栏页面：输入区 + 便签列表 + Toast 提示
├── sidepanel.js               # 侧边栏逻辑：保存/编辑/复制/删除/粘贴/自适应高度
├── content-inject.js          # 网页端脚本：记忆焦点 + setRangeText 插入文本
├── i18n.js                    # 国际化：语言检测 + 中英文语言包
├── _locales/
│   ├── zh_CN/messages.json    # 扩展名/描述（中文）
│   └── en/messages.json       # 扩展名/描述（英文）
├── .gitignore
└── README.md
```

---

## 🚀 安装与使用

### 本地安装
#### Edge 和 Chrome(推荐)

> 确保您下载了 [SideMemo-v1.0.zip](https://github.com/Lubangqing/SideMemo/releases/download/SideMemo/SideMemo-v1.0.zip)。

在 Edge 浏览器中打开 `edge://extensions` 或者在 Chrome 浏览器中打开 `chrome://extensions` 界面，只需将下载的 `SideMemo.zip` 文件拖放到浏览器中即可完成安装。

<details>
 <summary> Edge & Chrome 的另一种安装方法 </summary>

#### Edge

> 确保您下载了  [SideMemo-v1.0.zip](https://github.com/Lubangqing/SideMemo/releases/download/SideMemo/SideMemo-v1.0.zip)。并解压缩该文件。

1. 在地址栏输入 `edge://extensions/` 并按回车
2. 打开 `开发者模式` 并点击 `加载已解压的拓展程序` <br/> <img width="655" alt="image" src="https://user-images.githubusercontent.com/33394391/232246901-e3544c16-bde2-480d-b770-ca5242793963.png">
3. 在浏览器中加载解压后的扩展文件夹

#### Chrome

> 确保您下载了 [SideMemo-v1.0.zip](https://github.com/Lubangqing/SideMemo/releases/download/SideMemo/SideMemo-v1.0.zip) 并解压缩该文件。

1. 在地址栏输入 `chrome://extensions/` 并按回车
2. 打开 `开发者模式` 并点击 `加载已解压的拓展程序` <br/> <img width="655" alt="Snipaste_2022-03-27_18-17-04" src="https://user-images.githubusercontent.com/33394391/160276882-13da0484-92c1-47dd-add8-7655c5c2bf1c.png">
3. 在浏览器中加载解压后的扩展文件夹

### 基本操作

| 操作 | 方式 |
|------|------|
| 打开侧边栏 | 点击工具栏中的便签图标 |
| 新建便签 | 在输入框中输入内容 → 点击「保存」 |
| 编辑便签 | 点击便签卡片上的「编辑」按钮 → 修改后点击「更新」 |
| 复制便签 | 点击「复制」按钮，内容写入系统剪贴板 |
| 一键粘贴 | 先在网页输入框中点击放置光标 → 回侧边栏点击便签卡片 |
| 删除便签 | 点击「删除」按钮 |
| 快捷保存 | `Ctrl/Cmd + Enter` 或 `Ctrl/Cmd + S` |

---

## 🔧 技术栈

- **Manifest V3** — 浏览器扩展最新规范
- **Chrome Extensions API**
  - `chrome.sidePanel` — 侧边栏控制
  - `chrome.storage.local` — 数据持久化
  - `chrome.scripting.executeScript` — 动态注入内容脚本
  - `chrome.tabs.sendMessage` — 扩展与网页的跨上下文消息通信
  - `chrome.action.onClicked` — 工具栏图标点击事件
  - `chrome.i18n.getUILanguage` — 检测系统语言实现自动切换
- **原生 HTML + CSS + JavaScript** — 零框架、零依赖、零构建步骤
- **事件委托** — 动态生成卡片的统一事件处理
- **`setRangeText` API** — 精准将文本插入输入框光标位置（替代直接赋值 `value`，兼容 React/Vue 等框架）

### 权限说明

| 权限 | 用途 |
|------|------|
| `sidePanel` | 使用浏览器侧边栏 API |
| `storage` | 本地存储便签数据 |
| `activeTab` | 获取当前活动标签页信息 |
| `scripting` | 动态注入 content-inject.js |
| `clipboardWrite` | 复制便签到系统剪贴板 |
| `<all_urls>` (host) | 向任意网页注入脚本实现一键粘贴 |

---

## 💾 数据结构

便签以 JSON 数组存储于 `chrome.storage.local`，key 为 `stickyNotes`：

```json
{
  "notes": [
    {
      "id": "lz3f1a2b3c4d",
      "content": "便签文本内容",
      "createdAt": 1787534052000,
      "updatedAt": 1787534100000
    }
  ]
}
```

---

## 🌐 国际化（i18n）

插件根据浏览器系统语言自动切换中英文界面，无需手动设置：

- **中文系统** → 全中文界面（侧边便签 v1.0）
- **英文系统** → 全英文界面（SideMemo）

覆盖范围：扩展名、侧边栏标题、所有按钮、Toast 提示、空状态文案、错误消息。

---

## 📌 设计要点

### 为什么用 Side Panel 而非 Popup？

Popup（弹窗）在点击页面其他位置时会关闭，无法保持常驻。Side Panel API 允许侧边栏固定在浏览器右侧，浏览网页时始终可见，更适合便签场景。

### 为什么用 `setRangeText` 而非直接赋值 `value`？

直接赋值 `el.value = newText` 会丢失光标位置，且不触发 React/Vue 的响应式更新。`setRangeText` 在光标位置插入文本，并通过 `dispatchEvent` 触发 `input` / `change` 事件，兼容现代前端框架。

### 为什么 content-inject.js 要记忆 `lastFocused`？

用户点击侧边栏时，`document.activeElement` 会变成 `body`，导致无法知道用户之前在哪个输入框。通过 `focusin` 事件监听并记住最后聚焦的可编辑元素，点击卡片时即可回填到正确的输入框。

---

## 🗺️ 路线图

- [x] 侧边栏展示 + 便签管理（保存/编辑/复制/删除）
- [x] 一键粘贴到网页输入框
- [x] 输入框自适应高度
- [x] 中英文双语自动切换
- [ ] 暗黑模式
- [ ] Markdown 支持
- [ ] 便签搜索 / 置顶 / 分类
- [ ] 数据导入 / 导出（JSON）

---

## 📄 License

MIT
