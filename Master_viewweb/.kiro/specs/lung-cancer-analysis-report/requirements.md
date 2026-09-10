# Requirements Document

## Introduction

肺癌醫療影像分析系統（Lung Cancer Medical Image Analysis System）是一套整合深度學習模型視覺化與大型語言模型的醫療輔助診斷工具。系統允許醫療人員上傳肺癌組織病理學影像（H&E 染色切片或 CT 影像），透過使用者預先訓練好的 CNN 分類模型產生 Grad-CAM 熱力圖，並疊加於原始影像上以視覺化模型關注區域，最後透過本地部署的 MedGemma 1.5 LLM 自動產出包含 FINDINGS、IMPRESSION、RECOMMENDATION 三段式結構化醫療報告。

系統介面風格以 Google DeepMind MedGemma Radiology Explainer Demo 為靈感參考，採用深色醫療主題（Dark Medical Theme）設計語言，搭配藍綠色（Teal/Cyan）強調色，呈現專業、簡潔的醫療科技感。整體佈局採三欄式設計：左側為影像上傳與模型設定區、中央為影像與 Grad-CAM 熱力圖並排展示區、右側為結構化醫療報告顯示區，提供直覺的 Web UI 操作體驗。

---

## Glossary

- **System**：肺癌醫療影像分析系統整體
- **Web_UI**：前端網頁使用者介面，負責影像上傳、結果展示與報告顯示
- **Image_Uploader**：Web_UI 中負責接收使用者上傳影像的元件
- **Model_Loader**：後端元件，負責載入使用者提供的 PyTorch（.pt/.pth）或 Keras（.h5）模型檔案
- **Classifier**：已載入的 CNN 分類模型，負責對輸入影像進行分類推論
- **GradCAM_Generator**：後端元件，負責對 Classifier 執行 Grad-CAM 演算法並產生熱力圖
- **Heatmap_Overlay**：將 Grad-CAM 熱力圖疊加於原始影像上的合成影像
- **LLM_Client**：後端元件，負責透過 LM Studio OpenAI-compatible API 呼叫 MedGemma 1.5
- **Report_Generator**：後端元件，負責組合提示詞並呼叫 LLM_Client 產生結構化醫療報告
- **Structured_Report**：包含 FINDINGS、IMPRESSION、RECOMMENDATION 三個段落的醫療報告
- **LM_Studio_API**：本地部署於 http://localhost:1234 的 OpenAI-compatible REST API 端點
- **Supported_Model_Format**：系統支援的模型檔案格式，包含 .pt、.pth（PyTorch）及 .h5（Keras/TensorFlow）
- **Target_Layer**：Grad-CAM 演算法所指定的 CNN 最後一層卷積層
- **H&E_Image**：蘇木精-伊紅染色組織病理學切片影像
- **CT_Image**：電腦斷層掃描影像

---

## Requirements

### Requirement 1：影像上傳

**User Story:** 身為醫療人員，我希望能透過 Web UI 上傳肺癌醫療影像，以便系統能對影像進行後續分析。

#### Acceptance Criteria

1. THE Image_Uploader SHALL 接受 JPEG、PNG、TIFF 格式的影像檔案上傳。
2. WHEN 使用者選擇影像檔案並提交，THE Image_Uploader SHALL 在 Web_UI 上顯示原始影像預覽。
3. IF 使用者上傳的檔案格式不在支援清單內，THEN THE Image_Uploader SHALL 顯示明確的錯誤訊息，說明支援的格式為 JPEG、PNG、TIFF。
4. IF 使用者上傳的影像檔案大小超過 50MB，THEN THE Image_Uploader SHALL 顯示錯誤訊息並拒絕上傳。
5. WHEN 影像上傳成功，THE Web_UI SHALL 啟用「開始分析」按鈕。

---

### Requirement 2：模型載入

**User Story:** 身為醫療人員，我希望能指定並載入自己訓練好的 CNN 模型，以便系統使用該模型進行影像分類與 Grad-CAM 分析。

#### Acceptance Criteria

