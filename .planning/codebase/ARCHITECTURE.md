# Codebase Architecture

## System Pattern
The project follows a **Microservices-oriented / Hybrid Architecture**, combining a modern React/Vite web frontend and Expo mobile app with multiple backend services.

- **Frontend (Web/Mobile)**: Consumes APIs from the Backend and Analytics Engine.
- **Backend (Node.js)**: Acts as a primary API gateway and database interface for general application state.
- **Analytics Engine (Python)**: The "brain" of the system, handling data ingestion from fitness platforms (Garmin, Strava), ML-based performance analysis (K-Means clustering), and AI coaching (OpenAI).
- **Workers**: Background services like `garmin-worker` for asynchronous data fetching.

## Layers

### 1. Presentation Layer
- **Web**: React 18+ (Vite, Tailwind CSS).
- **Mobile**: React Native (Expo, TypeScript, File-based routing).
- **Legacy Web**: Flask templates (Jinja2).

### 2. API / Orchestration Layer
- **Node.js API**: Express-based server (`backend/server.js`) providing database connectivity via `pg`.
- **Analytics API**: Flask-based server (`analytics_engine/api.py`) providing high-level features like:
    - Data synchronization (Strava/Garmin).
    - AI Coaching feedback.
    - Weather-aware packing lists.
    - Nutrition/Supplement timelines.

### 3. Business / Intelligence Layer
- **AI Coach**: Uses `scikit-learn` (K-Means) to categorize running laps into 5 physiological zones and OpenAI to generate coaching insights based on the "Norwegian Training Method".
- **Ingestors**: Modules in `analytics_engine` for parsing and normalizing data from Garmin Connect and Strava APIs.

### 4. Data Access Layer
- **SQLAlchemy (Python)**: Used in the Analytics Engine for ORM-based access to PostgreSQL.
- **node-postgres (Node.js)**: Used in the Backend for direct query access to the same PostgreSQL database.

## Data Flow
1. **Ingestion**: User triggers a sync -> `analytics_engine/api.py` -> `ingest_garmin.py` or `ingest_strava.py` -> External API -> PostgreSQL.
2. **Analysis**: Activity data is pulled from DB -> `ai_coach.py` trains/runs K-Means on lap data -> OpenAI generates feedback -> Returned to Frontend.
3. **Planning**: User requests a packing list -> `analytics_engine/api.py` -> `packing_list.py` (fetches weather) -> Returns prioritized gear list.

## Core Abstractions
- **Activity**: Unified data model for fitness activities (run, race).
- **Cluster**: Physiological zone representation (Zones 1-5) derived from Pace and HR data.
- **Coach**: LLM-based entity that interprets data through a specific training philosophy (Norwegian Method).

## Entry Points
- **Web**: `frontend/src/main.jsx`
- **Mobile**: `mobile/app/_layout.tsx`
- **Backend API**: `backend/server.js` (Port 3001)
- **Analytics API**: `analytics_engine/api.py` (Port 5001)
- **Legacy App**: `main.py` (Port 5000)
- **Worker**: `garmin-worker/main.py`
