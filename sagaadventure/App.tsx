import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, isCloudEnabled } from './services/firebase';
import { 
  LogOut, Cloud, CloudOff, Info, X, 
  Settings, Database, ExternalLink, 
  CheckCircle2, RefreshCw 
} from 'lucide-react';
import HomePage from './components/HomePage';
import RentalPage from './components/RentalPage';
import OpenTripPage from './components/OpenTripPage';
import MerchPage from './components/MerchPage';
import LoginPage from './components/LoginPage';
import BrandLogo from './components/BrandLogo';
import { ViewMode } from './types';

export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModule, setActiveModule] = useState<ViewMode | null>(null);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [configInput, setConfigInput] = useState('');

  useEffect(() => {
    if (!auth) return;
    
    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await auth.signInWithCustomToken((window as any).__initial_auth_token);
        } else {
          // Default to anonymous if no specific token provided to ensure Firebase interaction is possible
          if (!auth.currentUser) await auth.signInAnonymously();
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };

    initAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleNavigate = (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      setShowLogin(false);
      return;
    }
    
    // Logic: Lock module after login until session cleared
    if (activeModule && activeModule !== view) {
      alert(`Akses Terkunci: Modul ${activeModule.toUpperCase()} sedang aktif.`);
      return;
    }

    if (!activeModule) {
      setPendingView(view);
      setShowLogin(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleLoginSuccess = () => {
    if (pendingView) {
      setActiveModule(pendingView);
      setCurrentView(pendingView);
      setShowLogin(false);
      setPendingView(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari sesi ini? Data modul akan terkunci kembali.")) {
      setActiveModule(null);
      setCurrentView('home');
      setShowLogin(false);
      // We don't necessarily sign out of Firebase to keep the connection, 
      // just clear the UI session for SAGA modules
    }
  };

  const saveCloudConfig = () => {
    try {
      const parsed = JSON.parse(configInput);
      if (!parsed.apiKey) throw new Error("Invalid Config");
      localStorage.setItem('saga_user_firebase_config', JSON.stringify(parsed));
      alert("Konfigurasi disimpan! Aplikasi akan memuat ulang untuk mengaktifkan Cloud Sync.");
      window.location.reload();
    } catch (e) {
      alert("Format JSON tidak valid atau data Firebase tidak lengkap.");
    }
  };

  const disconnectCloud = () => {
    if (window.confirm("Putuskan koneksi Cloud? Data akan kembali disimpan secara lokal di perangkat ini saja.")) {
      localStorage.removeItem('saga_user_firebase_config');
      window.location.reload();
    }
  };

  const renderView = () => {
    if (showLogin) {
      return (
        <LoginPage 
          isDemoMode={!isCloudEnabled}
          targetView={pendingView}
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => {
            setShowLogin(false);
            setPendingView(null);
            setCurrentView('home');
          }} 
        />
      );
    }

    switch (currentView) {
      case 'rental':
        return <RentalPage onBack={() => setCurrentView('home')} />;
      case 'trip':
        return <OpenTripPage user={user} onBack={() => setCurrentView('home')} />;
      case 'merch':
        return <MerchPage onBack={() => setCurrentView('home')} />;
      default:
        return <HomePage onNavigate={handleNavigate} activeModule={activeModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-stone-100 flex flex-col">
      {/* App Header */}
      <div className="bg-white border-b border-stone-50 px-6 py-5 shadow-sm sticky top-0 z-50 flex items-center justify-between print:hidden shrink-0">
        <div className="flex flex-col">
          <BrandLogo size={10} color="#1c1917" />
          <button 
            onClick={() => setShowCloudModal(true)}
            className="flex items-center gap-1 mt-1 group"
          >
            {isCloudEnabled ? (
              <span className="flex items-center gap-1 text-[7px] font-black text-emerald-600 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                <Cloud size={8} /> Cloud Synced
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[7px] font-black text-orange-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
                <CloudOff size={8} /> Local Mode (No Sync)
              </span>
            )}
          </button>
        </div>
        
        {activeModule && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all hover:bg-stone-800 active:scale-95 shadow-md"
          >
            <LogOut size={10} /> Logout
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {!isCloudEnabled && currentView === 'home' && (
          <div className="m-6 p-6 bg-white border border-orange-100 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Info size={20} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest mb-1">Local Storage Mode</h4>
                <p className="text-[10px] font-bold text-stone-400 leading-relaxed uppercase">
                  Data Anda hanya tersimpan di perangkat ini. Hubungkan ke Firebase agar data bisa dibuka di HP atau Laptop lain.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCloudModal(true)}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              Hubungkan Sekarang
            </button>
          </div>
        )}
        {renderView()}
      </div>

      {/* Cloud Settings Modal */}
      {showCloudModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="bg-stone-900 p-8 text-white relative">
              <button 
                onClick={() => setShowCloudModal(false)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
              <Database size={32} className="mb-4 text-emerald-400" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Cloud Settings</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Firebase Sync Portal</p>
            </div>

            <div className="p-8 space-y-6">
              {isCloudEnabled ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <CheckCircle2 className="text-emerald-500" size={24} />
                    <div>
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none">Status Aktif</p>
                      <p className="text-[9px] font-bold text-emerald-700 uppercase mt-1">Sinkronisasi Cloud Berjalan</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed text-center px-4">
                    Data Anda aman dan tersinkronisasi. Anda bisa membuka aplikasi ini di perangkat lain menggunakan akun yang sama.
                  </p>
                  <button 
                    onClick={disconnectCloud}
                    className="w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-rose-500 border-2 border-rose-50 hover:bg-rose-50 transition-all"
                  >
                    Putuskan Koneksi
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Firebase Config (JSON)</label>
                      <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:underline">
                        Firebase Console <ExternalLink size={8} />
                      </a>
                    </div>
                    <textarea 
                      className="w-full h-40 bg-stone-50 border-none rounded-[1.5rem] p-5 text-[10px] font-mono font-bold outline-none focus:ring-2 focus:ring-stone-100 transition-all"
                      placeholder='{ "apiKey": "...", "projectId": "...", ... }'
                      value={configInput}
                      onChange={(e) => setConfigInput(e.target.value)}
                    />
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl flex items-start gap-3 border border-stone-100">
                    <Info size={14} className="text-stone-300 shrink-0 mt-0.5" />
                    <p className="text-[8px] font-bold text-stone-500 uppercase leading-relaxed tracking-wider">
                      Salin objek konfigurasi web dari Project Settings di Firebase Console Anda lalu tempel di atas.
                    </p>
                  </div>
                  <button 
                    onClick={saveCloudConfig}
                    className="w-full bg-stone-900 text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Aktifkan Sync
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}