1. THE Model_Loader SHALL 支援載入 .pt 及 .pth 格式的 PyTorch 模型檔案。
2. THE Model_Loader SHALL 支援載入 .h5 格式的 Keras/TensorFlow 模型檔案。
3. WHEN 使用者提供模型檔案路徑，THE Model_Loader SHALL 驗證檔案格式是否為 Supported_Model_Format。
4. IF 模型檔案格式不符合 Supported_Model_Format，THEN THE Model_Loader SHALL 回傳錯誤訊息，說明支援的格式為 .pt、.pth、.h5。
5. IF 模型檔案載入過程中發生例外，THEN THE Model_Loader SHALL 記錄錯誤詳情並回傳描述性錯誤訊息。
6. WHEN 模型載入成功，THE Model_Loader SHALL 自動識別模型的最後一層卷積層作為 Target_Layer。
7. WHERE 使用者手動指定 Target_Layer 名稱，THE Model_Loader SHALL 使用使用者指定的層作為 Target_Layer。

---

### Requirement 3：影像分類推論

**User Story:** 身為醫療人員，我希望系統能對上傳的影像執行分類推論，以便得知模型對影像的分類結果與信心分數。

#### Acceptance Criteria

1. WHEN 使用者觸發分析，THE Classifier SHALL 對上傳影像執行前向傳播推論。
2. WHEN 推論完成，THE Classifier SHALL 回傳各分類的機率分數。
3. THE Web_UI SHALL 顯示分類結果標籤及對應的信心分數（百分比）。
4. IF 推論過程中發生例外，THEN THE Classifier SHALL 記錄錯誤詳情並通知 Web_UI 顯示錯誤訊息。
5. WHILE 推論執行中，THE Web_UI SHALL 顯示載入狀態指示器。

---

### Requirement 4：Grad-CAM 熱力圖產生

**User Story:** 身為醫療人員，我希望系統能產生 Grad-CAM 熱力圖並疊加於原始影像上，以便視覺化模型在影像中關注的區域。

#### Acceptance Criteria

1. WHEN 分類推論完成，THE GradCAM_Generator SHALL 對 Target_Layer 計算梯度並產生熱力圖。
2. THE GradCAM_Generator SHALL 將熱力圖正規化至 [0, 1] 範圍。
3. THE GradCAM_Generator SHALL 將正規化後的熱力圖以 jet colormap 轉換為彩色熱力圖，並調整至與原始影像相同的解析度。
4. THE GradCAM_Generator SHALL 將彩色熱力圖以半透明方式疊加於原始影像上，產生 Heatmap_Overlay。
5. WHEN Heatmap_Overlay 產生完成，THE Web_UI SHALL 並排顯示原始影像與 Heatmap_Overlay。
6. IF Grad-CAM 計算過程中發生例外，THEN THE GradCAM_Generator SHALL 記錄錯誤詳情並通知 Web_UI 顯示錯誤訊息。
7. THE Web_UI SHALL 提供下載 Heatmap_Overlay 影像的功能。

---

### Requirement 5：LLM 串接與結構化報告產生

**User Story:** 身為醫療人員，我希望系統能自動產生包含 FINDINGS、IMPRESSION、RECOMMENDATION 的結構化醫療報告，以便輔助診斷決策。

#### Acceptance Criteria

1. WHEN Heatmap_Overlay 產生完成，THE Report_Generator SHALL 組合包含影像資訊、分類結果及信心分數的提示詞。
2. THE LLM_Client SHALL 透過 LM_Studio_API（http://localhost:1234）以 OpenAI-compatible chat completions 格式呼叫 MedGemma 1.5。
3. THE Report_Generator SHALL 要求 LLM_Client 產生包含 FINDINGS、IMPRESSION、RECOMMENDATION 三個段落的 Structured_Report。
4. WHEN Structured_Report 產生完成，THE Web_UI SHALL 以結構化格式分段顯示 FINDINGS、IMPRESSION、RECOMMENDATION。
5. IF LM_Studio_API 連線失敗，THEN THE LLM_Client SHALL 回傳錯誤訊息，說明無法連線至 http://localhost:1234，並建議使用者確認 LM Studio 是否正在執行。
6. IF LLM_Client 在 60 秒內未收到 LM_Studio_API 回應，THEN THE LLM_Client SHALL 中止請求並回傳逾時錯誤訊息。
7. WHILE 報告產生中，THE Web_UI SHALL 顯示載入狀態指示器。
8. THE Web_UI SHALL 提供將 Structured_Report 匯出為 PDF 或純文字格式的功能。

