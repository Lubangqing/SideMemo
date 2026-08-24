/* =========================================================
 * 侧边便签 v1.0 纯文本版
 * 功能：多行文本便签、编辑/复制/删除、一键粘贴到网页输入框
 * ========================================================= */

const STORAGE_KEY = 'stickyNotes';

// ===== DOM 引用 =====
const $input    = document.getElementById('noteInput');
const $saveBtn  = document.getElementById('saveBtn');
const $clearBtn = document.getElementById('clearBtn');
const $list     = document.getElementById('listContainer');
const $count    = document.getElementById('countText');
const $editHint = document.getElementById('editHint');

// ===== 状态 =====
let editingId = null;  // null=新增模式；否则为当前正在编辑的便签 id

// ===== 工具函数 =====
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function showToast(msg, duration = 1800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ===== 输入框自适应高度（空值回 156px≈6行、增量按 scrollHeight、上限 280px）=====
const TEXTAREA_MIN = 156;
const TEXTAREA_MAX = 280;
function autoResize($el) {
  if (!$el) $el = $input;
  if (!$el) return;
  const value = $el.value || '';
  // 临时重置 height，让 scrollHeight 反映真实内容高度
  $el.style.height = 'auto';
  $el.style.overflowY = 'hidden';
  let target = TEXTAREA_MIN;
  if (value.length > 0) {
    target = Math.max(TEXTAREA_MIN, Math.min(TEXTAREA_MAX, $el.scrollHeight));
  }
  // 内容超过上限则允许内部滚动
  if ($el.scrollHeight > TEXTAREA_MAX) {
    $el.style.overflowY = 'auto';
    target = TEXTAREA_MAX;
  }
  $el.style.height = target + 'px';
}
function bindAutoResize() {
  $input.addEventListener('input', () => autoResize($input));
  // 中文输入法 composition 结束后再算一次，避免换行没提交时高度卡住
  $input.addEventListener('compositionend', () => setTimeout(() => autoResize($input), 0));
  autoResize($input);
}

// ===== 存储读写 =====
async function loadNotes() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return (data && data[STORAGE_KEY] && Array.isArray(data[STORAGE_KEY])) ? data[STORAGE_KEY] : [];
}

