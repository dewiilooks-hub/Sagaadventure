
import React, { useState, useEffect } from 'react';
// Fixed: Using compat import for Firebase v8 style code
import firebase from 'firebase/compat/app';
import { 
  ChevronLeft, Unlock, Lock, Tent, Coffee, Users, 
  Trash2, Plus, ListChecks, Calendar, Wallet, 
  RotateCcw, CheckCircle2, Square, ShoppingCart, 
  PlusSquare, ArrowRight, BarChart3, AlertCircle
} from 'lucide-react';
import { db, appId } from '../services/firebase';
import { OpenTripTask, TripEvent, TripExpense } from '../types';
import BrandLogo from './BrandLogo';

type TripSubView = 'dashboard' | 'tasks' | 'trips' | 'expenses';

interface OpenTripPageProps {
  // Fixed: Using compat User type
  user: firebase.User | null;
  onBack: () => void;
}

const OpenTripPage: React.FC<OpenTripPageProps> = ({ user, onBack }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [subView, setSubView] = useState<TripSubView>('dashboard');
  const [activeTab, setActiveTab] = useState<'equip' | 'logistik' | 'peserta'>('equip');
  const [showInputRow, setShowInputRow] = useState(false);
  
  // Data States
  const [tasks, setTasks] = useState<OpenTripTask[]>([]);
  const [trips, setTrips] = useState<TripEvent[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    pic: '',
    qty: 1,
    unit: 'pcs',
    price: '',
    status: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'logistik' as TripExpense['category']
  });

  const isDemoMode = !db;

  useEffect(() => {
    if (isDemoMode) {
      const savedTasks = localStorage.getItem(`saga_tasks_${appId}`);
      const savedTrips = localStorage.getItem(`saga_trips_${appId}`);
      const savedExps = localStorage.getItem(`saga_expenses_${appId}`);
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedTrips) setTrips(JSON.parse(savedTrips));
      if (savedExps) setExpenses(JSON.parse(savedExps));
      return;
    }
    
    const unsubTasks = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as OpenTripTask[]));

    const unsubTrips = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_trips')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTrips(s.docs.map(d => ({ id: d.id, ...d.data() })) as TripEvent[]));

    const unsubExps = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_expenses')
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })) as TripExpense[]));

    return () => { unsubTasks(); unsubTrips(); unsubExps(); };
  }, [isDemoMode]);

  const handleReset = async () => {
    if (!window.confirm(`Mulai baru checklist ${activeTab.toUpperCase()}?`)) return;
    if (isDemoMode) {
      const filtered = tasks.filter(t => t.category !== activeTab);
      setTasks(filtered);
      localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(filtered));
    } else {
      const snap = await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').get();
      const batch = db!.batch();
      snap.docs.forEach(d => { if (d.data().category === activeTab) batch.delete(d.ref); });
      await batch.commit();
    }
  };

  const handleAddTask = async () => {
    if (!formData.name.trim()) return;
    const data = { 
      task: formData.name, pic: formData.pic || 'Admin', qty: formData.qty,
      unit: activeTab === 'logistik' ? formData.unit : (activeTab === 'peserta' ? 'pax' : 'unit'),
      price: parseInt(formData.price) || 0, status: formData.status || (activeTab === 'equip' ? 'rent' : activeTab === 'logistik' ? 'buy' : 'unpaid'),
      category: activeTab, isDone: false, 
      // Fixed: Using compat firestore property
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };
    if (isDemoMode) {
      const newList = [{ id: Date.now().toString(), ...data, createdAt: new Date().toISOString() } as any, ...tasks];
      setTasks(newList);
      localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(newList));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').add(data);
    }
    setFormData({ name: '', pic: '', qty: 1, unit: 'pcs', price: '', status: '' });
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return;
    const data = {
      description: expenseForm.description,
      amount: parseInt(expenseForm.amount) || 0,
      category: expenseForm.category,
      // Fixed: Using compat firestore property
      createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };
    if (isDemoMode) {
      const newList = [{ id: Date.now().toString(), ...data, createdAt: new Date().toISOString() } as any, ...expenses];
      setExpenses(newList);
      localStorage.setItem(`saga_expenses_${appId}`, JSON.stringify(newList));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_expenses').add(data);
    }
    setExpenseForm({ description: '', amount: '', category: 'logistik' });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Hapus catatan pengeluaran ini?")) return;
    if (isDemoMode) {
      const newList = expenses.filter(e => e.id !== id);
      setExpenses(newList);
      localStorage.setItem(`saga_expenses_${appId}`, JSON.stringify(newList));
    } else {
      await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_expenses').doc(id).delete();
    }
  };

  if (subView === 'dashboard') {
    return (
      <div className="p-8 space-y-6 bg-white min-h-screen animate-in fade-in">
        <div className="flex items-center justify-between mb-12">
           <button onClick={onBack} className="p-3 bg-stone-50 rounded-full text-stone-600 shadow-sm transition-all hover:bg-stone-100"><ChevronLeft size={18}/></button>
           <BrandLogo size={10} color="#1c1917" />
           <button onClick={() => setIsAdmin(!isAdmin)} className={`p-3 rounded-2xl transition-all ${isAdmin ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-stone-50 text-stone-200'}`}>
            {isAdmin ? <Unlock size={18}/> : <Lock size={18}/>}
          </button>
        </div>
        <div className="grid gap-4">
          <DashboardCard title="Checklist Ops" desc="Equip, Logistik, Peserta" icon={<ListChecks size={24}/>} color="bg-sky-600" onClick={() => setSubView('tasks')} />
          <DashboardCard title="Trip Event" desc="Manajemen Event" icon={<Calendar size={24}/>} color="bg-stone-900" onClick={() => setSubView('trips')} />
          <DashboardCard title="Keuangan" desc="Rekap Pengeluaran" icon={<Wallet size={24}/>} color="bg-amber-500" onClick={() => setSubView('expenses')} />
        </div>
      </div>
    );
  }

  if (subView === 'expenses') {
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    return (
      <div className="flex flex-col h-screen bg-stone-50 animate-in fade-in">
        <div className="p-6 bg-white border-b flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-4">
             <button onClick={() => setSubView('dashboard')} className="p-2 bg-stone-50 rounded-full"><ChevronLeft size={16}/></button>
             <h2 className="text-[10px] font-black uppercase tracking-widest">Rekap Pengeluaran</h2>
           </div>
           <div className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">
             Rp{totalExp.toLocaleString('id-ID')}
           </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6 pb-32">
           {isAdmin && (
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 space-y-4">
                <h3 className="text-[8px] font-black text-stone-300 uppercase tracking-widest">+ Tambah Pembelian/Biaya</h3>
                <input 
                  type="text" placeholder="Deskripsi (ex: Beli Sayur)" 
                  className="w-full bg-stone-50 border-none rounded-xl py-3 px-4 text-[11px] font-bold outline-none"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="number" placeholder="Nominal Rp" 
                    className="flex-1 bg-stone-50 border-none rounded-xl py-3 px-4 text-[11px] font-bold outline-none"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                  <select 
                    className="bg-stone-50 border-none rounded-xl px-3 text-[9px] font-black uppercase outline-none"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}
                  >
                    <option value="logistik">LOG</option>
                    <option value="transport">TRAN</option>
                    <option value="crew">CREW</option>
                    <option value="alat">ALAT</option>
                  </select>
                  <button onClick={handleAddExpense} className="bg-stone-900 text-white p-3 rounded-xl"><Plus size={18}/></button>
                </div>
             </div>
           )}

           <div className="space-y-3">
             {expenses.length === 0 ? (
               <div className="text-center py-20 opacity-10">
                 <BarChart3 size={48} className="mx-auto" />
                 <p className="text-[10px] font-black uppercase mt-4">Belum ada catatan</p>
               </div>
             ) : (
               expenses.map(exp => (
                 <div key={exp.id} className="bg-white p-5 rounded-2xl border border-stone-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-shadow">
                    <div>
                       <span className="text-[7px] font-black uppercase tracking-widest text-stone-300 bg-stone-50 px-2 py-0.5 rounded-full mb-1 inline-block">{exp.category}</span>
                       <h4 className="text-[11px] font-bold uppercase tracking-tight text-stone-800">{exp.description}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-[11px] font-black text-rose-600">- Rp{exp.amount.toLocaleString('id-ID')}</span>
                       {isAdmin && (
                         <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-stone-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
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

  // Tasks and Trips views remain, ensuring task delete logic is robust
  if (subView === 'tasks') {
    const filteredTasks = tasks.filter(t => t.category === activeTab);
    return (
      <div className="flex flex-col h-screen bg-white animate-in fade-in relative overflow-hidden font-sans">
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView('dashboard')} className="p-2 bg-stone-50 rounded-full text-stone-600 transition-all hover:bg-stone-100"><ChevronLeft size={16}/></button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">Checklist Module</h2>
          </div>
          <div className="flex items-center gap-2">
             {isAdmin && <button onClick={handleReset} className="p-2 text-stone-300 hover:text-rose-500 transition-colors" title="Reset Data"><RotateCcw size={16}/></button>}
             <button onClick={() => setShowInputRow(!showInputRow)} className={`p-2.5 rounded-xl shadow-lg transition-all ${showInputRow ? 'bg-stone-900 text-white scale-110' : 'bg-stone-50 text-stone-400 hover:text-stone-900'}`}>
                <PlusSquare size={22} />
             </button>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-2 bg-stone-50/20 border-b border-stone-50">
          <TabButton active={activeTab === 'equip'} onClick={() => setActiveTab('equip')} icon={<Tent size={14}/>} label="Equip" />
          <TabButton active={activeTab === 'logistik'} onClick={() => setActiveTab('logistik')} icon={<Coffee size={14}/>} label="Logistik" />
          <TabButton active={activeTab === 'peserta'} onClick={() => setActiveTab('peserta')} icon={<Users size={14}/>} label="Peserta" />
        </div>

        <div className="flex-1 overflow-auto bg-white flex flex-col pb-20">
          {isAdmin && showInputRow && (
            <div className="bg-stone-50/40 border-b border-stone-100 p-6 space-y-4 animate-in slide-in-from-top duration-500">
               <div className="grid grid-cols-[2fr_0.6fr_1fr_1fr_0.8fr_0.5fr] gap-3 px-1">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">NAMA BARANG</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest text-center">QTY</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest text-center">HARGA</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest text-center">STATUS</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest text-center">PIC</span>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest text-center">ADD</span>
               </div>
               <div className="grid grid-cols-[2fr_0.6fr_1fr_1fr_0.8fr_0.5fr] gap-3 items-center">
                  <input type="text" placeholder="Input Manual..." className="bg-stone-100 border-none rounded-lg px-4 py-3 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-stone-300" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                  <input type="number" className="bg-stone-100 border-none rounded-lg py-3 text-[11px] font-bold text-center outline-none" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 1})}/>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-stone-300">Rp</span>
                    <input type="number" className="w-full bg-stone-100 border-none rounded-lg pl-6 pr-1 py-3 text-[11px] font-bold outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                  </div>
                  <select className="bg-stone-100 border-none rounded-lg py-3 text-[9px] font-black uppercase outline-none px-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="">STATUS</option>
                    {activeTab === 'equip' ? <><option value="rent">RENT</option><option value="buy">BUY</option></> :
                     activeTab === 'logistik' ? <><option value="buy">BUY</option><option value="stok">STOK</option></> :
                     <><option value="paid">PAID</option><option value="unpaid">UNPAID</option></>}
                  </select>
                  <input type="text" placeholder="PIC" className="bg-stone-100 border-none rounded-lg py-3 text-[10px] font-black uppercase text-center outline-none" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})}/>
                  <button onClick={handleAddTask} className="bg-stone-900 text-white rounded-lg flex items-center justify-center py-3"><Plus size={18}/></button>
               </div>
            </div>
          )}

          <div className="px-6 py-4 grid grid-cols-[2fr_0.6fr_1fr_0.8fr_0.8fr_0.4fr] gap-3 items-center border-b border-stone-50 bg-white sticky top-0 z-20">
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">NAMA</span>
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest text-center">QTY</span>
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest text-center">HARGA</span>
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest text-center">STATUS</span>
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest text-center">PIC</span>
             <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest text-center">CEK</span>
          </div>

          <div className="flex-1 space-y-px">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-5"><ShoppingCart size={64} /><p className="text-[12px] font-black uppercase mt-4 tracking-[0.5em]">Empty</p></div>
            ) : (
              filteredTasks.map(item => (
                <div key={item.id} className={`px-6 py-4 grid grid-cols-[2fr_0.6fr_1fr_0.8fr_0.8fr_0.4fr] gap-3 items-center group border-b border-stone-50 hover:bg-stone-50/50 transition-all ${item.isDone ? 'opacity-30 grayscale' : ''}`}>
                   <div className="flex items-center gap-2 overflow-hidden">
                      {isAdmin && (
                        <button onClick={async () => {
                           if(!window.confirm("Hapus baris?")) return;
                           if(isDemoMode){
                             const n = tasks.filter(x => x.id !== item.id); setTasks(n);
                             localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(n));
                           } else { await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').doc(item.id).delete(); }
                        }} className="text-stone-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={12}/></button>
                      )}
                      <span className="text-[11px] font-bold uppercase truncate tracking-tight">{item.task}</span>
                   </div>
                   <span className="text-[10px] font-black text-stone-400 text-center">{item.qty}</span>
                   <span className="text-[10px] font-black text-emerald-700 text-right">Rp{item.price.toLocaleString('id-ID')}</span>
                   <div className="flex justify-center"><span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter bg-stone-100 text-stone-400`}>{item.status}</span></div>
                   <span className="text-[8px] font-bold text-stone-300 text-center uppercase truncate">{item.pic}</span>
                   <button onClick={async () => {
                      if (isDemoMode) {
                        const n = tasks.map(t => t.id === item.id ? { ...t, isDone: !t.isDone } : t); setTasks(n);
                        localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(n));
                      } else { await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks').doc(item.id).update({ isDone: !item.isDone }); }
                   }} className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${item.isDone ? 'bg-emerald-500 text-white' : 'bg-stone-50 text-stone-200 border'}`}>
                     {item.isDone ? <CheckCircle2 size={16} /> : <Square size={16} />}
                   </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2.5rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md`}>
    <div>
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-2xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
  </button>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all border ${active ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-300 border-stone-100'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default OpenTripPage;
