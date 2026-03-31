# v1 Requirements: Runners

## v1 Requirements

### Foundation (Data & Sync)
- [ ] **FOUND-01**: Real-time Strava Sync via Webhooks to trigger immediate analysis.
- [ ] **FOUND-02**: Automatic Activity Ingestion (Distance, Time, Heart Rate, Pace, Elevation).
- [ ] **FOUND-03**: User Profile Setup with Personal HR and Pace Zones (Zones 1-5).
- [ ] **FOUND-04**: Post-Run "Feel" and RPE (Rate of Perceived Exertion) rating (1-10).

### Analytics (Norwegian Method & Predictions)
- [ ] **ANALYTIC-01**: K-Means Clustering of activities to categorize intensity (Easy, Threshold, Speed).
- [ ] **ANALYTIC-02**: Norwegian Double Threshold "Daily Load" aggregation for 2-a-day sessions.
- [ ] **ANALYTIC-03**: Interval Consistency Analysis to detect "Intensity Creep" during threshold sets.
- [ ] **ANALYTIC-04**: Hybrid Race Prediction (Potential vs Preparedness) using Riegel and VDOT models.
- [ ] **ANALYTIC-05**: Manual Entry for Lactate Threshold test results to anchor HR/Pace zones.

### AI Coach (Feedback & Insights)
- [ ] **COACH-01**: Post-Run "Benefit" Explanations (GPT-4o) translating K-Means clusters into plain English.
- [ ] **COACH-02**: Intensity Reprimand/Encouragement based on RPE vs Data (e.g., "You raced your easy day").
- [ ] **COACH-03**: Weekly Training Summary and performance adjustments suggestion.
- [ ] **COACH-04**: Race-Peaking Mode for focused 8-12 week training blocks.

### Logistics (Gear & Nutrition)
- [ ] **LOGISTIC-01**: Every-day Weather-Based Gear Suggestions (Temp, Wind, Intensity-adjusted).
- [ ] **LOGISTIC-02**: 48-Hour Recurring Nutrition Countdown (Carb-loading, Beetroot, Caffeine protocol).
- [ ] **LOGISTIC-03**: Daily Supplement Checklists (Whey, Iron, Magnesium) with push notifications.

---

## v2 Requirements (Deferred)
- **Tanda Model Prediction**: Requires 8 weeks of historical data to be effective.
- **Injury Detection**: ML-based "niggle" detection from volume/intensity spikes.
- **Social "Share Graphic"**: Generate branded images for Strava/Instagram export.

---

## Out of Scope
- **Social Feed**: No "follow" or "likes" in-app; use Strava for social.
- **Manual Food Logging**: Use checklist-based protocols instead.
- **Direct Wearable Sync**: Rely on Strava/Garmin cloud APIs.
- **Autonomous Calendar Writing**: AI suggests, user approves.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 2 | Pending |
| FOUND-02 | Phase 2 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 2 | Pending |
| ANALYTIC-01 | Phase 3 | Pending |
| ANALYTIC-02 | Phase 4 | Pending |
| ANALYTIC-03 | Phase 4 | Pending |
| ANALYTIC-04 | Phase 4 | Pending |
| ANALYTIC-05 | Phase 3 | Pending |
| COACH-01 | Phase 5 | Pending |
| COACH-02 | Phase 5 | Pending |
| COACH-03 | Phase 5 | Pending |
| COACH-04 | Phase 5 | Pending |
| LOGISTIC-01 | Phase 6 | Pending |
| LOGISTIC-02 | Phase 6 | Pending |
| LOGISTIC-03 | Phase 6 | Pending |

---
*Last updated: March 30, 2026*
