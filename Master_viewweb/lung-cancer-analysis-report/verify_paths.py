import os, sys
sys.path.insert(0, '.')
from backend.services.model_loader import BASE_MODEL_DIR, MODEL_CONFIGS
print('BASE_MODEL_DIR:', BASE_MODEL_DIR)
print()
for k, cfg in MODEL_CONFIGS.items():
    exists = os.path.exists(cfg['path'])
    status = "OK" if exists else "MISSING"
    print(f"  [{status}] {k}")
    print(f"         {cfg['path']}")
