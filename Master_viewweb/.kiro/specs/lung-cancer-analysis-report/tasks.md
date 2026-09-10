# Implementation Plan: 肺癌醫療影像分析系統

## Overview

以 Python FastAPI 為後端、Vanilla JS 為前端，實作整合 CNN 推論、Grad-CAM 熱力圖與本地 LLM 報告產生的醫療輔助診斷 Web 應用程式。實作順序依照依賴關係由底層基礎設施往上層業務邏輯推進，確保每個步驟均可獨立驗證。

## Tasks

- [x] 1. 建立專案結構與基礎設定
  - 建立 `lung-cancer-analysis-report/` 目錄樹，包含 `backend/`、`frontend/`、`backend/routers/`、`backend/services/`、`backend/models/`、`backend/utils/`、`backend/tests/unit/`、`backend/tests/property/`、`backend/tests/integration/`
  - 建立 `requirements.txt`，列出所有 Python 依賴（fastapi, uvicorn, torch, pytorch-grad-cam, Pillow, opencv-python, numpy, openai, pyyaml, python-dotenv, pydantic-settings, reportlab, hypothesis, pytest, pytest-mock, pytest-cov）
  - 建立 `config.yaml` 範本與 `.env.example`，包含所有可設定欄位
  - 在各 Python 套件目錄建立 `__init__.py`
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. 實作 Config Manager（`backend/config.py`）
  - [x] 2.1 實作 `AppConfig` Pydantic Settings 類別
    - 定義欄位：`model_path`、`lm_studio_url`（預設 `"http://localhost:1234"`）、`llm_model_name`（預設 `"medgemma-1.5"`）、`default_target_layer`、`max_image_size_mb`（預設 `50`）、`llm_timeout_seconds`（預設 `60`）
    - 設定 `env_file = ".env"` 與 `yaml_file = "config.yaml"` 支援
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 2.2 撰寫 Property 10 屬性測試：缺少設定欄位時使用預設值
    - **Property 10: 缺少設定欄位時系統使用預設值**
    - **Validates: Requirements 8.2, 8.4**
    - 使用 Hypothesis `st.fixed_dictionaries` 產生任意欄位子集的設定輸入，驗證 `AppConfig` 初始化後 `lm_studio_url` 預設值為 `"http://localhost:1234"`，且物件可正常使用
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 10: 缺少設定欄位時系統使用預設值`

  - [ ]* 2.3 撰寫 Config Manager 單元測試
    - 測試設定讀取、預設值套用、缺少欄位處理
    - _Requirements: 8.4_

- [x] 3. 實作資料模型（`backend/models/schemas.py`）
  - 定義所有 Pydantic 請求/回應模型：`UploadImageResponse`、`LoadModelRequest`、`LoadModelResponse`、`AnalyzeRequest`、`AnalyzeResponse`、`ExportReportRequest`、`HealthResponse`、`ErrorResponse`
  - 定義後端內部資料類別：`LoadedModel`、`ClassificationResult`、`GradCAMResult`、`StructuredReport`
  - _Requirements: 1.2, 2.6, 3.2, 4.4, 5.3_

- [x] 4. 實作影像工具函式（`backend/utils/image_utils.py`）
  - [x] 4.1 實作影像格式驗證函式 `validate_image_format(filename: str) -> bool`
    - 接受副檔名字串，當且僅當副檔名為 `.jpg`、`.jpeg`、`.png`、`.tiff`、`.tif`（不區分大小寫）時回傳 `True`
    - _Requirements: 1.1, 1.3_

  - [ ]* 4.2 撰寫 Property 1 屬性測試：影像格式驗證拒絕非支援格式
    - **Property 1: 影像格式驗證拒絕非支援格式**
    - **Validates: Requirements 1.1, 1.3**
    - 使用 Hypothesis `st.text()` 產生任意副檔名字串，驗證函式當且僅當副檔名在支援清單內時回傳 `True`
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 1: 影像格式驗證拒絕非支援格式`

  - [x] 4.3 實作影像大小驗證函式 `validate_image_size(size_bytes: int, max_mb: int = 50) -> bool`
    - 當且僅當 `size_bytes <= max_mb * 1024 * 1024` 時回傳 `True`
    - _Requirements: 1.4_

  - [ ]* 4.4 撰寫 Property 2 屬性測試：影像大小驗證拒絕超過上限的檔案
    - **Property 2: 影像大小驗證拒絕超過上限的檔案**
    - **Validates: Requirements 1.4**
    - 使用 Hypothesis `st.integers(min_value=0)` 產生任意非負整數大小，驗證超過 50MB 時回傳失敗，不超過時回傳通過
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 2: 影像大小驗證拒絕超過上限的檔案`

  - [x] 4.5 實作 `image_to_base64(image_array: np.ndarray) -> str` 與 `pil_to_base64(image: PIL.Image) -> str` 工具函式
    - _Requirements: 1.2, 4.4_

- [x] 5. 實作檔案工具函式（`backend/utils/file_utils.py`）
  - 實作 `validate_model_format(path: str) -> bool`，當且僅當副檔名為 `.pt`、`.pth`、`.h5`（不區分大小寫）時回傳 `True`
  - 實作暫存檔案管理函式：`save_temp_file`、`get_temp_path`、`cleanup_temp_file`
  - _Requirements: 2.3, 2.4_

- [ ] 6. 實作模型格式驗證屬性測試
  - [ ]* 6.1 撰寫 Property 3 屬性測試：模型格式驗證拒絕非支援格式
    - **Property 3: 模型格式驗證拒絕非支援格式**
    - **Validates: Requirements 2.3, 2.4**
    - 使用 Hypothesis `st.text()` 產生任意路徑字串，驗證函式當且僅當副檔名為 `.pt`、`.pth`、`.h5` 時回傳 `True`
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 3: 模型格式驗證拒絕非支援格式`

