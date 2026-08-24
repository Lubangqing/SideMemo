/**
 * background.js - Service Worker（Manifest V3）
 * 职责：
 *   1. 扩展安装/启动时，配置 Side Panel 的基本行为
 *   2. 监听工具栏图标（action）点击事件，打开侧边栏
 *
 * 注意：MV3 中 background 是 Service Worker，事件驱动、会休眠。
 *       chrome.sidePanel.open() 必须在用户手势回调中调用，
 *       放在 chrome.action.onClicked 中是最合规且可靠的方式。
 */

// ───────── 扩展安装时初始化 ─────────
chrome.runtime.onInstalled.addListener(() => {
  // 配置 Side Panel 行为：允许通过工具栏图标打开
  // openPanelOnActionClick = true 时，点击图标即自动打开侧边栏
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {
      console.error('[侧边便签] 设置 Side Panel 行为失败:', error);
    });
});

// ───────── 工具栏图标点击：兜底打开侧边栏 ─────────
// 某些 Edge/Chrome 版本或配置下，setPanelBehavior 可能不生效，
// 这里在 onClicked 中手动调用 open，确保用户每次点击图标都能打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
    await chrome.sidePanel.open({ windowId });
  } catch (error) {
    console.error('[侧边便签] 打开侧边栏失败:', error);
  }
});