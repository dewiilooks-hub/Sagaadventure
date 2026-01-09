
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut, User } from "firebase/auth";
import { auth, db } from './services/firebase';
import { LogOut } from 'lucide-react';
import HomePage from './components/HomePage';
import RentalPage from './components/RentalPage';
import OpenTripPage from './components/OpenTripPage';
import MerchPage from './components/MerchPage';
import LoginPage from './components/LoginPage';
import BrandLogo from './components/BrandLogo';
import { ViewMode } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModule, setActiveModule] = useState<ViewMode | null>(null);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const isDemoMode = !db;

  useEffect(() => {
    if (!auth) return;
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
    <div className="min-h-screen bg-white font-sans text-stone-800 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-stone-100">
      {/* Header Global Minimalis */}
      <div className="bg-white border-b border-stone-50 px-6 py-4 shadow-sm sticky top-0 z-50 flex items-center justify-between print:hidden">
        <BrandLogo size={10} color="#1c1917" />
        
        {activeModule && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all hover:bg-stone-800"
          >
            <LogOut size={10} /> {activeModule}
          </button>
        )}
      </div>

      <div className="pb-20">
        {renderView()}
      </div>
    </div>
  );
}
