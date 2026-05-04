.PHONY: up upd down build test lint format seed clean logs k8s-up k8s-seed k8s-forward help

# ─── Docker Compose ────────────────────────────────────────────────────────────

up:                          ## Start all services (foreground)
	docker-compose up

upd:                         ## Start all services (detached)
	docker-compose up -d

down:                        ## Stop all services
	docker-compose down

build:                       ## Rebuild Docker images
	docker-compose build

logs:                        ## Tail logs for all services
	docker-compose logs -f

# ─── Quality ───────────────────────────────────────────────────────────────────

test:                        ## Run the test suite
	cd deployment-insights && npm ci && npm test

lint:                        ## Run ESLint (report only)
	cd deployment-insights && npm run lint

lint-fix:                    ## Run ESLint and auto-fix
	cd deployment-insights && npm run lint:fix

format:                      ## Format code with Prettier
	cd deployment-insights && npm run format

format-check:                ## Check formatting without writing
	cd deployment-insights && npm run format:check

# ─── Data ──────────────────────────────────────────────────────────────────────

seed:                        ## Seed the Registry with sample data (docker-compose)
	REGISTRY_URL=http://localhost:5176 node scripts/seed.js

# ─── Kubernetes ────────────────────────────────────────────────────────────────

k8s-up:                      ## Apply all Kubernetes manifests
	kubectl apply -f k8s/

k8s-seed:                    ## Run the seed Job in Kubernetes
	kubectl apply -f k8s/seed-job.yaml

k8s-forward:                 ## Port-forward Insights to localhost:3000
	kubectl port-forward svc/insights 3000:3000

k8s-logs:                    ## Tail Insights pod logs
	kubectl logs -l app=insights -f

# ─── Cleanup ───────────────────────────────────────────────────────────────────

clean:                       ## Remove containers and volumes
	docker-compose down -v --remove-orphans

# ─── Help ──────────────────────────────────────────────────────────────────────

help:                        ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
