
import React from 'react';
import { ChevronLeft, ShoppingBag } from 'lucide-react';

interface MerchPageProps {
  onBack: () => void;
}

const MerchPage: React.FC<MerchPageProps> = ({ onBack }) => {
  const items = [
    { name: "Kaos SAGA Official", price: "120.000" },
    { name: "Topi Rimba", price: "85.000" },
    { name: "Stiker Pack", price: "15.000" },
    { name: "Gelas Enamel", price: "45.000" },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6 text-emerald-900">
        <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full">
          <ChevronLeft />
        </button>
        <h2 className="font-bold text-xl uppercase tracking-wide">SAGA Store</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full mb-3 flex items-center justify-center text-stone-400">
              <ShoppingBag size={24}/>
            </div>
            <h4 className="font-bold text-stone-800 text-sm">{item.name}</h4>
            <span className="block font-bold text-emerald-700 mt-1">Rp{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MerchPage;
