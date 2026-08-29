import React from 'react';
import AgentFlow from './AgentFlow';
import { Sparkles, Cpu } from 'lucide-react';

const STAGE_TITLES = [
  'Destination Agent: Finding Best Matches...',
  'Budget Agent: Allocating Costs & Reserves...',
  'Weather Agent: Checking Forecast Models...',
  'Itinerary Agent: Sequencing Daily Activities...',
];

export default function LoadingScreen({ currentStep = 0 }) {
  const currentStageText = STAGE_TITLES[currentStep] || 'Finalizing your travel plan...';
  const progressPercentage = Math.min(100, Math.round(((currentStep + 1) / 4) * 100));

  return (
    <div className="bg-[#0B2426] border border-[#214A47] rounded-3xl shadow-2xl p-6 sm:p-10 max-w-2xl mx-auto my-6 text-center relative overflow-hidden text-white">
      
      {/* Top ambient glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#35E6A1]/15 blur-[70px] rounded-full pointer-events-none"></div>

      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A1D] border border-[#214A47] text-[#35E6A1] text-xs font-semibold mb-4">
        <Cpu className="w-3.5 h-3.5 animate-spin text-[#4FFFC0]" />
        <span>Multi-Agent Swarm Active</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white mb-1.5">
        TravelGenie is Planning Your Trip
      </h2>
      <p className="text-xs sm:text-sm font-medium text-[#4FFFC0] mb-6 transition-all">
        {currentStageText}
      </p>

      {/* Animated Progress Bar in Emerald Gradient */}
      <div className="max-w-md mx-auto mb-8 space-y-1.5">
        <div className="flex justify-between text-[11px] font-bold text-[#B9C9C6]">
          <span>Agent Pipeline Progress</span>
          <span className="text-[#35E6A1]">{progressPercentage}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#071A1D] border border-[#214A47] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Agent Workflow Visualizer */}
      <div className="text-left">
        <AgentFlow currentStep={currentStep} />
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-[#B9C9C6]/60 mt-6">
        Agents communicate in real-time to guarantee budget precision and optimal itineraries.
      </p>
    </div>
  );
}
