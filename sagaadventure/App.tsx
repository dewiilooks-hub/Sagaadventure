import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { Cloud, LogOut } from 'lucide-react';

import { auth, isCloudEnabled } from './services/firebase';
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

  // Wait for Firebase Auth session restore
  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const requireLoginFor = (view: ViewMode) => {
    setPendingView(view);
    setShowLogin(true);
  };

  const handleNavigate = async (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      setShowLogin(false);
      setPendingView(null);
      return;
    }

    // If a module is already active, block access to other modules.
    if (activeModule && activeModule !== view) {
      alert(`Akses ditolak. Kamu sedang login untuk modul ${activeModule.toUpperCase()}.\nLogout dulu untuk akses modul ${view.toUpperCase()}.`);
      return;
    }

    // Owner is sensitive and always requires login
    if (view === 'owner') {
      // Owner does not set activeModule
      requireLoginFor('owner');
      return;
    }

    // If not logged in yet, require login for requested module.
    if (!user) {
      requireLoginFor(view);
      return;
    }

    // Logged in and either module not active or matches
    if (!activeModule) setActiveModule(view);
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    if (!pendingView) {
      setShowLogin(false);
      return;
    }

    // Lock module scope (except owner)
    if (pendingView !== 'owner') {
      setActiveModule(pendingView);
    }

    setCurrentView(pendingView);
    setShowLogin(false);
    setPendingView(null);
  };

  const handleLogout = async () => {
    if (!window.confirm('Logout sekarang?')) return;

    try {
      if (auth) await auth.signOut();
    } catch (e) {
      // ignore
    }

    // Reset app state
    setUser(null);
    setActiveModule(null);
    setCurrentView('home');
    setShowLogin(false);
    setPendingView(null);

    // Force LoginPage remount so old errors never stick
    setLoginKey((k) => k + 1);
  };

  const renderView = () => {
    if (showLogin) {
      return (
        <LoginPage
          key={loginKey}
          isDemoMode={!isCloudEnabled}
          targetView={pendingView}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => {
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
      case 'owner':
        return <OwnerPage onBack={() => setCurrentView('home')} />;
      default:
        return <HomePage onNavigate={handleNavigate} activeModule={activeModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-50 px-6 py-5 shadow-sm sticky top-0 z-50 flex items-center justify-between print:hidden shrink-0">
        <div className="flex flex-col">
          <BrandLogo size={10} color="#1c1917" />
          <div className="flex items-center gap-1 mt-1">
            <span className="flex items-center gap-1 text-[7px] font-black text-emerald-600 uppercase tracking-widest">
              <Cloud size={8} /> Cloud Synced
            </span>
          </div>
        </div>

        {/* Logout only visible when a module is active */}
        {activeModule && currentView !== 'owner' && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all hover:bg-stone-800 active:scale-95 shadow-md"
          >
            <LogOut size={10} /> Logout
          </button>
        )}

        {currentView === 'owner' && (
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-md"
          >
            Exit Owner
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {renderView()}
      </div>
    </div>
  );
}
