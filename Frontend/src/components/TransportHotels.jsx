import React from 'react';
import {
  Train,
  Plane,
  Bus,
  Car,
  Navigation,
  ExternalLink,
  MapPin,
  Star,
  Building2,
  Clock,
  Coins,
  ChevronRight,
} from 'lucide-react';

const MODE_ICONS = {
  train: Train,
  flight: Plane,
  plane: Plane,
  bus: Bus,
  drive: Car,
  car: Car,
};

const MODE_STYLES = {
  train: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  flight: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
  plane: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
  bus: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  drive: 'bg-[#35E6A1]/15 border-[#35E6A1]/30 text-[#35E6A1]',
  car: 'bg-[#35E6A1]/15 border-[#35E6A1]/30 text-[#35E6A1]',
};

const BTN_BASE =
  'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors flex-shrink-0';

/**
 * Section 3 — Two-column Transport rows + Hotel cards.
 */
export default function TransportHotels({ route, transport = [], hotels = [] }) {
  const distanceLabel =
    route?.estimated_distance ||
    (route?.distance_km ? `${route.distance_km} km` : 'Real distance');

  return (
    <section className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-4 sm:p-5 shadow-2xl">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#214A47] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-[#35E6A1]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#35E6A1] uppercase tracking-wider">
                Transport & Stays
              </span>
            </div>
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>{route?.origin || 'Origin'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#4FFFC0]" />
              <span>{route?.destination || 'Destination'}</span>
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#071A1D] border border-[#214A47] px-3 py-1.5 rounded-xl text-xs font-black text-[#35E6A1] shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-[#4FFFC0]" />
          {distanceLabel}
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* LEFT — Transport option rows */}
        <div className="lg:col-span-2 space-y-2">
          <span className="text-[11px] font-bold text-[#35E6A1] uppercase tracking-wider">
            Getting There
          </span>
          {transport.length === 0 && (
            <p className="text-xs text-[#B9C9C6]">No transport options available.</p>
          )}
{transport.map((t, i) => {
            const Icon = MODE_ICONS[t.mode] || Train;
            const style = MODE_STYLES[t.mode] || MODE_STYLES.train;
            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#071A1D] border border-[#214A47] hover:border-[#35E6A1]/60 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${style}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">
                      {t.title || (t.mode || 'Travel').toUpperCase()}
                    </p>
                    <p className="text-[10px] text-[#B9C9C6] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{t.duration || 'Duration —'}</span>
                    </p>
                  </div>
                  {t.recommended && (
                    <span className="text-[9px] font-black text-[#071A1D] bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] px-1.5 py-0.5 rounded-md flex-shrink-0">
                      BEST
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 truncate">
                    <Coins className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{t.fare || 'Fare —'}</span>
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {t.booking_url && (
                      <a
                        href={t.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${BTN_BASE} bg-[#35E6A1] text-[#071A1D] hover:opacity-90`}
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Book
                      </a>
                    )}
                    {t.maps_url && (
                      <a
                        href={t.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${BTN_BASE} bg-[#0B2426] border border-[#214A47] text-[#B9C9C6] hover:border-[#35E6A1]/60 hover:text-white`}
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#35E6A1]" /> Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Hotel cards */}
        <div className="lg:col-span-3">
          <span className="text-[11px] font-bold text-[#35E6A1] uppercase tracking-wider inline-block mb-2">
            Where To Stay
          </span>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {hotels.length === 0 && (
              <p className="text-xs text-[#B9C9C6]">No hotel recommendations available.</p>
            )}
{hotels.slice(0, 3).map((h, i) => (
              <div
                key={i}
                className="flex flex-col p-3 rounded-2xl bg-[#071A1D] border border-[#214A47] hover:border-[#35E6A1]/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-white leading-snug line-clamp-1">
                      {h.name}
                    </p>
                    {h.address && (
                      <p className="text-[9px] text-[#B9C9C6] truncate mt-0.5">{h.address}</p>
                    )}
                  </div>
                  <Building2 className="w-3.5 h-3.5 text-[#35E6A1] flex-shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] font-bold flex items-center gap-1 text-amber-300">
                    <Star className="w-3 h-3" /> {h.rating || '—'}
                  </span>
                  <span className="text-[11px] font-black text-[#35E6A1] truncate pl-1">
                    {h.price || h.price_per_night || '—'}
                  </span>
                </div>

                {h.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {h.amenities.slice(0, 3).map((a, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[9px] border border-[#214A47] bg-[#0B2426] px-1.5 py-0.5 rounded-md text-[#B9C9C6]"
                      >
                        {a}
                      </span>
                    ))}
                    {h.amenities.length > 3 && (
                      <span className="text-[9px] font-bold text-[#35E6A1] px-1">
                        +{h.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#214A47]/60">
                  {h.booking_url && (
                    <a
                      href={h.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${BTN_BASE} flex-1 bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] font-black hover:opacity-90`}
                    >
                      Book <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {h.maps_url && (
                    <a
                      href={h.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${BTN_BASE} bg-[#0B2426] border border-[#214A47] text-[#B9C9C6] hover:border-[#35E6A1]/60 hover:text-white`}
                    >
                      <MapPin className="w-2.5 h-2.5 text-[#35E6A1]" /> Map
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}