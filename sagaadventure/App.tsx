
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
import OwnerPage from './components/OwnerPage';
import BrandLogo from './components/BrandLogo';
import { ViewMode } from './types';

export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModule, setActiveModule] = useState<ViewMode | null>(null);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginKey, setLoginKey] = useState(0);
  useEffect(() => {
    if (!auth) return;
    
    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await auth.signInWithCustomToken((window as any).__initial_auth_token);
        } else {
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

  const handleNavigate = async (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      setShowLogin(false);
      return;
    }
    
    // Owner view is sensitive, always requires login check
    if (view === 'owner') {
      setPendingView('owner');
      setShowLogin(true);
      return;
    }

    if (activeModule && activeModule !== view) {
      // Require re-login per module (Trip/Rental/Merch) so accounts are not shared across modules.
      // Sign out current session then prompt login for the requested module.
      try { await auth?.signOut(); } catch (e) {}
      setUser(null);
      setActiveModule(null);
      setCurrentView('home');
      setPendingView(view);
      setShowLogin(true);
      setLoginKey((k) => k + 1);
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
    if (!pendingView) return;
    if (pendingView !== 'owner') {
      setActiveModule(pendingView);
      setCurrentView(pendingView);
    } else {
      setCurrentView('owner');
    }
    setShowLogin(false);
    setPendingView(null);
  };

  // legacy placeholder
  const __unused = () => {
    setActiveModule(pendingView);
      }
      setCurrentView(pendingView);
      setShowLogin(false);
      setPendingView(null);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Keluar dari sesi ini?")) return;
    try { await auth?.signOut(); } catch (e) {}
    setUser(null);
    setActiveModule(null);
    setPendingView(null);
    setShowLogin(false);
    setCurrentView('home');
    setLoginKey((k) => k + 1);
  };


  const disconnectCloud = () => {
    if (window.confirm("Putuskan koneksi Cloud? Data akan kembali disimpan secara lokal di perangkat ini saja.")) {
      window.location.reload();
    }
  };

  const renderView = () => {
    if (showLogin) {
      return (
        <LoginPage key={loginKey} 
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
      case 'owner':
        return <OwnerPage onBack={() => setCurrentView('home')} />;
      default:
        return <HomePage onNavigate={handleNavigate} activeModule={activeModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-stone-100 flex flex-col">
      <div className="bg-white border-b border-stone-50 px-6 py-5 shadow-sm sticky top-0 z-50 flex items-center justify-between print:hidden shrink-0">
        <div className="flex flex-col">
          <BrandLogo size={10} color="#1c1917" />
          
        </div>
        
        {activeModule && currentView !== 'owner' && (
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all hover:bg-stone-800 active:scale-95 shadow-md">
            <LogOut size={10} /> Logout
          </button>
        )}
        {currentView === 'owner' && (
          <button onClick={() => setCurrentView('home')} className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-md">
            Exit Owner
          </button>
        )}
      </div>

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
            
          </div>
        )}
        {renderView()}
      </div>className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
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
                  <button onClick={disconnectCloud} className="w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-rose-500 border-2 border-rose-50 hover:bg-rose-50 transition-all">
                    Putuskan Koneksi
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <textarea 
                    className="w-full h-40 bg-stone-50 border-none rounded-[1.5rem] p-5 text-[10px] font-mono font-bold outline-none focus:ring-2 focus:ring-stone-100 transition-all"
                    placeholder='{ "apiKey": "...", "projectId": "...", ... }'
                    value={''}
                    
                  />
                  <button  className="w-full bg-stone-900 text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
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
