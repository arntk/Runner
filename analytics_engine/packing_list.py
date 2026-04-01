import os
import logging
import requests

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


def fetch_weather(city: str, lat: float = None, lon: float = None) -> dict:
    """Fetch current weather from OpenWeatherMap for a city or lat/lon."""
    if not OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not set in environment variables.")

    params = {"appid": OPENWEATHER_API_KEY, "units": "metric"}
    if lat is not None and lon is not None:
        params["lat"] = lat
        params["lon"] = lon
    else:
        params["q"] = city

    resp = requests.get(OPENWEATHER_URL, params=params, timeout=10)
    if resp.status_code != 200:
        raise Exception(f"OpenWeatherMap error {resp.status_code}: {resp.text}")
    return resp.json()


def build_packing_list(city: str, distance_km: float, lat: float = None, lon: float = None) -> dict:
    """
    Return a structured packing list based on live weather conditions.

    Returns:
        {
          "weather": { temp_c, feels_like_c, humidity_pct, wind_kph, rain_mm, condition },
          "items": [ { "item", "reason", "priority" ("essential"|"recommended"|"optional") } ]
        }
    """
    weather_data = fetch_weather(city, lat, lon)

    main = weather_data.get("main", {})
    wind = weather_data.get("wind", {})
    rain = weather_data.get("rain", {})
    weather_desc = weather_data.get("weather", [{}])[0]
    snow = weather_data.get("snow", {})

    temp_c = main.get("temp", 20)
    feels_like = main.get("feels_like", temp_c)
    humidity = main.get("humidity", 50)
    wind_kph = wind.get("speed", 0) * 3.6  # m/s → km/h
    rain_mm = rain.get("1h", 0)
    snow_mm = snow.get("1h", 0)
    condition = weather_desc.get("main", "Clear")

    items = []

    # ─── Always essentials ────────────────────────────────────────────────────
    items.append({
        "item": "GPS Watch / running tracker",
        "reason": "Track pace and heart rate during your run.",
        "priority": "essential"
    })
    items.append({
        "item": "Running shoes",
        "reason": "Core footwear — choose for terrain.",
        "priority": "essential"
    })
    items.append({
        "item": "Hydration (water bottle / vest)",
        "reason": f"{'Long race: ' if distance_km >= 21 else ''}Staying hydrated is non-negotiable.",
        "priority": "essential"
    })

    # ─── Humidity-based ───────────────────────────────────────────────────────
    if humidity > 65:
        items.append({
            "item": "Anti-chafe stick (Body Glide / Vaseline)",
            "reason": f"High humidity ({humidity}%) detected — reduces friction and hot spots.",
            "priority": "essential"
        })
        items.append({
            "item": "Breathable mesh tank top",
            "reason": "Moisture-wicking fabric critical in high humidity to stay cool.",
            "priority": "essential"
        })
        items.append({
            "item": "Sweat-wicking socks",
            "reason": "Avoid blisters when feet sweat heavily.",
            "priority": "recommended"
        })

    # ─── Temperature-based ───────────────────────────────────────────────────
    if feels_like < 5:
        items.append({
            "item": "Thermal base layer",
            "reason": f"Feels-like {feels_like:.0f}°C — protect core temperature.",
            "priority": "essential"
        })
        items.append({
            "item": "Running gloves",
            "reason": "Fingertips lose heat fastest in cold temps.",
            "priority": "essential"
        })
        items.append({
            "item": "Ear warmer / buff",
            "reason": "Ear protection prevents heat loss and wind chill pain.",
            "priority": "recommended"
        })
    elif feels_like < 12:
        items.append({
            "item": "Light running jacket or long-sleeve",
            "reason": f"Feels-like {feels_like:.0f}°C — a light layer keeps muscles warm at the start.",
            "priority": "recommended"
        })
        items.append({
            "item": "Running gloves (lightweight)",
            "reason": "You'll likely remove these mid-run — handy to have.",
            "priority": "optional"
        })
    elif feels_like > 28:
        items.append({
            "item": "Cooling towel / ice bandana",
            "reason": f"Feels-like {feels_like:.0f}°C — cooling tools help maintain performance.",
            "priority": "recommended"
        })
        items.append({
            "item": "Sunscreen SPF 50+",
            "reason": "UV exposure intensifies with heat and sweat.",
            "priority": "essential"
        })
        items.append({
            "item": "Running cap / visor",
            "reason": "Direct sun adds perceived effort; shade the face.",
            "priority": "recommended"
        })

    # ─── Wind-based ──────────────────────────────────────────────────────────
    if wind_kph > 25:
        items.append({
            "item": "Wind vest / shell",
            "reason": f"Wind at {wind_kph:.0f} km/h will cause significant chill and drag.",
            "priority": "recommended"
        })
    if wind_kph > 40:
        items.append({
            "item": "Adjustable cap / headband",
            "reason": "Strong gusts (>40 km/h) make loose items a hazard.",
            "priority": "recommended"
        })

    # ─── Rain-based ──────────────────────────────────────────────────────────
    if rain_mm > 0 or condition in ("Rain", "Drizzle", "Thunderstorm"):
        items.append({
            "item": "Waterproof running jacket",
            "reason": f"Rain detected ({rain_mm:.1f}mm/h) — stay dry and warm.",
            "priority": "essential"
        })
        items.append({
            "item": "Drymax or waterproof socks",
            "reason": "Wet feet cause rapid blister formation.",
            "priority": "recommended"
        })
        items.append({
            "item": "Plastic bag for phone/electronics",
            "reason": "Protect devices from rain.",
            "priority": "recommended"
        })

    # ─── Snow-based ──────────────────────────────────────────────────────────
    if snow_mm > 0 or condition == "Snow":
        items.append({
            "item": "Trail shoes / snow cleats",
            "reason": "Snow on ground increases slip risk — traction essential.",
            "priority": "essential"
        })
        items.append({
            "item": "Balaclava / neck gaiter",
            "reason": "Snow conditions mean severe wind chill on exposed skin.",
            "priority": "essential"
        })

    # ─── Distance-based extras ────────────────────────────────────────────────
    if distance_km >= 10:
        items.append({
            "item": "Energy gels or chews",
            "reason": f"For {distance_km}km, glycogen depletion becomes a factor after ~75 min.",
            "priority": "recommended" if distance_km < 21 else "essential"
        })
    if distance_km >= 21:
        items.append({
            "item": "Race-day nutrition plan (printed)",
            "reason": "Half marathon+ requires a fuelling strategy at aid stations.",
            "priority": "recommended"
        })
    if distance_km >= 42:
        items.append({
            "item": "Electrolyte tabs / salt capsules",
            "reason": "Marathon distance requires sodium replacement to prevent cramps.",
            "priority": "essential"
        })

    return {
        "weather": {
            "city": city,
            "temp_c": round(temp_c, 1),
            "feels_like_c": round(feels_like, 1),
            "humidity_pct": humidity,
            "wind_kph": round(wind_kph, 1),
            "rain_mm": rain_mm,
            "condition": condition,
            "description": weather_desc.get("description", "").capitalize()
        },
        "items": items
    }
