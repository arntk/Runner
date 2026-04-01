"""
supplements.py
──────────────
Generates a personalized 48-hour race-prep supplement and nutrition timeline.
Covers: carb-loading, magnesium, beetroot juice, caffeine, melatonin cues,
and post-run protein reminders that fire after a Strava upload.
"""

from datetime import datetime, timedelta
from typing import List, Dict


# ─── Types ────────────────────────────────────────────────────────────────────
# type values: carb | supplement | sleep | caffeine | protein | hydration

PROTEIN_REMINDER_MSG = (
    "🥩 Post-Run Protein Window: Consume 20–30 g of protein within 30 minutes "
    "of finishing. Whey, Greek yogurt, or a protein shake all count. "
    "Pair with fast carbs (banana, white rice) to spike insulin and drive "
    "amino acids into muscle — critical for Norwegian double-threshold recovery."
)


def build_timeline(race_datetime: datetime, distance_km: float) -> List[Dict]:
    """
    Build a 48-hour countdown schedule relative to the race start.

    Args:
        race_datetime: Exact race start as a datetime object.
        distance_km:   Race distance in km (used to scale fuelling advice).

    Returns:
        Sorted list of reminder dicts:
        { timestamp (ISO str), label, note, type, hours_before_race }
    """
    is_marathon = distance_km >= 42
    is_half = 21 <= distance_km < 42
    is_long = distance_km >= 10

    events = []

    def add(delta_hours: float, label: str, note: str, etype: str):
        ts = race_datetime - timedelta(hours=delta_hours)
        events.append({
            "timestamp": ts.isoformat(),
            "label": label,
            "note": note,
            "type": etype,
            "hours_before_race": delta_hours
        })

    # ─── T-48h ────────────────────────────────────────────────────────────────
    if is_long:
        add(48, "🌾 Start Carb-Loading", (
            "Target 8–10 g of carbohydrate per kg body weight today. "
            "Prioritise pasta, rice, oats, and bread. Reduce fibre and fat to "
            "ease gastric comfort on race day."
        ), "carb")

    add(48, "🟣 Beetroot Juice — Day 1",
        "Drink 70–140 ml of concentrated beetroot juice (≈400 mg nitrate). "
        "Nitrates take 24–48 h to convert to nitric oxide, improving oxygen efficiency.",
        "supplement")

    add(47, "💧 Begin Aggressive Hydration",
        "Start front-loading fluids. Aim for light-yellow urine. "
        "Add a pinch of sea salt or electrolyte tab to each 500 ml.",
        "hydration")

    # ─── T-36h ────────────────────────────────────────────────────────────────
    add(36, "🌙 Magnesium Glycinate (Evening)",
        "Take 300–400 mg magnesium glycinate with dinner tonight. "
        "Magnesium improves muscle relaxation, sleep quality, and reduces night cramps. "
        "Glycinate form is best absorbed and least likely to cause GI upset.",
        "supplement")

    if is_long:
        add(35, "🌾 Continue Carb-Loading",
            "Keep hitting carb targets. Avoid introducing new foods. "
            "A large pasta dinner or rice bowl works well.",
            "carb")

    # ─── T-24h ────────────────────────────────────────────────────────────────
    add(24, "🟣 Beetroot Juice — Day 2 (Final Dose)",
        "Second and final 70–140 ml dose of beetroot juice. "
        "Peak nitrate levels typically occur 2–3 h after ingestion, so this "
        "dose primes the day-before window perfectly.",
        "supplement")

    add(24, "🍽️  Final Big Carb Meal",
        "Eat your largest carb-rich meal of the loading phase at lunch today "
        "(24 h before race). Keep dinner tonight lighter to avoid waking with a "
        "full stomach. Think: rice bowl with chicken, no heavy sauces.",
        "carb")

    # ─── T-12h ────────────────────────────────────────────────────────────────
    add(12, "🌙 Light Carb Dinner + Sleep Cue",
        "Simple, familiar carb-rich dinner (e.g. toast, banana, plain pasta). "
        "No alcohol. Aim for 8 h of sleep. Consider 0.5–1 mg melatonin if needed "
        "to fall asleep — low dose avoids morning grogginess.",
        "sleep")

    add(11.5, "🌙 Melatonin (Optional, if needed)",
        "If you struggle to wind down: 0.5 mg melatonin 30 min before target "
        "sleep time. Do NOT take >1 mg as it can cause next-morning fatigue.",
        "sleep")

    # ─── T-3h (Pre-race morning) ───────────────────────────────────────────────
    add(3, "☀️  Pre-Race Breakfast",
        "Wake up and eat a familiar, easy-to-digest breakfast: "
        "oats/porridge with banana + honey, or white toast with peanut butter. "
        "Target ~1–2 g carbs/kg. No high-fat or high-fibre foods.",
        "carb")

    add(3, "💧 Start Race-Morning Hydration",
        "Drink 500 ml of water on waking and another 500 ml in the 2 h before start. "
        "Stop drinking 1 h before to reduce bathroom urgency at the start line.",
        "hydration")

    # ─── Caffeine timing ──────────────────────────────────────────────────────
    # Caffeine peaks at ~60 min post-ingestion
    add(1, "☕ Caffeine Dose",
        "Consume 3–6 mg/kg of caffeine (~200–400 mg for most athletes) "
        "approximately 60 min before race start for peak plasma levels. "
        "Coffee, caffeine tablet, or pre-workout gel all work. "
        "Avoid if caffeine-sensitive or untested in training.",
        "caffeine")

    if is_marathon or is_half:
        add(0.5, "🍬 Final Top-Up Gel",
            "15–30 min before the gun: consume 1 energy gel or 30 g quick carbs "
            "to top up blood glucose. This is your last fuelling before the race starts.",
            "carb")

    # ─── Race start (T-0) ─────────────────────────────────────────────────────
    events.append({
        "timestamp": race_datetime.isoformat(),
        "label": "🏁 Race Start",
        "note": "You're prepared. Trust your training. Execute your plan.",
        "type": "race",
        "hours_before_race": 0
    })

    # ─── Post-run protein (approximate, 30 min post-race) ─────────────────────
    post_ts = race_datetime + timedelta(hours=_estimated_finish_hours(distance_km) + 0.5)
    events.append({
        "timestamp": post_ts.isoformat(),
        "label": "🥩 Post-Run Protein Reminder",
        "note": PROTEIN_REMINDER_MSG,
        "type": "protein",
        "hours_before_race": -(_estimated_finish_hours(distance_km) + 0.5)
    })

    # Sort chronologically
    events.sort(key=lambda x: x["timestamp"])
    return events


def _estimated_finish_hours(distance_km: float) -> float:
    """Rough average finish time for the reminder offset (not personalised)."""
    if distance_km <= 5:
        return 0.4
    elif distance_km <= 10:
        return 0.75
    elif distance_km <= 21.1:
        return 1.75
    elif distance_km <= 42.2:
        return 3.75
    return 5.0


def get_protein_reminder() -> dict:
    """Return a standalone protein reminder for post-Strava-upload use."""
    return {
        "type": "protein",
        "label": "🥩 Post-Run Protein Window",
        "message": PROTEIN_REMINDER_MSG
    }
