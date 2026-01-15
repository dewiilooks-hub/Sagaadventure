import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Sparkles, ScanLine, BarChart3, 
  Settings2, MapPin, User, RefreshCw, 
  Upload, Image as ImageIcon, X, Mountain, 
  Gift, Camera, Power, CheckCircle2, 
  XCircle, Keyboard, ArrowRight, Trash2, 
  FileSpreadsheet, Users, Crown, Printer, 
  ImageDown, Palette, Loader2, Banknote, Stamp, Star, Save,
  PhoneCall, HeartPulse, ShieldCheck, ShieldAlert, HardHat, Info,
  QrCode, Barcode, FileText, FileDown
} from 'lucide-react';
import { db, appId } from '../services/firebase';
import { TripEvent } from '../types';
import BrandLogo from './BrandLogo';

// External libraries via ESM.sh
import html2canvas from 'https://esm.sh/html2canvas';
import { Html5Qrcode } from 'https://esm.sh/html5-qrcode';
import { jsPDF } from 'https://esm.sh/jspdf';

type TicketSubTab = 'create' | 'scan' | 'report';

interface TicketPageProps {
  onBack: () => void;
  trips?: TripEvent[];
  onSave?: (data: any) => Promise<void>;
}

const CATEGORY_COLORS = [
  { name: 'None', color: 'transparent' },
  { name: 'Regular', color: 'rgba(2, 44, 34, 0.2)' }, // Increased transparency for background foliage
  { name: 'VIP', color: 'rgba(69, 26, 3, 0.2)' },     
  { name: 'Staff', color: 'rgba(23, 37, 84, 0.2)' },   
  { name: 'Press', color: 'rgba(69, 10, 10, 0.2)' },    
];

const THEMES = [
  { name: 'Jungle Dark', class: 'bg-stone-900', secondary: 'bg-stone-800' },
  { name: 'Indigo Night', class: 'bg-indigo-900', secondary: 'bg-indigo-800' },
  { name: 'Stone Dark', class: 'bg-stone-900', secondary: 'bg-stone-800' },
  { name: 'Rose Premium', class: 'bg-rose-900', secondary: 'bg-rose-800' },
];

