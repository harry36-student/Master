/**
 * ui.js — DOM 操作與 UI 更新函式
 * Lung Cancer Analysis System
 *
 * 負責所有 DOM 操作，與業務邏輯（app.js）分離。
 */

// ══════════════════════════════════════════════
// 影像預覽與顯示
// ══════════════════════════════════════════════

/**
 * 在 DropZone 區域顯示已選取影像的預覽
 * 🔥 使用 DOM API 設定 img.src ，避免在 innerHTML 中直接嵌入 data URI
 *    （data URI 含有特殊字元，如 "+/=" 在 HTML attr 中可能被事件覣析器切斷）
 */
function showImagePreview(base64, filename, width, height, sizeBytes) {
  const previewContainer = document.getElementById('image-preview-container');
  const dropzone = document.getElementById('dropzone');

  if (!previewContainer) return;

  const sizeText = formatFileSize(sizeBytes);
  const dimensionText = `${width} × ${height} px`;

  // 🔥 關鍵修復：屈層建立 DOM 元素，不用 innerHTML 嵌入 data URI
  const wrapper = document.createElement('div');
  wrapper.className = 'image-preview';
  wrapper.setAttribute('role', 'img');
  wrapper.setAttribute('aria-label', `已上傳影像：${filename}`);

  const img = document.createElement('img');
  img.src = base64;  // 直接設定，不經過 HTML 解析
  img.alt = filename;
  img.onerror = () => console.error('[showImagePreview] 影像載入失敗，src 前 80 字元:', (img.src || '').slice(0, 80));

  const info = document.createElement('div');
  info.className = 'image-preview__info';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'text-truncate';
  nameSpan.title = filename;
  nameSpan.textContent = filename;

  const metaSpan = document.createElement('span');
  metaSpan.textContent = `${dimensionText} · ${sizeText}`;

  info.appendChild(nameSpan);
  info.appendChild(metaSpan);
  wrapper.appendChild(img);
  wrapper.appendChild(info);

  previewContainer.innerHTML = '';
  previewContainer.appendChild(wrapper);
  previewContainer.classList.remove('hidden');

  if (dropzone) {
    dropzone.classList.add('dropzone--has-file');
    const dropzoneText = dropzone.querySelector('.dropzone__text');
    if (dropzoneText) dropzoneText.textContent = '點擊或拖放以更換影像';
  }
}

/**
 * 顯示原始影像
 * 🔥 展示區中心的 Original Image 卡片
 */
function showOriginalImage(src) {
  const img = document.getElementById('original-image');
  const placeholder = document.getElementById('original-image-placeholder');
  const card = document.getElementById('original-image-card');

  if (img) {
    img.src = src;
    // 🔥 index.html 已改用 .hidden class，直接移除即可（不需要 !important）
    img.classList.remove('hidden');
    img.onerror = () => console.error('[showOriginalImage] 影像載入失敗，src 前 80 字元:', (img.src || '').slice(0, 80));
  }
  
  if (placeholder) {
    placeholder.classList.add('hidden');
  }
  
  if (card) {
    card.classList.remove('hidden');
  }
}
/**
 * 顯示 Federated (FL) 熱力圖
 */
function showFederatedHeatmap(base64) {
  const img = document.getElementById('heatmap-federated-image');
  const placeholder = document.getElementById('heatmap-federated-placeholder');
  const card = document.getElementById('heatmap-federated-card');

  if (img) {
    // 🔥 base64 可能已含 data: 前綴（後端 pil_to_base64 回傳完整 URI）
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    img.classList.remove('hidden');
    img.onerror = () => console.error('[showFederatedHeatmap] 熱力圖載入失敗，src 前 80 字元:', (img.src || '').slice(0, 80));
  }
  if (placeholder) placeholder.classList.add('hidden');
  if (card) card.classList.remove('hidden');
}

/**
 * 顯示 Local Baseline 熱力圖
 */
