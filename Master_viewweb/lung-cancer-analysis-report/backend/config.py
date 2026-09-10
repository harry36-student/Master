from pydantic_settings import BaseSettings
from typing import Optional
import os

class AppConfig(BaseSettings):
    # 將 model_path 改為 Optional，並移除強制驗證
    model_path: Optional[str] = None 
    lm_studio_url: str = "http://localhost:1234"
    llm_model_name: str = "medgemma-1.5"
    default_target_layer: str = ""
    max_image_size_mb: int = 50
    llm_timeout_seconds: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
        "protected_namespaces": ("settings_",),
    }

    # [🔥 直接刪除或註解掉 validate_model_path 這個函式]
    # 因為我們已經不再透過 config.yaml 管理單一模型路徑了

def get_config() -> AppConfig:
    """Load configuration from config.yaml and .env"""
    import yaml

    yaml_config = {}
    yaml_path = "config.yaml"
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            yaml_config = yaml.safe_load(f) or {}
            
    # Filter out empty string values so defaults apply
    # 我們這裡加入一個過濾，確保 model_path 為空時不會觸發錯誤
    filtered_config = {k: v for k, v in yaml_config.items() if v != "" and v is not None}
    
    return AppConfig(**filtered_config)