
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { 
  ChevronLeft, Minus, Plus, 
  Printer, ShoppingBag, 
  BarChart3, ShoppingCart, User,
  History, Wallet, PlusSquare, X,
  RefreshCw, Trash2,
  CheckCircle2, 
  TrendingUp, Box,
  Layers, Edit3,
  PlusCircle, LayoutGrid,
  Loader2, Shirt, Watch, Mountain,
  Crown, ChevronRight, Landmark, Info,
  Lock, KeyRound, ShieldAlert,
  Ticket, Users, Banknote, ScanLine, Search,
  QrCode, BadgeCheck, Clock
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { db, appId } from '../services/firebase';

const DEFAULT_CATALOG = [
  { id: 101, name: "SAGA Classic Tee", price: 120000, tag: "APPAREL" },
  { id: 102, name: "SAGA Cap v2", price: 85000, tag: "ACCESSORIES" },
  { id: 103, name: "SAGA Sticker Pack", price: 15000, tag: "ACCESSORIES" },
  { id: 104, name: "SAGA Enamel Mug", price: 45000, tag: "GEAR OUTDOOR" },
  { id: 105, name: "SAGA Premium Hoodie", price: 275000, tag: "APPAREL" },
  { id: 106, name: "SAGA Totebag", price: 35000, tag: "ACCESSORIES" },
];

const MASTER_PIN = "2026";
const TICKET_CUT = 10000;

interface MerchPageProps {
  onBack: () => void;
}

type MerchSubView = 'dashboard' | 'pos' | 'invoice' | 'recap' | 'manage_catalog' | 'kas' | 'redemption_hub';

const MerchPage: React.FC<MerchPageProps> = ({ onBack }) => {
  const [subView, setSubView] = useState<MerchSubView>('dashboard');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [selectedRecapItem, setSelectedRecapItem] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState({ name: '', price: '', tag: 'APPAREL' });

  // PIN Protection States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'catalog' | 'spending' | 'invoice' | 'redemption', id: string, extraId?: number} | null>(null);

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  // Data State
  const [salesData, setSalesData] = useState<any[]>([]);
  const [spendingHistory, setSpendingHistory] = useState<any[]>([]);
  const [tripTasks, setTripTasks] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [showAddSpending, setShowAddSpending] = useState(false);
  const [spendingForm, setSpendingForm] = useState({
    item: '', amount: '', 
    date: new Date().toISOString().split('T')[0], 
    category: 'stock' as 'stock' | 'ops'
  });

  // Redemption State
  const [redemptionInput, setRedemptionInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isDemoMode = !db;

  const safeParse = (data: string | null) => {
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    setIsCatalogLoading(true);
    if (isDemoMode) {
      const savedCatalog = localStorage.getItem(`saga_merch_catalog_${appId}`);
      if (savedCatalog) setCatalogItems(safeParse(savedCatalog));
      else {
        setCatalogItems(DEFAULT_CATALOG);
        localStorage.setItem(`saga_merch_catalog_${appId}`, JSON.stringify(DEFAULT_CATALOG));
      }
      
      setSalesData(safeParse(localStorage.getItem(`saga_merch_sales_${appId}`)));
      setSpendingHistory(safeParse(localStorage.getItem(`saga_merch_spending_${appId}`)));
      setTripTasks(safeParse(localStorage.getItem(`saga_tasks_${appId}`)));
      setTrips(safeParse(localStorage.getItem(`saga_trips_${appId}`)));
      setRedemptions(safeParse(localStorage.getItem(`saga_merch_redemptions_${appId}`)));
      
      setIsCatalogLoading(false);
      return;
    }

    const unsubCatalog = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_catalog')
      .onSnapshot(async (s) => {
        if (s.empty) {
          const batch = db!.batch();
          DEFAULT_CATALOG.forEach(item => {
            const docRef = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_catalog').doc();
            batch.set(docRef, item);
          });
          await batch.commit();
        } else {
          setCatalogItems(s.docs.map(d => ({ fireId: d.id, ...d.data() })));
        }
        setIsCatalogLoading(false);
      });

    const unsubSales = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_sales')
      .orderBy('createdAt', 'desc')
      .onSnapshot(s => setSalesData(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubSpending = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_spending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(s => setSpendingHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubTasks = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks')
      .onSnapshot(s => setTripTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubTrips = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_trips')
      .onSnapshot(s => setTrips(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubRedemptions = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_redemptions')
      .orderBy('redeemedAt', 'desc')
      .onSnapshot(s => setRedemptions(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubCatalog(); unsubSales(); unsubSpending(); unsubTasks(); unsubTrips(); unsubRedemptions(); };
  }, [isDemoMode]);

  const calculateSharing = (total: number) => {
    const royalty = Math.round(total * 0.05);
    const crew1 = Math.round(total * 0.05);
    const crew2 = Math.round(total * 0.05);
    const unitNet = total - royalty - crew1 - crew2; // 85%
    return { royalty, crew1, crew2, unitNet };
  };

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return;
    setIsSaving(true);
    const invId = `SAGA-M-${Date.now().toString().slice(-6)}`;
    const items = Object.entries(cart).map(([id, qty]) => {
      const item = catalogItems.find(i => i.id === parseInt(id));
      return { ...item, qty };
    });
    const total = items.reduce((acc, curr: any) => acc + (curr.price * curr.qty), 0);
    const payload = {
      invoiceId: invId,
      customer: customerName || 'General Customer',
      items,
      total,
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
    };

    try {
      if (isDemoMode) {
        const updated = [payload, ...salesData];
        setSalesData(updated);
        localStorage.setItem(`saga_merch_sales_${appId}`, JSON.stringify(updated));
      } else {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_sales').add(payload);
      }
      setActiveInvoice(payload);
      setSubView('invoice');
      setCart({});
      setCustomerName('');
    } catch (e) { alert("Checkout gagal"); } finally { setIsSaving(false); }
  };

  const handleAddSpending = async () => {
    if (!spendingForm.item || !spendingForm.amount) return alert("Lengkapi data!");
    const data = {
      ...spendingForm,
      amount: parseInt(spendingForm.amount.toString()),
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };
    try {
      if (isDemoMode) {
        const updated = [data, ...spendingHistory];
        setSpendingHistory(updated);
        localStorage.setItem(`saga_merch_spending_${appId}`, JSON.stringify(updated));
      } else {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_spending').add(data);
      }
      setSpendingForm({ item: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'stock' });
      setShowAddSpending(false);
    } catch (e) { alert("Gagal"); }
  };

  const handleRedeemTicket = async () => {
    if (!redemptionInput) return alert("Input ID Tiket!");
    
    const upperInput = redemptionInput.trim().toUpperCase();
    const validTicket = tripTasks.find(t => t.category === 'peserta' && t.ticketId?.toUpperCase() === upperInput);
    
    if (!validTicket) return alert("ID Tiket tidak ditemukan di manifest!");
    if (redemptions.some(r => r.ticketId?.toUpperCase() === upperInput)) return alert("Tiket sudah pernah di-redeem!");

    setIsRedeeming(true);
    const payload = {
      ticketId: upperInput,
      redeemedAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      participantName: validTicket.task,
      amount: TICKET_CUT,
      tripName: trips.find(t => t.id === validTicket.tripId)?.name || 'Trip Umum'
    };

    try {
      if (isDemoMode) {
        const updated = [payload, ...redemptions];
        setRedemptions(updated);
        localStorage.setItem(`saga_merch_redemptions_${appId}`, JSON.stringify(updated));
      } else {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_redemptions').add(payload);
      }
      setRedemptionInput('');
      alert(`Sukses! ${validTicket.task} (${upperInput}) Berhasil di-redeem.`);
    } catch (e) {
      alert("Gagal melakukan redemption.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const triggerDelete = (type: 'catalog' | 'spending' | 'invoice' | 'redemption', id: string, extraId?: number) => {
    setPendingAction({ type, id, extraId });
    setPinInput('');
    setPinError(false);
    setShowPinModal(true);
  };

  const handleVerifyPin = async () => {
    if (pinInput === MASTER_PIN) {
      if (pendingAction) {
        switch(pendingAction.type) {
          case 'spending': await executeDeleteSpending(pendingAction.id, pendingAction.extraId!); break;
          case 'catalog': await executeDeleteCatalogItem(pendingAction.id, pendingAction.extraId!); break;
          case 'invoice': await executeDeleteInvoice(pendingAction.id); break;
          case 'redemption': await executeDeleteRedemption(pendingAction.id, pendingAction.extraId!); break;
        }
      }
      setShowPinModal(false);
      setPendingAction(null);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  const executeDeleteRedemption = async (fireId: string, idx: number) => {
    if (isDemoMode) {
      const updated = redemptions.filter((_, i) => i !== idx);
      setRedemptions(updated);
      localStorage.setItem(`saga_merch_redemptions_${appId}`, JSON.stringify(updated));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_redemptions').doc(fireId).delete();
    }
  };

  const executeDeleteSpending = async (fireId: string, idx: number) => {
    if (isDemoMode) {
      const updated = spendingHistory.filter((_, i) => i !== idx);
      setSpendingHistory(updated);
      localStorage.setItem(`saga_merch_spending_${appId}`, JSON.stringify(updated));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_spending').doc(fireId).delete();
    }
  };

  const executeDeleteCatalogItem = async (fireId: string | undefined, id: number) => {
    if (isDemoMode) {
      const updated = catalogItems.filter(item => item.id !== id);
      setCatalogItems(updated);
      localStorage.setItem(`saga_merch_catalog_${appId}`, JSON.stringify(updated));
    } else if (fireId) {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_catalog').doc(fireId).delete();
    }
  };

  const executeDeleteInvoice = async (id: string) => {
    if (isDemoMode) {
      const updated = salesData.filter(s => s.invoiceId !== id);
      setSalesData(updated);
      localStorage.setItem(`saga_merch_sales_${appId}`, JSON.stringify(updated));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_sales').doc(id).delete();
    }
  };

  const handleUpdatePrice = async (id: number, fireId?: string) => {
    const newPrice = parseInt(editPriceValue);
    if (isNaN(newPrice)) return;
    if (isDemoMode) {
      const updated = catalogItems.map(item => item.id === id ? { ...item, price: newPrice } : item);
      setCatalogItems(updated);
      localStorage.setItem(`saga_merch_catalog_${appId}`, JSON.stringify(updated));
    } else if (fireId) {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_catalog').doc(fireId).update({ price: newPrice });
    }
    setEditingItemId(null);
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

  const groupedItems = () => {
    const categories = ["APPAREL", "ACCESSORIES", "GEAR OUTDOOR"];
    const grouped: Record<string, any[]> = { "APPAREL": [], "ACCESSORIES": [], "GEAR OUTDOOR": [], "OTHER": [] };
    catalogItems.forEach(item => {
      const tag = item.tag?.toUpperCase() || 'OTHER';
      if (categories.includes(tag)) grouped[tag].push(item);
      else grouped["OTHER"].push(item);
    });
    return grouped;
  };

  const renderPinModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-300 ${pinError ? 'animate-shake border-rose-200' : ''}`}>
         <div className="bg-rose-950 p-10 text-white text-center">
            <div className="p-4 bg-white/10 rounded-full w-fit mx-auto mb-6">
              <ShieldAlert size={32} className={pinError ? 'text-rose-400' : 'text-amber-400'} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Otoritas PIN</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Konfirmasi Penghapusan Data</p>
         </div>
         <div className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest block text-center mb-2">PIN Master</label>
              <input 
                type="password" autoFocus maxLength={4}
                className={`w-full bg-stone-50 border-none rounded-[1.5rem] py-5 px-4 text-2xl font-black text-center tracking-[1em] outline-none transition-all ${pinError ? 'ring-2 ring-rose-100 text-rose-600' : 'focus:ring-2 focus:ring-stone-100'}`}
                placeholder="••••" value={pinInput} onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => { setShowPinModal(false); setPendingAction(null); }} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50">Batal</button>
               <button onClick={handleVerifyPin} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white bg-rose-600">Verifikasi</button>
            </div>
         </div>
      </div>
    </div>
  );

  if (subView === 'dashboard') {
    return (
      <div className="p-8 space-y-6 bg-white min-h-screen animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-12">
           <button onClick={onBack} className="p-3 bg-stone-50 rounded-full text-stone-900"><ChevronLeft size={18}/></button>
           <BrandLogo size={10} color="#1c1917" />
           <div className="w-10"></div>
        </div>
        <div className="space-y-4">
          <DashboardCard title="Point of Sale (POS)" desc="Katalog & Transaksi Kasir" icon={<ShoppingCart size={24}/>} color="bg-stone-900" onClick={() => setSubView('pos')} />
          <DashboardCard title="Kas & Saldo Merch" desc="Saldo bersih & log belanja stok" icon={<Wallet size={24}/>} color="bg-indigo-900" onClick={() => setSubView('kas')} />
          <DashboardCard title="Saldo Redemption" desc="Hasil Rp10.000 / Tiket Terjual" icon={<Ticket size={24}/>} color="bg-violet-800" onClick={() => setSubView('redemption_hub')} />
          <DashboardCard title="Master Katalog" desc="Input item & Update harga" icon={<LayoutGrid size={24}/>} color="bg-stone-800" onClick={() => setSubView('manage_catalog')} />
          <DashboardCard title="Laporan & Rekap" desc="Audit profit & rincian royalti" icon={<BarChart3 size={24}/>} color="bg-stone-700" onClick={() => setSubView('recap')} />
        </div>
      </div>
    );
  }

  if (subView === 'redemption_hub') {
    const participantsWithTickets = tripTasks.filter(t => t.category === 'peserta' && t.ticketId);
    const totalPotentialBalance = participantsWithTickets.length * TICKET_CUT;
    const totalRedeemedAmount = redemptions.length * TICKET_CUT;
    const currentRedemptionBalance = totalPotentialBalance - totalRedeemedAmount;

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-24">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Redemption Distribution Hub</h2>
           <div className="w-10"></div>
        </div>

        <div className="bg-violet-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.5em] block mb-2">Available Redemption Balance</span>
                <p className="text-5xl font-black font-mono tracking-tighter leading-none">Rp{currentRedemptionBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Potensial</p>
                   <p className="text-sm font-black text-white/80 font-mono">Rp{totalPotentialBalance.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Telah Di-Redeem</p>
                   <p className="text-sm font-black text-rose-400 font-mono">Rp{totalRedeemedAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
           </div>
           <Banknote size={180} className="absolute -right-12 -bottom-12 opacity-[0.03]" />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-4">
           <div className="flex items-center gap-2 mb-2"><ScanLine size={14} className="text-violet-500" /><h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Input Redeem Ticket</h3></div>
           <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                <input 
                  type="text" placeholder="ID TIKET (SAGA-TIX-...)" 
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-6 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-violet-100"
                  value={redemptionInput} onChange={e => setRedemptionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRedeemTicket()}
                />
              </div>
              <button onClick={handleRedeemTicket} disabled={isRedeeming} className="bg-violet-700 text-white px-8 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50">{isRedeeming ? <RefreshCw className="animate-spin" size={18}/> : <Plus size={20}/>}</button>
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-4">
              <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2"><Layers size={14} className="text-stone-300" /> Participant Manifest</h3>
              <div className="space-y-3">
                 {participantsWithTickets.length === 0 ? (
                   <div className="py-12 text-center opacity-10"><Info size={32} className="mx-auto"/><p className="text-[9px] font-black uppercase mt-2">Belum ada tiket terdaftar</p></div>
                 ) : (
                   participantsWithTickets.map((p, idx) => {
                     const isRedeemed = redemptions.some(r => r.ticketId?.toUpperCase() === p.ticketId?.toUpperCase());
                     return (
                       <div key={idx} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-2xl ${isRedeemed ? 'bg-violet-100 text-violet-600' : 'bg-emerald-50 text-emerald-500'}`}>{isRedeemed ? <BadgeCheck size={18}/> : <Ticket size={18}/>}</div>
                             <div>
                                <h4 className="text-[11px] font-black text-stone-900 uppercase leading-none">{p.task}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={`text-[8px] font-black uppercase tracking-widest ${isRedeemed ? 'text-violet-400' : 'text-emerald-500'}`}>{p.ticketId}</span>
                                   <span className="text-stone-200">/</span>
                                   <span className="text-[8px] font-bold text-stone-300 uppercase truncate max-w-[100px]">{trips.find(t => t.id === p.tripId)?.name || 'Trip Umum'}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-[10px] font-black font-mono ${isRedeemed ? 'text-rose-400 line-through opacity-50' : 'text-emerald-600'}`}>+Rp{TICKET_CUT.toLocaleString('id-ID')}</p>
                             <span className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${isRedeemed ? 'bg-violet-50 text-violet-600' : 'bg-stone-50 text-stone-300'}`}>{isRedeemed ? 'REDEEMED' : 'AVAILABLE'}</span>
                          </div>
                       </div>
                     );
                   })
                 )}
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2"><Clock size={14} className="text-stone-300" /> Recent Redemption Log</h3>
              <div className="space-y-3">
                 {redemptions.length === 0 ? (
                   <div className="py-12 text-center opacity-10 border border-dashed rounded-[2rem] border-stone-200"><p className="text-[9px] font-black uppercase">Belum ada aktivitas</p></div>
                 ) : (
                   redemptions.map((r, idx) => (
                     <div key={idx} className="bg-violet-50/50 p-6 rounded-[2rem] border border-violet-100 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md"><BadgeCheck size={14}/></div>
                           <div>
                              <p className="text-[11px] font-black text-violet-900 uppercase">{r.participantName}</p>
                              <p className="text-[8px] font-bold text-violet-400 uppercase tracking-widest">{r.ticketId} • {r.tripName}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-violet-900 font-mono">Rp{r.amount.toLocaleString('id-ID')}</p>
                              <p className="text-[7px] font-bold text-violet-300 uppercase">{new Date(r.redeemedAt?.seconds ? r.redeemedAt.seconds * 1000 : r.redeemedAt).toLocaleDateString()}</p>
                           </div>
                           <button onClick={() => triggerDelete('redemption', r.id, idx)} className="p-2 text-stone-100 hover:text-rose-500 group-hover:text-stone-300 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
        {showPinModal && renderPinModal()}
      </div>
    );
  }

  // --- KAS & SALDO VIEW ---
  if (subView === 'kas') {
    const filteredSales = salesData.filter(item => {
      const d = new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const filteredSpending = spendingHistory.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalNetKasIn = filteredSales.reduce((acc, curr) => acc + calculateSharing(curr.total).unitNet, 0);
    const totalSpending = filteredSpending.reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalNetKasIn - totalSpending;

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-24">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Merch Financial Hub</h2>
           <button onClick={() => setShowAddSpending(!showAddSpending)} className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${showAddSpending ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-indigo-700 border'}`}>
              {showAddSpending ? <X size={18}/> : <PlusSquare size={18}/>} 
              <span className="text-[8px] font-black uppercase tracking-widest">{showAddSpending ? 'Close' : 'Log Belanja'}</span>
           </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {months.map((m, idx) => (
             <button key={idx} onClick={() => setSelectedMonth(idx)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedMonth === idx ? 'bg-indigo-800 text-white border-indigo-800 shadow-lg' : 'bg-white text-stone-300 border-stone-100'}`}>{m}</button>
           ))}
        </div>

        <div className="bg-indigo-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] block mb-2">Sisa Saldo Kas Merch</span>
                <p className="text-5xl font-black font-mono tracking-tighter">Rp{currentBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-white/30 uppercase">Total Net Kas (85%)</p>
                   <p className="text-sm font-black text-emerald-400 font-mono">+Rp{totalNetKasIn.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[8px] font-black text-white/30 uppercase">Total Belanja/Ops</p>
                   <p className="text-sm font-black text-rose-400 font-mono">-Rp{totalSpending.toLocaleString('id-ID')}</p>
                </div>
              </div>
           </div>
           <Landmark size={180} className="absolute -right-12 -bottom-12 opacity-[0.03]" />
        </div>

        {showAddSpending && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4 border border-indigo-100 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-2 mb-2"><Box size={14} className="text-stone-300"/><h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Input Belanja Merchandise</h3></div>
             <input type="text" placeholder="MISAL: BELI STOK KAOS CLASSIC" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-100" value={spendingForm.item} onChange={e => setSpendingForm({...spendingForm, item: e.target.value})} />
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">Kategori</label>
                   <select className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none" value={spendingForm.category} onChange={e => setSpendingForm({...spendingForm, category: e.target.value as any})}>
                      <option value="stock">BELANJA STOK</option>
                      <option value="ops">OPERASIONAL</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">Nominal</label>
                   <input type="number" placeholder="Rp" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none" value={spendingForm.amount} onChange={e => setSpendingForm({...spendingForm, amount: e.target.value})} />
                </div>
             </div>
             <button onClick={handleAddSpending} className="w-full bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-all mt-4">Simpan Log Kas</button>
          </div>
        )}

        <div className="space-y-4">
           <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2 mb-2"><History size={14} className="text-stone-300" /> Log Transaksi Kas Merch</h3>
           <div className="space-y-3">
              {filteredSpending.length === 0 ? (
                <div className="py-12 text-center opacity-10"><Info size={32} className="mx-auto"/><p className="text-[9px] font-black uppercase mt-2">Belum ada pengeluaran kas</p></div>
              ) : (
                filteredSpending.map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex justify-between items-center shadow-sm group transition-all hover:border-indigo-200">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${s.category === 'stock' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                           {s.category === 'stock' ? <ShoppingCart size={18}/> : <RefreshCw size={18}/>}
                        </div>
                        <div>
                           <h4 className="text-[11px] font-black text-stone-900 uppercase">{s.item}</h4>
                           <p className="text-[8px] font-bold text-stone-300 uppercase mt-0.5">{s.category} • {s.date}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-rose-600 font-mono">-Rp{s.amount.toLocaleString('id-ID')}</p>
                        <button onClick={() => triggerDelete('spending', s.fireId, idx)} className="p-2 text-stone-100 hover:text-rose-300 group-hover:text-stone-300 transition-colors"><Trash2 size={16}/></button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
        {showPinModal && renderPinModal()}
      </div>
    );
  }

  if (subView === 'recap') {
    const filteredSales = salesData.filter(item => {
      const d = new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const totalOmzet = filteredSales.reduce((acc, curr) => acc + curr.total, 0);

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen pb-32 animate-in fade-in">
        <div className="flex items-center justify-between">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Merch Audit Center</h2>
           <div className="w-10"></div>
        </div>

        <div className="bg-stone-900 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group">
           <div className="relative z-10">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] block mb-2">Monthly Omzet Merchandise</span>
              <p className="text-4xl font-black font-mono tracking-tighter leading-none">Rp{totalOmzet.toLocaleString('id-ID')}</p>
              <div className="flex items-center gap-2 mt-4 opacity-50">
                 <TrendingUp size={12} className="text-emerald-400" />
                 <span className="text-[8px] font-black uppercase tracking-widest">{filteredSales.length} Transaksi Terdaftar</span>
              </div>
           </div>
           <BarChart3 size={150} className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {months.map((m, idx) => (
             <button key={idx} onClick={() => setSelectedMonth(idx)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedMonth === idx ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-300 border-stone-100'}`}>{m}</button>
           ))}
        </div>

        <div className="space-y-4">
           {filteredSales.length === 0 ? (
             <div className="py-24 text-center opacity-10"><BarChart3 size={64} className="mx-auto"/><p className="text-[10px] font-black uppercase mt-4">Belum ada data penjualan</p></div>
           ) : (
             filteredSales.map((item, idx) => {
               const sharing = calculateSharing(item.total);
               const isSelected = selectedRecapItem === item.invoiceId;
               return (
                 <div key={idx} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-8 flex justify-between items-center">
                       <div>
                          <p className="text-[7px] font-black text-stone-300 uppercase mb-1">{item.invoiceId} • {new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleDateString()}</p>
                          <h4 className="text-[12px] font-black text-stone-900 uppercase">{item.customer}</h4>
                       </div>
                       <div className="text-right">
                          <p className="text-[14px] font-black text-stone-900 font-mono">Rp{item.total.toLocaleString('id-ID')}</p>
                          <div className="flex items-center gap-3 justify-end mt-2">
                             <button onClick={() => triggerDelete('invoice', item.id)} className="p-2 text-stone-200 hover:text-rose-500 transition-colors"><Trash2 size={12}/></button>
                             <button onClick={() => setSelectedRecapItem(isSelected ? null : item.invoiceId)} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">{isSelected ? 'Hide' : 'Detail'} <ChevronRight size={10} className={isSelected ? 'rotate-90' : ''}/></button>
                          </div>
                       </div>
                    </div>
                    {isSelected && (
                      <div className="bg-stone-50 p-8 border-t border-stone-100 animate-in slide-in-from-top-4">
                         <div className="grid grid-cols-2 gap-4 mb-8">
                            <SharingCard label="Royalty (5%)" amount={sharing.royalty} icon={<Crown size={12}/>} />
                            <SharingCard label="Crew 1 (5%)" amount={sharing.crew1} icon={<User size={12}/>} />
                            <SharingCard label="Crew 2 (5%)" amount={sharing.crew2} icon={<User size={12}/>} />
                            <SharingCard label="Kas Merch (85%)" amount={sharing.unitNet} icon={<Wallet size={12}/>} isHighlight />
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-2">
                            {item.items.map((it: any, i: number) => (
                              <div key={i} className="flex justify-between text-[10px] font-bold text-stone-900 uppercase">
                                <span>{it.qty}x {it.name}</span>
                                <span className="text-stone-400">Rp{(it.price * it.qty).toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
               );
             })
           )}
        </div>
        {showPinModal && renderPinModal()}
      </div>
    );
  }

  if (subView === 'pos') {
    const grandTotal = Object.entries(cart).reduce((acc, [id, qty]) => {
      const item = catalogItems.find(i => i.id === parseInt(id));
      return acc + (item ? item.price * qty : 0);
    }, 0);
    const grouped = groupedItems();

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen pb-48 animate-in fade-in">
        <div className="flex items-center justify-between">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">SAGA Merch POS</h2>
           <div className="w-10"></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
           <input type="text" placeholder="NAMA PEMBELI" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-100" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        </div>
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, items]) => {
            if (items.length === 0) return null;
            const CategoryIcon = category === "APPAREL" ? Shirt : category === "ACCESSORIES" ? Watch : Mountain;
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                  <div className="p-2 bg-stone-900 text-white rounded-xl shadow-sm"><CategoryIcon size={14} /></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900">{category}</h3>
                </div>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.fireId || item.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex items-center justify-between shadow-sm transition-all hover:border-indigo-100">
                      <div className="flex-1">
                         <h4 className="text-[12px] font-black text-stone-900 uppercase leading-none">{item.name}</h4>
                         <p className="text-[10px] font-bold text-stone-400 mt-1 font-mono">Rp{item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-stone-50 p-1.5 rounded-2xl">
                         <button onClick={() => updateCart(item.id, -1)} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm"><Minus size={16}/></button>
                         <span className="text-[12px] font-black text-stone-900 w-6 text-center">{cart[item.id] || 0}</span>
                         <button onClick={() => updateCart(item.id, 1)} className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white active:scale-90 shadow-lg"><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-stone-100 z-40 max-w-md mx-auto">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Grand Total</p>
                <p className="text-xl font-black text-stone-900 font-mono">Rp{grandTotal.toLocaleString('id-ID')}</p>
              </div>
              <button onClick={handleCheckout} disabled={isSaving || grandTotal === 0} className="bg-indigo-900 text-white px-8 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                 {isSaving ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>} Checkout
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (subView === 'invoice' && activeInvoice) {
    const inv = activeInvoice;
    return (
      <div className="p-8 bg-stone-100 min-h-screen flex flex-col items-center">
        <div className="max-w-md w-full">
          <div className="flex justify-between items-center mb-8 print:hidden">
             <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm"><X size={18}/></button>
             <button onClick={() => window.print()} className="bg-stone-900 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Printer size={16}/> Print Nota</button>
          </div>
          <div className="bg-white p-10 shadow-2xl rounded-sm border-t-[12px] border-stone-900 flex flex-col items-center relative overflow-hidden print:shadow-none">
             <BrandLogo size={14} color="#000" className="mb-6" />
             <div className="w-full border-b border-dashed border-stone-200 pb-6 mb-8 flex justify-between items-end">
                <div><p className="text-[8px] font-black text-stone-300 uppercase mb-1">Customer</p><p className="text-sm font-black uppercase text-stone-900">{inv.customer}</p></div>
                <div className="text-right"><p className="text-[8px] font-black text-stone-300 uppercase mb-1">Ref ID</p><p className="text-[10px] font-black font-mono text-stone-900">{inv.invoiceId}</p></div>
             </div>
             <div className="w-full space-y-4 mb-10">
                {inv.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                     <p className="text-[11px] font-black text-stone-900 uppercase leading-none">{item.qty}x {item.name}</p>
                     <p className="text-[11px] font-black text-stone-900 font-mono">Rp{(item.price * item.qty).toLocaleString('id-ID')}</p>
                  </div>
                ))}
             </div>
             <div className="w-full bg-stone-50 p-6 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Paid Total</span>
                <span className="text-xl font-black font-mono text-stone-900">Rp{inv.total.toLocaleString('id-ID')}</span>
             </div>
             <div className="mt-10 pt-10 border-t border-stone-50 w-full text-center opacity-30">
                <p className="text-[8px] font-black uppercase tracking-[0.5em]">Validated by SAGA Merch Hub</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'manage_catalog') {
    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in">
        <div className="flex items-center justify-between">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full shadow-sm border border-stone-100"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Master Catalog</h2>
           <div className="w-10"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-4">
           <input type="text" placeholder="NAMA ITEM" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-100" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} />
           <div className="grid grid-cols-2 gap-3">
              <select className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none" value={newItemForm.tag} onChange={e => setNewItemForm({...newItemForm, tag: e.target.value})}>
                 <option value="APPAREL">APPAREL</option>
                 <option value="ACCESSORIES">ACCESSORIES</option>
                 <option value="GEAR OUTDOOR">GEAR OUTDOOR</option>
              </select>
              <input type="number" placeholder="Harga" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-xs font-bold outline-none" value={newItemForm.price} onChange={e => setNewItemForm({...newItemForm, price: e.target.value})} />
           </div>
           <button onClick={() => {
              if (!newItemForm.name || !newItemForm.price) return alert("Lengkapi data!");
              const newItem = { id: Date.now(), name: newItemForm.name.toUpperCase(), price: parseInt(newItemForm.price), tag: newItemForm.tag };
              if (isDemoMode) {
                const updated = [...catalogItems, newItem];
                setCatalogItems(updated);
                localStorage.setItem(`saga_merch_catalog_${appId}`, JSON.stringify(updated));
              } else {
                db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_catalog').add(newItem);
              }
              setNewItemForm({ name: '', price: '', tag: 'APPAREL' });
           }} className="w-full bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all">Daftarkan Item</button>
        </div>
        <div className="space-y-3 pb-20">
           {catalogItems.map(item => (
             <div key={item.fireId || item.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group">
               <div className="flex-1">
                   <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest mb-1 block">{item.tag}</span>
                   <h4 className="text-[12px] font-black text-stone-900 uppercase leading-none">{item.name}</h4>
                   {editingItemId === item.id ? (
                     <div className="flex items-center gap-2 mt-2">
                       <input type="number" className="w-24 bg-stone-50 border rounded-lg px-2 py-1 text-[11px] font-bold outline-none" value={editPriceValue} onChange={e => setEditPriceValue(e.target.value)} autoFocus />
                       <button onClick={() => handleUpdatePrice(item.id, item.fireId)} className="p-2 bg-indigo-600 text-white rounded-lg"><CheckCircle2 size={14}/></button>
                     </div>
                   ) : (
                     <p className="text-[11px] font-black text-indigo-600 mt-1 font-mono">Rp{item.price.toLocaleString('id-ID')}</p>
                   )}
               </div>
               <div className="flex items-center gap-2">
                   <button onClick={() => { setEditingItemId(item.id); setEditPriceValue(item.price.toString()); }} className="p-3 bg-stone-50 text-stone-400 rounded-2xl"><Edit3 size={16}/></button>
                   <button onClick={() => triggerDelete('catalog', item.fireId, item.id)} className="p-3 bg-stone-50 text-stone-400 rounded-2xl hover:text-rose-600"><Trash2 size={16}/></button>
               </div>
             </div>
           ))}
        </div>
        {showPinModal && renderPinModal()}
      </div>
    );
  }

  return null;
};

const SharingCard = ({ label, amount, icon, isHighlight }: any) => (
  <div className={`p-5 rounded-3xl border transition-all ${isHighlight ? 'bg-indigo-950 text-white border-indigo-900 shadow-lg' : 'bg-white text-stone-900 border-stone-100'}`}>
     <div className="flex items-center justify-between mb-3"><div className={`p-2 rounded-xl ${isHighlight ? 'bg-indigo-900' : 'bg-stone-50 text-stone-300'}`}>{icon}</div></div>
     <p className={`text-[8px] font-black uppercase mb-1 tracking-widest ${isHighlight ? 'text-indigo-400' : 'text-stone-300'}`}>{label}</p>
     <p className="text-[12px] font-black font-mono tracking-tight">Rp{amount.toLocaleString('id-ID')}</p>
  </div>
);

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2.5rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md relative overflow-hidden`}>
    <div className="relative z-10">
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-2xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
  </button>
);

export default MerchPage;
