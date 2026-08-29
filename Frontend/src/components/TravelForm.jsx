import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Coins, Calendar, Users, Heart, ArrowRight, AlertCircle, Sparkles, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const AVAILABLE_INTERESTS = [
  { name: 'Nature', emoji: '🌲' },
  { name: 'Beaches', emoji: '🏖️' },
  { name: 'Mountains', emoji: '⛰️' },
  { name: 'Food', emoji: '🍛' },
  { name: 'Adventure', emoji: '🧗' },
  { name: 'Culture', emoji: '🎭' },
  { name: 'History', emoji: '🏛️' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Relaxation', emoji: '🧘' },
];

const PRESETS = [
  {
    label: '🏖️ Goa Coast',
    city: 'Hyderabad',
    budget: '18000',
    days: '4',
    travelers: '2',
    interests: ['Beaches', 'Food', 'Relaxation'],
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: '☕ Coorg Hills',
    city: 'Bengaluru',
    budget: '14000',
    days: '3',
    travelers: '2',
    interests: ['Nature', 'Food', 'Relaxation'],
    img: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: '🏔️ Manali Snow',
    city: 'Delhi',
    budget: '22000',
    days: '5',
    travelers: '2',
    interests: ['Mountains', 'Adventure', 'Nature'],
    img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: '🏛️ Jaipur Forts',
    city: 'Guntur',
    budget: '15000',
    days: '3',
    travelers: '2',
    interests: ['Culture', 'History', 'Shopping'],
    img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=200&q=80',
  },
];

export default function TravelForm({ onSubmit, isLoading, initialValues }) {
  const { currency, formatPrice, currencies } = useCurrency();

  const [formData, setFormData] = useState({
    starting_city: '',
    budget: '15000',
    days: '3',
    interests: ['Nature', 'Food'],
    travelers: '2',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues,
      }));
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const applyPreset = (preset) => {
    setFormData({
      starting_city: preset.city,
      budget: preset.budget,
      days: preset.days,
      travelers: preset.travelers,
      interests: preset.interests,
    });
    setErrors({});
  };

  const toggleInterest = (interestName) => {
    setFormData((prev) => {
      const isSelected = prev.interests.includes(interestName);
      const updated = isSelected
        ? prev.interests.filter((i) => i !== interestName)
        : [...prev.interests, interestName];
      return { ...prev, interests: updated };
    });

    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.starting_city.trim()) {
      newErrors.starting_city = 'Please enter your starting city.';
    }

    if (!formData.budget || Number(formData.budget) <= 0) {
      newErrors.budget = 'Please enter a valid trip budget.';
    }

    if (!formData.days || Number(formData.days) < 1 || Number(formData.days) > 30) {
      newErrors.days = 'Duration must be between 1 and 30 days.';
    }

    if (!formData.travelers || Number(formData.travelers) < 1) {
      newErrors.travelers = 'At least 1 traveler required.';
    }

    if (!formData.interests || formData.interests.length === 0) {
      newErrors.interests = 'Select at least one travel interest.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const budgetNum = Number(formData.budget) || 0;
  const daysNum = Math.max(1, Number(formData.days) || 1);
  const travelersNum = Math.max(1, Number(formData.travelers) || 1);
  const perPersonPerDay = Math.round(budgetNum / (daysNum * travelersNum));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Quick Fill Preset Pills with Thumbnail Photos */}
      <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-5 shadow-xl">
        <span className="text-[11px] font-bold text-[#B9C9C6] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#35E6A1]" />
          Quick 1-Click Starter Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              disabled={isLoading}
              className="relative overflow-hidden rounded-2xl border border-[#214A47] hover:border-[#35E6A1] p-2 text-left bg-[#071A1D] hover:bg-[#071A1D]/80 transition-all duration-200 hover:scale-[1.02] cursor-pointer group flex items-center gap-2.5"
            >
              <img
                src={preset.img}
                alt={preset.label}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=200&q=80';
                }}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-grow">
                <span className="block text-xs font-bold text-white group-hover:text-[#35E6A1] truncate">
                  {preset.label}
                </span>
                <span className="block text-[10px] text-[#B9C9C6]">
                  {formatPrice(preset.budget)} • {preset.days}D
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Source & Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Starting City / Source */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#35E6A1]" />
                Starting City / Source
              </span>
              <span className="text-xs text-[#B9C9C6] font-normal">Required</span>
            </label>
            <input
              type="text"
              name="starting_city"
              value={formData.starting_city}
              onChange={handleChange}
              placeholder="e.g. Hyderabad, Bengaluru, Guntur"
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-2xl bg-[#071A1D] border text-sm text-white placeholder-[#B9C9C6]/50 transition-all focus:outline-none focus:ring-2 ${
                errors.starting_city
                  ? 'border-red-500/60 focus:ring-red-500/20 bg-red-950/20'
                  : 'border-[#214A47] focus:border-[#35E6A1] focus:ring-[#35E6A1]/20'
              }`}
            />
            {errors.starting_city && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.starting_city}
              </p>
            )}
          </div>

          {/* Desired Destination (Optional) */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#4FFFC0]" />
                Target Destination
              </span>
              <span className="text-xs text-[#35E6A1] font-semibold">Optional</span>
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination || ''}
              onChange={handleChange}
              placeholder="e.g. Goa, Coorg, Manali (or leave blank for AI recommendation)"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl bg-[#071A1D] border border-[#214A47] text-sm text-white placeholder-[#B9C9C6]/50 transition-all focus:outline-none focus:border-[#4FFFC0] focus:ring-[#4FFFC0]/20"
            />
          </div>
        </div>

        {/* Total Budget (Dual Slider & Input) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#35E6A1]" />
              Total Trip Budget
            </label>
            <span className="text-sm font-extrabold text-[#35E6A1] bg-[#071A1D] px-3 py-0.5 rounded-lg border border-[#214A47]">
              {formatPrice(formData.budget || 0)}
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. 15000"
              min="2000"
              max="200000"
              step="500"
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-2xl bg-[#071A1D] border text-sm text-white placeholder-[#B9C9C6]/50 transition-all focus:outline-none focus:ring-2 ${
                errors.budget
                  ? 'border-red-500/60 focus:ring-red-500/20'
                  : 'border-[#214A47] focus:border-[#35E6A1] focus:ring-[#35E6A1]/20'
              }`}
            />
            {/* Range slider */}
            <input
              type="range"
              name="budget"
              min="5000"
              max="60000"
              step="1000"
              value={formData.budget || 15000}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-2 bg-[#071A1D] rounded-lg appearance-none cursor-pointer accent-[#35E6A1] border border-[#214A47]"
            />
          </div>
          {errors.budget && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.budget}
            </p>
          )}
        </div>

        {/* Days & Travelers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Days */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#35E6A1]" />
              Duration (Days)
            </label>
            <input
              type="number"
              name="days"
              value={formData.days}
              onChange={handleChange}
              min="1"
              max="30"
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-2xl bg-[#071A1D] border text-sm text-white transition-all focus:outline-none focus:ring-2 ${
                errors.days
                  ? 'border-red-500/60 focus:ring-red-500/20'
                  : 'border-[#214A47] focus:border-[#35E6A1] focus:ring-[#35E6A1]/20'
              }`}
            />
            {errors.days && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.days}
              </p>
            )}
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#35E6A1]" />
              Number of Travelers
            </label>
            <input
              type="number"
              name="travelers"
              value={formData.travelers}
              onChange={handleChange}
              min="1"
              max="20"
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-2xl bg-[#071A1D] border text-sm text-white transition-all focus:outline-none focus:ring-2 ${
                errors.travelers
                  ? 'border-red-500/60 focus:ring-red-500/20'
                  : 'border-[#214A47] focus:border-[#35E6A1] focus:ring-[#35E6A1]/20'
              }`}
            />
            {errors.travelers && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.travelers}
              </p>
            )}
          </div>
        </div>

        {/* Travel Interests (Interactive Multi-Select Pills) */}
        <div>
          <label className="block text-sm font-bold text-white mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#4FFFC0]" />
              Travel Interests & Vibes
            </span>
            <span className="text-xs text-[#B9C9C6] font-normal">
              {formData.interests.length} selected
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = formData.interests.includes(interest.name);
              return (
                <button
                  key={interest.name}
                  type="button"
                  onClick={() => toggleInterest(interest.name)}
                  disabled={isLoading}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] border-[#35E6A1] shadow-lg shadow-[#35E6A1]/25 scale-[1.02]'
                      : 'bg-[#071A1D] hover:bg-[#071A1D]/80 text-[#B9C9C6] border-[#214A47] hover:border-[#35E6A1]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{interest.emoji}</span>
                    <span>{interest.name}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#071A1D] font-black" />}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.interests}
            </p>
          )}
        </div>

        {/* Live Calculation Widget */}
        <div className="p-4 rounded-2xl bg-[#071A1D] border border-[#214A47] flex items-center justify-between text-xs text-[#B9C9C6]">
          <div>
            <span>Estimated Allocation: </span>
            <strong className="text-white font-bold">~{formatPrice(perPersonPerDay)}/person/day</strong>
          </div>
          <span className="text-[#35E6A1] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#35E6A1]"></span>
            Agent Ready
          </span>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] hover:from-[#4FFFC0] hover:to-[#35E6A1] text-[#071A1D] font-black text-base shadow-xl shadow-[#35E6A1]/30 transition-all duration-300 disabled:opacity-50 cursor-pointer animate-emerald-glow"
          >
            <Sparkles className="w-4 h-4 animate-spin text-[#071A1D]" />
            <span>Generate Travel Plan</span>
            <ArrowRight className="w-4 h-4 font-black" />
          </button>
        </div>
      </div>
    </form>
  );
}
