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
  QrCode, Barcode, FileText, FileDown, Activity, ListChecks
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
  { name: 'Regular', color: 'rgba(2, 44, 34, 0.4)' },
  { name: 'VIP', color: 'rgba(69, 26, 3, 0.4)' },     
  { name: 'Staff', color: 'rgba(23, 37, 84, 0.4)' },   
  { name: 'Press', color: 'rgba(69, 10, 10, 0.4)' },    
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

    // IMPORTANT:
    // We **never** mutate the on-screen ticket DOM when exporting.
    // html2canvas sometimes renders web-font metrics slightly differently and crops
    // the top of heavy uppercase glyphs (e.g., PENGKHIANAT). If we patch the live DOM
    // (overflow/line-height), it can briefly "uglify" the UI or get stuck if something
    // interrupts the restore.
    //
    // Final approach: clone the ticket offscreen, apply export-only inline styles to
    // the clone, capture the clone, then remove the clone. UI stays pristine.

    let exportHost: HTMLDivElement | null = null;

    const applyExportStyles = (root: HTMLElement) => {
      // Let content overflow during capture
      root.style.overflow = 'visible';
      root.querySelectorAll<HTMLElement>('.overflow-hidden').forEach(node => {
        node.style.overflow = 'visible';
      });

      // Fix holder name top clipping (strong buffer)
      const holderName = root.querySelector<HTMLElement>('.ticket-holder-name');
      if (holderName) {
        holderName.style.display = 'inline-block';
        holderName.style.lineHeight = '1.25';
        holderName.style.paddingTop = '8px';
        holderName.style.paddingBottom = '2px';
      }

      // Small extra safety for text rendering
      (root.style as any).webkitFontSmoothing = 'antialiased';
    };

    try {
      // Ensure web fonts are fully loaded before capture (prevents text metric shifts)
      // @ts-ignore
      if (document.fonts?.ready) await (document.fonts.ready);

      const live = ticketRef.current;

      // Create an offscreen host
      exportHost = document.createElement('div');
      exportHost.setAttribute('data-export-host', 'true');
      exportHost.style.position = 'fixed';
      exportHost.style.left = '-10000px';
      exportHost.style.top = '0';
      exportHost.style.width = `${live.getBoundingClientRect().width}px`;
      exportHost.style.pointerEvents = 'none';
      exportHost.style.opacity = '0';
      exportHost.style.zIndex = '-1';
      document.body.appendChild(exportHost);

      // Clone the ticket
      const clone = live.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-exporting', 'true');
      clone.style.margin = '0';
      clone.style.transform = 'none';
      exportHost.appendChild(clone);

      // Apply export-only styles to clone
      applyExportStyles(clone);

      // Wait a frame so layout/styles settle
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      // Capture clone for High Resolution PDF output
      const canvas = await html2canvas(clone, {
        scale: 4,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 4, canvas.height / 4]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 4, canvas.height / 4);
      pdf.save(`Saga_Ticket_${ticketData.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh PDF tiket.");
    } finally {
      // Remove offscreen export clone (UI was never mutated)
      if (exportHost && exportHost.parentNode) exportHost.parentNode.removeChild(exportHost);
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
      alert("Peserta berhasil disimpan ke manifest!");
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-6xl mx-auto">
      {/* Configuration Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar w-full">
        <div className="flex items-center justify-between text-stone-900">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-50 rounded-2xl">
               <Settings2 size={18} className="text-indigo-600" />
             </div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Generator Settings</h3>
          </div>
        </div>
        
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-stone-300"/>
              <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Event Core Data</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Unique Ticket ID</label>
                <div className="relative">
                    <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 pr-14 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.id} onChange={e => setTicketData({...ticketData, id: e.target.value})} />
                    <button onClick={generateNewId} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm hover:text-indigo-600 transition-all active:scale-90 border border-stone-100">
                      <RefreshCw size={14} />
                    </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Trip Reference</label>
                <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.tripId} onChange={e => setTicketData({...ticketData, tripId: e.target.value})}>
                    <option value="">-- SELECT TRIP MASTER --</option>
                    {trips?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Event Header</label>
                <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.event} onChange={e => setTicketData({...ticketData, event: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Schedule Date</label>
                  <input type="date" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.date} onChange={e => setTicketData({...ticketData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Open Gate</label>
                  <input type="time" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.time} onChange={e => setTicketData({...ticketData, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-1">Location Venue</label>
                <input type="text" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.location} onChange={e => setTicketData({...ticketData, location: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-stone-50">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-stone-300"/>
              <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Participant Details</h4>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="GUEST FULL NAME" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100 shadow-inner" value={ticketData.guest} onChange={e => setTicketData({...ticketData, guest: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Category</label>
                   <select className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.type} onChange={e => setTicketData({...ticketData, type: e.target.value})}>
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="Staff">Staff</option>
                      <option value="Press">Press</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Price (IDR)</label>
                   <input type="number" placeholder="150000" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" value={ticketData.price} onChange={e => setTicketData({...ticketData, price: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest ml-1">Visual Tint Layer</label>
                <div className="flex gap-3">
                   {CATEGORY_COLORS.map((cat) => (
                      <button 
                        key={cat.name} 
                        onClick={() => setTicketData({...ticketData, overlayColor: cat.color})} 
                        className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${ticketData.overlayColor === cat.color ? 'border-stone-900 scale-110 shadow-lg' : 'border-stone-100 hover:border-stone-300'}`}
                        style={{ backgroundColor: cat.color === 'transparent' ? '#f5f5f4' : cat.color }}
                      >
                         {cat.color === 'transparent' && <X size={12} className="text-stone-300" />}
                      </button>
                   ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-stone-50">
            <div className="flex items-center gap-2 mb-2">
              <PhoneCall size={14} className="text-stone-300"/>
              <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Emergency Access</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input type="text" placeholder="FAMILY NAME" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.emergencyName} onChange={e => setTicketData({...ticketData, emergencyName: e.target.value})} />
               <input type="tel" placeholder="MOBILE NUMBER" className="w-full bg-stone-50 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100" value={ticketData.emergencyPhone} onChange={e => setTicketData({...ticketData, emergencyPhone: e.target.value})} />
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-stone-50 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={14} className="text-stone-300"/>
              <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Branding Assets</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center p-6 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2rem] cursor-pointer hover:bg-stone-100 transition-all hover:border-stone-400">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                <Upload size={18} className="text-stone-300 mb-2" />
                <span className="text-[8px] font-black uppercase text-stone-400">Upload Logo</span>
              </label>
              <label className="flex flex-col items-center justify-center p-6 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2rem] cursor-pointer hover:bg-stone-100 transition-all hover:border-stone-400">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bg')} />
                <ImageIcon size={18} className="text-stone-300 mb-2" />
                <span className="text-[8px] font-black uppercase text-stone-400">Main Foliage</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Ticket Preview Column */}
      <div className="flex flex-col items-center space-y-12 pb-24 w-full">
        <div 
          ref={ticketRef} 
          className="flex flex-col items-center bg-white p-0 m-0 overflow-hidden shadow-2xl rounded-3xl" 
          style={{ width: '380px' }}
        >
          {/* SLIDE 1: MAIN E-TICKET */}
          <div className="relative w-full h-[620px] overflow-hidden bg-stone-950">
              {ticketData.bg && (
                 <img src={ticketData.bg} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-50" />
              )}
              <div 
                className="absolute inset-0 z-[1]" 
                style={{ backgroundColor: ticketData.overlayColor }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 z-[2]"></div>
              
              <div className="relative z-10 h-full p-10 flex flex-col">
                  <div className="flex items-center justify-between mb-12">
                     <div className="px-4 py-2 rounded-full border border-white/30 bg-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-white">
                        E-Ticket Pass
                     </div>
                     <div className="flex items-center gap-2">
                        {ticketData.logo ? (
                           <img src={ticketData.logo} className="w-8 h-8 object-contain rounded-lg shadow-lg" />
                        ) : (
                           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white"><Mountain size={16}/></div>
                        )}
                     </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">SAGA ADVENTURE PRESENTS</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-[48px] font-black leading-[0.85] tracking-tighter uppercase text-white mb-10">
                         {ticketData.event.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                      </h2>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8">
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">Date</p>
                            <p className="font-black text-lg uppercase tracking-tight text-white">
                               {new Date(ticketData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">Open Gate</p>
                            <p className="font-black text-lg tracking-tight text-white">{ticketData.time}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">Access</p>
                            <p className="font-black text-lg uppercase tracking-tight text-emerald-400">{ticketData.type}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">Fare</p>
                            <p className="font-black text-lg tracking-tight text-white">Rp{parseInt(ticketData.price).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">Location</p>
                            <p className="font-black text-[11px] uppercase tracking-tight text-white leading-tight">{ticketData.location}</p>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 bg-black/60 border border-white/10 rounded-3xl p-6 flex flex-col">
                     <p className="text-[8px] uppercase font-black text-white/30 tracking-[0.2em] mb-2">Authenticated Ticket Holder</p>
                     <p className="ticket-holder-name font-black text-2xl truncate uppercase tracking-tighter text-white leading-none mb-1">
                        {ticketData.guest || '........'}
                     </p>
                     <p className="text-[10px] font-bold text-white/50 tracking-wider">ID: {ticketData.id}</p>
                  </div>
              </div>
          </div>

          <div className="relative w-full bg-white px-10 pt-12 pb-10 flex flex-col items-center">
              <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-stone-200"></div>
              <div className="absolute top-0 -left-4 w-8 h-8 bg-stone-100 rounded-full -translate-y-1/2 shadow-inner"></div>
              <div className="absolute top-0 -right-4 w-8 h-8 bg-stone-100 rounded-full -translate-y-1/2 shadow-inner"></div>

              <div className="w-full flex justify-between items-center mb-8 border-b border-stone-50 pb-6">
                 <div className="flex flex-col items-start">
                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1.5">REDEMPTION AT</p>
                    <span className="text-[10px] font-black uppercase text-stone-900 tracking-tighter">SAGA ADVENTURE BASECAMP</span>
                 </div>
                 <div className="flex items-center gap-2 opacity-50 grayscale">
                    <BrandLogo size={6} color="#000" />
                 </div>
              </div>

              <div className="w-full bg-stone-50 border border-stone-100 rounded-3xl p-8 flex flex-col items-center">
                 <img 
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(ticketData.id)}&scale=10&height=12&includetext=false&backgroundcolor=f8f8f7`} 
                  className="w-full h-12 object-contain mb-8 grayscale" 
                  alt="main-barcode"
                 />
                 <p className="font-mono text-stone-900 font-bold tracking-[0.4em] text-[10px] uppercase leading-none mb-4">
                   {ticketData.id}
                 </p>
                 <div className="h-px w-12 bg-stone-200 mb-4"></div>
                 <p className="text-[7px] text-stone-400 font-black uppercase tracking-[0.2em] text-center max-w-[240px]">
                   SCAN FOR ACCESS • VALID ONLY FOR THE REGISTERED NAME ABOVE • NON-REFUNDABLE
                 </p>
              </div>
          </div>

          <div className="w-full bg-stone-50 px-12 py-16 flex flex-col border-t-4 border-stone-900">
             <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tighter">OFFICIAL TERMS</h3>
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">SAGA ADVENTURE POLICIES</p>
                </div>
                <ShieldCheck size={40} className="text-stone-200" />
             </div>

             <div className="space-y-8 text-left">
                <SectionTicketTerm 
                  title="1. Cancelation Policy" 
                  items={[
                    "H-7: 50% Penalty dari total biaya perjalanan.",
                    "H-1 atau kurang: Biaya hangus (No Refund).",
                    "Force Majeure: Diatur sepenuhnya oleh kebijakan SAGA."
                  ]}
                />
                <SectionTicketTerm 
                  title="2. Kesehatan & Keselamatan" 
                  items={[
                    "Peserta wajib jujur mengenai kondisi fisiknya.",
                    "Peserta wajib membawa obat-obatan pribadi.",
                    "SAGA berhak menolak peserta yang sakit demi keamanan tim."
                  ]}
                />
                <SectionTicketTerm 
                  title="3. Izin & Kontak Darurat" 
                  items={[
                    "Peserta menyatakan telah mendapat izin keluarga/kerabat.",
                    `Kontak: ${ticketData.emergencyName || '..........'}`,
                    `HP: ${ticketData.emergencyPhone || '..........'}`
                  ]}
                />
                <SectionTicketTerm 
                  title="4. Evakuasi Darurat" 
                  items={[
                    "Evakuasi lapangan awal difasilitasi crew SAGA",
                    "Biaya evakuasi lanjutan di luar jangkauan menjadi tanggung jawab peserta."
                  ]}
                />
             </div>

             <div className="mt-16 pt-8 border-t border-dashed border-stone-200 text-center">
                <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest mb-2">{ticketData.id}</p>
                <p className="text-[6px] text-stone-300 font-bold uppercase tracking-[0.4em] leading-relaxed">
                  VALIDATED SECURITY PASS • GENERATED ON {new Date().toLocaleDateString()}
                </p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[360px] pb-24 print:hidden px-4 mt-8">
          <button 
            onClick={downloadTicketPDF} 
            disabled={isProcessing}
            className="w-full bg-stone-900 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 hover:bg-black disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={22}/> : <FileDown size={22}/>} 
            {isProcessing ? "Generating..." : "Download E-Ticket PDF"}
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
    <div className="max-w-2xl mx-auto flex flex-col items-center space-y-12 animate-in fade-in duration-700 pb-24 px-4 w-full">
      <div className="text-center">
        <div className="p-5 bg-indigo-50 rounded-[2rem] w-fit mx-auto mb-6">
          <ScanLine size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">Scanner Terminal</h2>
        <p className="text-stone-300 text-[10px] font-black uppercase tracking-widest mt-2">Authentication & Access Control</p>
      </div>

      <div className="relative w-full max-w-md aspect-[4/5] bg-stone-950 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-8 border-stone-900 mx-auto">
        <div id="reader" className="w-full h-full"></div>
        {!isScanning && !scanFeedback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-400 p-12 text-center z-20">
            <div className="w-32 h-32 border-2 border-stone-800 rounded-full flex items-center justify-center mb-10 relative">
              <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
              <Camera size={48} className="opacity-10" />
            </div>
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
        {isScanning && !scanFeedback && (
           <div className="absolute left-0 right-0 h-1 bg-indigo-500 top-0 animate-[scan_3s_linear_infinite] z-10 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
        )}
      </div>

      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-6 mx-auto">
        <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest text-center">Manual Fallback</h4>
        <form onSubmit={(e) => { e.preventDefault(); validateAndSave(manualId); setManualId(''); }} className="space-y-4">
          <div className="relative">
            <Keyboard size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-200" />
            <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="TICKET ID" className="w-full pl-16 pr-6 py-6 bg-stone-50 border-none rounded-[1.5rem] outline-none font-mono text-sm font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-stone-100" />
          </div>
          <button type="submit" disabled={isProcessing} className="w-full py-6 bg-stone-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl active:scale-95 transition-all">
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Validate Now"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700 w-full max-w-6xl mx-auto px-4">
      <div className="text-center">
        <div className="p-5 bg-stone-100 rounded-[2rem] w-fit mx-auto mb-6">
          <Users size={32} className="text-stone-900" />
        </div>
        <h2 className="text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none">Attendance Log</h2>
        <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mt-3">Manifest Redemption Records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 flex items-center justify-between">
           <div>
             <p className="text-stone-300 text-[10px] font-black uppercase mb-2 tracking-widest">Attendance</p>
             <h3 className="text-5xl font-black text-stone-900 tracking-tighter">{scanHistory.length} <span className="text-xl text-stone-200 uppercase">Pax</span></h3>
           </div>
           <div className="p-5 bg-emerald-50 rounded-3xl">
             <CheckCircle2 size={32} className="text-emerald-500" />
           </div>
        </div>
        <div className="bg-stone-900 p-10 rounded-[3rem] shadow-2xl text-white flex items-center justify-between">
           <div>
             <p className="text-white/40 text-[10px] font-black uppercase mb-2 tracking-widest">Active Link</p>
             <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</h3>
             <p className="text-[9px] font-black text-white/30 uppercase mt-1">Operational Sync</p>
           </div>
           <div className="p-5 bg-white/10 rounded-3xl">
             <RefreshCw size={32} className="text-white/20" />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-stone-100 overflow-hidden w-full max-w-5xl mx-auto">
        <div className="p-8 border-b border-stone-50 flex items-center justify-between bg-stone-50/30">
          <div className="flex items-center gap-3">
            <ListChecks size={20} className="text-stone-300" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-900">Recent Validations</h4>
          </div>
          <button className="text-stone-300 hover:text-stone-900 transition-colors"><FileText size={18}/></button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-white">
              <tr>
                <th className="py-6 px-10 text-[9px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50">Log Time</th>
                <th className="py-6 px-10 text-[9px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50">Reference ID</th>
                <th className="py-6 px-10 text-[9px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50">Guest Name</th>
                <th className="py-6 px-10 text-[9px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50">Identity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {scanHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/80 transition-all duration-300 group">
                  <td className="py-7 px-10 text-[11px] font-black text-stone-400 uppercase">{new Date(row.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</td>
                  <td className="py-7 px-10 font-mono font-black text-stone-600 text-xs uppercase group-hover:text-indigo-600 transition-colors">{row.id}</td>
                  <td className="py-7 px-10 font-black text-stone-900 text-xs uppercase tracking-tight">{row.guest}</td>
                  <td className="py-7 px-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Authenticated</span>
                    </div>
                  </td>
                </tr>
              ))}
              {scanHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center opacity-10">
                    <ListChecks size={64} className="mx-auto" />
                    <p className="text-[11px] font-black uppercase mt-6 tracking-[0.4em]">Waiting for data</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-12 bg-stone-50 min-h-screen relative overflow-x-hidden flex flex-col items-center w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 print:hidden w-full max-w-6xl">
         <button onClick={onBack} className="p-4 bg-white rounded-2xl text-stone-600 shadow-sm transition-all active:scale-95 hover:bg-stone-50 border border-stone-100"><ChevronLeft size={18}/></button>
         <div className="flex flex-col items-center">
            <BrandLogo size={11} color="#1c1917" />
            <p className="text-[7px] font-black text-stone-300 uppercase tracking-[0.5em] mt-1">Ticketing Portal</p>
         </div>
         <div className="w-12"></div>
      </div>

      {/* Segmented Menu - Icon Only for maximum layout stability */}
      <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-[3rem] border border-stone-100 shadow-2xl sticky top-20 z-40 print:hidden w-fit mx-auto ring-[10px] ring-stone-50/50">
        <button 
          onClick={() => setSubTab('create')} 
          title="Ticket Generator"
          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all duration-500 ${subTab === 'create' ? 'bg-stone-900 text-white shadow-xl scale-110' : 'text-stone-300 hover:text-stone-600'}`}
        >
          <Sparkles size={22}/>
        </button>
        <button 
          onClick={() => setSubTab('scan')} 
          title="QR Scanner"
          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all duration-500 ${subTab === 'scan' ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-stone-300 hover:text-stone-600'}`}
        >
          <ScanLine size={22}/>
        </button>
        <button 
          onClick={() => setSubTab('report')} 
          title="Attendance Report"
          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all duration-500 ${subTab === 'report' ? 'bg-stone-800 text-white shadow-xl scale-110' : 'text-stone-300 hover:text-stone-600'}`}
        >
          <Users size={22}/>
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full flex flex-col items-center">
        {subTab === 'create' && renderCreate()}
        {subTab === 'scan' && renderScan()}
        {subTab === 'report' && renderReport()}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
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
           <span className="text-stone-200 font-black">•</span> {item}
         </li>
       ))}
     </ul>
  </div>
);

export default TicketPage;