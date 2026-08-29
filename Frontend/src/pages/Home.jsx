import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Wallet, CloudSun, Calendar, ArrowRight, Sparkles, ChevronRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { AGENT_STEPS } from '../components/AgentFlow';
import { useCurrency } from '../context/CurrencyContext';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Smart Destinations',
    bg: 'bg-[#35E6A1]/20 text-[#35E6A1] border border-[#35E6A1]/40',
  },
  {
    icon: Wallet,
    title: 'Budget Planning',
    bg: 'bg-[#4FFFC0]/20 text-[#4FFFC0] border border-[#4FFFC0]/40',
  },
  {
    icon: CloudSun,
    title: 'Live Weather',
    bg: 'bg-[#35E6A1]/20 text-[#35E6A1] border border-[#35E6A1]/40',
  },
  {
    icon: Calendar,
    title: 'AI Powered Itineraries',
    bg: 'bg-[#4FFFC0]/20 text-[#4FFFC0] border border-[#4FFFC0]/40',
  },
];

const CURATED_CATEGORIES = [
  {
    id: 1,
    badge: '1',
    title: 'Beach Destinations',
    tag: 'Coastal & Relaxation',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    description: 'Imagine strolling on pristine beaches, listening to rhythmic waves, and relishing coastal delicacies. Plan a tranquil beach getaway with water sports and scenic sunsets.',
    preset: {
      starting_city: 'Hyderabad',
      budget: '18000',
      days: '4',
      interests: ['Beaches', 'Food', 'Relaxation'],
      travelers: '2',
    },
  },
  {
    id: 2,
    badge: '2',
    title: 'Hills & Mountains',
    tag: 'Alpine & Nature Retreats',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    description: 'Answer the call of the mountains with specially curated misty hill stations and lofty peaks. Treat the nature lover in you to hidden valleys and panoramic summits.',
    preset: {
      starting_city: 'Bengaluru',
      budget: '14000',
      days: '3',
      interests: ['Mountains', 'Nature', 'Adventure'],
      travelers: '2',
    },
  },
  {
    id: 3,
    badge: '3',
    title: 'Heritage & Forts',
    tag: 'Culture & Architecture',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    description: 'Step into royal palaces, historic forts, and ancient temple ruins. Discover rich folklore, vibrant street bazaars, and traditional authentic regional food.',
    preset: {
      starting_city: 'Guntur',
      budget: '15000',
      days: '3',
      interests: ['Culture', 'History', 'Shopping'],
      travelers: '2',
    },
  },
  {
    id: 4,
    badge: '4',
    title: 'Forest & Wildlife Trails',
    tag: 'Safari & Wilderness',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    description: 'Escape into dense rainforests, wildlife reserves, and serene plantation estates. Experience eco-tours, bird watching, and unpolluted starry night skies.',
    preset: {
      starting_city: 'Chennai',
      budget: '16000',
      days: '3',
      interests: ['Nature', 'Adventure', 'Relaxation'],
      travelers: '2',
    },
  },
];

