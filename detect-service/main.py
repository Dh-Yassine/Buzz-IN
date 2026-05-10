"""
Recycling-Net-11 (SigLIP2) inference API for the BUZZ-IN web app.

POST /detect — multipart field `image` (same as VITE_DETECT_API_URL client).
Response: { "label": string, "confidence": number }

Model: https://huggingface.co/prithivMLmods/Recycling-Net-11
11 classes (from model config): aluminium, batteries, cardboard, disposable plates,
glass, hard plastic, paper, paper towel, polystyrene, soft plastics, takeaway cups.
"""

import io
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Union

# Windows HF cache symlink noise — harmless; optional Developer Mode on Windows removes it.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import AutoImageProcessor, SiglipForImageClassification

MODEL_NAME = "prithivMLmods/Recycling-Net-11"

processor: Optional[AutoImageProcessor] = None
model: Optional[SiglipForImageClassification] = None


def ensure_loaded() -> None:
    global processor, model
    if model is not None and processor is not None:
        return
    try:
        processor = AutoImageProcessor.from_pretrained(MODEL_NAME, use_fast=True)
    except Exception:
        processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = SiglipForImageClassification.from_pretrained(MODEL_NAME)
    model.eval()


def classify_pil(image: Image.Image) -> Dict[str, Any]:
    ensure_loaded()
    assert processor is not None and model is not None
    rgb = image.convert("RGB")
    inputs = processor(images=rgb, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1).squeeze(0)

    conf, pred_id = torch.max(probs, dim=-1)
    pid = int(pred_id.item())
    raw_map = model.config.id2label
    label = raw_map.get(pid) or raw_map.get(str(pid))
    if label is None:
        label = f"class_{pid}"

    def label_at(i: int) -> str:
        return str(raw_map.get(i) or raw_map.get(str(i)) or i)

    return {
        "label": str(label),
        "confidence": float(conf.item()),
        "scores": {label_at(i): float(probs[i].item()) for i in range(len(probs))},
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_loaded()
    yield


app = FastAPI(title="BUZZ-IN Recycling-Net-11", version="1.0.0", lifespan=lifespan)


def _cors_origins() -> List[str]:
    """Local dev defaults plus BUZZ_DETECT_CORS_ORIGINS (comma-separated), e.g. your Vercel/Netlify URL."""
    base = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    extra = os.environ.get("BUZZ_DETECT_CORS_ORIGINS", "").strip()
    if not extra:
        return base
    merged = base + [o.strip() for o in extra.split(",") if o.strip()]
    return list(dict.fromkeys(merged))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    ensure_loaded()
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/detect")
async def detect(image: UploadFile = File(...)) -> Dict[str, Union[float, str]]:
    raw = await image.read()
    pil = Image.open(io.BytesIO(raw))
    out = classify_pil(pil)
    return {"label": out["label"], "confidence": out["confidence"]}
