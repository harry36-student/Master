from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException

from backend.models.schemas import LoadModelRequest, LoadModelResponse
from backend.services.model_loader import (
    ModelFormatError,
    ModelLoadError,
    ModelLoader,
    NoConvLayerError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["model"])

# In-memory model cache: model_id -> LoadedModel
_model_cache: dict = {}
_model_loader = ModelLoader()


def get_model_cache() -> dict:
    return _model_cache


@router.post("/load-model", response_model=LoadModelResponse)
async def load_model(request: LoadModelRequest):
    """Load a CNN model for inference."""
    try:
        loaded = _model_loader.load(request.model_path, request.target_layer)
        _model_cache[loaded.model_id] = loaded
        return LoadModelResponse(
            model_id=loaded.model_id,
            framework=loaded.framework,
            target_layer=loaded.target_layer_name,
            layer_names=loaded.layer_names,
        )
    except ModelFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (ModelLoadError, NoConvLayerError) as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error loading model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")
