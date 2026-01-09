
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronDown, ChevronUp, Minus, Plus, 
  Receipt, Trash2, Printer, Tent, Trees, Phone, 
  CreditCard, Clock, PackagePlus, AlertTriangle 
} from 'lucide-react';
import { RentalItem, CustomRentalItem } from '../types';

const ITEMS: RentalItem[] = [
  { id: 1, name: "Tent Double Layer 4P", price: 60000, stok: 10 },
  { id: 2, name: "Kompor Portable Grill", price: 25000, stok: 5 },
  { id: 3, name: "Kompor Mini Portable", price: 20000, stok: 5 },
  { id: 4, name: "Nesting (Cooking Set)", price: 20000, stok: 8 },
  { id: 5, name: "Lamp Tent 2 Warna", price: 20000, stok: 10 },
  { id: 6, name: "Lamp Tumbler USB", price: 5000, stok: 10 },
  { id: 7, name: "Kursi Lipat", price: 20000, stok: 10 },
  { id: 8, name: "Meja Lipat", price: 20000, stok: 5 },
  { id: 9, name: "Sleeping Bag", price: 20000, stok: 20 },
  { id: 10, name: "Power Bank", price: 20000, stok: 5 },
  { id: 11, name: "Tiang Flysheet", price: 15000, stok: 5 },
  { id: 12, name: "Flysheet 3x4", price: 15000, stok: 5 },
  { id: 13, name: "Hammock", price: 15000, stok: 10 },
  { id: 14, name: "Speaker Bluetooth", price: 15000, stok: 3 },
  { id: 15, name: "Matras", price: 10000, stok: 25 },
  { id: 16, name: "Trekking Pole", price: 20000, stok: 10 },
];

interface RentalPageProps {
  onBack: () => void;
}

