/**
 * api.js — 後端 API 呼叫封裝
 * Lung Cancer Analysis System
 * 支援動態模型選擇、多熱力圖資料獲取與檔案上傳
 */

const API_BASE_URL = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';

/**
 * 統一 HTTP 請求函式
 * 自動處理 Content-Type，特別針對 FormData 進行保護
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // 判斷是否為 FormData (用於影像上傳)，若是，則不手動設定 Content-Type
  const isFormData = options.body instanceof FormData;
  
  const headers = { ...options.headers };
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: headers,
    });
  } catch (networkError) {
    throw new ApiError('NETWORK_ERROR', `無法連線至後端伺服器`, networkError.message);
  }

  if (!response.ok) {
    let errorData = null;
    try { errorData = await response.json(); } catch { }
    const errorCode = errorData?.error_code || `HTTP_${response.status}`;
    const message = errorData?.message || `伺服器回應錯誤（HTTP ${response.status}）`;
    throw new ApiError(errorCode, message, errorData?.detail, response.status);
  }

  if (response.status === 204) return null;

  try { 
    return await response.json(); 
  } catch (e) {
    throw new ApiError('PARSE_ERROR', '無法解析伺服器回應', e.message);
  }
}

/**
 * API 錯誤類別
 */
class ApiError extends Error {
  constructor(errorCode, message, detail = null, statusCode = null) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.detail = detail;
    this.statusCode = statusCode;
  }
}

// ══════════════════════════════════════════════
// API 函式實作
// ══════════════════════════════════════════════

/**
 * 上傳影像檔案
 * 傳送 FormData 時，fetch 會自動加入 boundary，不要手動加 Header
 */
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/upload-image', { 
    method: 'POST', 
    body: formData 
  });
}

/**
 * 執行完整分析
 * @param {string} imageId - 影像 ID
 * @param {string} modelKey - 模型 key (例如 "fl-densenet121")
 * @param {number|null} [targetClass=null] 
 * @param {string} [reportLanguage='Traditional Chinese']
 */
async function analyze(imageId, modelKey, targetClass = null, reportLanguage = 'Traditional Chinese') {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({
      image_id: imageId,
      model_id: modelKey,
      target_class: targetClass,
      report_language: reportLanguage,
    }),
  });
}

/**
 * 下載 Heatmap 圖片
 */
async function downloadHeatmap(imageId) {
  const url = `${API_BASE_URL}/api/download/heatmap/${encodeURIComponent(imageId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new ApiError(`HTTP_${response.status}`, '下載 Heatmap 失敗');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * 匯出報告
 */
async function exportReport(reportData, format) {
  const response = await fetch(`${API_BASE_URL}/api/export-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...reportData, format }),
  });
  if (!response.ok) throw new ApiError(`HTTP_${response.status}`, '匯出報告失敗');
  return response.blob();
}

/**
 * 健康檢查
 */
async function checkHealth() {
  return request('/api/health');
}

// 匯出供全局使用
window.LungCancerAPI = {
  uploadImage,
  analyze,
  downloadHeatmap,
  exportReport,
  checkHealth,
  ApiError,
};