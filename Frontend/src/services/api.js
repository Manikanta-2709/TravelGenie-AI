/**
 * TravelGenie AI — API client.
 *
 * No saved data, no mock generator: every plan comes from the backend,
 * which fetches everything live (Open-Meteo, OSRM, Wikipedia, Wikivoyage,
 * Groq LLM) and returns the V2 dashboard schema directly.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // live web fetching (geocoding, routing, LLM) can take a while
  headers: { 'Content-Type': 'application/json' },
});

/* ──────────────── V2 safety helpers ──────────────── */

const asArray = (v) => (Array.isArray(v) ? v : []);
const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const asString = (v, fallback = '') =>
  typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : fallback;
const asNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapsLink = (name, lat, lng) =>
  lat != null && lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || '')}`;

/** Normalize a place into the compact shape AccordionItinerary expects. */
const normalizePlace = (p) => {
  const o = asObject(p);
  const name = asString(o.name ?? o.place ?? o.title, '');
  if (!name) return null;
  const lat = o.lat ?? o.latitude;
  const lng = o.lng ?? o.lon ?? o.longitude;
  return {
    name,
    category: asString(o.category ?? o.type, 'attraction'),
    lat: lat != null ? asNumber(lat) : null,
    lng: lng != null ? asNumber(lng) : null,
    maps_url: asString(o.maps_url, mapsLink(name, lat, lng)),
    travel_from_prev: asString(o.travel_from_prev ?? o.travel_time ?? o.duration_from_prev, ''),
    geo_source: asString(o.geo_source, ''),
  };
};

/** Normalize one itinerary day (morning/afternoon/evening slots). */
const normalizeItineraryDay = (day, index) => {
  const o = asObject(day);
  const rawSlots = o.slots || o;

  const normalizeSlot = (slot, slotName) => {
    const s = asObject(slot);
    let summary = asString(s.summary ?? s.description ?? s.text, '');
    let places = asArray(s.places).map(normalizePlace).filter(Boolean);

    if (typeof slot === 'string' && slot.trim()) {
      summary = slot.trim();
    }

    if (places.length === 0 && summary) {
      const parts = summary.split(/[-–—•,]/).map((p) => p.trim()).filter((p) => p.length > 3 && p.length < 50);
      const placeName = parts[0] || `${slotName} Experience`;
      places = [
        {
          name: placeName,
          category: 'Landmark',
          maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`,
        },
      ];
    }

    return { summary, places };
  };

  const slots = {
    morning: normalizeSlot(rawSlots.morning, 'Morning'),
    afternoon: normalizeSlot(rawSlots.afternoon, 'Afternoon'),
    evening: normalizeSlot(rawSlots.evening, 'Evening'),
  };

  const placeCount =
    asNumber(o.place_count, 0) ||
    Object.values(slots).reduce((n, s) => n + s.places.length, 0) ||
    3;

  return {
    day: asNumber(o.day, index + 1),
    title: asString(o.title, `Day ${asNumber(o.day, index + 1)}`),
    place_count: placeCount,
    walking_km: o.walking_km != null ? asNumber(o.walking_km) : 3.5,
    walking_time: asString(o.walking_time, '~1.5h walk'),
    stay_location: asString(o.stay_location, 'City Center Hotel'),
    ...slots,
  };
};

const normalizeRecItem = (item, destination) => {
  if (!item) return null;
  if (typeof item === 'string') {
    const clean = item.trim();
    if (!clean) return null;
    return {
      name: clean,
      cuisine: 'Local Specialty',
      description: `Must-visit local experience in ${destination}`,
      cost: 'Popular Choice',
      rating: '4.8 ⭐',
      maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean + ' ' + (destination || ''))}`,
    };
  }
  const obj = asObject(item);
  const name = asString(obj.name || obj.title || obj.item || obj.place, '');
  if (!name) return null;
  return {
    name,
    cuisine: asString(obj.cuisine || obj.category || 'Specialty'),
    description: asString(obj.description || obj.details || obj.item, ''),
    cost: asString(obj.cost || obj.price, 'Popular Choice'),
    rating: asString(obj.rating, '4.8 ⭐'),
    maps_url: asString(
      obj.maps_url,
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (destination || ''))}`
    ),
  };
};

