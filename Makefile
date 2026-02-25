.PHONY: dev-backend dev-frontend dev test lint install

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	$(MAKE) dev-backend & $(MAKE) dev-frontend & wait

test:
	cd backend && python -m pytest -v

lint:
	cd backend && python -m ruff check .
	cd frontend && npm run lint
