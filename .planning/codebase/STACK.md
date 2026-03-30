# Technology Stack - AeroFit AI

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
