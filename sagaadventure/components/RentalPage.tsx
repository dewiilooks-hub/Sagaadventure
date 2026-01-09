
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Minus, Plus, 
  Receipt, Printer, Trees, Tent,
  Clock, CreditCard, PackagePlus,
  AlertTriangle, Phone, Trash2,
  ChevronDown, ChevronUp, Calculator,
  BarChart3, FileText, Search, Save,
  CheckCircle2, XCircle, ShoppingCart,
  ShieldCheck, Info
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, where, getDocs 
} from "firebase/firestore";
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

const TERMS_AND_CONDITIONS = [
  "Penyewa wajib menjaminkan identitas asli (KTP/SIM/Paspor) yang masih berlaku.",
  "Peralatan wajib dikembalikan dalam kondisi bersih, kering, dan lengkap seperti saat pengambilan.",
  "Peralatan yang kembali dalam kondisi basah atau kotor akan dikenakan biaya laundry/cleaning service.",
  "Segala bentuk kerusakan (robek, pecah, patah) atau kehilangan alat menjadi tanggung jawab penuh penyewa.",
  "Biaya ganti rugi kerusakan/kehilangan disesuaikan dengan harga pasar atau biaya servis resmi.",
  "Denda keterlambatan adalah 5% per jam dari total tarif sewa harian alat yang disewa.",
  "Penyewa dilarang keras merusak vegetasi, membuang sampah sembarangan, atau melakukan aktivitas ilegal.",
  "SAGA Adventure tidak bertanggung jawab atas kecelakaan atau cedera selama penggunaan alat."
];

interface RentalPageProps {
  onBack: () => void;
}

type RentalSubView = 'dashboard' | 'catalog' | 'invoice' | 'damage' | 'recap' | 'terms';

