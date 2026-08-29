import React, { useState } from 'react';
import { Calendar, CheckCircle2, Copy, Check, Clock, MapPin } from 'lucide-react';

const DAY_IMAGES = [
  'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?auto=format&fit=crop&w=400&q=80',
];

export default function ItineraryCard({ itinerary = [] }) {
  const [selectedDayTab, setSelectedDayTab] = useState('all');
  const [copied, setCopied] = useState(false);

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="bg-[#0B2426] rounded-3xl border border-[#214A47] p-8 text-center text-[#B9C9C6]">
        No day-by-day itinerary data available.
      </div>
    );
  }

  const handleCopy = () => {
    const text = itinerary
      .map((item, idx) => `Day ${item.day || idx + 1}: ${item.title ? item.title + ' - ' : ''}${item.description}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayedItems = selectedDayTab === 'all'
    ? itinerary
    : itinerary.filter((item, idx) => (item.day || idx + 1) === Number(selectedDayTab));

  return (
    <div className="bg-[#0B2426] rounded-3xl border border-[#214A47] p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header with Title, Copy Action, and Day Count Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#214A47] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center text-[#35E6A1] shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Day-by-Day Travel Schedule
            </h3>
            <span className="text-xs text-[#B9C9C6]">
              Curated and sequenced by Itinerary Agent for stress-free travel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#071A1D] hover:bg-[#071A1D]/80 border border-[#214A47] text-xs font-bold text-[#B9C9C6] hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#35E6A1]" />
                <span className="text-[#35E6A1]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#35E6A1]" />
                <span>Copy Itinerary</span>
              </>
            )}
          </button>
          
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-[#071A1D] border border-[#214A47] text-[#35E6A1]">
            {itinerary.length} Days Plan
          </span>
        </div>
      </div>

      {/* Interactive Day Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setSelectedDayTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedDayTab === 'all'
              ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] shadow-md shadow-[#35E6A1]/20 scale-105 font-black'
              : 'bg-[#071A1D] text-[#B9C9C6] hover:text-white border border-[#214A47]'
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] shadow-md scale-105 font-black'
                  : 'bg-[#071A1D] text-[#B9C9C6] hover:text-white border border-[#214A47]'
              }`}
            >
              Day {dNum}
            </button>
          );
        })}
      </div>

      {/* Timeline Items */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 sm:before:left-5 before:h-full before:w-0.5 before:bg-[#214A47]">
        {displayedItems.map((item, index) => {
          const dayNum = item.day || index + 1;
          const title = item.title || `Day ${dayNum}`;
          const description = item.description || (typeof item === 'string' ? item : '');
          const thumbnail = DAY_IMAGES[(dayNum - 1) % DAY_IMAGES.length];

          return (
            <div key={index} className="relative flex items-start gap-4 sm:gap-5 group">
              {/* Day Number Badge */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] flex items-center justify-center text-xs font-black shadow-md shadow-[#35E6A1]/25 flex-shrink-0 z-10 ring-4 ring-[#0B2426] group-hover:scale-110 transition-transform">
                D{dayNum}
              </div>

              {/* Card Body */}
              <div className="flex-grow bg-[#071A1D] group-hover:bg-[#071A1D]/90 border border-[#214A47] group-hover:border-[#35E6A1] rounded-3xl p-5 sm:p-6 transition-all duration-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#35E6A1] transition-colors">
                    {title}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#35E6A1] bg-[#0B2426] border border-[#214A47] px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Agent Verified
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
                  <img
                    src={thumbnail}
                    alt={`Day ${dayNum}`}
                    className="w-full sm:w-28 h-20 rounded-xl object-cover flex-shrink-0 border border-[#214A47]"
                  />
                  <p className="text-xs sm:text-sm text-[#B9C9C6] leading-relaxed font-normal flex-grow">
                    {description}
                  </p>
                </div>

                {/* Sub-schedule hints */}
                <div className="pt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#B9C9C6]/60 border-t border-[#214A47]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4FFFC0]" /> Morning • Afternoon • Evening slots
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#35E6A1]" /> Minimized transit route
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
