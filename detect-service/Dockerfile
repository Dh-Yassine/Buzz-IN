# Recycling-Net-11 API — deploy as a Web Service on Render, Fly.io, Railway, etc.
# Python 3.11 matches recommended local dev; PyTorch CPU wheel is installed via requirements.txt.
FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV HF_HUB_DISABLE_SYMLINKS_WARNING=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Render sets PORT; default 8788 for local docker run.
CMD sh -c 'uvicorn main:app --host 0.0.0.0 --port "${PORT:-8788}"'