function showLocalBaselineHeatmap(base64) {
  const img = document.getElementById('heatmap-local-image');
  const placeholder = document.getElementById('heatmap-local-placeholder');
  const card = document.getElementById('heatmap-local-card');

  if (img) {
    // 🔥 base64 可能已含 data: 前綴（後端 pil_to_base64 回傳完整 URI）
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    img.classList.remove('hidden');
    img.onerror = () => console.error('[showLocalBaselineHeatmap] 熱力圖載入失敗，src 前 80 字元:', (img.src || '').slice(0, 80));
  }
  if (placeholder) placeholder.classList.add('hidden');
  if (card) card.classList.remove('hidden');
}

// ══════════════════════════════════════════════
// 進度步驟指示器
// ══════════════════════════════════════════════

function updateProgressStep(step, status = 'active') {
  const stepMap = { classifying: 1, generating_cam: 2, generating_report: 3 };
  const stepIndex = stepMap[step];
  if (!stepIndex) return;

  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById(`progress-step-${i}`);
    if (!stepEl) continue;
    stepEl.classList.remove('progress-step--active', 'progress-step--done', 'progress-step--error', 'progress-step--pending');

    if (i < stepIndex) {
      stepEl.classList.add('progress-step--done');
      const icon = stepEl.querySelector('.progress-step__icon');
      if (icon) icon.innerHTML = getCheckIcon();
    } else if (i === stepIndex) {
      stepEl.classList.add(`progress-step--${status}`);
      const icon = stepEl.querySelector('.progress-step__icon');
      if (icon) {
        if (status === 'active') icon.innerHTML = `<div class="spinner spinner--sm" aria-hidden="true"></div>`;
        else if (status === 'done') icon.innerHTML = getCheckIcon();
        else if (status === 'error') icon.innerHTML = getXIcon();
      }
    }
  }
}

function resetProgressSteps() {
  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById(`progress-step-${i}`);
    if (stepEl) {
      stepEl.classList.remove('progress-step--active', 'progress-step--done', 'progress-step--error');
      const icon = stepEl.querySelector('.progress-step__icon');
      if (icon) icon.textContent = String(i);
    }
  }
}

function markAllStepsDone() {
  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById(`progress-step-${i}`);
    if (stepEl) {
      stepEl.classList.remove('progress-step--active', 'progress-step--error', 'progress-step--pending');
      stepEl.classList.add('progress-step--done');
      const icon = stepEl.querySelector('.progress-step__icon');
      if (icon) icon.innerHTML = getCheckIcon();
    }
  }
}

// ══════════════════════════════════════════════
// 分類結果與報告面板
// ══════════════════════════════════════════════

