/**
 * app.js — 主應用程式邏輯與狀態管理
 * Lung Cancer Analysis System (Multi-Model & Triple-Column Heatmap Support)
 */

// ══════════════════════════════════════════════
// 應用程式狀態
// ══════════════════════════════════════════════
const AppState = {
  uploadedImage: null,
  analysisResult: null,
  currentStep: null,
  error: null,
  isAnalyzing: false,
};

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/tiff'];
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.tif'];
const MAX_FILE_SIZE_MB = 50;

// ══════════════════════════════════════════════
// 初始化
// ══════════════════════════════════════════════
function initApp() {
  const { LungCancerUI } = window;
  if (LungCancerUI) LungCancerUI.initReportAccordion();

  bindDropZoneEvents();
  bindFileInputEvents();
  bindAnalyzeButtonEvents();
  bindReanalyzeButtonEvents();
  bindExportButtonEvents();
  bindHeatmapDownloadEvents();

  // 初始健康檢查
  performHealthCheck();
  setInterval(performHealthCheck, 30000);
}

async function performHealthCheck() {
  const { LungCancerAPI, LungCancerUI } = window;
  if (!LungCancerAPI || !LungCancerUI) return;
  try {
    const health = await LungCancerAPI.checkHealth();
    LungCancerUI.updateHealthStatus(health.status === 'ok' ? 'online' : 'offline', health.status === 'ok' ? '後端已連線' : '後端異常');
  } catch {
    LungCancerUI.updateHealthStatus('offline', '後端離線');
  }
}

// ══════════════════════════════════════════════
// 檔案處理事件
// ══════════════════════════════════════════════

function bindDropZoneEvents() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) return;
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
    dropzone.addEventListener(e, preventDefaults);
    document.body.addEventListener(e, preventDefaults);
  });
  dropzone.addEventListener('dragover', () => dropzone.classList.add('dropzone--dragover'));
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone--dragover'));
  dropzone.addEventListener('drop', (e) => {
    dropzone.classList.remove('dropzone--dragover');
    const files = e.dataTransfer?.files;
    if (files?.length > 0) handleFileSelection(files[0]);
  });
}

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

function bindFileInputEvents() {
  const fileInput = document.getElementById('file-input');
  if (!fileInput) return;
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) { handleFileSelection(file); fileInput.value = ''; }
  });
}

async function handleFileSelection(file) {
  const { LungCancerAPI, LungCancerUI } = window;
  if (!LungCancerAPI || !LungCancerUI) return;

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type) && !SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
    LungCancerUI.showErrorToast('不支援的格式', '請上傳 JPEG/PNG/TIFF');
    return;
  }
  
  try {
    LungCancerUI.showLoadingOverlay('dropzone', '影像處理中...');
    const result = await LungCancerAPI.uploadImage(file);
    
    // 🔥 核心修復：後端 pil_to_base64() 已回傳完整 data URI（含 data:image/png;base64, 前綴）
    // 必須先移除換行符，再判斷是否已有前綴，避免雙重包裹導致破圖
    const raw = (result.preview_base64 || '').replace(/[\r\n\s]/g, '');
    const dataUri = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    
    AppState.uploadedImage = { 
        id: result.image_id, 
        filename: result.filename, 
        previewBase64: dataUri 
    };
    
    LungCancerUI.showImagePreview(dataUri, result.filename, result.width, result.height, result.size_bytes);
    LungCancerUI.enableAnalyzeButton();
    LungCancerUI.showSuccessToast(`上傳成功`);
  } catch (error) {
    LungCancerUI.showErrorToast('上傳失敗', error.message);
  } finally {
    LungCancerUI.hideLoadingOverlay('dropzone');
  }
}

// ══════════════════════════════════════════════
// 主分析流程
// ══════════════════════════════════════════════

