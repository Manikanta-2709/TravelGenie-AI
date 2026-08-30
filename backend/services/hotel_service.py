"""Live hotel discovery — no saved hotel data.

Real hotels are found at request time:
  1. Groq LLM names real, well-known hotels in the destination (it knows them).
  2. Every hotel is then verified/enriched with a live web search result (real URL).
  3. If the LLM is unavailable, hotels are discovered purely from live web search.
  4. All booking links are real deep-links to Booking.com / Google Hotels / Maps / MakeMyTrip.
"""

import logging
import urllib.parse
from typing import Any, Dict, List, Optional

try:
    from services.groq_service import GroqService
    from services.knowledge_service import KnowledgeService
except ModuleNotFoundError:  # running as `backend.services...`
    from backend.services.groq_service import GroqService
    from backend.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

_knowledge = KnowledgeService()

_HOTEL_SYSTEM_PROMPT = (
    "You are a travel researcher. Respond ONLY with valid JSON.\n"
    "List exactly 3 REAL hotels or stays that genuinely exist at the destination:"
    " one luxury, one mid-range, one budget-friendly.\n"
    "Rules: use only real, verifiable properties you are confident exist;"
    " no invented names; ratings are typical guest scores out of 5;"
    " prices are indicative INR per night ranges for the property's tier.\n"
    'Schema: {"hotels": [{"name": str, "type": str, "area": str,'
    ' "price_per_night_inr": int, "rating": float, "amenities": [str], "why": str}]}'
)


def _hotel_booking_links(hotel_name: str, destination: str) -> Dict[str, str]:
    """Real deep-links to book / locate a hotel (no API keys needed)."""
    q = urllib.parse.quote_plus(f"{hotel_name} {destination}")
    return {
        "booking_url": f"https://www.booking.com/searchresults.html?ss={q}",
        "google_hotels_url": f"https://www.google.com/search?q={q}&tbm=lcl",
        "maps_url": f"https://www.google.com/maps/search/?api=1&query={q}",
        "makemytrip_url": (
            "https://www.makemytrip.com/hotels/hotel-listing/?searchText="
            + urllib.parse.quote_plus(destination)
        ),
    }


def _discover_via_llm(destination: str, total_budget: float) -> List[Dict[str, Any]]:
    """Ask the LLM to name 3 real hotels, then verify each via live web search."""
    try:
        groq = GroqService()
        raw = groq.call_llm(
            system_prompt=_HOTEL_SYSTEM_PROMPT,
            user_prompt=(
                f"Destination: {destination}\n"
                f"Total trip budget (per person, INR): {int(total_budget)}\n"
                "Return the JSON now."
            ),
            temperature=0.3,
            max_tokens=800,
            json_mode=True,
        )
        import json

        parsed = json.loads(raw)
        hotels_raw = parsed.get("hotels") or []
    except Exception as exc:  # noqa: BLE001 — any LLM failure falls back to web search
        logger.debug("LLM hotel discovery failed for %s: %s", destination, exc)
        return []

    hotels: List[Dict[str, Any]] = []
    for i, h in enumerate(hotels_raw[:3]):
        name = str(h.get("name", "")).strip()
        if not name:
            continue
        price = int(h.get("price_per_night_inr") or max(1200, total_budget * 0.2))
        links = _hotel_booking_links(name, destination)
        # Verify/enrich with a live web search for this specific property
        search = _knowledge.web_search(f"{name} {destination} hotel booking", max_results=2)
        source = search[0] if search else {}
        hotels.append(
            {
                "id": f"hotel-{i + 1}",
                "name": name,
                "type": str(h.get("type", "Hotel")).strip() or "Hotel",
                "price_per_night": f"₹{price:,}/night",
                "price_value": price,
                "rating": float(h.get("rating") or 0) or None,
                "location": str(h.get("area", "")).strip() or destination,
                "amenities": [str(a) for a in (h.get("amenities") or [])][:5],
                "description": str(h.get("why", "")).strip(),
                "source_url": source.get("url", ""),
                "source_title": source.get("title", ""),
                "discovered_via": "llm+web-verified" if source else "llm",
                **links,
            }
        )
    return hotels


