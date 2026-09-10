from __future__ import annotations
import base64
import io
import os
from pathlib import Path

import cv2
import numpy as np
from PIL import Image as PILImage


# Supported image extensions (lowercase)
SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tiff", ".tif"}


def validate_image_format(filename: str) -> bool:
    """
    Validate that the filename has a supported image extension.
    Returns True if and only if the extension is .jpg, .jpeg, .png, .tiff, or .tif
    (case-insensitive).
    """
    ext = Path(filename).suffix.lower()
    return ext in SUPPORTED_IMAGE_EXTENSIONS


def validate_image_size(size_bytes: int, max_mb: int = 50) -> bool:
    """
    Validate that the file size does not exceed the maximum allowed size.
    Returns True if size_bytes <= max_mb * 1024 * 1024.
    """
    return size_bytes <= max_mb * 1024 * 1024


def image_to_base64(image_array: np.ndarray) -> str:
    """
    Convert a NumPy image array (HWC, uint8) to a base64-encoded PNG string.
    """
    # Convert BGR to RGB if needed (OpenCV uses BGR)
    if image_array.ndim == 3 and image_array.shape[2] == 3:
        image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
    else:
        image_rgb = image_array
    pil_image = PILImage.fromarray(image_rgb.astype(np.uint8))
    return pil_to_base64(pil_image)


def pil_to_base64(image: PILImage.Image) -> str:
    """
    Convert a PIL Image to a base64-encoded PNG string.
    Returns PURE base64 string WITHOUT the data URI prefix.
    (Use pil_to_data_uri() if you need the full 'data:image/png;base64,...' prefix)
    """
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("utf-8")
    return encoded  # 純 base64，不含 data: 前綴


def pil_to_data_uri(image: PILImage.Image) -> str:
    """
    Convert a PIL Image to a complete data URI string.
    Returns: 'data:image/png;base64,...'
    """
    return f"data:image/png;base64,{pil_to_base64(image)}"


def load_image(path: str) -> PILImage.Image:
    """Load an image from disk and convert to RGB."""
    return PILImage.open(path).convert("RGB")


def pil_to_numpy(image: PILImage.Image) -> np.ndarray:
    """Convert PIL Image to float32 NumPy array in [0, 1] range, HWC format."""
    return np.array(image).astype(np.float32) / 255.0
