# Phase 1: User Profile & Foundation - Context

**Gathered:** March 30, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Establishing the core **Athlete Identity** and **Baseline Training Parameters**. This involves:
- Multi-user authentication system (Email + Strava OAuth).
- Persistent user profile storing athlete stats (Max HR, Resting HR, etc.).
- Custom Training Zones (Zones 1-5 for both Heart Rate and Pace).
- Initial Onboarding flow to capture these baseline metrics.

</domain>

<decisions>
## Implementation Decisions

### Profile Storage & Ownership
- **D-01: Node.js Backend Ownership.** The `backend` (Node.js/Express) will manage the `users` and `profiles` tables. This centralizes authentication and user management in the primary API gateway.
- **D-02: Multi-user Ready.** The database schema will support multiple users from the start, moving away from the "singleton" `id=1` pattern currently in the prototype.
- **D-03: Auth Modes.** Users can authenticate via **Email/Password** or **Strava OAuth**. Both flows will link to a unified user record.

### Mobile UI/UX Flow
- **D-04: Dedicated Onboarding.** A multi-step onboarding flow will handle initial authentication followed by a "Bio/Zones Setup" screen.
- **D-05: Profile Tab.** A new primary "Profile" tab will be added to the mobile app for managing personal details, PRs, and viewing/editing training zones.

### Training Zones & Calibration
- **D-06: AI-Centric (Calibrated).** The system will automatically calibrate zones (using K-Means or PR-based models) on a weekly basis or upon new data sync. Users can manually "override" specific values if they disagree with the system's estimates.
- **D-07: Jack Daniels VDOT Integration.** The AI tool will leverage **Jack Daniels VDOT** logic (using PRs and recent race distances) to provide estimated training zones during onboarding and for ongoing calibration.
- **D-08: Unit Flexibility.** Users can input zones using both **Absolute Units** (BPM for HR, min/km or min/mi for Pace) and **Relative Units** (% of Max HR, % of Threshold Pace).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/ROADMAP.md` — Phase 1 Goal & Success Criteria
- `.planning/REQUIREMENTS.md` — FOUND-03 (User Profile Setup)
- `.planning/PROJECT.md` — Stack overview and Core Value

### Technical Standards
- `analytics_engine/ai_coach.py` — Existing K-Means zone logic and names
- `backend/server.js` — Base implementation of the Node.js API
- `mobile/app/(tabs)/coach.tsx` — `ZonePill` UI implementation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ZonePill` component (`mobile/app/(tabs)/coach.tsx`) can be reused for the profile view and onboarding setup.
- `ai_coach.py` zone names ("Recovery", "Aerobic Base", "Grey Zone", "Threshold", "VO2 Max") should remain the standard.

### Established Patterns
- The backend/analytics separation is well-defined: Node.js for auth/profile management, Python for zone calculation/VDOT modeling.

### Integration Points
- `backend/server.js`: Add user/auth routes.
- `mobile/app/_layout.tsx`: Update routing to handle unauthenticated vs authenticated states (Onboarding vs Main App).

</code_context>

<specifics>
## Specific Ideas

- **Onboarding Hook**: "Enter your latest 5K or 10K PR, and we'll estimate your zones using the Jack Daniels VDOT method to get you started immediately."
- **Zone View**: A clear visualization of the 5 zones with the ability to toggle between BPM/% Max and Pace/Threshold Pace.

</specifics>

<deferred>
## Deferred Ideas

- **Advanced Lactate Tests**: Manual entry of specific lactate threshold test results (Phase 3).
- **Gear/Nutrition Setup**: While part of the profile, detailed gear/nutrition protocols are deferred to Phase 6.

</deferred>

---

*Phase: 01-user-profile-foundation*
*Context gathered: March 30, 2026*
