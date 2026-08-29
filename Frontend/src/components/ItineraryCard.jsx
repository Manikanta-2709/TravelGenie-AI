import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  MapPin,
  Sunrise,
  Sun,
  Sunset,
  Sparkles,
  Utensils,
  Camera
} from 'lucide-react';

const DAY_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600100395938-f463a5aa9fb7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80',
];

const getDayImageUrl = (dayNum, destination) => {
  const fallback = DAY_IMAGE_POOL[(dayNum - 1) % DAY_IMAGE_POOL.length];
  if (!destination || typeof destination !== 'string') return fallback;
  
  const themes = ['sightseeing,landmark', 'culture,temple', 'nature,landscape', 'beach,waterfall', 'sunset,viewpoint'];
  const theme = themes[(dayNum - 1) % themes.length];
  return `https://source.unsplash.com/1000x700/?${encodeURIComponent(destination)},${theme}`;
};

/**
 * Parses raw day description into clean Morning, Afternoon, and Evening slots.
 */
const parseDaySlots = (text) => {
  if (!text || typeof text !== 'string') return [];

  const slots = [];
  
  // Extract Morning
  const morningMatch = text.match(/Morning:\s*(.*?)(?=\s*Afternoon:|\s*Evening:|$)/i);
  if (morningMatch && morningMatch[1].trim()) {
    slots.push({
      period: 'Morning',
      type: 'morning',
      title: 'Morning Exploration & Breakfast',
      content: morningMatch[1].trim(),
      icon: Sunrise,
      badgeStyle: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      lineAccent: 'border-l-amber-500/60'
    });
  }

  // Extract Afternoon
  const afternoonMatch = text.match(/Afternoon:\s*(.*?)(?=\s*Evening:|$)/i);
  if (afternoonMatch && afternoonMatch[1].trim()) {
    slots.push({
      period: 'Afternoon',
      type: 'afternoon',
      title: 'Afternoon Sightseeing & Local Lunch',
      content: afternoonMatch[1].trim(),
      icon: Sun,
      badgeStyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      lineAccent: 'border-l-emerald-500/60'
    });
  }

  // Extract Evening
  const eveningMatch = text.match(/Evening:\s*(.*)/i);
  if (eveningMatch && eveningMatch[1].trim()) {
    slots.push({
      period: 'Evening',
      type: 'evening',
      title: 'Evening Sunset & Regional Dining',
      content: eveningMatch[1].trim(),
      icon: Sunset,
      badgeStyle: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
      lineAccent: 'border-l-indigo-500/60'
    });
  }

  // Fallback for non-standard text
  if (slots.length === 0) {
    slots.push({
      period: 'Full Day',
      type: 'fullday',
      title: 'Daily Curated Activity',
      content: text,
      icon: Sparkles,
      badgeStyle: 'bg-[#35E6A1]/10 text-[#35E6A1] border-[#35E6A1]/30',
      iconBg: 'bg-[#35E6A1]/20 text-[#35E6A1] border-[#35E6A1]/40',
      lineAccent: 'border-l-[#35E6A1]/60'
    });
  }

  return slots;
};

