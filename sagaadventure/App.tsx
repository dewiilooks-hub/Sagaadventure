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

/* ===== MODULE EMAIL LOCK ===== */
const MODULE_EMAIL: Record<ViewMode, string[]> = {
  home: [],
  rental: ['sagaadventureowner@gmail.com'],
  owner: ['sagaadventureowner@gmail.com'],
  trip: ['sagaadventure.id@gmail.com'],
  merch: ['sagaadventuregoods@gmail.com'],
};

const normalizeEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase();

const isAllowed = (view: ViewMode, email?: string | null) =>
  MODULE_EMAIL[view]?.includes(normalizeEmail(email));

export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModule, setActiveModule] = useState<ViewMode | null>(null);
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginKey, setLoginKey] = useState(0);

  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const forceLoginFor = async (view: ViewMode) => {
    if (auth?.currentUser) await auth.signOut();
    setUser(null);
    setActiveModule(null);
    setPendingView(view);
    setShowLogin(true);
    setLoginKey((k) => k + 1);
  };

  const handleNavigate = async (view: ViewMode) => {
    if (view === 'home') {
      setCurrentView('home');
      setShowLogin(false);
      setPendingView(null);
      return;
    }

    // Belum login
    if (!user) {
      forceLoginFor(view);
      return;
    }

    // Email tidak sesuai modul
    if (!isAllowed(view, user.email)) {
      alert(`Akun ini tidak punya akses ke ${view.toUpperCase()}`);
      forceLoginFor(view);
      return;
    }

    // Lock module
    setActiveModule(view);
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    if (!pendingView || !user) return;

    if (!isAllowed(pendingView, user.email)) {
      alert(`Akun ini hanya untuk modul lain`);
      forceLoginFor(pendingView);
      return;
    }

    setActiveModule(pendingView);
    setCurrentView(pendingView);
    setPendingView(null);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    if (!window.confirm('Logout sekarang?')) return;
    if (auth) await auth.signOut();

    setUser(null);
    setActiveModule(null);
    setCurrentView('home');
    setShowLogin(false);
    setPendingView(null);
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
      <div className="bg-white border-b px-6 py-5 shadow-sm sticky top-0 z-50 flex justify-between">
        <BrandLogo size={10} color="#1c1917" />

        {activeModule && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-stone-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase"
          >
            <LogOut size={10} /> Logout
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">{renderView()}</div>
    </div>
  );
}
