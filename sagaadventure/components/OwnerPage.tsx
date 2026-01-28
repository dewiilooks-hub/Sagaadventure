
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
// Fixed: Added CheckCircle2 and ShieldCheck to the lucide-react imports
import { 
  ChevronLeft, Crown, TrendingUp, Wallet, 
  ShoppingBag, Tent, BarChart3,
  Landmark, UserCheck, 
  Banknote, X, RefreshCw, KeyRound, Map, ChevronRight,
  History, ArrowUpRight, Trash2, Info, Receipt,
  CheckCircle2, ShieldCheck
} from 'lucide-react';
import { db, appId } from '../services/firebase';
import { OwnerPayout } from '../types';
import BrandLogo from './BrandLogo';

interface OwnerPageProps {
  onBack: () => void;
}

const OwnerPage: React.FC<OwnerPageProps> = ({ onBack }) => {
  const [rentalData, setRentalData] = useState<any[]>([]);
  const [tripTasks, setTripTasks] = useState<any[]>([]);
  const [merchSales, setMerchSales] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<OwnerPayout[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeBreakdown, setActiveBreakdown] = useState<'trip' | 'rental' | 'merch' | null>('trip');
  
  const [showPayoutPinModal, setShowPayoutPinModal] = useState(false);
  const [payoutPin, setPayoutPin] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // New Withdrawal States
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawOwner, setWithdrawOwner] = useState('Jacky Andrean');

  const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const MASTER_PIN = "2026";

  useEffect(() => {
    if (!db) {
      const savedRentals = localStorage.getItem(`saga_rentals_${appId}`);
      const savedTasks = localStorage.getItem(`saga_tasks_${appId}`);
      const savedMerch = localStorage.getItem(`saga_merch_sales_${appId}`);
      const savedPayouts = localStorage.getItem(`saga_owner_payouts_${appId}`);
      
      if (savedRentals) setRentalData(JSON.parse(savedRentals));
      if (savedTasks) setTripTasks(JSON.parse(savedTasks));
      if (savedMerch) setMerchSales(JSON.parse(savedMerch));
      if (savedPayouts) setPayoutHistory(JSON.parse(savedPayouts));
      return;
    }

    const unsubRentals = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_rentals')
      .onSnapshot(s => setRentalData(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_tasks')
      .onSnapshot(s => setTripTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMerch = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_merch_sales')
      .onSnapshot(s => setMerchSales(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPayouts = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_owner_payouts')
      .onSnapshot(s => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() })) as OwnerPayout[];
        data.sort((a, b) => {
          const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
          const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
          return dateB - dateA;
        });
        setPayoutHistory(data);
      });

    return () => { unsubRentals(); unsubTasks(); unsubMerch(); unsubPayouts(); };
  }, []);

  const getEntryDate = (entry: any) => {
    if (entry.createdAt?.seconds) return new Date(entry.createdAt.seconds * 1000);
    if (entry.createdAt) return new Date(entry.createdAt);
    return new Date();
  };

  const getTripMonthlyData = () => {
    const projectIds = [...new Set(tripTasks.filter(t => t.tripId).map(t => t.tripId))];
    const details: any[] = [];
    let totalRoyalty = 0;
    let totalNetProfit = 0;

    projectIds.forEach(pid => {
      const pTasks = tripTasks.filter(t => t.tripId === pid);
      if (pTasks.length === 0) return;
      const d = getEntryDate(pTasks[0]);
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        const pRev = pTasks.filter(t => (t.category === 'peserta' || t.category === 'sponsor') && t.status === 'paid').reduce((a, b) => a + b.price, 0);
        const pExp = pTasks.filter(t => t.category !== 'peserta' && t.category !== 'sponsor').reduce((a, b) => a + (b.price * (b.qty || 1)), 0);
        const pNet = Math.max(0, pRev - pExp);
        const pRoy = Math.round(pNet * 0.05);
        if (pRoy > 0) {
          totalRoyalty += pRoy;
          totalNetProfit += pNet;
          details.push({ name: `Project ${pid.slice(-4)}`, base: pNet, roy: pRoy, type: 'Open Trip Profit' });
        }
      }
    });
    return { totalRoyalty, totalNetProfit, details };
  };

  const getRentalMonthlyData = () => {
    const details: any[] = [];
    let totalRoyalty = 0;
    let totalRevenue = 0;
    rentalData.forEach(item => {
      const d = getEntryDate(item);
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        const rRoy = Math.round(item.total * 0.05);
        totalRoyalty += rRoy;
        totalRevenue += item.total;
        details.push({ name: item.invoiceId, base: item.total, roy: rRoy, type: 'Rental Omzet' });
      }
    });
    return { totalRoyalty, totalRevenue, details };
  };

  const getMerchMonthlyData = () => {
    const details: any[] = [];
    let totalRoyalty = 0;
    let totalSales = 0;
    merchSales.forEach(sale => {
      const d = getEntryDate(sale);
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        const mRoy = Math.round(sale.total * 0.05);
        totalRoyalty += mRoy;
        totalSales += sale.total;
        details.push({ name: sale.invoiceId, base: sale.total, roy: mRoy, type: 'Merch Omzet' });
      }
    });
    return { totalRoyalty, totalSales, details };
  };

  const tripData = getTripMonthlyData();
  const rentalDataCalc = getRentalMonthlyData();
  const merchData = getMerchMonthlyData();
  
  const totalAccruedRoyalty = tripData.totalRoyalty + rentalDataCalc.totalRoyalty + merchData.totalRoyalty;
  
  // Calculate total distributed across ALL history for accurate balance
  const totalAllDistributed = payoutHistory.reduce((a, b) => a + (b.amount || 0), 0);
  
  // Balance should be calculated based on all time income vs all time payouts
  // but for the sake of the monthly view logic provided, we'll keep it consistent with the user's flow
  const totalDistributedThisMonth = payoutHistory
    .filter(p => p.month === selectedMonth && p.year === selectedYear)
    .reduce((a, b) => a + (b.amount || 0), 0);
  
  const currentSystemBalance = Math.max(0, totalAccruedRoyalty - totalDistributedThisMonth);
  const dividendPerOwnerAvailable = Math.floor(currentSystemBalance / 2);

  const handleProcessWithdrawal = async () => {
    if (payoutPin !== MASTER_PIN) return alert("PIN Salah");
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) return alert("Nominal tidak valid");
    if (amount > currentSystemBalance) return alert("Saldo Royalti tidak mencukupi");
    
    setIsProcessingPayout(true);
    try {
      const newPayout: OwnerPayout = {
        id: `PAY-${Date.now()}-${withdrawOwner.split(' ')[0]}`,
        amount: amount,
        month: selectedMonth,
        year: selectedYear,
        distributedTo: withdrawOwner,
        createdAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
      };

      if (!db) {
        const existing = JSON.parse(localStorage.getItem(`saga_owner_payouts_${appId}`) || '[]');
        const updated = [newPayout, ...existing];
        localStorage.setItem(`saga_owner_payouts_${appId}`, JSON.stringify(updated));
        setPayoutHistory(updated);
      } else {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_owner_payouts').add(newPayout);
      }
      
      setShowWithdrawForm(false);
      setShowPayoutPinModal(false);
      setWithdrawAmount('');
      alert(`Berhasil menarik Rp${amount.toLocaleString('id-ID')} untuk ${withdrawOwner}`);
    } catch (e) { 
      alert("Gagal melakukan penarikan"); 
    } finally { 
      setIsProcessingPayout(false); 
    }
  };

  const handleDeletePayout = async (id: string, fireId?: string) => {
    if (!window.confirm("Hapus log penarikan ini? Saldo akan dikembalikan ke kas royalti.")) return;
    try {
      if (!db) {
        const updated = payoutHistory.filter(p => p.id !== id);
        setPayoutHistory(updated);
        localStorage.setItem(`saga_owner_payouts_${appId}`, JSON.stringify(updated));
      } else if (fireId) {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('saga_owner_payouts').doc(fireId).delete();
      }
    } catch (e) {
      alert("Gagal menghapus log.");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-stone-50 min-h-screen animate-in fade-in pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100 active:scale-95 transition-all"><ChevronLeft size={18} /></button>
        <div className="flex flex-col items-center">
           <BrandLogo size={12} color="#1c1917" />
           <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] mt-1 flex items-center gap-1"><Crown size={10} /> Owner Portal</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
         {months.map((m, idx) => (
           <button 
             key={idx} 
             onClick={() => setSelectedMonth(idx)} 
             className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border whitespace-nowrap transition-all ${selectedMonth === idx ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-105' : 'bg-white text-stone-300 border-stone-100 hover:border-stone-300'}`}
           >
             {m}
           </button>
         ))}
      </div>

      {/* Main Balance Card */}
      <div className="bg-stone-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 space-y-6">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.5em] block mb-2">Kas Royalti Tersedia ({months[selectedMonth]})</span>
            <p className="text-5xl font-black font-mono tracking-tighter leading-none">Rp{currentSystemBalance.toLocaleString('id-ID')}</p>
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Royalti Terkumpul</p>
                <p className="text-sm font-black text-emerald-400 font-mono">+{totalAccruedRoyalty.toLocaleString('id-ID')}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Telah Ditarik</p>
                <p className="text-sm font-black text-rose-400 font-mono">-{totalDistributedThisMonth.toLocaleString('id-ID')}</p>
              </div>
            </div>
         </div>
         <Landmark size={180} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <OwnerDividendCard name="Jacky Andrean" amount={dividendPerOwnerAvailable} role="Owner I" />
          <OwnerDividendCard name="M.Arif Ibrahim Ginting" amount={dividendPerOwnerAvailable} role="Owner II" />
      </div>

      {/* Withdrawal Action Button */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setShowWithdrawForm(!showWithdrawForm)} 
          className={`w-full py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${showWithdrawForm ? 'bg-stone-100 text-stone-900 border' : 'bg-stone-900 text-white'}`}
        >
          {showWithdrawForm ? <X size={18}/> : <Banknote size={18} />}
          {showWithdrawForm ? 'Batal Penarikan' : 'Ambil Jatah Royalti'}
        </button>
      </div>

      {/* Manual Withdrawal Form */}
      {showWithdrawForm && (
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-3 border-b border-stone-50 pb-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                 <Receipt size={20} />
              </div>
              <div>
                 <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-widest leading-none">Form Pengambilan Dana</h3>
                 <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1">Manual Withdrawal Entry</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Pilih Owner</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setWithdrawOwner('Jacky Andrean')}
                      className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${withdrawOwner === 'Jacky Andrean' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 text-stone-300 border-stone-100'}`}
                    >
                      Jacky A.
                    </button>
                    <button 
                      onClick={() => setWithdrawOwner('M.Arif Ibrahim Ginting')}
                      className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${withdrawOwner === 'M.Arif Ibrahim Ginting' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 text-stone-300 border-stone-100'}`}
                    >
                      Arif I. G.
                    </button>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Nominal Penarikan (Rp)</label>
                 <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[11px] font-black text-stone-300">Rp</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full bg-stone-50 border-none rounded-2xl py-5 pl-12 pr-6 text-sm font-black text-stone-900 outline-none focus:ring-2 focus:ring-stone-100 transition-all"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                    />
                 </div>
              </div>

              <div className="pt-2">
                 <button 
                   onClick={() => { setShowPayoutPinModal(true); setPayoutPin(''); }}
                   disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0}
                   className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={18}/> Konfirmasi Pengambilan
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Accrued Detail Breakdown */}
      <div className="space-y-4">
         <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp size={14} className="text-stone-300" /> Royalti Accrued Unit</h3>
         <div className="grid grid-cols-1 gap-3">
            <RoyaltySummaryCard label="Trip Royalty" amount={tripData.totalRoyalty} base={tripData.totalNetProfit} icon={<Map className="text-sky-500" size={20}/>} isActive={activeBreakdown === 'trip'} onClick={() => setActiveBreakdown('trip')} color="border-sky-100" />
            <RoyaltySummaryCard label="Rental Royalty" amount={rentalDataCalc.totalRoyalty} base={rentalDataCalc.totalRevenue} icon={<Tent className="text-emerald-500" size={20}/>} isActive={activeBreakdown === 'rental'} onClick={() => setActiveBreakdown('rental')} color="border-emerald-100" />
            <RoyaltySummaryCard label="Merch Royalty" amount={merchData.totalRoyalty} base={merchData.totalSales} icon={<ShoppingBag className="text-rose-500" size={20}/>} isActive={activeBreakdown === 'merch'} onClick={() => setActiveBreakdown('merch')} color="border-rose-100" />
         </div>
      </div>

      {activeBreakdown && (
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
           <div className="p-8 border-b border-stone-50 bg-stone-50/30 flex items-center justify-between">
              <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">Detail Audit {activeBreakdown}</h4>
              <BarChart3 size={16} className="text-stone-200" />
           </div>
           <div className="max-h-[300px] overflow-y-auto no-scrollbar">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="text-[8px] font-black text-stone-300 uppercase tracking-widest">
                      <th className="py-6 px-8 border-b border-stone-50">Ref / ID</th>
                      <th className="py-6 px-4 border-b border-stone-50 text-right">Base</th>
                      <th className="py-6 px-8 border-b border-stone-50 text-right">Roy (5%)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {(activeBreakdown === 'trip' ? tripData.details : activeBreakdown === 'rental' ? rentalDataCalc.details : merchData.details).map((item: any, idx: number) => (
                    <tr key={idx} className="group hover:bg-stone-50 transition-all">
                      <td className="py-5 px-8">
                        <p className="text-[10px] font-black text-stone-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[7px] font-bold text-stone-300 uppercase tracking-widest">{item.type}</p>
                      </td>
                      <td className="py-5 px-4 text-right text-stone-400 font-mono text-[10px] font-bold">Rp{item.base.toLocaleString('id-ID')}</td>
                      <td className="py-5 px-8 text-right text-stone-900 font-mono text-[10px] font-black">Rp{item.roy.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Withdrawal History Log */}
      <div className="space-y-4">
         <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2">
           <History size={14} className="text-stone-300" /> Riwayat Pengambilan Dana
         </h3>
         <div className="space-y-3">
            {payoutHistory.filter(p => p.month === selectedMonth && p.year === selectedYear).length === 0 ? (
               <div className="bg-white border-2 border-dashed border-stone-100 rounded-[2.5rem] py-16 text-center opacity-30">
                  <Banknote size={40} className="mx-auto text-stone-200" />
                  <p className="text-[9px] font-black uppercase tracking-widest mt-4">Belum ada penarikan bulan ini</p>
               </div>
            ) : (
               payoutHistory.filter(p => p.month === selectedMonth && p.year === selectedYear).map((p: any, idx: number) => (
                 <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-stone-50 rounded-2xl text-stone-300 group-hover:text-emerald-500 transition-colors">
                          <ArrowUpRight size={18}/>
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-stone-900 uppercase leading-none">{p.distributedTo}</p>
                          <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1.5">
                             {p.id.split('-')[0]} • {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[13px] font-black text-rose-600 font-mono tracking-tighter">-Rp{(p.amount || 0).toLocaleString('id-ID')}</p>
                          <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Withdrawal Success</p>
                       </div>
                       <button onClick={() => handleDeletePayout(p.id, p.id)} className="p-2 text-stone-50 hover:text-rose-400 group-hover:text-stone-100 transition-colors">
                          <Trash2 size={16}/>
                       </button>
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>

      {/* PIN Verification Modal */}
      {showPayoutPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-300">
              <div className="bg-stone-900 p-10 text-white text-center relative overflow-hidden">
                 <div className="p-4 bg-white/10 rounded-full w-fit mx-auto mb-6">
                    <KeyRound size={32} className="text-amber-400" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tighter">Otoritas Penarikan</h3>
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-1">Authorized Access Only</p>
                 <ShieldCheck size={120} className="absolute -right-10 -bottom-10 opacity-[0.05]" />
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest block text-center mb-2">Masukkan PIN Master</label>
                    <input 
                      type="password" 
                      autoFocus 
                      maxLength={4} 
                      className="w-full bg-stone-50 border-none rounded-[1.5rem] py-5 px-4 text-2xl font-black text-center tracking-[1em] outline-none focus:ring-2 focus:ring-stone-100" 
                      placeholder="••••" 
                      value={payoutPin} 
                      onChange={e => setPayoutPin(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleProcessWithdrawal()}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPayoutPinModal(false)} className="py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 hover:bg-stone-100 transition-all">Batal</button>
                    <button onClick={handleProcessWithdrawal} disabled={isProcessingPayout} className="py-4 rounded-2xl text-[9px] font-black uppercase text-white bg-stone-900 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                      {isProcessingPayout ? <RefreshCw className="animate-spin" size={14}/> : "Lanjutkan"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const OwnerDividendCard = ({ name, amount, role }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md group">
     <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
        <UserCheck className="text-stone-300 group-hover:text-amber-500 transition-colors" size={28} />
     </div>
     <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest mb-1.5">{role}</span>
     <h4 className="text-[11px] font-black text-stone-900 uppercase mb-4 px-2 leading-tight tracking-tight h-8 flex items-center">{name}</h4>
     <div className="bg-amber-50/50 px-4 py-3 rounded-2xl border border-amber-100 w-full">
        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Max Jatah 50%</p>
        <p className="text-xs font-black text-stone-900 font-mono tracking-tighter">Rp{amount.toLocaleString('id-ID')}</p>
     </div>
  </div>
);

const RoyaltySummaryCard = ({ label, amount, base, icon, isActive, onClick, color }: any) => (
  <button 
    onClick={onClick} 
    className={`bg-white p-7 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group ${isActive ? 'border-stone-900 shadow-xl scale-[1.02]' : `${color} shadow-sm opacity-60 hover:opacity-100`}`}
  >
     <div className="flex items-center gap-6">
        <div className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50'}`}>{icon}</div>
        <div className="text-left">
           <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest">{label}</h4>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-[8px] font-black text-emerald-600 uppercase">Royalty: Rp{amount.toLocaleString('id-ID')}</span>
             <span className="text-stone-200">|</span>
             <span className="text-[7px] font-bold text-stone-300 uppercase">Base: Rp{base.toLocaleString('id-ID')}</span>
           </div>
        </div>
     </div>
     <div className={`transition-all ${isActive ? 'text-indigo-600 translate-x-1' : 'text-stone-200'}`}><ChevronRight size={20} /></div>
  </button>
);

export default OwnerPage;