export default function ItineraryCard({ itinerary = [], destination = '' }) {
  const [selectedDayTab, setSelectedDayTab] = useState('all');
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="bg-[#0B2426] rounded-3xl border border-[#214A47] p-8 text-center text-[#B9C9C6]">
        No day-by-day itinerary data available.
      </div>
    );
  }

  const handleCopyFull = () => {
    const text = itinerary
      .map((item, idx) => `Day ${item.day || idx + 1}: ${item.title ? item.title + '\n' : ''}${item.description}`)
      .join('\n\n-------------------------\n\n');
    navigator.clipboard.writeText(text);
    setCopiedIndex('full');
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyDay = (dayItem, idx) => {
    const text = `Day ${dayItem.day || idx + 1}: ${dayItem.title || ''}\n${dayItem.description}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const displayedItems = selectedDayTab === 'all'
    ? itinerary
    : itinerary.filter((item, idx) => (item.day || idx + 1) === Number(selectedDayTab));

  return (
    <div className="bg-[#0B2426] rounded-3xl border border-[#214A47] p-6 sm:p-8 shadow-2xl space-y-8">
      
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#214A47] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center text-[#35E6A1] shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Structured Day-by-Day Master Plan
            </h3>
            <p className="text-xs text-[#B9C9C6] mt-0.5 font-medium">
              Real-time landmark sequencing with morning, afternoon, and evening time slots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleCopyFull}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#071A1D] hover:bg-[#071A1D]/80 border border-[#214A47] text-xs font-bold text-[#B9C9C6] hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            {copiedIndex === 'full' ? (
              <>
                <Check className="w-4 h-4 text-[#35E6A1]" />
                <span className="text-[#35E6A1]">Full Plan Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#35E6A1]" />
                <span>Copy Entire Itinerary</span>
              </>
            )}
          </button>
          
          <span className="text-xs font-extrabold px-3.5 py-2 rounded-2xl bg-[#071A1D] border border-[#214A47] text-[#35E6A1]">
            {itinerary.length} Days Blueprint
          </span>
        </div>
      </div>

      {/* Interactive Filter Tabs for Days */}
      <div className="flex flex-wrap items-center gap-2.5 pb-2">
        <button
          onClick={() => setSelectedDayTab('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            selectedDayTab === 'all'
              ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] shadow-lg shadow-[#35E6A1]/20 scale-105 font-black'
              : 'bg-[#071A1D] text-[#B9C9C6] hover:text-white border border-[#214A47] hover:border-[#35E6A1]/40'
          }`}
        >
          All Days ({itinerary.length})
        </button>

        {itinerary.map((item, idx) => {
          const dNum = item.day || idx + 1;
          const isSelected = selectedDayTab === String(dNum);
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayTab(String(dNum))}
              className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] shadow-lg scale-105 font-black'
                  : 'bg-[#071A1D] text-[#B9C9C6] hover:text-white border border-[#214A47] hover:border-[#35E6A1]/40'
              }`}
            >
              Day {dNum}
            </button>
          );
        })}
      </div>

      {/* Structured Day-by-Day Timeline List */}
      <div className="space-y-8">
        {displayedItems.map((item, index) => {
          const dayNum = item.day || index + 1;
          const title = item.title || `Day ${dayNum}: Exploration & Discovery`;
          const description = item.description || (typeof item === 'string' ? item : '');
          const daySlots = parseDaySlots(description);
          
          // Image URL with fallback safety
          const primaryImg = getDayImageUrl(dayNum, destination);
          const fallbackImg = DAY_IMAGE_POOL[(dayNum - 1) % DAY_IMAGE_POOL.length];

          return (
            <div
              key={index}
              className="bg-[#071A1D] border border-[#214A47] rounded-3xl overflow-hidden shadow-xl hover:border-[#35E6A1]/60 transition-all duration-300 space-y-0 group"
            >
              {/* Day Header Banner with Photo & Day Badge */}
              <div className="relative min-h-[160px] sm:min-h-[190px] flex items-end p-6 sm:p-7 overflow-hidden border-b border-[#214A47]">
                {/* Background Image */}
                <img
                  src={primaryImg}
                  alt={`Day ${dayNum} - ${destination}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImg;
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071A1D] via-[#071A1D]/80 to-transparent"></div>

                {/* Day Header Overlay Content */}
                <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] flex items-center justify-center text-sm font-black shadow-lg shadow-[#35E6A1]/30 border border-[#4FFFC0] flex-shrink-0">
                      DAY {dayNum}
                    </div>
                    <div>
                      <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                        {title}
                      </h4>
                      {destination && (
                        <p className="text-xs text-[#35E6A1] font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{destination} • Real-Time Route</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleCopyDay(item, index)}
                      className="px-3 py-1.5 rounded-xl bg-[#0B2426]/90 hover:bg-[#0B2426] border border-[#214A47] text-[11px] font-bold text-[#B9C9C6] hover:text-white transition-all backdrop-blur-md cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-[#35E6A1]" />
                          <span className="text-[#35E6A1]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#35E6A1]" />
                          <span>Copy Day {dayNum}</span>
                        </>
                      )}
                    </button>
                    
                    <span className="text-[11px] font-extrabold text-[#35E6A1] bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Time Slots Grid (Morning, Afternoon, Evening) */}
              <div className="p-6 sm:p-7 space-y-4 bg-[#071A1D]">
                <div className="grid grid-cols-1 gap-4">
                  {daySlots.map((slot, sIdx) => {
                    const IconComponent = slot.icon;
                    return (
                      <div
                        key={sIdx}
                        className={`p-4 sm:p-5 rounded-2xl bg-[#0B2426] border border-[#214A47] hover:border-[#2a5b57] transition-all space-y-2.5 border-l-4 ${slot.lineAccent}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${slot.iconBg}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-extrabold text-white">
                              {slot.title}
                            </span>
                          </div>
                          
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-xl border ${slot.badgeStyle}`}>
                            {slot.period} Slot
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#B9C9C6] leading-relaxed font-normal pl-1 sm:pl-10">
                          {slot.content}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Badges */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#B9C9C6]/60 border-t border-[#214A47]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4FFFC0]" />
                    Optimized Pacing & Travel Duration
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#35E6A1]" />
                    Authentic Regional Dining Included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#4FFFC0]" />
                    Scenic Photo Spots Specified
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
