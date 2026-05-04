# CLAUDE.md - Deployment Insights 

## Project Overview

Two-service microservice system for tracking and analyzing deployments:

- **`deployment-registry/`** — Provided C# / .NET 10 API. Stores deployment records in MongoDB. Do not modify unless explicitly asked.
- **`deployment-insights/`** — Node.js / Express analytics service. Stateless — fetches all data from the Registry API on each request.

---

## Running the System

```bash
# Start everything (MongoDB + Registry + Insights)
docker-compose up

# Force rebuild
docker-compose up --build
```

| Service | Local URL |
|---------|-----------|
| Insights API | http://localhost:3000 |
| Registry API | http://localhost:5176 |
| MongoDB | localhost:27017 |

Seeding is automated — no manual steps needed. See the Kubernetes section below for K8s, or use the docker-compose flow which exposes the Registry on port 5176 for manual seeding if needed.

---

## Common Commands (Makefile)

```bash
make up           # docker-compose up
make test         # run test suite
make lint         # ESLint
make lint-fix     # ESLint with auto-fix
make format       # Prettier write
make seed         # seed Registry with sample data (docker-compose)
make clean        # remove containers + volumes
make k8s-up       # kubectl apply -f k8s/
make k8s-forward  # port-forward insights to localhost:3000
make help         # list all commands
```

---

## Running Tests

```bash
cd deployment-insights
npm ci
npm test
```

- **`tests/aggregation.test.js`** — Unit tests for pure calculation functions (no HTTP, no mocks needed)
- **`tests/integration.test.js`** — Integration tests using Nock to mock Registry HTTP calls

---

## Insights Service Structure

```
deployment-insights/
├── server.js                          # Express entry point + /health endpoint
├── src/
│   ├── clients/registry.client.js     # Axios wrapper around Registry API
│   ├── services/insights.service.js   # Pure calculation functions + async wrappers
│   ├── controllers/insights.controller.js
│   └── routes/insights.routes.js
└── tests/
    ├── aggregation.test.js
    └── integration.test.js
```

### Conventions in `insights.service.js`

Pure functions (`calculateX`) are side-effect free and unit-tested directly. Async wrappers (`getX`) call `getDeployments()` and pass results to the pure functions. When adding a new metric, follow this same pattern: pure function first, async wrapper second, both exported.

---

## Registry API Reference

Base URL (Docker Compose): `http://registry:5176/api`
Base URL (local dev): `http://localhost:5176/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/deployments` | List all (supports `?serviceName=`, `?environment=`, `?status=`) |
| GET | `/api/deployments/{id}` | Get one deployment |
| POST | `/api/deployments` | Create a deployment record |
| PUT | `/api/deployments/{id}` | Update deployment status |
| GET | `/api/health` | Registry health check |

### Deployment model fields

```
id, serviceName, version, environment, deploymentType,
status, deployedBy, startedAt, finishedAt, commitSha, prNumber
```

Status values (PascalCase): `Queued` → `Building` → `Deploying` → `Succeeded | Failed | RolledBack`

The insights service lowercases status strings for comparisons (e.g. `d.status.toLowerCase() === 'failed'`).

---

## Environment Variables

| Variable | Service | Default | Notes |
|----------|---------|---------|-------|
| `REGISTRY_URL` | Insights | `http://registry:5176/api` | Override for local dev |
| `MongoDb__ConnectionString` | Registry | — | Required |
| `MongoDb__DatabaseName` | Registry | `deployment-registry` | |
| `MongoDb__CollectionName` | Registry | `deployments` | |
| `ASPNETCORE_URLS` | Registry | — | Set to `http://+:5176` |

---

## Kubernetes

Manifests are in `k8s/`:

| File | Purpose |
|------|---------|
| `mongodb.yaml` | MongoDB Deployment + Service + 1Gi PVC |
| `registry.yaml` | Registry Deployment (2 replicas) + Service. Has readiness probe on `/api/health` |
| `insights.yaml` | Insights Deployment (2 replicas) + LoadBalancer Service |
| `seed-job.yaml` | One-shot Job + ConfigMap that seeds the Registry with sample data |

**Deploy order (or apply all at once — the seed Job's initContainer waits for Registry to be ready):**

```bash
# Requires ghcr-login secret first
kubectl create secret docker-registry ghcr-login \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token>

kubectl apply -f k8s/
```

**Accessing Insights locally** — `LoadBalancer` stays `<pending>` on local clusters (Docker Desktop/minikube). Use port-forward:

```bash
kubectl port-forward svc/insights 3000:3000
# Then: curl http://localhost:3000/health
```

**Seed Job** (`k8s/seed-job.yaml`):
- `initContainer` polls `registry:5176/api/health` until the Registry is ready
- Seeder checks if data already exists (idempotent — safe to re-run)
- Auto-deleted 120 seconds after completion (`ttlSecondsAfterFinished`)

---

## CI/CD

`.github/workflows/ci.yml` runs on push/PR to `main`:
1. Runs `npm test` in `deployment-insights/`
2. Builds and pushes both Docker images to `ghcr.io`

Images:
- `ghcr.io/<owner>/hiring-assignment-devex/insights:latest`
- `ghcr.io/<owner>/hiring-assignment-devex/registry:latest`

---

## Constraints

- The Insights service must remain **stateless** — no database, no persistent storage.
- Do not modify the Registry API or its data model.
- Do not change the test runner (Mocha) or the test glob pattern (`tests/**/*.test.js`).
