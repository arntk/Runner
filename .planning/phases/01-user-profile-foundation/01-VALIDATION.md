---
phase: 01
slug: user-profile-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (Backend/Mobile), Pytest (Analytics) |
| **Config file** | `backend/package.json`, `mobile/package.json`, `analytics_engine/requirements.txt` |
| **Quick run command** | `npm test -- --watchAll=false` (Node/Mobile), `pytest` (Python) |
| **Full suite command** | `npm test` (Node/Mobile), `pytest` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` or `pytest` for the modified service
- **After every plan wave:** Run all test suites
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-03 | unit | `npm test backend/tests/auth.test.js` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-03 | integration | `npm test backend/tests/profile.test.js` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 2 | FOUND-03 | unit | `pytest analytics_engine/tests/test_vdot.py` | ❌ W0 | ⬜ pending |
| 01-01-04 | 02 | 1 | FOUND-03 | e2e | `npm run test:e2e mobile/tests/onboarding.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/auth.test.js` — Auth logic stubs
- [ ] `backend/tests/profile.test.js` — Profile API stubs
- [ ] `analytics_engine/tests/test_vdot.py` — VDOT calculation stubs
- [ ] `mobile/tests/onboarding.test.js` — Onboarding flow E2E stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Strava OAuth Flow | FOUND-03 | Requires real redirect | Trigger Strava login on mobile emulator, verify redirect to app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
