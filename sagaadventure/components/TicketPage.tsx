
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Sparkles, ScanLine, 
  Settings2, MapPin, RefreshCw, 
  Upload, Image as ImageIcon, X, 
  Power, CheckCircle2, 
  XCircle, Keyboard, ArrowRight, Trash2, 
  Users, Printer, 
  Loader2, Banknote, Save,
  PhoneCall, HeartPulse, ShieldCheck, 
  QrCode, FileDown, ListChecks,
  AlertTriangle, Contact2, Timer, BookmarkCheck,
  Clock, Calendar, Shield
} from 'lucide-react';
import { db, appId } from '../services/firebase';
import { TripEvent } from '../types';
import BrandLogo from './BrandLogo';

// Libs from importmap
import html2canvas from 'html2canvas';
import { Html5Qrcode } from 'html5-qrcode';
import { jsPDF } from 'jspdf';

type TicketSubTab = 'create' | 'scan' | 'report';

interface TicketPageProps {
  onBack: () => void;
  trips?: TripEvent[];
  onSave?: (data: any) => Promise<void>;
}

// Sub-component defined as function to ensure hoisting/availability
function PointItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-4">
       <div className="w-1 h-1 bg-stone-300 rounded-sm mt-1.5 shrink-0"></div>
       <p className="text-[11px] font-medium text-stone-700 leading-relaxed">{text}</p>
    </div>
  );
}

const TICKET_CATEGORIES = [
  { name: 'Regular' },
  { name: 'VIP Pass' },
  { name: 'Staff/Crew' },
  { name: 'Press/Media' },
  { name: 'Sponsor' },
];

const OVERLAY_COLORS = [
  { name: 'Emerald', value: 'rgba(2, 44, 34, 0.35)' },
  { name: 'Ruby', value: 'rgba(69, 10, 10, 0.35)' },
  { name: 'Midnight', value: 'rgba(12, 74, 110, 0.35)' },
  { name: 'Slate', value: 'rgba(30, 41, 59, 0.35)' },
  { name: 'Amber', value: 'rgba(120, 53, 15, 0.35)' },
  { name: 'Natural', value: 'rgba(0, 0, 0, 0.15)' },
];

