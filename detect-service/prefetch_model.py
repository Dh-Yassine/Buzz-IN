"""Run during Docker build to cache Recycling-Net-11 in the image (fewer runtime HF failures / rate limits)."""
import os

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

MODEL_NAME = "prithivMLmods/Recycling-Net-11"

from transformers import AutoImageProcessor, SiglipForImageClassification

try:
    AutoImageProcessor.from_pretrained(MODEL_NAME, backend="torchvision")
except TypeError:
    try:
        AutoImageProcessor.from_pretrained(MODEL_NAME, use_fast=True)
    except Exception:
        AutoImageProcessor.from_pretrained(MODEL_NAME)
except Exception:
    AutoImageProcessor.from_pretrained(MODEL_NAME)

SiglipForImageClassification.from_pretrained(MODEL_NAME)
print(f"prefetch_model: cached {MODEL_NAME}")
