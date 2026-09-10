from __future__ import annotations
import logging
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image as PILImage
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from backend.models.schemas import GradCAMResult, LoadedModel
from backend.utils.image_utils import pil_to_base64, pil_to_numpy

logger = logging.getLogger(__name__)


class GradCAMError(Exception):
    """Raised when Grad-CAM computation fails."""
    pass


def normalize_cam(cam: np.ndarray) -> np.ndarray:
    """
    Normalize a CAM array to [0, 1] range.
    Handles edge cases: all-zero arrays, constant arrays, arrays with negative values.
    """
    cam_min = cam.min()
    cam_max = cam.max()
    if cam_max - cam_min < 1e-8:
        # All values are the same (including all-zero) — return zeros
        return np.zeros_like(cam, dtype=np.float32)
    normalized = (cam - cam_min) / (cam_max - cam_min)
    return normalized.astype(np.float32)


class GradCAMGenerator:
    """Generates Grad-CAM heatmaps and overlays them on original images."""

    def _apply_colormap(self, cam: np.ndarray) -> np.ndarray:
        """
        Apply jet colormap to a normalized [0,1] CAM array.
        Returns an RGB uint8 array of the same spatial dimensions.
        """
        cam_uint8 = np.uint8(255 * cam)
        heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)
        return heatmap_rgb

    def _overlay(
        self,
        original: np.ndarray,
        heatmap: np.ndarray,
        alpha: float = 0.5,
    ) -> np.ndarray:
        """
        Alpha-blend heatmap onto original image.
        Both arrays must be uint8 RGB. Output has the same size as original.
        """
        h, w = original.shape[:2]
        # Resize heatmap to match original if needed
        if heatmap.shape[:2] != (h, w):
            heatmap = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_LINEAR)
        overlay = cv2.addWeighted(original, 1 - alpha, heatmap, alpha, 0)
        return overlay

    def generate(
        self,
        model: LoadedModel,
        image_tensor: torch.Tensor,
        original_image: PILImage.Image,
        target_class: Optional[int] = None,
    ) -> GradCAMResult:
        """
        Generate Grad-CAM heatmap and overlay on the original image.

        Args:
            model: LoadedModel with PyTorch model and target_layer.
            image_tensor: Preprocessed image tensor (1, C, H, W).
            original_image: Original PIL Image for overlay.
            target_class: Target class index. If None, uses the predicted class.

        Returns:
            GradCAMResult with cam_array, heatmap_rgb, overlay_image, overlay_base64.

        Raises:
            GradCAMError: If Grad-CAM computation fails.
        """
        try:
            torch_model = model.model
            target_layer = model.target_layer

            targets = (
                [ClassifierOutputTarget(target_class)]
                if target_class is not None
                else None
            )

            with GradCAM(model=torch_model, target_layers=[target_layer]) as cam:
                grayscale_cam = cam(input_tensor=image_tensor, targets=targets)
                grayscale_cam = grayscale_cam[0]  # shape: (H, W)

            # Normalize to [0, 1]
            cam_normalized = normalize_cam(grayscale_cam)

            # Apply jet colormap
            heatmap_rgb = self._apply_colormap(cam_normalized)

            # Convert original image to uint8 numpy array
            original_np = np.array(original_image.convert("RGB")).astype(np.uint8)

            # Overlay heatmap on original image
            overlay_np = self._overlay(original_np, heatmap_rgb, alpha=0.5)
            overlay_pil = PILImage.fromarray(overlay_np)

            return GradCAMResult(
                cam_array=cam_normalized,
                heatmap_rgb=heatmap_rgb,
                overlay_image=overlay_pil,
                overlay_base64=pil_to_base64(overlay_pil),
            )

        except GradCAMError:
            raise
        except Exception as e:
            logger.error(f"Grad-CAM error: {e}", exc_info=True)
            raise GradCAMError(f"Grad-CAM computation failed: {e}")