const RentalPage: React.FC<RentalPageProps> = ({ onBack }) => {
  const [subView, setSubView] = useState<RentalSubView>('dashboard');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [identityType, setIdentityType] = useState('KTP');
  const [customItems, setCustomItems] = useState<CustomRentalItem[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState('');
  const [newCustomQty, setNewCustomQty] = useState(1);
  const [lateHours, setLateHours] = useState(0);
  const [showCatalog, setShowCatalog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState('');

  // Damage Calculator States
  const [damageItems, setDamageItems] = useState<{name: string, cost: number, note: string}[]>([]);
  const [damageInvoiceRef, setDamageInvoiceRef] = useState('');

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

  // Fetch Recap Data
  useEffect(() => {
    const q = db ? query(
      collection(db, 'artifacts', appId, 'public', 'data', 'saga_rentals'),
      orderBy('createdAt', 'desc')
    ) : null;

    if (!q) {
      const local = localStorage.getItem(`saga_rentals_${appId}`);
      if (local) setRecapData(JSON.parse(local));
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecapData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [subView]);

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

  const removeCustomItem = (index: number) => {
    const newItems = [...customItems];
    newItems.splice(index, 1);
    setCustomItems(newItems);
  };

  const totalPerDay = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = ITEMS.find(i => i.id === parseInt(id));
    return acc + (item ? item.price * (qty as number) : 0);
  }, 0);

  const rentalTotal = totalPerDay * duration;
  const customItemsTotal = customItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  // DENDA: 5% dari total harian per jam
  const lateFee = Math.round(totalPerDay * 0.05 * lateHours);
  
  const grandTotal = rentalTotal + customItemsTotal + lateFee;
  const totalItemsCount = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);

  const handleOpenInvoice = () => {
    if (!activeInvoiceId) {
      const invId = `INV-${new Date().getTime().toString().slice(-6)}`;
      setActiveInvoiceId(invId);
    }
    setSubView('invoice');
  };

  const handleSaveRental = async () => {
    if (!customerName) return alert("Nama Penyewa wajib diisi");
    setIsSaving(true);
    const invId = activeInvoiceId;
    const payload = {
      invoiceId: invId,
      customer: customerName,
      phone: customerPhone,
      total: grandTotal,
      rentalTotal: rentalTotal,
      customTotal: customItemsTotal,
      lateFee: lateFee,
      lateHours: lateHours,
      type: 'rental',
      createdAt: db ? serverTimestamp() : new Date().toISOString(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      items: Object.entries(cart).map(([id, qty]) => ({
        id: parseInt(id),
        name: ITEMS.find(i => i.id === parseInt(id))?.name || 'Unknown',
        qty: qty,
        price: ITEMS.find(i => i.id === parseInt(id))?.price || 0
      })),
      customItems: customItems // Item manual disimpan ke payload
    };

    if (!db) {
      const existing = JSON.parse(localStorage.getItem(`saga_rentals_${appId}`) || '[]');
      localStorage.setItem(`saga_rentals_${appId}`, JSON.stringify([payload, ...existing]));
      alert(`Invoice ${invId} Tersimpan (Lokal)`);
    } else {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'saga_rentals'), payload);
        alert(`Invoice ${invId} Tersimpan di Cloud`);
      } catch (e) { console.error(e); }
    }
    setIsSaving(false);
  };

  const handleSaveDamage = async () => {
    if (!damageInvoiceRef) return alert("Nomor Invoice wajib diisi");
    if (damageItems.length === 0) return alert("Daftar kerusakan belum diisi");
    
    setIsSaving(true);
    const damageTotal = damageItems.reduce((acc, item) => acc + item.cost, 0);
    const payload = {
      invoiceId: `DMG-${damageInvoiceRef}`,
      refInvoice: damageInvoiceRef,
      total: damageTotal,
      type: 'damage',
      createdAt: db ? serverTimestamp() : new Date().toISOString(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      damageItems: damageItems
    };

    if (!db) {
      const existing = JSON.parse(localStorage.getItem(`saga_rentals_${appId}`) || '[]');
      localStorage.setItem(`saga_rentals_${appId}`, JSON.stringify([payload, ...existing]));
    } else {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'saga_rentals'), payload);
      } catch (e) { console.error(e); }
    }
    alert("Data Ganti Rugi Berhasil Disimpan");
    setDamageItems([]);
    setDamageInvoiceRef('');
    setIsSaving(false);
  };

  // --- DASHBOARD ---
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
          <DashboardCard 
            title="Sewa / Buat Invoice"
            desc="Katalog alat & billing otomatis"
            icon={<Tent size={24}/>}
            color="bg-emerald-900"
            onClick={() => setSubView('catalog')}
          />
          <DashboardCard 
            title="Denda & Ganti Rugi"
            desc="Kalkulasi kerusakan gear"
            icon={<Calculator size={24}/>}
            color="bg-orange-800"
            onClick={() => setSubView('damage')}
          />
          <DashboardCard 
            title="S&K Penyewaan"
            desc="Aturan & jaminan sewa"
            icon={<ShieldCheck size={24}/>}
            color="bg-stone-800"
            onClick={() => setSubView('terms')}
          />
          <DashboardCard 
            title="Rekap & Pembelian"
            desc="Laporan bulanan & pengadaan"
            icon={<BarChart3 size={24}/>}
            color="bg-stone-900"
            onClick={() => setSubView('recap')}
          />
        </div>
      </div>
    );
  }

  // --- TERMS VIEW ---
  if (subView === 'terms') {
    return (
      <div className="p-8 space-y-6 bg-stone-50 min-h-screen animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Terms of Service</h2>
           <div className="w-10"></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tighter">Syarat & Ketentuan</h3>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-2">SAGA Adventure Gear Rental</p>
          </div>

          <div className="space-y-4">
            {TERMS_AND_CONDITIONS.map((term, idx) => (
              <div key={idx} className="flex gap-4">
                <span className="text-[10px] font-black text-stone-900 min-w-[1.5rem] h-6 flex items-center justify-center bg-stone-100 rounded-lg">{idx + 1}</span>
                <p className="text-[11px] leading-relaxed text-stone-600 font-medium">{term}</p>
              </div>
            ))}
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-dashed border-stone-200">
             <div className="flex items-center gap-2 mb-2">
               <AlertTriangle size={14} className="text-orange-600"/>
               <h4 className="text-[10px] font-black text-stone-900 uppercase">Penting</h4>
             </div>
             <p className="text-[10px] text-stone-500 leading-relaxed italic">
               Dengan menyewa peralatan di SAGA Adventure, penyewa dianggap telah membaca, memahami, dan menyetujui seluruh butir syarat dan ketentuan di atas tanpa paksaan.
             </p>
          </div>
        </div>
      </div>
    );
  }

  // --- DAMAGE VIEW ---
  if (subView === 'damage') {
    return (
      <div className="p-8 space-y-6 bg-stone-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Damage Control</h2>
           <div className="w-10"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-2">Referensi No. Invoice</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                type="text"
                placeholder="INV-XXXXXX"
                className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200"
                value={damageInvoiceRef}
                onChange={e => setDamageInvoiceRef(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="h-px bg-stone-100"></div>
          <div className="space-y-4">
             <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Barang Rusak / Hilang</h3>
             <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Nama Barang" 
                  className="bg-stone-50 rounded-xl px-4 py-3 text-[10px] font-bold outline-none"
                  value={newCustomName}
                  onChange={e => setNewCustomName(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="Biaya Ganti (Rp)" 
                  className="bg-stone-50 rounded-xl px-4 py-3 text-[10px] font-bold outline-none"
                  value={newCustomPrice}
                  onChange={e => setNewCustomPrice(e.target.value)}
                />
             </div>
             <button 
               onClick={() => {
                 if(!newCustomName || !newCustomPrice) return;
                 setDamageItems([...damageItems, {name: newCustomName, cost: parseInt(newCustomPrice), note: ''}]);
                 setNewCustomName(''); setNewCustomPrice('');
               }}
               className="w-full bg-orange-800 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] shadow-lg"
             >
               + Tambah Ganti Rugi
             </button>
          </div>
          {damageItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-dashed border-stone-200">
               {damageItems.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-orange-50/50 p-4 rounded-xl">
                    <div>
                       <p className="text-[10px] font-bold uppercase">{item.name}</p>
                       <p className="text-[9px] text-orange-700 font-black tracking-tight">Rp{item.cost.toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => setDamageItems(damageItems.filter((_, i) => i !== idx))} className="text-stone-300 hover:text-red-500">
                       <Trash2 size={14} />
                    </button>
                 </div>
               ))}
               <div className="bg-stone-900 text-white p-6 rounded-2xl flex justify-between items-center mt-6">
                  <span className="text-[9px] font-black uppercase tracking-widest">Total Bayar Ganti</span>
                  <span className="text-xl font-black">Rp{damageItems.reduce((a,b)=>a+b.cost, 0).toLocaleString('id-ID')}</span>
               </div>
               <button 
                 disabled={isSaving}
                 onClick={handleSaveDamage}
                 className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl flex items-center justify-center gap-2"
               >
                 <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Finalisasi & Simpan'}
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RECAP VIEW ---
  if (subView === 'recap') {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const filteredRecap = recapData.filter(item => item.month === selectedMonth && item.year === selectedYear);
    const incomeRental = filteredRecap.filter(i => i.type === 'rental').reduce((a,b)=>a+b.total, 0);
    const incomeDamage = filteredRecap.filter(i => i.type === 'damage').reduce((a,b)=>a+b.total, 0);
    
    const replacementList = filteredRecap
      .filter(i => i.type === 'damage')
      .flatMap(i => i.damageItems || []);

    return (
      <div className="p-8 space-y-6 bg-white min-h-screen">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Management Recap</h2>
           <div className="w-10"></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
           {months.map((m, idx) => (
             <button 
               key={idx} 
               onClick={() => setSelectedMonth(idx)}
               className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${selectedMonth === idx ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-300 border-stone-100'}`}
             >
               {m}
             </button>
           ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block mb-2">Omzet Sewa</span>
              <p className="text-lg font-black text-emerald-900">Rp{incomeRental.toLocaleString('id-ID')}</p>
           </div>
           <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
              <span className="text-[8px] font-black text-orange-900/40 uppercase tracking-widest block mb-2">Dana Ganti Rugi</span>
              <p className="text-lg font-black text-orange-900">Rp{incomeDamage.toLocaleString('id-ID')}</p>
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
             <ShoppingCart size={14} className="text-stone-400"/>
             <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">List Pengadaan / Penggantian</h3>
           </div>
           {replacementList.length === 0 ? (
             <p className="text-[9px] text-stone-300 italic">Tidak ada pengadaan barang baru bulan ini.</p>
           ) : (
             <div className="bg-stone-50 p-6 rounded-[2rem] space-y-4 border border-stone-100">
                {replacementList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-stone-200 pb-3 last:border-0">
                    <span className="text-[10px] font-bold uppercase">{item.name}</span>
                    <span className="text-[10px] font-black text-orange-800">Rp{item.cost.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between items-center text-stone-900">
                  <span className="text-[9px] font-black uppercase">Estimasi Budget Beli</span>
                  <span className="text-sm font-black">Rp{incomeDamage.toLocaleString('id-ID')}</span>
                </div>
             </div>
           )}
        </div>

        <div className="space-y-4 pt-4">
           <h3 className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] mb-4">Transaksi Terakhir</h3>
           {filteredRecap.map((item, idx) => (
             <div key={idx} className="bg-white border border-stone-50 p-5 rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex-1">
                  <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.type === 'rental' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                    {item.type}
                  </span>
                  <h4 className="font-bold text-[10px] mt-2 text-stone-800">{item.invoiceId}</h4>
                  {item.customItems && item.customItems.length > 0 && (
                    <p className="text-[8px] text-stone-400 font-bold uppercase mt-1">+ {item.customItems.length} Add-ons</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-900 text-sm">Rp{item.total.toLocaleString('id-ID')}</p>
                  <p className="text-[8px] text-stone-300 font-bold">{new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleDateString()}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  // --- INVOICE VIEW ---
  if (subView === 'invoice') {
    return (
      <div className="bg-stone-200 min-h-screen pb-20 font-sans relative">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shadow-sm z-50 print:hidden">
          <button onClick={() => setSubView('catalog')} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="text-emerald-800"/>
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Preview Invoice</span>
          <div className="w-8"></div>
        </div>

        {/* Invoice Paper */}
        <div className="m-4 bg-[#fdfbf7] shadow-xl text-sm relative overflow-hidden rounded-sm border border-stone-300">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
            <span className="text-[10vw] font-normal tracking-[0.5em] uppercase whitespace-nowrap">SAGA ADVENTURE</span>
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
                <BrandLogo size={10} color="#064e3b" />
              </div>
              <div className="text-right">
                <div className="bg-stone-100 p-2 rounded border border-stone-200">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">No. Ref</p>
                  <p className="font-mono font-bold text-emerald-800">{activeInvoiceId || 'GEN-ID'}</p>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 uppercase">Tanggal</p>
                <p className="font-bold text-stone-700">{new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <div className="mb-8 bg-stone-50 p-5 rounded-lg border border-stone-200 shadow-sm">
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Penyewa</label>
                <input 
                  type="text" 
                  placeholder="NAMA LENGKAP" 
                  className="w-full bg-transparent text-lg font-bold border-b-2 border-stone-300 focus:border-emerald-600 focus:outline-none py-1 text-stone-800 uppercase"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block flex items-center gap-1"><Phone size={10}/> No. HP</label>
                <input 
                  type="tel" 
                  placeholder="08..." 
                  className="w-full bg-transparent border-b-2 border-stone-300 focus:border-emerald-600 focus:outline-none font-mono font-bold text-stone-700 text-sm py-1"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Ambil</label>
                   <input type="date" className="w-full text-xs font-bold bg-white border border-stone-300 rounded px-2 py-1" value={pickupDate} onChange={e => setPickupDate(e.target.value)}/>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Kembali</label>
                   <input type="date" min={pickupDate} className="w-full text-xs font-bold bg-white border border-stone-300 rounded px-2 py-1" value={returnDate} onChange={e => setReturnDate(e.target.value)}/>
                </div>
              </div>
              <div className="flex justify-between items-center bg-emerald-50 px-3 py-2 rounded text-emerald-900 border border-emerald-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wide">Durasi</span>
                <span className="font-black text-lg">{duration} <span className="text-xs font-medium">Hari</span></span>
              </div>

              <div className="flex justify-between items-center bg-red-50 px-3 py-2 rounded text-red-900 border border-red-100 print:hidden">
                <div className="flex items-center gap-2">
                   <Clock size={14} className="text-red-700" />
                   <span className="text-[10px] font-bold uppercase tracking-wide">Terlambat (Jam)</span>
                </div>
                <div className="flex items-center gap-1">
                   <input 
                     type="number" 
                     className="w-12 bg-white border border-red-200 rounded text-center font-bold text-sm focus:outline-none"
                     value={lateHours}
                     onChange={(e) => setLateHours(Math.max(0, parseInt(e.target.value) || 0))}
                   />
                </div>
              </div>
            </div>

            {/* Table Equipment */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-stone-400 mb-2 tracking-widest uppercase flex items-center gap-2">
                <Tent size={12}/> Equipment List
              </h3>
              <table className="w-full text-xs">
                <thead className="border-b-2 border-stone-300 text-stone-500 uppercase">
                  <tr>
                    <th className="text-left py-2">Gear</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-stone-700">
                  {Object.entries(cart).map(([id, qty], idx) => {
                    const item = ITEMS.find(i => i.id === parseInt(id));
                    return (
                      <tr key={id} className="border-b border-stone-100">
                        <td className="py-3 font-bold uppercase tracking-tight">{item?.name}</td>
                        <td className="text-center py-3">{qty}</td>
                        <td className="text-right py-3 font-bold">Rp{((item?.price || 0) * (qty as number) * duration).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Add-ons (Kembali Ditampilkan) */}
            <div className="mb-8">
              {customItems.length > 0 && (
                <>
                  <h3 className="text-xs font-black text-stone-400 mb-2 tracking-widest uppercase flex items-center gap-2">
                     <PackagePlus size={12} /> Add-ons / Manual
                  </h3>
                  <table className="w-full text-xs">
                    <tbody className="text-stone-700">
                      {customItems.map((item, index) => (
                        <tr key={item.id} className="border-b border-stone-100 bg-orange-50/20">
                          <td className="py-3 pl-2 font-bold text-orange-900 uppercase tracking-tight">{item.name}</td>
                          <td className="text-center py-3 w-16">{item.qty}</td>
                          <td className="text-right py-3 pr-2 font-bold text-orange-900">Rp{(item.price * item.qty).toLocaleString('id-ID')}</td>
                          <td className="text-center w-8 print:hidden">
                            <button onClick={() => removeCustomItem(index)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={12}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Form Input Item Manual */}
              <div className="bg-transparent p-4 rounded-2xl border-2 border-stone-100 border-dashed print:hidden mt-4">
                <p className="text-[9px] font-black text-stone-400 mb-3 flex items-center gap-1 uppercase tracking-widest">
                  + Input Item Manual
                </p>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Nama Barang..." 
                    className="flex-[2] text-[10px] font-bold bg-white border border-stone-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Harga" 
                    className="flex-1 text-[10px] font-bold bg-white border border-stone-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newCustomPrice}
                    onChange={(e) => setNewCustomPrice(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    className="w-12 text-[10px] font-bold bg-white border border-stone-200 rounded-xl px-1 py-2 outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                    value={newCustomQty}
                    onChange={(e) => setNewCustomQty(parseInt(e.target.value) || 1)}
                  />
                </div>
                <button 
                  onClick={addCustomItem}
                  className="w-full bg-stone-900 text-white text-[9px] py-2 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md"
                >
                  Tambah Add-on
                </button>
              </div>
            </div>

            {/* Billing Summary */}
            <div className="w-full bg-stone-900 p-6 rounded-[2rem] text-white space-y-2 shadow-xl">
                <div className="flex justify-between text-white/40 text-[9px] font-bold uppercase tracking-widest">
                  <span>Subtotal Sewa</span>
                  <span>Rp{rentalTotal.toLocaleString('id-ID')}</span>
                </div>
                {customItemsTotal > 0 && (
                  <div className="flex justify-between text-orange-400 text-[9px] font-bold uppercase tracking-widest">
                    <span>Add-ons / Manual</span>
                    <span>+ Rp{customItemsTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {lateFee > 0 && (
                  <div className="flex justify-between text-red-400 text-[9px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><AlertTriangle size={10} /> Denda ({lateHours} Jam)</span>
                    <span>+ Rp{lateFee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-white/10 my-3 border-dashed"></div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs uppercase tracking-[0.2em] text-white/60">Total Bayar</span>
                  <span className="font-black text-2xl tracking-tighter">Rp{grandTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            {/* Syarat & Ketentuan Minimalis di Invoice */}
            <div className="mt-8 border-t border-stone-200 pt-6">
               <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Syarat & Ketentuan (Singkat):</h4>
               <ul className="text-[8px] text-stone-500 space-y-1 font-medium list-disc ml-3 uppercase">
                 <li>Identitas asli (KTP/SIM) wajib ditinggal sebagai jaminan.</li>
                 <li>Gear dikembalikan dalam kondisi bersih, kering, dan lengkap.</li>
                 <li>Segala kerusakan/kehilangan menjadi tanggung jawab penuh penyewa.</li>
                 <li>Denda keterlambatan 5% per jam dari total tarif harian.</li>
               </ul>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs text-stone-500">
               <div>
                 <p className="mb-12 font-bold uppercase tracking-wide">Penyewa</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-2 italic uppercase font-bold text-stone-900 leading-none">{customerName || '....................'}</p>
                 {customerPhone && <p className="text-[8px] font-mono mt-1 opacity-40">{customerPhone}</p>}
               </div>
               <div>
                 <p className="mb-12 font-bold uppercase tracking-wide">SAGA Adventure</p>
                 <div className="border-b border-stone-300 mx-8"></div>
                 <p className="mt-2 italic leading-none">Authorized Crew</p>
               </div>
            </div>
            
            <div className="mt-10 pt-4 border-t-2 border-stone-100 text-[8px] text-stone-300 text-center leading-relaxed uppercase tracking-widest font-bold">
              * KEEP THE NATURE CLEAN - JAGA ALAM TETAP BERSIH *
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 max-w-md mx-auto print:hidden shadow-lg z-50">
          <button onClick={() => setSubView('catalog')} className="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-bold uppercase text-[10px]">Kembali</button>
          <button disabled={isSaving} onClick={handleSaveRental} className="flex-1 bg-orange-700 text-white py-3 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 shadow-md">
            <Save size={14}/> {isSaving ? 'Saving...' : 'Simpan Transaksi'}
          </button>
          <button onClick={() => window.print()} className="flex-1 bg-emerald-900 text-white py-3 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 shadow-md">
            <Printer size={14}/> Print / PDF
          </button>
        </div>
      </div>
    );
  }

  // --- CATALOG ---
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <div className="p-6 bg-emerald-900 text-white flex items-center justify-between shadow-lg">
        <button onClick={() => setSubView('dashboard')} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={18}/></button>
        <BrandLogo size={10} color="white" />
        <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl"><Tent size={16} /></div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Equip Selection</h3>
             <ChevronDown size={14} className="text-stone-300"/>
           </div>
           <div className="space-y-3">
             {ITEMS.map(item => {
               const qty = cart[item.id] || 0;
               return (
                 <div key={item.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white border-stone-100'}`}>
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
        </div>
      </div>
      {totalItemsCount > 0 && (
        <div className="p-8 bg-white border-t border-stone-100 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-end mb-6">
             <div className="flex flex-col">
               <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1">Billing Value</span>
               <span className="text-3xl font-black text-stone-900 tracking-tighter">Rp{totalPerDay.toLocaleString('id-ID')}</span>
             </div>
             <div className="text-[10px] font-black text-emerald-900 uppercase italic">{totalItemsCount} Gear</div>
          </div>
          <button onClick={handleOpenInvoice} className="w-full bg-emerald-900 text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors shadow-2xl">
            <Receipt size={16}/> Lanjut Ke Invoice
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`${color} w-full p-8 rounded-[2rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md`}
  >
    <div>
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{desc}</p>
    </div>
  </button>
);

export default RentalPage;
