import React, { useEffect, useState } from 'react';
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
  const [showLogin, setShowLogin] = useState(false);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [loginKey, setLoginKey] = useState(0);

  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // Navigation rules:
  // - Home is always accessible.
  // - Rental/Trip/Merch require login when cloud mode is enabled.
  const handleNavigate = (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      return;
    }

    if (isCloudEnabled && !user) {
      setPendingView(view);
      setShowLogin(true);
      setLoginKey((k) => k + 1); // force fresh login form (clears old error state)
      return;
    }

    setCurrentView(view);
  };

  const handleLogout = async () => {
    try {
      await auth?.signOut();
    } finally {
      // After logout, ALWAYS return to dashboard (home), not the login screen.
      setUser(null);
      setCurrentView('home');
      setShowLogin(false);
      setPendingView(null);
      setLoginKey((k) => k + 1);
    }
  };

  const renderView = () => {
    if (showLogin) {
      return (
        <LoginPage
          key={loginKey}
          isDemoMode={!isCloudEnabled}
          targetView={pendingView}
          onLoginSuccess={() => {
            // onAuthStateChanged will also update, but we set it immediately for snappy UX.
            setUser(auth?.currentUser ?? null);
            setShowLogin(false);
            setCurrentView(pendingView ?? 'home');
            setPendingView(null);
          }}
          onBack={() => {
            // Back from login returns to home (dashboard)
            setShowLogin(false);
            setPendingView(null);
            setCurrentView('home');
            setLoginKey((k) => k + 1);
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
