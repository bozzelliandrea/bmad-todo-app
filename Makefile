.DEFAULT_GOAL := help
.PHONY: help setup setup-env install \
        up down logs clean \
        db backend frontend \
        test test-e2e test-all

# ─── Colours ──────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(CYAN)bmad-todo-app$(RESET) — available targets"
	@echo ""
	@echo "  $(CYAN)Setup$(RESET)"
	@echo "    setup          Copy .env.example → .env for all packages + install deps"
	@echo "    setup-env      Copy .env files only"
	@echo "    install        Install frontend and e2e npm dependencies"
	@echo ""
	@echo "  $(CYAN)Docker services$(RESET)"
	@echo "    up             Build and start all services (db + backend + frontend)"
	@echo "    down           Stop and remove containers"
	@echo "    logs           Follow logs from all running containers"
	@echo "    clean          Stop containers and remove volumes (wipes DB data)"
	@echo ""
	@echo "  $(CYAN)Individual services$(RESET)"
	@echo "    db             Start only the PostgreSQL database"
	@echo "    backend        Start db + backend"
	@echo "    frontend       Start db + backend + frontend"
	@echo ""
	@echo "  $(CYAN)Tests$(RESET)"
	@echo "    test           Run backend unit/integration tests (pytest)"
	@echo "    test-e2e       Run Playwright E2E tests (stack must already be running)"
	@echo "    test-all       Run backend tests, then E2E tests"
	@echo ""

# ─── Setup ────────────────────────────────────────────────────────────────────

## Copy every .env.example → .env (skips if .env already exists)
setup-env:
	@echo "$(CYAN)→ Setting up environment files…$(RESET)"
	@[ -f .env ]              || (cp .env.example .env              && echo "  created  .env")
	@[ -f backend/.env ]      || (cp backend/.env.example backend/.env && echo "  created  backend/.env")
	@[ -f frontend/.env ]     || (cp frontend/.env.example frontend/.env && echo "  created  frontend/.env")
	@echo "  done (existing .env files were not overwritten)"

## npm install for frontend and e2e packages
install:
	@echo "$(CYAN)→ Installing frontend dependencies…$(RESET)"
	cd frontend && npm install
	@echo "$(CYAN)→ Installing e2e dependencies…$(RESET)"
	cd e2e && npm install
	@echo "$(CYAN)→ Installing Playwright browsers…$(RESET)"
	cd e2e && npx playwright install --with-deps

setup: setup-env install

# ─── Docker services ──────────────────────────────────────────────────────────

## Build and start all services
up:
	docker compose up --build

## Start only the PostgreSQL database
db:
	docker compose up db

## Start the database and backend
backend:
	docker compose up --build db backend

## Start the full stack (db + backend + frontend)
frontend:
	docker compose up --build db backend frontend

## Stop and remove containers (data volume is kept)
down:
	docker compose down

## Tail logs from all running containers
logs:
	docker compose logs -f

## Remove containers and volumes (destructive — wipes DB data)
clean:
	docker compose down -v --remove-orphans

# ─── Tests ────────────────────────────────────────────────────────────────────

## Run backend pytest suite (uses SQLite in-memory — no running stack needed)
test:
	@echo "$(CYAN)→ Running backend tests…$(RESET)"
	cd backend && pip install -e ".[dev]" -q && pytest -v

## Run Playwright E2E tests against the running stack
test-e2e:
	@echo "$(CYAN)→ Running E2E tests (requires stack on localhost:5173)…$(RESET)"
	cd e2e && npm test

## Run all tests: backend unit suite first, then E2E
test-all: test test-e2e
