# Recycling-Net-11 API — deploy as a Web Service on Render, Fly.io, Railway, etc.
# Install CPU-only PyTorch first — otherwise pip pulls CUDA stacks (~GB) and free-tier deploys OOM/fail.
FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV HF_HUB_DISABLE_SYMLINKS_WARNING=1

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
 && grep -v '^[[:space:]]*#' requirements.txt | grep -v '^[[:space:]]*$' | grep -v '^torch' > /tmp/req-notorch.txt \
 && pip install --no-cache-dir -r /tmp/req-notorch.txt

COPY prefetch_model.py .
# Bake public model weights into the image (avoids HF download during cold start; optional HF_TOKEN at runtime still helps).
RUN python prefetch_model.py

COPY main.py .

# Render sets PORT; default 8788 for local docker run.
CMD sh -c 'uvicorn main:app --host 0.0.0.0 --port "${PORT:-8788}"'
