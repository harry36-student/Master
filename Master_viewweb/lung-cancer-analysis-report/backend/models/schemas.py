from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
import numpy as np
from PIL import Image as PILImage
from pydantic import BaseModel


# ─── API Request / Response Models ───────────────────────────────────────────

class UploadImageResponse(BaseModel):
    image_id: str
    filename: str
    preview_base64: str
    width: int
    height: int
    size_bytes: int


class LoadModelRequest(BaseModel):
    model_path: str
    target_layer: Optional[str] = None


class LoadModelResponse(BaseModel):
    model_id: str
    framework: str  # "pytorch" | "keras"
    target_layer: str
    layer_names: list[str]


class AnalyzeRequest(BaseModel):
    image_id: str
    model_id: str
    target_class: Optional[int] = None
    report_language: str = "Traditional Chinese"  # 報告語言，預設繁體中文


class ClassificationOutput(BaseModel):
    predicted_class: int
    predicted_label: str
    confidence: float
    all_probabilities: list[dict]  # [{"label": str, "probability": float}]


class GradCAMOutput(BaseModel):
    federated_base64: str
    local_base64: str
    download_url: str


class ReportOutput(BaseModel):
    findings: str
    impression: str
    recommendation: str
    generated_at: str  # ISO8601


class AnalyzeResponse(BaseModel):
    classification: ClassificationOutput
    gradcam: GradCAMOutput
    report: ReportOutput


class ExportReportRequest(BaseModel):
    findings: str
    impression: str
    recommendation: str
    format: str  # "pdf" | "txt"


class HealthResponse(BaseModel):
    status: str
    llm_reachable: bool
    model_loaded: bool


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    detail: Optional[str] = None
    timestamp: datetime


# ─── Internal Data Classes ────────────────────────────────────────────────────

@dataclass
class LoadedModel:
    model: Any                   # torch.nn.Module or keras.Model
    framework: str               # "pytorch" | "keras"
    target_layer_name: str
    target_layer: Any            # actual layer object (PyTorch) or layer name (Keras)
    model_id: str = ""
    layer_names: list[str] = field(default_factory=list)
    class_labels: list[str] = field(default_factory=list)


@dataclass
class ClassificationResult:
    predicted_class: int
    predicted_label: str
    confidence: float
    all_probabilities: list[dict]  # [{"label": str, "probability": float}]


@dataclass
class GradCAMResult:
    cam_array: Any               # np.ndarray, normalized [0,1]
    heatmap_rgb: Any             # np.ndarray, jet colormap RGB
    overlay_image: Any           # PIL.Image
    overlay_base64: str          # base64 encoded string for frontend


@dataclass
class StructuredReport:
    findings: str
    impression: str
    recommendation: str
    raw_text: str
    generated_at: datetime = field(default_factory=datetime.utcnow)
