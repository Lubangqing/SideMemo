/* =========================================================
 * 侧边便签 v1.0 content-inject.js（纯文本粘贴）
 * 作用：把侧边栏发来的 PASTE_TEXT 写入当前页面光标所在 input/textarea
 * ========================================================= */
(function () {
  if (window.__stickyNotesV1Injected) return;
  window.__stickyNotesV1Injected = true;

  // 记住用户最后点击过的可编辑元素
  // 原因：点击侧边栏会让 document.activeElement 变成 body
  let lastFocused = null;
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (isTextEditable(el)) lastFocused = el;
  }, true);

  function isTextEditable(el) {
    if (!el) return false;
    if (el.disabled || el.readOnly) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      return /^(text|search|url|tel|email|password|number|)$/.test(t);
    }
    return false;
  }

  function pasteIntoPlain(el, text) {
    el.focus();
    if (typeof el.setRangeText === 'function' && el.selectionStart !== undefined) {
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      el.setRangeText(text, start, end, 'end');
      const pos = start + text.length;
      try { el.setSelectionRange(pos, pos); } catch (_) {}
    } else {
      el.value = (el.value || '') + text;
    }
    fireEvents(el);
    return true;
  }

  function fireEvents(el) {
    try { el.dispatchEvent(new Event('input',  { bubbles: true })); } catch (_) {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
  }

  function doPaste(text) {
    const target = (isTextEditable(document.activeElement) ? document.activeElement : null)
                || (isTextEditable(lastFocused) ? lastFocused : null);
    if (!target) return { ok: false, error: 'no-active-el' };
    try {
      pasteIntoPlain(target, text);
      return { ok: true, toast: '已粘贴到输入框 ✅', mode: 'plain' };
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'plain-paste-exception' };
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== 'PASTE_TEXT') return false;
    const res = doPaste(msg.text || '');
    sendResponse(res);
    return true;
  });
})();