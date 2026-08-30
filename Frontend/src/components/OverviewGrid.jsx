import React from 'react';
import {
  Wallet,
  CloudSun,
  CalendarCheck,
  BrainCircuit,
  TrendingUp,
  Footprints,
  Navigation2,
} from 'lucide-react';

const CARD_BASE =
  'bg-[#0B2426] border border-[#214A47] rounded-2xl p-4 shadow-lg transition-all hover:border-[#35E6A1]/50 hover:-translate-y-0.5';

/**
 * Section 2 — Compact 2×2 / 4-column overview grid.
 * Budget, Weather, Best Travel Time, AI Trip Score in ~90px cards.
 */
export default function OverviewGrid({ overview, metrics }) {
  if (!overview) return null;

  const { budget, weather, best_travel_time, trip_score } = overview;
  const safeMetrics = metrics || {};

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 💰 Budget Summary */}
      <div className={CARD_BASE}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#B9C9C6]">
            Budget
          </span>
        </div>
        <p className="text-sm font-black text-white mt-2 truncate">
          {budget?.total || '₹—'}
        </p>
        <p className="text-[11px] text-[#B9C9C6] flex items-center gap-1 truncate">
          <TrendingUp className="w-3 h-3 text-amber-300 flex-shrink-0" />
          <span className="truncate">
            {budget?.daily_avg || '—'} · {budget?.breakdown?.travel ? 'Travel incl.' : 'per day'}
          </span>
        </p>
      </div>

      {/* 🌤️ Weather Summary */}
      <div className={CARD_BASE}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <CloudSun className="w-4 h-4 text-sky-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#B9C9C6]">
            Weather
          </span>
        </div>
        <p className="text-sm font-black text-white mt-2 truncate">
          {weather?.temp || '—'} · {weather?.condition || 'Pleasant'}
        </p>
        <p className="text-[11px] text-[#B9C9C6] truncate" title={weather?.advice}>
          {weather?.humidity ? `Humidity ${weather.humidity} · ` : ''}
          {weather?.advice || 'Ideal travel conditions'}
        </p>
      </div>

      {/* 📅 Best Travel Time */}
      <div className={CARD_BASE}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-violet-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#B9C9C6]">
            Best Travel Time
          </span>
        </div>
        <p className="text-sm font-black text-white mt-2 leading-snug line-clamp-2">
          {best_travel_time || 'All-day exploration'}
        </p>
        <p className="text-[11px] text-[#B9C9C6] flex items-center gap-1">
          <Navigation2 className="w-3 h-3 text-violet-300" />
          Optimal hours of the day
        </p>
      </div>

      {/* 🤖 AI Trip Score */}
      <div className={CARD_BASE}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#35E6A1]/15 border border-[#35E6A1]/40 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-[#35E6A1]" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#B9C9C6]">
            AI Trip Score
          </span>
        </div>
        <p className="text-sm font-black text-[#35E6A1] mt-2">
          {safeMetrics.ai_score ?? trip_score ?? '—'}/100
        </p>
        <p className="text-[11px] text-[#B9C9C6] flex items-center gap-1 truncate">
          <Footprints className="w-3 h-3 text-[#35E6A1] flex-shrink-0" />
          <span className="truncate">
            Route {safeMetrics.route_efficiency || '—'} · {safeMetrics.walking_km || '—'} walk
          </span>
        </p>
      </div>
    </div>
  );
}