# Phase 1: User Profile & Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 1 - User Profile & Foundation
**Areas discussed:** Profile Storage, Mobile UI/UX Flow, Zone Customization, Auto vs Manual Flow

---

## Profile Storage & Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-user Ready | Build a proper `users` table with auth/session capability (multi-user ready). | ✓ |
| Singleton (Fast) | Use a singleton `profile` table (like `strava_auth` id=1) to keep it fast for now. | |
| Node.js (Backend) | Node.js handles User/Auth, Python handles Analytics. (Standard separation) | ✓ |
| Python (Analytics) | Python handles everything for simplicity in this prototype. | |

**User's choice:** Multi-user Ready + Node.js (Backend).
**Notes:** User emphasized that the system should allow connecting Strava OR signing in via email.

---

## Mobile UI/UX Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Onboarding Flow | Dedicated "Onboarding" screens for Auth + initial Zone Setup. | ✓ |
| In-App Prompt | Land on home screen and prompt "Complete Profile" until done. | |
| Profile Tab | A new "Profile" tab for viewing/editing zones and athlete details. | ✓ |
| Settings Modal | A "Settings" gear icon on the main dashboard for profile management. | |

**User's choice:** Onboarding Flow + Profile Tab.

---

## Training Zones & Calibration

| Option | Description | Selected |
|--------|-------------|----------|
| User-Centric (Locked) | User inputs BPM/Pace, AI only "suggests" updates if data drifts significantly. | |
| AI-Centric (Calibrated) | AI calibrates zones weekly, user can "override" specific values if needed. | ✓ |
| Standard Absolute Units | BPM for HR, min/km or min/mi for Pace (depends on user preference). | ✓ |
| Relative (% of Max) | % of Max HR for HR, % of Threshold Pace for Pace. | ✓ |

**User's choice:** AI-Centric (Calibrated) + Support for both Absolute and Relative units.
**Notes:** User requested the ability to input PRs and distances so the AI can use **Jack Daniels VDOT** models for estimation.

---

## Claude's Discretion
- None explicitly requested, but the system is expected to manage the transition from singleton to multi-user architecture.

## Deferred Ideas
- Advanced Lactate tests (Phase 3).
- Gear/Nutrition setup (Phase 6).
