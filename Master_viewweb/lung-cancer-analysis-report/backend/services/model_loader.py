from __future__ import annotations
import logging
import uuid
from pathlib import Path
from typing import Any, Optional

import torch
import torch.nn as nn
from torchvision import models  # 用於重建模型架構

from backend.models.schemas import LoadedModel
from backend.utils.file_utils import validate_model_format

logger = logging.getLogger(__name__)

# ─── 模型設定（支援多模型註冊表與 Grad-CAM Target Layer）────────────────────────
# 設定模型存放的基礎資料夾路徑，方便統一管理 (請確認此路徑是否正確)
import os as _os

# 🔥 動態解析專案根目錄（不硬編碼絕對路徑，確保在任何位置都能找到模型檔案）
# model_loader.py 位於 backend/services/，所以往上兩層就是專案根目錄
_THIS_FILE_DIR = _os.path.dirname(_os.path.abspath(__file__))      # backend/services/
_BACKEND_DIR   = _os.path.dirname(_THIS_FILE_DIR)                   # backend/
BASE_MODEL_DIR = _os.path.dirname(_BACKEND_DIR)                     # 專案根目錄


# 定義所有支援的模型配置（Key 對應前端下拉選單的 value）
# Grad-CAM 核心關鍵：必須精準指定各架構的最後一層卷積層 (target_layer)
MODEL_CONFIGS = {
    # ── FL 聯邦學習模型 ──────────────────────────────────────────
    "fl-densenet121": {
        "path": _os.path.join(BASE_MODEL_DIR, "experiment_results_20260503_011348", "fedprox_lung_final.pth"),
        "arch": "densenet121",
        "target_layer": "features.denseblock4.denselayer16",
        "in_features": 1024,
        "class_labels": ["Lung Adenocarcinoma", "Lung Squamous Cell Carcinoma", "Lung Benign Tissue"]
    },
    # ── Local 單一機構基準模型 ───────────────────────────────────────────────────────────
    "local-densenet121": {
        "path": _os.path.join(BASE_MODEL_DIR, "densenet121_bs64.pth"),
        "arch": "densenet121",
        "target_layer": "features.denseblock2.denselayer5",
        "in_features": 1024,
        "class_labels": ["Lung Adenocarcinoma", "Lung Benign Tissue", "Lung Squamous Cell Carcinoma"]
    },
    # 以下模型目前無對應 .pth 檔，暫時停用
    # 如需啟用，請於資料夾中放入對應的 .pth 檔案
    "fl-efficientnet-b3": {
        "path": _os.path.join(BASE_MODEL_DIR, "experiment_results_effnet_b3_20260503_144313", "fedprox_lung_final.pth"),
        "arch": "efficientnet_b3",
        "target_layer": "features.8.0",
        "in_features": 1536,
        "class_labels": ["Lung Adenocarcinoma", "Lung Squamous Cell Carcinoma", "Lung Benign Tissue"]
    },
    "local-efficientnet-b3": {
        "path": _os.path.join(BASE_MODEL_DIR, "efficientnet_b3_bs32.pth"),
        "arch": "efficientnet_b3",
        "target_layer": "features.8.0",
        "in_features": 1536,
        "class_labels": ["Lung Adenocarcinoma", "Lung Benign Tissue", "Lung Squamous Cell Carcinoma"]
    },
    "fl-mobilenetv3-small": {
        "path": _os.path.join(BASE_MODEL_DIR, "experiment_results_mobilenetv3_20260503_115343", "fedprox_lung_final.pth"),
        "arch": "mobilenet_v3_small",
        "target_layer": "features.12.0",
        "in_features": 576,
        "class_labels": ["Lung Adenocarcinoma", "Lung Squamous Cell Carcinoma", "Lung Benign Tissue"]
    },
    "local-mobilenetv3-small": {
        "path": _os.path.join(BASE_MODEL_DIR, "mobilenetv3_small_bs32.pth"),
        "arch": "mobilenet_v3_small",
        "target_layer": "features.12.0",
        "in_features": 576,
        "class_labels": ["Lung Adenocarcinoma", "Lung Benign Tissue", "Lung Squamous Cell Carcinoma"]
    },
}

