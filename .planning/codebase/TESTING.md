# Testing Patterns

This document details the testing frameworks, project structure, mocking practices, and coverage strategies across the AeroFit AI codebase.

## 1. Testing Frameworks

- **Python:** `unittest` from the standard library.
- **JavaScript/TypeScript:** No automated testing framework (e.g., Jest, Mocha, Vitest) is currently configured in `backend`, `frontend`, or `mobile`.

---

## 2. Test Structure (Python)

Tests for specific logic (like ML model verification) are co-located or specifically named:
- **Example File:** `analytics_engine/verify_ml_logic.py`
- **Pattern:** Test classes inherit from `unittest.TestCase`.
- **Naming:** Classes prefixed with `Test` (e.g., `TestMLModel`); methods prefixed with `test_` (e.g., `test_training`).

### Standard Lifecycle Methods:
- **`setUp`:** Used to initialize mock data and state before each test (e.g., generating 10 mock runs).
- **Execution:** Tests are often runnable directly as scripts using `unittest.main()`.

---

## 3. Mocking & Data Generation

The codebase leans toward manual mocking and synthetic data generation rather than external mocking libraries.

### Manual Mock Classes:
- In `verify_ml_logic.py`, a `MockActivity` class is used to simulate data instead of importing the actual SQLAlchemy model.

### Data Generators:
- Functions like `generate_mock_laps` are used to programmatically generate random data for different performance clusters (e.g., recovery, base, threshold, VO2 max).

### External APIs:
- API calls (e.g., OpenAI) are sometimes guarded or mocked with temporary environment variables (e.g., `os.environ["OPENAI_API_KEY"] = "test-key"`) during tests to prevent execution errors, although comprehensive mocking of these services is still being developed.

---

## 4. Testing Focus Areas

- **ML Verification:** Verification of the K-Means clustering logic and centroid calculation in `ai_coach.py`.
- **Pace Predictions:** Ensuring the predictive logic correctly identifies clusters based on speed and heart rate.
- **Manual Verification (UI):** High reliance on manual UI verification using extensive mock data sets defined in `App.jsx` and other frontend components.

---

## 5. Coverage & CI/CD

- **Coverage Monitoring:** No automated coverage tools (like `coverage.py` or `istanbul`) are currently integrated into the repository.
- **CI Integration:** No existing CI/CD configuration files (e.g., GitHub Actions, CircleCI) were found during the analysis.

---

## 6. Recommendations

- **Frontend/Backend:** Integrate a testing framework like Vitest or Jest for the React/Node projects.
- **Mocking:** Adopt `unittest.mock` in Python for cleaner isolation of logic from side effects.
- **Coverage:** Implement automated coverage reporting to track testing progress.
