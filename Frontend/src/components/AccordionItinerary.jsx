import React, { useState } from 'react';
import {
  Calendar,
  Sunrise,
  Sun,
  Sunset,
  MapPin,
  ChevronDown,
  Clock,
  Footprints,
  MapPinned,
} from 'lucide-react';

const SLOT_CONFIG = {
  morning: {
    icon: Sunrise,
    label: 'Morning',
    iconStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  },
  afternoon: {
    icon: Sun,
    label: 'Afternoon',
    iconStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  },
  evening: {
    icon: Sunset,
    label: 'Evening',
    iconStyle: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  },
};

const CATEGORY_BADGES = {
  nature: 'bg-[#35E6A1]/10 text-[#35E6A1] border-[#35E6A1]/30',
  beach: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  food: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  spiritual: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
  culture: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  history: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  heritage: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  wildlife: 'bg-lime-500/10 text-lime-300 border-lime-500/30',
  adventure: 'bg-red-500/10 text-red-300 border-red-500/30',
  shopping: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  transit: 'bg-[#B9C9C6]/10 text-[#B9C9C6] border-[#214A47]',
  viewpoint: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  experience: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  landmark: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
};

const categoryBadge = (category) => {
  const key = (category || '').toLowerCase();
  return CATEGORY_BADGES[key] || 'bg-[#B9C9C6]/10 text-[#B9C9C6] border-[#214A47]';
};

const collectPlaces = (day) =>
  ['morning', 'afternoon', 'evening'].reduce((acc, s) => acc.concat(day?.[s]?.places || []), []);

/**
 * Section 4 — Compact accordion itinerary.
 * Only one day expanded at a time; Day 1 open by default. No large images.
 */
export default function AccordionItinerary({ itinerary = [], metrics }) {
  const [openDay, setOpenDay] = useState(itinerary.length > 0 ? itinerary[0].day : 1);

  if (itinerary.length === 0) return null;

  const totalPlaces = itinerary.reduce((acc, d) => acc + collectPlaces(d).length, 0);
  const walkingKm = parseFloat(String(metrics?.walking_km || '').replace(/[^0-9.]/g, ''));
  const walkPerDay =
    Number.isFinite(walkingKm) && walkingKm > 0
      ? (walkingKm / itinerary.length).toFixed(1)
      : null;

  return (
    <section className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-4 sm:p-5 shadow-2xl">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#214A47] pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#35E6A1]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Day-by-Day Itinerary</h3>
            <p className="text-[11px] text-[#B9C9C6] flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#35E6A1]" /> {totalPlaces} stops
              </span>
              {metrics?.walking_km && (
                <span className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-[#4FFFC0]" /> {metrics.walking_km} walk
                </span>
              )}
              {metrics?.transport_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#4FFFC0]" /> {metrics.transport_hours} travel
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {itinerary.map((day) => {
          const isOpen = openDay === day.day;
          const places = collectPlaces(day);
          return (
            <div
              key={day.day}
              className={`rounded-2xl border overflow-hidden bg-[#071A1D] transition-colors ${
                isOpen ? 'border-[#35E6A1]/50' : 'border-[#214A47] hover:border-[#2a5b57]'
              }`}
            >
              {/* Day header row */}
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : day.day)}
                className="w-full flex items-center gap-3 p-3 text-left cursor-pointer hover:bg-[#0B2426]/60 transition-colors"
              >
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] text-xs font-black flex items-center justify-center flex-shrink-0 shadow-md">
                  {day.day}
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block text-xs font-extrabold text-white truncate">
                    {day.title || `Day ${day.day}`}
                  </span>
                  <span className="block text-[10px] text-[#B9C9C6] flex items-center gap-1.5 flex-wrap">
                    <span>{places.length} places</span>
                    {walkPerDay !== null && (
                      <span className="flex items-center gap-0.5">
                        <Footprints className="w-2.5 h-2.5 text-[#35E6A1]" /> ~{walkPerDay} km walk
                      </span>
                    )}
                  </span>
                </span>
                <ChevronDown
                  className={`accordion-chevron w-4 h-4 text-[#35E6A1] flex-shrink-0 ${
                    isOpen ? 'rotate' : ''
                  }`}
                />
              </button>
{/* Expanded panel */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 accordion-panel-open">
                  {['morning', 'afternoon', 'evening'].map((slotKey) => {
                    const slot = day[slotKey];
                    if (!slot || !slot.places || slot.places.length === 0) return null;
                    const config = SLOT_CONFIG[slotKey] || SLOT_CONFIG.morning;
                    const SlotIcon = config.icon;
                    return (
                      <div key={slotKey} className="rounded-xl border border-[#214A47] bg-[#0B2426] p-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${config.iconStyle}`}>
                            <SlotIcon className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                            {slot.label || config.label}
                          </span>
                        </div>
                        {slot.places.map((p, pIdx) => {
                          const placeName = p?.name || p?.place || p?.title || 'Destination stop';
                          const placeCategory = p?.category || '';
                          const placeLink = p?.maps_url || p?.map_url || '';
                          const travelLabel = p?.travel_time || p?.travel_from_prev || '';

                          return (
                            <div
                              key={pIdx}
                              className="flex items-center gap-2 py-1.5 border-b border-[#214A47]/40 last:border-0"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#35E6A1] flex-shrink-0" />
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {placeLink ? (
                                    <a
                                      href={placeLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open in Google Maps"
                                      className="text-[11px] font-bold text-white hover:text-[#35E6A1] underline-offset-2 hover:underline transition-colors"
                                    >
                                      {placeName}
                                    </a>
                                  ) : (
                                    <span className="text-[11px] font-bold text-white">{placeName}</span>
                                  )}
                                  {placeCategory && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${categoryBadge(placeCategory)}`}>
                                      {placeCategory}
                                    </span>
                                  )}
                                </div>
                                {travelLabel && (
                                  <p className="text-[10px] text-[#B9C9C6] flex items-center gap-1 mt-0.5">
                                    <Clock className="w-2.5 h-2.5 text-[#4FFFC0]" />
                                    <span className="truncate">{travelLabel}</span>
                                  </p>
                                )}
                              </div>
                              {placeLink && (
                                <a
                                  href={placeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#214A47] text-[#35E6A1] text-[9px] font-bold hover:bg-[#35E6A1] hover:text-[#071A1D] transition-colors"
                                >
                                  <MapPin className="w-3 h-3" /> Maps
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
{day.stay_location && (
                    <div className="rounded-xl border border-[#35E6A1]/30 bg-[#071A1D] px-2.5 py-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#35E6A1]/15 border border-[#35E6A1]/40 flex items-center justify-center flex-shrink-0">
                        <MapPinned className="w-3 h-3 text-[#35E6A1]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-[#35E6A1]">
                          Overnight Base
                        </span>
                        <p className="text-[11px] font-bold text-white truncate">{day.stay_location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}