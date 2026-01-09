
import React from 'react';
import { Compass, Tent, Map, ShoppingBag, Lock } from 'lucide-react';
import { ViewMode } from '../types';

interface MenuButtonProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  accent: string;
  onClick: () => void;
  isLocked?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ title, desc, icon, color, accent, onClick, isLocked }) => {
  return (
    <button 
      onClick={onClick}
      className={`${color} text-white p-5 rounded-xl shadow-lg transition active:scale-95 flex items-center gap-4 text-left border-b-4 ${accent} relative overflow-hidden group ${isLocked ? 'grayscale opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
    >
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-white/5 skew-x-12 transform translate-x-12 group-hover:translate-x-0 transition-transform duration-500"></div>
      <div className="bg-black/20 p-3 rounded-lg backdrop-blur-sm z-10">
        {isLocked ? <Lock size={28} /> : icon}
      </div>
      <div className="z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg tracking-wide">{title}</h3>
          {isLocked && <span className="text-[8px] bg-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Locked</span>}
        </div>
        <p className="text-white/70 text-xs font-medium">{isLocked ? "Selesaikan sesi lain untuk masuk" : desc}</p>
      </div>
    </button>
  );
};

interface HomePageProps {
  onNavigate: (view: ViewMode) => void;
  activeModule: ViewMode | null;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, activeModule }) => {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-center relative overflow-hidden">
        <Compass className="absolute -right-4 -top-4 text-stone-100 w-32 h-32 opacity-50" />
        <p className="text-stone-500 text-sm mb-1 font-medium uppercase tracking-wide">Sistem Manajemen</p>
        <h2 className="text-2xl font-black text-emerald-900 tracking-tight">COMMAND CENTER</h2>
      </div>

      <div className="grid gap-4">
        <MenuButton 
          title="RENTAL ALAT" 
          desc="Kasir & Invoice Otomatis"
          icon={<Tent size={28} />} 
          color="bg-emerald-800"
          accent="border-emerald-600"
          onClick={() => onNavigate('rental')} 
          isLocked={activeModule !== null && activeModule !== 'rental'}
        />
        <MenuButton 
          title="OPEN TRIP" 
          desc="Manajemen Tim & Logistik"
          icon={<Map size={28} />} 
          color="bg-sky-700" 
          accent="border-sky-500"
          onClick={() => onNavigate('trip')} 
          isLocked={activeModule !== null && activeModule !== 'trip'}
        />
        <MenuButton 
          title="MERCHANDISE" 
          desc="Katalog Penjualan"
          icon={<ShoppingBag size={28} />} 
          color="bg-orange-700" 
          accent="border-orange-500"
          onClick={() => onNavigate('merch')} 
          isLocked={activeModule !== null && activeModule !== 'merch'}
        />
      </div>
      
      {activeModule && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Lock className="text-amber-600" size={18} />
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
            Sesi aktif: <span className="text-emerald-900">{activeModule.toUpperCase()}</span>. Logout untuk pindah modul.
          </p>
        </div>
      )}

      <div className="mt-8 text-center opacity-40 text-xs text-stone-500">
        &copy; 2026 Saga Adventure System
      </div>
    </div>
  );
};

export default HomePage;
