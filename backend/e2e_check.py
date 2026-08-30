import json

d = json.load(open("e2e_out.json", encoding="utf-8"))
h = d.get("hero", {})
print("STATUS:", d.get("status"))
print("HERO:", h.get("destination"), "| score:", h.get("trip_score"),
      "| dist:", h.get("distance_km"), "km | img:", bool(h.get("image_url")))
print("TAGLINE:", (h.get("tagline") or "")[:100])
print("WEATHER:", d["overview"]["weather"])
print("BUDGET:", d["overview"]["budget"])
print("AI:", d["overview"]["ai_score"])
print("TRANSPORT:", [(t["mode"], t["duration"], t.get("estimated_fare")) for t in d.get("transport", [])])
print("HOTELS:", [(x["name"], x.get("price_per_night"), x.get("discovered_via")) for x in d.get("hotels", [])])
print("DAYS:")
for x in d.get("itinerary", []):
    print("  Day", x["day"], x["title"], "| places:", x["place_count"], "| walk:", x["walking_km"], "km")
    for p in x.get("places", []):
        print("    -", p["name"], "|", p["category"], "|", p["maps_url"][:65], "|", p["travel_from_previous"])
print("RECS:", {k: len(v) for k, v in d.get("recommendations", {}).items()})
print("ERRORS:", d.get("errors"))
print("SOURCES:", d.get("sources"))
