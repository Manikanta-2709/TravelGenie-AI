import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TravelForm from '../components/TravelForm';
import LoadingScreen from '../components/LoadingScreen';
import { planTrip } from '../services/api';
import { AlertCircle, Compass, Sparkles } from 'lucide-react';

export default function Planner() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPreset = location.state?.preset;

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setErrorMessage('');
    setCurrentStep(0);

    // Simulate realistic agent pipeline step progression during loading
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 850);

    try {
      const response = await planTrip(formData);

      clearInterval(stepInterval);
      setCurrentStep(3);

      // Brief delay to show completion transition
      setTimeout(() => {
        setIsLoading(false);
        if (response && response.success && response.data) {
          navigate('/results', {
            state: {
              tripData: response.data,
              formData,
              isMock: response.isMock || false,
              warning: response.warning || '',
            },
          });
        } else {
          setErrorMessage('Unable to generate your travel plan. Please check your inputs and try again.');
        }
      }, 500);
    } catch (error) {
      clearInterval(stepInterval);
      setIsLoading(false);
      setErrorMessage('Unable to generate your travel plan. Please try again in a few moments.');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#071A1D] text-white py-10 sm:py-16 overflow-hidden">

      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[300px] bg-[#35E6A1]/10 blur-[140px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        {!isLoading && (
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0B2426] border border-[#214A47] text-[#35E6A1] text-xs font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>Step 1: Define Your Trip Requirements</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Design Your Personalized Itinerary
            </h1>
            <p className="text-xs sm:text-sm text-[#B9C9C6] max-w-lg mx-auto leading-relaxed font-medium">
              Enter your starting point, total budget, duration, and interests. Our collaborative AI agents will take care of the rest.
            </p>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="flex-grow">
              <h4 className="text-sm font-bold text-red-200">Trip Planning Failed</h4>
              <p className="text-xs text-red-300/80 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs font-semibold px-2.5 py-1 bg-red-900/60 rounded-lg border border-red-700 hover:bg-red-900 text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Conditional Rendering: Loading Agent Flow vs Form */}
        {isLoading ? (
          <LoadingScreen currentStep={currentStep} />
        ) : (
          <div className="max-w-2xl mx-auto">
            <TravelForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              initialValues={initialPreset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
