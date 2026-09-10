from __future__ import annotations
import logging
import os
import io
from fastapi import APIRouter, HTTPException
from backend.models.schemas import AnalyzeRequest, AnalyzeResponse, ClassificationOutput, GradCAMOutput, ReportOutput
from backend.routers.model import get_model_cache
from backend.services.classifier import Classifier, InferenceError
from backend.services.gradcam_generator import GradCAMError, GradCAMGenerator
from backend.services.model_loader import ModelLoader
from backend.utils.file_utils import get_temp_path
from PIL import Image as PILImage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analysis"])

_classifier = Classifier()
_gradcam_generator = GradCAMGenerator()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    from backend.main import get_report_generator
    rg = get_report_generator()   # 可能為 None（LLM 未啟動時）
    model_cache = get_model_cache()
    loader = ModelLoader()
    
    # 1. 取得模型 (FL 主模型 + Local 基準模型)
    fed_key = request.model_id or "fl-densenet121"
    local_key = fed_key.replace("fl-", "local-")
    
    # 動態載入缺失的模型
    for key in [fed_key, local_key]:
        if key not in model_cache:
            try:
                model_cache[key] = loader.load(key)
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"Model {key} failed to load: {e}")

    loaded_fed = model_cache[fed_key]
    loaded_local = model_cache[local_key]

    # 2. 讀取與預處理影像
    image_path = get_temp_path(request.image_id, suffix=".png")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found.")

    original_image = PILImage.open(image_path).convert("RGB")
    image_tensor = _classifier.preprocess_image(original_image)

    # 3. 推論與 Grad-CAM 生成 (雙軌執行)
    try:
        # 分類僅需使用主模型
        classification = _classifier.predict(loaded_fed, image_tensor)
        
        # 產生雙熱力圖
        fed_cam = _gradcam_generator.generate(loaded_fed, image_tensor, original_image, request.target_class)
        local_cam = _gradcam_generator.generate(loaded_local, image_tensor, original_image, request.target_class)
        
        # 清理 Base64 字串 (去除換行)
        fed_b64 = fed_cam.overlay_base64.replace('\n', '').replace('\r', '')
        local_b64 = local_cam.overlay_base64.replace('\n', '').replace('\r', '')

    except Exception as e:
        logger.error(f"Analysis pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    # 4. 生成報告（若 LLM 不可用則使用 fallback）
    from backend.services.report_generator import ReportGenerator
    _rg = rg if rg is not None else ReportGenerator(llm_client=None)
    image_meta = {"filename": "img.png", "width": original_image.width, "height": original_image.height}
    report = _rg.generate(classification, fed_cam, image_meta, request.report_language)

    return AnalyzeResponse(
        classification=ClassificationOutput(
            predicted_class=classification.predicted_class,
            predicted_label=classification.predicted_label,
            confidence=classification.confidence,
            all_probabilities=classification.all_probabilities,
        ),
        gradcam=GradCAMOutput(
            federated_base64=fed_b64,
            local_base64=local_b64,
            download_url=f"/api/download/heatmap/{request.image_id}",
        ),
        report=ReportOutput(
            findings=report.findings,
            impression=report.impression,
            recommendation=report.recommendation,
            generated_at=report.generated_at.isoformat(),
        ),
    )