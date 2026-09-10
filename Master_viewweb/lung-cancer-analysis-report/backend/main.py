from __future__ import annotations
import logging
import os  # 🔥 [新增] 引入 os 模組處理路徑
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse  # 🔥 [新增] FileResponse 用於回傳 HTML
from fastapi.staticfiles import StaticFiles             # 🔥 [新增] StaticFiles 用於掛載靜態資料夾

from backend.config import get_config
from backend.models.schemas import ErrorResponse, HealthResponse
from backend.routers import analysis, image, model, report
from backend.services.llm_client import LLMClient
from backend.services.report_generator import ReportGenerator
from backend.services.model_loader import ModelLoader, MODEL_CONFIGS 

logger = logging.getLogger(__name__)

# Global instances
_config = None
_llm_client = None
_report_generator = None

def get_report_generator() -> ReportGenerator:
    global _report_generator, _llm_client, _config
    if _report_generator is None:
        if _config is None:
            _config = get_config()
        _llm_client = LLMClient(_config)
        _report_generator = ReportGenerator(_llm_client)
    return _report_generator

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _config, _llm_client, _report_generator
    _config = get_config()

    from backend.routers.model import get_model_cache
    model_cache = get_model_cache()
    loader = ModelLoader()

    logger.info(f"System warming up: Loading all {len(MODEL_CONFIGS)} models...")
    for key in MODEL_CONFIGS.keys():
        try:
            logger.info(f"Pre-loading model: {key}...")
            loaded = loader.load(key)
            model_cache[key] = loaded
            if key == "fl-densenet121":
                model_cache["default"] = loaded
            logger.info(f"Model {key} loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to pre-load model {key}: {e}")

    try:
        _llm_client = LLMClient(_config)
        _report_generator = ReportGenerator(_llm_client)
        logger.info("LLM Client initialized.")
    except Exception as e:
        logger.warning(f"LLM Client init failed: {e}.")
        _llm_client = None
        _report_generator = None

    logger.info("Lung Cancer Histopathology Analysis System started with all models ready.")
    yield
    logger.info("Lung Cancer System shutting down.")

# 宣告 FastAPI 應用程式
app = FastAPI(
    title="Lung Cancer Analysis System",
    description="Medical image analysis with Grad-CAM and LLM report generation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊 API 路由
app.include_router(image.router)
app.include_router(model.router)
app.include_router(analysis.router)
app.include_router(report.router)

# ══════════════════════════════════════════════
# [🔥 關鍵]：前端靜態檔案掛載與根目錄路由
# ══════════════════════════════════════════════
# 使用 __file__ 解析為絕對路徑，確保不論從哪個工作目錄啟動都能找到 frontend
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
FRONTEND_DIR = os.path.join(_PROJECT_ROOT, "frontend")

if os.path.exists(FRONTEND_DIR):
    # 掛載 CSS 與 JS 目錄，讓前端 index.html 可以讀取到它們
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

    @app.get("/")
    async def serve_index():
        """當使用者造訪根目錄時，回傳前端的 index.html"""
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    logger.warning(f"找不到前端資料夾 '{FRONTEND_DIR}'，靜態檔案將無法提供服務。")
    @app.get("/")
    async def serve_index_fallback():
        return JSONResponse(
            status_code=404, 
            content={"message": f"請確保專案根目錄下有 'frontend' 資料夾，並將 index.html 放入其中。"}
        )
# ══════════════════════════════════════════════

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred.",
            detail=str(exc),
            timestamp=datetime.utcnow(),
        ).model_dump(mode="json"),
    )

def parse_training_history(file_path: str) -> dict[str, list[float]]:
    rounds = []
    loss = []
    accuracy = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines[1:]:  # skip header
                if not line.strip():
                    continue
                parts = line.strip().split(",")
                if len(parts) >= 3:
                    try:
                        rounds.append(int(parts[0]))
                        loss.append(float(parts[1]))
                        accuracy.append(float(parts[2]))
                    except ValueError:
                        pass
    return {"rounds": rounds, "loss": loss, "accuracy": accuracy}

@app.get("/api/federated/history")
async def get_federated_history():
    densenet_path = os.path.join(_PROJECT_ROOT, "experiment_results_20260503_011348", "training_history.csv")
    effnet_path = os.path.join(_PROJECT_ROOT, "experiment_results_effnet_b3_20260503_144313", "training_history.csv")
    mobilenet_path = os.path.join(_PROJECT_ROOT, "experiment_results_mobilenetv3_20260503_115343", "training_history.csv")

    densenet_data = parse_training_history(densenet_path)
    effnet_data = parse_training_history(effnet_path)
    mobilenet_data = parse_training_history(mobilenet_path)

    rounds = densenet_data.get("rounds", list(range(1, 21)))

    return {
        "rounds": rounds,
        "densenet121": {
            "loss": densenet_data.get("loss", []),
            "accuracy": densenet_data.get("accuracy", [])
        },
        "efficientnet_b3": {
            "loss": effnet_data.get("loss", []),
            "accuracy": effnet_data.get("accuracy", [])
        },
        "mobilenet_v3_small": {
            "loss": mobilenet_data.get("loss", []),
            "accuracy": mobilenet_data.get("accuracy", [])
        }
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    from backend.routers.model import get_model_cache
    llm_reachable = False
    try:
        import httpx
        r = httpx.get(f"{_config.lm_studio_url}/v1/models", timeout=3.0)
        llm_reachable = r.status_code == 200
    except Exception:
        pass

    return HealthResponse(
        status="ok",
        llm_reachable=llm_reachable,
        model_loaded=len(get_model_cache()) > 0,
    )