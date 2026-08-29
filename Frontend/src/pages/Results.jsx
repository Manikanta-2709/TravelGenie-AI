import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ResultCard from '../components/ResultCard';
import ItineraryCard from '../components/ItineraryCard';
import { Sparkles, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const tripData = location.state?.tripData;
  const formData = location.state?.formData;
  const isMock = location.state?.isMock;
  const warning = location.state?.warning;

  if (!tripData) {
    return (
      <div className="min-h-screen bg-[#071A1D] text-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#0B2426] border border-[#214A47] rounded-3xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#071A1D] border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">No Active Travel Plan</h2>
          <p className="text-xs sm:text-sm text-[#B9C9C6]">
            You haven't generated a plan yet. Enter your trip preferences in our multi-agent planner.
          </p>
          <Link
            to="/planner"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] font-black text-sm shadow-lg shadow-[#35E6A1]/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4 font-black" />
            <span>Launch Trip Planner</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071A1D] text-white py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Top Banner Notice for local offline demo if applicable */}
        {isMock && (
          <div className="p-3.5 rounded-2xl bg-[#0B2426] border border-[#214A47] text-[#B9C9C6] text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#35E6A1] animate-ping"></span>
              <span className="font-semibold text-white">
                Demo Mode: Displaying plan synthesized by local multi-agent simulator.
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#35E6A1] bg-[#071A1D] px-2.5 py-0.5 rounded-lg border border-[#214A47]">
              Frontend Ready
            </span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#214A47] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B2426] border border-[#214A47] text-[#35E6A1] text-xs font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-Agent Synthesis Complete</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Personalized Travel Blueprint
            </h1>
            {formData && (
              <p className="text-xs text-[#B9C9C6] mt-1 font-medium">
                Origin: <strong className="text-white">{formData.starting_city}</strong> •{' '}
                Duration: <strong className="text-white">{formData.days} Days</strong> •{' '}
                Travelers: <strong className="text-white">{formData.travelers}</strong>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => navigate('/planner')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#214A47] bg-[#0B2426] hover:bg-[#071A1D] text-[#B9C9C6] hover:text-white font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#35E6A1]" />
              <span>Plan Another Trip</span>
            </button>
          </div>
        </div>

        {/* Main Results Component (Destination, Budget, Weather, Tips, Packing Checklist) */}
        <ResultCard
          destination={tripData.destination}
          budget={tripData.budget}
          weather={tripData.weather}
          tips={tripData.tips}
          route={tripData.route}
        />

        {/* Day-by-Day Itinerary Component with interactive day tabs */}
        <ItineraryCard itinerary={tripData.itinerary} destination={tripData.destination} />

        {/* Bottom CTA */}
        <div className="pt-6 text-center border-t border-[#214A47]">
          <button
            onClick={() => navigate('/planner')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] hover:from-[#4FFFC0] hover:to-[#35E6A1] text-[#071A1D] font-black text-sm sm:text-base shadow-xl shadow-[#35E6A1]/25 transition-all hover:-translate-y-0.5 cursor-pointer animate-emerald-glow"
          >
            <RefreshCw className="w-4 h-4 font-black" />
            <span>Generate Another Custom Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
