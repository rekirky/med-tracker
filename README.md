# Med Tracker

A self-hosted medication tracking application for managing multiple family members' medication schedules. Built as a Docker container running a React JS frontend and Python (FastAPI) backend.

## Features

- **Multi-user** — add family members and switch between their charts via a dropdown
- **Today view** — see all medications with scheduled times, log doses with one tap, undo mistakes
- **History** — browse any past date to see what was taken and when
- **Medication management** — add, edit, or remove medications with name, dosage, scheduled times, and notes
- **Auto-refresh** — today's chart refreshes every minute
- **Persistent storage** — SQLite database stored in a local volume

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, served via Nginx |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | SQLite |
| Container | Docker Compose |
| CI/CD | GitHub Actions → GitHub Container Registry → Watchtower |

## Deployment

### Prerequisites

- Docker + Docker Compose on your server
- A GitHub PAT with `read:packages` permission (for pulling images from ghcr.io)

### First-time server setup

```bash
# Log in to GitHub Container Registry
echo YOUR_PAT | docker login ghcr.io -u rekirky --password-stdin

# Clone and start
git clone https://github.com/rekirky/med-tracker.git
cd med-tracker
mkdir -p data
docker compose up -d
```

App runs on port **2346**.

### Automatic updates (Watchtower)

Watchtower is included in the compose stack. Any push to the `main` branch triggers a GitHub Actions build that publishes new images to `ghcr.io`. Watchtower polls every 5 minutes and automatically pulls and restarts updated containers.

Push to deploy:
```bash
git push origin main
```

### Local development

```bash
# Backend
cd backend
pip install -r requirements.txt
mkdir -p data
uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `localhost:8000`.

## Authentication

This app relies on your Cloudflare ZeroTrust portal for authentication — no login screen is built in. Access is granted at the network level before reaching the app.

## Configuration

| Setting | File | Default |
|---------|------|---------|
| Port | `docker-compose.yml` | `2346` |
| Timezone | `docker-compose.yml` | `Australia/Brisbane` |
| Database path | Backend env `DATABASE_URL` | `/app/data/medtracker.db` |
