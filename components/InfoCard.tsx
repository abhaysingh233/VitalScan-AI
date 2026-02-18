
import React from 'react';
import { BodyPartInfo } from '../types';
import { Activity, ShieldCheck, HeartPulse, Pill, Stethoscope, AlertTriangle, FileDown, Clock, Sparkles, ChevronRight, CheckCircle2, Dna, Microscope, BadgeCheck, ShoppingCart } from 'lucide-react';

interface InfoCardProps {
  data: BodyPartInfo;
  isLoading: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ data, isLoading }) => {
  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-3xl w-full sm:w-1/2"></div>
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-full w-full sm:w-1/3"></div>
        </div>
        <div className="h-60 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 main-content animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-visible">
      {/* Print Specific Header */}
      <div className="print-only mb-12 text-center border-b-2 border-slate-100 pb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-sky-500 rounded-2xl text-white">
            <HeartPulse size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">VitalScan AI Education Report</h1>
        </div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mb-6">Secured Awareness Document</p>
        <div className="flex justify-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 py-3 rounded-full border border-slate-100">
          <span className="flex items-center gap-2"><Clock size={14} className="text-sky-500" /> {new Date().toLocaleDateString()}</span>
          <span>REF: VSAI-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 no-print stagger-in" style={{ animationDelay: '0.1s' }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1 bg-sky-500 rounded-full" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">Specialized Analysis</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter break-words transition-colors">
            {data.name}
          </h2>
          <p className="text-slate-400 font-bold text-base md:text-lg tracking-tight">Personalized Care Path & Preventive Logic</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="w-full sm:flex-1 lg:flex-none flex flex-col items-start sm:items-end justify-center px-6 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[1.5rem] border border-slate-200 dark:border-slate-700 font-black uppercase tracking-widest shadow-sm transition-colors">
            <span className="text-[9px] text-slate-400 mb-1">Recommended Specialist</span>
            <div className="flex items-center gap-2 text-xs">
                <Stethoscope size={16} className="text-sky-500" />
                {data.specialist}
            </div>
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none transition-all duration-300 active:scale-95 group h-full"
          >
            <FileDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Biological Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-in" style={{ animationDelay: '0.15s' }}>
        <div className="bg-sky-50/50 dark:bg-sky-900/10 p-8 rounded-[2.5rem] border border-sky-100/50 dark:border-sky-800/50">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-2 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl"><Dna size={20} /></div>
             <h3 className="font-black text-sky-900 dark:text-sky-200 uppercase tracking-wider text-xs md:text-sm">Biological Function</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base leading-relaxed">
            {data.anatomyDescription}
          </p>
        </div>
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-800/50">
           <div className="flex items-center gap-4 mb-4">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl"><Microscope size={20} /></div>
             <h3 className="font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider text-xs md:text-sm">Mechanism & Etiology</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base leading-relaxed">
            {data.issueMechanism}
          </p>
        </div>
      </div>

      {/* Emergency Protocol */}
      <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-xl shadow-rose-100/20 dark:shadow-none card relative overflow-hidden group stagger-in transition-colors" style={{ animationDelay: '0.2s' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 blur-[50px] -z-10" />
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/40 animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-rose-900 dark:text-rose-100 font-black text-xl md:text-2xl tracking-tight uppercase">Critical Alerts</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.emergencyWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-4 text-rose-700 dark:text-rose-200 text-[11px] font-black bg-white/60 dark:bg-rose-950/30 backdrop-blur-sm p-5 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/30 group-hover:scale-[1.01] transition-transform uppercase tracking-wide leading-relaxed">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 shadow-sm" />
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 stagger-in" style={{ animationDelay: '0.3s' }}>
        <Section icon={<HeartPulse className="text-sky-500" />} title="Primary Issues" items={data.commonIssues} color="blue" />
        <Section icon={<ShieldCheck className="text-emerald-500" />} title="Bio-Prevention" items={data.preventiveCare} color="emerald" />
        <Section icon={<Activity className="text-indigo-500" />} title="Care Protocols" items={data.treatmentSuggestions} color="indigo" />
        <Section icon={<ShieldCheck className="text-amber-500" />} title="Precautions" items={data.generalPrecautions} color="amber" />
      </div>

      {/* Pharmaceutical Registry */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-slate-800 card relative overflow-hidden stagger-in transition-colors" style={{ animationDelay: '0.4s' }}>
        <div className="absolute top-0 left-0 w-3 h-full bg-rose-500/80" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <h3 className="text-slate-900 dark:text-white font-black text-2xl md:text-3xl flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-500"><Pill size={28} /></div>
            OTC Registry
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 self-start sm:self-center">
            <Sparkles size={14} className="text-amber-500" /> Guidance Required
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-fr">
          {data.medicines.map((m, i) => (
            <div key={i} className="flex flex-col p-6 md:p-7 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.25rem] border border-slate-100 dark:border-slate-700 hover:border-rose-100 dark:hover:border-rose-900 hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 shadow-sm group min-h-[140px] h-full relative overflow-hidden">
              
              {/* Certification Badge */}
              {m.certification && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5 z-10">
                  <BadgeCheck size={12} className="fill-white text-emerald-500" />
                  {m.certification}
                </div>
              )}

              <div className="mt-2">
                <span className="font-black text-slate-900 dark:text-white block mb-3 text-lg md:text-xl tracking-tighter group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors uppercase leading-tight">
                  {m.name}
                </span>
                <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 mb-4 rounded-full group-hover:w-16 group-hover:bg-rose-500 transition-all duration-500" />
              </div>

              {/* Order Button */}
              <a 
                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(m.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-sky-500 hover:border-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:border-sky-500 transition-all group/btn"
              >
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white group-hover/btn:bg-white/20 group-hover/btn:text-white transition-colors">
                      <ShoppingCart size={14} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Available Online</span>
                      <span className="text-xs font-bold leading-none">Order Now</span>
                  </div>
                  <ChevronRight size={14} className="ml-auto opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
              </a>

              <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic opacity-80 uppercase tracking-wider mt-auto">
                {m.warning}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] text-center border border-slate-100 dark:border-slate-700">
          <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            Official Disclosure • verified • Non-Diagnostic
          </p>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode, title: string, items: string[], color: string }> = ({ icon, title, items, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800',
    emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    indigo: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800',
    amber: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
  };

  const accentColors: Record<string, string> = {
    blue: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-slate-200/10 dark:shadow-none border border-slate-100 dark:border-slate-800 card hover:shadow-2xl transition-all duration-500 group h-full">
      <h4 className={`font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 mb-8 p-4 rounded-2xl ${colorMap[color]}`}>
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-transform group-hover:scale-110">{icon}</div>
        {title}
      </h4>
      <ul className="space-y-4 px-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-4 text-[12px] md:text-[13px] font-bold text-slate-600 dark:text-slate-300 group/item">
            <div className={`mt-1 flex-shrink-0 transition-transform group-hover/item:scale-110 ${accentColors[color]} rounded-full p-0.5`}>
              <CheckCircle2 size={16} />
            </div>
            <span className="leading-relaxed uppercase tracking-tight transition-colors group-hover/item:text-slate-900 dark:group-hover/item:text-white">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoCard;
