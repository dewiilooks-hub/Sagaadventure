
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut, User } from "firebase/auth";
import { auth, db } from './services/firebase';
import { Tent, LogOut } from 'lucide-react';
import HomePage from './components/HomePage';
import RentalPage from './components/RentalPage';
import OpenTripPage from './components/OpenTripPage';
import MerchPage from './components/MerchPage';
import LoginPage from './components/LoginPage';
import { ViewMode } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModule, setActiveModule] = useState<ViewMode | null>(null);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Status Demo
  const isDemoMode = !db;

  useEffect(() => {
    if (!auth) {
      console.log("Running in offline/guest mode.");
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth!, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth!);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth!, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleNavigate = (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      setShowLogin(false);
      return;
    }

    // Proteksi: Jika modul lain sedang aktif, berikan peringatan
    if (activeModule && activeModule !== view) {
      alert(`Akses Terkunci: Anda sedang masuk di modul ${activeModule.toUpperCase()}. Silakan Logout terlebih dahulu untuk pindah menu.`);
      return;
    }

    // Proteksi: Jika belum login sama sekali, tampilkan halaman login khusus untuk view tersebut
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
    if (window.confirm("Keluar dari sesi ini?")) {
      setActiveModule(null);
      setCurrentView('home');
      setShowLogin(false);
      if (auth) signOut(auth);
    }
  };

  const renderView = () => {
    if (showLogin) {
      return (
        <LoginPage 
          isDemoMode={isDemoMode}
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
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-stone-200">
      {/* Header Global */}
      <div className="bg-emerald-900 text-white p-4 shadow-md sticky top-0 z-50 flex items-center justify-between bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-inner border border-orange-400 transform rotate-3">
            <Tent size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-widest leading-none">SAGA</h1>
            <p className="text-[10px] text-emerald-200 tracking-widest uppercase">Adventure Gear</p>
          </div>
        </div>
        
        {activeModule && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors animate-pulse"
          >
            <LogOut size={14} /> Keluar {activeModule.toUpperCase()}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {renderView()}
      </div>
    </div>
  );
}
