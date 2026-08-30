import React from 'react';
import {
  Utensils,
  Gem,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Star,
  Sparkles,
} from 'lucide-react';

const PANELS = [
  {
    key: 'food',
    title: 'Must-Try Food',
    icon: Utensils,
    iconStyle: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
  },
  {
    key: 'hidden_gems',
    title: 'Hidden Gems',
    icon: Gem,
    iconStyle: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300',
  },
  {
    key: 'shopping',
    title: 'Shopping Areas',
    icon: ShoppingBag,
    iconStyle: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  },
  {
    key: 'safety_tips',
    title: 'Safety Tips',
    icon: ShieldCheck,
    iconStyle: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  },
];

/**
 * Section 5 — 2×2 grid of recommendation lists.
 */
export default function RecommendationsGrid({ recommendations }) {
  const rec = recommendations || {};

  const renderItems = (panel) => {
    const items = rec[panel.key] || [];

    if (panel.key === 'safety_tips') {
      return items.map((tip, i) => (
        <li key={i} className="flex items-start gap-1.5 py-1 border-b border-[#214A47]/40 last:border-0">
          <ShieldCheck className="w-3 h-3 text-rose-300 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] leading-relaxed text-[#B9C9C6]">{tip}</span>
        </li>
      ));
    }

    return items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 py-1.5 border-b border-[#214A47]/40 last:border-0">
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.maps_url ? (
              <a
                href={item.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Maps"
                className="text-[11px] font-bold text-white hover:text-[#35E6A1] underline-offset-2 hover:underline transition-colors"
              >
                {item.name}
              </a>
            ) : (
              <span className="text-[11px] font-bold text-white">{item.name}</span>
            )}
            {item.cuisine && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md border border-[#214A47] text-[#B9C9C6]">
                {item.cuisine}
              </span>
            )}
          </div>
          {(item.description || item.item) && (
            <p className="text-[10px] text-[#B9C9C6] leading-relaxed line-clamp-2">
              {item.description || item.item}
            </p>
          )}
          {item.cost && (
            <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1 mt-0.5">
              <span>{item.cost}</span>
              {item.rating && (
                <span className="flex items-center gap-0.5 text-[#B9C9C6]">
                  <Star className="w-2.5 h-2.5 text-amber-300" /> {item.rating}
                </span>
              )}
            </p>
          )}
        </div>
        {item.maps_url && (
          <a
            href={item.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#214A47] text-[#35E6A1] text-[9px] font-bold hover:bg-[#35E6A1] hover:text-[#071A1D] transition-colors"
          >
            <MapPin className="w-3 h-3" /> Map
          </a>
        )}
      </li>
    ));
  };

  return (
    <section className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-4 sm:p-5 shadow-2xl">
      {/* Section header */}
      <div className="flex items-center gap-3 border-b border-[#214A47] pb-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#35E6A1]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Local Recommendations</h3>
          <p className="text-[11px] text-[#B9C9C6]">
            Food, hidden gems, shopping & safety curated by local agents
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const items = rec[panel.key] || [];
          return (
            <div key={panel.key} className="rounded-2xl border border-[#214A47] bg-[#071A1D] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${panel.iconStyle}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                  {panel.title}
                </span>
                <span className="ml-auto text-[9px] font-bold text-[#B9C9C6] bg-[#0B2426] border border-[#214A47] px-1.5 py-0.5 rounded-md">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-[10px] text-[#B9C9C6]">No recommendations available.</p>
              ) : (
                <ul className="divide-y-0">{renderItems(panel)}</ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}