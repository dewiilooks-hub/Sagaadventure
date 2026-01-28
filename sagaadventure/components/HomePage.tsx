
import React from 'react';
import { Tent, Map, ShoppingBag, Lock, ChevronRight, Crown } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { ViewMode } from '../types';

interface MenuButtonProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  accent: string;
  onClick: () => void;
  isLocked?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ title, icon, color, accent, onClick, isLocked }) => {
  return (
    <button 
      onClick={onClick}
      className={`${color} text-white p-7 rounded-[2rem] shadow-sm transition-all active:scale-95 flex items-center justify-between group ${isLocked ? 'grayscale opacity-30 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1'}`}
    >
      <div className="flex items-center gap-5 z-10">
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
          {isLocked ? <Lock size={22} /> : icon}
        </div>
        <h3 className="font-normal text-sm tracking-[0.2em] uppercase">{title}</h3>
      </div>
      {!isLocked && <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
    </button>
  );
};

interface HomePageProps {
  onNavigate: (view: ViewMode) => void;
  activeModule: ViewMode | null;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, activeModule }) => {
  return (
    <div className="p-8 flex flex-col gap-6 relative bg-white min-h-screen">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
        <span className="text-[6vw] font-normal tracking-[0.8em] uppercase whitespace-nowrap">SAGA ADVENTURE</span>
      </div>

      <div className="pt-10 pb-6 text-center relative z-10">
        <BrandLogo size={14} color="#1c1917" className="mb-4 mx-auto justify-center" />
        <div className="h-px w-4 bg-stone-100 mx-auto mb-4"></div>
        <p className="text-stone-300 text-[8px] font-bold uppercase tracking-[0.5em]">Operations Control</p>
      </div>

      <div className="grid gap-4 relative z-10">
        <MenuButton 
          title="Rental" 
          icon={<Tent size={22} />} 
          color="bg-emerald-900"
          accent="emerald"
          onClick={() => onNavigate('rental')} 
          isLocked={activeModule !== null && activeModule !== 'rental'}
        />
        <MenuButton 
          title="Trip" 
          icon={<Map size={22} />} 
          color="bg-sky-600" 
          accent="sky"
          onClick={() => onNavigate('trip')} 
          isLocked={activeModule !== null && activeModule !== 'trip'}
        />
        <MenuButton 
          title="Merch" 
          icon={<ShoppingBag size={22} />} 
          color="bg-stone-800" 
          accent="stone"
          onClick={() => onNavigate('merch')} 
          isLocked={activeModule !== null && activeModule !== 'merch'}
        />
      </div>

      <div className="h-px bg-stone-50 my-2"></div>

      <button 
        onClick={() => onNavigate('owner')}
        className="bg-stone-950 text-white p-6 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-lg ring-4 ring-stone-50"
      >
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/20">
            <Crown size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Owner Portal</h3>
            <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-1">Tax & Royalty Center</p>
          </div>
        </div>
        <Lock size={14} className="text-stone-700" />
      </button>
      
      {activeModule && (
        <div className="mt-4 p-5 rounded-[1.5rem] bg-stone-50 border border-stone-100 flex items-center gap-4 animate-in fade-in duration-500">
          <div className="p-2 bg-stone-200 rounded-lg">
            <Lock size={14} className="text-stone-600" />
          </div>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-loose">
            Active: {activeModule}.<br/>Complete session to switch modules.
          </p>
        </div>
      )}

      <div className="mt-auto pb-10 text-center opacity-10">
        <p className="text-[7px] font-bold tracking-[0.6em] uppercase">Est. 2026</p>
      </div>
    </div>
  );
};

export default HomePage;