const RentalPage: React.FC<RentalPageProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<'catalog' | 'invoice'>('catalog');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [identityType, setIdentityType] = useState('KTP');
  const [showCatalog, setShowCatalog] = useState(false);
  const [customItems, setCustomItems] = useState<CustomRentalItem[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState('');
  const [newCustomQty, setNewCustomQty] = useState(1);
  const [lateHours, setLateHours] = useState(0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pickupDate, setPickupDate] = useState(formatDate(today));
  const [returnDate, setReturnDate] = useState(formatDate(tomorrow));
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (end < start) {
      setDuration(0); 
    } else {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDuration(diffDays === 0 ? 1 : diffDays);
    }
  }, [pickupDate, returnDate]);

  const addToCart = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) - 1;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const addCustomItem = () => {
    if (!newCustomName || !newCustomPrice) return;
    setCustomItems([...customItems, {
      id: Date.now(),
      name: newCustomName,
      price: parseInt(newCustomPrice),
      qty: newCustomQty
    }]);
    setNewCustomName('');
    setNewCustomPrice('');
    setNewCustomQty(1);
  };

  const removeCustomItem = (id: number) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const item = ITEMS.find(i => i.id === parseInt(id));
      // Fix: Explicitly cast qty to number to avoid 'unknown' type error in arithmetic
      if (item) total += item.price * (qty as number);
    });
    return total;
  };

  const totalPerDay = calculateSubtotal();
  const rentalTotal = totalPerDay * duration;
  const customItemsTotal = customItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const lateFee = Math.round(totalPerDay * 0.05 * lateHours);
  const grandTotal = rentalTotal + customItemsTotal + lateFee;
  // Fix: Cast Object.values result to number[] to ensure reduce works correctly with numeric values
  const totalItems = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);

  if (viewMode === 'invoice') {
    return (
      <div className="bg-stone-200 min-h-screen pb-20">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center gap-2 shadow-sm z-10 print:hidden">
          <button onClick={() => setViewMode('catalog')} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="text-emerald-800"/>
          </button>
          <h2 className="font-bold text-xl text-stone-800">Preview Invoice</h2>
        </div>

        <div className="m-4 bg-[#fdfbf7] shadow-xl text-sm relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Tent size={300} color="#064e3b" />
          </div>

          <div className="h-2 bg-emerald-900 flex">
             <div className="w-1/3 bg-orange-600 h-full"></div>
             <div className="w-1/3 bg-emerald-700 h-full"></div>
          </div>

          <div className="p-8 relative z-10">
            <div className="border-b-2 border-stone-300 pb-6 mb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trees className="text-emerald-800" size={24} />
                  <h1 className="text-2xl font-black text-emerald-900 tracking-wider uppercase">INVOICE</h1>
                </div>
                <p className="text-sm font-bold text-stone-700">SAGA ADVENTURE</p>
                <p className="text-xs text-stone-500 tracking-wide">Nature • Gear • Journey</p>
              </div>
              <div className="text-right">
                <div className="bg-stone-100 p-2 rounded border border-stone-200">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">No. Ref</p>
                  <p className="font-mono font-bold text-emerald-800">INV-{Date.now().toString().slice(-6)}</p>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 uppercase">Tanggal</p>
                <p className="font-bold text-stone-700">{new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <div className="mb-8 bg-stone-50 p-5 rounded-lg border border-stone-200 shadow-sm relative">
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Penyewa</label>
                <input 
                  type="text" 
                  placeholder="NAMA LENGKAP" 
                  className="w-full bg-transparent text-lg font-bold border-b-2 border-stone-300 focus:border-emerald-600 focus:outline-none py-1 text-stone-800 placeholder-stone-300"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Phone size={10}/> No. Handphone
                </label>
                <input 
                  type="tel" 
                  placeholder="08..." 
                  className="w-full bg-transparent border-b-2 border-stone-300 focus:border-emerald-600 focus:outline-none font-mono font-bold text-stone-700 text-sm py-1"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <CreditCard size={10}/> Identitas Jaminan
                </label>
                <div className="flex gap-2">
                  <select 
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value)}
                    className="bg-emerald-900 text-white font-bold text-xs py-1 px-3 rounded shadow-sm focus:outline-none"
                  >
                    <option value="KTP">KTP</option>
                    <option value="SIM">SIM</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="NOMOR IDENTITAS" 
                    className="flex-1 bg-transparent border-b-2 border-stone-300 focus:border-emerald-600 focus:outline-none font-mono font-bold text-stone-700 text-sm"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Ambil</label>
                   <input 
                      type="date"
                      className="w-full text-sm font-bold bg-white border border-stone-300 rounded px-2 py-1 text-stone-700"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Kembali</label>
                   <input 
                      type="date"
                      min={pickupDate}
                      className="w-full text-sm font-bold bg-white border border-stone-300 rounded px-2 py-1 text-stone-700"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                   />
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center bg-emerald-50 px-3 py-2 rounded text-emerald-900 border border-emerald-100">
                <span className="text-xs font-bold uppercase tracking-wide">Durasi Sewa</span>
                <span className="font-black text-lg">{duration} <span className="text-xs font-medium text-emerald-700">Hari</span></span>
              </div>

              <div className="mt-2 flex justify-between items-center bg-red-50 px-3 py-2 rounded text-red-900 border border-red-100 print:hidden">
                <div className="flex items-center gap-2">
                   <Clock size={14} className="text-red-700" />
                   <span className="text-xs font-bold uppercase tracking-wide">Keterlambatan</span>
                </div>
                <div className="flex items-center gap-1">
                   <input 
                     type="number" 
                     className="w-12 bg-white border border-red-200 rounded text-center font-bold text-sm focus:outline-none focus:border-red-500 text-red-900"
                     value={lateHours}
                     onChange={(e) => setLateHours(Math.max(0, parseInt(e.target.value) || 0))}
                   />
                   <span className="text-xs font-medium">Jam</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-black text-stone-400 mb-2 tracking-widest uppercase flex items-center gap-2">
                <Tent size={12} /> Equipment List
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-stone-500 border-b-2 border-stone-300 uppercase tracking-wider">
                    <th className="text-left py-2">Gear</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">@Day</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-stone-700 text-xs">
                  {Object.entries(cart).map(([id, qty], idx) => {
                    const item = ITEMS.find(i => i.id === parseInt(id));
                    if (!item) return null;
                    return (
                      <tr key={id} className={`border-b border-stone-100 last:border-0 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-stone-50/50'}`}>
                        <td className="py-3 font-bold">{item.name}</td>
                        <td className="text-center py-3 font-mono">{(qty as number)}</td>
                        <td className="text-right py-3 text-stone-500">{item.price.toLocaleString('id-ID')}</td>
                        {/* Fix: Cast qty to number for arithmetic calculation in invoice */}
                        <td className="text-right py-3 font-bold text-emerald-800">{(item.price * (qty as number) * duration).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-6">
              {customItems.length > 0 && (
                <>
                  <h3 className="text-xs font-black text-stone-400 mb-2 tracking-widest uppercase flex items-center gap-2">
                     <PackagePlus size={12} /> Add-ons
                  </h3>
                  <table className="w-full mb-3">
                    <tbody className="text-stone-700 text-xs">
                      {customItems.map((item) => (
                        <tr key={item.id} className="border-b border-stone-100 bg-orange-50/30">
                          <td className="py-2 pl-2 font-bold text-orange-900">{item.name}</td>
                          <td className="text-center py-2 font-mono">{item.qty}</td>
                          <td className="text-right py-2 text-stone-500">{item.price.toLocaleString('id-ID')}</td>
                          <td className="text-right py-2 font-bold text-orange-800">{(item.price * item.qty).toLocaleString('id-ID')}</td>
                          <td className="text-center w-6 print:hidden">
                            <button onClick={() => removeCustomItem(item.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={12}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div className="bg-stone-100 p-3 rounded border border-stone-200 border-dashed print:hidden">
                <p className="text-[10px] font-bold text-stone-500 mb-2 flex items-center gap-1 uppercase">+ Item Manual / Denda</p>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Nama Item..." className="flex-[2] text-xs border border-stone-300 rounded px-2 py-1" value={newCustomName} onChange={(e) => setNewCustomName(e.target.value)} />
                  <input type="number" placeholder="Harga" className="flex-1 text-xs border border-stone-300 rounded px-2 py-1" value={newCustomPrice} onChange={(e) => setNewCustomPrice(e.target.value)} />
                  <input type="number" placeholder="Qty" className="w-10 text-xs border border-stone-300 rounded px-2 py-1" value={newCustomQty} onChange={(e) => setNewCustomQty(parseInt(e.target.value) || 1)} />
                </div>
                <button onClick={addCustomItem} className="w-full bg-stone-600 text-white text-xs py-1.5 rounded hover:bg-stone-700 font-bold uppercase tracking-wide">Tambah</button>
              </div>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div className="flex justify-between text-stone-500 text-xs mb-1">
                  <span>Sewa ({duration} Hari)</span>
                  <span>Rp{rentalTotal.toLocaleString('id-ID')}</span>
                </div>
                {customItemsTotal > 0 && (
                  <div className="flex justify-between text-orange-600 text-xs mb-1">
                    <span>Add-ons</span>
                    <span>+ Rp{customItemsTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {lateHours > 0 && (
                  <div className="flex justify-between text-red-600 text-xs mb-1 font-bold">
                    <span className="flex items-center gap-1"><AlertTriangle size={10} /> Denda Telat ({lateHours} Jam)</span>
                    <span>+ Rp{lateFee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-stone-300 my-2 border-dashed"></div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-emerald-900 uppercase">Total Bayar</span>
                  <span className="font-black text-2xl text-emerald-900">Rp{grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs text-stone-500">
               <div>
                 <p className="mb-12 font-bold uppercase tracking-wide">Penyewa</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-1 font-serif italic">{customerName || '....................'}</p>
                 {customerPhone && <p className="text-[10px] text-stone-400 font-mono mt-1">{customerPhone}</p>}
               </div>
               <div>
                 <p className="mb-12 font-bold uppercase tracking-wide">SAGA Adventure</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-1 font-serif italic">Authorized Crew</p>
               </div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-stone-200 text-[9px] text-stone-400 text-center leading-relaxed uppercase tracking-wide">
              * Barang wajib kembali dalam kondisi bersih & kering. Kerusakan ditanggung penyewa. *<br/>
              * Keterlambatan dikenakan denda 5% per jam dari total tagihan harian. *<br/>
              * Keep The Nature Clean *
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 max-w-md mx-auto print:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button onClick={() => setViewMode('catalog')} className="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-bold uppercase tracking-wide text-xs">Kembali</button>
          <button onClick={() => window.print()} className="flex-1 bg-emerald-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-800 uppercase tracking-wide text-xs">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      <div className="p-4 bg-white shadow-sm z-10 sticky top-0 border-b border-stone-200">
        <div className="flex items-center gap-2 mb-2 text-emerald-900">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft /></button>
          <h2 className="font-bold text-xl uppercase tracking-wide">Sewa Gear</h2>
        </div>
        <p className="text-xs text-stone-500 ml-2 font-medium">Pilih peralatan untuk petualanganmu</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <button onClick={() => setShowCatalog(!showCatalog)} className={`w-full p-4 rounded-xl flex justify-between items-center transition-all shadow-md border ${showCatalog ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-emerald-900 border-stone-200 hover:bg-stone-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${showCatalog ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}><Tent size={24} /></div>
            <div className="text-left">
              <h3 className="font-bold text-lg uppercase tracking-wide">Katalog Alat</h3>
              <p className={`text-xs ${showCatalog ? 'text-emerald-300' : 'text-stone-500'}`}>{showCatalog ? 'Tutup Katalog' : 'Buka Katalog'}</p>
            </div>
          </div>
          {showCatalog ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
        </button>

        {showCatalog && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {ITEMS.map((item) => {
              // Fix: Cast cart access to number to avoid comparison error with unknown type
              const qty = (cart[item.id] as number) || 0;
              return (
                <div key={item.id} className={`bg-white p-4 rounded-xl border transition-all ${qty > 0 ? 'border-emerald-500 shadow-md bg-emerald-50' : 'border-stone-200 shadow-sm'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-stone-800">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-emerald-700 font-bold text-sm">Rp{item.price.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-wide">/24 Jam</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {qty > 0 && <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-white border border-red-200 text-red-700 flex items-center justify-center active:bg-red-50"><Minus size={16} /></button>}
                      {qty > 0 && <span className="font-bold text-lg w-4 text-center text-stone-800">{qty}</span>}
                      <button onClick={() => addToCart(item.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${qty > 0 ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-400 hover:bg-emerald-100 hover:text-emerald-700'}`}><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] max-w-md mx-auto z-20">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">{totalItems} Item Terpilih</p>
              <p className="font-black text-xl text-emerald-900">Rp{totalPerDay.toLocaleString('id-ID')}<span className="text-xs font-normal text-stone-400"> / hari</span></p>
            </div>
          </div>
          <button onClick={() => setViewMode('invoice')} className="w-full bg-emerald-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 shadow-lg active:scale-95 transition-transform uppercase tracking-wide text-sm">
            <Receipt size={18} /> Buat Invoice
          </button>
        </div>
      )}
    </div>
  );
};

export default RentalPage;
