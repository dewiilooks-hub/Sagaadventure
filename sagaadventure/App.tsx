import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, isCloudEnabled } from './services/firebase';
import { 
  LogOut
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

  useEffect(() => {
    if (!auth) return;
    
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
      // Staff/Admin MUST login again after logout
      auth?.signOut().catch(() => {});
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
        {renderView()}
      </div>
    </div>
  );
}