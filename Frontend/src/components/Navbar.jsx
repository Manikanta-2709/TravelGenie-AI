import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Sparkles, MessageCircle } from 'lucide-react';
import CurrencySwitcher from './CurrencySwitcher';

export default function Navbar({ onOpenContact }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-transparent backdrop-blur-md border-b border-[#214A47] sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] flex items-center justify-center text-[#071A1D] shadow-lg shadow-[#35E6A1]/20 transition-transform group-hover:scale-105">
            <Compass className="w-5 h-5 font-black" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4FFFC0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#35E6A1]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 font-black text-white text-xl tracking-tight">
              TravelGenie <span className="text-[#35E6A1] font-extrabold">AI</span>
            </div>
            <span className="text-[11px] text-[#B9C9C6] font-medium tracking-wide block -mt-0.5">
              Smart Travel Planner
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Currency Selector */}
          <CurrencySwitcher compact={true} />

          <Link
            to="/"
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              isActive('/')
                ? 'bg-[#0B2426] text-[#35E6A1] font-bold border border-[#214A47]'
                : 'text-[#B9C9C6] hover:text-white hover:bg-[#0B2426]/60'
            }`}
          >
            Home
          </Link>
          
          <Link
            to="/planner"
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md ${
              isActive('/planner')
                ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] shadow-[#35E6A1]/30 font-extrabold'
                : 'bg-[#0B2426] text-[#35E6A1] border border-[#214A47] hover:border-[#35E6A1]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#35E6A1]" />
            <span>Plan Trip</span>
          </Link>

          {/* Get in touch button */}
          <button
            onClick={onOpenContact}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-[#214A47] bg-[#0B2426] text-[#B9C9C6] hover:text-white hover:border-[#35E6A1] transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#35E6A1]" />
            <span>Get in touch</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
