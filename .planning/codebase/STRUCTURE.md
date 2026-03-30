# Directory Structure

## Layout Overview

```text
/Users/tk/git/RunningCodeProject/
├── analytics_engine/     # Core Python analytics service (ML, AI, Ingestion)
├── app/                 # Legacy Flask backend modules (Blueprints)
├── backend/             # Node.js/Express backend service
├── frontend/            # React (Vite) web application
├── mobile/              # Expo/React Native mobile application
├── garmin-worker/       # Background worker for Garmin sync
├── templates/           # HTML templates for the legacy Flask app
├── .planning/           # Project documentation and architectural maps
└── env/                 # Python virtual environment
```

## Key Locations

### Logic & Processing
- `analytics_engine/ai_coach.py`: AI logic and ML clustering.
- `analytics_engine/api.py`: Primary API endpoints for intelligence features.
- `analytics_engine/ingest_*.py`: Data connectors for external fitness APIs.
- `backend/server.js`: Node.js entry point and DB connection.

### Frontend Components
- `frontend/src/App.jsx`: Main web application logic.
- `mobile/app/(tabs)/`: Mobile navigation structure and screen components.

### Configuration & Infrastructure
- `docker-compose.yml`: Local orchestration for services and PostgreSQL.
- `requirements.txt`: Python dependencies.
- `package.json`: Node.js dependencies (separate in root, backend, frontend, mobile).

## Naming Conventions
- **Python**: PEP 8 (snake_case for files and functions, PascalCase for classes).
- **JavaScript/React**: PascalCase for components (`GarminLogin.jsx`), camelCase for utilities and hooks.
- **Mobile**: Expo file-based routing (e.g., `(tabs)/index.tsx`, `_layout.tsx`).
- **SQL**: Snake_case for table and column names (`activity_id`, `avg_speed_mps`).

## Service Ports (Default)
- **5001**: Analytics Engine (Python/Flask)
- **3001**: Backend (Node.js/Express)
- **5000**: Legacy Web App (Python/Flask)
- **5173**: Vite Frontend (Dev)
