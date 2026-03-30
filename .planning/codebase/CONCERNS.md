# Codebase Concerns & Technical Debt

## 1. Technical Debt & Code Quality

### Duplicate Model Definitions
- **Issue**: The `Activity` SQLAlchemy model is redefined across multiple files: `analytics_engine/api.py`, `analytics_engine/ingest_strava.py`, and `analytics_engine/ingest_garmin.py`.
- **Impact**: Maintenance overhead, risk of schema divergence, and inconsistent data handling across ingestion services.
- **Concern**: High. Schema changes require updating multiple files manually.

### Inefficient ML Training Lifecycle
- **Issue**: In `analytics_engine/ai_coach.py`, the K-Means model is re-trained from scratch on the entire historical dataset every time `analyze_activity` is called.
- **Impact**: Severe performance degradation as the user's activity history grows. Strava ingestion triggers this training in a loop for every activity fetched.
- **Concern**: Critical. This will lead to request timeouts and excessive CPU usage with even a moderate amount of data.

### Hardcoded ML Parameters
- **Issue**: The number of clusters (`n_clusters=5`) in `ai_coach.py` is hardcoded.
- **Impact**: Lack of flexibility for different athlete profiles or data distributions.
- **Concern**: Medium. Limits the "Norwegian Method" flexibility.

### Legacy Code Inclusion
- **Issue**: `main.py` in the root and `app/` directory are mentioned as "Legacy" but are still present in the codebase.
- **Impact**: Confusion for new developers and potential security surface area if these services are accidentally exposed.
- **Concern**: Low.

## 2. Security Concerns

### PII Leakage in Logs
- **Issue**: `analytics_engine/api.py` and `ingest_garmin.py` log the user's email address in plaintext: `logger.info(f"Starting sync for user: {email}")`.
- **Impact**: Exposure of Personal Identifiable Information (PII) in application logs.
- **Concern**: High. Violates basic privacy and security standards.

### Plaintext Password Handling
- **Issue**: The `sync_garmin` endpoint in `analytics_engine/api.py` accepts raw email and password in the JSON body.
- **Impact**: Risk of credential interception if the connection is not strictly HTTPS (even internally).
- **Concern**: High.

### Default Database Credentials
- **Issue**: `docker-compose.yml` uses `POSTGRES_USER: user` and `POSTGRES_PASSWORD: password`.
- **Impact**: Extremely vulnerable if the database port (5432) is exposed or the container environment is compromised.
- **Concern**: High (for production).

### Hardcoded Secret Fallbacks
- **Issue**: `ingest_strava.py` and `ingest_garmin.py` have hardcoded fallback `DATABASE_URL` strings.
- **Impact**: Potential to connect to the wrong database or expose credentials if environment variables are missing.
- **Concern**: Medium.

## 3. Architectural Concerns

### Single-User Assumption
- **Issue**: `ingest_strava.py` hardcodes the user ID as `1` for token storage: `id=1`.
- **Impact**: The entire system is effectively "single-tenant" for Strava. Multiple users cannot use the system simultaneously.
- **Concern**: Critical (for scalability).

### Incomplete Garmin Integration
- **Issue**: `ingest_garmin.py` fetches activity data but does NOT fetch lap data (splits) or trigger the AI analysis.
- **Impact**: Garmin users do not benefit from the "The Split is the Atom" philosophy or AI coaching feedback.
- **Concern**: High (functional parity).

### Database Session Management
- **Issue**: Routes in `api.py` manually manage SQLAlchemy sessions (open/query/close) instead of using a context manager or Flask-SQLAlchemy's built-in session management.
- **Impact**: Risk of connection leaks if an exception occurs before `session.close()`.
- **Concern**: Medium.

### API Rate Limiting (Strava)
- **Issue**: `ingest_strava.py` fetches detailed activity data in a sequential loop for all activities.
- **Impact**: High risk of hitting Strava's rate limits (100 requests per 15 minutes).
- **Concern**: Medium.

## 4. Frontend & Mobile Concerns

### Excessive Mock Data
- **Issue**: `App.jsx` contains significant amounts of hardcoded mock data for user profiles, training plans, and predictions.
- **Impact**: The UI gives a false sense of functionality that isn't actually backed by the Analytics Engine.
- **Concern**: High (for prototype vs. product).

### Localhost Dependencies
- **Issue**: Mobile `api.ts` and Frontend `docker-compose` environment variables default to `localhost`.
- **Impact**: Will fail on physical mobile devices and in non-local environments without manual configuration.
- **Concern**: Medium.

### Lack of Persistent Auth
- **Issue**: Frontend `App.jsx` relies on URL parameters for OAuth flow but doesn't seem to persist the "logged in" state in `localStorage` or `sessionStorage`.
- **Impact**: Poor user experience; users must re-authenticate or lose state on refresh.
- **Concern**: Medium.
