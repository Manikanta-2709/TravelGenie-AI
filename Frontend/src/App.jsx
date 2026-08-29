import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import ContactModal from './components/ContactModal';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Results from './pages/Results';
import { Compass, Sparkles } from 'lucide-react';

function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <CurrencyProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#071A1D] text-white selection:bg-[#35E6A1] selection:text-[#071A1D]">
        {/* Sticky Top Glass Navbar with Get in Touch trigger */}
        <Navbar onOpenContact={() => setIsContactOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home onOpenContact={() => setIsContactOpen(true)} />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/results" element={<Results />} />
            {/* Fallback route */}
            <Route path="*" element={<Home onOpenContact={() => setIsContactOpen(true)} />} />
          </Routes>
        </main>

        {/* Contact Modal */}
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

        {/* Professional Clean Dark Teal Footer */}
        <footer className="bg-[#071A1D] border-t border-[#214A47] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B9C9C6]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#35E6A1] to-[#4FFFC0] flex items-center justify-center text-[#071A1D] shadow-sm font-black">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">TravelGenie AI</span>
              <span>— Smart Travel Planner</span>
            </div>
            <div className="flex items-center gap-4 text-[#B9C9C6] font-medium">
              <button
                onClick={() => setIsContactOpen(true)}
                className="text-[#35E6A1] hover:underline font-bold cursor-pointer"
              >
                Get in Touch
              </button>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#35E6A1]" /> Powered by 4 AI Agents
              </span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </CurrencyProvider>
  );
}

export default App;