async function saveNotes(notes) {
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

// ===== 编辑模式 =====
function exitEditMode(clear = true) {
  editingId = null;
  if (clear) $input.value = '';
  autoResize($input);      // 退出编辑后把高度还原
  $saveBtn.textContent  = '保存';
  $clearBtn.textContent = '清空';
  $editHint.classList.remove('show');
  refreshEditingHighlight();
}

function enterEditMode(id, text) {
  editingId = id;
  $input.value = text;
  autoResize($input);      // 回填老内容立刻撑开高度
  $input.focus();
  // 把光标移到末尾，便于接着改
  try {
    const len = ($input.value || '').length;
    $input.setSelectionRange(len, len);
  } catch (_) { /* 某些旧浏览器忽略 */ }
  $saveBtn.textContent  = '更新';
  $clearBtn.textContent = '取消';
  $editHint.classList.add('show');
  refreshEditingHighlight();
}

function refreshEditingHighlight() {
  const items = $list.querySelectorAll('.note-item');
  items.forEach(el => {
    if (el.dataset.id === editingId) el.classList.add('editing');
    else el.classList.remove('editing');
  });
}

// 兼容：v2.0 的 note.content 是 { html, text } 对象；v1.0 用 string。
function noteToText(n) {
  if (!n) return '';
  if (typeof n.content === 'string') return n.content;
  if (n.content && typeof n.content.text === 'string') return n.content.text;
  return String(n.content || '');
}

// ===== 渲染便签列表 =====
async function renderList() {
  const notes = await loadNotes();
  $count.textContent = `共 ${notes.length} 条`;
  if (notes.length === 0) {
    $list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <div>还没有便签</div>
        <div style="margin-top:4px;">在上方输入内容并点击「保存」开始使用</div>
      </div>`;
    return;
  }
  const sorted = [...notes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  $list.innerHTML = sorted.map(n => {
    const text = noteToText(n);
    const isEditing = (n.id === editingId) ? ' editing' : '';
    const safeText = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\r\n|\r|\n/g, '<br>');
    const timeStr = formatTime(n.updatedAt || n.createdAt);
    return `
      <div class="note-item${isEditing}" data-id="${n.id}">
        <div class="note-content" data-role="paste">${safeText}</div>
        <div class="note-meta">
          <span class="note-time">${timeStr}</span>
          <span class="note-actions">
            <button class="btn btn-small btn-edit"   data-role="edit">编辑</button>
            <button class="btn btn-small btn-copy"   data-role="copy">复制</button>
            <button class="btn btn-small btn-delete" data-role="delete">删除</button>
          </span>
        </div>
      </div>`;
  }).join('');
}

// ===== 保存 / 清空 =====
async function handleSave() {
  const content = $input.value.trim();
  if (!content) { showToast('请输入便签内容'); return; }
  const notes = await loadNotes();
  if (editingId) {
    const idx = notes.findIndex(n => n.id === editingId);
    if (idx < 0) { showToast('该便签不存在'); exitEditMode(); return; }
    notes[idx] = { ...notes[idx], content, updatedAt: Date.now() };
    await saveNotes(notes);
    exitEditMode(false);
    showToast('已更新 ✏️✅');
  } else {
    notes.push({ id: genId(), content, createdAt: Date.now() });
    await saveNotes(notes);
    $input.value = '';
    autoResize($input);      // 保存后清空，高度回 90px
    showToast('已保存 ✅');
  }
  await renderList();
}

async function handleClear() {
  if (editingId) {
    exitEditMode(true);
    showToast('已取消编辑');
  } else {
    $input.value = '';
    autoResize($input);      // 清空后回到默认 90px
    $input.focus();
    showToast('已清空输入');
  }
}

// ===== 复制 =====
async function handleCopy(note) {
  const text = noteToText(note);
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板 📋');
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('已复制到剪贴板 📋');
    } catch (e2) {
      showToast('复制失败：' + (e2 && e2.message));
    }
  }
}

// ===== 删除 =====
async function handleDelete(noteId) {
  const notes = await loadNotes();
  const next = notes.filter(n => n.id !== noteId);
  if (next.length === notes.length) { showToast('未找到该便签'); return; }
  await saveNotes(next);
  if (noteId === editingId) exitEditMode(true);
  await renderList();
  showToast('已删除 🗑️');
}

// ===== 一键粘贴（核心）=====
async function handlePasteToPage(note) {
  const text = noteToText(note);
  if (!text) { showToast('便签内容为空'); return; }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('找不到当前活动标签页');
    if (/^chrome:|^edge:|^about:|^chrome-extension:/.test(tab.url || '')) {
      throw new Error('浏览器内置/设置页面禁止注入脚本');
    }
    // 幂等：保证内容脚本存在
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-inject.js'],
      });
    } catch (_) { /* 忽略：可能已注入或上下文不允许 */ }

    const payload = { type: 'PASTE_TEXT', text };
    const res = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('粘贴超时（页面无响应）')), 4500);
      chrome.tabs.sendMessage(tab.id, payload, (resp) => {
        clearTimeout(t);
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(resp || {});
      });
    });
    if (res && res.ok) showToast(res.toast || '已粘贴 ✅');
    else throw new Error((res && res.error) || '粘贴失败');
  } catch (e) {
    console.error('[侧边便签] 粘贴失败:', e);
    showToast('粘贴失败：' + (e && e.message || String(e)));
  }
}

// ===== 事件委托 =====
$list.addEventListener('click', async (e) => {
  const card = e.target.closest('.note-item');
  if (!card) return;
  const id = card.dataset.id;
  const notes = await loadNotes();
  const note = notes.find(n => n.id === id);
  if (!note) { showToast('便签不存在'); await renderList(); return; }

  const role = e.target.closest('[data-role]')?.dataset?.role || '';
  if      (role === 'delete') { e.stopPropagation(); await handleDelete(id); return; }
  else if (role === 'copy')   { e.stopPropagation(); await handleCopy(note);   return; }
  else if (role === 'edit')   { e.stopPropagation(); enterEditMode(id, noteToText(note)); return; }

  // 点击卡片内容 -> 一键粘贴
  await handlePasteToPage(note);
});

// ===== 按钮事件 =====
$saveBtn.addEventListener('click', handleSave);
$clearBtn.addEventListener('click', handleClear);

// 快捷键：Ctrl/Cmd + Enter 或 Ctrl/Cmd + S 保存
$input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    handleSave();
  }
});

// storage 变化实时同步
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) renderList();
});

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', async () => {
  bindAutoResize();         // 输入框自适应高度（首次调用 + 绑定事件）
  await renderList();
  $input.focus();
});