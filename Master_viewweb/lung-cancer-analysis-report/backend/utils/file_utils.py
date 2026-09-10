from __future__ import annotations
import os
import uuid
import tempfile
from pathlib import Path


# Supported model file extensions (lowercase)
SUPPORTED_MODEL_EXTENSIONS = {".pt", ".pth", ".h5"}

# Temporary file storage directory
TEMP_DIR = os.path.join(tempfile.gettempdir(), "lung_cancer_analysis")
os.makedirs(TEMP_DIR, exist_ok=True)


def validate_model_format(path: str) -> bool:
    """
    Validate that the file path has a supported model extension.
    Returns True if and only if the extension is .pt, .pth, or .h5
    (case-insensitive).
    """
    ext = Path(path).suffix.lower()
    return ext in SUPPORTED_MODEL_EXTENSIONS


def save_temp_file(content: bytes, suffix: str = ".png") -> tuple[str, str]:
    """
    Save binary content to a temporary file.
    Returns (file_id, file_path).
    """
    file_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{file_id}{suffix}")
    with open(file_path, "wb") as f:
        f.write(content)
    return file_id, file_path


def get_temp_path(file_id: str, suffix: str = ".png") -> str:
    """Get the full path for a temporary file by its ID."""
    return os.path.join(TEMP_DIR, f"{file_id}{suffix}")


def cleanup_temp_file(file_id: str, suffix: str = ".png") -> bool:
    """
    Delete a temporary file by its ID.
    Returns True if the file was deleted, False if it did not exist.
    """
    file_path = get_temp_path(file_id, suffix)
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False


def get_temp_dir() -> str:
    """Return the temporary directory path."""
    return TEMP_DIR
