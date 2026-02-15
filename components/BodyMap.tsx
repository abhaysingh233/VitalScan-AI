
import React from 'react';
import { BodyView } from '../types';

interface BodyMapProps {
  view: BodyView;
  selectedPart: string | null;
  onPartClick: (part: string) => void;
  isScanning?: boolean;
}

const BodyMap: React.FC<BodyMapProps> = ({ view, selectedPart, onPartClick, isScanning = false }) => {
  const parts = [
    { id: 'head', label: 'Head', view: [BodyView.FRONT, BodyView.BACK], d: "M100,20 C112,20 120,30 120,45 C120,60 110,70 100,70 C90,70 80,60 80,45 C80,30 88,20 100,20 Z" },
    { id: 'neck', label: 'Neck', view: [BodyView.FRONT, BodyView.BACK], d: "M92,70 L108,70 L110,82 L90,82 Z" },
    { id: 'chest', label: 'Chest', view: [BodyView.FRONT], d: "M75,85 L125,85 C140,85 145,100 145,115 C145,135 135,145 120,145 L80,145 C65,145 55,135 55,115 C55,100 60,85 75,85 Z" },
    { id: 'abdomen', label: 'Stomach', view: [BodyView.FRONT], d: "M80,145 L120,145 L125,210 L75,210 Z" },
    { id: 'upper_back', label: 'Upper Back', view: [BodyView.BACK], d: "M75,85 L125,85 C140,85 145,100 145,115 L55,115 C55,100 60,85 75,85 Z" },
    { id: 'lower_back', label: 'Lower Back', view: [BodyView.BACK], d: "M55,115 L145,115 L135,210 L65,210 Z" },
    { id: 'pelvis', label: 'Pelvis', view: [BodyView.FRONT, BodyView.BACK], d: "M75,210 L125,210 L135,255 L65,255 Z" },
    { id: 'shoulder_l', label: 'Shoulders', view: [BodyView.FRONT, BodyView.BACK], d: "M55,90 C45,90 40,100 40,110 L55,110 Z" },
    { id: 'shoulder_r', label: 'Shoulders', view: [BodyView.FRONT, BodyView.BACK], d: "M145,90 C155,90 160,100 160,110 L145,110 Z" },
    { id: 'arm_u_l', label: 'Arms', view: [BodyView.FRONT, BodyView.BACK], d: "M40,110 L55,110 L55,160 L35,160 Z" },
    { id: 'arm_u_r', label: 'Arms', view: [BodyView.FRONT, BodyView.BACK], d: "M145,110 L160,110 L165,160 L145,160 Z" },
    { id: 'arm_l_l', label: 'Arms', view: [BodyView.FRONT, BodyView.BACK], d: "M35,165 L55,165 L55,225 L30,225 Z" },
    { id: 'arm_l_r', label: 'Arms', view: [BodyView.FRONT, BodyView.BACK], d: "M145,165 L165,165 L170,225 L145,225 Z" },
    { id: 'thigh_l', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M65,255 L95,255 L95,330 L60,330 Z" },
    { id: 'thigh_r', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M105,255 L135,255 L140,330 L105,330 Z" },
    { id: 'knee_l', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M60,335 L95,335 L95,350 L60,350 Z" },
    { id: 'knee_r', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M105,335 L140,335 L140,350 L105,350 Z" },
    { id: 'calf_l', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M60,355 L95,355 L90,410 L65,410 Z" },
    { id: 'calf_r', label: 'Legs', view: [BodyView.FRONT, BodyView.BACK], d: "M105,355 L140,355 L135,410 L110,410 Z" },
  ];

  return (
    <div className={`hologram-container relative w-full h-full min-h-[500px] rounded-[3rem] border border-slate-200/40 dark:border-slate-700/40 p-6 transition-all duration-700 ${isScanning ? 'shadow-[0_0_50px_rgba(14,165,233,0.1)]' : ''}`}>
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} />
      
      {/* HUD UI Elements */}
      <div className="absolute top-8 left-8 right-8 flex justify-between pointer-events-none z-20">
        <div className="flex flex-col gap-1.5 flicker">
          <div className="w-10 h-1 bg-sky-500 rounded-full" />
          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Aura_Inference</span>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono">SYS_READY // BUFF_98</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="px-3 py-1 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md border border-sky-200/50 dark:border-sky-700/50 rounded-lg text-[10px] font-bold text-sky-600 dark:text-sky-400">
            {isScanning ? 'ANLYZ' : 'READY'}
          </div>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-tighter">Diagnostic_Lock</span>
        </div>
      </div>

      {/* Main SVG Container */}
      <div className="relative w-full h-full flex items-center justify-center pt-8">
        <div className="scanner-hud-line" />

        <svg viewBox="0 0 200 450" className={`w-auto h-[90%] max-w-full drop-shadow-3xl relative z-10 transition-transform duration-1000 ${isScanning ? 'scale-[0.98]' : ''}`}>
          <defs>
            <filter id="selectionGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {parts.filter(p => p.view.includes(view)).map((part, idx) => (
            <path
              key={`${part.id}-${idx}`}
              d={part.d}
              className={`body-anatomy-part ${selectedPart === part.label ? 'active' : 'idle-pulse'}`}
              onClick={() => !isScanning && onPartClick(part.label)}
              filter={selectedPart === part.label ? 'url(#selectionGlow)' : ''}
              style={{ animationDelay: `${idx * 0.1}s` }}
            />
          ))}

          {/* Core Skeleton / Center Line Overlay */}
          <g opacity="0.12" pointerEvents="none">
            <path d="M100,70 L100,240" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 2" />
            {[80, 110, 140, 170, 200, 230].map(y => (
              <circle key={y} cx="100" cy={y} r="2" fill="#0ea5e9" />
            ))}
          </g>
        </svg>

        {/* Selected Part Detail Label */}
        {!isScanning && selectedPart && (
          <div className="absolute top-1/2 -right-8 translate-y-[-50%] z-20 pointer-events-none hidden md:block">
            <div className="bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 p-4 rounded-2xl border border-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-in slide-in-from-right duration-500">
              <span className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                {selectedPart}
              </span>
              <div className="h-[2px] w-full bg-sky-500/20 my-2" />
              <span className="text-[9px] text-sky-400 font-mono tracking-tighter">DATASET_VERIFIED</span>
            </div>
            <div className="absolute left-[-40px] top-1/2 w-10 h-px bg-sky-500" />
          </div>
        )}
      </div>

      {/* Bottom Status Feed */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rotation_Focus</span>
          <div className="flex gap-2">
            <div className={`h-1 rounded-full transition-all duration-500 ${view === BodyView.FRONT ? 'bg-sky-500 w-10' : 'bg-slate-200 dark:bg-slate-700 w-4'}`} />
            <div className={`h-1 rounded-full transition-all duration-500 ${view === BodyView.BACK ? 'bg-sky-500 w-10' : 'bg-slate-200 dark:bg-slate-700 w-4'}`} />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-sky-600/50 font-mono text-right">COORD_Z: 14.5029</span>
          <span className="text-[8px] text-sky-600/50 font-mono text-right">FRAME_RATE: 60FPS</span>
        </div>
      </div>

      {isScanning && (
        <div className="absolute inset-0 z-40 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] rounded-[3rem] flex flex-col items-center justify-center transition-all duration-500">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-sky-100 dark:border-sky-900 border-t-sky-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" />
            </div>
          </div>
          <span className="mt-4 text-[11px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing</span>
        </div>
      )}
    </div>
  );
};

export default BodyMap;