- [x] 7. 實作 Model Loader（`backend/services/model_loader.py`）
  - [x] 7.1 實作 `detect_last_conv_layer(model: torch.nn.Module) -> torch.nn.Module`
    - 深度優先遍歷模型所有模組，回傳最後一個 `Conv2d` 或 `Conv3d` 實例；若無卷積層則拋出 `NoConvLayerError`
    - _Requirements: 2.6_

  - [ ]* 7.2 撰寫 Property 4 屬性測試：最後卷積層自動偵測永遠回傳最後一個 Conv2d
    - **Property 4: 最後卷積層自動偵測永遠回傳最後一個 Conv2d**
    - **Validates: Requirements 2.6**
    - 使用 Hypothesis `st.integers(min_value=1, max_value=5)` 產生隨機層數，動態建構含不同數量 `Conv2d` 的 Sequential 模型，驗證 `detect_last_conv_layer` 回傳的層等同於手動遍歷所得的最後一個 `Conv2d`
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 4: 最後卷積層自動偵測永遠回傳最後一個 Conv2d`

  - [x] 7.3 實作 `ModelLoader.load(model_path, target_layer=None) -> LoadedModel`
    - 呼叫 `validate_model_format` 驗證格式；依副檔名分派至 `_load_pytorch` 或 `_load_keras`；若未指定 `target_layer` 則呼叫 `detect_last_conv_layer` 自動偵測
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 7.4 撰寫 Model Loader 單元測試
    - 測試格式驗證、自動偵測卷積層、手動指定層、載入失敗錯誤處理
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 8. 實作 Classifier（`backend/services/classifier.py`）
  - [x] 8.1 實作 `Classifier.preprocess_image(image: PIL.Image) -> torch.Tensor`
    - 調整影像大小、正規化、轉換為 batch tensor
    - _Requirements: 3.1_

  - [x] 8.2 實作 `Classifier.predict(model: LoadedModel, image_tensor: torch.Tensor) -> ClassificationResult`
    - 執行前向傳播，套用 softmax，回傳 `ClassificationResult`（含 `predicted_class`、`predicted_label`、`confidence`、`all_probabilities`）
    - _Requirements: 3.1, 3.2_

  - [ ]* 8.3 撰寫 Property 5 屬性測試：分類機率總和恆為 1
    - **Property 5: 分類機率總和恆為 1**
    - **Validates: Requirements 3.2**
    - 使用 Hypothesis `st.integers(min_value=1, max_value=10)` 產生隨機類別數，建構對應輸出維度的模型，驗證 `all_probabilities` 中所有機率值總和滿足 `|sum - 1.0| < 1e-5`
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 5: 分類機率總和恆為 1`

  - [ ]* 8.4 撰寫 Classifier 單元測試
    - 測試影像前處理輸出形狀、機率輸出格式、推論例外處理
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 9. 實作 GradCAM Generator（`backend/services/gradcam_generator.py`）
  - [x] 9.1 實作 CAM 正規化函式 `normalize_cam(cam: np.ndarray) -> np.ndarray`
    - 將任意數值範圍的 CAM 陣列（含全零、全相同值、含負數）正規化至 `[0, 1]`
    - _Requirements: 4.2_

  - [ ]* 9.2 撰寫 Property 6 屬性測試：Grad-CAM 正規化輸出恆在 [0, 1] 範圍內
    - **Property 6: Grad-CAM 正規化輸出恆在 [0, 1] 範圍內**
    - **Validates: Requirements 4.2**
    - 使用 Hypothesis `st.arrays(dtype=np.float32, shape=st.tuples(...))` 產生任意形狀與數值範圍的 NumPy 陣列（含全零、全相同值、含負數邊界情況），驗證正規化後所有元素滿足 `0.0 <= value <= 1.0`
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 6: Grad-CAM 正規化輸出恆在 [0, 1] 範圍內`

  - [x] 9.3 實作 `GradCAMGenerator._apply_colormap` 與 `GradCAMGenerator._overlay`
    - `_apply_colormap`：將正規化 CAM 套用 jet colormap 轉為 RGB 彩色熱力圖
    - `_overlay`：以 alpha=0.5 將彩色熱力圖疊加於原始影像，確保輸出尺寸與原始影像一致
    - _Requirements: 4.3, 4.4_

  - [ ]* 9.4 撰寫 Property 7 屬性測試：熱力圖疊加影像尺寸與原始影像一致
    - **Property 7: 熱力圖疊加影像尺寸與原始影像一致**
    - **Validates: Requirements 4.3, 4.4**
    - 使用 Hypothesis `st.integers(min_value=32, max_value=512)` 產生任意寬高，建構對應尺寸的原始影像與 CAM，驗證 `Heatmap_Overlay` 的寬高與原始影像完全相同
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 7: 熱力圖疊加影像尺寸與原始影像一致`

  - [x] 9.5 實作 `GradCAMGenerator.generate(model, image_tensor, original_image, target_class=None) -> GradCAMResult`
    - 使用 `pytorch-grad-cam` 的 `GradCAM` 計算 `grayscale_cam`，呼叫 `normalize_cam`、`_apply_colormap`、`_overlay`，組裝並回傳 `GradCAMResult`（含 `cam_array`、`heatmap_rgb`、`overlay_image`、`overlay_base64`）
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.6 撰寫 GradCAM Generator 單元測試
    - 測試 colormap 套用、alpha 疊加、例外處理
    - _Requirements: 4.1, 4.6_

