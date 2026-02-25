# Sborka — Generative Educational Platform

AI-powered platform that generates structured educational content from user requests.

## Quick Start

```bash
# Install dependencies
make install

# Copy and configure environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run development servers
make dev-backend   # Backend on :8000
make dev-frontend  # Frontend on :5173
```

## Stack

- **Backend:** Python / FastAPI / SQLite / Anthropic Claude API
- **Frontend:** React / TypeScript / Vite / Tailwind CSS
- **Streaming:** Server-Sent Events (SSE)

## Architecture

User request → Classifier → Outline → Scaffolder → Filler → SSE stream → React UI
