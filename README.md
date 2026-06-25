# DevMemory — Your Codebase Never Forgets

> Persistent memory for dev teams. Ask your codebase anything, across infinite sessions.

## The Problem
"Why was this module rewritten?" / "Who owns the auth service?" / "What caused the payment bug last sprint?" — questions that every dev on every team loses hours answering, because that knowledge lives in someone's head, a buried Slack thread, or a PR from 8 months ago.

## How It Works
DevMemory connects to your Git repos, pull requests, commit history, and architecture docs, then lets developers query institutional knowledge across sessions using natural language. It is powered by a real Python FastAPI backend that integrates the Cognee hybrid graph-vector memory engine.

## Cognee Memory Lifecycle
- `remember()` — ingests commits, PRs, docs into the knowledge graph
- `recall()` — natural language Q&A with graph traversal
- `improve()` — reinforced from developer feedback nightly
- `forget()` — deprecated repos pruned surgically

## Quick Start (Local Docker Compose)

This project has been migrated to use a real Python FastAPI backend for full Cognee integration. To run the full stack:

```bash
# 1. Clone or download this project
# 2. Add your API keys
cp .env.example .env

# Edit .env and add your Cognee Cloud credentials:
# COGNEE_CLOUD_API_URL=https://your-instance.cognee.ai
# COGNEE_CLOUD_AUTH_TOKEN=ck_your_token_here

# 3. Start the full stack
docker compose up
```

Open `http://localhost:3000` to view the frontend.

## Tech Stack
| Layer | Technology |
|---|---|
| Memory engine | Cognee (Python SDK) |
| Backend API | FastAPI + Python asyncio |
| Frontend | Vite React SPA + Tailwind CSS |
| Graph viz | react-force-graph-2d |
| Git ingestion | PyGithub |
| Deployment | Docker Compose |
