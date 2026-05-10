"""
Optional Gradio UI for Recycling-Net-11 (same weights as main.py).

Run: python gradio_app.py
"""

import gradio as gr
import numpy as np
from PIL import Image
from typing import Optional

from main import MODEL_NAME, classify_pil


def classify_numpy(image: Optional[np.ndarray]):
    if image is None:
        return {}
    pil = Image.fromarray(image).convert("RGB")
    out = classify_pil(pil)
    return out["scores"]


iface = gr.Interface(
    fn=classify_numpy,
    inputs=gr.Image(type="numpy", label="Photo of one waste item"),
    outputs=gr.Label(label="Recycling-Net-11 class scores"),
    title="Recycling-Net-11 (SigLIP2)",
    description=(
        f"Model `{MODEL_NAME}` — 11 recyclability-oriented classes "
        "(see Hugging Face model card)."
    ),
)

if __name__ == "__main__":
    iface.launch()
