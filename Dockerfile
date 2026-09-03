# ==========================================
# BiteScan — Production Multi-Stage Dockerfile
# Serves both React frontend & FastAPI backend
# ==========================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install required OS libraries for OpenCV & imaging
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 8000

ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