---

### Requirement 6：Web UI 介面設計

**User Story:** 身為醫療人員，我希望系統提供專業且直覺的操作介面，以便在臨床環境中高效使用。

#### Acceptance Criteria

1. THE Web_UI SHALL 採用深色醫療主題（Dark Medical Theme）配色，主背景色為深灰藍（#0F1923），強調色為藍綠色（Teal #00BCD4），文字為高對比白色，呈現專業醫療科技感。
2. THE Web_UI SHALL 採用三欄式主佈局：左欄（寬度約 25%）為影像上傳與模型設定區、中欄（寬度約 45%）為影像視覺化展示區、右欄（寬度約 30%）為結構化報告顯示區。
3. THE Web_UI SHALL 在頁面頂部顯示系統名稱標題列，包含系統 Logo 圖示與「Lung Cancer Analysis System」標題文字。
4. THE Web_UI 的影像展示區 SHALL 以卡片式（Card）元件並排顯示原始影像與 Heatmap_Overlay，每張卡片下方顯示對應標籤（「Original Image」/「Grad-CAM Overlay」）。
5. THE Web_UI 的報告顯示區 SHALL 以分段折疊面板（Accordion）或分色區塊分別呈現 FINDINGS、IMPRESSION、RECOMMENDATION 三個段落，各段落標題使用強調色標示。
6. THE Web_UI SHALL 在分類結果區域以水平進度條（Progress Bar）視覺化顯示各分類的信心分數。
7. THE Web_UI SHALL 支援響應式設計（Responsive Design），在 1280px 以上寬度維持三欄佈局，在 768px 至 1279px 寬度切換為兩欄佈局，在 767px 以下切換為單欄佈局。
8. THE Web_UI 的所有互動按鈕 SHALL 在 hover 狀態顯示視覺回饋（顏色變化或陰影效果）。

---

### Requirement 7：分析流程整合

**User Story:** 身為醫療人員，我希望系統能以單一操作完成從影像上傳到報告產生的完整流程，以便提升工作效率。

#### Acceptance Criteria

1. WHEN 使用者點擊「開始分析」按鈕，THE System SHALL 依序執行影像分類推論、Grad-CAM 熱力圖產生、結構化報告產生。
2. THE Web_UI SHALL 以進度指示器顯示目前執行步驟（分類中 / 產生熱力圖中 / 產生報告中）。
3. IF 任一步驟發生錯誤，THEN THE System SHALL 停止後續步驟並在 Web_UI 上顯示對應的錯誤訊息。
4. WHEN 完整分析流程完成，THE Web_UI SHALL 同時顯示原始影像、Heatmap_Overlay、分類結果及 Structured_Report。
5. THE Web_UI SHALL 提供「重新分析」功能，允許使用者在不重新上傳影像的情況下重新執行分析。

---

### Requirement 8：系統設定

**User Story:** 身為醫療人員，我希望能設定系統參數（如模型路徑、LM Studio API 端點），以便在不同環境下靈活使用系統。

#### Acceptance Criteria

1. THE System SHALL 支援透過設定檔（config.yaml 或 .env）指定模型檔案路徑。
2. THE System SHALL 支援透過設定檔指定 LM_Studio_API 端點 URL，預設值為 http://localhost:1234。
3. THE System SHALL 支援透過設定檔指定 MedGemma 1.5 的模型名稱識別碼。
4. WHERE 使用者未提供設定檔，THE System SHALL 使用預設設定值並繼續正常運作。
5. IF 設定檔中指定的模型檔案路徑不存在，THEN THE System SHALL 在啟動時顯示明確的錯誤訊息，說明找不到指定路徑的模型檔案。
