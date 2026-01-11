
import React, { useState, useEffect } from 'react';
// Fixed: Using compat import for Firebase v8 style code
import firebase from 'firebase/compat/app';
import { 
  ChevronLeft, Minus, Plus, 
  Receipt, Printer, Trees, Tent,
  Clock, CreditCard, PackagePlus,
  AlertTriangle, Phone, Trash2,
  ChevronDown, ChevronUp, Calculator,
  BarChart3, FileText, Search, Save,
  CheckCircle2, XCircle, ShoppingCart,
  ShieldCheck, Info, Download, Tag, Percent,
  FileWarning, Scale, FileSignature, User
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { RentalItem, CustomRentalItem, ViewMode } from '../types';
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

type RentalSubView = 'dashboard' | 'catalog' | 'invoice' | 'damage' | 'damage_invoice' | 'recap' | 'terms';

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
  const [activeInvoiceId, setActiveInvoiceId] = useState('');

  // Damage & Fines States
  const [damageItems, setDamageItems] = useState<{name: string, cost: number}[]>([]);
  const [damageInvoiceRef, setDamageInvoiceRef] = useState('');
  const [lateHours, setLateHours] = useState(0);
  const [dailyRateRef, setDailyRateRef] = useState(0);
  const [isSearchingInv, setIsSearchingInv] = useState(false);

  // Recap States
  const [recapData, setRecapData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
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
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    setDuration(diffDays);
  }, [pickupDate, returnDate]);

  // Fetch Recap Data for History & Lookup
  useEffect(() => {
    if (!db) {
      const local = localStorage.getItem(`saga_rentals_${appId}`);
      if (local) setRecapData(JSON.parse(local));
      return;
    }

    const q = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals').orderBy('createdAt', 'desc');
    const unsubscribe = q.onSnapshot((snapshot) => {
      setRecapData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [subView]);

  // AUTO-POPULATE DAILY RATE FROM INVOICE REF
  useEffect(() => {
    if (damageInvoiceRef.trim().length >= 5) {
      setIsSearchingInv(true);
      const found = recapData.find(r => r.invoiceId === damageInvoiceRef || r.invoiceId === `INV-${damageInvoiceRef}`);
      if (found) {
        const rate = found.totalPerDay || (found.duration ? found.rentalTotal / found.duration : found.rentalTotal);
        setDailyRateRef(Math.round(rate));
      } else {
        setDailyRateRef(0);
      }
      setIsSearchingInv(false);
    } else {
      setDailyRateRef(0);
    }
  }, [damageInvoiceRef, recapData]);

  const addToCart = (id: number) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: number) => setCart(prev => {
    const newQty = (prev[id] || 0) - 1;
    if (newQty <= 0) { const { [id]: _, ...rest } = prev; return rest; }
    return { ...prev, [id]: newQty };
  });

  const addCustomItem = () => {
    if (!newCustomName || !newCustomPrice) return;
    setCustomItems([...customItems, { id: Date.now(), name: newCustomName, price: parseInt(newCustomPrice), qty: newCustomQty }]);
    setNewCustomName(''); setNewCustomPrice(''); setNewCustomQty(1);
  };

  // RENTAL TOTAL LOGIC
  const totalPerDayValue = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = ITEMS.find(i => i.id === parseInt(id));
    return acc + (item ? item.price * (qty as number) : 0);
  }, 0);

  const rentalTotal = totalPerDayValue * duration;
  const customItemsTotal = customItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const autoDiscountAmount = duration >= 3 ? Math.round(rentalTotal * 0.1) : 0;
  const effectiveDiscount = discount > 0 ? discount : autoDiscountAmount;
  const grandTotal = Math.max(0, rentalTotal + customItemsTotal - effectiveDiscount);
  const totalItemsCount = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);

  // DAMAGE & FINE TOTAL LOGIC WITH 4H DISPENSATION
  const effectiveLateHours = lateHours > 4 ? lateHours : 0;
  const lateFee = Math.round(dailyRateRef * 0.05 * effectiveLateHours);
  const damageCostTotal = damageItems.reduce((acc, item) => acc + item.cost, 0);
  const grandTotalDamage = lateFee + damageCostTotal;

  const handleOpenInvoice = () => {
    if (!activeInvoiceId) {
      setActiveInvoiceId(`INV-${new Date().getTime().toString().slice(-6)}`);
    }
    setSubView('invoice');
  };

  const handleSaveRental = async (silent = false) => {
    if (!customerName) return alert("Nama Penyewa wajib diisi");
    setIsSaving(true);
    const invId = activeInvoiceId || `INV-${new Date().getTime().toString().slice(-6)}`;
    if(!activeInvoiceId) setActiveInvoiceId(invId);

    const payload = {
      invoiceId: invId,
      customer: customerName,
      phone: customerPhone,
      total: grandTotal,
      rentalTotal: rentalTotal,
      totalPerDay: totalPerDayValue,
      duration: duration,
      customTotal: customItemsTotal,
      discount: effectiveDiscount,
      type: 'rental',
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      items: Object.entries(cart).map(([id, qty]) => ({
        id: parseInt(id),
        name: ITEMS.find(i => i.id === parseInt(id))?.name || 'Unknown',
        qty: qty,
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
      if (!silent) alert(`Data Tersimpan`);
    } catch (e) {
      console.error(e);
      if (!silent) alert("Gagal menyimpan transaksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDamage = async (silent = false) => {
    if (!damageInvoiceRef) return alert("Nomor Invoice Referensi wajib diisi");
    setIsSaving(true);
    const payload = {
      invoiceId: `DMG-${damageInvoiceRef}`,
      refInvoice: damageInvoiceRef,
      total: grandTotalDamage,
      lateFee: lateFee,
      lateHours: lateHours,
      type: 'damage',
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      damageItems: damageItems
    };

    try {
      if (!db) {
        const existing = JSON.parse(localStorage.getItem(`saga_rentals_${appId}`) || '[]');
        localStorage.setItem(`saga_rentals_${appId}`, JSON.stringify([payload, ...existing]));
      } else {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals').add(payload);
      }
      if (!silent) alert("Data Ganti Rugi Berhasil Disimpan");
    } catch (e) {
      console.error(e);
      if (!silent) alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Hapus permanen data transaksi ini?")) return;
    if (db) {
      try {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals').doc(id).delete();
      } catch (e) { alert("Gagal menghapus data di cloud."); }
    } else {
      const local = JSON.parse(localStorage.getItem(`saga_rentals_${appId}`) || '[]');
      const filtered = local.filter((item: any) => (item.id !== id && item.invoiceId !== id));
      localStorage.setItem(`saga_rentals_${appId}`, JSON.stringify(filtered));
      setRecapData(filtered);
    }
  };

  // --- DASHBOARD VIEW ---
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
          <DashboardCard title="Sewa / Buat Invoice" desc="Katalog alat & billing otomatis" icon={<Tent size={24}/>} color="bg-emerald-900" onClick={() => setSubView('catalog')} />
          <DashboardCard title="Denda & Ganti Rugi" desc="Jam telat & kalkulasi kerusakan" icon={<Calculator size={24}/>} color="bg-orange-800" onClick={() => setSubView('damage')} />
          <DashboardCard title="S&K Penyewaan" desc="Memo dispensasi & aturan main" icon={<ShieldCheck size={24}/>} color="bg-stone-800" onClick={() => setSubView('terms')} />
          <DashboardCard title="Rekap & Pembelian" desc="Laporan bulanan & pengadaan" icon={<BarChart3 size={24}/>} color="bg-stone-900" onClick={() => setSubView('recap')} />
        </div>
      </div>
    );
  }

  // --- TERMS / MEMO VIEW (REVISED) ---
  if (subView === 'terms') {
    const memoRules = [
      { 
        title: "Peminjaman Alat", 
        text: "Penyewa wajib menjaminkan identitas asli (KTP/SIM/Paspor) dan alat harus dikembalikan sesuai batas waktu yang tertera pada Invoice." 
      },
      { 
        title: "Dispensasi Keterlambatan", 
        text: "SAGA Adventure memberikan toleransi keterlambatan maksimal 4 JAM dari waktu pengembalian. Masa dispensasi ini bebas biaya denda." 
      },
      { 
        title: "Kebijakan Denda Jam", 
        text: "Apabila keterlambatan MELEBIHI 4 JAM, maka denda keterlambatan sebesar 5% per jam dari total tarif sewa harian akan dihitung dan ditagihkan sepenuhnya." 
      },
      { 
        title: "Ganti Rugi Kerusakan", 
        text: "Apabila terjadi kerusakan, pihak SAGA akan melakukan pengecekan. Kerusakan kecil yang masih bisa diperbaiki akan dikenakan biaya perbaikan, namun jika kerusakan tidak bisa diperbaiki maka wajib ganti unit baru/biaya penuh." 
      },
      { 
        title: "Kebersihan & Toleransi", 
        text: "Jika hanya kotor biasa (debu/tanah wajar) atau terkena hujan masih bisa ditoleransi dan tidak dikenakan biaya cleaning service. Biaya cleaning hanya berlaku untuk kondisi kotor ekstrem." 
      }
    ];

    return (
      <div className="bg-stone-100 min-h-screen pb-24 relative font-sans animate-in slide-in-from-right">
        {/* Navigation Bar */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shadow-sm z-50 print:hidden">
           <button onClick={() => setSubView('dashboard')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="text-stone-600"/></button>
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Legal Memo S&K</span>
           <div className="w-8"></div>
        </div>

        {/* Memo Content */}
        <div className="m-4 bg-white shadow-2xl rounded-sm border-t-[12px] border-stone-900 p-8 space-y-10 relative max-w-2xl mx-auto min-h-[1000px] flex flex-col">
           {/* Header */}
           <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8">
              <div>
                 <BrandLogo size={12} color="#1c1917" />
                 <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-widest">Adventure Gear Management</p>
              </div>
              <div className="text-right">
                 <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">MEMO</h1>
                 <p className="text-[8px] font-black text-stone-300 mt-2 uppercase tracking-[0.4em]">Official Reference</p>
              </div>
           </div>

           {/* REVISED: Top manual inputs */}
           <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4 print:p-0 print:border-none print:bg-white">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest block">Penyewa (Nama)</label>
                    <div className="relative">
                       <User size={12} className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300" />
                       <input 
                         type="text" 
                         placeholder="NAMA LENGKAP" 
                         className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none font-bold text-stone-900 uppercase py-1 pl-5 text-xs"
                         value={customerName}
                         onChange={(e) => setCustomerName(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest block">No. Invoice</label>
                    <div className="relative">
                       <FileText size={12} className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300" />
                       <input 
                         type="text" 
                         placeholder="INV-XXXXXX" 
                         className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none font-mono font-bold text-stone-700 py-1 pl-5 text-xs"
                         value={activeInvoiceId}
                         onChange={(e) => setActiveInvoiceId(e.target.value.toUpperCase())}
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Rules */}
           <div className="space-y-6">
              <h3 className="text-[9px] font-black text-stone-900 uppercase tracking-[0.3em] bg-stone-100 px-4 py-2 w-fit rounded-full">Ketentuan Sewa & Denda</h3>
              <div className="space-y-5">
                 {memoRules.map((rule, idx) => (
                   <div key={idx} className="flex gap-4">
                      <span className="text-[10px] font-black text-stone-900 min-w-[1.5rem] h-6 flex items-center justify-center bg-stone-50 rounded-lg">{idx + 1}</span>
                      <div>
                         <h4 className="text-[11px] font-black uppercase tracking-tight mb-1 text-stone-900">{rule.title}</h4>
                         <p className="text-[11px] leading-relaxed text-stone-500 font-medium">{rule.text}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Closing */}
           <div className="mt-auto pt-10">
              <div className="bg-stone-900 p-6 rounded-2xl text-white/90 text-[10px] leading-relaxed font-bold italic mb-12">
                 "Dengan menggunakan layanan SAGA Adventure, penyewa dianggap telah menyetujui seluruh butir memo di atas termasuk aturan denda jam dan ganti rugi yang berlaku."
              </div>

              {/* REVISED: Signatures at the bottom */}
              <div className="grid grid-cols-2 gap-10 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest border-t border-dashed border-stone-100 pt-16 pb-8">
                 <div className="space-y-20">
                    <p>DIBUAT OLEH</p>
                    <div className="flex flex-col items-center">
                       <div className="border-b border-stone-200 w-32 mb-2"></div>
                       <p className="text-stone-900 italic font-bold">SAGA ADVENTURE</p>
                    </div>
                 </div>
                 <div className="space-y-20">
                    <p>DISETUJUI OLEH</p>
                    <div className="flex flex-col items-center">
                       <div className="border-b border-stone-200 w-32 mb-2"></div>
                       <p className="text-stone-900 italic font-bold uppercase">{customerName || ".................."}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 max-w-md mx-auto print:hidden shadow-lg z-[100]">
           <button onClick={() => setSubView('dashboard')} className="flex-1 bg-stone-100 text-stone-700 py-4 rounded-xl font-bold uppercase text-[10px]">Kembali</button>
           <button 
             onClick={async () => {
               if(customerName) {
                 await handleSaveRental(true); 
               }
               window.print();
             }} 
             className="flex-[2] bg-emerald-900 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-md hover:bg-emerald-800"
           >
             <Printer size={16} /> Simpan & Cetak Memo
           </button>
        </div>
      </div>
    );
  }

  // --- DAMAGE CONTROL VIEW (AUTO DAILY RATE) ---
  if (subView === 'damage') {
    return (
      <div className="p-8 space-y-6 bg-stone-50 min-h-screen animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Damage & Fines</h2>
           <div className="w-10"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-2">No. Invoice Referensi</label>
              <div className="relative mt-1">
                 <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isSearchingInv ? 'animate-pulse text-orange-500' : 'text-stone-300'}`} size={14} />
                 <input 
                  type="text" 
                  placeholder="CONTOH: 123456" 
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-10 pr-4 text-xs font-bold outline-none uppercase" 
                  value={damageInvoiceRef} 
                  onChange={e => setDamageInvoiceRef(e.target.value.toUpperCase())} 
                 />
              </div>
              <p className="text-[8px] text-stone-400 mt-1 ml-2 font-bold uppercase">* Sistem akan mencari Sub Harian secara otomatis</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-2">Telat (Jam)</label>
                <div className="relative mt-1">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                   <input type="number" placeholder="0" className="w-full bg-stone-50 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold" value={lateHours || ''} onChange={e => setLateHours(parseInt(e.target.value) || 0)} />
                </div>
                {lateHours > 0 && lateHours <= 4 && (
                   <p className="text-[8px] text-emerald-600 font-bold mt-1 ml-2 uppercase">* Masa Dispensasi (Free)</p>
                )}
              </div>
              <div>
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-2">Sub Harian (Auto)</label>
                <div className="relative mt-1">
                   <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-800" size={14} />
                   <input 
                    type="number" 
                    readOnly 
                    className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl py-4 pl-10 pr-4 text-xs font-black text-orange-900 outline-none" 
                    value={dailyRateRef || ''} 
                    placeholder="..."
                   />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-stone-100"></div>
          
          {/* Item Damage Adder */}
          <div className="space-y-4">
             <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Kerusakan Gear</h3>
             <div className="grid grid-cols-[1fr_0.8fr] gap-2">
                <input type="text" placeholder="Nama Barang" className="bg-stone-50 rounded-xl px-4 py-3 text-[10px] font-bold outline-none uppercase" value={newCustomName} onChange={e => setNewCustomName(e.target.value)} />
                <input type="number" placeholder="Biaya (Rp)" className="bg-stone-50 rounded-xl px-4 py-3 text-[10px] font-bold outline-none" value={newCustomPrice} onChange={e => setNewCustomPrice(e.target.value)} />
             </div>
             <button onClick={() => { if(!newCustomName || !newCustomPrice) return; setDamageItems([...damageItems, {name: newCustomName, cost: parseInt(newCustomPrice)}]); setNewCustomName(''); setNewCustomPrice(''); }} className="w-full bg-orange-100 text-orange-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px]">
               + Tambah Ganti Rugi
             </button>
          </div>

          {/* List display */}
          <div className="space-y-3">
             {lateFee > 0 && (
               <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                     <Clock className="text-red-700" size={14} />
                     <span className="text-[9px] font-black uppercase">Denda Telat ({lateHours} Jam)</span>
                  </div>
                  <span className="text-[10px] font-black text-red-900">Rp{lateFee.toLocaleString('id-ID')}</span>
               </div>
             )}
             {damageItems.map((item, idx) => (
               <div key={idx} className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <span className="text-[9px] font-black uppercase">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-stone-900">Rp{item.cost.toLocaleString('id-ID')}</span>
                    <button onClick={() => setDamageItems(damageItems.filter((_, i) => i !== idx))} className="text-stone-300 hover:text-red-500"><Trash2 size={12}/></button>
                  </div>
               </div>
             ))}
          </div>

          {/* Total display */}
          {(lateFee > 0 || damageItems.length > 0) && (
            <div className="pt-6 border-t border-dashed space-y-4">
               <div className="bg-stone-900 text-white p-6 rounded-[2rem] flex justify-between items-center shadow-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest">Total Ganti Rugi</span>
                  <span className="text-xl font-black">Rp{grandTotalDamage.toLocaleString('id-ID')}</span>
               </div>
               <button onClick={() => setSubView('damage_invoice')} className="w-full bg-orange-800 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-2 shadow-lg">
                 <Receipt size={16} /> Preview Invoice Denda
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- CATALOG & INVOICE VIEWS (SAME AS BEFORE BUT WITH totalPerDayValue STORAGE) ---
  // ... (keeping other views for functional completeness)

  if (subView === 'catalog') {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden animate-in fade-in">
        <div className="p-6 bg-emerald-900 text-white flex items-center justify-between shadow-lg">
          <button onClick={() => setSubView('dashboard')} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={18}/></button>
          <BrandLogo size={10} color="white" />
          <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl"><Tent size={16} /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {ITEMS.map(item => {
             const qty = cart[item.id] || 0;
             return (
               <div key={item.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl scale-[1.02]' : 'bg-white border-stone-100'}`}>
                 <div>
                   <h4 className="font-bold text-[11px] uppercase tracking-tight">{item.name}</h4>
                   <p className={`text-[9px] font-bold ${qty > 0 ? 'text-emerald-300' : 'text-stone-400'}`}>Rp{item.price.toLocaleString('id-ID')}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   {qty > 0 && <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>}
                   {qty > 0 && <span className="font-black text-sm w-4 text-center">{qty}</span>}
                   <button onClick={() => addToCart(item.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${qty > 0 ? 'bg-white text-emerald-900 hover:scale-110' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}><Plus size={14}/></button>
                 </div>
               </div>
             );
          })}
        </div>
        {totalItemsCount > 0 && (
          <div className="p-8 bg-white border-t border-stone-100 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-end mb-6">
               <div className="flex flex-col">
                 <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1">Total Per Day</span>
                 <span className="text-3xl font-black text-stone-900 tracking-tighter">Rp{totalPerDayValue.toLocaleString('id-ID')}</span>
               </div>
               <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">{totalItemsCount} ITEMS</span>
            </div>
            <button onClick={handleOpenInvoice} className="w-full bg-emerald-900 text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-2 shadow-2xl">
              <Receipt size={16}/> Lanjut Ke Invoice
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- INVOICE VIEW ---
  if (subView === 'invoice') {
    return (
      <div className="bg-stone-200 min-h-screen pb-20 relative font-sans">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shadow-sm z-50 print:hidden">
          <button onClick={() => setSubView('catalog')} className="p-2 hover:bg-gray-100 rounded-full text-emerald-800"><ChevronLeft/></button>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Rental Invoice Preview</span>
          <div className="w-8"></div>
        </div>

        <div className="m-4 bg-[#fdfbf7] shadow-xl text-sm relative overflow-hidden rounded-sm border border-stone-300 p-8 min-h-[800px]">
           <div className="h-2 bg-emerald-900 absolute top-0 left-0 right-0 flex">
              <div className="w-1/3 bg-orange-600 h-full"></div>
              <div className="w-1/3 bg-emerald-700 h-full"></div>
           </div>
           
           <div className="border-b-2 border-stone-300 pb-6 mb-6 flex justify-between items-start mt-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trees className="text-emerald-800" size={24} />
                  <h1 className="text-2xl font-black text-emerald-900 tracking-wider uppercase">INVOICE</h1>
                </div>
                <BrandLogo size={10} color="#064e3b" />
              </div>
              <div className="text-right">
                <div className="bg-stone-100 p-2 rounded border border-stone-200 mb-2">
                  <p className="text-[8px] text-stone-400 uppercase font-black">No. Ref</p>
                  <p className="font-mono font-bold text-emerald-800">{activeInvoiceId}</p>
                </div>
                <p className="text-[9px] font-bold text-stone-700">{new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <div className="mb-8 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">Penyewa</label>
                     <input type="text" placeholder="NAMA LENGKAP" className="w-full bg-transparent border-b border-stone-300 focus:outline-none font-bold text-emerald-900 uppercase py-1" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">No HP</label>
                     <input type="tel" placeholder="08..." className="w-full bg-transparent border-b border-stone-300 focus:outline-none font-mono font-bold py-1" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">Ambil</label>
                     <input type="date" className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-[10px] font-bold" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">Kembali</label>
                     <input type="date" className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-[10px] font-bold" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                  </div>
                  <div className="space-y-1 text-center">
                     <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">Durasi</label>
                     <div className="bg-emerald-50 text-emerald-900 font-black py-1 rounded border border-emerald-100">{duration} <span className="text-[7px]">HARI</span></div>
                  </div>
               </div>
            </div>

            <table className="w-full text-xs mb-8">
                <thead className="border-b-2 border-stone-300 text-stone-500 uppercase font-black text-[8px] tracking-widest">
                  <tr>
                    <th className="text-left py-2">Item Gear</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-stone-700 font-bold">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = ITEMS.find(i => i.id === parseInt(id));
                    return (
                      <tr key={id} className="border-b border-stone-50">
                        <td className="py-3 uppercase tracking-tight">{item?.name}</td>
                        <td className="text-center py-3">{qty}</td>
                        <td className="text-right py-3">Rp{((item?.price || 0) * (qty as number) * duration).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>

            <div className="mt-auto bg-stone-900 p-8 rounded-[2rem] text-white space-y-3 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center">
                   <span className="font-black text-xs uppercase tracking-widest opacity-60">Total Bayar</span>
                   <span className="text-3xl font-black">Rp{grandTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-16 text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
               <div className="space-y-16">
                 <p>Penyewa</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-2 text-stone-900 italic lowercase">{customerName || '...........'}</p>
               </div>
               <div className="space-y-16">
                 <p>SAGA Adventure</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-2 text-stone-900 italic">Authorized Crew</p>
               </div>
            </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 max-w-md mx-auto print:hidden shadow-lg">
           <button onClick={() => setSubView('catalog')} className="flex-1 bg-stone-100 text-stone-700 py-4 rounded-xl font-bold uppercase text-[10px]">Kembali</button>
           <button onClick={async () => { await handleSaveRental(true); window.print(); }} className="flex-[2] bg-emerald-900 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-md">
             <Printer size={16} /> Simpan & Cetak Invoice
           </button>
        </div>
      </div>
    );
  }

  // --- RECAP VIEW ---
  if (subView === 'recap') {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const filteredRecap = recapData.filter(item => {
      const createdAt = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
      return createdAt.getMonth() === selectedMonth && createdAt.getFullYear() === selectedYear;
    });
    const incomeRental = filteredRecap.filter(i => i.type === 'rental').reduce((a,b)=>a+b.total, 0);
    const incomeDamage = filteredRecap.filter(i => i.type === 'damage').reduce((a,b)=>a+b.total, 0);

    return (
      <div className="p-8 space-y-6 bg-white min-h-screen animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Management Recap</h2>
           <div className="w-10"></div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
           {months.map((m, idx) => (
             <button key={idx} onClick={() => setSelectedMonth(idx)} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${selectedMonth === idx ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-300 border-stone-100'}`}>{m}</button>
           ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block mb-2">Omzet Rental</span>
              <p className="text-lg font-black text-emerald-900">Rp{incomeRental.toLocaleString('id-ID')}</p>
           </div>
           <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
              <span className="text-[8px] font-black text-orange-900/40 uppercase tracking-widest block mb-2">Denda & Damage</span>
              <p className="text-lg font-black text-orange-900">Rp{incomeDamage.toLocaleString('id-ID')}</p>
           </div>
        </div>

        <div className="space-y-4 pb-20">
           <h3 className="text-[9px] font-black text-stone-300 uppercase tracking-widest">History Transaksi</h3>
           {filteredRecap.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed rounded-[2rem] opacity-20"><ShoppingCart size={48} className="mx-auto"/><p className="text-xs font-bold mt-2 uppercase tracking-widest">Kosong</p></div>
           ) : (
             filteredRecap.map((item, idx) => (
               <div key={item.id || idx} className="bg-white border border-stone-100 p-6 rounded-[2rem] flex justify-between items-center shadow-sm">
                  <div>
                     <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.type === 'rental' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>{item.type}</span>
                     <h4 className="font-black text-[10px] text-stone-900 uppercase tracking-wider mt-1">{item.invoiceId}</h4>
                     <p className="text-[9px] font-bold text-stone-400 uppercase">{item.customer || 'Tanpa Nama'}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <p className="font-black text-stone-900 text-sm">Rp{item.total.toLocaleString('id-ID')}</p>
                     <button onClick={() => handleDeleteTransaction(item.id || item.invoiceId)} className="text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    );
  }

  return null;
};

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md`}>
    <div>
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
  </button>
);

export default RentalPage;
