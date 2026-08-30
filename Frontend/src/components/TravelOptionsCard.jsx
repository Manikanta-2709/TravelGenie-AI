import React, { useState } from 'react';
import {
  Train,
  Plane,
  Bus,
  Car,
  Navigation,
  ExternalLink,
  MapPin,
  Clock,
  Coins,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass,
  Milestone
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const MODE_ICONS = {
  train: Train,
  flight: Plane,
  bus: Bus,
  drive: Car,
};

export default function TravelOptionsCard({ route, destination }) {
  const { formatPrice, currency } = useCurrency();
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (!route) return null;

  const origin = route.origin || 'Origin';
  const dest = route.destination || destination || 'Destination';
  const distance = route.estimated_distance || (route.distance_km ? `${route.distance_km} km` : 'Calculated Distance');
  const travelOptions = route.travel_options || [];

  const filteredOptions = selectedFilter === 'all'
    ? travelOptions
    : travelOptions.filter(opt => opt.mode === selectedFilter);

  return (
    <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#35E6A1]/5 blur-[90px] rounded-full pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#214A47] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center text-[#35E6A1] shadow-md">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#35E6A1] bg-[#071A1D] px-2.5 py-0.5 rounded-full border border-[#214A47] uppercase tracking-wider">
                Original Distance & Transit
              </span>
              <span className="text-xs text-[#B9C9C6]">• Multi-Modal Options</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Travelling Options & Transit Routes
            </h3>
          </div>
        </div>

        {/* Real Distance Badge */}
        <div className="bg-[#071A1D] border border-[#214A47] px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg self-start sm:self-auto">
          <Milestone className="w-5 h-5 text-[#4FFFC0]" />
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#B9C9C6]">Original Distance</span>
            <span className="text-sm font-black text-[#35E6A1]">{distance}</span>
          </div>
        </div>
      </div>

      {/* Route Journey Visualizer Line */}
      <div className="bg-[#071A1D] border border-[#214A47] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Origin Hub */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-[#35E6A1]/10 border border-[#35E6A1]/40 text-[#35E6A1] flex items-center justify-center font-black">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#B9C9C6]/70">Departure Hub</span>
            <h4 className="text-base font-extrabold text-white">{origin}</h4>
          </div>
        </div>

        {/* Travel Path & Recommended Mode */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#35E6A1] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended: {route.recommended_mode || 'Express Train / Flight'}</span>
          </div>
          <div className="relative w-full flex items-center justify-center">
            <div className="w-full h-1 bg-gradient-to-r from-[#35E6A1] via-[#4FFFC0] to-[#35E6A1] rounded-full"></div>
            <div className="absolute bg-[#071A1D] border border-[#35E6A1] text-white px-3 py-0.5 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
              <span>{distance}</span>
              <span className="text-[#35E6A1]">•</span>
              <span className="text-[#4FFFC0]">{route.estimated_duration}</span>
            </div>
          </div>
        </div>

        {/* Destination Hub */}
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#35E6A1]">Arrival Destination</span>
            <h4 className="text-base font-extrabold text-white">{dest}</h4>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#4FFFC0]/10 border border-[#4FFFC0]/40 text-[#4FFFC0] flex items-center justify-center font-black">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Mode Switcher Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-[#35E6A1] text-[#071A1D] shadow-lg shadow-[#35E6A1]/20 font-black'
              : 'bg-[#071A1D] text-[#B9C9C6] border border-[#214A47] hover:text-white hover:border-[#35E6A1]/40'
          }`}
        >
          All Transit Options ({travelOptions.length})
        </button>
        {['train', 'flight', 'bus', 'drive'].map((modeKey) => {
          const count = travelOptions.filter(o => o.mode === modeKey).length;
          if (count === 0) return null;
          const IconComponent = MODE_ICONS[modeKey] || Navigation;
          const label = modeKey === 'train' ? 'Train' : modeKey === 'flight' ? 'Flight' : modeKey === 'bus' ? 'Bus' : 'Self-Drive / Cab';

          return (
            <button
              key={modeKey}
              onClick={() => setSelectedFilter(modeKey)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                selectedFilter === modeKey
                  ? 'bg-[#35E6A1] text-[#071A1D] shadow-lg shadow-[#35E6A1]/20 font-black'
                  : 'bg-[#071A1D] text-[#B9C9C6] border border-[#214A47] hover:text-white hover:border-[#35E6A1]/40'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Travelling Options Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOptions.map((option, idx) => {
          const Icon = MODE_ICONS[option.mode] || Train;

          return (
            <div
              key={idx}
              className={`bg-[#071A1D] border rounded-2xl p-5 space-y-4 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between ${
                option.recommended
                  ? 'border-[#35E6A1] shadow-lg shadow-[#35E6A1]/10 relative ring-1 ring-[#35E6A1]/30'
                  : 'border-[#214A47] hover:border-[#35E6A1]/50'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header with Mode & Recommendation Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0B2426] border border-[#214A47] flex items-center justify-center text-[#35E6A1]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{option.title}</h4>
                      <span className="text-[10px] text-[#B9C9C6] capitalize font-medium">{option.mode} Transit</span>
                    </div>
                  </div>

                  {option.recommended && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#071A1D] bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] px-2.5 py-0.5 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Duration & Estimated Fare */}
                <div className="grid grid-cols-2 gap-2 bg-[#0B2426] border border-[#214A47]/60 rounded-xl p-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#B9C9C6]">
                      <Clock className="w-3 h-3 text-[#35E6A1]" />
                      <span>Duration</span>
                    </div>
                    <p className="text-xs font-black text-white">{option.duration}</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#B9C9C6]">
                      <Coins className="w-3 h-3 text-[#4FFFC0]" />
                      <span>Est. Fare</span>
                    </div>
                    <p className="text-xs font-black text-[#35E6A1] truncate">{option.estimated_fare}</p>
                  </div>
                </div>

                {/* Description details */}
                <p className="text-xs text-[#B9C9C6] leading-relaxed">
                  {option.details}
                </p>

                {/* Pros list */}
                {option.pros && option.pros.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#35E6A1] block">Key Advantages:</span>
                    <ul className="space-y-1 text-xs text-[#B9C9C6]/90">
                      {option.pros.map((pro, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-[#35E6A1] flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Direct Booking & Search Link Button */}
              {option.booking_url && (
                <div className="pt-2 border-t border-[#214A47]/50">
                  <a
                    href={option.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#0B2426] hover:bg-[#35E6A1] text-[#35E6A1] hover:text-[#071A1D] border border-[#214A47] hover:border-[#35E6A1] font-bold text-xs transition-all duration-200 group cursor-pointer shadow-sm"
                  >
                    <span>{option.booking_label || 'Check & Book Online'}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Directions Link & Journey Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#214A47]">
        {/* Highlights */}
        {route.journey_highlights && route.journey_highlights.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#35E6A1] uppercase tracking-wider block">
              Route Highlights & En-Route Stops
            </span>
            <ul className="space-y-1.5 text-xs text-[#B9C9C6]">
              {route.journey_highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Milestone className="w-3.5 h-3.5 text-[#35E6A1] flex-shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Route Tip & Google Maps Button */}
        <div className="space-y-3">
          {route.route_tip && (
            <div className="p-3.5 rounded-2xl bg-[#071A1D] border border-[#214A47] text-xs text-[#B9C9C6] leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Transit Pro-Tip</span>
              <p>{route.route_tip}</p>
            </div>
          )}

          {route.directions_url && (
            <a
              href={route.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-[#071A1D] hover:bg-[#0B2426] text-white border border-[#35E6A1]/40 font-bold text-xs transition-all shadow-sm group"
            >
              <Navigation className="w-3.5 h-3.5 text-[#35E6A1]" />
              <span>Open Step-by-Step Directions in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#B9C9C6] group-hover:text-white" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