- [x] 10. 實作 LLM Client（`backend/services/llm_client.py`）
  - 實作 `LLMClient.__init__(config: AppConfig)`，建立指向 `lm_studio_url` 的 `openai.OpenAI` 客戶端
  - 實作 `LLMClient.generate_report(prompt: str) -> str`，呼叫 chat completions API，設定 `timeout=config.llm_timeout_seconds`；連線失敗拋出 `LLMConnectionError`，逾時拋出 `LLMTimeoutError`
  - _Requirements: 5.2, 5.5, 5.6_

- [x] 11. 實作 Report Generator（`backend/services/report_generator.py`）
  - [x] 11.1 實作 `ReportGenerator._build_prompt(classification, image_metadata) -> str`
    - 依設計文件 User Prompt 模板組合提示詞，確保包含 `predicted_label` 文字與 `confidence` 數值表示
    - _Requirements: 5.1_

  - [ ]* 11.2 撰寫 Property 8 屬性測試：Prompt 必定包含分類標籤與信心分數
    - **Property 8: Prompt 必定包含分類標籤與信心分數**
    - **Validates: Requirements 5.1**
    - 使用 Hypothesis `st.text(min_size=1)` 與 `st.floats(min_value=0.0, max_value=1.0)` 產生任意 `predicted_label` 與 `confidence`，驗證 `_build_prompt` 產生的字串同時包含 `predicted_label` 文字內容與 `confidence` 數值表示
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 8: Prompt 必定包含分類標籤與信心分數`

  - [x] 11.3 實作 `ReportGenerator._parse_report(raw_text: str) -> StructuredReport`
    - 解析包含 `FINDINGS:`、`IMPRESSION:`、`RECOMMENDATION:` 三個段落標題的 LLM 回應，提取各段落內容
    - _Requirements: 5.3_

  - [ ]* 11.4 撰寫 Property 9 屬性測試：報告解析器正確提取三段式結構
    - **Property 9: 報告解析器正確提取三段式結構**
    - **Validates: Requirements 5.3**
    - 使用 Hypothesis `st.text(min_size=1, alphabet=st.characters(blacklist_categories=("Cs",)))` 產生各段落任意非空內容，組合成合法三段式 LLM 回應，驗證解析後 `findings`、`impression`、`recommendation` 均為非空字串且對應原始段落內容
    - 標記格式：`# Feature: lung-cancer-analysis-report, Property 9: 報告解析器正確提取三段式結構`

  - [x] 11.5 實作 `ReportGenerator.generate(classification, gradcam_result, image_metadata) -> StructuredReport`
    - 呼叫 `_build_prompt`，透過 `LLMClient.generate_report` 取得原始文字，呼叫 `_parse_report` 解析，組裝並回傳 `StructuredReport`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 11.6 撰寫 Report Generator 單元測試
    - 測試 Prompt 組合、報告解析、LLM 連線失敗與逾時處理
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

