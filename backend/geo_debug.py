import sys, math

sys.path.insert(0, ".")
from services.knowledge_service import KnowledgeService

ks = KnowledgeService()

def hav(a, b):
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp = math.radians(b["lat"] - a["lat"]); dl = math.radians(b["lon"] - a["lon"])
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 6371.0 * 2 * math.asin(math.sqrt(h))

goa = ks.geocode("Goa")
print("GOA:", goa)
for q in ["Palolem Beach Goa", "Palolem Beach", "Goa Goa", "Goa", "The Deck Restaurant Goa"]:
    g = ks.geocode(q)
    d = hav(goa, g) if (g and g.get("lat") and goa.get("lat")) else None
    print(f"{q!r} -> {g} | dist from Goa: {round(d) if d is not None else 'NA'} km")