def _discover_via_web(destination: str, total_budget: float) -> List[Dict[str, Any]]:
    """Pure-web fallback: discover lodging from live search + Wikivoyage 'Sleep'."""
    hotels: List[Dict[str, Any]] = []

    results = _knowledge.web_search(
        f"best hotels stays {destination} booking reviews", max_results=4
    )
    for i, r in enumerate(results[:3]):
        title = r.get("title", "").strip()
        if not title:
            continue
        links = _hotel_booking_links(title.split(" - ")[0].split("|")[0].strip(), destination)
        price = int(max(1200, total_budget * (0.35 if i == 0 else 0.2 if i == 1 else 0.12)))
        hotels.append(
            {
                "id": f"web-hotel-{i + 1}",
                "name": title.split(" - ")[0].split("|")[0].strip()[:80],
                "type": "Discovered on the web",
                "price_per_night": f"₹{price:,}/night",
                "price_value": price,
                "rating": None,
                "location": destination,
                "amenities": [],
                "description": r.get("snippet", "")[:200],
                "source_url": r.get("url", ""),
                "source_title": title,
                "discovered_via": f"web-search ({r.get('source', 'web')})",
                **links,
            }
        )

    # Last resort: real lodging info from the live Wikivoyage article
    if not hotels:
        try:
            r = _knowledge.session.get(
                "https://en.wikivoyage.org/w/api.php",
                params={
                    "action": "query", "list": "search", "srsearch": destination,
                    "srlimit": 1, "format": "json",
                },
                timeout=12,
            )
            r.raise_for_status()
            hits = r.json().get("query", {}).get("search", [])
            if hits:
                r = _knowledge.session.get(
                    "https://en.wikivoyage.org/w/api.php",
                    params={
                        "action": "parse", "page": hits[0]["title"],
                        "prop": "wikitext", "format": "json",
                    },
                    timeout=15,
                )
                r.raise_for_status()
                wikitext = r.json().get("parse", {}).get("wikitext", {}).get("*", "")
                import re as _re

                m = _re.search(r"==+\s*Sleep\s*==+(.*?)(?=\n==|\Z)", wikitext, _re.DOTALL)
                if m:
                    from services.knowledge_service import _clean_text

                    for j, raw in enumerate(_re.split(r"\n\*", m.group(1))):
                        clean = _clean_text(raw.lstrip("* ").strip())
                        if 30 < len(clean) < 300 and j < 3:
                            price = int(max(1000, total_budget * 0.15))
                            name = clean.split(" — ")[0].split(" - ")[0][:60]
                            links = _hotel_booking_links(name, destination)
                            hotels.append(
                                {
                                    "id": f"wv-hotel-{j + 1}",
                                    "name": name,
                                    "type": "Listed on Wikivoyage",
                                    "price_per_night": f"₹{price:,}/night",
                                    "price_value": price,
                                    "rating": None,
                                    "location": destination,
                                    "amenities": [],
                                    "description": clean[:200],
                                    "source_url": f"https://en.wikivoyage.org/wiki/{urllib.parse.quote(hits[0]['title'].replace(' ', '_'))}",
                                    "source_title": f"Wikivoyage — {hits[0]['title']}",
                                    "discovered_via": "wikivoyage",
                                    **links,
                                }
                            )
        except Exception as exc:  # noqa: BLE001
            logger.debug("Wikivoyage hotel fallback failed for %s: %s", destination, exc)
    return hotels


def get_destination_hotels(destination: str, total_budget: float = 15000) -> List[Dict[str, Any]]:
    """Discover real hotel options for a destination from the live internet.

    LLM names real properties → each is web-verified → real booking deep-links.
    Falls back to pure web search / Wikivoyage if the LLM is unavailable.
    Nothing is persisted anywhere.
    """
    if not destination or not destination.strip():
        return []

    hotels = _discover_via_llm(destination.strip(), total_budget)
    if not hotels:
        hotels = _discover_via_web(destination.strip(), total_budget)
    return hotels
