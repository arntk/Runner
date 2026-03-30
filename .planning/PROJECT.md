# Runners

A data-driven training companion for sub-elite runners, providing personalized coaching and performance optimization through advanced analytics and AI.

## Context

Runners who are "sub-elite" or serious about their performance often struggle to translate raw data (from Strava or Garmin) into actionable training adjustments. Existing apps are either too basic (Couch to 5K) or too overwhelming (raw data only). This project bridges the gap by applying the **Norwegian Double Threshold method** and **GPT-4o personalized coaching** to everyday training.

### Stack
- **Frontend**: React Native / Expo (Mobile)
- **Backend**: Python / Flask API
- **Database**: PostgreSQL
- **Integrations**: Strava (Webhooks for real-time sync), OpenAI GPT-4o (AI Coaching), OpenWeatherMap (Gear suggestions)
- **Analytics**: K-Means clustering for training intensity analysis, Riegel's formula for race predictions

## Core Value

The "North Star" is providing **automated, expert-level training feedback** that explains the *benefit* of every run and optimizes the athlete's preparation (gear, nutrition, pacing) without them needing a human coach.

## Requirements

### Validated
- ✓ Monorepo structure with backend (Python/Flask) and mobile (React Native/Expo) - existing
- ✓ Basic Strava ingestion logic (Garmin ingestion also present) - existing
- ✓ Initial K-Means clustering logic for activity analysis - existing
- ✓ AI Coach (ai_coach.py) with initial GPT-4o integration - existing
- ✓ Packing list logic for weather-based gear suggestions - existing
- ✓ Supplement tracking logic (supplements.py) - existing

### Active
- [ ] **Real-time Strava Sync**: Implement Strava webhooks to trigger immediate analysis upon run completion.
- [ ] **Personalized AI Coaching**: 
    - Post-run "benefit" explanations based on K-Means clusters and RPE.
    - Weekly training summaries and performance adjustments.
    - Race-peaking mode for focused training blocks.
- [ ] **Dynamic Gear Suggestions**: Weather-based recommendations for "everyday" runs (e.g., 80F sunny vs 30F easy vs workout half-tights).
- [ ] **Recurring Nutrition Countdown**: 48-hour protocol for carb-loading/supplements (beetroot, magnesium, caffeine) + daily supplements (whey, iron).
- [ ] **Advanced Race Predictions**: Hybrid model using K-Means clusters + Riegel's formula + recent Strava personal bests.
- [ ] **Manual Data Entry**: Interface for users to add lactate threshold test results to refine HR zones.

### Out of Scope
- [ ] **Full Training Plan Rewriting**: The AI suggests and explains, but does not autonomously rewrite the entire calendar (to maintain athlete agency).
- [ ] **Social Features**: No "follow" or "feed" functionality in v1.
- [ ] **Wearable Direct Sync**: Only syncing via Strava/Garmin platforms, not direct Bluetooth to watches.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Strava Webhooks** | Enables real-time feedback immediately after a run is uploaded. | — Pending |
| **K-Means + Riegel** | Provides a more robust prediction than just using a single best effort or a generic formula. | — Pending |
| **Norwegian Method** | Differentiates the app by focusing on high-volume, controlled-intensity training popular among elites. | — Pending |
| **Recurring Nutrition** | Reflects that serious runners follow protocols for both weekly long runs and specific race events. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: March 30, 2026 after initialization*