export default function Home({ onOpenContact }) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [selectedAgentTab, setSelectedAgentTab] = useState(0);

  const launchPreset = (preset) => {
    navigate('/planner', {
      state: { preset }
    });
  };

  return (
    <div className="min-h-screen bg-[#071A1D] text-white overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* HERO SECTION — MOUNTAIN LAKE BACKGROUND WITH DARK TEAL LUXURY THEME       */}
      {/* ========================================================================= */}
      <section className="relative min-h-[660px] sm:min-h-[740px] lg:min-h-[800px] flex items-center overflow-hidden border-b border-[#214A47]">
        
        {/* Background Image: Mountain lake with airplane, luggage & signposts */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="TravelGenie AI Scenic Travel Landscape"
            className="w-full h-full object-cover object-right sm:object-center"
          />
          {/* Dark luxury overlay matching #071A1D and #0B2426 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071A1D] via-[#071A1D]/85 to-[#071A1D]/40 lg:via-[#071A1D]/75"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#071A1D] via-transparent to-transparent"></div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
          <div className="max-w-2xl space-y-6">
            
            {/* Main Brand Title with Emerald Sparkle */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight flex items-center gap-2">
                <span>TravelGenie</span>
                <span className="text-[#35E6A1] relative">
                  AI
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#4FFFC0] absolute -top-3 -right-6 animate-pulse" />
                </span>
              </h1>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#B9C9C6] tracking-tight">
                Your Smart Travel Planner
              </h2>
            </div>

            {/* Description Text */}
            <p className="text-sm sm:text-base lg:text-lg text-[#B9C9C6] max-w-lg leading-relaxed font-normal">
              Plan personalized trips, get real-time weather, budget estimates and perfect itineraries – all in one place.
            </p>

            {/* 4 Feature Badges in a Row (Dark Teal Glass Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {FEATURES.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[#0B2426]/90 backdrop-blur-md border border-[#214A47] hover:border-[#35E6A1] rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-white leading-tight">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action CTA & Cursive Script Tag */}
            <div className="pt-3 space-y-4">
              <Link
                to="/planner"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] hover:from-[#4FFFC0] hover:to-[#35E6A1] text-[#071A1D] font-black text-base shadow-xl shadow-[#35E6A1]/30 transition-all duration-300 hover:scale-105 cursor-pointer animate-emerald-glow"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-5 h-5 font-black" />
              </Link>

              {/* Handwriting Script text in Emerald */}
              <p className="font-script text-2xl sm:text-3xl text-[#35E6A1] font-bold tracking-wide">
                Let's make your next trip unforgettable!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CURATED TRAVEL IDEAS (Dark Teal & Emerald Category Cards)              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#214A47] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#35E6A1] bg-[#0B2426] border border-[#214A47] px-3 py-1 rounded-full">
              Curated Holiday Ideas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              Explore by Travel Categories
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#B9C9C6] max-w-sm">
            Select a travel mood to automatically pre-configure the AI trip planner
          </p>
        </div>

        {/* 4 MakeMyTrip styled category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CURATED_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="bg-[#0B2426] border border-[#214A47] hover:border-[#35E6A1] rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-lg group"
            >
              {/* Card Photo Top */}
              <div className="p-4 pb-0">
                <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-[#214A47]">
                  <img
                    src={category.image}
                    alt={category.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute bottom-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-[#071A1D]/90 text-[#4FFFC0] border border-[#214A47] backdrop-blur-md">
                    {category.tag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] flex items-center justify-center text-sm font-black shadow-md">
                      {category.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#35E6A1] transition-colors">
                      {category.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#B9C9C6] leading-relaxed font-normal">
                    {category.description}
                  </p>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-4 flex items-center justify-between border-t border-[#214A47]">
                  <span className="text-xs text-[#B9C9C6] font-semibold">
                    Est. from {formatPrice(category.preset.budget)}
                  </span>

                  <button
                    onClick={() => launchPreset(category.preset)}
                    className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#35E6A1] hover:text-[#4FFFC0] group-hover:translate-x-1 transition-all flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-[#071A1D]"
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MULTI-AGENT COLLABORATION PIPELINE                                     */}
      {/* ========================================================================= */}
      <section className="bg-[#0B2426] border-y border-[#214A47] text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#35E6A1]">
              Autonomous Intelligence
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              How the 4 Collaborative Agents Work
            </h2>
            <p className="text-xs sm:text-sm text-[#B9C9C6]">
              Each specialized agent solves one critical dimension of your trip.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENT_STEPS.map((agent, index) => {
              const Icon = agent.icon;
              const isSelected = selectedAgentTab === index;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentTab(index)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#071A1D] border-[#35E6A1] shadow-xl shadow-[#35E6A1]/10 scale-[1.02]'
                      : 'bg-[#071A1D]/60 border-[#214A47] hover:bg-[#071A1D]/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] font-black' : 'bg-[#0B2426] text-[#B9C9C6]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#B9C9C6]/60">0{index + 1}</span>
                  </div>
                  <h4 className={`text-base font-bold ${isSelected ? 'text-[#35E6A1]' : 'text-white'}`}>
                    {agent.name}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Active Agent Detail Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#071A1D] border border-[#214A47] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#35E6A1] animate-pulse"></span>
                <h3 className="text-lg font-bold text-white">
                  {AGENT_STEPS[selectedAgentTab].name}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#B9C9C6] max-w-2xl leading-relaxed">
                {AGENT_STEPS[selectedAgentTab].description}
              </p>
            </div>

            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] text-sm font-black shadow-lg shadow-[#35E6A1]/20 transition-all whitespace-nowrap"
            >
              <span>Run Agent Pipeline</span>
              <ArrowRight className="w-4 h-4 font-black" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GET IN TOUCH CALLOUT SECTION                                           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-[#0B2426] border border-[#214A47] p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Need custom travel assistance?
            </h3>
            <p className="text-sm sm:text-base text-[#B9C9C6] max-w-lg">
              Have questions about how TravelGenie AI plans trips or want to collaborate? Get in touch with our team.
            </p>
          </div>
          <button
            onClick={onOpenContact}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] hover:from-[#4FFFC0] hover:to-[#35E6A1] text-[#071A1D] font-black text-sm sm:text-base shadow-lg shadow-[#35E6A1]/25 transition-all hover:scale-105 cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5 font-black" />
            <span>Get in Touch</span>
          </button>
        </div>
      </section>

    </div>
  );
}
