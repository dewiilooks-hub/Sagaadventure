
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { 
  ChevronLeft, Minus, Plus, 
  Printer, Tent, Calculator, 
  BarChart3, ShoppingCart, User,
  History, Wallet, PlusSquare, X,
  Landmark, RefreshCw, Trash2,
  Clock, Scale, PackagePlus, Crown,
  Tag, AlertCircle, ShieldCheck,
  Contact2, Timer, AlertTriangle, 
  Hammer, Droplets, Search, FileText,
  BadgeAlert, Sparkles, CheckCircle2,
  Phone, Hash, MapPin, Receipt, 
  ShieldQuestion, UserCircle2, BookmarkCheck,
  Zap, Info, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, Layers, Box, Calendar,
  ChevronRight
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { RentalItem, CustomRentalItem, RentalSpending } from '../types';
import { db, appId } from '../services/firebase';

const ITEMS: RentalItem[] = [
  { id: 1, name: "Tent Double Layer 4P", price: 60000, stok: 10 },
  { id: 2, name: "Kompor Portable Grill", price: 25000, stok: 5 },
  { id: 3, name: "Kompor Mini Portable", price: 20000, stok: 5 },
  { id: 4, name: "Nesting (Cooking Set)", price: 20000, stok: 8 },
  { id: 5, name: "Lamp Tent 2 Warna", price: 20000, stok: 10 },
  { id: 6, name: "Lamp Tumbler USB", price: 5000, stok: 10 },
  { id: 7, name: "Kursi Lipat", price: 20000, stok: 10 },
  { id: 8, name: "Meja Lipat", price: 20000, stok: 5 },
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

type RentalSubView = 'dashboard' | 'catalog' | 'invoice' | 'damage' | 'recap' | 'kas' | 'penalty_print';

const RentalPage: React.FC<RentalPageProps> = ({ onBack }) => {
  const [subView, setSubView] = useState<RentalSubView>('dashboard');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [customItems, setCustomItems] = useState<CustomRentalItem[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState('');
  const [newCustomQty, setNewCustomQty] = useState(1);
  
  const [discount, setDiscount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // Global Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  const [recapData, setRecapData] = useState<any[]>([]);
  const [spendingHistory, setSpendingHistory] = useState<RentalSpending[]>([]);
  const [selectedRecapItem, setSelectedRecapItem] = useState<string | null>(null);
  const [showAddSpending, setShowAddSpending] = useState(false);
  const [spendingForm, setSpendingForm] = useState({
    item: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'maintenance' as RentalSpending['category']
  });

  const [searchInv, setSearchInv] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<any>(null);
  const [lateHours, setLateHours] = useState(0);
  const [damageCost, setDamageCost] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = end.getTime() - start.getTime();
    setDuration(Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));
  }, [pickupDate, returnDate]);

  useEffect(() => {
    if (!db) {
      const savedRentals = localStorage.getItem(`saga_rentals_${appId}`);
      const savedSpending = localStorage.getItem(`saga_rental_spending_${appId}`);
      if (savedRentals) setRecapData(JSON.parse(savedRentals));
      if (savedSpending) setSpendingHistory(JSON.parse(savedSpending));
      return;
    }
    const unsubRentals = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals')
      .orderBy('createdAt', 'desc')
      .onSnapshot(s => setRecapData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSpending = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rental_spending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(s => setSpendingHistory(s.docs.map(d => ({ id: d.id, ...d.data() })) as RentalSpending[]));
    return () => { unsubRentals(); unsubSpending(); };
  }, []);

  const calculateSharing = (gross: number) => {
    const royalty = Math.round(gross * 0.05);
    const crew1 = Math.round(gross * 0.05);
    const crew2 = Math.round(gross * 0.05);
    const netKas = gross - royalty - crew1 - crew2;
    return { royalty, crew1, crew2, netKas };
  };

  const updateCart = (id: number, delta: number) => {
    setCart(prev => {
      const newVal = (prev[id] || 0) + delta;
      if (newVal <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newVal };
    });
  };

  const addCustomItem = () => {
    if (!newCustomName || !newCustomPrice) return;
    const newItem: CustomRentalItem = {
      id: Date.now(),
      name: newCustomName,
      price: parseInt(newCustomPrice),
      qty: newCustomQty
    };
    setCustomItems([...customItems, newItem]);
    setNewCustomName('');
    setNewCustomPrice('');
    setNewCustomQty(1);
  };

  const handleSaveRental = async () => {
    if (!customerName) return alert("Nama Penyewa wajib diisi");
    setIsSaving(true);
    const invId = `INV-${Date.now().toString().slice(-6)}`;
    
    const totalCatalogPerDay = Object.entries(cart).reduce((acc, [id, qty]) => {
      const item = ITEMS.find(i => i.id === parseInt(id));
      return acc + (item ? item.price * qty : 0);
    }, 0);
    
    const totalCustom = customItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const grandTotal = Math.max(0, (totalCatalogPerDay * duration) + totalCustom - discount);

    const payload = {
      invoiceId: invId,
      customer: customerName,
      phone: customerPhone,
      total: grandTotal,
      discount: discount,
      type: 'rental',
      pickupDate,
      returnDate,
      duration,
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      items: Object.entries(cart).map(([id, qty]) => ({
        id: parseInt(id),
        name: ITEMS.find(i => i.id === parseInt(id))?.name || 'Unknown',
        qty,
        price: ITEMS.find(i => i.id === parseInt(id))?.price || 0
      })),
      customItems: customItems
    };

    try {
      if (!db) {
        const existing = JSON.parse(localStorage.getItem(`saga_rentals_${appId}`) || '[]');
        localStorage.setItem(`saga_rentals_${appId}`, JSON.stringify([payload, ...existing]));
      } else {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals').add(payload);
      }
      setActiveInvoice(payload);
      setSubView('invoice');
    } catch (e) {
      alert("Gagal menyimpan invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchInvoice = () => {
    const match = recapData.find(r => r.invoiceId.toUpperCase() === searchInv.toUpperCase());
    if (match) {
      setFoundInvoice(match);
    } else {
      alert("Invoice tidak ditemukan.");
      setFoundInvoice(null);
    }
  };

  const calculatePenaltyTotal = () => {
    if (!foundInvoice) return 0;
    const dailyRate = foundInvoice.total / (foundInvoice.duration || 1);
    const hourlyRate = dailyRate * 0.09;
    const billableHours = Math.max(0, lateHours - 12);
    const lateFee = Math.round(billableHours * hourlyRate);
    return lateFee + (damageCost || 0) + (cleaningFee || 0);
  };

  const handleAddSpending = async () => {
    if (!spendingForm.item || !spendingForm.amount) return alert("Lengkapi data!");
    const data = {
      ...spendingForm,
      amount: parseInt(spendingForm.amount.toString()),
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };
    try {
      if (!db) {
        const existing = JSON.parse(localStorage.getItem(`saga_rental_spending_${appId}`) || '[]');
        localStorage.setItem(`saga_rental_spending_${appId}`, JSON.stringify([data, ...existing]));
        setSpendingHistory([data as any, ...spendingHistory]);
      } else {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rental_spending').add(data);
      }
      setSpendingForm({ item: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'maintenance' });
      setShowAddSpending(false);
    } catch (e) { alert("Gagal"); }
  };

  const handleDeleteSpending = async (id: string) => {
    if (!window.confirm("Hapus log?")) return;
    if (!db) {
      const updated = spendingHistory.filter((_, i) => i.toString() !== id);
      setSpendingHistory(updated);
      localStorage.setItem(`saga_rental_spending_${appId}`, JSON.stringify(updated));
    } else {
      await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rental_spending').doc(id).delete();
    }
  };

  if (subView === 'dashboard') {
    return (
      <div className="p-8 space-y-6 bg-white min-h-screen animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-12">
           <button onClick={onBack} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
             <ChevronLeft size={18} className="text-stone-900"/>
           </button>
           <BrandLogo size={10} color="#1c1917" />
           <div className="w-10"></div>
        </div>
        <div className="space-y-4">
          <DashboardCard title="Sewa / Buat Invoice" desc="Katalog alat & custom items" icon={<Tent size={24}/>} color="bg-emerald-900" onClick={() => setSubView('catalog')} />
          <DashboardCard title="Kas & Saldo Rental" desc="Saldo bersih & log belanja alat" icon={<Wallet size={24}/>} color="bg-stone-900" onClick={() => setSubView('kas')} />
          <DashboardCard title="Denda & Ganti Rugi" desc="Jam telat & Berita Acara" icon={<Calculator size={24}/>} color="bg-orange-800" onClick={() => { setSubView('damage'); setFoundInvoice(null); setSearchInv(''); }} />
          <DashboardCard title="Rekap & Pembelian" desc="Laporan profit sharing" icon={<BarChart3 size={24}/>} color="bg-stone-800" onClick={() => setSubView('recap')} />
        </div>
      </div>
    );
  }

  // --- RESTORED EQUIPMENT PASS INVOICE ---
  if (subView === 'invoice' && activeInvoice) {
    const inv = activeInvoice;
    const subtotalBeforeDiscount = inv.total + (inv.discount || 0);
    return (
      <div className="p-8 bg-white min-h-screen animate-in fade-in">
        <div className="flex justify-between items-center mb-10 print:hidden">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full text-stone-600 shadow-sm"><X size={18}/></button>
           <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full shadow-lg"><Printer size={18}/></button>
        </div>

        {/* SLIDE 1: DATA SEWA */}
        <div className="border-[1px] border-stone-200 p-10 space-y-12 rounded-[2rem] bg-white relative overflow-hidden">
           <div className="flex justify-between items-start border-b border-stone-100 pb-8">
              <div>
                 <BrandLogo size={14} color="#000" />
                 <p className="text-[10px] font-black text-stone-300 uppercase mt-2 tracking-widest">Rental Equipment Pass</p>
              </div>
              <div className="text-right">
                 {/* Fixed: Revised from "INV {inv.invoiceId}" to "INV- SAGA {id}" to avoid double "INV" and add brand */}
                 <p className="text-[10px] font-black text-stone-900 uppercase">INV- SAGA {inv.invoiceId.replace('INV-', '')}</p>
                 <p className="text-[8px] font-bold text-stone-300 uppercase mt-1">{inv.pickupDate}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-10">
              <div>
                 <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Penyewa</p>
                 <p className="text-sm font-black text-stone-900 uppercase leading-none">{inv.customer}</p>
                 <p className="text-[9px] font-bold text-stone-400 mt-2">{inv.phone || '-'}</p>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Durasi Sewa</p>
                 <p className="text-sm font-black text-stone-900 uppercase leading-none">{inv.duration} Hari</p>
                 <p className="text-[8px] font-bold text-stone-300 uppercase mt-2">{inv.pickupDate} - {inv.returnDate}</p>
              </div>
           </div>

           <table className="w-full text-left">
              <thead>
                 <tr className="text-[8px] font-black text-stone-400 uppercase border-b border-stone-100">
                    <th className="py-4">Item Peralatan</th>
                    <th className="py-4 text-center">Qty</th>
                    <th className="py-4 text-right">Price</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                 {inv.items?.map((item: any, idx: number) => (
                   <tr key={idx}>
                      <td className="py-4 text-[10px] font-black text-stone-900 uppercase">{item.name}</td>
                      <td className="py-4 text-[10px] font-bold text-stone-400 text-center">{item.qty}</td>
                      <td className="py-4 text-[10px] font-bold text-stone-900 text-right font-mono">Rp{item.price.toLocaleString('id-ID')}</td>
                   </tr>
                 ))}
                 {inv.customItems?.map((item: any, idx: number) => (
                   <tr key={`c-${idx}`}>
                      <td className="py-4 text-[10px] font-black text-stone-900 uppercase">{item.name}*</td>
                      <td className="py-4 text-[10px] font-bold text-stone-400 text-center">{item.qty}</td>
                      <td className="py-4 text-[10px] font-bold text-stone-900 text-right font-mono">Rp{item.price.toLocaleString('id-ID')}</td>
                   </tr>
                 ))}
              </tbody>
           </table>

           <div className="pt-8 border-t-[3px] border-stone-900 space-y-3">
              <div className="flex justify-between items-center px-2 text-stone-500">
                 <span className="text-[10px] font-black uppercase tracking-widest">Total Sewa</span>
                 <span className="text-sm font-bold font-mono">Rp{subtotalBeforeDiscount.toLocaleString('id-ID')}</span>
              </div>
              {inv.discount > 0 && (
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Adjustment / Discount</span>
                   <span className="text-sm font-bold text-rose-500 font-mono">-Rp{inv.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between items-end bg-stone-50 p-8 rounded-[2rem] mt-6 shadow-sm border border-stone-100">
                <div>
                  <p className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em] mb-1">Grand Total Payment</p>
                  <p className="text-4xl font-black text-stone-900 font-mono tracking-tighter leading-none">Rp{inv.total?.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right pb-1">
                  <CheckCircle2 size={32} className="text-emerald-500 opacity-30" />
                </div>
              </div>
           </div>
        </div>

        {/* SLIDE 2: SYARAT & KETENTUAN (PAGE BREAK) */}
        <div className="mt-12 pt-12 border-t-[1px] border-dashed border-stone-200 print:page-break-before-always">
           <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-stone-900 rounded-2xl text-white shadow-lg">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <h3 className="text-[15px] font-black text-stone-900 uppercase tracking-[0.2em]">SYARAT & KETENTUAN SEWA</h3>
                 <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1">Official Rental Policy SAGA Adventure</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-6 px-2">
              <SectionTicketTerm icon={<Contact2 size={16} className="text-stone-400" />} title="IDENTITAS & JAMINAN" text="Penyewa wajib menjaminkan identitas asli (KTP/SIM) dan alat harus dikembalikan sesuai batas waktu yang tertera pada Invoice." />
              <SectionTicketTerm icon={<Timer size={16} className="text-indigo-400" />} title="TOLERANSI KETERLAMBATAN" text="Masa dispensasi keterlambatan maksimal adalah 12 JAM. Melewati masa ini, denda keterlambatan per jam akan dihitung secara otomatis." />
              <SectionTicketTerm icon={<AlertTriangle size={16} className="text-rose-400" />} title="KEBIJAKAN DENDA JAM" text="Denda keterlambatan sebesar 9% per jam dari total tarif sewa harian akan ditagihkan kepada penyewa jika melebihi masa dispensasi." />
              <SectionTicketTerm icon={<Hammer size={16} className="text-stone-400" />} title="GANTI RUGI KERUSAKAN" text="Kerusakan ringan dikenakan biaya servis. Kerusakan fatal/hilang wajib ganti unit baru atau membayar biaya penuh sesuai harga pasar." />
              <SectionTicketTerm icon={<Droplets size={16} className="text-sky-400" />} title="KEBERSIHAN ALAT" text="Kondisi kotor biasa (tanah/debu wajar) masih ditoleransi. Kotor ekstrem (lumpur pekat/noda permanen) dikenakan biaya cleaning service." />
           </div>

           <div className="mt-20 pt-10 border-t border-stone-100 flex justify-center opacity-30">
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">Validated by SAGA Management System</p>
           </div>
        </div>
      </div>
    );
  }

  if (subView === 'catalog') {
    const catalogTotalPerDay = Object.entries(cart).reduce((acc, [id, qty]) => {
      const item = ITEMS.find(i => i.id === parseInt(id));
      return acc + (item ? item.price * qty : 0);
    }, 0);
    const customTotal = customItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const subtotal = (catalogTotalPerDay * duration) + customTotal;
    const grandTotal = Math.max(0, subtotal - discount);

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-48">
        <div className="flex items-center justify-between mb-4">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Unit Catalog</h2>
           <div className="w-10"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="NAMA PENYEWA" className="w-full bg-stone-50 rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <input type="text" placeholder="NO HP" className="w-full bg-stone-50 rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-stone-300 ml-2 uppercase tracking-widest">Pickup</label>
                 <input type="date" className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-[10px] font-bold outline-none" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-stone-300 ml-2 uppercase tracking-widest">Return</label>
                 <input type="date" className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-[10px] font-bold outline-none" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
           </div>
        </div>
        <div className="space-y-3">
           {ITEMS.map(item => (
             <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm">
                <div><h4 className="text-[11px] font-black text-stone-900 uppercase">{item.name}</h4><p className="text-[9px] font-bold text-stone-300 mt-1">Rp{item.price.toLocaleString('id-ID')}/hari</p></div>
                <div className="flex items-center gap-3 bg-stone-50 p-1.5 rounded-xl">
                   <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-stone-400 hover:text-stone-900 shadow-sm"><Minus size={14}/></button>
                   <span className="text-[11px] font-black text-stone-900 w-6 text-center">{cart[item.id] || 0}</span>
                   <button onClick={() => updateCart(item.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-sm transition-transform active:scale-90"><Plus size={14}/></button>
                </div>
             </div>
           ))}
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4">
           <div className="flex items-center gap-2 mb-2"><PackagePlus size={14} className="text-stone-300"/><h3 className="text-[10px] font-black uppercase tracking-widest">Custom Items</h3></div>
           <div className="grid grid-cols-12 gap-2">
              <input type="text" placeholder="BARANG" className="col-span-5 bg-stone-50 rounded-xl py-3 px-4 text-[10px] font-bold uppercase outline-none" value={newCustomName} onChange={e => setNewCustomName(e.target.value)} />
              <input type="number" placeholder="HARGA" className="col-span-3 bg-stone-50 rounded-xl py-3 px-3 text-[10px] font-bold outline-none" value={newCustomPrice} onChange={e => setNewCustomPrice(e.target.value)} />
              <input type="number" placeholder="QTY" className="col-span-2 bg-stone-50 rounded-xl py-3 px-2 text-[10px] font-bold text-center outline-none" value={newCustomQty} onChange={e => setNewCustomQty(parseInt(e.target.value) || 1)} />
              <button onClick={addCustomItem} className="col-span-2 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95"><Plus size={18}/></button>
           </div>
           {customItems.length > 0 && (
              <div className="space-y-2 mt-2">
                 {customItems.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="flex-1">
                         <p className="text-[10px] font-black uppercase text-stone-900">{item.name}</p>
                         <p className="text-[8px] font-bold text-stone-400">Rp{item.price.toLocaleString('id-ID')} x {item.qty}</p>
                      </div>
                      <button onClick={() => setCustomItems(customItems.filter(i => i.id !== item.id))} className="text-rose-400 p-2"><Trash2 size={16}/></button>
                   </div>
                 ))}
              </div>
           )}
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4">
           <div className="flex items-center gap-2 mb-2"><Tag size={14} className="text-stone-300"/><h3 className="text-[10px] font-black uppercase tracking-widest">Adjustment & Discount</h3></div>
           <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-[10px] font-black">Rp</span>
              <input type="number" placeholder="0" className="w-full bg-stone-50 rounded-xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100 transition-all" value={discount === 0 ? '' : discount} onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} />
           </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-stone-100 z-40 max-w-md mx-auto">
           <div className="flex items-center justify-between mb-4">
              <div><p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Grand Total ({duration} Hari)</p><p className="text-xl font-black text-stone-900 font-mono">Rp{grandTotal.toLocaleString('id-ID')}</p></div>
              <button onClick={handleSaveRental} disabled={isSaving || (catalogTotalPerDay === 0 && customItems.length === 0)} className="bg-emerald-700 text-white px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all">
                 {isSaving ? <RefreshCw className="animate-spin" size={14}/> : <ShoppingCart size={14}/>} SIMPAN INVOICE
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- MODERN KAS & SALDO VIEW ---
  if (subView === 'kas') {
    const filteredRentals = recapData.filter(item => {
      const d = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const filteredSpending = spendingHistory.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalNetKasIn = filteredRentals.reduce((acc, curr) => acc + calculateSharing(curr.total).netKas, 0);
    const totalSpending = filteredSpending.reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalNetKasIn - totalSpending;

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-24">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm active:scale-95 transition-all border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Financial Reserve Hub</h2>
           <button onClick={() => setShowAddSpending(!showAddSpending)} className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${showAddSpending ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-900 border'}`}>
              {showAddSpending ? <X size={18}/> : <PlusSquare size={18}/>} 
              <span className="text-[8px] font-black uppercase tracking-widest">{showAddSpending ? 'Close' : 'Log Belanja'}</span>
           </button>
        </div>

        {/* Filter Bulan */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {months.map((m, idx) => (
             <button 
              key={idx} 
              onClick={() => setSelectedMonth(idx)}
              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedMonth === idx ? 'bg-emerald-800 text-white border-emerald-800 shadow-lg' : 'bg-white text-stone-300 border-stone-100 hover:border-stone-200'}`}
             >
               {m}
             </button>
           ))}
        </div>

        {/* Balance Card */}
        <div className="bg-stone-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] block mb-2">Sisa Saldo Kas Rental</span>
                <p className="text-5xl font-black font-mono tracking-tighter">Rp{currentBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Net Kas (85%)</p>
                   <p className="text-sm font-black text-emerald-400 font-mono">+Rp{totalNetKasIn.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Belanja/Ops</p>
                   <p className="text-sm font-black text-rose-400 font-mono">-Rp{totalSpending.toLocaleString('id-ID')}</p>
                </div>
              </div>
           </div>
           <Landmark size={180} className="absolute -right-12 -bottom-12 opacity-[0.03]" />
        </div>

        {showAddSpending && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4 border border-stone-100 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-2 mb-2">
                <Box size={14} className="text-stone-300" />
                <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Input Pengeluaran Kas</h3>
             </div>
             <input type="text" placeholder="MISAL: BELI MATRAS BARU" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100 text-stone-900" value={spendingForm.item} onChange={e => setSpendingForm({...spendingForm, item: e.target.value})} />
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">Kategori</label>
                   <select className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none" value={spendingForm.category} onChange={e => setSpendingForm({...spendingForm, category: e.target.value as any})}>
                      <option value="maintenance">MAINTENANCE</option>
                      <option value="purchase">PEMBELIAN ALAT</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">Nominal</label>
                   <input type="number" placeholder="Rp" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none text-stone-900" value={spendingForm.amount} onChange={e => setSpendingForm({...spendingForm, amount: e.target.value})} />
                </div>
             </div>
             <button onClick={handleAddSpending} className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-all mt-4">Simpan Log Kas</button>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-4">
           <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
             <History size={14} className="text-stone-300" /> Log Transaksi Kas
           </h3>
           <div className="space-y-3">
              {filteredSpending.length === 0 ? (
                <div className="py-12 text-center opacity-10"><Info size={32} className="mx-auto"/><p className="text-[9px] font-black uppercase mt-2">Belum ada pengeluaran bulan ini</p></div>
              ) : (
                filteredSpending.map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${s.category === 'purchase' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                           {s.category === 'purchase' ? <ShoppingCart size={18}/> : <Hammer size={18}/>}
                        </div>
                        <div>
                           <h4 className="text-[11px] font-black text-stone-900 uppercase">{s.item}</h4>
                           <p className="text-[8px] font-bold text-stone-300 uppercase mt-0.5">{s.category} • {s.date}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-rose-600 font-mono">-Rp{s.amount.toLocaleString('id-ID')}</p>
                        <button onClick={() => handleDeleteSpending(idx.toString())} className="p-2 text-stone-100 hover:text-rose-300"><Trash2 size={16}/></button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    );
  }

  // --- MODERN REKAP VIEW ---
  if (subView === 'recap') {
    const filteredRentals = recapData.filter(item => {
      const d = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalOmzet = filteredRentals.reduce((acc, curr) => acc + curr.total, 0);
    const totalUnitRented = filteredRentals.reduce((acc, curr) => acc + (curr.items?.length || 0) + (curr.customItems?.length || 0), 0);

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-32">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm active:scale-95 transition-all border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Monthly Audit Control</h2>
           <div className="w-10"></div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between h-40">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Monthly Omzet</span>
              <div>
                 <p className="text-2xl font-black font-mono">Rp{totalOmzet.toLocaleString('id-ID')}</p>
                 <div className="flex items-center gap-2 mt-2">
                    <TrendingUp size={10} className="text-emerald-400" />
                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">{filteredRentals.length} Invoices</span>
                 </div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-40">
              <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Gear Utilized</span>
              <div>
                 <p className="text-4xl font-black text-stone-900 font-mono tracking-tighter">{totalUnitRented}</p>
                 <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest">Items This Month</span>
              </div>
           </div>
        </div>

        {/* Month Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {months.map((m, idx) => (
             <button 
              key={idx} 
              onClick={() => setSelectedMonth(idx)}
              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedMonth === idx ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-300 border-stone-100 hover:border-stone-200'}`}
             >
               {m}
             </button>
           ))}
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
           {filteredRentals.length === 0 ? (
             <div className="py-24 text-center opacity-10 flex flex-col items-center">
                <FileText size={64} />
                <p className="text-[10px] font-black uppercase mt-4 tracking-[0.5em]">No Data Period</p>
             </div>
           ) : (
             filteredRentals.map((item, idx) => {
               const sharing = calculateSharing(item.total);
               const isSelected = selectedRecapItem === item.invoiceId;
               return (
                 <div key={idx} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <div className="p-8 flex justify-between items-center">
                       <div>
                          <div className="flex items-center gap-2 mb-2">
                            {/* Adjusted in list too for consistency if needed, but primary was top right corner */}
                            <span className="text-[8px] font-black bg-stone-100 text-stone-500 px-3 py-1 rounded-full uppercase tracking-widest">INV- SAGA {item.invoiceId.replace('INV-', '')}</span>
                            <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{item.pickupDate}</span>
                          </div>
                          <h4 className="text-[13px] font-black text-stone-900 uppercase tracking-tight">{item.customer}</h4>
                       </div>
                       <div className="text-right">
                          <p className="text-[16px] font-black text-stone-900 font-mono leading-none">Rp{item.total.toLocaleString('id-ID')}</p>
                          <button onClick={() => setSelectedRecapItem(isSelected ? null : item.invoiceId)} className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1 justify-end">
                            {isSelected ? 'Hide Detail' : 'Show Breakdown'} <ChevronRight size={10} className={isSelected ? 'rotate-90' : ''}/>
                          </button>
                       </div>
                    </div>
                    {isSelected && (
                      <div className="bg-stone-50 p-8 border-t border-stone-100 animate-in slide-in-from-top-4">
                         <div className="grid grid-cols-2 gap-4 mb-8">
                            <SharingCard label="Royalty (5%)" amount={sharing.royalty} icon={<Crown size={12}/>} />
                            <SharingCard label="Crew 1 (5%)" amount={sharing.crew1} icon={<User size={12}/>} />
                            <SharingCard label="Crew 2 (5%)" amount={sharing.crew2} icon={<User size={12}/>} />
                            <SharingCard label="Kas Unit (85%)" amount={sharing.netKas} icon={<Wallet size={12}/>} isHighlight />
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-stone-50 pb-3">
                               <Layers size={12} className="text-stone-300"/>
                               <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Items List</span>
                            </div>
                            <div className="space-y-2">
                               {item.items?.map((it: any, i: number) => (
                                 <div key={i} className="flex justify-between text-[10px] font-bold text-stone-900 uppercase">
                                    <span>{it.qty}x {it.name}</span>
                                    <span className="text-stone-400">Rp{it.price.toLocaleString('id-ID')}</span>
                                 </div>
                               ))}
                               {item.customItems?.map((it: any, i: number) => (
                                 <div key={`c-${i}`} className="flex justify-between text-[10px] font-bold text-stone-900 uppercase">
                                    <span>{it.qty}x {it.name}*</span>
                                    <span className="text-stone-400">Rp{it.price.toLocaleString('id-ID')}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
               );
             })
           )}
        </div>
      </div>
    );
  }

  // --- MODERN DAMAGE CONTROL RESTORED ---
  if (subView === 'damage') {
    const totalPenalty = calculatePenaltyTotal();
    const dailyRate = foundInvoice ? foundInvoice.total / foundInvoice.duration : 0;
    const hourlyPenaltyPrice = dailyRate * 0.09;
    const billableHours = Math.max(0, lateHours - 12);

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-32">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Damage Control</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4">
           <div className="flex items-center gap-2 mb-2"><Search size={14} className="text-stone-300"/><h3 className="text-[10px] font-black uppercase tracking-widest">Referensi Invoice</h3></div>
           <div className="flex gap-2">
              <input type="text" placeholder="INV-XXXXXX" className="flex-1 bg-stone-50 rounded-xl py-4 px-5 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-orange-50" value={searchInv} onChange={e => setSearchInv(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchInvoice()}/>
              <button onClick={handleSearchInvoice} className="bg-orange-600 text-white px-6 rounded-xl shadow-lg shadow-orange-100"><Search size={18}/></button>
           </div>
        </div>
        {foundInvoice && (
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 mb-2"><Timer size={18} className="text-orange-600"/><h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">1. Keterlambatan (Jam)</h4></div>
                   <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl">
                      <button onClick={() => setLateHours(Math.max(0, lateHours - 1))} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-stone-400"><Minus size={18}/></button>
                      <input type="number" className="flex-1 bg-transparent text-center font-black text-xl outline-none" value={lateHours} onChange={e => setLateHours(parseInt(e.target.value) || 0)}/>
                      <button onClick={() => setLateHours(lateHours + 1)} className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center"><Plus size={18}/></button>
                   </div>
                </div>
                <div className="space-y-4 border-t border-stone-50 pt-8">
                   <div className="flex items-center gap-3 mb-2"><BadgeAlert size={18} className="text-orange-600"/><h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">2. Ganti Rugi Kerusakan</h4></div>
                   <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 text-xs font-black">Rp</span><input type="number" placeholder="Total Biaya Sparepart" className="w-full bg-stone-50 rounded-2xl py-5 pl-12 pr-6 text-xs font-bold outline-none" value={damageCost === 0 ? '' : damageCost} onChange={e => setDamageCost(parseInt(e.target.value) || 0)} /></div>
                </div>
                <div className="space-y-4 border-t border-stone-50 pt-8">
                   <div className="flex items-center gap-3 mb-2"><Droplets size={18} className="text-sky-600"/><h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">3. Cleaning Service</h4></div>
                   <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 text-xs font-black">Rp</span><input type="number" placeholder="Biaya Cuci Alat" className="w-full bg-stone-50 rounded-2xl py-5 pl-12 pr-6 text-xs font-bold outline-none" value={cleaningFee === 0 ? '' : cleaningFee} onChange={e => setCleaningFee(parseInt(e.target.value) || 0)} /></div>
                </div>
             </div>
             <button onClick={() => setSubView('penalty_print')} className="w-full bg-stone-900 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"><Printer size={16}/> Cetak Bukti Denda</button>
          </div>
        )}
      </div>
    );
  }

  if (subView === 'penalty_print' && foundInvoice) {
    const dailyRate = foundInvoice.total / foundInvoice.duration;
    const hourlyRate = dailyRate * 0.09;
    const billableHours = Math.max(0, lateHours - 12);
    const lateFee = Math.round(billableHours * hourlyRate);
    const totalPenalty = lateFee + damageCost + cleaningFee;

    return (
      <div className="p-0 bg-orange-50 min-h-screen animate-in fade-in flex flex-col items-center">
        <div className="max-w-4xl w-full p-8 print:p-0">
          <div className="flex justify-between items-center mb-10 print:hidden">
             <button onClick={() => setSubView('damage')} className="p-4 bg-white rounded-2xl text-stone-600 border border-orange-100 shadow-sm active:scale-95 transition-all"><X size={20}/></button>
             <button onClick={() => window.print()} className="bg-orange-600 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] tracking-widest active:scale-95 transition-all"><Printer size={20}/> CETAK BERITA ACARA</button>
          </div>
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
             <div className="bg-orange-600 p-12 text-white flex justify-between items-end relative overflow-hidden">
                <div className="relative z-10"><BrandLogo size={14} color="white" /><p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Berita Acara Pengembalian</p></div>
                <div className="relative z-10 text-right"><h1 className="text-3xl font-black tracking-tighter uppercase leading-none">PENALTY PASS</h1></div>
                <Scale size={250} className="absolute -right-12 -bottom-12 opacity-[0.1]"/>
             </div>
             <div className="p-12 space-y-12">
                <div className="grid grid-cols-2 gap-12 border-b border-stone-100 pb-12">
                   <div><p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-2">Penyewa</p><h2 className="text-xl font-black text-stone-900 uppercase tracking-tighter">{foundInvoice.customer}</h2></div>
                   <div className="text-right"><p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-2">Status Unit</p><span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">DIKEMBALIKAN</span></div>
                </div>
                <div className="space-y-3">
                   <PenaltyItemRow label="Keterlambatan" desc={`Telat ${lateHours} jam (Free 12 jam)`} amount={lateFee} icon={<Clock size={16} className="text-orange-400"/>} />
                   <PenaltyItemRow label="Kerusakan Alat" desc="Audit fisik sparepart" amount={damageCost} icon={<Hammer size={16} className="text-rose-400"/>} />
                   <PenaltyItemRow label="Biaya Cleaning" desc="Pembersihan kotor ekstrem" amount={cleaningFee} icon={<Droplets size={16} className="text-sky-400"/>} />
                </div>
                <div className="bg-stone-900 p-12 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10"><span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] block mb-2">Total Penalti</span><p className="text-5xl font-black font-mono tracking-tighter">Rp{totalPenalty.toLocaleString('id-ID')}</p></div>
                   <BookmarkCheck size={40} className="relative z-10 text-emerald-500" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// UI Components
const SharingCard = ({ label, amount, icon, isHighlight }: any) => (
  <div className={`p-5 rounded-3xl border transition-all ${isHighlight ? 'bg-emerald-950 text-white border-emerald-900 shadow-lg shadow-emerald-900/10' : 'bg-white text-stone-900 border-stone-100 shadow-sm'}`}>
     <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${isHighlight ? 'bg-emerald-900' : 'bg-stone-50 text-stone-300'}`}>{icon}</div>
     </div>
     <p className={`text-[8px] font-black uppercase mb-1 tracking-widest ${isHighlight ? 'text-emerald-400' : 'text-stone-300'}`}>{label}</p>
     <p className="text-[12px] font-black font-mono tracking-tight">Rp{amount.toLocaleString('id-ID')}</p>
  </div>
);

const PenaltyItemRow = ({ label, desc, amount, icon }: { label: string, desc: string, amount: number, icon: React.ReactNode }) => (
  <div className="flex justify-between items-center p-6 bg-white rounded-[2rem] border border-stone-50 shadow-sm">
     <div className="flex items-center gap-4">
        <div className="p-3 bg-stone-50 rounded-xl">{icon}</div>
        <div>
           <p className="text-[11px] font-black text-stone-900 uppercase tracking-tight leading-tight">{label}</p>
           <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
     </div>
     <p className="text-[12px] font-black text-stone-900 font-mono">Rp{amount.toLocaleString('id-ID')}</p>
  </div>
);

const SectionTicketTerm = ({ title, text, icon }: { title: string, text: string, icon: React.ReactNode }) => (
  <div className="flex items-start gap-4 p-5 rounded-3xl border border-stone-50 hover:bg-stone-50 transition-all group">
     <div className="shrink-0 p-3 bg-stone-50 rounded-2xl group-hover:bg-white transition-colors">{icon}</div>
     <div className="space-y-1">
        <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest leading-none">{title}</h4>
        <p className="text-[10px] font-medium text-stone-500 leading-relaxed">{text}</p>
     </div>
  </div>
);

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md relative overflow-hidden`}>
    <div className="relative z-10"><div className="mb-4 bg-white/10 w-fit p-3 rounded-2xl border border-white/10">{icon}</div><h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3><p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p></div>
  </button>
);

export default RentalPage;
