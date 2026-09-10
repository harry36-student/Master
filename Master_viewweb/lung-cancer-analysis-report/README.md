# Lung Cancer Analysis System

醫療影像分析系統，整合 CNN 深度學習模型視覺化（Grad-CAM）與本地 LLM（MedGemma 1.5）
自動產出結構化醫療報告。

## 功能

- 上傳肺癌組織病理學影像（JPEG、PNG、TIFF）
- 使用已訓練的 CNN 模型進行分類推論
- 產生 Grad-CAM 熱力圖視覺化
- 透過 LM Studio 串接 MedGemma 1.5 產出結構化醫療報告

## 快速開始

### 後端

```bash
cd lung-cancer-analysis-report
pip install -r requirements.txt
cp .env.example .env
# 編輯 .env 設定模型路徑
uvicorn backend.main:app --reload --port 8000
```

### 前端

直接在瀏覽器開啟 `frontend/index.html`，或使用任意靜態檔案伺服器。

## 設定

編輯 `config.yaml` 或 `.env` 設定以下參數：

- `MODEL_PATH`：已訓練模型的檔案路徑（.pt、.pth 或 .h5）
- `LM_STUDIO_URL`：LM Studio API 端點（預設 http://localhost:1234）
- `LLM_MODEL_NAME`：MedGemma 模型名稱識別碼
- `MAX_IMAGE_SIZE_MB`：影像上傳大小上限（預設 50MB）
- `LLM_TIMEOUT_SECONDS`：LLM 回應逾時秒數（預設 60 秒）

## 測試

```bash
pytest backend/tests/ -v --cov=backend
```
