import React from 'react';
import { MapPin, Calendar, Users, Wallet, CloudSun, ArrowRight, Star, Navigation } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80';

export default function TripHero({ hero, overview, route }) {
  if (!hero) return null;

  const stats = [
    { icon: Calendar, label: hero.duration, color: 'text-[#4FFFC0]' },
    { icon: Wallet, label: overview?.budget?.total || '—', color: 'text-amber-300' },
    { icon: CloudSun, label: overview?.weather?.temp || '—', color: 'text-sky-300' },
    { icon: Users, label: `${hero.travelers} Travelers`, color: 'text-violet-300' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#214A47] shadow-2xl h-[200px] sm:h-[220px] flex items-end">
      {/* Background Image */}
      <img
        src={hero.image_url || FALLBACK_IMAGE}
        alt={hero.destination}
        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071A1D] via-[#071A1D]/75 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Left */}
        <div className="space-y-1.5">
          {/* Route badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] text-[10px] font-bold uppercase tracking-wider text-[#35E6A1]">
            <MapPin className="w-3 h-3" />
            <span>{hero.origin}</span>
            <ArrowRight className="w-2.5 h-2.5 text-[#4FFFC0]" />
            <span className="text-[#4FFFC0]">{hero.destination}</span>
            {route?.distance_km && (
              <>
                <span className="text-[#B9C9C6]">•</span>
                <Navigation className="w-2.5 h-2.5 text-[#B9C9C6]" />
                <span className="text-white">{route.distance_km} km</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            {hero.destination}
          </h1>
          <p className="text-xs text-[#B9C9C6] max-w-md leading-relaxed drop-shadow">
            {hero.tagline}
          </p>
        </div>

        {/* Right: Stats row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-[11px] font-bold text-white whitespace-nowrap">{s.label}</span>
            </div>
          ))}

          {/* Trip Score */}
          <div className="bg-[#0B2426]/90 backdrop-blur-md border border-[#35E6A1]/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg animate-emerald-glow">
            <Star className="w-3.5 h-3.5 text-[#35E6A1]" />
            <span className="text-[11px] font-black text-[#35E6A1]">{hero.trip_score}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