- [x] 12. Checkpoint — 確認後端服務層測試全數通過
  - 確認所有 `backend/tests/unit/` 與 `backend/tests/property/` 測試通過，如有問題請向使用者提問。

- [x] 13. 實作 FastAPI 路由（`backend/routers/`）
  - [x] 13.1 實作 `routers/image.py`
    - `POST /api/upload-image`：接收 multipart/form-data，呼叫 `validate_image_format`、`validate_image_size`，儲存暫存檔，回傳 `UploadImageResponse`（含 `image_id`、`filename`、`preview_base64`、`width`、`height`、`size_bytes`）
    - `GET /api/download/heatmap/{image_id}`：回傳對應暫存 PNG 二進位
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.7_

  - [x] 13.2 實作 `routers/model.py`
    - `POST /api/load-model`：接收 `LoadModelRequest`，呼叫 `ModelLoader.load`，快取 `LoadedModel`，回傳 `LoadModelResponse`（含 `model_id`、`framework`、`target_layer`、`layer_names`）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 13.3 實作 `routers/analysis.py`
    - `POST /api/analyze`：接收 `AnalyzeRequest`，依序呼叫 `Classifier.predict`、`GradCAMGenerator.generate`、`ReportGenerator.generate`，回傳 `AnalyzeResponse`
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 7.1_

  - [x] 13.4 實作 `routers/report.py`
    - `POST /api/export-report`：接收 `ExportReportRequest`，依 `format` 欄位產生 PDF（reportlab）或純文字，回傳對應 binary
    - _Requirements: 5.8_

  - [x] 13.5 實作 `backend/main.py`
    - 建立 FastAPI 應用程式實例，掛載所有路由，加入全域例外處理器（回傳 `ErrorResponse` 格式），加入 `GET /api/health` 端點
    - _Requirements: 7.1, 7.3_

- [ ] 14. 撰寫 API 整合測試（`backend/tests/integration/test_api_endpoints.py`）
  - [ ]* 14.1 撰寫 API 端點整合測試
    - 使用 FastAPI `TestClient` 測試各端點的請求/回應格式、錯誤回應格式、HTTP 狀態碼
    - Mock `ModelLoader`、`Classifier`、`GradCAMGenerator`、`LLMClient` 外部依賴
    - _Requirements: 1.1, 1.3, 1.4, 2.3, 2.4, 3.1, 4.1, 5.2, 5.5, 5.6_

- [x] 15. Checkpoint — 確認後端 API 整合測試通過
  - 確認所有 `backend/tests/integration/` 測試通過，如有問題請向使用者提問。