/** Defensive normalization of the backend's V2 response. */
const normalizeApiResponse = (data) => {
  const d = asObject(data);
  const hero = asObject(d.hero);
  const overview = asObject(d.overview);
  const metrics = asObject(d.metrics);
  const recommendations = asObject(d.recommendations);
  const route = asObject(d.route);
  const destName = asString(hero.destination || route.destination, 'Destination');

  const normalizedTransport = asArray(d.transport).map((t) => {
    const o = asObject(t);
    return {
      ...o,
      mode: asString(o.mode ?? o.transport_mode, 'train'),
      title: asString(o.title ?? o.name, 'Travel option'),
      duration: asString(o.duration ?? o.estimated_duration, ''),
      fare: asString(o.fare ?? o.estimated_fare ?? o.price, ''),
      booking_url: asString(o.booking_url, asString(o.url)),
      maps_url: asString(o.maps_url),
      recommended: Boolean(o.recommended),
    };
  });

  return {
    status: asString(d.status, 'ok'),
    warnings: asArray(d.warnings),
    hero: {
      destination: asString(hero.destination, 'Your Destination'),
      tagline: asString(hero.tagline),
      image_url: asString(hero.image_url),
      trip_score: asNumber(hero.trip_score, 0),
      origin: asString(hero.origin),
      distance_km: asNumber(hero.distance_km ?? route.distance_km, 0),
      distance_label: asString(hero.distance_label ?? route.distance_label, ''),
      duration: asString(hero.duration, asString(route.duration_label, '')),
      travelers: asNumber(hero.travelers, 1),
      maps_url: asString(hero.maps_url),
    },
    overview: {
      budget: asObject(overview.budget),
      weather: asObject(overview.weather),
      best_time: asString(overview.best_time),
      ai_score: asNumber(overview.ai_score, asNumber(hero.trip_score, 0)),
      route_efficiency: asNumber(overview.route_efficiency, asNumber(metrics.route_efficiency, 0)),
    },
    route: {
      origin: asString(route.origin ?? hero.origin, ''),
      destination: asString(route.destination ?? hero.destination, ''),
      distance_km: asNumber(route.distance_km ?? hero.distance_km, 0),
      duration_min: asNumber(route.duration_min ?? hero.duration_min, 0),
      estimated_distance: asString(route.estimated_distance, ''),
      recommended_mode: asString(route.recommended_mode, ''),
      directions_url: asString(route.directions_url, ''),
      travel_options: normalizedTransport,
    },
    transport: normalizedTransport,
    hotels: asArray(d.hotels).map((h) => {
      const o = asObject(h);
      return {
        ...o,
        name: asString(o.name, 'Hotel'),
        maps_url: asString(o.maps_url, mapsLink(asString(o.name), null, null)),
        booking_url: asString(o.booking_url, asString(o.maps_url)),
      };
    }),
    itinerary: asArray(d.itinerary).map(normalizeItineraryDay),
    recommendations: {
      food: asArray(recommendations.food).map((i) => normalizeRecItem(i, destName)).filter(Boolean),
      hidden_gems: asArray(recommendations.hidden_gems).map((i) => normalizeRecItem(i, destName)).filter(Boolean),
      shopping: asArray(recommendations.shopping).map((i) => normalizeRecItem(i, destName)).filter(Boolean),
      safety_tips: asArray(recommendations.safety_tips)
        .map((i) => (typeof i === 'string' ? i : i.text || i.name))
        .filter(Boolean),
    },
    metrics: {
      route_efficiency: asNumber(metrics.route_efficiency, 0),
      walking_km: asNumber(metrics.walking_km, 0),
      transport_hours: asNumber(metrics.transport_hours, 0),
      ai_score: asNumber(metrics.ai_score, 0),
    },
  };
};

/* ──────────────── Public API ──────────────── */

export const planTrip = async (formData) => {
  const payload = {
    starting_city: formData.startingCity || formData.starting_city || '',
    destination: formData.destination || '',
    budget: Number(formData.budget) || 15000,
    days: Number(formData.days) || 3,
    travelers: Number(formData.travelers) || 2,
    interests: Array.isArray(formData.interests)
      ? formData.interests
      : String(formData.interests || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    preferred_travel_mode: formData.preferredTravelMode || formData.preferred_travel_mode || null,
  };

  try {
    const { data } = await apiClient.post('/plan-trip', payload);
    const normalized = normalizeApiResponse(data);
    return {
      success: true,
      data: normalized,
      isMock: false,
      warning: Array.isArray(normalized.warnings) && normalized.warnings.length ? normalized.warnings[0] : '',
      ...normalized,
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Planning took too long — the backend fetches live web data. Please try again.');
    }
    if (error.response) {
      const detail = typeof error.response.data?.detail === 'string'
        ? error.response.data.detail
        : 'The planner could not process this trip.';
      throw new Error(detail);
    }
    throw new Error('Cannot reach the TravelGenie backend. Is it running on ' + API_BASE_URL + '?');
  }
};

export const checkHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data;
};

export default { planTrip, checkHealth };