async function runAnalysis() {
  const { LungCancerAPI, LungCancerUI } = window;
  if (!LungCancerAPI || !LungCancerUI || AppState.isAnalyzing) return;

  if (!AppState.uploadedImage) {
    LungCancerUI.showErrorToast('請先上傳影像');
    return;
  }

  const modelSelect = document.getElementById('inference-model-select');
  const selectedModelKey = modelSelect ? modelSelect.value : "fl-densenet121";

  AppState.isAnalyzing = true;
  LungCancerUI.disableAnalyzeButton('分析中...');
  LungCancerUI.resetProgressSteps();

  try {
    // 步驟 1: 分類
    LungCancerUI.updateProgressStep('classifying', 'active');
    const analysisResult = await LungCancerAPI.analyze(
      AppState.uploadedImage.id, selectedModelKey, null, 
      window.I18n ? window.I18n.getReportLanguageName() : 'Traditional Chinese'
    );
    
    // 步驟 2: 渲染影像與熱力圖
    LungCancerUI.updateProgressStep('classifying', 'done');
    LungCancerUI.updateProgressStep('generating_cam', 'active');
    
    LungCancerUI.showOriginalImage(AppState.uploadedImage.previewBase64);
    if (analysisResult.gradcam) {
      // 🔥 修復：後端已回傳完整 data URI，showFederatedHeatmap / showLocalBaselineHeatmap
      //    內部已有 startsWith('data:') 判斷，直接傳入即可，無需額外處理
      if (analysisResult.gradcam.federated_base64) {
        const fedRaw = analysisResult.gradcam.federated_base64.replace(/[\r\n\s]/g, '');
        LungCancerUI.showFederatedHeatmap(fedRaw);
      }
      if (analysisResult.gradcam.local_base64) {
        const localRaw = analysisResult.gradcam.local_base64.replace(/[\r\n\s]/g, '');
        LungCancerUI.showLocalBaselineHeatmap(localRaw);
      }
    }

    // 步驟 3: 產生報告
    LungCancerUI.updateProgressStep('generating_cam', 'done');
    LungCancerUI.updateProgressStep('generating_report', 'active');
    
    LungCancerUI.renderClassificationResults(analysisResult.classification);
    LungCancerUI.renderReport(analysisResult.report);

    LungCancerUI.updateProgressStep('generating_report', 'done');
    LungCancerUI.markAllStepsDone();
    
    AppState.analysisResult = analysisResult;
    LungCancerUI.showSuccessToast('分析完成');
  } catch (error) {
    LungCancerUI.updateProgressStep('classifying', 'error'); // 錯誤時顯示紅燈
    LungCancerUI.showErrorToast('分析失敗', error.detail || error.message);
  } finally {
    AppState.isAnalyzing = false;
    LungCancerUI.restoreAnalyzeButton();
  }
}

// ══════════════════════════════════════════════
// 事件綁定 (補足缺失的函式)
// ══════════════════════════════════════════════

/**
 * 綁定「開始分析」按鈕事件 + Dropzone 點擊觸發 file input
 */
function bindAnalyzeButtonEvents() {
  const btn = document.getElementById('analyze-btn');
  if (btn) {
    btn.addEventListener('click', runAnalysis);
  }

  // Dropzone 點擊觸發 file input
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
  }
}

/**
 * 綁定「重新分析」按鈕事件
 */
function bindReanalyzeButtonEvents() {
  const btn = document.getElementById('reanalyze-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (AppState.uploadedImage) runAnalysis();
    });
  }
}

/**
 * 綁定「匯出報告」按鈕事件
 */
function bindExportButtonEvents() {
  const pdfBtn = document.getElementById('export-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      const { LungCancerAPI, LungCancerUI } = window;
      if (!AppState.analysisResult?.report) return;
      try {
        const blob = await LungCancerAPI.exportReport(AppState.analysisResult.report, 'pdf');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'medical_report.pdf'; a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        LungCancerUI.showErrorToast('PDF 匯出失敗', e.message);
      }
    });
  }

  const txtBtn = document.getElementById('export-txt-btn');
  if (txtBtn) {
    txtBtn.addEventListener('click', async () => {
      const { LungCancerAPI, LungCancerUI } = window;
      if (!AppState.analysisResult?.report) return;
      try {
        const blob = await LungCancerAPI.exportReport(AppState.analysisResult.report, 'txt');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'medical_report.txt'; a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        LungCancerUI.showErrorToast('文字匯出失敗', e.message);
      }
    });
  }
}

/**
 * 綁定「下載熱力圖」事件 (點擊熱力圖影像可下載)
 */
function bindHeatmapDownloadEvents() {
  ['heatmap-federated-image', 'heatmap-local-image'].forEach(id => {
    const img = document.getElementById(id);
    if (img) {
      img.style.cursor = 'pointer';
      img.title = '點擊下載熱力圖';
      img.addEventListener('click', () => {
        if (img.src && img.src.startsWith('data:')) {
          const a = document.createElement('a');
          a.href = img.src;
          a.download = `gradcam_${id}.png`;
          a.click();
        }
      });
    }
  });
}

// ══════════════════════════════════════════════
// Tab 切換
// ══════════════════════════════════════════════

function switchTab(tabName) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const page = document.getElementById(`page-${tabName}`);
  const btn = document.getElementById(`tab-${tabName}`);
  if (page) page.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ══════════════════════════════════════════════
// 應用程式啟動入口 (🔥 關鍵：補上 DOMContentLoaded)
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', initApp);