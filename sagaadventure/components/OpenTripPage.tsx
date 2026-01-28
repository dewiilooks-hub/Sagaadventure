import React, { useState, useEffect } from 'react';
// Fixed: Using compat import for Firebase v8 style code
import firebase from 'firebase/compat/app';
import { 
  ChevronLeft, Tent, Coffee, Users, 
  Trash2, Plus, ListChecks, Calendar, Wallet, 
  CheckCircle2, Square, ShoppingCart, 
  PlusSquare, BarChart3, AlertCircle,
  Printer, Eye, MapPin, User, UserPlus,
  TrendingUp, Search, Ticket, Hash,
  ArrowDownCircle, ArrowUpCircle, Package,
  Edit3, Check, X, Calculator, Settings, Save,
  Scale, Layers, ChevronDown, ChevronRight,
  ShieldCheck, ClipboardCheck, Clock, ShieldAlert,
  HardHat, BookOpen, Info, PhoneCall, HeartPulse,
  XCircle, FileText, TrendingDown, Landmark, PieChart,
  Percent, Coins, HandCoins, Timer, Briefcase, Landmark as Bank,
  History, ShoppingBag, ArrowUpRight, ArrowDownLeft, QrCode, Lock, KeyRound
} from 'lucide-react';
import { db, appId } from '../services/firebase';
import { OpenTripTask, TripEvent, TripExpense, StaffAttendance, KasSpending } from '../types';
import BrandLogo from './BrandLogo';
import TicketPage from './TicketPage';

type TripSubView = 'dashboard' | 'tasks' | 'trips' | 'expenses' | 'trip_detail' | 'closing_report' | 'ticket' | 'attendance' | 'terms_opentrip' | 'kas';

interface OpenTripPageProps {
  user: firebase.User | null;
  onBack: () => void;
}

