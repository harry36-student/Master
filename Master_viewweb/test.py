import torch
import torch.nn as nn
from torchvision import models

model_path = r"lung-cancer-analysis-report\best_model.pth"

checkpoint = torch.load(model_path, map_location="cpu")
print("type:", type(checkpoint))

if isinstance(checkpoint, dict):
    print("keys:", checkpoint.keys())
    state_dict = checkpoint.get("state_dict", checkpoint)
    state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}

    model = models.densenet121(weights=None)
    model.classifier = nn.Linear(1024, 3)
    model.load_state_dict(state_dict, strict=True)
else:
    model = checkpoint

model.eval()
print(model)