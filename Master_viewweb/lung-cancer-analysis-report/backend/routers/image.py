from __future__ import annotations
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.models.schemas import ErrorResponse, UploadImageResponse
from backend.utils.file_utils import get_temp_path, save_temp_file
from backend.utils.image_utils import (
    pil_to_base64,
    validate_image_format,
    validate_image_size,
)
from PIL import Image as PILImage
import io

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["image"])


@router.post("/upload-image", response_model=UploadImageResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a medical image for analysis."""
    if not validate_image_format(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload JPEG, PNG, or TIFF images.",
        )

    content = await file.read()

    if not validate_image_size(len(content)):
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 50MB.",
        )

    # Open image to get dimensions
    image = PILImage.open(io.BytesIO(content)).convert("RGB")
    width, height = image.size

    # Save as PNG to temp storage with consistent naming
    import io as _io
    png_buffer = _io.BytesIO()
    image.save(png_buffer, format="PNG")
    png_buffer.seek(0)
    file_id, file_path = save_temp_file(png_buffer.read(), suffix=".png")

    preview_base64 = pil_to_base64(image)

    return UploadImageResponse(
        image_id=file_id,
        filename=file.filename or "unknown",
        preview_base64=preview_base64,
        width=width,
        height=height,
        size_bytes=len(content),
    )


@router.get("/download/heatmap/{image_id}")
async def download_heatmap(image_id: str):
    """Download the Grad-CAM heatmap overlay image."""
    file_path = get_temp_path(image_id, suffix="_heatmap.png")
    import os
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Heatmap not found.")
    return FileResponse(file_path, media_type="image/png", filename=f"heatmap_{image_id}.png")
