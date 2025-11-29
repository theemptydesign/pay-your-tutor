# Tutor Visit Tracker

A Next.js application for tracking tutor visits and calculating monthly and year-to-date totals.

## Features

- Track visits for multiple tutors (Neill, Will, Miss Ford)
- Calculate monthly and year-to-date costs automatically
- PostgreSQL database for persistent storage
- Containerized for Kubernetes deployment

## Local Development

### Prerequisites

- Node.js 25+
- PostgreSQL 17+
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up PostgreSQL database:
   ```bash
   # Start PostgreSQL
   brew services start postgresql@17

   # Create database
   /opt/homebrew/opt/postgresql@17/bin/createdb tutor_tracker
   ```

3. Configure environment variables:
   Create a `.env.local` file:
   ```
   DATABASE_URL=postgresql://localhost:5432/tutor_tracker
   ```

4. Run database migrations:
   ```bash
   npx drizzle-kit push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Build the Docker image:

```bash
docker build -t tutor-tracker:latest .
```

### Run locally with Docker:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-postgres-connection-string" \
  tutor-tracker:latest
```

## Kubernetes Deployment (Linode LKE)

### Prerequisites

1. Set up Linode Managed PostgreSQL database
2. Push Docker image to a container registry (Docker Hub, Linode CR, etc.)
3. Configure `kubectl` for your LKE cluster

### Deployment Steps

1. Update `k8s/secret.yaml` with your PostgreSQL connection string:
   ```yaml
   stringData:
     DATABASE_URL: "postgresql://user:pass@your-managed-postgres:5432/tutor_tracker?sslmode=require"
   ```

2. Update `k8s/deployment.yaml` with your Docker image:
   ```yaml
   image: your-registry/tutor-tracker:latest
   ```

3. Apply Kubernetes manifests:
   ```bash
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/deployment.yaml
   ```

4. Check deployment status:
   ```bash
   kubectl get pods
   kubectl get services
   ```

5. Get the LoadBalancer IP:
   ```bash
   kubectl get service tutor-tracker-service
   ```

### Running Migrations on Production

Create a Kubernetes Job to run migrations:

```bash
kubectl run drizzle-migration \
  --image=your-registry/tutor-tracker:latest \
  --env="DATABASE_URL=$(kubectl get secret tutor-tracker-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --restart=Never \
  --command -- npx drizzle-kit push
```

## Database Schema

### Visits Table

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | serial    | Primary key                    |
| tutor_name  | varchar   | Name of the tutor              |
| cost        | decimal   | Cost per visit                 |
| visit_date  | timestamp | Date of the visit (default now)|
| created_at  | timestamp | Record creation timestamp      |

## API Endpoints

### POST /api/visits
Add a new visit
```json
{
  "tutorName": "Neill",
  "cost": 90
}
```

### GET /api/visits/summary
Get monthly and YTD summary grouped by tutor

### GET /api/visits?year=2025&month=11
Get all visits for a specific month

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **Deployment**: Docker + Kubernetes (LKE)

## License

Private