const TicketPage: React.FC<TicketPageProps> = ({ onBack, trips = [], onSave }) => {
  const [subTab, setSubTab] = useState<TicketSubTab>('create');
  const [ticketData, setTicketData] = useState({
    event: "JUNGLE CAMP",
    slogan: "ADVENTURE 2026",
    date: new Date().toISOString().split('T')[0],
    time: "15:00",
    location: "SAGA Basecamp",
    guest: "",
    emergencyName: "",
    emergencyPhone: "",
    type: "Regular",
    price: "150000",
    id: "SAGA-TIX-" + Math.floor(100000 + Math.random() * 900000),
    tripId: "",
    logo: null as string | null,
    bg: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop", 
    overlayColor: OVERLAY_COLORS[0].value
  });

  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<'success' | 'error' | null>(null);
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const isDemoMode = !db;

  useEffect(() => {
    if (isDemoMode) {
      const local = localStorage.getItem(`saga_tickets_scans_${appId}`);
      if (local) setScanHistory(JSON.parse(local));
    } else {
      const unsub = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('scans')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
          data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setScanHistory(data);
        });
      return () => unsub();
    }
  }, [isDemoMode, subTab]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopCamera();
      }
    };
  }, []);

  const generateNewId = () => {
    setTicketData(prev => ({
      ...prev,
      id: "SAGA-TIX-" + Math.floor(100000 + Math.random() * 900000)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTicketData(prev => ({ ...prev, [type]: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadTicketPDF = async () => {
    if (!ticketRef.current) return;
    setIsProcessing(true);
    try {
      const canvas = await html2canvas(ticketRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`SAGA_PASS_${ticketData.guest || 'GUEST'}.pdf`);
    } catch (err) {
      alert("Gagal mengunduh PDF tiket.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToManifest = async () => {
    if (!ticketData.tripId) return alert("Pilih PROYEK terlebih dahulu.");
    if (!ticketData.guest) return alert("Nama tamu wajib diisi.");
    if (!onSave) return;

    setIsProcessing(true);
    try {
      const ticketPrice = parseInt(ticketData.price.toString()) || 0;
      const finalPrice = Math.max(0, ticketPrice - 10000); 

      const payload = {
        tripId: ticketData.tripId,
        task: ticketData.guest.toUpperCase(),
        pic: 'SAGA System',
        qty: 1,
        unit: 'pax',
        price: finalPrice,
        status: 'paid',
        category: 'peserta',
        isDone: true,
        ticketId: ticketData.id 
      };
      await onSave(payload);
      alert(`Berhasil! Peserta ${ticketData.guest} ditambahkan ke Manifest Proyek.`);
    } catch (err) {
      alert("Gagal menyimpan ke manifest.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (text) => validateAndSave(text),
        () => {}
      );
    } catch (err) {
      alert("Kamera tidak dapat diakses.");
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const validateAndSave = async (input: string) => {
    setIsProcessing(true);
    const upper = input.trim().toUpperCase();
    if (upper.includes('TIX-')) {
      const validatedData = {
        id: upper,
        guest: upper === ticketData.id ? (ticketData.guest || "Tamu Terdaftar") : "Check-in Manual",
        type: 'VERIFIED',
        event: ticketData.event,
        timestamp: new Date().toISOString(),
      };
      setScanFeedback('success');
      if (isDemoMode) {
        const newList = [validatedData, ...scanHistory];
        setScanHistory(newList);
        localStorage.setItem(`saga_tickets_scans_${appId}`, JSON.stringify(newList));
      } else {
        await db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('scans').add(validatedData);
      }
    } else {
      setScanFeedback('error');
    }
    setIsProcessing(false);
    setTimeout(() => {
      setScanFeedback(null);
      if (scannerRef.current) stopCamera();
    }, 2000);
  };

  const renderCreate = () => (
    <div className="flex flex-col gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px]">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-50 pb-5">
           <div className="p-2.5 bg-indigo-50 rounded-2xl">
             <Settings2 size={18} className="text-indigo-600" />
           </div>
           <div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 leading-none">Generator Konfigurasi</h3>
             <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1">Setup your event pass</p>
           </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">ID Tiket</label>
            <div className="relative">
                <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.id} onChange={e => setTicketData({...ticketData, id: e.target.value})} />
                <button onClick={generateNewId} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-xl shadow-sm active:scale-90 border border-stone-50"><RefreshCw size={14} className="text-stone-400" /></button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Judul Baris 1</label>
            <input type="text" placeholder="EVENT TITLE LINE 1" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none text-stone-900" value={ticketData.event} onChange={e => setTicketData({...ticketData, event: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Judul Baris 2 (Sama Besar)</label>
            <input type="text" placeholder="EVENT TITLE LINE 2" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none text-stone-900" value={ticketData.slogan} onChange={e => setTicketData({...ticketData, slogan: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Harga Tiket (Rp)</label>
                <input type="number" placeholder="Rp" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-xs font-bold outline-none text-stone-900" value={ticketData.price} onChange={e => setTicketData({...ticketData, price: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Lokasi</label>
                <input type="text" placeholder="BASECAMP" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-xs font-bold uppercase outline-none text-stone-900" value={ticketData.location} onChange={e => setTicketData({...ticketData, location: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Kategori</label>
            <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-xs font-bold outline-none text-stone-900" value={ticketData.type} onChange={e => setTicketData({...ticketData, type: e.target.value})}>
                {TICKET_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Warna Lapisan (Overlay)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {OVERLAY_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setTicketData({ ...ticketData, overlayColor: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${ticketData.overlayColor === color.value ? 'border-stone-900 scale-110 ring-2 ring-stone-100' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value.replace('0.35', '1').replace('0.15', '1') }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Nama Tamu</label>
            <input type="text" placeholder="GUEST FULL NAME" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none text-stone-900" value={ticketData.guest} onChange={e => setTicketData({...ticketData, guest: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Nama Emergency</label>
                <input type="text" placeholder="NAMA KERABAT" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-[10px] font-bold uppercase outline-none" value={ticketData.emergencyName} onChange={e => setTicketData({...ticketData, emergencyName: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Kontak Emergency</label>
                <input type="text" placeholder="NOMOR HP" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-4 text-[10px] font-bold outline-none" value={ticketData.emergencyPhone} onChange={e => setTicketData({...ticketData, emergencyPhone: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-widest ml-1">Hubungkan Proyek</label>
            <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold outline-none text-stone-900" value={ticketData.tripId} onChange={e => setTicketData({...ticketData, tripId: e.target.value})}>
                <option value="">-- PILIH PROYEK --</option>
                {trips?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center justify-center gap-2 p-4 bg-stone-50 rounded-2xl cursor-pointer hover:bg-stone-100 border-2 border-dashed border-stone-200">
              <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
              <Upload size={16} className="text-stone-300" />
              <span className="text-[9px] font-black uppercase text-stone-400">Add Logo</span>
            </label>
            <label className="flex items-center justify-center gap-2 p-4 bg-stone-50 rounded-2xl cursor-pointer hover:bg-stone-100 border-2 border-dashed border-stone-200">
              <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bg')} />
              <ImageIcon size={16} className="text-stone-300" />
              <span className="text-[9px] font-black uppercase text-stone-400">Add Cover</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-10 w-full pb-32">
        <div 
          ref={ticketRef} 
          className="flex flex-col items-center bg-white p-0 m-0 overflow-hidden shadow-2xl rounded-[3rem] w-full max-w-[360px] border border-stone-100"
        >
          {/* SLIDE 1: PASS - Height 460px */}
          <div className="relative w-full h-[460px] overflow-hidden bg-stone-950 flex flex-col">
              {ticketData.bg && <img src={ticketData.bg} className="absolute inset-0 w-full h-full object-cover grayscale-[0.05] brightness-[0.75]" />}
              <div className="absolute inset-0 z-[1]" style={{ backgroundColor: ticketData.overlayColor }}></div>
              {/* Reduced gradient intensity to let background show better */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5 z-[2]"></div>
              
              <div className="relative z-10 h-full p-10 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                     <div className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[8px] font-black uppercase tracking-[0.4em] text-white">E-Ticket Pass</div>
                     {ticketData.logo && <img src={ticketData.logo} className="w-8 h-8 object-contain rounded-lg shadow-xl" />}
                  </div>

                  <div className="flex-1 flex flex-col justify-start pt-0">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.6em] mb-5 pl-1">SAGA ADVENTURE</p>
                      
                      <div className="mb-4">
                        <h2 className="text-[26px] font-black leading-[1.1] tracking-tighter uppercase text-white mb-1 truncate">{ticketData.event}</h2>
                        {ticketData.slogan && (
                          <h2 className="text-[26px] font-black leading-[1.1] tracking-tighter uppercase text-white/85 truncate">{ticketData.slogan}</h2>
                        )}
                      </div>

                      <div className="space-y-3.5 border-t border-white/15 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">Date</p>
                              <p className="font-black text-[11px] uppercase text-white">{new Date(ticketData.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">Open Gate</p>
                              <p className="font-black text-[11px] uppercase text-white">{ticketData.time} WIB</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-0.5">Location</p>
                              <p className="font-black text-[11px] uppercase text-white leading-relaxed truncate">{ticketData.location || 'SAGA BASECAMP'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 items-end border-t border-white/5 pt-3">
                            <div>
                              <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">Access Type</p>
                              <p className="font-black text-[11px] uppercase text-emerald-400">{ticketData.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-0.5">Admission Price</p>
                              <div className="flex items-start justify-end gap-1">
                                <span className="text-[10px] font-black text-white/60 mt-1 font-mono">Rp</span>
                                <p className="font-black text-3xl uppercase text-white font-mono leading-none tracking-tighter">
                                  {parseInt(ticketData.price || '0').toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-3 bg-black/45 border border-white/15 rounded-[2rem] p-8 backdrop-blur-md">
                     <p className="text-[8px] uppercase font-black text-white/40 tracking-widest mb-2">Ticket Holder</p>
                     <p className="font-black text-xl truncate uppercase tracking-tighter text-white leading-none">{ticketData.guest || '........'}</p>
                  </div>
              </div>
          </div>

          <div className="relative w-full bg-white px-10 pt-16 pb-10 flex flex-col items-center">
              <div className="absolute top-0 left-0 right-0 h-px border-t-[3px] border-dashed border-stone-100"></div>
              <div className="absolute top-4 left-10 text-left opacity-60">
                <p className="text-[7px] font-bold uppercase text-stone-400 tracking-[0.2em] leading-none">redemption at</p>
                <p className="text-[10px] font-black uppercase text-stone-900 tracking-tight leading-none mt-1">SAGA ADVENTURE GOODS</p>
              </div>

              <div className="w-full bg-white rounded-[2rem] p-6 pt-10 flex flex-col items-center border border-stone-50 shadow-sm">
                 <img 
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(ticketData.id)}&scale=4&height=10&includetext=false&backgroundcolor=ffffff`} 
                  className="w-full h-12 object-contain mb-3" 
                  alt="barcode"
                 />
                 <p className="font-mono text-stone-900 font-black tracking-[0.6em] text-[10px] uppercase leading-none border-t border-stone-50 pt-3 w-full text-center">{ticketData.id}</p>
              </div>
          </div>

          {/* SLIDE 2: TERMS */}
          <div className="w-full bg-white px-12 pt-14 pb-24 space-y-12 border-t-2 border-stone-50 print:page-break-before-always relative">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">OFFICIAL TERMS</h3>
                   <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mt-2">SAGA ADVENTURE POLICIES</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-full border border-stone-100 text-stone-200">
                   <Shield size={28} />
                </div>
             </div>
             
             <div className="space-y-10">
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                      <h4 className="text-[13px] font-black text-stone-900 uppercase tracking-widest">1. CANCELATION POLICY</h4>
                   </div>
                   <div className="pl-6.5 space-y-2">
                      <PointItem text="H-7: 50% Penalty dari total biaya perjalanan." />
                      <PointItem text="H-1 atau kurang: Biaya hangus (No Refund)." />
                      <PointItem text="Force Majeure: Diatur sepenuhnya oleh kebijakan SAGA." />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                      <h4 className="text-[13px] font-black text-stone-900 uppercase tracking-widest">2. KESEHATAN & KESELAMATAN</h4>
                   </div>
                   <div className="pl-6.5 space-y-2">
                      <PointItem text="Peserta wajib jujur mengenai kondisi fisiknya." />
                      <PointItem text="Peserta wajib membawa obat-obatan pribadi." />
                      <PointItem text="SAGA berhak menolak peserta yang sakit demi keamanan tim." />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                      <h4 className="text-[13px] font-black text-stone-900 uppercase tracking-widest">3. IZIN & KONTAK DARURAT</h4>
                   </div>
                   <div className="pl-6.5 space-y-2">
                      <PointItem text="Peserta menyatakan telah mendapat izin keluarga/kerabat." />
                      <PointItem text={`Nama: ${ticketData.emergencyName || '......'}`} />
                      <PointItem text={`Kontak: ${ticketData.emergencyPhone || '......'}`} />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                      <h4 className="text-[13px] font-black text-stone-900 uppercase tracking-widest">4. EVAKUASI DARURAT</h4>
                   </div>
                   <div className="pl-6.5 space-y-2">
                      <PointItem text="Evakuasi lapangan awal difasilitasi crew SAGA" />
                      <PointItem text="Biaya evakuasi lanjutan di luar jangkauan menjadi tanggung jawab peserta." />
                   </div>
                </div>
             </div>

             <div className="pt-24 mt-20 border-t border-stone-100 text-center space-y-3">
                <h5 className="text-[14px] font-black text-stone-900 uppercase tracking-[0.2em]">{ticketData.id}</h5>
                <p className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em]">
                   VALIDATED SECURITY PASS • GENERATED ON {new Date().toLocaleDateString('id-ID')}
                </p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[360px] px-2 print:hidden">
          <button onClick={downloadTicketPDF} disabled={isProcessing} className="w-full bg-stone-900 text-white py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 shadow-2xl active:scale-95 disabled:opacity-50 transition-all">
            {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <FileDown size={20}/>} DOWNLOAD PDF PASS
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => window.print()} className="bg-white border border-stone-200 text-stone-900 py-4.5 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Printer size={18}/> PRINT
            </button>
            <button onClick={handleSaveToManifest} disabled={isProcessing} className="bg-emerald-800 text-white py-4.5 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
              <Save size={18}/> TO MANIFEST
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="flex flex-col items-center space-y-10 w-full animate-in fade-in duration-500 max-w-[400px]">
      <div className="text-center">
        <div className="p-6 bg-indigo-50 rounded-[2.5rem] w-fit mx-auto mb-6 border border-indigo-100">
          <ScanLine size={36} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tighter">Terminal Gateway</h2>
        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-2">Check-in Access Control</p>
      </div>

      <div className="relative w-full max-w-[320px] aspect-square bg-stone-950 rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-stone-900 ring-8 ring-indigo-50">
        <div id="reader" className="w-full h-full"></div>
        {!isScanning && !scanFeedback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-400 p-8 text-center z-20 backdrop-blur-sm">
            <button onClick={startCamera} className="px-10 py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 hover:bg-indigo-700 transition-all">
              <Power size={18} /> INITIALIZE SCANNER
            </button>
          </div>
        )}
        {scanFeedback && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-30 animate-in zoom-in duration-300 ${scanFeedback === 'success' ? 'bg-emerald-600/95' : 'bg-rose-600/95'} backdrop-blur-md`}>
            {scanFeedback === 'success' ? <CheckCircle2 size={80} className="text-white mb-4" /> : <XCircle size={80} className="text-white mb-4" />}
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{scanFeedback === 'success' ? 'VERIFIED' : 'REJECTED'}</h4>
          </div>
        )}
      </div>

      <div className="w-full bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Keyboard size={16} className="text-stone-300" />
           <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Manual Keypad Validation</p>
        </div>
        <div className="flex gap-2">
            <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="TIX-XXXXXX" className="flex-1 px-6 py-4.5 bg-stone-50 border-none rounded-2xl outline-none font-mono text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-stone-100 transition-all" />
            <button onClick={() => validateAndSave(manualId)} className="p-4.5 bg-stone-900 text-white rounded-2xl active:scale-95 shadow-xl hover:bg-black transition-all"><ArrowRight size={22}/></button>
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-[400px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 flex flex-col justify-between h-44 transition-all hover:shadow-md">
           <p className="text-stone-300 text-[9px] font-black uppercase tracking-widest">Today's Traffic</p>
           <h3 className="text-5xl font-black text-stone-900 tracking-tighter leading-none">{scanHistory.length} <span className="text-[10px] text-stone-300 uppercase block mt-2">Pax Validated</span></h3>
        </div>
        <div className="bg-stone-900 p-8 rounded-[3rem] shadow-2xl text-white flex flex-col justify-between h-44 relative overflow-hidden group">
           <p className="text-white/30 text-[9px] font-black uppercase tracking-widest relative z-10">Gate Status</p>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                 <h3 className="text-xl font-black tracking-tight leading-none uppercase">Secured</h3>
              </div>
           </div>
           <ShieldCheck size={120} className="absolute -right-8 -bottom-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-900">Activity Ledger</h4>
              <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1">Realtime Check-in Log</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-100 shadow-sm"><ListChecks size={16} className="text-stone-400" /></div>
        </div>
        <div className="divide-y divide-stone-50">
           {scanHistory.length === 0 ? (
             <div className="py-28 text-center opacity-10 flex flex-col items-center">
                <Users size={56} />
                <p className="text-[11px] font-black uppercase mt-4 tracking-[0.5em]">Ledger Empty</p>
             </div>
           ) : (
             scanHistory.map((row, idx) => (
               <div key={idx} className="p-6 flex justify-between items-center group hover:bg-stone-50 transition-all duration-300">
                  <div>
                    <p className="text-[13px] font-black text-stone-900 uppercase leading-none group-hover:text-indigo-600 transition-colors">{row.guest}</p>
                    <p className="text-[9px] font-bold text-stone-300 uppercase mt-2 tracking-tight">{row.id} • {new Date(row.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform"><CheckCircle2 size={18}/></div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-stone-50 min-h-screen flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-12 print:hidden max-w-[400px]">
         <button onClick={onBack} className="p-4 bg-white rounded-2xl text-stone-600 shadow-sm border border-stone-100 active:scale-95 hover:bg-stone-50 transition-all"><ChevronLeft size={22}/></button>
         <div className="flex flex-col items-center">
            <BrandLogo size={12} color="#1c1917" />
            <div className="flex items-center gap-2 mt-1.5 opacity-40">
               <div className="h-px w-3 bg-stone-900"></div>
               <p className="text-[7px] font-black text-stone-900 uppercase tracking-[0.5em]">Operational Hub</p>
               <div className="h-px w-3 bg-stone-900"></div>
            </div>
         </div>
         <div className="w-14"></div>
      </div>

      <div className="flex bg-white p-2 rounded-[2.2rem] border border-stone-100 shadow-2xl sticky top-8 z-40 print:hidden mb-12 w-full max-w-[400px] ring-4 ring-stone-50/50">
        <button onClick={() => setSubTab('create')} className={`flex-1 py-4.5 rounded-[1.8rem] transition-all flex items-center justify-center gap-2.5 ${subTab === 'create' ? 'bg-stone-900 text-white shadow-xl scale-[1.02]' : 'text-stone-300 hover:text-stone-50'}`}>
          <Sparkles size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Gen</span>
        </button>
        <button onClick={() => setSubTab('scan')} className={`flex-1 py-4.5 rounded-[1.8rem] transition-all flex items-center justify-center gap-2.5 ${subTab === 'scan' ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'text-stone-300 hover:text-stone-50'}`}>
          <ScanLine size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Scan</span>
        </button>
        <button onClick={() => setSubTab('report')} className={`flex-1 py-4.5 rounded-[1.8rem] transition-all flex items-center justify-center gap-2.5 ${subTab === 'report' ? 'bg-emerald-800 text-white shadow-xl scale-[1.02]' : 'text-stone-300 hover:text-stone-50'}`}>
          <Users size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
        </button>
      </div>

      <div className="w-full flex justify-center">
        {subTab === 'create' && renderCreate()}
        {subTab === 'scan' && renderScan()}
        {subTab === 'report' && renderReport()}
      </div>
    </div>
  );
};

export default TicketPage;
