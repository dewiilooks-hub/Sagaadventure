
import React from 'react';
import { ChevronLeft, ShoppingBag, ArrowRight } from 'lucide-react';

interface MerchPageProps {
  onBack: () => void;
}

const MerchPage: React.FC<MerchPageProps> = ({ onBack }) => {
  const items = [
    { name: "SAGA Tee", price: "120k", tag: "COTTON" },
    { name: "SAGA Cap v2", price: "85k", tag: "HEADWEAR" },
    { name: "SAGA Stickers", price: "15k", tag: "STUFF" },
    { name: "SAGA Enamel", price: "45k", tag: "HOME" },
  ];

  return (
    <div className="p-0 bg-white min-h-screen font-sans relative overflow-hidden">
      {/* Subtle Minimalist Watermark - Reduced and Font Regular */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 opacity-[0.01] pointer-events-none select-none">
        <span className="text-[10vw] font-normal tracking-[0.6em] uppercase whitespace-nowrap">SAGA ADVENTURE</span>
      </div>

      <div className="p-10 bg-white flex flex-col items-center relative z-10">
        <div className="w-full flex justify-between items-center mb-16">
           <button onClick={onBack} className="p-3 border border-stone-50 rounded-full transition-all hover:bg-stone-50"><ChevronLeft size={18} className="text-stone-300" /></button>
           <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 italic">Catalog 01</span>
           <div className="w-10"></div>
        </div>
        
        <h1 className="text-5xl font-black text-stone-900 tracking-tighter mb-4">SAGA <span className="text-stone-100">COLLECTION</span></h1>
        <div className="h-0.5 w-10 bg-stone-900"></div>
      </div>

      <div className="px-10 space-y-8 relative z-10">
        {items.map((item, idx) => (
          <div key={idx} className="group border-b border-stone-100 pb-8 flex justify-between items-end hover:border-stone-900 transition-all duration-500 cursor-pointer">
            <div className="flex-1">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 mb-3 block">{item.tag}</span>
              <h4 className="font-normal text-3xl text-stone-800 tracking-tighter uppercase leading-none group-hover:tracking-normal transition-all">{item.name}</h4>
              <p className="text-sm font-black text-stone-400 mt-2">{item.price}</p>
            </div>
            <div className="w-12 h-12 border border-stone-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-stone-900 group-hover:text-white transition-all">
               <ArrowRight size={20} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-20 text-center opacity-10">
         <p className="text-[8px] font-black tracking-[0.6em] uppercase">Consistent Quality</p>
      </div>
    </div>
  );
};

export default MerchPage;
