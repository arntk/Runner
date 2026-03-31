<!-- GSD:project-start source:PROJECT.md -->
## Project

**Runners**

**Core Value:** The "North Star" is providing **automated, expert-level training feedback** that explains the *benefit* of every run and optimizes the athlete's preparation (gear, nutrition, pacing) without them needing a human coach.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages & Runtimes
- **Python 3.9+**: Powers the Analytics Engine and Garmin Worker.
- **Node.js**: Powers the Backend API.
- **JavaScript/TypeScript**: Used for Frontend (React) and Mobile (React Native/Expo).
- **SQL**: PostgreSQL 15 for data persistence.
## Frontend (Web)
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4, PostCSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **API Client**: Axios
## Backend (API Gateway)
- **Framework**: Node.js / Express
- **Database Client**: `pg` (node-postgres)
- **Environment**: `dotenv`
- **AI Integration**: `openai` (v4)
## Analytics Engine (ML & Ingestion)
- **Framework**: Flask (Python)
- **Data Analysis**: `pandas`, `numpy`
- **Machine Learning**: `scikit-learn` (K-Means clustering for physiological zones)
- **ORM**: `SQLAlchemy` with `psycopg2-binary`
- **AI Integration**: `openai` (GPT-4o)
- **Ingestion**: `garminconnect` (Garmin), `requests` (Strava/OpenWeather)
## Mobile
- **Framework**: Expo 51 (React Native)
- **Navigation**: Expo Router
- **Environment**: Expo Public Env variables
- **API Client**: Axios
## Infrastructure & DevOps
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL 15 (Alpine)
- **Tooling**: Adminer (Database management)
- **Package Managers**: `npm`, `pip`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## 1. General Principles
- **Architecture:** Monolith-style repository with specialized sub-projects: `backend` (Node.js), `frontend` (React), `mobile` (React Native/Expo), `analytics_engine` (Python/Flask), and `garmin-worker` (Python).
- **Service Communication:** JSON-based REST APIs.
- **Environment Management:** `.env` files for configuration; `dotenv` for Node.js, and standard environment variable access for Python.
## 2. Backend (Node.js/Express)
- **Style:** CommonJS (`require`).
- **Naming:**
- **Patterns:**
- **Error Handling:**
## 3. Frontend (React/Vite)
- **Style:** Functional components with Hooks (`useState`, `useEffect`).
- **Naming:**
- **Styling:**
- **Patterns:**
- **Error Handling:**
## 4. Mobile (React Native/Expo/TypeScript)
- **Style:** Functional components using TypeScript.
- **Naming:**
- **Patterns:**
- **Error Handling:**
## 5. Python (Flask/Analytics Engine)
- **Style:** PEP 8 (general adherence), using Flask for the API layer.
- **Naming:**
- **Patterns:**
- **Error Handling:**
## 6. Formatting & Tooling
- **JavaScript/React:** ESLint (`eslint.config.js`) for linting.
- **Python:** Standard library `unittest` and `logging`.
- **Version Control:** Git; ignoring local environments (`env/`, `venv/`, `node_modules/`).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Pattern
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
### 3. Business / Intelligence Layer
- **AI Coach**: Uses `scikit-learn` (K-Means) to categorize running laps into 5 physiological zones and OpenAI to generate coaching insights based on the "Norwegian Training Method".
- **Ingestors**: Modules in `analytics_engine` for parsing and normalizing data from Garmin Connect and Strava APIs.
### 4. Data Access Layer
- **SQLAlchemy (Python)**: Used in the Analytics Engine for ORM-based access to PostgreSQL.
- **node-postgres (Node.js)**: Used in the Backend for direct query access to the same PostgreSQL database.
## Data Flow
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
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