# 肺癌組織病理學分類標籤
CLASS_LABELS = [
    "Lung Adenocarcinoma",              # index 0 → lung_aca（肺腺癌）
    "Lung Squamous Cell Carcinoma",     # index 1 → lung_scc（肺鱗狀細胞癌）
    "Lung Benign Tissue",               # index 2 → lung_bnt（肺良性組織）
]

# 分類數量與分類器設定
NUM_CLASSES = 3
CLASSIFIER_HIDDEN = 512
CLASSIFIER_DROPOUT = 0.3
# ─────────────────────────────────────────────────────────────────────────────

class ModelFormatError(Exception):
    """Raised when the model file format is not supported."""
    pass

class ModelLoadError(Exception):
    """Raised when the model file cannot be loaded."""
    pass

class NoConvLayerError(Exception):
    """Raised when no convolutional layer is found in the model."""
    pass

def detect_last_conv_layer(model: nn.Module) -> nn.Module:
    """
    Traverse all modules depth-first and return the last Conv2d or Conv3d layer.
    Raises NoConvLayerError if no convolutional layer is found.
    (這是在 Config 中找不到指定層時的 Grad-CAM 救命機制)
    """
    last_conv = None
    for module in model.modules():
        if isinstance(module, (nn.Conv2d, nn.Conv3d)):
            last_conv = module
    if last_conv is None:
        raise NoConvLayerError("No convolutional layer (Conv2d/Conv3d) found in the model.")
    return last_conv

def get_all_layer_names(model: nn.Module) -> list[str]:
    """Return a list of all named module names in the model."""
    return [name for name, _ in model.named_modules() if name]

