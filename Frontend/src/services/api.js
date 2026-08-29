import axios from 'axios';

// Backend Base URL
const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 second timeout for multi-agent LLM workflow execution
});

/**
 * Fallback generator in case the backend server is not running during local frontend testing.
 */
const generateMockTripResponse = (formData) => {
  const city = formData.starting_city || 'Your City';
  const interestsList = formData.interests && formData.interests.length > 0
    ? formData.interests.join(', ')
    : 'Sightseeing & Culture';
  
  // Destination matching based on user input or interests
  let destination = formData.destination?.trim() || 'Coorg';
  let tips = 'Carry a light jacket and comfortable walking shoes.';
  let weather = '21°C, Favorable & Pleasant';

  if (!formData.destination?.trim()) {
    if (formData.interests?.includes('Beaches')) {
      destination = 'Goa (South Coast)';
      tips = 'Carry sunscreen, light cotton clothing, and stay hydrated.';
      weather = '29°C, Sunny & Breezy';
    } else if (formData.interests?.includes('Mountains') || formData.interests?.includes('Adventure')) {
      destination = 'Munnar Hills';
      tips = 'Carry warm clothing and rain gear for sudden showers.';
      weather = '18°C, Misty & Pleasant';
    } else if (formData.interests?.includes('History') || formData.interests?.includes('Culture')) {
      destination = 'Hampi Heritage Valley';
      tips = 'Wear comfortable walking shoes for heritage temple exploration.';
      weather = '26°C, Clear Skies';
    }
  }

  const numDays = Math.max(1, parseInt(formData.days) || 3);
  const itinerary = [];

  for (let i = 1; i <= numDays; i++) {
    if (i === 1) {
      itinerary.push({
        day: 1,
        title: `Arrival & Local Discovery`,
        description: `Depart from ${city} and arrive at ${destination}. Check into your stay, relax, and explore the nearby local market and sunset viewpoint.`
      });
    } else if (i === numDays) {
      itinerary.push({
        day: i,
        title: `Sightseeing & Farewell`,
        description: `Visit the top scenic viewpoint, shop for local souvenirs and authentic regional treats, before your return journey back to ${city}.`
      });
    } else {
      itinerary.push({
        day: i,
        title: `Deep Dive: ${formData.interests?.[i % (formData.interests.length || 1)] || 'Exploration'}`,
        description: `Full day dedicated to enjoying ${interestsList}. Experience guided local tours, regional cuisine sampling, and iconic nature landscapes.`
      });
    }
  }

  const route = {
    origin: city,
    destination: destination,
    recommended_mode: "Scenic Express Train / Highway Drive",
    estimated_distance: "approx. 320 km",
    estimated_duration: "approx. 6 hours",
    transit_cost: formData.budget ? `₹${Math.round(Number(formData.budget) * 0.15).toLocaleString('en-IN')}` : '₹2,250',
    journey_highlights: [
      `Boarding & departure from ${city} transit terminal`,
      "Scenic highway landscapes and mountain passes",
      "Authentic regional highway eatery refreshment stop",
      `Arrival & hotel check-in at ${destination}`
    ],
    route_tip: `Plan an early morning departure from ${city} to enjoy daylight scenery and maximize your first day in ${destination}.`
  };

  return {
    destination,
    budget: formData.budget ? `₹${Number(formData.budget).toLocaleString('en-IN')}` : '₹15,000',
    weather,
    tips,
    route,
    itinerary,
  };
};

/**
 * Plan trip API call
 * Sends user travel preferences to the backend AI agent pipeline.
 */
export const planTrip = async (formData) => {
  const payload = {
    starting_city: formData.starting_city,
    destination: formData.destination?.trim() || undefined,
    budget: Number(formData.budget) || 15000,
    days: Number(formData.days) || 3,
    interests: formData.interests || ["Nature"],
    travelers: Number(formData.travelers) || 2,
  };

  try {
    const response = await apiClient.post('/plan-trip', payload);
    return {
      success: true,
      data: normalizeApiResponse(response.data, formData),
      isMock: false,
    };
  } catch (error) {
    console.warn('Backend API connection failed or unavailable:', error.message);
    
    // In local development/demo mode, if backend is offline, return synthesized realistic fallback
    const fallbackData = generateMockTripResponse(formData);
    return {
      success: true,
      data: fallbackData,
      isMock: true,
      warning: 'Displayed using local agent simulator (Backend offline at http://localhost:8000/plan-trip).'
    };
  }
};

/**
 * Normalizes backend response data to ensure consistency across varying backend formats
 */
const normalizeApiResponse = (data, formData) => {
  if (!data) return generateMockTripResponse(formData);

  // Normalize itinerary into an array of objects { day, description }
  let normalizedItinerary = [];
  if (Array.isArray(data.itinerary)) {
    normalizedItinerary = data.itinerary.map((item, index) => {
      if (typeof item === 'string') {
        return { day: index + 1, description: item };
      }
      return {
        day: item.day || index + 1,
        title: item.title || `Day ${item.day || index + 1}`,
        description: item.description || item.activity || JSON.stringify(item),
      };
    });
  } else if (typeof data.itinerary === 'object' && data.itinerary !== null) {
    normalizedItinerary = Object.entries(data.itinerary).map(([key, val], idx) => ({
      day: idx + 1,
      title: key,
      description: typeof val === 'string' ? val : JSON.stringify(val),
    }));
  }

  const defaultRoute = generateMockTripResponse(formData).route;
  const route = data.route || defaultRoute;

  return {
    destination: data.destination || data.city || 'Recommended Destination',
    budget: data.budget ? (String(data.budget).startsWith('₹') ? data.budget : `₹${data.budget}`) : `₹${formData.budget || '15,000'}`,
    weather: data.weather || 'Pleasant & Favorable',
    tips: data.tips || data.travel_tips || 'Wear comfortable shoes and carry essentials.',
    route,
    itinerary: normalizedItinerary.length > 0 ? normalizedItinerary : generateMockTripResponse(formData).itinerary,
  };
};

export default {
  planTrip,
};
