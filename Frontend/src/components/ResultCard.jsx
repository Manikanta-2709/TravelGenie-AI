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
  ShieldAlert
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DESTINATION_IMAGES = {
  coorg: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  munnar: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
  hampi: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
};

const INITIAL_PACKING_ITEMS = [
  { id: 1, text: 'Government ID proofs & Hotel booking confirmation vouchers', category: 'Essentials', checked: true },
  { id: 2, text: 'Comfortable walking shoes / breathable footwear', category: 'Clothing', checked: true },
  { id: 3, text: 'High-capacity power bank & USB-C fast charging cables', category: 'Gadgets', checked: false },
  { id: 4, text: 'Personal prescription medications & travel first-aid pouch', category: 'Health', checked: false },
  { id: 5, text: 'Climate gear (Sunscreen SPF 50 / Rain poncho / Light fleece)', category: 'Essentials', checked: false },
];

export default function ResultCard({ destination, budget, weather, tips }) {
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

  const destKey = Object.keys(DESTINATION_IMAGES).find(k => destination?.toLowerCase().includes(k)) || 'default';
  const heroImage = DESTINATION_IMAGES[destKey];

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
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] text-xs font-bold uppercase tracking-wider text-[#35E6A1]">
              <Compass className="w-3.5 h-3.5 text-[#4FFFC0]" />
              <span>Recommended Match</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {destination || 'Destination'}
            </h2>
            
            <p className="text-xs sm:text-sm text-[#B9C9C6] max-w-lg leading-relaxed drop-shadow">
              Synthesized by your 4 collaborative AI agents across budget, weather, and travel style.
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