const OpenTripPage: React.FC<OpenTripPageProps> = ({ user, onBack }) => {
  const [subView, setSubView] = useState<TripSubView>('dashboard');
  const [activeTab, setActiveTab] = useState<'equip' | 'logistik' | 'operasional' | 'peserta'>('equip');
  const [showInputRow, setShowInputRow] = useState(true); 
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSpending, setShowAddSpending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // PIN Protection States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinTargetView, setPinTargetView] = useState<TripSubView | null>(null);
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);

  const MASTER_PIN = "2026";

  // Period Selection for Closing Report
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Accordion state for Trip Detail
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    manifest: true,
    equip: false,
    logistik: false,
    ops: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Data States
  const [tasks, setTasks] = useState<OpenTripTask[]>([]);
  const [trips, setTrips] = useState<TripEvent[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [kasSpending, setKasSpending] = useState<KasSpending[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripEvent | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '', pic: '', qty: 1, unit: '', price: '', status: '', tripId: '', ticketId: ''
  });

  const [attendForm, setAttendForm] = useState({
    staffName: '', role: '', status: 'Hari H Event' as StaffAttendance['status'], tripId: ''
  });

  const [spendingForm, setSpendingForm] = useState({
    item: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'peralatan' as KasSpending['category'], note: ''
  });

  const [editFormData, setEditFormData] = useState<any>(null);

  const [tripForm, setTripForm] = useState({
    name: '', date: '', pic: '', location: '', status: 'planning' as TripEvent['status']
  });

  const isDemoMode = !db;

  // Load Data
  useEffect(() => {
    if (isDemoMode) {
      const savedTasks = localStorage.getItem(`saga_tasks_${appId}`);
      const savedTrips = localStorage.getItem(`saga_trips_${appId}`);
      const savedAttend = localStorage.getItem(`saga_attend_${appId}`);
      const savedSpending = localStorage.getItem(`saga_kas_spending_${appId}`);
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedTrips) setTrips(JSON.parse(savedTrips));
      if (savedAttend) setAttendance(JSON.parse(savedAttend));
      if (savedSpending) setKasSpending(JSON.parse(savedSpending));
      return;
    }
    
    const unsubTasks = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as OpenTripTask[]));

    const unsubTrips = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_trips')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTrips(s.docs.map(d => ({ id: d.id, ...d.data() })) as TripEvent[]));

    const unsubAttend = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_attendance')
      .orderBy('timestamp', 'desc')
      .onSnapshot((s) => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })) as StaffAttendance[]));

    const unsubSpending = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_kas_spending')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setKasSpending(s.docs.map(d => ({ id: d.id, ...d.data() })) as KasSpending[]));

    return () => { unsubTasks(); unsubTrips(); unsubAttend(); unsubSpending(); };
  }, [isDemoMode]);

  // Sync to LocalStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(tasks));
      localStorage.setItem(`saga_trips_${appId}`, JSON.stringify(trips));
      localStorage.setItem(`saga_attend_${appId}`, JSON.stringify(attendance));
      localStorage.setItem(`saga_kas_spending_${appId}`, JSON.stringify(kasSpending));
    }
  }, [tasks, trips, attendance, kasSpending, isDemoMode]);

  const handleAddTrip = async () => {
    if (!tripForm.name) return alert("Nama Proyek Wajib Diisi");
    const data = { ...tripForm, createdAt: new Date().toISOString() };
    if (isDemoMode) {
      setTrips([{ id: Date.now().toString(), ...data } as any, ...trips]);
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_trips').add(data);
    }
    setTripForm({ name: '', date: '', pic: '', location: '', status: 'planning' });
    setShowAddProject(false);
  };

  const handleAddSpending = async () => {
    if (!spendingForm.item || !spendingForm.amount) return alert("Lengkapi data pengeluaran!");
    const data = { 
      ...spendingForm, 
      amount: parseInt(spendingForm.amount),
      createdAt: new Date().toISOString() 
    };
    if (isDemoMode) {
      setKasSpending([{ id: Date.now().toString(), ...data } as KasSpending, ...kasSpending]);
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_kas_spending').add(data);
    }
    setSpendingForm({ item: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'peralatan', note: '' });
    setShowAddSpending(false);
  };

  const handleDeleteSpending = async (id: string) => {
    if (!window.confirm("Hapus catatan pengeluaran ini?")) return;
    if (isDemoMode) {
      setKasSpending(kasSpending.filter(s => s.id !== id));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_kas_spending').doc(id).delete();
    }
  };

  const handleAddAttendance = async () => {
    if (!attendForm.staffName || !attendForm.tripId) return alert("Lengkapi data absensi!");
    const data = { ...attendForm, timestamp: new Date().toISOString() };
    if (isDemoMode) {
      setAttendance([{ id: Date.now().toString(), ...data } as StaffAttendance, ...attendance]);
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_attendance').add(data);
    }
    setAttendForm({ staffName: '', role: '', status: 'Hari H Event', tripId: '' });
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm("Hapus catatan absensi ini?")) return;
    if (isDemoMode) {
      setAttendance(attendance.filter(a => a.id !== id));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_attendance').doc(id).delete();
    }
  };

  const executeDeleteTrip = async (id: string) => {
    if (isDemoMode) {
      setTrips(trips.filter(t => t.id !== id));
    } else {
      try {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_trips').doc(id).delete();
      } catch (err) {
        alert("Gagal menghapus proyek.");
      }
    }
    setPendingDeleteTripId(null);
  };

  const handleSaveFromTicket = async (taskData: any) => {
    const finalData = { ...taskData, createdAt: new Date().toISOString() };
    if (isDemoMode) {
      setTasks([{ id: Date.now().toString(), ...finalData } as any, ...tasks]);
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').add(finalData);
    }
  };

  const handleAddTask = async () => {
    if (!formData.name.trim()) return alert("Nama Item Wajib Diisi");
    const data: any = { 
      task: formData.name, 
      pic: formData.pic || 'Admin', 
      qty: parseFloat(formData.qty.toString()) || 1,
      unit: activeTab === 'logistik' ? formData.unit : 'pcs',
      price: parseInt(formData.price.toString()) || 0, 
      status: formData.status || (activeTab === 'equip' ? 'ready' : activeTab === 'logistik' ? 'ready' : activeTab === 'peserta' ? 'paid' : 'biaya'),
      category: activeTab, 
      tripId: formData.tripId || '',
      ticketId: formData.ticketId || '',
      isDone: activeTab === 'peserta' ? true : false, 
      createdAt: new Date().toISOString()
    };
    
    if (isDemoMode) {
      setTasks([{ id: Date.now().toString(), ...data } as any, ...tasks]);
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').add(data);
    }
    setFormData({ name: '', pic: '', qty: 1, unit: '', price: '', status: '', tripId: '', ticketId: '' });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFormData) return;
    const updated = {
        ...editFormData,
        price: parseInt(editFormData.price.toString()) || 0,
        qty: parseFloat(editFormData.qty.toString()) || 1
    };
    
    if (isDemoMode) {
        setTasks(tasks.map(t => t.id === id ? { ...t, ...updated } : t));
    } else {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').doc(id).update(updated);
    }
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Hapus item ini dari daftar?")) return;
    if (isDemoMode) {
        setTasks(tasks.filter(t => t.id !== id));
    } else {
        try {
          await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').doc(id).delete();
        } catch (e) {
          alert("Gagal menghapus data.");
        }
    }
  };

  // Helper for Profit Sharing Calculation
  const calculateSharing = (profit: number) => {
    const royalty = Math.round(profit * 0.05);
    const kasTrip = Math.round(profit * 0.20);
    const team = Math.round(profit * 0.75);
    return { royalty, kasTrip, team };
  };

  // Calculate Staff Weights for specific project
  const calculateStaffSharing = (tripId: string, teamPool: number) => {
    const tripAttendance = attendance.filter(a => a.tripId === tripId);
    const staffWeights: Record<string, number> = {};
    
    tripAttendance.forEach(a => {
      let weight = 0;
      const status = a.status.toString();
      if (status === 'Meeting 1') weight = 5;
      else if (status === 'Meeting 2') weight = 5;
      else if (status === 'Hari H Event') weight = 90;

      staffWeights[a.staffName] = (staffWeights[a.staffName] || 0) + weight;
    });

    const totalWeight = Object.values(staffWeights).reduce((a, b) => a + b, 0);
    
    return Object.entries(staffWeights).map(([name, weight]) => {
      const sharePercentage = totalWeight > 0 ? (weight / totalWeight) : 0;
      return {
        name,
        totalPoints: weight,
        sharePercentage: Math.round(sharePercentage * 100),
        amount: Math.round(teamPool * sharePercentage)
      };
    });
  };

  // PIN Validation Logic
  const openRestrictedView = (view: TripSubView) => {
    setPinTargetView(view);
    setPendingDeleteTripId(null);
    setShowPinModal(true);
    setPinInput('');
    setPinError(false);
  };

  const openDeleteProtection = (tripId: string) => {
    setPendingDeleteTripId(tripId);
    setPinTargetView(null);
    setShowPinModal(true);
    setPinInput('');
    setPinError(false);
  };

  const handleVerifyPin = () => {
    if (pinInput === MASTER_PIN) {
      if (pinTargetView) {
        setSubView(pinTargetView);
      } else if (pendingDeleteTripId) {
        executeDeleteTrip(pendingDeleteTripId);
      }
      setShowPinModal(false);
      setPinTargetView(null);
      setPendingDeleteTripId(null);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  // View: Dashboard
  if (subView === 'dashboard') {
    return (
      <div className="p-8 space-y-6 bg-white min-h-screen relative">
        <div className="flex items-center justify-between mb-12">
           <button onClick={onBack} className="p-3 bg-stone-50 rounded-full text-stone-600 hover:bg-stone-100 transition-all"><ChevronLeft size={18}/></button>
           <BrandLogo size={10} color="#1c1917" />
           <div className="w-10"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <DashboardCard title="Master Project Hub" desc="Pusat Data & Finansial" icon={<Calendar size={24}/>} color="bg-stone-900" onClick={() => setSubView('trips')} />
          <DashboardCard title="Kas & Saldo Trip" desc="Simpanan 20% Akumulasi" icon={<Wallet size={24}/>} color="bg-emerald-800" isLocked onClick={() => openRestrictedView('kas')} />
          <DashboardCard title="Checklist Ops" desc="Alat, Logistik & Peserta" icon={<ListChecks size={24}/>} color="bg-sky-600" onClick={() => setSubView('tasks')} />
          <DashboardCard title="Ticket System" desc="E-Ticket & Manifest Tamu" icon={<Ticket size={24}/>} color="bg-indigo-600" isLocked onClick={() => openRestrictedView('ticket')} />
          <DashboardCard title="Absensi Staff" desc="Kontrol Kehadiran Crew" icon={<ClipboardCheck size={24}/>} color="bg-slate-700" onClick={() => setSubView('attendance')} />
          <DashboardCard title="S&K Open Trip" desc="Proteksi Peserta & Owner" icon={<ShieldCheck size={24}/>} color="bg-orange-800" onClick={() => setSubView('terms_opentrip')} />
          <DashboardCard title="Closing Report" desc="Laporan Bulanan" icon={<BarChart3 size={24}/>} color="bg-stone-800" isLocked onClick={() => openRestrictedView('closing_report')} />
        </div>

        {/* PIN GATEWAY MODAL */}
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-300 ${pinError ? 'animate-shake border-rose-200' : ''}`}>
               <div className={`${pendingDeleteTripId ? 'bg-rose-950' : 'bg-stone-900'} p-10 text-white text-center transition-colors duration-500`}>
                  <div className="p-4 bg-white/10 rounded-full w-fit mx-auto mb-6">
                    {pendingDeleteTripId ? (
                      <ShieldAlert size={32} className={pinError ? 'text-rose-400' : 'text-amber-400'} />
                    ) : (
                      <Lock size={32} className={pinError ? 'text-rose-400' : 'text-emerald-400'} />
                    )}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {pendingDeleteTripId ? 'Deletion Shield' : 'Security Gateway'}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                    {pendingDeleteTripId ? 'Confirm Deletion with PIN' : 'Authorized Access Only'}
                  </p>
               </div>
               <div className="p-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest block text-center mb-2">Enter Master PIN</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-200" size={18} />
                      <input 
                        type="password" 
                        autoFocus
                        maxLength={4}
                        className={`w-full bg-stone-50 border-none rounded-[1.5rem] py-5 px-12 text-2xl font-black text-center tracking-[1em] outline-none transition-all ${pinError ? 'ring-2 ring-rose-100 text-rose-600' : 'focus:ring-2 focus:ring-stone-100'}`}
                        placeholder="••••"
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                      />
                    </div>
                  </div>
                  {pinError && (
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center animate-bounce">Wrong PIN Code</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => { setShowPinModal(false); setPendingDeleteTripId(null); setPinTargetView(null); }} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 hover:bg-stone-100 transition-all">Cancel</button>
                     <button onClick={handleVerifyPin} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all ${pendingDeleteTripId ? 'bg-rose-600' : 'bg-stone-900'}`}>
                       {pendingDeleteTripId ? 'Confirm Delete' : 'Unlock Access'}
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Kas & Saldo Trip
  if (subView === 'kas') {
    const allocations = trips.map(trip => {
      const pTasks = tasks.filter(t => t.tripId === trip.id);
      const pRev = pTasks.filter(t => t.category === 'peserta' && t.status === 'paid').reduce((a, b) => a + b.price, 0);
      const pExp = pTasks.filter(t => t.category !== 'peserta').reduce((a, b) => a + (b.price * b.qty), 0);
      const pNet = Math.max(0, pRev - pExp);
      const { kasTrip } = calculateSharing(pNet);
      return { id: trip.id, name: trip.name, date: trip.date, amount: kasTrip, profit: pNet, type: 'IN' as const };
    }).filter(k => k.amount > 0);

    const spendingRecords = kasSpending.map(s => ({
      ...s,
      type: 'OUT' as const,
      name: s.item,
      amount: s.amount
    }));

    const totalAllocations = allocations.reduce((a, b) => a + b.amount, 0);
    const totalSpending = spendingRecords.reduce((a, b) => a + b.amount, 0);
    const currentBalance = totalAllocations - totalSpending;

    const allTransactions = [...allocations, ...spendingRecords].sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });

    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm active:scale-95 transition-all"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Financial Reserve Hub</h2>
           <button onClick={() => setShowAddSpending(!showAddSpending)} className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${showAddSpending ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-emerald-700 border border-emerald-100 shadow-sm'}`}>
              <PlusSquare size={20}/> <span className="text-[8px] font-black uppercase tracking-widest">Input Belanja</span>
           </button>
        </div>

        <div className="bg-stone-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-2">Current Cash Balance</span>
                    <p className="text-4xl font-black font-mono tracking-tighter">Rp{currentBalance.toLocaleString('id-ID')}</p>
                 </div>
                 <div className="p-4 bg-white/10 rounded-3xl border border-white/10">
                    <Bank size={24} className="text-emerald-400" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                 <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Total In (20%)</span>
                    <p className="text-sm font-black text-emerald-400 font-mono">+Rp{totalAllocations.toLocaleString('id-ID')}</p>
                 </div>
                 <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Total Out (Expenses)</span>
                    <p className="text-sm font-black text-rose-400 font-mono">-Rp{totalSpending.toLocaleString('id-ID')}</p>
                 </div>
              </div>
           </div>
           <PieChart size={120} className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {showAddSpending && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-emerald-100 space-y-4 animate-in slide-in-from-top-4">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14}/> Input Belanja Kas</h3>
                <button onClick={() => setShowAddSpending(false)} className="text-stone-300 hover:text-stone-900"><X size={18}/></button>
             </div>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Kategori</label>
                      <select className="w-full bg-stone-50 rounded-xl py-3 px-4 text-[10px] font-bold uppercase outline-none" value={spendingForm.category} onChange={e => setSpendingForm({...spendingForm, category: e.target.value as any})}>
                         <option value="peralatan">BELANJA ALAT</option>
                         <option value="operasional">BIAYA OPS UMUM</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Tanggal</label>
                      <input type="date" className="w-full bg-stone-50 rounded-xl py-3 px-4 text-[10px] font-bold outline-none" value={spendingForm.date} onChange={e => setSpendingForm({...spendingForm, date: e.target.value})} />
                   </div>
                </div>
                <input type="text" placeholder="NAMA BARANG / KEPERLUAN" className="w-full bg-stone-50 rounded-xl py-4 px-5 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-50" value={spendingForm.item} onChange={e => setSpendingForm({...spendingForm, item: e.target.value})} />
                <div className="relative">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 text-[10px] font-black">Rp</span>
                   <input type="number" placeholder="TOTAL BIAYA" className="w-full bg-stone-50 rounded-xl py-4 pl-12 pr-5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-50" value={spendingForm.amount} onChange={e => setSpendingForm({...spendingForm, amount: e.target.value})} />
                </div>
                <button onClick={handleAddSpending} className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all mt-2">Simpan Pengeluaran</button>
             </div>
          </div>
        )}

        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} className="text-stone-300" /> Recent Transactions
              </h3>
              <span className="text-[8px] font-black text-stone-300 uppercase">{allTransactions.length} Entries</span>
           </div>

           <div className="space-y-3 pb-24">
              {allTransactions.length === 0 ? (
                <div className="py-20 text-center opacity-20"><Info size={48} className="mx-auto"/><p className="text-[10px] font-black uppercase mt-4">Belum ada aktivitas kas</p></div>
              ) : (
                allTransactions.map((tx: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${tx.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                           {tx.type === 'IN' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                        </div>
                        <div>
                           <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-tight group-hover:text-stone-950 transition-colors">{tx.name || tx.item}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                 {tx.type === 'IN' ? 'Deposit 20%' : 'Expense'}
                              </span>
                              <p className="text-[8px] font-bold text-stone-300 uppercase">{tx.date}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className={`text-sm font-black font-mono ${tx.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {tx.type === 'IN' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                           </p>
                           {tx.type === 'IN' && <p className="text-[7px] font-bold text-stone-300 uppercase">Net Profit Allocation</p>}
                        </div>
                        {tx.type === 'OUT' && (
                           <button onClick={() => handleDeleteSpending(tx.id)} className="p-2 text-stone-200 hover:text-rose-600 transition-colors active:scale-75">
                              <Trash2 size={14}/>
                           </button>
                        )}
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    );
  }

  // View: Checklist Ops
  if (subView === 'tasks') {
    const filteredTasks = tasks.filter(t => t.category === activeTab);
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-50 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView('dashboard')} className="p-2 bg-stone-50 rounded-full text-stone-600 transition-all active:scale-95"><ChevronLeft size={16}/></button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">Checklist Ops & Peserta</h2>
          </div>
          <button onClick={() => setShowInputRow(!showInputRow)} className={`p-2.5 rounded-xl shadow-lg transition-all ${showInputRow ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400'}`}>
             {showInputRow ? <X size={20} /> : <PlusSquare size={22} />}
          </button>
        </div>

        <div className="px-6 py-4 flex gap-2 bg-stone-50/20 border-b border-stone-50 print:hidden overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'equip'} onClick={() => {setActiveTab('equip'); setEditingId(null);}} icon={<Tent size={14}/>} label="Equip" />
          <TabButton active={activeTab === 'logistik'} onClick={() => {setActiveTab('logistik'); setEditingId(null);}} icon={<Coffee size={14}/>} label="Logistik" />
          <TabButton active={activeTab === 'peserta'} onClick={() => {setActiveTab('peserta'); setEditingId(null);}} icon={<Users size={14}/>} label="Peserta" />
          <TabButton active={activeTab === 'operasional'} onClick={() => {setActiveTab('operasional'); setEditingId(null);}} icon={<Calculator size={14}/>} label="Ops" />
        </div>

        <div className="flex-1 overflow-auto bg-white flex flex-col pb-20">
          {showInputRow && (
            <div className="bg-stone-50/40 border-b border-stone-100 p-6 space-y-4 animate-in slide-in-from-top-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">{activeTab === 'peserta' ? 'Nama Peserta' : 'Nama Item'}</label>
                    <input type="text" placeholder="..." className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm text-stone-900 focus:ring-1 focus:ring-stone-400 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">{activeTab === 'peserta' ? 'Ticket ID (Manual)' : 'PIC Ops'}</label>
                    <div className="relative">
                      <input type="text" placeholder={activeTab === 'peserta' ? 'SAGA-TIX-...' : 'PIC'} className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm text-stone-900 focus:ring-1 focus:ring-stone-400 transition-all" value={activeTab === 'peserta' ? formData.ticketId : formData.pic} onChange={e => activeTab === 'peserta' ? setFormData({...formData, ticketId: e.target.value}) : setFormData({...formData, pic: e.target.value})}/>
                      {activeTab === 'peserta' && <QrCode size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300" />}
                    </div>
                  </div>
               </div>
               
               <div className="space-y-1">
                 <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Pilih Proyek Trip</label>
                 <select className="w-full bg-white border border-stone-300 rounded-xl py-3 px-4 text-[10px] font-black uppercase outline-none shadow-sm text-stone-900" value={formData.tripId} onChange={e => setFormData({...formData, tripId: e.target.value})}>
                     <option value="">-- TANPA PROYEK (UMUM) --</option>
                     {trips.map(t => (
                         <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                 </select>
               </div>

               <div className="grid grid-cols-4 gap-2">
                 <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">
                     {activeTab === 'logistik' ? 'Takaran' : 'Qty'}
                   </label>
                   <input 
                     type="text" 
                     placeholder={activeTab === 'logistik' ? 'Ex: 500g' : '1'} 
                     className="w-full bg-white border border-stone-300 rounded-xl py-3 text-[11px] font-black text-center outline-none shadow-sm text-stone-900" 
                     value={activeTab === 'logistik' ? formData.unit : formData.qty} 
                     onChange={e => activeTab === 'logistik' ? setFormData({...formData, unit: e.target.value}) : setFormData({...formData, qty: parseFloat(e.target.value) || 1})}
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Biaya (Rp)</label>
                   <input type="number" className="w-full bg-white border border-stone-300 rounded-xl px-2 py-3 text-[11px] font-black outline-none shadow-sm text-right font-mono text-stone-900" placeholder="Rp" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Status</label>
                   <select className="w-full bg-white border border-stone-300 rounded-xl py-3 text-[9px] font-black uppercase outline-none px-1 shadow-sm text-stone-900" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                     {activeTab === 'equip' && <><option value="ready">READY</option><option value="rent">RENT</option></>}
                     {activeTab === 'logistik' && <><option value="ready">READY</option><option value="buy">BUY</option></>}
                     {activeTab === 'peserta' && <><option value="paid">PAID</option><option value="unpaid">UNPAID</option></>}
                     {activeTab === 'operasional' && <><option value="biaya">BIAYA</option></>}
                   </select>
                 </div>
                 <div className="flex items-end">
                   <button onClick={handleAddTask} className="w-full bg-stone-900 text-white rounded-xl flex items-center justify-center py-3 shadow-lg active:scale-95 transition-all">
                     <Plus size={18}/>
                   </button>
                 </div>
               </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto relative">
             {filteredTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-32 opacity-10"><ShoppingCart size={64} /><p className="text-[10px] font-black uppercase mt-4 tracking-[0.5em]">No Records</p></div>
             ) : (
               <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead className="bg-stone-50 border-b border-stone-100 sticky top-0 z-20">
                     <tr className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                        <th className="py-5 px-6 w-16 text-center">Cek</th>
                        <th className="py-5 px-4 w-64">Nama Item / Peserta</th>
                        <th className="py-5 px-4 w-40">Ticket ID / PIC</th>
                        <th className="py-5 px-4 w-24 text-center">Qty / Unit</th>
                        <th className="py-5 px-4 w-32 text-right">Harga</th>
                        {activeTab !== 'peserta' && <th className="py-5 px-4 w-32 text-right">Total Biaya</th>}
                        <th className="py-5 px-4 w-28 text-center">Status</th>
                        <th className="py-5 px-4 w-28 text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                     {filteredTasks.map(item => {
                       const isEditing = editingId === item.id;
                       return (
                         <tr key={item.id} className={`group hover:bg-stone-50/30 transition-all ${item.isDone ? 'bg-emerald-50/20' : ''}`}>
                            <td className="py-3 px-6 text-center">
                               <button onClick={async () => {
                                  const n = tasks.map(t => t.id === item.id ? { ...t, isDone: !t.isDone } : t);
                                  setTasks(n);
                                  if (!isDemoMode) await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').doc(item.id).update({ isDone: !item.isDone });
                               }} className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all ${item.isDone ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-stone-200 border border-stone-100'}`}>
                                  {item.isDone ? <CheckCircle2 size={12} /> : <Square size={12} />}
                               </button>
                            </td>
                            <td className="py-3 px-4">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black uppercase text-stone-900 outline-none focus:ring-1 focus:ring-indigo-400" value={editFormData.task} onChange={e => setEditFormData({...editFormData, task: e.target.value})} />
                               ) : (
                                 <div className="flex flex-col">
                                    <span className={`text-[11px] font-black uppercase tracking-tight leading-tight ${item.isDone ? 'text-emerald-800' : 'text-stone-900'}`}>{item.task}</span>
                                    {item.tripId && <span className="text-[7px] font-black text-indigo-400 mt-0.5 uppercase tracking-widest flex items-center gap-1 opacity-60"><MapPin size={8}/> {trips.find(t=>t.id===item.tripId)?.name}</span>}
                                 </div>
                               )}
                            </td>
                            <td className="py-3 px-4">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black uppercase text-stone-900 outline-none focus:ring-1 focus:ring-indigo-400" value={activeTab === 'peserta' ? (editFormData.ticketId || '') : editFormData.pic} onChange={e => activeTab === 'peserta' ? setEditFormData({...editFormData, ticketId: e.target.value}) : setEditFormData({...editFormData, pic: e.target.value})} />
                               ) : (
                                 <div className="flex items-center gap-2">
                                   {activeTab === 'peserta' ? (
                                     <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100/50">
                                       <Ticket size={10} className="text-indigo-400" />
                                       <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-tighter">{item.ticketId || 'NO-ID'}</span>
                                     </div>
                                   ) : (
                                     <span className="text-[10px] font-bold uppercase text-stone-400 tracking-tight">{item.pic || 'ADMIN'}</span>
                                   )}
                                 </div>
                               )}
                            </td>
                            <td className="py-3 px-4 text-center">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-1 py-2 text-[11px] font-black text-center text-stone-900 outline-none focus:ring-1 focus:ring-indigo-400" value={activeTab === 'logistik' ? (editFormData.unit || '') : editFormData.qty} onChange={e => activeTab === 'logistik' ? setEditFormData({...editFormData, unit: e.target.value}) : setEditFormData({...editFormData, qty: e.target.value})} />
                               ) : (
                                 <span className="text-[10px] font-black text-stone-500 uppercase">{activeTab === 'logistik' ? item.unit : item.qty}</span>
                               )}
                            </td>
                            <td className="py-3 px-4 text-right">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black text-right text-stone-900 outline-none focus:ring-1 focus:ring-indigo-400" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
                               ) : (
                                 <span className="text-[10px] font-black font-mono text-stone-800">Rp{item.price.toLocaleString('id-ID')}</span>
                               )}
                            </td>
                            {activeTab !== 'peserta' && (
                              <td className="py-3 px-4 text-right">
                                <span className="text-[10px] font-black text-stone-950 font-mono bg-stone-50/50 px-2 py-1 rounded">
                                  Rp{(item.price * item.qty).toLocaleString('id-ID')}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-4 text-center">
                               {isEditing ? (
                                 <select className="text-[9px] font-black border border-stone-300 rounded-lg px-1 py-2 bg-white text-stone-900 outline-none focus:ring-1 focus:ring-indigo-400" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                                    {activeTab === 'equip' && <><option value="ready">READY</option><option value="rent">RENT</option></>}
                                    {activeTab === 'logistik' && <><option value="ready">READY</option><option value="buy">BUY</option></>}
                                    {activeTab === 'peserta' && <><option value="paid">PAID</option><option value="unpaid">UNPAID</option></>}
                                    {activeTab === 'operasional' && <><option value="biaya">BIAYA</option></>}
                                 </select>
                               ) : (
                                 <span className={`text-[7px] font-black px-2.5 py-1 rounded-full uppercase border shadow-sm ${item.status === 'ready' || item.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.status}</span>
                               )}
                            </td>
                            <td className="py-3 px-4 text-center">
                               <div className="flex items-center justify-center gap-1.5">
                                  {isEditing ? (
                                     <>
                                       <button onClick={() => handleSaveEdit(item.id)} className="p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all"><Check size={12}/></button>
                                       <button onClick={() => setEditingId(null)} className="p-2 bg-stone-100 text-stone-400 rounded-lg hover:bg-stone-200 transition-all"><X size={12}/></button>
                                     </>
                                  ) : (
                                     <>
                                       <button onClick={() => {setEditingId(item.id); setEditFormData({...item});}} className="p-2 text-stone-300 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-lg"><Edit3 size={14}/></button>
                                       <button onClick={() => handleDeleteTask(item.id)} className="p-2 text-stone-300 hover:text-rose-600 transition-all hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                                     </>
                                  )}
                               </div>
                            </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
             )}
          </div>
        </div>
      </div>
    );
  }

  // View: Master Trip Projects (REFINED GRID)
  if (subView === 'trips') {
    return (
      <div className="p-8 space-y-6 bg-stone-50 min-h-screen relative">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm transition-all active:scale-95"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Event Projects Hub</h2>
           <button onClick={() => setShowAddProject(!showAddProject)} className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${showAddProject ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-900 border'}`}>
              {showAddProject ? <X size={18}/> : <PlusSquare size={18}/>} 
              <span className="text-[8px] font-black uppercase tracking-widest">{showAddProject ? 'Close' : 'New Project'}</span>
           </button>
        </div>

        {showAddProject && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4 border border-stone-100 transition-all duration-300 animate-in slide-in-from-top-4">
             <div className="flex items-center justify-between mb-2 border-b border-stone-50 pb-4">
                <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2"><Briefcase size={14} className="text-stone-300"/> Tambah Proyek Baru</h3>
             </div>
             <input type="text" placeholder="MISAL: EXPEDISI SEMERU" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100 text-stone-900" value={tripForm.name} onChange={e => setTripForm({...tripForm, name: e.target.value})} />
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">TGL EVENT</label>
                   <input type="date" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none text-stone-900" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[7px] font-black text-stone-300 uppercase ml-2 tracking-widest">PIC OPS</label>
                   <input type="text" placeholder="NAMA PIC" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none uppercase text-stone-900" value={tripForm.pic} onChange={e => setTripForm({...tripForm, pic: e.target.value})} />
                </div>
             </div>
             <input type="text" placeholder="LOKASI / BASECAMP" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none text-stone-900" value={tripForm.location} onChange={e => setTripForm({...tripForm, location: e.target.value})} />
             <button onClick={handleAddTrip} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-all mt-4">Simpan Proyek</button>
          </div>
        )}

        <div className="space-y-4 pb-24">
           {trips.length === 0 ? (
             <div className="py-24 text-center opacity-10 flex flex-col items-center">
                <Package size={64}/>
                <p className="text-[10px] font-black uppercase mt-4 tracking-[0.5em]">No Active Projects</p>
             </div>
           ) : (
             trips.map(trip => (
               <div key={trip.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col gap-4 group transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                     <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${trip.status === 'planning' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-sky-50 text-sky-800 border-sky-100'}`}>{trip.status}</span>
                           <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest">ID: {trip.id.slice(-4)}</span>
                        </div>
                        <h4 className="font-black text-lg text-stone-900 uppercase tracking-tighter leading-tight">{trip.name}</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-stone-50">
                           <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-2 truncate"><Calendar size={12} className="text-stone-300"/> {trip.date}</p>
                           <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-2 truncate"><MapPin size={12} className="text-stone-300"/> {trip.location}</p>
                           <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-2 truncate"><User size={12} className="text-stone-300"/> {trip.pic}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2.5">
                     <button onClick={() => { setSelectedTrip(trip); setSubView('trip_detail'); }} className="flex-1 bg-stone-900 text-white py-4 rounded-2xl text-[8px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 hover:bg-black">
                        <Eye size={16}/> Buka Project Console
                     </button>
                     <button onClick={() => openDeleteProtection(trip.id)} className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90">
                        <Trash2 size={16}/>
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* PIN MODAL (FOR DELETION WITHIN TRIPS VIEW) */}
        {showPinModal && pendingDeleteTripId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-300 ${pinError ? 'animate-shake border-rose-200' : ''}`}>
               <div className="bg-rose-950 p-10 text-white text-center">
                  <div className="p-4 bg-white/10 rounded-full w-fit mx-auto mb-6">
                    <ShieldAlert size={32} className={pinError ? 'text-rose-400' : 'text-amber-400'} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Deletion Shield</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Authorized Access Only</p>
               </div>
               <div className="p-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest block text-center mb-2">Enter Master PIN to Delete</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-200" size={18} />
                      <input 
                        type="password" 
                        autoFocus
                        maxLength={4}
                        className={`w-full bg-stone-50 border-none rounded-[1.5rem] py-5 px-12 text-2xl font-black text-center tracking-[1em] outline-none transition-all ${pinError ? 'ring-2 ring-rose-100 text-rose-600' : 'focus:ring-2 focus:ring-stone-100'}`}
                        placeholder="••••"
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                      />
                    </div>
                  </div>
                  {pinError && (
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center animate-bounce">Wrong PIN Code</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => { setShowPinModal(false); setPendingDeleteTripId(null); }} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 hover:bg-stone-100 transition-all">Cancel</button>
                     <button onClick={handleVerifyPin} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white bg-rose-600 shadow-xl active:scale-95 transition-all">Verify Delete</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Master Trip Project Detail (REFINED TABLES)
  if (subView === 'trip_detail' && selectedTrip) {
    const tripTasks = tasks.filter(t => t.tripId === selectedTrip.id);
    const tripParticipants = tripTasks.filter(t => t.category === 'peserta');
    const tripEquip = tripTasks.filter(t => t.category === 'equip');
    const tripLogistik = tripTasks.filter(t => t.category === 'logistik');
    const tripOperasional = tripTasks.filter(t => t.category === 'operasional');

    const totalIncome = tripParticipants.filter(t => t.status === 'paid').reduce((a,b) => a + b.price, 0);
    const totalOutEquip = tripEquip.reduce((a,b) => a + (b.price * b.qty), 0);
    const totalOutLogistik = tripLogistik.reduce((a,b) => a + (b.price * b.qty), 0);
    const totalOutOps = tripOperasional.reduce((a,b) => a + (b.price * b.qty), 0);
    const totalExpense = totalOutEquip + totalOutLogistik + totalOutOps;

    return (
      <div className="p-8 space-y-6 bg-white min-h-screen relative">
        <div className="flex items-center justify-between mb-8 print:hidden">
           <button onClick={() => setSubView('trips')} className="p-3 bg-stone-50 rounded-full text-stone-600 active:scale-95 border border-stone-100 shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Operational Intelligence</h2>
           <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full shadow-lg active:scale-95 transition-all"><Printer size={18}/></button>
        </div>

        <div className="space-y-10">
           <div className="border-b-2 border-stone-100 pb-10">
              <div className="flex items-center justify-between">
                <BrandLogo size={12} color="#1c1917" />
                <span className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${selectedTrip.status === 'planning' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-stone-900 text-white border-stone-900'}`}>{selectedTrip.status}</span>
              </div>
              <h1 className="text-4xl font-black text-stone-900 uppercase tracking-tighter mt-6 leading-[0.9]">{selectedTrip.name}</h1>
              <div className="grid grid-cols-2 gap-6 mt-8">
                 <div className="flex items-center gap-3 text-stone-400 font-bold text-[10px] uppercase tracking-widest"><Calendar size={14} className="text-stone-300"/> {selectedTrip.date}</div>
                 <div className="flex items-center gap-3 text-stone-400 font-bold text-[10px] uppercase tracking-widest"><MapPin size={14} className="text-stone-300"/> {selectedTrip.location}</div>
                 <div className="flex items-center gap-3 text-stone-400 font-bold text-[10px] uppercase tracking-widest"><User size={14} className="text-stone-300"/> PIC: {selectedTrip.pic}</div>
                 <div className="flex items-center gap-3 text-stone-400 font-bold text-[10px] uppercase tracking-widest"><Users size={14} className="text-stone-300"/> {tripParticipants.length} PAX</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-950 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-3">Gross Project Revenue</span>
                    <p className="text-3xl font-black font-mono tracking-tighter">Rp{totalIncome.toLocaleString('id-ID')}</p>
                    <p className="text-[7px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-1"><CheckCircle2 size={8}/> From Verified Paid Manifest</p>
                 </div>
                 <Landmark size={64} className="opacity-10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
              </div>
              <div className="bg-stone-50 p-8 rounded-[3rem] border border-stone-200 flex justify-between items-center shadow-sm relative overflow-hidden group">
                 <div className="relative z-10">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em] block mb-3">Project Expenditures</span>
                    <p className="text-3xl font-black text-stone-900 font-mono tracking-tighter">Rp{totalExpense.toLocaleString('id-ID')}</p>
                    <p className="text-[7px] font-black text-stone-300 uppercase tracking-[0.2em] mt-2 flex items-center gap-1"><History size={8}/> Aggregated Ops Costs</p>
                 </div>
                 <TrendingDown size={64} className="text-stone-100 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
              </div>
           </div>

           <div className="space-y-6 pb-24">
              <CollapsibleTable 
                id="manifest"
                title="1. Manifest & Tiketing" 
                icon={<Ticket size={16}/>} 
                summary={`Total: Rp${totalIncome.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.manifest}
                onToggle={() => toggleSection('manifest')}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50/80 border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                      <th className="py-5 px-6">Nama Peserta</th>
                      <th className="py-5 px-6">Ticket Reference</th>
                      <th className="py-5 px-6 text-right">Fare Paid</th>
                      <th className="py-5 px-6 text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {tripParticipants.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">Manifest is empty</td></tr>
                    ) : (
                      tripParticipants.map(p => (
                        <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-5 px-6">
                            <p className="text-[11px] font-black text-stone-900 uppercase">{p.task}</p>
                            <p className="text-[7px] font-bold text-stone-300 uppercase tracking-widest">REGISTERED PAX</p>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded w-fit">
                               <Hash size={10} className="text-indigo-400" />
                               <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">{p.ticketId || 'NO-REF'}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right font-black font-mono text-stone-900 text-[11px]">Rp{p.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase border shadow-sm ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              <CollapsibleTable 
                id="equip"
                title="2. Master Peralatan" 
                icon={<Tent size={16}/>} 
                summary={`Rp${totalOutEquip.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.equip}
                onToggle={() => toggleSection('equip')}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50/80 border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                      <th className="py-5 px-6">Nama Alat / Item</th>
                      <th className="py-5 px-6 text-center">Volume</th>
                      <th className="py-5 px-6 text-right">Unit Price</th>
                      <th className="py-5 px-6 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {tripEquip.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">Inventory list empty</td></tr>
                    ) : (
                      tripEquip.map(e => (
                        <tr key={e.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-5 px-6 font-black text-[11px] text-stone-900 uppercase">{e.task}</td>
                          <td className="py-5 px-6 text-center text-[10px] font-bold text-stone-500">{e.qty} PCS</td>
                          <td className="py-5 px-6 text-right font-mono text-stone-400 text-[10px]">Rp{e.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-6 text-right font-black font-mono text-stone-900 text-[11px]">Rp{(e.price * e.qty).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              <CollapsibleTable 
                id="logistik"
                title="3. Food & Logistics" 
                icon={<Coffee size={16}/>} 
                summary={`Rp${totalOutLogistik.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.logistik}
                onToggle={() => toggleSection('logistik')}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50/80 border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                      <th className="py-5 px-6">Logistics Item</th>
                      <th className="py-5 px-6 text-center">Measurement</th>
                      <th className="py-5 px-6 text-right">Unit Price</th>
                      <th className="py-5 px-6 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {tripLogistik.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">Logistics list empty</td></tr>
                    ) : (
                      tripLogistik.map(l => (
                        <tr key={l.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-5 px-6 font-black text-[11px] text-stone-900 uppercase">{l.task}</td>
                          <td className="py-5 px-6 text-center text-[10px] font-bold text-stone-500 uppercase">{l.unit || 'PCS'}</td>
                          <td className="py-5 px-6 text-right font-mono text-stone-400 text-[10px]">Rp{l.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-6 text-right font-black font-mono text-stone-900 text-[11px]">Rp{(l.price * l.qty).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              <CollapsibleTable 
                id="ops"
                title="4. Operational Expenses" 
                icon={<Calculator size={16}/>} 
                summary={`Rp${totalOutOps.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.ops}
                onToggle={() => toggleSection('ops')}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50/80 border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">
                      <th className="py-5 px-6">Expense Description</th>
                      <th className="py-5 px-6 text-center">Qty</th>
                      <th className="py-5 px-6 text-right">Unit Price</th>
                      <th className="py-5 px-6 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {tripOperasional.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">No expenses recorded</td></tr>
                    ) : (
                      tripOperasional.map(o => (
                        <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-5 px-6 font-black text-[11px] text-stone-900 uppercase">{o.task}</td>
                          <td className="py-5 px-6 text-center text-[10px] font-bold text-stone-500">{o.qty} UNIT</td>
                          <td className="py-5 px-6 text-right font-mono text-stone-400 text-[10px]">Rp{o.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-6 text-right font-black font-mono text-stone-900 text-[11px]">Rp{(o.price * o.qty).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>
           </div>
        </div>
      </div>
    );
  }

  // View: Ticket System (FIXED RENDER)
  if (subView === 'ticket') {
    return (
      <div className="bg-stone-50 min-h-screen">
        <TicketPage onBack={() => setSubView('dashboard')} trips={trips} onSave={handleSaveFromTicket} />
      </div>
    );
  }

  // View: Attendance (FIXED RENDER)
  if (subView === 'attendance') {
    return (
      <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm active:scale-95 transition-all"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Crew Attendance Console</h2>
           <div className="w-10"></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6 border border-stone-100">
           <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><UserPlus size={14}/> Input Absensi Baru</h3>
           <div className="space-y-4">
              <input type="text" placeholder="NAMA LENGKAP STAFF" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100 text-stone-900" value={attendForm.staffName} onChange={e => setAttendForm({...attendForm, staffName: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="JABATAN (EX: GUIDE)" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none text-stone-900" value={attendForm.role} onChange={e => setAttendForm({...attendForm, role: e.target.value})} />
                 <select className="w-full bg-stone-50 rounded-2xl py-4 px-4 text-[10px] font-black uppercase outline-none text-stone-900" value={attendForm.status} onChange={e => setAttendForm({...attendForm, status: e.target.value as any})}>
                    <option value="Hari H Event">HARI H (90 Pts)</option>
                    <option value="Meeting 1">MEETING 1 (5 Pts)</option>
                    <option value="Meeting 2">MEETING 2 (5 Pts)</option>
                    <option value="hadir">HADIR UMUM</option>
                    <option value="izin">IZIN</option>
                    <option value="sakit">SAKIT</option>
                 </select>
              </div>
              <select className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none text-stone-900" value={attendForm.tripId} onChange={e => setAttendForm({...attendForm, tripId: e.target.value})}>
                 <option value="">-- HUBUNGKAN KE PROYEK --</option>
                 {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleAddAttendance} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-all mt-2">Submit Absensi</button>
           </div>
        </div>

        <div className="space-y-4 pb-24">
           <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Log Kehadiran Crew</h3>
           <div className="bg-white border border-stone-100 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-stone-50 border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                       <th className="py-4 px-6">Crew Name</th>
                       <th className="py-4 px-6">Project Event</th>
                       <th className="py-4 px-6 text-center">Status</th>
                       <th className="py-4 px-6 text-center">Action</th>
                    </tr>
                 </thead>
                 <tbody className="text-[10px] font-bold text-stone-800 uppercase">
                    {attendance.map((a) => (
                       <tr key={a.id} className="border-b border-stone-50 last:border-none">
                          <td className="py-4 px-6">
                             <p className="font-black text-stone-900">{a.staffName}</p>
                             <p className="text-[8px] text-stone-300 font-bold">{a.role || 'CREW'}</p>
                          </td>
                          <td className="py-4 px-6 text-stone-500">{trips.find(t=>t.id===a.tripId)?.name || 'General'}</td>
                          <td className="py-4 px-6 text-center">
                             <span className={`px-2 py-0.5 rounded-full text-[7px] ${a.status.includes('H') ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-50 text-stone-500'}`}>{a.status}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                             <button onClick={() => handleDeleteAttendance(a.id)} className="text-stone-200 hover:text-rose-500"><Trash2 size={14}/></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  // View: Terms Open Trip (FIXED RENDER)
  if (subView === 'terms_opentrip') {
    return (
      <div className="p-8 space-y-8 bg-white min-h-screen animate-in slide-in-from-right font-sans pb-24">
        <div className="flex items-center justify-between mb-8 print:hidden">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full text-stone-600 active:scale-95 border border-stone-100 shadow-sm"><ChevronLeft size={18}/></button>
           <h2 className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Legal Documentation</h2>
           <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full shadow-lg active:scale-95 transition-all"><Printer size={18}/></button>
        </div>

        <div className="border-t-[12px] border-stone-900 pt-12 space-y-12">
           <div className="flex justify-between items-start">
              <div>
                <BrandLogo size={14} color="#000" />
                <h1 className="text-4xl font-black text-stone-900 uppercase tracking-tighter mt-4 leading-none">OFFICIAL <span className="text-stone-300">TERMS</span></h1>
                <p className="text-[10px] font-bold text-stone-400 mt-2 uppercase tracking-[0.3em]">SAGA ADVENTURE POLICIES</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <SectionTerms 
                title="1. Cancelation Policy" 
                icon={<XCircle size={18}/>}
                items={[
                  { label: "H-7", text: "50% Penalty dari total biaya perjalanan." },
                  { label: "H-1 atau kurang", text: "Biaya hangus (No Refund)." },
                  { label: "Force Majeure", text: "Diatur sepenuhnya oleh kebijakan SAGA." }
                ]}
              />
              <SectionTerms 
                title="2. Kesehatan & Keselamatan" 
                icon={<HeartPulse size={18}/>}
                items={[
                  { label: "Kejujuran Fisik", text: "Peserta wajib jujur mengenai kondisi fisiknya kepada panitia." },
                  { label: "Obat Pribadi", text: "Peserta wajib membawa obat-obatan pribadi yang diperlukan." },
                  { label: "Hak Penolakan", text: "SAGA berhak menolak peserta yang sakit demi keamanan tim." }
                ]}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <SectionTerms 
                title="3. Izin & Kontak Darurat" 
                icon={<PhoneCall size={18}/>}
                items={[
                  { label: "Izin Keluarga", text: "Peserta menyatakan telah mendapat izin keluarga/kerabat." },
                  { label: "Kontak", text: "Informasi kontak darurat wajib tersedia bagi panitia." },
                  { label: "Data Kontak", text: "Daftar: Nama Lengkap & Nomor HP Kerabat." }
                ]}
              />
              <SectionTerms 
                title="4. Evakuasi Darurat" 
                icon={<HardHat size={18}/>}
                items={[
                  { label: "Fasilitas Awal", text: "Evakuasi lapangan awal difasilitasi oleh crew SAGA." },
                  { label: "Tanggung Jawab Biaya", text: "Biaya evakuasi lanjutan di luar jangkauan menjadi tanggung jawab peserta." }
                ]}
              />
           </div>
        </div>
      </div>
    );
  }

  // View: Closing Report (WITH DETAILED PROFIT SHARING)
  if (subView === 'closing_report') {
    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    
    // Filter tasks for the selected period
    const filteredTasks = tasks.filter(t => {
       const d = new Date(t.createdAt);
       return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const participantsAll = filteredTasks.filter(t => t.category === 'peserta' && t.status === 'paid');
    const totalRevAll = participantsAll.reduce((a, b) => a + b.price, 0);
    
    const equipExpAll = filteredTasks.filter(t => t.category === 'equip').reduce((a, b) => a + (b.price * b.qty), 0);
    const logistikExpAll = filteredTasks.filter(t => t.category === 'logistik').reduce((a, b) => a + (b.price * b.qty), 0);
    const opsExpAll = filteredTasks.filter(t => t.category === 'operasional').reduce((a, b) => a + (b.price * b.qty), 0);
    
    const totalExpenseAll = equipExpAll + logistikExpAll + opsExpAll;

    // Identify unique projects active in this month
    const projectIds = [...new Set(filteredTasks.map(t => t.tripId).filter((id): id is string => !!id && id !== ''))];

    return (
      <div className="bg-stone-50 min-h-screen pb-20 font-sans">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b p-4 flex items-center justify-between shadow-sm z-50 print:hidden">
          <button onClick={() => setSubView('dashboard')} className="p-3 hover:bg-gray-100 rounded-full text-stone-600 transition-all active:scale-95"><ChevronLeft size={18}/></button>
          <div className="flex items-center gap-2 px-6 py-2 bg-stone-50 border rounded-full">
             <BarChart3 size={14} className="text-stone-400"/>
             <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">MASTER CLOSING CONSOLE</span>
          </div>
          <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full shadow-lg active:scale-95"><Printer size={18}/></button>
        </div>

        {/* Period Selector */}
        <div className="max-w-4xl mx-auto mt-8 px-6 print:hidden">
           <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {months.map((m, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedMonth(idx)} 
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${selectedMonth === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105' : 'bg-white text-stone-300 border-stone-100 hover:border-stone-300'}`}
                >
                  {m}
                </button>
              ))}
           </div>
        </div>

        {/* THE OFFICIAL REPORT DOCUMENT */}
        <div className="m-6 bg-white shadow-2xl rounded-sm border-t-[16px] border-stone-900 p-12 space-y-12 relative overflow-hidden min-h-[1100px] flex flex-col print:m-0 print:shadow-none print:border-none max-w-4xl mx-auto">
           {/* Document Header */}
           <div className="flex justify-between items-start border-b-2 border-stone-100 pb-10">
              <div className="space-y-4">
                 <BrandLogo size={14} color="#1c1917" />
                 <div>
                    <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">MONTHLY <span className="text-stone-300">AUDIT</span></h1>
                    <p className="text-[10px] font-bold text-stone-400 mt-2 uppercase tracking-[0.3em]">INTEGRATED OPERATIONAL CONSOLE</p>
                 </div>
              </div>
              <div className="text-right space-y-3">
                 <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1">Periode Laporan</p>
                    <p className="text-sm font-black text-stone-900 uppercase">{months[selectedMonth]} {selectedYear}</p>
                 </div>
                 <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">SAGA-MASTER-{selectedYear}{selectedMonth+1}</p>
              </div>
           </div>

           {/* Grand Totals Summary */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-950 p-8 rounded-[2rem] text-white flex flex-col shadow-xl">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Grand Monthly Revenue</span>
                 <p className="text-2xl font-black font-mono">Rp{totalRevAll.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 flex flex-col shadow-sm">
                 <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] block mb-2">Total Project Expenses</span>
                 <p className="text-2xl font-black text-stone-900 font-mono">Rp{totalExpenseAll.toLocaleString('id-ID')}</p>
              </div>
           </div>

           {/* PROJECT BREAKDOWN SECTION (DYNAMIC) */}
           <div className="space-y-12">
              <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Briefcase size={20}/></div>
                <div>
                   <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em]">PROJECT PROFIT SHARING & DISTRIBUTION</h3>
                   <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Detailed analysis per event</p>
                </div>
              </div>

              {projectIds.length === 0 ? (
                <div className="py-20 text-center opacity-20"><Info size={40} className="mx-auto"/><p className="text-[10px] font-black uppercase mt-4">Tidak ada proyek aktif bulan ini</p></div>
              ) : (
                projectIds.map(pid => {
                  const project = trips.find(t => t.id === pid);
                  if (!project) return null;

                  const pTasks = filteredTasks.filter(t => t.tripId === pid);
                  const pRev = pTasks.filter(t => t.category === 'peserta' && t.status === 'paid').reduce((a, b) => a + b.price, 0);
                  const pExp = pTasks.filter(t => t.category !== 'peserta').reduce((a, b) => a + (b.price * b.qty), 0);
                  const pNet = Math.max(0, pRev - pExp);

                  const { royalty, kasTrip, team: teamPool } = calculateSharing(pNet);
                  const staffResults = calculateStaffSharing(pid, teamPool);

                  return (
                    <div key={pid} className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
                       <div className="bg-stone-50/50 p-8 flex justify-between items-center border-b border-stone-100">
                          <div>
                             <h4 className="text-lg font-black text-stone-900 uppercase tracking-tighter">{project.name}</h4>
                             <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">{project.date} • {project.location}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest block mb-1">Project Profit</span>
                             <p className="text-lg font-black text-emerald-700 font-mono">Rp{pNet.toLocaleString('id-ID')}</p>
                          </div>
                       </div>
                       
                       <div className="p-8 space-y-8">
                          {/* Share Matrix for this project */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-white p-5 rounded-3xl border border-stone-50 space-y-2">
                                <div className="flex items-center justify-between">
                                   <ShieldCheck size={14} className="text-indigo-400"/>
                                   <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">5% ROYAKTI</span>
                                </div>
                                <p className="text-sm font-black text-stone-900 font-mono">Rp{royalty.toLocaleString('id-ID')}</p>
                             </div>
                             <div className="bg-white p-5 rounded-3xl border border-stone-50 space-y-2">
                                <div className="flex items-center justify-between">
                                   <Wallet size={14} className="text-emerald-400"/>
                                   <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">20% KAS</span>
                                </div>
                                <p className="text-sm font-black text-stone-900 font-mono">Rp{kasTrip.toLocaleString('id-ID')}</p>
                             </div>
                             <div className="bg-white p-5 rounded-3xl border border-stone-50 space-y-2 shadow-sm border-slate-100 bg-slate-50/30">
                                <div className="flex items-center justify-between">
                                   <Users size={14} className="text-slate-400"/>
                                   <span className="text-[8px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">75% TEAM</span>
                                </div>
                                <p className="text-sm font-black text-stone-900 font-mono">Rp{teamPool.toLocaleString('id-ID')}</p>
                             </div>
                          </div>

                          {/* Individual Distribution */}
                          <div className="space-y-4">
                             <h5 className="text-[9px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-1 bg-stone-300 rounded-full"></div> Individual Distributions (Weighted)
                             </h5>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {staffResults.length === 0 ? (
                                  <p className="text-[9px] italic text-stone-300">Belum ada data absensi untuk proyek ini</p>
                                ) : (
                                  staffResults.map((s, idx) => (
                                    <div key={idx} className="bg-stone-50/50 px-6 py-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                                       <div>
                                          <p className="text-[10px] font-black text-stone-900 uppercase">{s.name}</p>
                                          <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">{s.totalPoints} Pts • {s.sharePercentage}% Share</p>
                                       </div>
                                       <p className="text-[11px] font-black text-stone-900 font-mono">Rp{s.amount.toLocaleString('id-ID')}</p>
                                    </div>
                                  ))
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
           </div>

           {/* Metrics Grid */}
           <div className="space-y-6 pt-10 border-t border-stone-100">
              <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] bg-stone-50 px-4 py-2 w-fit rounded-full flex items-center gap-2"><TrendingUp size={14}/> Period Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 text-center flex flex-col items-center justify-center space-y-2">
                    <p className="text-4xl font-black text-stone-900 leading-none">{participantsAll.length}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mt-2">Paid Participants (Pax)</p>
                 </div>
                 <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 text-center flex flex-col items-center justify-center space-y-2">
                    <p className="text-4xl font-black text-stone-900 leading-none">{projectIds.length}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mt-2">Projects Completed</p>
                 </div>
              </div>
           </div>

           {/* Signatures */}
           <div className="pt-20 grid grid-cols-2 gap-20 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest border-t border-dashed border-stone-100 mt-auto">
              <div className="space-y-20">
                 <p>Operations Lead</p>
                 <div className="flex flex-col items-center">
                    <div className="border-b border-stone-200 w-48 mb-3"></div>
                    <p className="text-stone-900 font-black italic tracking-tighter">SAGA ADVENTURE CREW</p>
                 </div>
              </div>
              <div className="space-y-20">
                 <p>Master Validation</p>
                 <div className="flex flex-col items-center">
                    <div className="border-b border-stone-200 w-48 mb-3"></div>
                    <p className="text-stone-900 font-black italic tracking-tighter">OWNER / PROJECT MANAGER</p>
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
const SharingMetric = ({ label, value, icon, color, desc }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-3 group transition-all hover:shadow-md">
     <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl bg-stone-50 ${color}`}>{icon}</div>
        <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{label}</span>
     </div>
     <div>
        <p className="text-lg font-black text-stone-900 font-mono">Rp{value.toLocaleString('id-ID')}</p>
        <p className="text-[7px] font-black text-stone-300 uppercase tracking-widest mt-0.5">{desc}</p>
     </div>
  </div>
);

const CollapsibleTable = ({ id, title, icon, summary, isExpanded, onToggle, children }: any) => (
  <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden transition-all duration-300">
    <button 
      onClick={onToggle}
      className={`w-full p-6 flex items-center justify-between text-left transition-colors print:hidden ${isExpanded ? 'bg-stone-50' : 'bg-white hover:bg-stone-50/50'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">{title}</h3>
          {!isExpanded && summary && (
             <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{summary}</p>
          )}
        </div>
      </div>
      <div className="text-stone-300">
        {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
      </div>
    </button>
    
    <div className="hidden print:flex p-6 items-center justify-between border-b border-stone-100">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-stone-900 text-white">{icon}</div>
        <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">{title}</h3>
      </div>
      <p className="text-[10px] font-black text-stone-900 font-mono">{summary}</p>
    </div>

    <div className={`${isExpanded ? 'block' : 'hidden'} print:block animate-in fade-in slide-in-from-top-2 duration-300 overflow-x-auto no-scrollbar`}>
      <div className="min-w-full">
        {children}
      </div>
    </div>
  </div>
);

const SectionTerms = ({ title, icon, items }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4 border-b border-stone-50 pb-3">
       <div className="p-2.5 bg-stone-900 text-white rounded-xl shadow-md">{icon}</div>
       <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="space-y-6">
       {items.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-4 group">
             <div className="text-[10px] font-black text-stone-300 bg-stone-50 w-7 h-7 flex items-center justify-center rounded-lg shrink-0">{idx+1}</div>
             <div>
                <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-tight mb-1">{item.label}</h4>
                <p className="text-[11px] font-medium text-stone-500 leading-relaxed">{item.text}</p>
             </div>
          </div>
       ))}
    </div>
  </div>
);

const DashboardCard = ({ title, desc, icon, color, onClick, isLocked }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md relative overflow-hidden`}>
    <div className="relative z-10">
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-2xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
         {title} {isLocked && <Lock size={10} className="text-white/40" />}
       </h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
    {isLocked && (
      <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] group-hover:scale-110 transition-transform">
        <ShieldCheck size={120} />
      </div>
    )}
  </button>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl transition-all border ${active ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-300 border-stone-100'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

export default OpenTripPage;