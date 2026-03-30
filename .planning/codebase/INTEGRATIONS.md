# External Integrations - AeroFit AI

## External APIs
- **Garmin Connect**: 
  - **Purpose**: Ingests running activities (pace, HR, distance, RPE).
  - **Integration**: Python `garminconnect` library.
  - **Auth**: Direct credential login (Email/Password).

- **Strava API**:
  - **Purpose**: Ingests running activities and detailed "Atom" splits/laps.
  - **Integration**: OAuth 2.0 (Authorization Code Grant), REST API v3.
  - **Auth**: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`.

- **OpenAI API**:
  - **Purpose**: "Elite Running Coach" feedback using the Norwegian Training Method.
  - **Model**: `gpt-4o`.
  - **Logic**: Analyzes K-Means cluster data of laps to provide physiological insights.

- **OpenWeatherMap API**:
  - **Purpose**: Real-time weather data for dynamic packing lists.
  - **Data**: Temperature, Feels-like, Humidity, Wind speed, Precipitation, Condition.
  - **Logic**: Used in `packing_list.py` to recommend gear based on conditions and distance.

## Databases
- **PostgreSQL**:
  - **Version**: 15-alpine.
  - **Tables**:
    - `activities`: Stores run/race metrics, laps (JSON), and AI feedback.
    - `strava_auth`: Stores OAuth tokens (access/refresh/expiry) for Strava.
  - **Connection**: `DATABASE_URL` environment variable.

## Auth Providers
- **Strava OAuth**: Handles athlete authentication and data access permissions.
- **Garmin**: Uses stored credentials for automated sync.

## Webhooks
- **Currently None**: The system uses polling or manual trigger via `/api/sync` and `/api/sync/strava` endpoints.
