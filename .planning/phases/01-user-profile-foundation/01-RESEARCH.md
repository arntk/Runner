# Phase 01 Research: User Profile & Foundation

## Domain Analysis
- **Existing patterns**:
  - The project currently uses a "singleton" user pattern (hardcoded `id=1`) in the `analytics_engine` (Python).
  - Strava OAuth is partially implemented in the `analytics_engine` but needs to be linked to a proper `users` table.
  - The `mobile` app communicates directly with the `analytics_engine` (Port 5001).
  - The `backend` (Node.js) is currently an empty shell and not part of the active `docker-compose` stack.
- **Integration points**:
  - **Node.js Backend**: Will become the primary entry point for Auth and Profile management.
  - **PostgreSQL**: Central store for `users`, `profiles`, `activities`, and `strava_auth`.
  - **Mobile App**: Needs new routes for Onboarding and a Profile tab.
  - **Analytics Engine**: Needs to be updated to handle multi-user data by filtering via `user_id`.

## Technical Approach

### Backend (Node.js)
- **Files**: `backend/server.js`, `backend/package.json`, `docker-compose.yml`
- **Changes**:
  - Add `backend` service to `docker-compose.yml` mapping to port 3001.
  - Install dependencies: `bcryptjs`, `jsonwebtoken`, `pg`, `cors`, `dotenv`.
  - Implement `POST /api/auth/register` and `POST /api/auth/login`.
  - Implement `GET /api/profile` and `PUT /api/profile` for managing HR and Pace zones.
  - Implement a middleware for JWT validation.
- **Dependencies**: PostgreSQL (db service).

### Database Schema
- **Files**: `backend/schema.sql` (to be created), `analytics_engine/models.py` (to be updated/created)
- **Changes**:
  - Create `users` table: `id (UUID)`, `email (UNIQUE)`, `password_hash`, `strava_id`, `created_at`.
  - Create `profiles` table: `user_id (FK)`, `name`, `max_hr`, `resting_hr`, `hr_zones (JSON)`, `pace_zones (JSON)`, `vdot (FLOAT)`, `weight_kg`.
  - Update `activities` table to include `user_id (UUID)`.
  - Update `strava_auth` table to include `user_id (UUID)` and remove the hardcoded `id=1` constraint.

### Mobile (React Native / Expo)
- **Files**: `mobile/app/auth.tsx`, `mobile/app/(tabs)/_layout.tsx`, `mobile/services/api.ts`
- **New Files**: `mobile/app/onboarding/`, `mobile/app/(tabs)/profile.tsx`
- **Changes**:
  - Update `api.ts` to support the new `backend` (Port 3001) for auth/profile.
  - Implement `Onboarding` flow in `mobile/app/onboarding/`:
    - `step1-bio.tsx`: Basic stats (Weight, Max HR).
    - `step2-zones.tsx`: Zone calibration/setup (Jack Daniels VDOT estimate).
  - Add `Profile` tab to `(tabs)` for ongoing zone management.
  - Install `@react-native-async-storage/async-storage` for JWT persistence.

### Analytics Engine (Python)
- **Files**: `analytics_engine/api.py`, `analytics_engine/ingest_strava.py`, `analytics_engine/ai_coach.py`
- **Changes**:
  - Update SQLAlchemy models to include `user_id`.
  - Filter all queries (activities, auth) by `user_id`.
  - Add `vdot_calculator.py` to estimate zones based on PRs (Jack Daniels formula).
  - Update `analyze_activity` to use the user's specific zones from the `profiles` table instead of hardcoded values.

## Validation Architecture

### Verification Strategy
| Requirement | Test Type | Target | Strategy |
|-------------|-----------|--------|----------|
| FOUND-03 (Profile Setup) | Integration | `backend/server.js` | Test `PUT /api/profile` saves and retrieves JSON zones correctly. |
| FOUND-03 (Zone Logic) | Unit | `analytics_engine/vdot.py` | Verify Jack Daniels formula produces expected pace zones for a given 5K time. |
| Auth Workflow | E2E | `mobile/app/auth.tsx` | Mock backend and verify successful login redirects to Onboarding/Dashboard. |
| Multi-user Isolation | Integration | `backend` / `db` | Verify User A cannot see User B's activities or profile. |

### Testing Patterns
- **Jest (Backend)**: For Node.js API endpoint testing.
- **Pytest (Analytics)**: For Python logic and model testing.
- **React Native Testing Library**: For UI component validation (ZonePill, Profile form).

## Risk Assessment
- **Risk**: Database migration complexity for existing prototype data.
- **Mitigation**: Create a script to map existing hardcoded `id=1` data to the first registered user.
- **Risk**: Strava OAuth callback mismatch between Analytics and Node.js.
- **Mitigation**: Standardize on Node.js as the OAuth handler, or have Analytics continue handling it but notify Node.js to update the `users` table.

## Implementation Checklist (for Planner)
- [ ] Initialize `backend` service in `docker-compose.yml`.
- [ ] Create `users` and `profiles` tables in PostgreSQL.
- [ ] Implement JWT Auth in Node.js backend.
- [ ] Create `mobile/app/onboarding` flow with VDOT zone estimation.
- [ ] Add `Profile` tab to mobile app.
- [ ] Refactor `analytics_engine` to filter data by `user_id`.
- [ ] Verify zone-based analytics use user-specific profile data.
