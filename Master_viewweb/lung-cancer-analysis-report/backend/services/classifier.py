from __future__ import annotations
import logging
from typing import Optional

import torch
import torch.nn.functional as F
from PIL import Image as PILImage
from torchvision import transforms

from backend.models.schemas import ClassificationResult, LoadedModel
from backend.services.model_loader import CLASS_LABELS  # 使用硬寫的標籤

logger = logging.getLogger(__name__)

# 使用 model_loader.py 中定義的標籤（與模型訓練時一致）
DEFAULT_CLASS_LABELS = CLASS_LABELS

# Default preprocessing transform
DEFAULT_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class InferenceError(Exception):
    """Raised when model inference fails."""
    pass


class Classifier:
    """Runs CNN inference and returns classification results."""

    def __init__(self, class_labels: Optional[list[str]] = None):
        self.class_labels = class_labels or DEFAULT_CLASS_LABELS

    def preprocess_image(self, image: PILImage.Image) -> torch.Tensor:
        """
        Preprocess a PIL Image for CNN inference.
        Returns a batch tensor of shape (1, C, H, W).
        """
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = DEFAULT_TRANSFORM(image)
        return tensor.unsqueeze(0)  # Add batch dimension

    def predict(
        self,
        model: LoadedModel,
        image_tensor: torch.Tensor,
    ) -> ClassificationResult:
        """
        Run forward pass and return ClassificationResult.

        Args:
            model: LoadedModel instance (PyTorch only for now).
            image_tensor: Preprocessed image tensor of shape (1, C, H, W).

        Returns:
            ClassificationResult with predicted class, label, confidence, and all probabilities.

        Raises:
            InferenceError: If inference fails.
        """
        try:
            torch_model = model.model
            torch_model.eval()

            with torch.no_grad():
                outputs = torch_model(image_tensor)

            # Apply softmax to get probabilities
            probabilities = F.softmax(outputs, dim=1).squeeze(0)  # shape: (num_classes,)
            prob_list = probabilities.tolist()

            predicted_class = int(torch.argmax(probabilities).item())
            confidence = float(prob_list[predicted_class])

            # Build label list — use model's specific class_labels if available, else use default labels
            labels = model.class_labels if hasattr(model, "class_labels") and model.class_labels else self._get_labels(len(prob_list))
            if len(labels) < len(prob_list):
                extended = list(labels)
                for i in range(len(labels), len(prob_list)):
                    extended.append(f"Class {i}")
                labels = extended

            all_probabilities = [
                {"label": labels[i], "probability": float(prob_list[i])}
                for i in range(len(prob_list))
            ]

            return ClassificationResult(
                predicted_class=predicted_class,
                predicted_label=labels[predicted_class],
                confidence=confidence,
                all_probabilities=all_probabilities,
            )

        except InferenceError:
            raise
        except Exception as e:
            logger.error(f"Inference error: {e}", exc_info=True)
            raise InferenceError(f"Model inference failed: {e}")

    def _get_labels(self, num_classes: int) -> list[str]:
        """Return class labels, extending with generic names if needed."""
        if len(self.class_labels) >= num_classes:
            return self.class_labels[:num_classes]
        # Extend with generic class names
        extended = list(self.class_labels)
        for i in range(len(self.class_labels), num_classes):
            extended.append(f"Class {i}")
        return extended
