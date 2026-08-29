import React from 'react';
import { MapPin, IndianRupee, CloudSun, CalendarCheck, Check, Loader2, Circle, Terminal } from 'lucide-react';

export const AGENT_STEPS = [
  {
    id: 'destination',
    name: 'Destination Agent',
    icon: MapPin,
    description: 'Finds a suitable destination based on travel preferences and interests.',
    thought: 'Filtering 40+ destinations matching interests and route feasibility...',
  },
  {
    id: 'budget',
    name: 'Budget Agent',
    icon: IndianRupee,
    description: 'Calculates estimated expenses and checks the trip against the available budget.',
    thought: 'Optimizing budget: Allocating stay (45%), food (30%), local travel (25%)...',
  },
  {
    id: 'weather',
    name: 'Weather Agent',
    icon: CloudSun,
    description: 'Analyzes seasonal forecasts and provides weather tips for the destination.',
    thought: 'Fetching regional weather models: Forecast 21°C, pleasant climate index...',
  },
  {
    id: 'itinerary',
    name: 'Itinerary Agent',
    icon: CalendarCheck,
    description: 'Creates the personalized day-by-day activity schedule and recommendations.',
    thought: 'Sequencing attractions and scenic spots into daily balanced clusters...',
  },
];

export default function AgentFlow({ currentStep = 0, isComplete = false }) {
  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5">
      {AGENT_STEPS.map((agent, index) => {
        const IconComponent = agent.icon;
        const isDone = isComplete || currentStep > index;
        const isActive = !isComplete && currentStep === index;
        const isPending = !isComplete && currentStep < index;

        return (
          <div
            key={agent.id}
            className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
              isActive
                ? 'bg-[#071A1D] border-[#35E6A1] shadow-lg shadow-[#35E6A1]/15 ring-1 ring-[#35E6A1]/40'
                : isDone
                ? 'bg-[#0B2426] border-[#214A47]'
                : 'bg-[#0B2426]/40 border-[#214A47]/60 opacity-40'
            }`}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {isDone && (
                <div className="w-7 h-7 rounded-full bg-[#35E6A1]/20 border border-[#35E6A1] text-[#35E6A1] flex items-center justify-center font-bold text-xs shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
              )}
              {isActive && (
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] flex items-center justify-center shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin font-black" />
                </div>
              )}
              {isPending && (
                <div className="w-7 h-7 rounded-full bg-[#071A1D] border border-[#214A47] text-[#B9C9C6]/60 flex items-center justify-center font-bold text-xs">
                  <Circle className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            {/* Agent Info & Live Thought Stream */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-sm font-bold ${isActive ? 'text-[#35E6A1]' : 'text-white'}`}>
                  {agent.name}
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {isDone && <span className="text-[#35E6A1] bg-[#071A1D] border border-[#214A47] px-2 py-0.5 rounded-full">Completed ✓</span>}
                  {isActive && <span className="text-[#071A1D] bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] font-black px-2 py-0.5 rounded-full animate-pulse">Running →</span>}
                  {isPending && <span className="text-[#B9C9C6]/60">Queued ○</span>}
                </span>
              </div>

              <p className="text-xs text-[#B9C9C6] mt-0.5 leading-relaxed">
                {agent.description}
              </p>

              {/* Active simulated thought bubble */}
              {isActive && (
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#071A1D] border border-[#35E6A1]/40 text-[11px] text-[#4FFFC0] flex items-center gap-2 shadow-sm">
                  <Terminal className="w-3.5 h-3.5 text-[#35E6A1] animate-pulse flex-shrink-0" />
                  <span className="font-mono truncate">{agent.thought}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
