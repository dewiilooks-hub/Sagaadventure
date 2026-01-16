
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
  XCircle
} from 'lucide-react';
import { db, appId, getBestCollection } from '../services/firebase';
import { OpenTripTask, TripEvent, TripExpense, StaffAttendance } from '../types';
import BrandLogo from './BrandLogo';
import TicketPage from './TicketPage';

type TripSubView = 'dashboard' | 'tasks' | 'trips' | 'expenses' | 'trip_detail' | 'closing_report' | 'ticket' | 'attendance' | 'terms_opentrip';

interface OpenTripPageProps {
  user: firebase.User | null;
  onBack: () => void;
}

const OpenTripPage: React.FC<OpenTripPageProps> = ({ user, onBack }) => {
  const [subView, setSubView] = useState<TripSubView>('dashboard');
  const [activeTab, setActiveTab] = useState<'equip' | 'logistik' | 'operasional'>('equip');
  const [showInputRow, setShowInputRow] = useState(true); 
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
  const [selectedTrip, setSelectedTrip] = useState<TripEvent | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '', pic: '', qty: 1, unit: '', price: '', status: '', tripId: ''
  });

  const [attendForm, setAttendForm] = useState({
    staffName: '', role: '', status: 'hadir' as StaffAttendance['status'], tripId: ''
  });

  const [editFormData, setEditFormData] = useState<any>(null);

  const [tripForm, setTripForm] = useState({
    name: '', date: '', pic: '', location: '', status: 'planning' as TripEvent['status']
  });

  const isDemoMode = !db || !getBestCollection('saga_tasks') || !getBestCollection('saga_trips') || !getBestCollection('saga_attendance');

  // Load Data
  useEffect(() => {
    if (isDemoMode) {
      const savedTasks = localStorage.getItem(`saga_tasks_${appId}`);
      const savedTrips = localStorage.getItem(`saga_trips_${appId}`);
      const savedAttend = localStorage.getItem(`saga_attend_${appId}`);
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedTrips) setTrips(JSON.parse(savedTrips));
      if (savedAttend) setAttendance(JSON.parse(savedAttend));
      return;
    }
    
    const tasksCol = getBestCollection('saga_tasks');
    const tripsCol = getBestCollection('saga_trips');
    const attendCol = getBestCollection('saga_attendance');

    const unsubTasks = tasksCol!
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })) as OpenTripTask[]));

    const unsubTrips = tripsCol!
      .orderBy('createdAt', 'desc')
      .onSnapshot((s) => setTrips(s.docs.map(d => ({ id: d.id, ...d.data() })) as TripEvent[]));

    const unsubAttend = attendCol!
      .orderBy('timestamp', 'desc')
      .onSnapshot((s) => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })) as StaffAttendance[]));

    return () => { unsubTasks(); unsubTrips(); unsubAttend(); };
  }, [isDemoMode]);

  // Sync to LocalStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(tasks));
      localStorage.setItem(`saga_trips_${appId}`, JSON.stringify(trips));
      localStorage.setItem(`saga_attend_${appId}`, JSON.stringify(attendance));
    }
  }, [tasks, trips, attendance, isDemoMode]);

  const handleAddTrip = async () => {
    if (!tripForm.name) return alert("Nama Proyek Wajib Diisi");
    const data = { ...tripForm, createdAt: new Date().toISOString() };
    if (isDemoMode) {
      setTrips([{ id: Date.now().toString(), ...data } as any, ...trips]);
    } else {
      const tripsCol = getBestCollection('saga_trips');
      if (tripsCol) await tripsCol.add(data);
    }
    setTripForm({ name: '', date: '', pic: '', location: '', status: 'planning' });
    setShowAddProject(false);
  };

  const handleAddAttendance = async () => {
    if (!attendForm.staffName || !attendForm.tripId) return alert("Lengkapi data absensi!");
    const data = { ...attendForm, timestamp: new Date().toISOString() };
    if (isDemoMode) {
      setAttendance([{ id: Date.now().toString(), ...data } as StaffAttendance, ...attendance]);
    } else {
      const attendCol = getBestCollection('saga_attendance');
      if (attendCol) await attendCol.add(data);
    }
    setAttendForm({ staffName: '', role: '', status: 'hadir', tripId: '' });
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm("Hapus catatan absensi ini?")) return;
    if (isDemoMode) {
      setAttendance(attendance.filter(a => a.id !== id));
    } else {
      const attendCol = getBestCollection('saga_attendance');
      if (attendCol) await attendCol.doc(id).delete();
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm("Hapus proyek ini secara permanen?")) return;
    if (isDemoMode) {
      setTrips(trips.filter(t => t.id !== id));
    } else {
      try {
        const tripsCol = getBestCollection('saga_trips');
        if (tripsCol) await tripsCol.doc(id).delete();
      } catch (err) {
        alert("Gagal menghapus proyek.");
      }
    }
  };

  const handleSaveFromTicket = async (taskData: any) => {
    const finalData = { ...taskData, createdAt: new Date().toISOString() };
    if (isDemoMode) {
      setTasks([{ id: Date.now().toString(), ...finalData } as any, ...tasks]);
    } else {
      const tasksCol = getBestCollection('saga_tasks');
      if (tasksCol) await tasksCol.add(finalData);
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
      status: formData.status || (activeTab === 'equip' ? 'ready' : activeTab === 'logistik' ? 'ready' : 'biaya'),
      category: activeTab, 
      tripId: formData.tripId || '',
      isDone: false, 
      createdAt: new Date().toISOString()
    };
    
    if (isDemoMode) {
      setTasks([{ id: Date.now().toString(), ...data } as any, ...tasks]);
    } else {
      const tasksCol = getBestCollection('saga_tasks');
      if (tasksCol) await tasksCol.add(data);
    }
    setFormData({ name: '', pic: '', qty: 1, unit: '', price: '', status: '', tripId: '' });
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
        const tasksCol = getBestCollection('saga_tasks');
        if (tasksCol) await tasksCol.doc(id).update(updated);
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
          const tasksCol = getBestCollection('saga_tasks');
          if (tasksCol) await tasksCol.doc(id).delete();
        } catch (e) {
          alert("Gagal menghapus data.");
        }
    }
  };

  // View: Dashboard
  if (subView === 'dashboard') {
    return (
      <div className="p-8 space-y-6 bg-white min-h-screen">
        <div className="flex items-center justify-between mb-12">
           <button onClick={onBack} className="p-3 bg-stone-50 rounded-full text-stone-600 hover:bg-stone-100 transition-all"><ChevronLeft size={18}/></button>
           <BrandLogo size={10} color="#1c1917" />
           <div className="w-10"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <DashboardCard title="Master Project Hub" desc="Pusat Data & Finansial" icon={<Calendar size={24}/>} color="bg-stone-900" onClick={() => setSubView('trips')} />
          <DashboardCard title="Checklist Ops" desc="Alat, Logistik & Operasional" icon={<ListChecks size={24}/>} color="bg-sky-600" onClick={() => setSubView('tasks')} />
          <DashboardCard title="Ticket System" desc="E-Ticket & Manifest Tamu" icon={<Ticket size={24}/>} color="bg-indigo-600" onClick={() => setSubView('ticket')} />
          <DashboardCard title="Absensi Staff" desc="Kontrol Kehadiran Crew" icon={<ClipboardCheck size={24}/>} color="bg-emerald-700" onClick={() => setSubView('attendance')} />
          <DashboardCard title="S&K Open Trip" desc="Proteksi Peserta & Owner" icon={<ShieldCheck size={24}/>} color="bg-orange-800" onClick={() => setSubView('terms_opentrip')} />
          <DashboardCard title="Closing Report" desc="Laporan Bulanan" icon={<BarChart3 size={24}/>} color="bg-stone-800" onClick={() => setSubView('closing_report')} />
        </div>
      </div>
    );
  }

  // View: Ticket System
  if (subView === 'ticket') {
    // Fixed: Correctly using setSubView instead of setSubTab
    return <TicketPage onBack={() => setSubView('dashboard')} trips={trips} onSave={handleSaveFromTicket} />;
  }

  // View: Absensi Staff
  if (subView === 'attendance') {
    return (
      <div className="p-8 space-y-8 bg-white min-h-screen">
        <div className="flex items-center justify-between mb-8 print:hidden">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full text-stone-600 active:scale-95"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Staff Attendance</h2>
           <div className="w-10"></div>
        </div>

        <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 space-y-4 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Log Kehadiran Baru</h3>
           <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="Nama Staff" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm" value={attendForm.staffName} onChange={e => setAttendForm({...attendForm, staffName: e.target.value})} />
                 <input type="text" placeholder="Jabatan (ex: Leader)" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm" value={attendForm.role} onChange={e => setAttendForm({...attendForm, role: e.target.value})} />
              </div>
              <select className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm" value={attendForm.tripId} onChange={e => setAttendForm({...attendForm, tripId: e.target.value})}>
                 <option value="">-- Pilih Proyek --</option>
                 {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="grid grid-cols-4 gap-2">
                 {['hadir', 'izin', 'sakit', 'tugas'].map(s => (
                   <button key={s} onClick={() => setAttendForm({...attendForm, status: s as any})} className={`py-3 rounded-xl text-[8px] font-black uppercase border transition-all ${attendForm.status === s ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100'}`}>{s}</button>
                 ))}
              </div>
              <button onClick={handleAddAttendance} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg mt-2 active:scale-95">Simpan Absensi</button>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Riwayat Kehadiran</h3>
           {attendance.length === 0 ? (
             <div className="py-20 text-center opacity-10"><ClipboardCheck size={48} className="mx-auto"/><p className="text-[10px] font-black uppercase mt-2">Belum ada data</p></div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="border-b border-stone-100">
                    <tr className="text-[8px] font-black text-stone-300 uppercase tracking-widest">
                       <th className="py-4 px-2">Staff / Role</th>
                       <th className="py-4 px-2">Proyek</th>
                       <th className="py-4 px-2">Status</th>
                       <th className="py-4 px-2 text-right">Waktu</th>
                       <th className="py-4 px-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-2">
                          <p className="text-[10px] font-black text-stone-900 uppercase">{a.staffName}</p>
                          <p className="text-[7px] font-bold text-stone-400 uppercase tracking-widest">{a.role}</p>
                        </td>
                        <td className="py-4 px-2 text-[9px] font-black text-stone-500 uppercase">{trips.find(t=>t.id===a.tripId)?.name || 'General'}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${a.status === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{a.status}</span>
                        </td>
                        <td className="py-4 px-2 text-right text-[9px] font-mono text-stone-400">{new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="py-4 px-2 text-center">
                           <button onClick={() => handleDeleteAttendance(a.id)} className="text-stone-300 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           )}
        </div>
      </div>
    );
  }

  // View: S&K Open Trip
  if (subView === 'terms_opentrip') {
    return (
      <div className="p-8 space-y-12 bg-white min-h-screen">
        <div className="flex items-center justify-between mb-8 print:hidden">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-stone-50 rounded-full text-stone-600 active:scale-95"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Legal & Terms</h2>
           <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full"><Printer size={18}/></button>
        </div>

        <div className="bg-white border-t-[14px] border-stone-900 p-10 space-y-12 shadow-sm print:border-none print:p-0">
           <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8">
              <div>
                 <BrandLogo size={14} color="#1c1917" />
                 <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tighter mt-4">OFFICIAL TERMS <span className="text-stone-300">& PROTECTION</span></h1>
                 <p className="text-[10px] font-black text-stone-400 mt-2 uppercase tracking-[0.3em]">SAGA ADVENTURE OPERATIONAL PROCEDURE</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                 <ShieldCheck size={48} className="text-stone-100" />
                 <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Validated for 2026/2027</p>
              </div>
           </div>

           <div className="space-y-10">
              <SectionTerms 
                title="1. Kebijakan Pembatalan" 
                icon={<XCircle size={16}/>}
                items={[
                  { label: "H-7 (H-Seminggu)", text: "Pembatalan oleh peserta pada H-7 dikenakan denda 50% dari total biaya perjalanan." },
                  { label: "H-1 atau Kurang", text: "Pembatalan pada H-1 atau kurang mengakibatkan biaya hangus (No Refund) sepenuhnya." },
                  { label: "Force Majeure", text: "Penyelenggara tidak bertanggung jawab atas kerugian akibat bencana alam atau penutupan jalur oleh otoritas berwenang." }
                ]}
              />

              <SectionTerms 
                title="2. Kesehatan & Keselamatan" 
                icon={<HeartPulse size={16}/>}
                items={[
                  { label: "Kejujuran Medis", text: "Peserta wajib jujur mengenai kondisi fisik. Kami berhak memulangkan peserta yang membahayakan tim tanpa ganti rugi biaya." },
                  { label: "Obat-obatan Pribadi", text: "Peserta wajib membawa obat-obatan pribadi; panitia hanya menyediakan P3K standar operasional." }
                ]}
              />

              <SectionTerms 
                title="3. Izin & Kontak Darurat" 
                icon={<PhoneCall size={16}/>}
                items={[
                  { label: "Izin Keluarga", text: "Dengan menyetujui atau mengikuti kegiatan ini, peserta menyatakan telah mendapatkan izin dan telah menginformasikan rencana perjalanan kepada keluarga/kerabat dekat." },
                  { label: "Kontak Darurat", text: "Peserta wajib melampirkan nomor telepon keluarga atau kerabat dekat yang dapat dihubungi dalam keadaan darurat." }
                ]}
              />

              <SectionTerms 
                title="4. Evakuasi Darurat" 
                icon={<ShieldAlert size={16}/>}
                items={[
                  { label: "Logistik Awal", text: "Penyelenggara memfasilitasi logistik evakuasi awal di lapangan." },
                  { label: "Biaya Lanjutan", text: "Biaya evakuasi lanjutan di luar jangkauan asuransi menjadi tanggung jawab penuh peserta." }
                ]}
              />
           </div>

           <div className="mt-20 pt-16 border-t border-stone-100 grid grid-cols-2 gap-20 text-center text-[10px] font-black text-stone-200 uppercase tracking-widest">
              <div className="space-y-20">
                 <p>Divalidasi Oleh</p>
                 <div className="flex flex-col items-center">
                    <div className="border-b border-stone-100 w-40 mb-2"></div>
                    <p className="text-stone-900 italic font-bold">MANAJEMEN SAGA</p>
                 </div>
              </div>
              <div className="space-y-20">
                 <p>Head of Operations</p>
                 <div className="flex flex-col items-center">
                    <div className="border-b border-stone-100 w-40 mb-2"></div>
                    <p className="text-stone-900 italic font-bold">CHIEF TRIP LEADER</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // View: Master Trip Project Detail
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
           <button onClick={() => setSubView('trips')} className="p-3 bg-stone-50 rounded-full text-stone-600 active:scale-95"><ChevronLeft size={18}/></button>
           <h2 className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Integrated Project Detail</h2>
           <button onClick={() => window.print()} className="p-3 bg-stone-900 text-white rounded-full shadow-lg active:scale-95 transition-all"><Printer size={18}/></button>
        </div>

        <div className="space-y-10">
           <div className="border-b-2 border-stone-100 pb-8">
              <div className="flex items-center justify-between">
                <BrandLogo size={12} color="#1c1917" />
                <span className="text-[8px] font-black bg-stone-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">{selectedTrip.status}</span>
              </div>
              <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tighter mt-4 leading-tight">{selectedTrip.name}</h1>
              <div className="flex flex-wrap gap-6 mt-6">
                 <div className="flex items-center gap-2.5 text-stone-400 font-bold text-[10px] uppercase"><Calendar size={14} className="text-stone-300"/> {selectedTrip.date}</div>
                 <div className="flex items-center gap-2.5 text-stone-400 font-bold text-[10px] uppercase"><MapPin size={14} className="text-stone-300"/> {selectedTrip.location}</div>
                 <div className="flex items-center gap-2.5 text-stone-400 font-bold text-[10px] uppercase"><User size={14} className="text-stone-300"/> PIC: {selectedTrip.pic}</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-3">Total Revenue (Paid)</span>
                    <p className="text-2xl font-black font-mono">Rp{totalIncome.toLocaleString('id-ID')}</p>
                 </div>
                 <Users size={48} className="opacity-10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
              </div>
              <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-200 flex justify-between items-center shadow-sm relative overflow-hidden group">
                 <div className="relative z-10">
                    <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] block mb-3">Operational Expenses</span>
                    <p className="text-2xl font-black text-stone-900 font-mono">Rp{totalExpense.toLocaleString('id-ID')}</p>
                 </div>
                 <Package size={48} className="text-stone-100 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
              </div>
           </div>

           {/* Collapsible Sections */}
           <div className="space-y-6">
              {/* Section 1: Manifest Tamu */}
              <CollapsibleTable 
                id="manifest"
                title="1. Manifest Tamu" 
                icon={<Users size={16}/>} 
                summary={`Rp ${totalIncome.toLocaleString('id-ID')} (${tripParticipants.length} Pax)`}
                isExpanded={expandedSections.manifest}
                onToggle={() => toggleSection('manifest')}
              >
                <table className="w-full text-[11px] font-bold uppercase">
                  <thead className="text-stone-300 text-[8px] tracking-widest text-left border-b border-stone-100 bg-stone-50/50">
                    <tr>
                      <th className="py-4 px-4">Nama Peserta</th>
                      <th className="py-4 px-4">Ticket ID</th>
                      <th className="py-4 px-4 text-right">Pembayaran</th>
                      <th className="py-4 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripParticipants.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center opacity-20 text-[9px] italic">Belum ada peserta terdaftar</td></tr>
                    ) : (
                      tripParticipants.map(p => (
                        <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors">
                          <td className="py-5 px-4 font-black text-stone-900">{p.task}</td>
                          <td className="py-5 px-4 font-mono text-stone-400">{p.ticketId || '-'}</td>
                          <td className="py-5 px-4 text-right font-black font-mono">Rp{p.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              {/* Section 2: Master Equip */}
              <CollapsibleTable 
                id="equip"
                title="2. Master Peralatan" 
                icon={<Tent size={16}/>} 
                summary={`Rp ${totalOutEquip.toLocaleString('id-ID')} (${tripEquip.length} Item)`}
                isExpanded={expandedSections.equip}
                onToggle={() => toggleSection('equip')}
              >
                <table className="w-full text-[11px] font-bold uppercase">
                  <thead className="text-stone-300 text-[8px] tracking-widest text-left border-b border-stone-100 bg-stone-50/50">
                    <tr>
                      <th className="py-4 px-4">Nama Alat</th>
                      <th className="py-4 px-4 text-center">Qty</th>
                      <th className="py-4 px-4 text-right">Biaya Satuan</th>
                      <th className="py-4 px-4 text-right">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripEquip.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center opacity-20 text-[9px] italic">Daftar peralatan kosong</td></tr>
                    ) : (
                      tripEquip.map(e => (
                        <tr key={e.id} className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors">
                          <td className="py-5 px-4 font-black text-stone-900">{e.task}</td>
                          <td className="py-5 px-4 text-center text-stone-500">{e.qty} PCS</td>
                          <td className="py-5 px-4 text-right font-mono text-stone-500">Rp{e.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-4 text-right font-black font-mono text-stone-900">Rp{(e.price * e.qty).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              {/* Section 3: Master Logistik */}
              <CollapsibleTable 
                id="logistik"
                title="3. Master Logistik" 
                icon={<Coffee size={16}/>} 
                summary={`Rp ${totalOutLogistik.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.logistik}
                onToggle={() => toggleSection('logistik')}
              >
                <table className="w-full text-[11px] font-bold uppercase">
                  <thead className="text-stone-300 text-[8px] tracking-widest text-left border-b border-stone-100 bg-stone-50/50">
                    <tr>
                      <th className="py-4 px-4">Bahan Logistik</th>
                      <th className="py-4 px-4 text-center">Volume/Unit</th>
                      <th className="py-4 px-4 text-right">Biaya Satuan</th>
                      <th className="py-4 px-4 text-right">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripLogistik.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center opacity-20 text-[9px] italic">Daftar logistik kosong</td></tr>
                    ) : (
                      tripLogistik.map(l => (
                        <tr key={l.id} className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors">
                          <td className="py-5 px-4 font-black text-stone-900">{l.task}</td>
                          <td className="py-5 px-4 text-center text-stone-500">{l.unit || 'GRAM'}</td>
                          <td className="py-5 px-4 text-right font-mono text-stone-500">Rp{l.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-4 text-right font-black font-mono text-stone-900">Rp{(l.price * l.qty).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CollapsibleTable>

              {/* Section 4: Operasional */}
              <CollapsibleTable 
                id="ops"
                title="4. Biaya Operasional" 
                icon={<Calculator size={16}/>} 
                summary={`Rp ${totalOutOps.toLocaleString('id-ID')}`}
                isExpanded={expandedSections.ops}
                onToggle={() => toggleSection('ops')}
              >
                <table className="w-full text-[11px] font-bold uppercase">
                  <thead className="text-stone-300 text-[8px] tracking-widest text-left border-b border-stone-100 bg-stone-50/50">
                    <tr>
                      <th className="py-4 px-4">Keterangan</th>
                      <th className="py-4 px-4 text-center">Qty</th>
                      <th className="py-4 px-4 text-right">Biaya Satuan</th>
                      <th className="py-4 px-4 text-right">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripOperasional.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center opacity-20 text-[9px] italic">Belum ada pengeluaran operasional</td></tr>
                    ) : (
                      tripOperasional.map(o => (
                        <tr key={o.id} className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors">
                          <td className="py-5 px-4 font-black text-stone-900">{o.task}</td>
                          <td className="py-5 px-4 text-center text-stone-500">{o.qty} UNIT</td>
                          <td className="py-5 px-4 text-right font-mono text-stone-500">Rp{o.price.toLocaleString('id-ID')}</td>
                          <td className="py-5 px-4 text-right font-black font-mono text-stone-900">Rp{(o.price * o.qty).toLocaleString('id-ID')}</td>
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

  // View: Checklist Ops
  if (subView === 'tasks') {
    const filteredTasks = tasks.filter(t => t.category === activeTab);
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-50 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView('dashboard')} className="p-2 bg-stone-50 rounded-full text-stone-600 transition-all active:scale-95"><ChevronLeft size={16}/></button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">Checklist Ops System</h2>
          </div>
          <button onClick={() => setShowInputRow(!showInputRow)} className={`p-2.5 rounded-xl shadow-lg transition-all ${showInputRow ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400'}`}>
             <PlusSquare size={22} />
          </button>
        </div>

        <div className="px-6 py-4 flex gap-2 bg-stone-50/20 border-b border-stone-50 print:hidden overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'equip'} onClick={() => {setActiveTab('equip'); setEditingId(null);}} icon={<Tent size={14}/>} label="Equip (Alat)" />
          <TabButton active={activeTab === 'logistik'} onClick={() => {setActiveTab('logistik'); setEditingId(null);}} icon={<Coffee size={14}/>} label="Logistik (Bahan)" />
          <TabButton active={activeTab === 'operasional'} onClick={() => {setActiveTab('operasional'); setEditingId(null);}} icon={<Calculator size={14}/>} label="Operasional (Biaya)" />
        </div>

        <div className="flex-1 overflow-auto bg-white flex flex-col pb-20">
          {showInputRow && (
            <div className="bg-stone-50/40 border-b border-stone-100 p-8 space-y-4 animate-in slide-in-from-top-4">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Input {activeTab} Baru</h3>
                 <button onClick={() => setShowInputRow(false)}><X size={14}/></button>
               </div>
               <div className="space-y-4 text-stone-900">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Nama Item</label>
                      <input type="text" placeholder="..." className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm text-stone-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">PIC Ops</label>
                      <input type="text" placeholder="PIC" className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none shadow-sm text-stone-900" value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})}/>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Hubungkan ke Proyek Master</label>
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
                      <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Harga (Rp)</label>
                      <input type="number" className="w-full bg-white border border-stone-300 rounded-xl px-2 py-3 text-[11px] font-black outline-none shadow-sm text-right font-mono text-stone-900" placeholder="Rp" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-stone-300 uppercase tracking-widest ml-1">Status</label>
                      <select className="w-full bg-white border border-stone-300 rounded-xl py-3 text-[9px] font-black uppercase outline-none px-1 shadow-sm text-stone-900" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        {activeTab === 'equip' && <><option value="ready">READY</option><option value="rent">RENT</option></>}
                        {activeTab === 'logistik' && <><option value="ready">READY</option><option value="buy">BUY</option></>}
                        {activeTab === 'operasional' && <><option value="biaya">BIAYA</option></>}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleAddTask} className="w-full bg-stone-900 text-white rounded-xl flex items-center justify-center py-3 shadow-xl active:scale-95 transition-all">
                        <Plus size={18}/>
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto">
             {filteredTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 opacity-10"><ShoppingCart size={64} /><p className="text-[10px] font-black uppercase mt-4 tracking-[0.5em]">Kosong</p></div>
             ) : (
               <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead className="bg-stone-50 border-b border-stone-100 sticky top-0 z-20">
                     <tr className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                        <th className="py-5 px-6 w-12 text-center">Cek</th>
                        <th className="py-5 px-4">Nama Item</th>
                        <th className="py-5 px-4 text-center">{activeTab === 'logistik' ? 'Takaran' : 'Qty'}</th>
                        <th className="py-5 px-4 text-right">Harga</th>
                        {(activeTab === 'equip' || activeTab === 'operasional') && <th className="py-5 px-4 text-right">Total</th>}
                        <th className="py-5 px-4 text-center">Status</th>
                        <th className="py-5 px-4">PIC</th>
                        <th className="py-5 px-4 text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                     {filteredTasks.map(item => {
                       const isEditing = editingId === item.id;
                       return (
                         <tr key={item.id} className={`group hover:bg-stone-50/50 transition-colors ${item.isDone ? 'bg-emerald-50/30' : ''}`}>
                            <td className="py-3 px-6 text-center">
                               <button onClick={async () => {
                                  const n = tasks.map(t => t.id === item.id ? { ...t, isDone: !t.isDone } : t);
                                  setTasks(n);
                                  if (!isDemoMode) {
                                    const tasksCol = getBestCollection('saga_tasks');
                                    if (tasksCol) await tasksCol.doc(item.id).update({ isDone: !item.isDone });
                                  }
                               }} className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all ${item.isDone ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-stone-100 border'}`}>
                                  {item.isDone ? <CheckCircle2 size={12} /> : <Square size={12} />}
                               </button>
                            </td>
                            <td className="py-3 px-4">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black uppercase text-stone-900 outline-none focus:ring-1 focus:ring-stone-400" value={editFormData.task} onChange={e => setEditFormData({...editFormData, task: e.target.value})} />
                               ) : (
                                 <div className="flex flex-col">
                                    <span className={`text-[11px] font-black uppercase tracking-tight ${item.isDone ? 'text-emerald-800' : 'text-stone-900'}`}>{item.task}</span>
                                    {item.tripId && <span className="text-[7px] font-black text-indigo-400 mt-0.5 uppercase tracking-tighter">{trips.find(t=>t.id===item.tripId)?.name}</span>}
                                 </div>
                               )}
                            </td>
                            <td className="py-3 px-4 text-center">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-1 py-2 text-[11px] font-black text-center text-stone-900 outline-none focus:ring-1 focus:ring-stone-400" value={activeTab === 'logistik' ? (editFormData.unit || '') : editFormData.qty} onChange={e => activeTab === 'logistik' ? setEditFormData({...editFormData, unit: e.target.value}) : setEditFormData({...editFormData, qty: e.target.value})} />
                               ) : (
                                 <span className="text-[10px] font-bold text-stone-500 uppercase">{activeTab === 'logistik' ? item.unit : item.qty}</span>
                               )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black text-right text-stone-900 outline-none focus:ring-1 focus:ring-stone-400" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
                               ) : (
                                 <span className="text-[10px] font-black text-stone-800">Rp{item.price.toLocaleString('id-ID')}</span>
                               )}
                            </td>
                            {(activeTab === 'equip' || activeTab === 'operasional') && (
                              <td className="py-3 px-4 text-right font-black text-stone-950 font-mono text-[10px] bg-stone-50/30">
                                Rp{(item.price * item.qty).toLocaleString('id-ID')}
                              </td>
                            )}
                            <td className="py-3 px-4 text-center">
                               {isEditing ? (
                                 <select className="text-[9px] font-black border border-stone-300 rounded-lg px-1 py-2 bg-white text-stone-900 outline-none focus:ring-1 focus:ring-stone-400" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                                    {activeTab === 'equip' && <><option value="ready">READY</option><option value="rent">RENT</option></>}
                                    {activeTab === 'logistik' && <><option value="ready">READY</option><option value="buy">BUY</option></>}
                                    {activeTab === 'operasional' && <><option value="biaya">BIAYA</option></>}
                                 </select>
                               ) : (
                                 <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase border ${item.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.status}</span>
                               )}
                            </td>
                            <td className="py-3 px-4">
                               {isEditing ? (
                                 <input className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-[11px] font-black text-stone-900 outline-none focus:ring-1 focus:ring-stone-400" value={editFormData.pic} onChange={e => setEditFormData({...editFormData, pic: e.target.value})} />
                               ) : (
                                 <span className="text-[10px] font-bold text-stone-400 uppercase truncate block max-w-[60px]">{item.pic}</span>
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

  // View: Master Trip Projects
  if (subView === 'trips') {
    return (
      <div className="p-8 space-y-6 bg-stone-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setSubView('dashboard')} className="p-3 bg-white rounded-full text-stone-600 shadow-sm transition-all active:scale-95"><ChevronLeft size={18}/></button>
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Event Projects</h2>
           <button onClick={() => setShowAddProject(!showAddProject)} className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${showAddProject ? 'bg-stone-900 text-white shadow-xl' : 'bg-white text-stone-900 border'}`}>
              <PlusSquare size={18}/> <span className="text-[8px] font-black uppercase tracking-widest">New Project</span>
           </button>
        </div>

        {showAddProject && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4 border border-stone-100 transition-all duration-300">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-stone-900 uppercase tracking-widest">Tambah Proyek Trip</h3>
             </div>
             <input type="text" placeholder="MISAL: EXPEDISI SEMERU" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100 text-stone-900" value={tripForm.name} onChange={e => setTripForm({...tripForm, name: e.target.value})} />
             <div className="grid grid-cols-2 gap-3">
                <input type="date" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none text-stone-900" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} />
                <input type="text" placeholder="PIC UTAMA" className="w-full bg-stone-50 rounded-2xl py-4 px-6 text-[11px] font-bold outline-none uppercase text-stone-900" value={tripForm.pic} onChange={e => setTripForm({...tripForm, pic: e.target.value})} />
             </div>
             <input type="text" placeholder="LOKASI / BASECAMP" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-[11px] font-bold uppercase outline-none text-stone-900" value={tripForm.location} onChange={e => setTripForm({...tripForm, location: e.target.value})} />
             <button onClick={handleAddTrip} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg active:scale-95 transition-all mt-4">Simpan Proyek</button>
          </div>
        )}

        <div className="space-y-4 pb-20">
           {trips.map(trip => (
             <div key={trip.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col gap-4 group transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                   <div className="flex-1 pr-4">
                      <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${trip.status === 'planning' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{trip.status}</span>
                      <h4 className="font-black text-base text-stone-900 uppercase tracking-tighter mt-2">{trip.name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                         <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-1.5"><Calendar size={12}/> {trip.date}</p>
                         <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-1.5"><MapPin size={12}/> {trip.location}</p>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => { setSelectedTrip(trip); setSubView('trip_detail'); }} className="flex-1 bg-stone-900 text-white py-4 rounded-2xl text-[8px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                      <Eye size={14}/> Buka Proyek
                   </button>
                   <button onClick={() => handleDeleteTrip(trip.id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  // View: Closing Report
  if (subView === 'closing_report') {
    const totalRev = tasks.filter(t => t.category === 'peserta' && t.status === 'paid').reduce((a,b)=>a+b.price, 0);
    const totalOutTasks = tasks.filter(t => (t.category === 'equip' || t.category === 'logistik' || t.category === 'operasional')).reduce((a,b) => a + (b.price * b.qty), 0);
    const finalExpense = totalOutTasks;

    return (
      <div className="bg-white min-h-screen p-8">
        <div className="flex items-center justify-between mb-10 print:hidden">
          <button onClick={() => setSubView('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-95"><ChevronLeft/></button>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Monthly Report Console</span>
          <button onClick={() => window.print()} className="p-2 bg-stone-900 text-white rounded-full"><Printer size={16}/></button>
        </div>

        <div className="bg-white border-t-[12px] border-stone-900 p-10 space-y-12">
           <BrandLogo size={12} color="#1c1917" />
           <h1 className="text-2xl font-black text-stone-900 uppercase">MONTHLY INTEGRATED REPORT</h1>
           <div className="grid grid-cols-3 gap-6">
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                 <p className="text-[8px] font-black text-stone-300 uppercase block mb-1">Total Revenue</p>
                 <p className="text-lg font-black text-emerald-700 font-mono">Rp{totalRev.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                 <p className="text-[8px] font-black text-stone-300 uppercase block mb-1">Total Expense</p>
                 <p className="text-lg font-black text-rose-700 font-mono">Rp{finalExpense.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-stone-900 p-6 rounded-2xl text-white shadow-xl">
                 <p className="text-[8px] font-black text-white/40 uppercase block mb-1">Net Profit</p>
                 <p className="text-lg font-black font-mono">Rp{(totalRev - finalExpense).toLocaleString('id-ID')}</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

// UI Components
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
    
    {/* Desktop/Print View Always Visible Header */}
    <div className="hidden print:flex p-6 items-center justify-between border-b border-stone-100">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-stone-900 text-white">{icon}</div>
        <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">{title}</h3>
      </div>
      <p className="text-[10px] font-black text-stone-900 font-mono">{summary}</p>
    </div>

    <div className={`${isExpanded ? 'block' : 'hidden'} print:block animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="overflow-x-auto">
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

const DashboardCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-8 rounded-[2rem] text-white text-left flex items-center justify-between group transition-all active:scale-95 shadow-md`}>
    <div>
       <div className="mb-4 bg-white/10 w-fit p-3 rounded-2xl border border-white/10">{icon}</div>
       <h3 className="font-bold text-xs tracking-[0.2em] uppercase mb-1">{title}</h3>
       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
  </button>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl transition-all border ${active ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-300 border-stone-100'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

export default OpenTripPage;
