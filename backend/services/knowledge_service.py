"""Live Internet Knowledge Service.

Every fact is fetched from the public internet at request time (no saved data):
  - Geocoding ....... Open-Meteo Geocoding / Wikipedia coordinates
  - Weather ......... Open-Meteo Forecast API
  - Road routing .... OSRM public router
  - Web search ...... Tavily -> DuckDuckGo Instant Answer -> Wikipedia/Wikivoyage
  - Destination info  Wikipedia REST summary + Wikivoyage travel sections
"""

import html
import logging
import math
import os
import re
import threading
import urllib.parse
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_UA = "TravelGenieAI/1.0 (open-source student travel planner; contact travelgenie@example.com)"
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


class KnowledgeServiceError(RuntimeError):
    """Raised when the live internet knowledge layer fails."""


def _clean_text(text: str) -> str:
    """Strip HTML/wiki markup and collapse whitespace."""
    if not text:
        return ""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"<ref[^>]*/>", "", text)
    text = re.sub(r"<ref.*?</ref>", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\[(?:File|Image|Datei):[^\]]*\]\]", "", text)  # image links
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"=+\s*[^=\n]+?\s*=+", "", text)          # wiki == headings ==
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", text)
    # Wiki templates ({{...}}), nested-aware: strip innermost first, repeat
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\{\{[^{}]*\}\}", "", text)
    text = re.sub(r"'{2,}", "", text)                        # wiki bold/italic quotes
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()
class KnowledgeService:
    """Stateless in-memory internet knowledge client (nothing persisted)."""

    def __init__(self, timeout: int = 20) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": DEFAULT_UA})
        self.timeout = timeout
        self._lock = threading.Lock()
        self.geocode_cache: Dict[str, Dict[str, Any]] = {}
        self.wiki_summary_cache: Dict[str, Dict[str, Any]] = {}
        self.wikivoyage_cache: Dict[str, Dict[str, Any]] = {}
        self.search_cache: Dict[str, list] = {}
        self.route_cache: Dict[str, Dict[str, Any]] = {}

    # ────────────────────────── Geocoding ────────────────────────────

    def geocode(self, place: str, region: Optional[str] = None) -> Dict[str, Any]:
        """Resolve `place` to real {lat, lon, name, country} from the live web."""
        key = f"{place}|{region or ''}"
        with self._lock:
            if key in self.geocode_cache:
                return self.geocode_cache[key]

        result: Dict[str, Any] = {}

        # 1) Open-Meteo geocoding (fast, free, worldwide)
        try:
            r = self.session.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": place.strip(), "count": 5, "language": "en", "format": "json"},
                timeout=min(self.timeout, 12),
            )
            r.raise_for_status()
            payload = r.json().get("results") or []
            if payload:
                hit = payload[0]
                if region:
                    region_l = region.lower()
                    # Prefer candidates whose country/admin1 matches the region
                    ranked = [
                        c
                        for c in payload
                        if region_l in (c.get("country") or "").lower()
                        or region_l in (c.get("admin1") or "").lower()
                    ]
                    if ranked:
                        hit = ranked[0]
                result = {
                    "lat": float(hit["latitude"]),
                    "lon": float(hit["longitude"]),
                    "name": hit.get("name", place),
                    "country": hit.get("country", ""),
                    "admin1": hit.get("admin1", ""),
                    "source": "open-meteo",
                }
        except Exception as exc:  # noqa: BLE001
            logger.debug("Open-Meteo geocode failed for %s: %s", place, exc)

        # 2) Wikipedia coordinates lookup
        if not result:
            result = self._geocode_via_wikipedia(place)

        # 2b) Region mismatch → trust Wikipedia's article coordinates instead
        #     (Open-Meteo's index misses some places, e.g. "Goa" -> Genoa/Italy)
        if region and result:
            region_l = region.lower()
            haystack = f"{result.get('country', '')} {result.get('admin1', '')}".lower()
            if region_l not in haystack:
                wiki = self._geocode_via_wikipedia(place)
                if wiki:
                    result = wiki

        # 3) Region fallback
        if not result and region:
            try:
                result = self.geocode(region)
                result["name"] = f"{place}, {region}"
                result["source"] = "region-fallback"
            except Exception as exc:  # noqa: BLE001
                logger.debug("Region fallback geocode failed for %s: %s", region, exc)

        if result:
            with self._lock:
                self.geocode_cache[key] = result
            return result

        raise KnowledgeServiceError(f"Unable to geocode place: {place}")

    def _geocode_via_wikipedia(self, place: str) -> Dict[str, Any]:
        """Resolve coordinates by searching Wikipedia for the place article."""
        try:
            sr = self.session.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": place,
                    "srlimit": 1,
                    "format": "json",
                },
                timeout=min(self.timeout, 12),
            )
            sr.raise_for_status()
            hits = sr.json().get("query", {}).get("search", [])
            if not hits:
                return {}
            title = hits[0]["title"]
            qr = self.session.get(
                "https://en.wikipedia.org/w/api.php",
                params={"action": "query", "titles": title, "prop": "coordinates", "format": "json"},
                timeout=min(self.timeout, 12),
            )
            qr.raise_for_status()
            pages = qr.json().get("query", {}).get("pages", {})
            for page in pages.values():
                coords = (page.get("coordinates") or [{}])[0]
                if coords.get("lat") is not None:
                    return {
                        "lat": float(coords["lat"]),
                        "lon": float(coords["lon"]),
                        "name": page.get("title", place),
                        "country": "",
                        "admin1": "",
                        "source": "wikipedia",
                    }
        except Exception as exc:  # noqa: BLE001
            logger.debug("Wikipedia geocode failed for %s: %s", place, exc)
        return {}

    # ────────────────────────── Weather ─────────────────────────────

    # WMO Weather interpretation codes → human readable condition
    _WMO_CODES = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy Fog", 51: "Light Drizzle", 53: "Drizzle",
        55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
        66: "Freezing Rain", 67: "Freezing Rain", 71: "Light Snow", 73: "Snow",
        75: "Heavy Snow", 77: "Snow Grains", 80: "Rain Showers", 81: "Rain Showers",
        82: "Violent Showers", 85: "Snow Showers", 86: "Snow Showers",
        95: "Thunderstorm", 96: "Thunderstorm", 99: "Severe Thunderstorm",
    }

    def get_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Return real current weather from Open-Meteo for coordinates."""
        try:
            r = self.session.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current_weather": "true",
                    "hourly": "relativehumidity_2m,precipitation_probability",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
                timeout=min(self.timeout, 15),
            )
            r.raise_for_status()
            data = r.json()
            current = data.get("current_weather") or {}
            code = int(current.get("weathercode", 0))
            temperature = float(current.get("temperature", 22.0))
            humidity = 0
            hourly = data.get("hourly") or {}
            if hourly.get("relativehumidity_2m"):
                humidity = int(hourly["relativehumidity_2m"][0])
            condition = self._WMO_CODES.get(code, "Pleasant")
            return {
                "temperature_c": round(temperature, 1),
                "temperature": f"{round(temperature, 1)}°C",
                "condition": condition,
                "humidity": f"{humidity}%",
                "humidity_value": humidity,
                "wind_speed": current.get("windspeed"),
                "is_day": bool(current.get("is_day", 1)),
                "source": "open-meteo",
            }
        except Exception as exc:  # noqa: BLE001
            logger.warning("Open-Meteo weather failed for (%s,%s): %s", lat, lon, exc)
            return {
                "temperature_c": 22.0,
                "temperature": "22°C",
                "condition": "Pleasant",
                "humidity": "65%",
                "humidity_value": 65,
                "wind_speed": None,
                "is_day": True,
                "source": "fallback",
            }

    # ────────────────────────── Routing ─────────────────────────────

    def get_road_route(self, origin_coords: Dict[str, Any], dest_coords: Dict[str, Any]) -> Dict[str, Any]:
        """Real driving distance/duration between two coordinates via OSRM."""
        key = f"{origin_coords['lat']},{origin_coords['lon']};{dest_coords['lat']},{dest_coords['lon']}"
        with self._lock:
            if key in self.route_cache:
                return self.route_cache[key]

        result: Dict[str, Any] = {}
        try:
            url = (
                f"https://router.project-osrm.org/route/v1/driving/"
                f"{origin_coords['lon']},{origin_coords['lat']};"
                f"{dest_coords['lon']},{dest_coords['lat']}?overview=false"
            )
            r = self.session.get(url, timeout=min(self.timeout, 25))
            r.raise_for_status()
            routes = r.json().get("routes") or []
            if routes:
                route = routes[0]
                result = {
                    "distance_km": round(route["distance"] / 1000.0, 1),
                    "duration_min": round(route["duration"] / 60.0),
                    "source": "osrm",
                }
        except Exception as exc:  # noqa: BLE001
            logger.debug("OSRM routing failed (%s): %s", key, exc)

        if not result:
            result = {
                "distance_km": round(self._haversine_km(origin_coords, dest_coords) * 1.25, 1),
                "duration_min": int(
                    round(self._haversine_km(origin_coords, dest_coords) * 1.25 / 60 * 60)
                ),
                "source": "haversine-estimate",
            }

        with self._lock:
            self.route_cache[key] = result
        return result

    @staticmethod
    def _haversine_km(a: Dict[str, Any], b: Dict[str, Any]) -> float:
        R = 6371.0
        lat1, lon1 = math.radians(a["lat"]), math.radians(a["lon"])
        lat2, lon2 = math.radians(b["lat"]), math.radians(b["lon"])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))

    # ────────────────────────── Web Search ───────────────────────────

    def web_search(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        """Free internet search: Tavily (optional key) -> DDG IA -> Wikipedia/Wikivoyage."""
        key = query.lower().strip()
        with self._lock:
            if key in self.search_cache:
                return self.search_cache[key]

        results: List[Dict[str, Any]] = []

        # 1) Tavily (only if a key is configured in .env)
        tavily_key = os.getenv("TAVILY_API_KEY", "")
        if tavily_key:
            try:
                r = self.session.post(
                    "https://api.tavily.com/search",
                    json={"api_key": tavily_key, "query": query, "max_results": max_results},
                    timeout=min(self.timeout, 15),
                )
                r.raise_for_status()
                for item in r.json().get("results") or []:
                    results.append(
                        {
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "snippet": _clean_text(item.get("content", ""))[:400],
                            "source": "tavily",
                        }
                    )
            except Exception as exc:  # noqa: BLE001
                logger.debug("Tavily search failed for %s: %s", query, exc)

        # 2) DuckDuckGo Instant Answer API (no key needed)
        if not results:
            try:
                r = self.session.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                    timeout=min(self.timeout, 12),
                )
                r.raise_for_status()
                data = r.json()
                if data.get("AbstractText"):
                    results.append(
                        {
                            "title": data.get("Heading") or query,
                            "url": data.get("AbstractURL", ""),
                            "snippet": _clean_text(data["AbstractText"])[:400],
                            "source": "duckduckgo",
                        }
                    )
                for topic in (data.get("RelatedTopics") or [])[:max_results]:
                    if isinstance(topic, dict) and topic.get("Text"):
                        results.append(
                            {
                                "title": (topic.get("Text") or "")[:80],
                                "url": topic.get("FirstURL", ""),
                                "snippet": _clean_text(topic.get("Text", ""))[:400],
                                "source": "duckduckgo",
                            }
                        )
            except Exception as exc:  # noqa: BLE001
                logger.debug("DuckDuckGo search failed for %s: %s", query, exc)

        # 3) Last resort: Wikipedia + Wikivoyage article search
        if not results:
            for host, label in (
                ("en.wikipedia.org", "wikipedia"),
                ("en.wikivoyage.org", "wikivoyage"),
            ):
                try:
                    r = self.session.get(
                        f"https://{host}/w/api.php",
                        params={
                            "action": "query",
                            "list": "search",
                            "srsearch": query,
                            "srlimit": max_results,
                            "format": "json",
                        },
                        timeout=min(self.timeout, 12),
                    )
                    r.raise_for_status()
                    for hit in r.json().get("query", {}).get("search", []):
                        title = hit.get("title", "")
                        results.append(
                            {
                                "title": title,
                                "url": f"https://{host}/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
                                "snippet": _clean_text(hit.get("snippet", ""))[:400],
                                "source": label,
                            }
                        )
                except Exception as exc:  # noqa: BLE001
                    logger.debug("%s search failed for %s: %s", label, query, exc)

        results = results[:max_results]
        with self._lock:
            self.search_cache[key] = results
        return results

    # ──────────────────── Wikipedia / Wikivoyage ─────────────────────

    def get_wiki_summary(self, title: str) -> Dict[str, Any]:
        """Wikipedia REST summary: extract + hero image + article URL."""
        slug = urllib.parse.quote(title.strip().replace(" ", "_"))
        with self._lock:
            if slug in self.wiki_summary_cache:
                return self.wiki_summary_cache[slug]

        result: Dict[str, Any] = {}
        try:
            r = self.session.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{slug}",
                timeout=min(self.timeout, 12),
            )
            r.raise_for_status()
            data = r.json()
            if data.get("extract") and data.get("type") != "disambiguation":
                result = {
                    "title": data.get("title", title),
                    "extract": _clean_text(data.get("extract", ""))[:1200],
                    "image_url": (data.get("thumbnail") or data.get("originalimage") or {}).get("source", ""),
                    "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "source": "wikipedia",
                }
        except Exception as exc:  # noqa: BLE001
            logger.debug("Wikipedia summary failed for %s: %s", title, exc)

        with self._lock:
            self.wiki_summary_cache[slug] = result
        return result

    # Wikivoyage heading keywords mapped to our recommendation buckets
    _WIKIVOYAGE_BUCKETS = {
        "food": (r"\beat(?:e|ing)?\b|\bdrink\b|cuisine|\bfood\b",),
        "hidden_gems": (r"\bsee\b|\bdo\b|attraction|beach|wildlife|heritage",),
        "shopping": (r"\bbuy\b|\bshop(?:ping)?\b|handicraft|market",),
        "safety_tips": (r"\bstay safe\b|\bsafety\b|\bhealth\b|\bcope\b|emergency",),
    }

    def get_wikivoyage_insights(self, destination: str) -> Dict[str, List[str]]:
        """Pull See/Eat/Buy/Stay-safe bullets from the live Wikivoyage article."""
        key = destination.lower().strip()
        with self._lock:
            if key in self.wikivoyage_cache:
                return self.wikivoyage_cache[key]

        insights: Dict[str, List[str]] = {
            "food": [],
            "hidden_gems": [],
            "shopping": [],
            "safety_tips": [],
        }
        try:
            # 1) Find the destination article on Wikivoyage
            r = self.session.get(
                "https://en.wikivoyage.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": destination,
                    "srlimit": 1,
                    "format": "json",
                },
                timeout=min(self.timeout, 12),
            )
            r.raise_for_status()
            hits = r.json().get("query", {}).get("search", [])
            if not hits:
                with self._lock:
                    self.wikivoyage_cache[key] = insights
                return insights
            page = hits[0]["title"]

            # 2) Fetch the full article wikitext in ONE request
            r = self.session.get(
                "https://en.wikivoyage.org/w/api.php",
                params={"action": "parse", "page": page, "prop": "wikitext", "format": "json"},
                timeout=min(self.timeout, 15),
            )
            r.raise_for_status()
            wikitext = r.json().get("parse", {}).get("wikitext", {}).get("*", "")
            if not wikitext:
                with self._lock:
                    self.wikivoyage_cache[key] = insights
                return insights

            # 3) Split the article into (heading, body) chunks
            parts = re.split(r"\n(=+)\s*([^=\n]+?)\s*=+\n", wikitext)
            # re.split yields: [pre, level, heading, body, level, heading, body, ...]
            chunks: List[tuple] = []
            if parts and parts[0].strip():
                chunks.append(("", parts[0]))
            for i in range(1, len(parts) - 2, 3):
                chunks.append((parts[i + 1].strip(), parts[i + 2]))

            # 4) Route each section's bullets into the right bucket
            for heading, body in chunks:
                heading_l = heading.lower()
                for bucket, patterns in self._WIKIVOYAGE_BUCKETS.items():
                    if not any(re.search(p, heading_l) for p in patterns):
                        continue
                    for raw in re.split(r"\n\*", body):
                        clean = _clean_text(raw.lstrip("* ").strip())
                        if 25 < len(clean) < 320 and not clean.startswith(("==", "{{")):
                            insights[bucket].append(clean[:300])
                        if len(insights[bucket]) >= 6:
                            break
                    # Fallback: prose sections with no bullets → take sentences
                    if not insights[bucket]:
                        for sentence in re.split(r"(?<=[.!?])\s+", _clean_text(body)):
                            if 60 < len(sentence) < 320:
                                insights[bucket].append(sentence[:300])
                            if len(insights[bucket]) >= 4:
                                break
                    break  # each section feeds at most one bucket
        except Exception as exc:  # noqa: BLE001
            logger.debug("Wikivoyage insights failed for %s: %s", destination, exc)

        with self._lock:
            self.wikivoyage_cache[key] = insights
        return insights