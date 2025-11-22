# FutriFix — Full Project (reconstructed)

This repository contains a full, working local/dev Docker setup for FutriFix:
- Frontend: static site served by NGINX (Docker)
- Backend: Node.js + Express (Docker)
- Persistent DB: `db.json` stored in a Docker volume

## Local development with Docker (recommended)

1. Build & start:
```bash
docker-compose up --build
