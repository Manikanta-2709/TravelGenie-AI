import React, { useState } from 'react';
import {
  Building2,
  Star,
  MapPin,
  ExternalLink,
  Sparkles,
  Wifi,
  Coffee,
  Check,
  Compass,
  BedDouble,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

export default function HotelStayCard({ stays = [], destination = '', staySummary = '' }) {
  const { formatPrice, currency } = useCurrency();
  const [filterType, setFilterType] = useState('all');

  if (!stays || stays.length === 0) return null;

  const filteredStays = filterType === 'all'
    ? stays
    : stays.filter(stay => {
        const typeLower = (stay.type || '').toLowerCase();
        if (filterType === 'luxury') return typeLower.includes('luxury') || typeLower.includes('5-star') || typeLower.includes('resort');
        if (filterType === 'boutique') return typeLower.includes('boutique') || typeLower.includes('villa') || typeLower.includes('retreat');
        if (filterType === 'budget') return typeLower.includes('budget') || typeLower.includes('homestay') || typeLower.includes('hostel');
        return true;
      });

  return (
    <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#4FFFC0]/5 blur-[90px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#214A47] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center text-[#35E6A1] shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#35E6A1] bg-[#071A1D] px-2.5 py-0.5 rounded-full border border-[#214A47] uppercase tracking-wider">
                Stay Location & Verified Hotels
              </span>
              <span className="text-xs text-[#B9C9C6]">• Direct Booking Links</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Recommended Accommodations in {destination}
            </h3>
          </div>
        </div>

        <span className="text-xs text-[#B9C9C6] bg-[#071A1D] px-3 py-1.5 rounded-xl border border-[#214A47] font-semibold self-start sm:self-auto">
          {stays.length} Handpicked Properties
        </span>
      </div>

      {/* Summary Advisory */}
      {staySummary && (
        <div className="bg-[#071A1D] border border-[#214A47] p-3.5 rounded-2xl text-xs text-[#B9C9C6] flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-[#35E6A1] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{staySummary}</p>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Stays' },
          { id: 'luxury', label: 'Luxury & Resorts' },
          { id: 'boutique', label: 'Boutique & Villas' },
          { id: 'budget', label: 'Budget & Homestays' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.id
                ? 'bg-[#35E6A1] text-[#071A1D] shadow-lg shadow-[#35E6A1]/20 font-black'
                : 'bg-[#071A1D] text-[#B9C9C6] border border-[#214A47] hover:text-white hover:border-[#35E6A1]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStays.map((stay, idx) => {
          const priceDisplay = stay.price_value
            ? `${formatPrice(stay.price_value)}/night`
            : stay.price_per_night;

          return (
            <div
              key={stay.id || idx}
              className="bg-[#071A1D] border border-[#214A47] hover:border-[#35E6A1] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Hotel Photo Header */}
              <div className="relative h-44 w-full overflow-hidden bg-[#0B2426]">
                <img
                  src={stay.image_url || DEFAULT_HOTEL_IMG}
                  alt={stay.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_HOTEL_IMG;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071A1D] via-transparent to-transparent"></div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-[#071A1D]/90 backdrop-blur-md border border-[#214A47] px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-white">{stay.rating || 4.7}</span>
                </div>

                {/* Type Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-[#0B2426]/95 backdrop-blur-md text-[#35E6A1] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-[#214A47] tracking-wider shadow">
                    {stay.type || 'Recommended Stay'}
                  </span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-extrabold text-white group-hover:text-[#35E6A1] transition-colors leading-snug">
                      {stay.name}
                    </h4>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-[#B9C9C6]">
                    <MapPin className="w-3.5 h-3.5 text-[#35E6A1] flex-shrink-0" />
                    <span className="truncate">{stay.location}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#B9C9C6]/90 line-clamp-2 leading-relaxed">
                    {stay.description}
                  </p>

                  {/* Amenities Chips */}
                  {stay.amenities && stay.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stay.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[10px] font-semibold text-[#B9C9C6] bg-[#0B2426] border border-[#214A47] px-2 py-0.5 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                      {stay.amenities.length > 3 && (
                        <span className="text-[10px] font-bold text-[#35E6A1] bg-[#0B2426] px-1.5 py-0.5 rounded-md border border-[#214A47]">
                          +{stay.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pro Tip */}
                  {stay.stay_tip && (
                    <div className="text-[11px] text-[#4FFFC0] bg-[#0B2426] border border-[#214A47] p-2 rounded-xl">
                      <span className="font-bold">Tip: </span>
                      <span>{stay.stay_tip}</span>
                    </div>
                  )}
                </div>

                {/* Price & Booking Actions */}
                <div className="space-y-3 pt-3 border-t border-[#214A47]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#B9C9C6]">Estimated Price</span>
                    <span className="text-sm font-black text-white">{priceDisplay}</span>
                  </div>

                  {/* Clickable Links: Booking & Google Maps */}
                  <div className="grid grid-cols-2 gap-2">
                    {stay.booking_url && (
                      <a
                        href={stay.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] font-black text-xs hover:opacity-90 transition-all shadow-md group/btn cursor-pointer text-center"
                      >
                        <span>Book Room</span>
                        <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                    {stay.maps_url && (
                      <a
                        href={stay.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B2426] hover:bg-[#071A1D] text-[#B9C9C6] hover:text-white border border-[#214A47] hover:border-[#35E6A1]/50 font-bold text-xs transition-all text-center cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-[#35E6A1]" />
                        <span>Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
