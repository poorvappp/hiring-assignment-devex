# Deployment Insights — Visma DevEx Technical Case

A microservice system for tracking and analyzing deployments across services.

## Services

| Service | Language | Port | Role |
|---------|----------|------|------|
| `deployment-registry` | C# / .NET 10 | 5176 | Stores deployment records in MongoDB |
| `deployment-insights` | Node.js / Express | 3000 | Stateless analytics API |
| MongoDB | — | 27017 | Persistence layer (Registry only) |

---

## Before you dive in:

**Prerequisites:** Docker, Docker Compose, Node.js 20, `make`

```bash
# 1. Clone
git clone <repo-url> && cd hiring-assignment-devex

# 2. Install JS dependencies and set up pre-commit hooks
cd deployment-insights && npm ci && npx lefthook install && cd ..

# 3. Start everything
make upd

# 4. Seed sample data
make seed

# 5. Verify
curl http://localhost:3000/health
curl http://localhost:3000/insights/frequency
```

That's it. See `make help` for all available commands.

> **VS Code / Cursor users:** Open in a Dev Container (`Reopen in Container`) for a fully pre-configured environment with Node 20, .NET 10, Docker, and all extensions installed automatically.

---

## Quickstart

**Prerequisites:** Docker and Docker Compose installed.

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd hiring-assignment-devex

# 2. Start all services
docker-compose up --build

# 3. Verify everything is up
curl http://localhost:3000/health
```

The full system is running when `/health` returns `"status": "UP"`.

Seeding is automated — no manual steps needed (see Kubernetes section for K8s seeding).

---

## API Endpoints

### Insights Service (`localhost:3000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check — includes Registry connectivity status |
| GET | `/insights/frequency` | Average deployments per week, per service |
| GET | `/insights/lead-time` | Average time (minutes) from deploy start to success |
| GET | `/insights/failure-rate` | Failure rate (%) across all deployments |
| GET | `/insights/latest` | Most recently deployed version per service per environment |

**Example responses:**

```bash
curl http://localhost:3000/insights/frequency
# { "period": "data-range-total", "avgDeploymentsPerWeek": { "payment-service": 3.5 } }

curl http://localhost:3000/insights/failure-rate
# { "totalDeployments": 42, "failedDeployments": 3, "failureRate": "7.14%" }

curl http://localhost:3000/insights/lead-time
# { "count": 39, "averageLeadTimeMinutes": 12.4 }
```

### Registry Service (`localhost:5176`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deployments` | List all deployments (filter: `?serviceName=`, `?environment=`, `?status=`) |
| GET | `/api/deployments/{id}` | Get a single deployment |
| POST | `/api/deployments` | Create a deployment record |
| PUT | `/api/deployments/{id}` | Update deployment status |
| GET | `/api/health` | Registry health check |

---

## Running Tests

```bash
cd deployment-insights
npm ci
npm test
```

Two test suites:
- **Unit tests** (`aggregation.test.js`) — pure calculation functions, no network calls
- **Integration tests** (`integration.test.js`) — Registry client with Nock HTTP mocking

---

## Architecture

```
Client
  │
  ▼
Insights API (Node.js :3000)
  │  stateless — fetches on every request
  │  REGISTRY_URL env var
  ▼
Registry API (.NET :5176)
  │
  ▼
MongoDB (:27017)
```

The Insights service holds no state. Every request triggers a fresh fetch from the Registry API, which is the single source of truth.

---

## Decisions & Trade-offs

**Stateless Insights service**
Fetching all deployments on every request is simple and consistent with the assignment requirement, but won't scale to hundreds of thousands of records. In production, pagination or a cache layer (Redis with TTL) would be needed.

**Calculation logic separated from HTTP layer**
Pure functions (`calculateX`) are isolated from async I/O (`getX`), making them trivially unit-testable without mocking. This is the primary reason the test suite is lightweight.

**Frequency calculated over data range, not a rolling window**
Rather than "deployments in the last 7 days", frequency is computed as `total_deployments / weeks_in_dataset`. This avoids returning zero for older data and gives a stable average regardless of when the query runs.

---

## Kubernetes

Manifests are in `k8s/`. Both services run with 2 replicas. MongoDB uses a 1Gi PersistentVolumeClaim.

| File | Purpose |
|------|---------|
| `mongodb.yaml` | MongoDB + PVC |
| `registry.yaml` | Registry API (readiness probe on `/api/health`) |
| `insights.yaml` | Insights API (LoadBalancer service) |
| `seed-job.yaml` | One-shot Job that seeds sample data into the Registry |

```bash
# 1. Create image pull secret
kubectl create secret docker-registry ghcr-login \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token>

# 2. Deploy everything (seed Job waits for Registry to be ready automatically)
kubectl apply -f k8s/

# 3. Access Insights locally (LoadBalancer stays <pending> on local clusters)
kubectl port-forward svc/insights 3000:3000
```

The seed Job is idempotent — re-applying `k8s/` won't duplicate data. It auto-deletes 2 minutes after completion.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR to `main`:
1. Runs `npm test`
2. Builds and pushes both images to `ghcr.io`