- [x] 16. 實作前端 CSS 樣式（`frontend/css/`）
  - [x] 16.1 實作 `theme.css`：定義 CSS 自訂屬性（變數），包含主背景色 `#0F1923`、強調色 `#00BCD4`、高對比白色文字、卡片背景色、錯誤紅色等深色醫療主題色彩
    - _Requirements: 6.1_

  - [x] 16.2 實作 `layout.css`：三欄式 CSS Grid 主佈局（左 25% / 中 45% / 右 30%），響應式斷點（1280px 三欄、768px-1279px 兩欄、767px 以下單欄）
    - _Requirements: 6.2, 6.7_

  - [x] 16.3 實作 `components.css`：卡片元件、按鈕（含 hover 視覺回饋）、水平進度條、折疊面板、錯誤 Toast、載入狀態指示器等 UI 元件樣式
    - _Requirements: 6.4, 6.5, 6.6, 6.8_

  - [x] 16.4 實作 `main.css`：匯入其他 CSS 檔案、全域重置樣式、字型設定、頁首標題列樣式
    - _Requirements: 6.3_

- [x] 17. 實作前端 JavaScript 模組（`frontend/js/`）
  - [x] 17.1 實作 `api.js`：封裝所有 API 呼叫函式（`uploadImage`、`loadModel`、`analyze`、`downloadHeatmap`、`exportReport`、`checkHealth`），統一錯誤處理，回傳 Promise
    - _Requirements: 1.2, 2.3, 3.1, 4.1, 5.2, 5.8_

  - [x] 17.2 實作 `ui.js`：DOM 操作與 UI 更新函式，包含 `showImagePreview`、`updateProgressStep`、`renderClassificationResults`（含信心分數進度條）、`renderReport`（含三段式分色區塊）、`showErrorToast`、`enableAnalyzeButton`
    - _Requirements: 1.2, 1.5, 3.3, 4.5, 5.4, 6.4, 6.5, 6.6, 7.2, 7.4_

  - [x] 17.3 實作 `export.js`：`exportAsPDF`（呼叫後端 `/api/export-report`）與 `exportAsText` 函式，觸發瀏覽器下載
    - _Requirements: 5.8_

  - [x] 17.4 實作 `app.js`：`AppState` 狀態管理物件、事件監聽器綁定（拖放上傳、檔案選擇、模型路徑輸入、開始分析按鈕、重新分析按鈕）、`runAnalysis` 主流程函式（依序呼叫 API、更新進度指示器、錯誤處理）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 18. 實作前端 HTML（`frontend/index.html`）
  - 建立完整 HTML5 結構：頁首標題列（系統 Logo + 標題）、三欄主佈局（左欄：DropZone + 影像預覽 + 模型設定 + 分析按鈕；中欄：進度指示器 + 原始影像卡片 + Heatmap 卡片 + 分類結果進度條；右欄：三段式報告面板 + 匯出按鈕）、錯誤 Toast 元件
  - 引入所有 CSS 與 JS 檔案
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 19. 整合驗證與最終接線
  - [x] 19.1 驗證前後端整合：確認前端 `api.js` 的端點路徑與後端路由完全對應，CORS 設定允許前端來源
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 19.2 撰寫完整流程整合測試（`backend/tests/integration/test_full_pipeline.py`）
    - 使用測試影像與 Mock 模型執行端對端流程，驗證 upload → load-model → analyze → export-report 完整鏈路
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 20. Final Checkpoint — 確認所有測試通過
  - 執行 `pytest backend/tests/ -v --cov=backend` 確認所有測試通過，如有問題請向使用者提問。

## Notes

- 標記 `*` 的子任務為選填，可跳過以加速 MVP 開發
- 每個任務均引用具體需求條款以確保可追溯性
- 屬性測試（Property 1–10）使用 Hypothesis，每個屬性為獨立子任務，標記格式遵循設計文件規範
- Checkpoint 任務確保每個階段的增量驗證
- 後端服務層（任務 2–11）完成後再進行路由層（任務 13），確保依賴關係正確
- 前端實作（任務 16–18）可與後端路由層（任務 13）並行開發
