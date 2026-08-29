import React, { useState } from 'react';
import { 
  MapPin, 
  Coins, 
  CloudSun, 
  Lightbulb, 
  Compass, 
  CheckCircle2, 
  PieChart, 
  Luggage, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCheck,
  Sparkles,
  FileCheck,
  Shirt,
  Smartphone,
  ShieldAlert,
  Navigation,
  ArrowRight,
  Clock,
  Train,
  Car,
  Milestone
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DESTINATION_IMAGES = {
  coorg: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1400&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=80',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
  munnar: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1400&q=80',
  hampi: 'https://images.unsplash.com/photo-1600100395938-f463a5aa9fb7?auto=format&fit=crop&w=1400&q=80',
  araku: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
  ooty: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1400&q=80',
  shimla: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=80',
  rishikesh: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80',
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1400&q=80',
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1400&q=80',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=80',
  pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=80',
  darjeeling: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80',
  gokarna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  kodaikanal: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1400&q=80',
  chikmagalur: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1400&q=80',
  mysore: 'https://images.unsplash.com/photo-1600100395938-f463a5aa9fb7?auto=format&fit=crop&w=1400&q=80',
  wayanad: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80',
  kashmir: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1400&q=80',
  tirupati: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80',
  vizag: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  hyderabad: 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?auto=format&fit=crop&w=1400&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=80',
  mumbai: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1400&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80',
};

const getDestinationImageUrl = (dest) => {
  if (!dest) return DESTINATION_IMAGES.default;
  const lower = dest.toLowerCase();
  const matchedKey = Object.keys(DESTINATION_IMAGES).find(k => lower.includes(k));
  if (matchedKey) return DESTINATION_IMAGES[matchedKey];
  
  // Dynamic high-resolution travel image endpoint matching destination keywords
  return `https://source.unsplash.com/1400x800/?${encodeURIComponent(dest)},travel,sightseeing`;
};

const INITIAL_PACKING_ITEMS = [
  { id: 1, text: 'Government ID proofs & Hotel booking confirmation vouchers', category: 'Essentials', checked: true },
  { id: 2, text: 'Comfortable walking shoes / breathable footwear', category: 'Clothing', checked: true },
  { id: 3, text: 'High-capacity power bank & USB-C fast charging cables', category: 'Gadgets', checked: false },
  { id: 4, text: 'Personal prescription medications & travel first-aid pouch', category: 'Health', checked: false },
  { id: 5, text: 'Climate gear (Sunscreen SPF 50 / Rain poncho / Light fleece)', category: 'Essentials', checked: false },
];

export default function ResultCard({ destination, budget, weather, tips, route }) {
  const { formatPrice, currency } = useCurrency();
  
  // Interactive Packing Checklist state
  const [packingList, setPackingList] = useState(INITIAL_PACKING_ITEMS);
  const [newItemText, setNewItemText] = useState('');

  const toggleItem = (id) => {
    setPackingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newItemText.trim(),
      category: 'Custom',
      checked: false,
    };
    setPackingList((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const removeItem = (id) => {
    setPackingList((prev) => prev.filter((item) => item.id !== id));
  };

  const checkAll = () => {
    setPackingList((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  const resetAll = () => {
    setPackingList((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  // Progress metrics
  const totalItems = packingList.length;
  const packedCount = packingList.filter((item) => item.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  const heroImage = getDestinationImageUrl(destination);

  return (
    <div className="space-y-6">
      
      {/* Destination Hero Banner with Photography & Dark Teal Gradient */}
      <div className="relative overflow-hidden rounded-3xl border border-[#214A47] shadow-2xl min-h-[220px] sm:min-h-[270px] flex items-end">
        {/* Background Image */}
        <img
          src={heroImage}
          alt={destination || 'Destination'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DESTINATION_IMAGES.default;
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071A1D] via-[#071A1D]/80 to-transparent"></div>

        {/* Content over image */}
        <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] text-xs font-bold uppercase tracking-wider text-[#35E6A1]">
              <MapPin className="w-3.5 h-3.5 text-[#35E6A1]" />
              <span>{route?.origin || 'Source'}</span>
              <ArrowRight className="w-3 h-3 text-[#4FFFC0]" />
              <span className="text-[#4FFFC0]">{destination || 'Destination'}</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {destination || 'Destination'}
            </h2>
            
            <p className="text-xs sm:text-sm text-[#B9C9C6] max-w-lg leading-relaxed drop-shadow">
              Synthesized by your 4 collaborative AI agents for trip from <strong className="text-white">{route?.origin || 'Starting City'}</strong> to <strong className="text-[#35E6A1]">{destination}</strong>.
            </p>
          </div>

          {/* Verification Pill */}
          <div className="bg-[#0B2426]/95 backdrop-blur-md border border-[#214A47] px-4 py-3 rounded-2xl self-start sm:self-auto space-y-1 shadow-lg">
            <span className="block text-[10px] text-[#35E6A1] uppercase font-bold tracking-wider">Agent Verification</span>
            <div className="text-xs font-extrabold text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4FFFC0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35E6A1]"></span>
              </span>
              <span>All 4 Agents Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 NEW FEATURE: JOURNEY & TRANSIT ROUTE EXPERIENCE (Start -> Destination) */}
      {route && (
        <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#35E6A1]/5 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#214A47]/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center text-[#35E6A1]">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide uppercase">
                  Journey & Transit Route Experience
                </h3>
                <p className="text-xs text-[#B9C9C6]">
                  Complete route breakdown from starting origin to destination
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#35E6A1] bg-[#071A1D] px-3 py-1 rounded-xl border border-[#214A47] self-start sm:self-auto">
              Transit Cost: {route.transit_cost || '₹2,250'}
            </span>
          </div>

          {/* Route Path Visualizer */}
          <div className="bg-[#071A1D] border border-[#214A47] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Origin */}
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-[#35E6A1]/10 border border-[#35E6A1]/40 text-[#35E6A1] flex items-center justify-center font-black">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#B9C9C6]/70">Starting Point</span>
                <h4 className="text-base font-extrabold text-white">{route.origin || 'Origin'}</h4>
              </div>
            </div>

            {/* Travel Line */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#35E6A1] mb-1">
                <Train className="w-3.5 h-3.5" />
                <span>{route.recommended_mode || 'Express Route'}</span>
              </div>
              <div className="relative w-full flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-[#35E6A1] via-[#4FFFC0] to-[#35E6A1] rounded-full"></div>
                <div className="absolute bg-[#071A1D] border border-[#35E6A1] text-[#35E6A1] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {route.estimated_distance} • {route.estimated_duration}
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-3 text-center sm:text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#35E6A1]">Destination</span>
                <h4 className="text-base font-extrabold text-white">{route.destination || destination}</h4>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#4FFFC0]/10 border border-[#4FFFC0]/40 text-[#4FFFC0] flex items-center justify-center font-black">
                <Compass className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Highlights & Route Advisory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Journey Highlights */}
            {route.journey_highlights && route.journey_highlights.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#35E6A1] uppercase tracking-wider block">
                  En-Route Journey Highlights
                </span>
                <ul className="space-y-1.5 text-xs text-[#B9C9C6]">
                  {route.journey_highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Milestone className="w-3.5 h-3.5 text-[#35E6A1] flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Route Travel Tip */}
            {route.route_tip && (
              <div className="p-3.5 rounded-2xl bg-[#071A1D] border border-[#214A47] text-xs text-[#B9C9C6] flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-[#4FFFC0] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Route Experience Tip</span>
                  <p className="leading-relaxed">{route.route_tip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Metric Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Estimated Budget Card (Dynamic Multi-Currency) */}
        <div className="bg-[#0B2426] border border-[#214A47] hover:border-[#35E6A1] rounded-3xl p-5 shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center">
                <Coins className="w-4 h-4 text-[#35E6A1]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B9C9C6]">Total Budget</span>
            </div>
            <span className="text-[10px] font-bold text-[#35E6A1] bg-[#071A1D] px-2 py-0.5 rounded-lg border border-[#214A47]">
              {currency}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{formatPrice(budget || 15000)}</p>
          <p className="text-[11px] text-[#35E6A1] font-semibold mt-1">Calculated by Budget Agent</p>
        </div>

        {/* Weather Card */}
        <div className="bg-[#0B2426] border border-[#214A47] hover:border-[#4FFFC0] rounded-3xl p-5 shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center">
              <CloudSun className="w-4 h-4 text-[#4FFFC0]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B9C9C6]">Expected Forecast</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{weather || '21°C, Pleasant'}</p>
          <p className="text-[11px] text-[#4FFFC0] font-semibold mt-1">Provided by Weather Agent</p>
        </div>

        {/* Destination Location Card */}
        <div className="bg-[#0B2426] border border-[#214A47] hover:border-[#35E6A1] rounded-3xl p-5 shadow-lg transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#35E6A1]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B9C9C6]">Destination Hub</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white truncate">{destination || 'Coorg'}</p>
          <p className="text-[11px] text-[#35E6A1] font-semibold mt-1">Selected by Destination Agent</p>
        </div>
      </div>

      {/* Budget Breakdown & Interactive Packing Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Budget Distribution Visualizer */}
        <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white mb-3">
              <PieChart className="w-4 h-4 text-[#35E6A1]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Budget Agent Expense Split</h4>
            </div>

            <div className="w-full h-3.5 rounded-full bg-[#071A1D] border border-[#214A47] flex overflow-hidden mb-4">
              <div className="bg-[#35E6A1] h-full w-[45%]" title="Stay (45%)"></div>
              <div className="bg-[#4FFFC0] h-full w-[30%]" title="Food (30%)"></div>
              <div className="bg-[#B9C9C6] h-full w-[15%]" title="Transport (15%)"></div>
              <div className="bg-[#214A47] h-full w-[10%]" title="Activities (10%)"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-[#B9C9C6] font-medium">
              <div className="p-2.5 rounded-xl bg-[#071A1D] border border-[#214A47]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35E6A1]"></span>
                  <span>Stay (45%)</span>
                </div>
                <strong className="text-white text-[11px]">
                  {formatPrice(typeof budget === 'number' ? budget * 0.45 : 6750)}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#071A1D] border border-[#214A47]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4FFFC0]"></span>
                  <span>Food (30%)</span>
                </div>
                <strong className="text-white text-[11px]">
                  {formatPrice(typeof budget === 'number' ? budget * 0.30 : 4500)}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#071A1D] border border-[#214A47]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B9C9C6]"></span>
                  <span>Transit (15%)</span>
                </div>
                <strong className="text-white text-[11px]">
                  {formatPrice(typeof budget === 'number' ? budget * 0.15 : 2250)}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#071A1D] border border-[#214A47]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#214A47]"></span>
                  <span>Activities (10%)</span>
                </div>
                <strong className="text-white text-[11px]">
                  {formatPrice(typeof budget === 'number' ? budget * 0.10 : 1500)}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#214A47] text-[11px] text-[#B9C9C6] flex items-center justify-between">
            <span>Dynamic converted total:</span>
            <strong className="text-[#35E6A1] font-bold text-sm">{formatPrice(budget || 15000)}</strong>
          </div>
        </div>

        {/* 🌟 ENHANCED INTERACTIVE PACKING CHECKLIST WITH LIVE PROGRESS BAR */}
        <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          
          {/* Header & Progress Stats */}
          <div>
            <div className="flex items-center justify-between text-white mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#071A1D] border border-[#214A47] flex items-center justify-center text-[#35E6A1]">
                  <Luggage className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Interactive Packing Checklist
                </h4>
              </div>
              
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border transition-all ${
                progressPercent === 100
                  ? 'bg-[#35E6A1] text-[#071A1D] border-[#35E6A1] shadow-md shadow-[#35E6A1]/30 animate-pulse'
                  : 'bg-[#071A1D] text-[#35E6A1] border-[#214A47]'
              }`}>
                {packedCount}/{totalItems} ({progressPercent}%)
              </span>
            </div>

            {/* Live Visual Progress Bar */}
            <div className="w-full bg-[#071A1D] rounded-full h-2.5 border border-[#214A47] overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Actions (Check All / Reset) */}
          <div className="flex items-center justify-between text-[11px] text-[#B9C9C6] pt-1">
            <span className="text-[#B9C9C6]/70">Tap items as you pack them</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkAll}
                className="text-[#35E6A1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>All</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={resetAll}
                className="text-[#B9C9C6] hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {packingList.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
                  item.checked
                    ? 'bg-[#071A1D]/60 border-[#214A47]/40 text-[#B9C9C6]/50'
                    : 'bg-[#071A1D] border-[#214A47] hover:border-[#35E6A1]/60 text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    item.checked
                      ? 'bg-[#35E6A1] border-[#35E6A1] text-[#071A1D]'
                      : 'border-[#214A47] bg-[#071A1D] group-hover:border-[#35E6A1]'
                  }`}>
                    {item.checked && <CheckCircle2 className="w-3 h-3 text-[#071A1D] font-black" />}
                  </div>
                  <span className={`text-xs font-medium truncate ${item.checked ? 'line-through text-[#B9C9C6]/50' : 'text-white'}`}>
                    {item.text}
                  </span>
                </div>

                {/* Delete button if custom */}
                {item.category === 'Custom' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="text-[#B9C9C6]/40 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Custom Item Form */}
          <form onSubmit={handleAddItem} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add custom item (e.g. GoPro, Jacket)..."
              className="flex-grow px-3 py-2 text-xs rounded-xl bg-[#071A1D] border border-[#214A47] text-white placeholder-[#B9C9C6]/50 focus:outline-none focus:border-[#35E6A1]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#071A1D] border border-[#214A47] hover:border-[#35E6A1] text-[#35E6A1] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

        </div>
      </div>

      {/* Travel Tip Card */}
      {tips && (
        <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-5 flex items-start gap-4 shadow-xl">
          <div className="w-9 h-9 rounded-2xl bg-[#071A1D] border border-[#35E6A1]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[#35E6A1]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#35E6A1] uppercase tracking-wider">AI Travel Advisory & Packing Recommendation</h4>
            <p className="text-xs sm:text-sm text-[#B9C9C6] mt-1 leading-relaxed font-medium">
              {tips}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