class ModelLoader:
    """Loads PyTorch (.pt/.pth) or Keras (.h5) CNN models."""

    def load(
        self,
        model_key: str,  # 接收前端傳來的 model_key (例如 "fl-densenet121")
    ) -> LoadedModel:
        """
        根據 model_key 從註冊表載入對應的模型與 Grad-CAM 目標層。
        """
        # 1. 檢查模型是否存在於設定中
        if model_key not in MODEL_CONFIGS:
            raise ModelLoadError(f"Model key '{model_key}' not found in registry.")
            
        config = MODEL_CONFIGS[model_key]
        model_path = config["path"]
        target_layer = config["target_layer"] # 自動抓取對應架構的 Grad-CAM 層

        if not validate_model_format(model_path):
            ext = Path(model_path).suffix
            raise ModelFormatError(
                f"Unsupported model format '{ext}'. "
                f"Supported formats: .pt, .pth, .h5"
            )

        ext = Path(model_path).suffix.lower()
        model_id = str(uuid.uuid4())

        if ext in {".pt", ".pth"}:
            return self._load_pytorch(model_path, target_layer, model_id, config)
        else:  # .h5 (保留您原有的 Keras 支援)
            return self._load_keras(model_path, target_layer, model_id)

    def _load_pytorch(
        self,
        path: str,
        target_layer_name: Optional[str],
        model_id: str,
        config: dict,
    ) -> LoadedModel:
        """載入 PyTorch 模型並解析 Grad-CAM 目標層"""
        try:
            checkpoint = torch.load(path, map_location="cpu", weights_only=False)
            arch = config["arch"]
            in_features = config["in_features"]

            # 只要 checkpoint 是字典/OrderedDict，即判定為 state_dict 權重格式
            if isinstance(checkpoint, dict):
                # ── State dict 格式：依據架構動態重建網路 ──────────────
                logger.info(f"Detected state dict format. Rebuilding {arch} architecture...")

                if arch == "densenet121":
                    model = models.densenet121(weights=None)
                elif arch == "efficientnet_b3":
                    model = models.efficientnet_b3(weights=None)
                elif arch == "mobilenet_v3_small":
                    model = models.mobilenet_v3_small(weights=None)
                else:
                    raise ModelLoadError(f"Unsupported architecture: {arch}")

                # 取得核心 state_dict
                state_dict = checkpoint.get("state_dict", checkpoint)
                if "model" in checkpoint and isinstance(checkpoint["model"], dict):
                    state_dict = checkpoint["model"]

                # 移除可能的前綴 (如 module.、backbone. 或 model.)
                cleaned_state_dict = {}
                for k, v in state_dict.items():
                    k_clean = k
                    if k_clean.startswith("module."):
                        k_clean = k_clean[len("module."):]
                    if k_clean.startswith("backbone."):
                        k_clean = k_clean[len("backbone."):]
                    if k_clean.startswith("model."):
                        k_clean = k_clean[len("model."):]
                    cleaned_state_dict[k_clean] = v
                state_dict = cleaned_state_dict

                # ── 動態偵測與重建分類頭 (Classifier Head) 結構 ──
                #if arch == "mobilenet_v3_small":
                    # MobileNetV3 特殊的雙層/多層分類頭
                if arch == "mobilenet_v3_small":
                    # 檢查是否為全自訂分類頭 (整個 classifier 被取代為 Sequential(Linear(576, 512), ReLU, Dropout, Linear(512, 3)))
                    # 當 classifier.0.weight 的第一維度是 512 (或與傳統 1024 不同)
                    if "classifier.0.weight" in state_dict and state_dict["classifier.0.weight"].shape[0] == CLASSIFIER_HIDDEN:
                        logger.info("Rebuilding MobilenetV3 full custom Sequential classifier head...")
                        model.classifier = nn.Sequential(
                            nn.Linear(in_features, CLASSIFIER_HIDDEN),
                            nn.ReLU(),
                            nn.Dropout(CLASSIFIER_DROPOUT),
                            nn.Linear(CLASSIFIER_HIDDEN, NUM_CLASSES),
                        )
                    # 否則檢查是否為雙層/多層自訂分類頭 (只取代 classifier[3] 為 Sequential)
                    elif any(k.startswith("classifier.3.0.") for k in state_dict.keys()):
                        logger.info("Rebuilding MobilenetV3 custom Sequential classifier[3] head...")
                        model.classifier[3] = nn.Sequential(
                            nn.Linear(1024, CLASSIFIER_HIDDEN),
                            nn.ReLU(),
                            nn.Dropout(CLASSIFIER_DROPOUT),
                            nn.Linear(CLASSIFIER_HIDDEN, NUM_CLASSES),
                        )
                    elif any(k.startswith("classifier.3.") for k in state_dict.keys()):
                        logger.info("Rebuilding MobilenetV3 standard Linear classifier[3] head...")
                        model.classifier[3] = nn.Linear(1024, NUM_CLASSES)
                    elif any(k.startswith("classifier.weight") for k in state_dict.keys()):
                        logger.info("Rebuilding MobilenetV3 full Linear classifier head...")
                        model.classifier = nn.Linear(in_features, NUM_CLASSES)
                else:
                    # DenseNet121 與 EfficientNet-B3
                    if any(k.startswith("classifier.1.") for k in state_dict.keys()):
                        # 適用於含 Dropout 的自訂分類頭 (例如：0: Dropout, 1: Linear, 2: ReLU, 3: Dropout, 4: Linear)
                        logger.info("Rebuilding custom Sequential classifier head with leading Dropout...")
                        model.classifier = nn.Sequential(
                            nn.Dropout(p=0.2),
                            nn.Linear(in_features, CLASSIFIER_HIDDEN),
                            nn.ReLU(),
                            nn.Dropout(CLASSIFIER_DROPOUT),
                            nn.Linear(CLASSIFIER_HIDDEN, NUM_CLASSES),
                        )
                    elif any(k.startswith("classifier.0.") for k in state_dict.keys()):
                        # 適用於不含領頭 Dropout 的自訂分類頭
                        logger.info("Rebuilding custom Sequential classifier head...")
                        model.classifier = nn.Sequential(
                            nn.Linear(in_features, CLASSIFIER_HIDDEN),
                            nn.ReLU(),
                            nn.Dropout(CLASSIFIER_DROPOUT),
                            nn.Linear(CLASSIFIER_HIDDEN, NUM_CLASSES),
                        )
                    else:
                        logger.info("Rebuilding standard Linear classifier head...")
                        model.classifier = nn.Linear(in_features, NUM_CLASSES)

                model.load_state_dict(state_dict, strict=True)
                logger.info(f"{arch} state dict loaded successfully.")

            else:
                # ── 完整模型格式：直接載入 ───────────────────────────
                logger.info("Detected full model format. Loading directly...")
                model = checkpoint

            model.eval()  # 切換為推論模式
            layer_names = get_all_layer_names(model)

            # ── 解析 Grad-CAM Target Layer ─────────────────────────
            # 將從 config 抓出來的 target_layer_name 映射成實際的 PyTorch module 物件
            resolved_target_layer_name = target_layer_name
            target_layer_obj = None
            
            for name, module in model.named_modules():
                if name == resolved_target_layer_name:
                    target_layer_obj = module
                    break

            if target_layer_obj is None:
                # 如果 config 寫錯了，啟動自動尋找最後一層卷積層的救命機制
                logger.warning(
                    f"Target layer '{resolved_target_layer_name}' not found in {arch}. "
                    f"Falling back to last Conv2d layer."
                )
                target_layer_obj = detect_last_conv_layer(model)
                resolved_target_layer_name = ""
                for name, module in model.named_modules():
                    if module is target_layer_obj:
                        resolved_target_layer_name = name
                        break

            logger.info(f"Grad-CAM target layer successfully bound to: {resolved_target_layer_name}")

            return LoadedModel(
                model=model,
                framework="pytorch",
                target_layer_name=resolved_target_layer_name,
                target_layer=target_layer_obj,
                model_id=model_id,
                layer_names=layer_names,
                class_labels=config.get("class_labels", CLASS_LABELS),
            )

        except Exception as e:
            logger.error(f"Unexpected error loading PyTorch model: {e}", exc_info=True)
            raise ModelLoadError(f"Failed to load PyTorch model from '{path}': {e}")

    def _load_keras(
        self,
        path: str,
        target_layer_name: Optional[str],
        model_id: str,
    ) -> LoadedModel:
        """Load a Keras/TensorFlow model. (保留您的原始實作)"""
        try:
            import tensorflow as tf  # type: ignore
            model = tf.keras.models.load_model(path)

            layer_names = [layer.name for layer in model.layers]

            if target_layer_name:
                try:
                    model.get_layer(target_layer_name)
                except ValueError:
                    raise ModelLoadError(
                        f"Target layer '{target_layer_name}' not found in Keras model. "
                        f"Available layers: {layer_names[:10]}..."
                    )
            else:
                last_conv_name = None
                for layer in model.layers:
                    if "conv" in layer.__class__.__name__.lower():
                        last_conv_name = layer.name
                if last_conv_name is None:
                    raise NoConvLayerError("No convolutional layer found in the Keras model.")
                target_layer_name = last_conv_name

            return LoadedModel(
                model=model,
                framework="keras",
                target_layer_name=target_layer_name,
                target_layer=target_layer_name,  # Keras uses layer name string
                model_id=model_id,
                layer_names=layer_names,
                class_labels=CLASS_LABELS,
            )

        except (ModelFormatError, ModelLoadError, NoConvLayerError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error loading Keras model: {e}", exc_info=True)
            raise ModelLoadError(f"Failed to load Keras model from '{path}': {e}")