function renderClassificationResults(classification) {
  const container = document.getElementById('classification-results');
  if (!container) return;

  const { predicted_label, confidence, all_probabilities } = classification;
  const sorted = [...all_probabilities].sort((a, b) => b.probability - a.probability);

  const items = sorted.map(item => {
    const isPredicted = item.label === predicted_label;
    const pct = (item.probability * 100).toFixed(1);
    const barWidth = Math.max(item.probability * 100, 0.5).toFixed(1);
    return `
      <div class="confidence-item ${isPredicted ? 'confidence-item--predicted' : ''}">
        <div class="confidence-item__header"><span>${escapeHtml(item.label)}</span><span>${pct}%</span></div>
        <div class="progress-bar"><div class="progress-bar__fill" style="width: ${barWidth}%"></div></div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="section-title">分類結果</div><div class="confidence-list">${items}</div><div class="mt-sm"><span class="badge badge--info">${escapeHtml(predicted_label)} — ${(confidence * 100).toFixed(1)}%</span></div>`;
  container.classList.remove('hidden');
}

function renderReport(report) {
  ['findings', 'impression', 'recommendation'].forEach(type => {
    const section = document.getElementById(`report-${type}`);
    const body = section?.querySelector('.report-section__body');
    if (body) body.innerHTML = report[type] ? `<p>${escapeHtml(report[type]).replace(/\n/g, '<br>')}</p>` : `<p>（無內容）</p>`;
    if (type === 'findings') section?.classList.add('report-section--open');
  });
  document.getElementById('report-container')?.classList.remove('hidden');
  document.getElementById('export-buttons')?.classList.remove('hidden');
}

// ══════════════════════════════════════════════
// Toast 通知與狀態控制
// ══════════════════════════════════════════════

function showToast(type, title, message, detail = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<div><strong>${escapeHtml(title)}</strong><br>${escapeHtml(message)}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function showErrorToast(msg, det) { showToast('error', '錯誤', msg, det); }
function showSuccessToast(msg) { showToast('success', '成功', msg); }

function enableAnalyzeButton() {
  const btn = document.getElementById('analyze-btn');
  if (btn) { btn.disabled = false; btn.removeAttribute('aria-disabled'); }
}
function disableAnalyzeButton(txt) {
  const btn = document.getElementById('analyze-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.setAttribute('aria-disabled', 'true');
  // 🔥 修復：只更新 <span> 文字節點，保留 SVG icon
  const span = btn.querySelector('span[data-i18n]') || btn.querySelector('span');
  if (span) span.textContent = txt;
  else btn.textContent = txt;
}
function restoreAnalyzeButton() {
  const btn = document.getElementById('analyze-btn');
  if (!btn) return;
  btn.disabled = false;
  btn.removeAttribute('aria-disabled');
  // 🔥 修復：只更新 <span> 文字節點，保留 SVG icon
  const span = btn.querySelector('span[data-i18n]') || btn.querySelector('span');
  if (span) span.textContent = '開始分析';
  else btn.textContent = '開始分析';
}
function showReanalyzeButton() { document.getElementById('reanalyze-btn')?.classList.remove('hidden'); }
function hideReanalyzeButton() { document.getElementById('reanalyze-btn')?.classList.add('hidden'); }

function updateHealthStatus(status, text) {
  const dot = document.getElementById('health-status-dot');
  const label = document.getElementById('health-status-text');
  if (dot) dot.className = `status-dot status-dot--${status}`;
  if (label) label.textContent = text;
}

function initReportAccordion() {
  document.querySelectorAll('.report-section__header').forEach(h => h.addEventListener('click', () => h.closest('.report-section').classList.toggle('report-section--open')));
}

// 工具
function escapeHtml(str) { return String(str ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
function formatFileSize(bytes) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`; }
function getCheckIcon() { return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`; }
function getXIcon() { return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`; }

/**
 * 在目標元素上顯示 loading overlay（spinner + 文字）
 * @param {string} containerId - 要疊加 overlay 的元素 ID
 * @param {string} [text='載入中...'] - 顯示的提示文字
 */
function showLoadingOverlay(containerId, text = '載入中...') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 清除舊的 overlay
  hideLoadingOverlay(containerId);

  const overlay = document.createElement('div');
  overlay.id = `loading-overlay-${containerId}`;
  overlay.style.cssText = [
    'position:absolute', 'inset:0', 'background:rgba(15,25,35,0.75)',
    'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
    'z-index:50', 'border-radius:inherit', 'gap:10px'
  ].join(';');

  overlay.innerHTML = `
    <div class="spinner" aria-hidden="true"></div>
    <span style="color:var(--text-secondary,#a0aec0);font-size:0.8rem;">${escapeHtml(text)}</span>
  `;

  // container 需要 position:relative 才能讓 overlay 定位正確
  const prevPosition = container.style.position;
  if (!prevPosition || prevPosition === 'static') {
    container.style.position = 'relative';
  }
  container.appendChild(overlay);
}

/**
 * 移除目標元素上的 loading overlay
 * @param {string} containerId
 */
function hideLoadingOverlay(containerId) {
  const overlay = document.getElementById(`loading-overlay-${containerId}`);
  if (overlay) overlay.remove();
}

window.LungCancerUI = {
  showImagePreview, showOriginalImage, showFederatedHeatmap, showLocalBaselineHeatmap,
  updateProgressStep, resetProgressSteps, markAllStepsDone, renderClassificationResults,
  renderReport, showErrorToast, showSuccessToast, enableAnalyzeButton, disableAnalyzeButton,
  restoreAnalyzeButton, showReanalyzeButton, hideReanalyzeButton, updateHealthStatus,
  initReportAccordion, showLoadingOverlay, hideLoadingOverlay,
};