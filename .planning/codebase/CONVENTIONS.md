# Coding Conventions

This document outlines the coding style, naming, patterns, and error handling conventions used across the AeroFit AI codebase.

## 1. General Principles

- **Architecture:** Monolith-style repository with specialized sub-projects: `backend` (Node.js), `frontend` (React), `mobile` (React Native/Expo), `analytics_engine` (Python/Flask), and `garmin-worker` (Python).
- **Service Communication:** JSON-based REST APIs.
- **Environment Management:** `.env` files for configuration; `dotenv` for Node.js, and standard environment variable access for Python.

---

## 2. Backend (Node.js/Express)

- **Style:** CommonJS (`require`).
- **Naming:**
    - **Variables/Functions:** `camelCase` (e.g., `port`, `pool`, `app`).
    - **Constants:** `UPPER_SNAKE_CASE` (e.g., `DATABASE_URL`).
- **Patterns:**
    - **Database Access:** `pg` (PostgreSQL) with `Pool` for connection management.
    - **Middleware:** Standard use of `cors` and `express.json`.
- **Error Handling:**
    - Async routes use `try-catch` blocks.
    - Errors are logged via `console.error`.
    - API responses for errors follow the structure: `{ status: 'error', message: '...' }` with appropriate HTTP status codes (e.g., 500).

---

## 3. Frontend (React/Vite)

- **Style:** Functional components with Hooks (`useState`, `useEffect`).
- **Naming:**
    - **Components:** `PascalCase` (e.g., `App`, `Button`, `Card`, `StatBox`, `LoginView`).
    - **Variables/Functions:** `camelCase`.
    - **Constants/Mock Data:** `UPPER_SNAKE_CASE` (e.g., `MOCK_USER`, `ZONES_DATA`, `TRAINING_PLAN`).
- **Styling:**
    - **Utility-First CSS:** Tailwind CSS for most styling.
    - **Interactive Styles:** Transition classes and `@keyframes` for animations (e.g., `animate-fadeInUp`, `animate-bounce-in`).
    - **Icons:** `lucide-react`.
- **Patterns:**
    - **Mocking:** Heavy reliance on local mock data for UI prototyping.
    - **API Requests:** Using `fetch` with base URLs from `import.meta.env.VITE_API_URL`.
- **Error Handling:**
    - `try-catch` in async handlers.
    - Errors logged to `console.error`.

---

## 4. Mobile (React Native/Expo/TypeScript)

- **Style:** Functional components using TypeScript.
- **Naming:**
    - **Components:** `PascalCase` (e.g., `AuthScreen`).
    - **Styles:** `StyleSheet.create` with `camelCase` keys.
- **Patterns:**
    - **Navigation:** `expo-router` for file-based routing.
    - **Web Auth:** `WebBrowser` for OAuth flows (e.g., Strava).
- **Error Handling:**
    - `try-catch` with `Alert.alert` for user-facing error messages.

---

## 5. Python (Flask/Analytics Engine)

- **Style:** PEP 8 (general adherence), using Flask for the API layer.
- **Naming:**
    - **Functions/Variables:** `snake_case` (e.g., `sync_garmin`, `fetch_garmin_data`, `init_db`).
    - **Classes:** `PascalCase` (e.g., `Activity`, `TestMLModel`).
- **Patterns:**
    - **Logging:** Standard `logging` module (`logger.info`, `logger.error`).
    - **Database (ORM):** `SQLAlchemy` for model definitions and session management.
    - **ML Logic:** Scientific stack (`numpy`, `pandas`, `scikit-learn`) for training and analysis.
- **Error Handling:**
    - `try-except` blocks.
    - API error responses: `jsonify({'status': 'error', 'message': str(e)})` with status codes 400, 401, or 500.

---

## 6. Formatting & Tooling

- **JavaScript/React:** ESLint (`eslint.config.js`) for linting.
- **Python:** Standard library `unittest` and `logging`.
- **Version Control:** Git; ignoring local environments (`env/`, `venv/`, `node_modules/`).