const TicketPage: React.FC<TicketPageProps> = ({ onBack, trips = [], onSave }) => {
  const [subTab, setSubTab] = useState<TicketSubTab>('create');
  const [ticketData, setTicketData] = useState({
    event: "JUNGLE CAMP",
    date: new Date().toISOString().split('T')[0],
    time: "15:00",
    location: "Taman Wisata Mukakuning",
    guest: "",
    emergencyName: "",
    emergencyPhone: "",
    type: "Regular",
    price: "150000",
    id: "SAGA TIX-" + Math.floor(100000 + Math.random() * 900000),
    tripId: "",
    logo: null as string | null,
    bg: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop", 
    theme: THEMES[0],
    overlayColor: CATEGORY_COLORS[0].color
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
      return;
    }

    const unsub = db!.collection('artifacts').doc(appId).collection('public').doc('data').collection('scans')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setScanHistory(data);
      });

    return () => unsub();
  }, [isDemoMode, subTab]);

  const generateNewId = () => {
    setTicketData(prev => ({
      ...prev,
      id: "SAGA TIX-" + Math.floor(100000 + Math.random() * 900000)
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
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Saga_Ticket_${ticketData.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh PDF tiket.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToManifest = async () => {
    if (!ticketData.tripId) return alert("Pilih TRIP MASTER terlebih dahulu.");
    if (!ticketData.guest) return alert("Nama tamu wajib diisi.");
    if (!onSave) return;

    setIsProcessing(true);
    try {
      const ticketPrice = parseInt(ticketData.price.toString().replace(/\D/g, '')) || 0;
      const revenueForManifest = Math.max(0, ticketPrice - 10000);

      const payload = {
        tripId: ticketData.tripId,
        task: ticketData.guest,
        pic: 'E-Ticket System',
        qty: 1,
        unit: 'pax',
        price: revenueForManifest,
        status: 'paid',
        category: 'peserta',
        isDone: true,
        ticketId: ticketData.id 
      };
      await onSave(payload);
      alert("Peserta berhasil disimpan ke manifest! (Uang masuk dikurangi 10rb saldo merch)");
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
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
    if (upper.startsWith('SAGA TIX-') || upper.startsWith('TIX-')) {
      const validatedData = {
        id: upper,
        guest: upper === ticketData.id ? (ticketData.guest || "Unknown") : "Manual Check",
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Configuration Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between text-stone-900">
          <div className="flex items-center gap-3">
             <Settings2 size={20} className="text-indigo-600" />
             <h3 className="text-sm font-black uppercase tracking-[0.2em]">E-TICKET GENERATOR</h3>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Ticket ID</label>
               <div className="relative">
                  <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 pr-14 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.id} onChange={e => setTicketData({...ticketData, id: e.target.value})} />
                  <button onClick={generateNewId} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm hover:text-indigo-600 transition-all active:scale-90 border border-stone-100">
                    <RefreshCw size={14} />
                  </button>
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">TRIP MASTER</label>
               <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.tripId} onChange={e => setTicketData({...ticketData, tripId: e.target.value})}>
                  <option value="">PILIH TRIP</option>
                  {trips?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
               </select>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Event Name</label>
               <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.event} onChange={e => setTicketData({...ticketData, event: e.target.value})} />
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Date</label>
                 <input type="date" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.date} onChange={e => setTicketData({...ticketData, date: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Open Gate</label>
                 <input type="time" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.time} onChange={e => setTicketData({...ticketData, time: e.target.value})} />
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Location</label>
               <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.location} onChange={e => setTicketData({...ticketData, location: e.target.value})} />
             </div>
          </div>

          <div className="pt-6 border-t border-stone-50 space-y-4">
            <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Participant & Billing</h4>
            <div className="space-y-3">
              <input type="text" placeholder="GUEST NAME" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.guest} onChange={e => setTicketData({...ticketData, guest: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Ticket Category</label>
                   <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.type} onChange={e => setTicketData({...ticketData, type: e.target.value})}>
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="Staff">Staff</option>
                      <option value="Press">Press</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Ticket Price (Rp)</label>
                   <input type="number" placeholder="150000" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.price} onChange={e => setTicketData({...ticketData, price: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Category Color Layer</label>
                <div className="flex gap-2">
                   {CATEGORY_COLORS.map((cat) => (
                      <button 
                        key={cat.name} 
                        onClick={() => setTicketData({...ticketData, overlayColor: cat.color})} 
                        className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${ticketData.overlayColor === cat.color ? 'border-stone-900 scale-110 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: cat.color === 'transparent' ? '#f5f5f4' : cat.color }}
                        title={cat.name}
                      >
                         {cat.color === 'transparent' && <X size={14} className="text-stone-300" />}
                      </button>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-50 space-y-4">
            <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><PhoneCall size={14}/> Emergency Info</h4>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Nama Keluarga</label>
                  <input type="text" placeholder="Ayah/Ibu/Kerabat" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold uppercase outline-none" value={ticketData.emergencyName} onChange={e => setTicketData({...ticketData, emergencyName: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">No HP Keluarga</label>
                  <input type="tel" placeholder="08..." className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-xs font-bold outline-none" value={ticketData.emergencyPhone} onChange={e => setTicketData({...ticketData, emergencyPhone: e.target.value})} />
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-50 space-y-4">
            <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Assets</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-100 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                <Upload size={16} className="text-stone-400 mb-2" />
                <span className="text-[9px] font-black uppercase text-stone-500">Logo</span>
              </label>
              <label className="flex flex-col items-center justify-center p-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-100 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bg')} />
                <ImageIcon size={16} className="text-stone-400 mb-2" />
                <span className="text-[9px] font-black uppercase text-stone-500">B foliage</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Preview Column */}
      <div className="flex flex-col items-center space-y-12 pb-24">
        <div ref={ticketRef} className="space-y-0 flex flex-col items-center">
          {/* SLIDE 1: MAIN E-TICKET */}
          <div className="relative w-[360px] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] rounded-[3.5rem] overflow-hidden bg-white">
            <div className={`relative w-full h-[580px] ${ticketData.theme.class} text-white flex flex-col z-10`}>
                {ticketData.bg && (
                   <img src={ticketData.bg} className="absolute inset-0 w-full h-full object-cover z-0 grayscale-[0.2] brightness-50" />
                )}
                {/* Category Overlay Layer */}
                <div 
                  className="absolute inset-0 z-[1] transition-colors duration-500" 
                  style={{ backgroundColor: ticketData.overlayColor }}
                ></div>
                {/* Visual Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[2]"></div>
                
                <div className="relative z-10 h-full p-10 flex flex-col">
                    <div className="flex items-center gap-4 mb-14">
                       <div className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[9px] font-black uppercase tracking-widest">
                          E-Ticket
                       </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        {ticketData.logo ? (
                           <img src={ticketData.logo} className="w-10 h-10 object-contain rounded-xl" />
                        ) : (
                           <div className="w-10 h-10 border border-white/40 rounded-xl flex items-center justify-center backdrop-blur-sm"><Mountain size={20}/></div>
                        )}
                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">SAGA ADVENTURE</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-[52px] font-black leading-[0.9] tracking-tighter uppercase drop-shadow-2xl mb-12">
                           {ticketData.event.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                        </h2>

                        <div className="space-y-5">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div className="space-y-1.5">
                                  <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Date</p>
                                  <p className="font-black text-xl uppercase tracking-tight">
                                     {new Date(ticketData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right space-y-1.5">
                                  <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Open Gate</p>
                                  <p className="font-black text-xl tracking-tight">{ticketData.time}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                  <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Price</p>
                                  <p className="font-black text-xl uppercase tracking-tight">Rp{parseInt(ticketData.price).toLocaleString('id-ID')}</p>
                               </div>
                               <div className="text-right space-y-1.5">
                                  <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Location</p>
                                  <p className="font-black text-xs uppercase tracking-tight leading-snug">{ticketData.location}</p>
                               </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-7 flex justify-between items-center border border-white/10 shadow-2xl">
                        <div>
                           <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-2">Guest</p>
                           <p className="font-black text-xl truncate max-w-[160px] uppercase tracking-tighter leading-none">
                              {ticketData.guest || '........'}
                           </p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-2xl text-[11px] font-black text-stone-900 shadow-xl uppercase">
                           {ticketData.type}
                        </div>
                    </div>
                </div>
                
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full z-20"></div>
            </div>
            
            <div className="relative w-full bg-white pt-14 pb-12 px-10 text-center flex flex-col items-center">
                {/* Secondary Info Section */}
                <div className="w-full flex justify-between items-center mb-8 border-b border-stone-50 pb-6">
                   <div className="flex flex-col items-start text-left">
                      <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1.5">REDEEM AT</p>
                      <div className="flex items-center gap-2 text-stone-900">
                         <span className="text-[10px] font-black uppercase tracking-tighter">SAGA ADVENTURE GOODS</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end opacity-40">
                      <p className="text-[7px] font-black text-stone-300 uppercase tracking-widest mb-1">Authentic Pass</p>
                      <Gift size={12} className="text-stone-900" />
                   </div>
                </div>

                {/* Professional Larger Main Barcode */}
                <div className="w-full bg-white border border-stone-100 rounded-[2.5rem] p-8 mb-8 flex flex-col items-center shadow-sm">
                   <img 
                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(ticketData.id)}&scale=10&height=12&includetext=false&backgroundcolor=ffffff`} 
                    className="w-full h-12 object-contain mb-8 grayscale" 
                    alt="main-barcode"
                   />
                   <div className="w-full overflow-hidden flex justify-center mb-3">
                     <p className="font-mono text-stone-900 font-bold tracking-[0.3em] text-[10px] uppercase leading-none whitespace-nowrap">
                       {ticketData.id}
                     </p>
                   </div>
                   <div className="h-px w-8 bg-stone-100 mb-3"></div>
                   <p className="text-[8px] text-stone-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                     OFFICIAL ENCRYPTED PASS • ACCESS LEVEL: {ticketData.type.toUpperCase()}
                   </p>
                </div>
            </div>
          </div>

          {/* SLIDE 2: TERMS */}
          <div className="relative w-[360px] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] rounded-[3.5rem] overflow-hidden bg-white flex flex-col p-12 print:page-break-before-always mt-0">
             <div className="flex justify-between items-center border-b-2 border-stone-100 pb-8 mb-10">
                <div>
                  <BrandLogo size={8} color="#1c1917" />
                  <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tighter mt-1">OFFICIAL TERMS</h3>
                </div>
                <ShieldCheck size={40} className="text-stone-100" />
             </div>

             <div className="space-y-8 text-left flex-1">
                <SectionTicketTerm 
                  title="1. Cancelation Policy" 
                  items={[
                    "H-7: 50% Penalty dari total biaya tiket.",
                    "H-1 atau kurang: Biaya hangus (No Refund).",
                    "Force Majeure: Diatur kebijakan SAGA."
                  ]}
                />
                <SectionTicketTerm 
                  title="2. Kesehatan & Keselamatan" 
                  items={[
                    "Peserta wajib jujur soal kondisi fisik.",
                    "Peserta wajib membawa obat pribadi.",
                    "SAGA berhak menolak peserta yang sakit fatal."
                  ]}
                />
                <SectionTicketTerm 
                  title="3. Izin & Kontak Darurat" 
                  items={[
                    `Peserta menyatakan telah mendapat izin keluarga.`,
                    `Keluarga: ${ticketData.emergencyName || '....................'}`,
                    `No HP: ${ticketData.emergencyPhone || '....................'}`
                  ]}
                />
                <SectionTicketTerm 
                  title="4. Evakuasi Darurat" 
                  items={[
                    "Evakuasi lapangan awal difasilitasi crew SAGA.",
                    "Biaya lanjutan di luar asuransi ditanggung mandiri."
                  ]}
                />
             </div>

             <div className="mt-12 pt-10 border-t border-dashed border-stone-100 text-center">
                <p className="text-[7px] text-stone-300 font-bold uppercase tracking-[0.5em] mb-4 leading-relaxed px-4">
                  VALID TICKET HOLDER AGREES TO ALL SAGA ADVENTURE OPERATIONAL TERMS.
                </p>
                <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{ticketData.id}</p>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[360px] pb-24 print:hidden px-4">
          <button 
            onClick={downloadTicketPDF} 
            disabled={isProcessing}
            className="w-full bg-stone-900 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 hover:bg-black disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={22}/> : <FileDown size={22}/>} 
            {isProcessing ? "Processing PDF..." : "Save E-Ticket PDF"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => window.print()} className="bg-white border border-stone-100 text-stone-900 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              <Printer size={16}/> Print
            </button>
            {ticketData.tripId && (
              <button onClick={handleSaveToManifest} disabled={isProcessing} className="bg-emerald-700 text-white py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} To Manifest
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="max-w-md mx-auto flex flex-col items-center space-y-10 animate-in fade-in duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">Scanner Portal</h2>
        <p className="text-stone-300 text-[10px] font-black uppercase tracking-widest mt-2">Authentication Checkpoint</p>
      </div>
      <div className="relative w-full aspect-[4/5] bg-stone-950 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-8 border-stone-900">
        <div id="reader" className="w-full h-full"></div>
        {!isScanning && !scanFeedback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-400 p-12 text-center z-20">
            <Camera size={64} className="mb-8 opacity-10" />
            <button onClick={startCamera} className="px-12 py-6 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all active:scale-95 flex items-center gap-3 hover:bg-indigo-700">
              <Power size={20} /> Activate Camera
            </button>
          </div>
        )}
        {scanFeedback && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-30 animate-in zoom-in duration-300 ${scanFeedback === 'success' ? 'bg-emerald-600/95' : 'bg-rose-600/95'} backdrop-blur-2xl`}>
            {scanFeedback === 'success' ? (
              <div className="text-center space-y-6">
                <CheckCircle2 size={100} className="text-white mx-auto drop-shadow-2xl" />
                <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Verified</h4>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <XCircle size={100} className="text-white mx-auto drop-shadow-2xl" />
                <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Invalid</h4>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-full bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); validateAndSave(manualId); setManualId(''); }} className="space-y-4">
          <div className="relative">
            <Keyboard size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-200" />
            <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="MANUAL TICKET ID" className="w-full pl-16 pr-6 py-6 bg-stone-50 border-none rounded-[1.5rem] outline-none font-mono text-sm font-black uppercase tracking-[0.2em]" />
          </div>
          <button type="submit" disabled={isProcessing} className="w-full py-6 bg-stone-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl active:scale-95 transition-all">
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Validate Entry"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none">Event Analytics</h2>
          <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mt-3">Scan Data Summary</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-50">
           <p className="text-stone-300 text-[10px] font-black uppercase mb-6">Attended Guests</p>
           <h3 className="text-6xl font-black text-stone-900 tracking-tighter">{scanHistory.length}</h3>
        </div>
        <div className="bg-stone-900 p-10 rounded-[3rem] shadow-2xl text-white">
           <p className="text-white/40 text-[10px] font-black uppercase mb-6">Status Portal</p>
           <h3 className="text-2xl font-black tracking-tighter uppercase">Operational</h3>
        </div>
      </div>
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-stone-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-50">
            <tr>
              <th className="p-8 text-[11px] font-black text-stone-300 uppercase">Timestamp</th>
              <th className="p-8 text-[11px] font-black text-stone-300 uppercase">Tix ID</th>
              <th className="p-8 text-[11px] font-black text-stone-300 uppercase">Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {scanHistory.map((row, idx) => (
              <tr key={idx} className="hover:bg-stone-50 transition-all duration-300">
                <td className="p-8 text-[11px] font-black text-stone-400 uppercase">{new Date(row.timestamp).toLocaleTimeString()}</td>
                <td className="p-8 font-mono font-black text-stone-900 text-sm uppercase">{row.id}</td>
                <td className="p-8 font-black text-stone-700 text-xs uppercase">{row.guest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-12 bg-stone-50 min-h-screen relative overflow-x-hidden">
      <div className="flex items-center justify-between mb-4 print:hidden">
         <button onClick={onBack} className="p-5 bg-white rounded-3xl text-stone-600 shadow-sm transition-all active:scale-95 hover:bg-stone-50"><ChevronLeft size={20}/></button>
         <BrandLogo size={11} color="#1c1917" />
         <div className="w-14"></div>
      </div>
      <div className="flex bg-white/80 backdrop-blur-2xl p-2.5 rounded-[2.5rem] border border-stone-100 shadow-2xl sticky top-20 z-40 print:hidden max-w-2xl mx-auto">
        <button onClick={() => setSubTab('create')} className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'create' ? 'bg-stone-900 text-white shadow-2xl' : 'text-stone-300'}`}><Sparkles size={20}/> Generator</button>
        <button onClick={() => setSubTab('scan')} className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'scan' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-stone-300'}`}><ScanLine size={20}/> Scanner</button>
        <button onClick={() => setSubTab('report')} className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'report' ? 'bg-stone-800 text-white shadow-2xl' : 'text-stone-300'}`}><BarChart3 size={20}/> Analytics</button>
      </div>
      <div className="max-w-6xl mx-auto">
        {subTab === 'create' && renderCreate()}
        {subTab === 'scan' && renderScan()}
        {subTab === 'report' && renderReport()}
      </div>
    </div>
  );
};

const SectionTicketTerm = ({ title, items }: { title: string, items: string[] }) => (
  <div className="space-y-4">
     <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
       <div className="w-2.5 h-2.5 bg-stone-900 rounded-full"></div> {title}
     </h4>
     <ul className="space-y-2 ml-4">
       {items.map((item, i) => (
         <li key={i} className="text-[10px] font-bold text-stone-500 leading-tight flex gap-2">
           <span className="text-stone-200">•</span> {item}
         </li>
       ))}
     </ul>
  </div>
);

export default TicketPage;