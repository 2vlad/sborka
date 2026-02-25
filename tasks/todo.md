# MVP-1 Implementation

## Phase 0: Project Scaffolding
- [x] git init, .gitignore, .env.example, Makefile
- [x] docs/ structure, README

## Phase 1: Backend Skeleton
- [x] pyproject.toml, requirements.txt
- [x] FastAPI app with CORS and lifespan
- [x] Config (pydantic-settings)
- [x] Schemas: blocks, events, session
- [x] SQLAlchemy models (Session, Lesson, Asset)
- [x] DB engine + table creation

## Phase 2: SSE Infrastructure
- [x] EventBus (asyncio.Queue per session, replay buffer)
- [x] SSE encoder
- [x] API endpoints: POST /api/sessions, GET /api/sessions/{id}/events, POST /api/sessions/{id}/generate

## Phase 3: Pipeline — Classifier + Outline
- [x] LLM client wrapper (real + mock mode)
- [x] Classifier prompt + logic
- [x] Orchestrator

## Phase 4: Pipeline — Scaffolder
- [x] Scaffolder (12-block template)
- [x] Scaffolder prompt

## Phase 5: Pipeline — Filler
- [x] Block filler with streaming (markdown: block_delta events)
- [x] Filler prompts per block type

## Phase 6: Frontend Skeleton
- [x] Vite + React + TypeScript setup
- [x] TypeScript types (mirror backend schemas)
- [x] SSE client (EventSource per event type)
- [x] Zustand store (handleEvent reducer + assetMap)

## Phase 7: Frontend Pages & Components
- [x] LandingPage
- [x] SessionPage (two-panel, responsive)
- [x] Block renderers (all types: heading, markdown, quiz, practice, callout, dialog, image)
- [x] B&W color scheme

## Phase 8: Image Placeholders
- [x] Mock image generator (placehold.co, 3-5s delay)
- [x] asset_reserved → placeholder → asset_ready flow

## Phase 9: Integration & Polish
- [x] Error handling (per-block and session-level)
- [x] SSE reconnection (EventBus replay buffer)
- [x] Responsive layout (sidebar collapse on mobile)
- [x] Accessibility (ARIA labels, focus styles)
- [x] Privacy disclaimer

## Phase 10: Deploy
- [x] Procfile
- [ ] Railway deploy (git push to main)

## Bugs Fixed
- [x] Double pipeline execution (removed auto-start from POST /sessions)
- [x] SSE race condition (triggerGenerate called after SSE connected)
- [x] Missing greenlet dependency for async SQLAlchemy

## Verification
- [x] Backend: 32/32 tests pass
- [x] Frontend: vite build succeeds (0 errors)
- [x] E2E: curl test — 67 SSE events, full pipeline mock mode
- [x] E2E: browser test — landing → session → all blocks rendered
