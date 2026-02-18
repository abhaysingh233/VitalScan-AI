
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ChevronRight, X, Sparkles, ScanEye, BrainCircuit, Activity } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    targetId: null,
    title: "Welcome to VitalScan AI",
    description: "Your advanced personal health intelligence unit. This system provides medical analysis, visual scanning, and local care recommendations.",
    icon: <Sparkles className="text-sky-400" size={32} />
  },
  {
    targetId: 'tour-bio-scanner',
    title: "Bio-Scanner Interface",
    description: "Interactive anatomical map. Select specific body regions to access detailed medical data, preventive care tips, and common issues.",
    icon: <Activity className="text-emerald-400" size={32} />
  },
  {
    targetId: 'tour-inference-engine',
    title: "ML Inference Engine",
    description: "Describe your symptoms via text or voice. Our AI analyzes inputs to suggest potential conditions and immediate actions.",
    icon: <BrainCircuit className="text-rose-400" size={32} />
  },
  {
    targetId: 'tour-navigation',
    title: "Multimodal Tools",
    description: "Switch modes here. Access the Optical Scanner for image analysis, Health Intelligence chat, or find nearby Specialists.",
    icon: <ScanEye className="text-indigo-400" size={32} />
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  useLayoutEffect(() => {
    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const r = el.getBoundingClientRect();
          setRect(r);
        }
      } else {
        setRect(null);
      }
    };

    // Small delay to allow UI to settle/scroll
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [stepIndex, currentStep.targetId]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden no-print">
      {/* Background Dimmer & Spotlight */}
      <div 
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          background: rect 
            ? 'transparent' 
            : 'rgba(15, 23, 42, 0.8)', // Dark background for steps without target
        }}
      >
        {rect && (
          <div 
            className="absolute transition-all duration-500 ease-in-out border-2 border-sky-500 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.3)] box-content"
            style={{
              top: rect.top - 10,
              left: rect.left - 10,
              width: rect.width + 20,
              height: rect.height + 20,
              // The massive box-shadow creates the cutout effect
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85)' 
            }}
          >
            {/* Pulsing Corner Markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />
          </div>
        )}
      </div>

      {/* Info Card */}
      <div 
        className="absolute w-full max-w-sm px-4 transition-all duration-500 ease-out z-50 flex justify-center"
        style={{
          top: rect 
            ? Math.min(window.innerHeight - 300, Math.max(20, rect.bottom + 40)) 
            : '50%',
          left: rect 
            ? Math.min(window.innerWidth - 320, Math.max(20, rect.left + (rect.width / 2) - 192)) // Center relative to target, clamp to screen
            : '50%',
          transform: rect ? 'none' : 'translate(-50%, -50%)',
          position: 'absolute'
        }}
      >
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 w-full animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner">
              {currentStep.icon}
            </div>
            <button 
              onClick={onComplete}
              className="text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {currentStep.title}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                  }`} 
                />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white transition-all shadow-lg active:scale-95"
            >
              {isLastStep ? 'Initialize System' : 'Next'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
