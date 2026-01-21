import React, { useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import { Cloud, CloudOff, LogOut } from 'lucide-react';

import { auth, isCloudEnabled } from './services/firebase';
import BrandLogo from './components/BrandLogo';
import HomePage from './components/HomePage';
import RentalPage from './components/RentalPage';
import OpenTripPage from './components/OpenTripPage';
import MerchPage from './components/MerchPage';
import LoginPage from './components/LoginPage';
import { ViewMode } from './types';

export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');

  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const mustLogin = useMemo(() => {
    // If Firebase failed to init, we fall back to demo/local mode (still uses the same login UI).
    if (!isCloudEnabled) return false;
    return !user;
  }, [user]);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
  };

  const handleLogout = async () => {
    try {
      await auth?.signOut();
    } finally {
      setCurrentView('home');
    }
  };

  const renderView = () => {
    // Require Firebase login for all modules (as requested).
    if (mustLogin) {
      return (
        <LoginPage
          isDemoMode={!isCloudEnabled}
          targetView={null}
          onLoginSuccess={() => setUser(auth?.currentUser ?? null)}
          onBack={() => setCurrentView('home')}
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
        return <HomePage onNavigate={handleNavigate} activeModule={null} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 py-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col min-h-[calc(100vh-3rem)]">
          {/* Header */}
          <div className="bg-white border-b border-stone-50 px-6 py-5 shadow-sm sticky top-0 z-50 flex items-center justify-between print:hidden shrink-0">
            <div className="flex flex-col">
              <BrandLogo size={10} color="#1c1917" />
              {isCloudEnabled ? (
                <span className="flex items-center gap-1 mt-1 text-[7px] font-black text-emerald-600 uppercase tracking-widest">
                  <Cloud size={8} /> Cloud Synced
                </span>
              ) : (
                <span className="flex items-center gap-1 mt-1 text-[7px] font-black text-orange-500 uppercase tracking-widest">
                  <CloudOff size={8} /> Offline Mode
                </span>
              )}
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all hover:bg-stone-800 active:scale-95 shadow-md"
              >
                <LogOut size={10} /> Logout
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">{renderView()}</div>
        </div>
      </div>
    </div>
  );
}
