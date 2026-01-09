
import React, { useState } from 'react';
import { Lock, User, ChevronLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { ViewMode } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  isDemoMode: boolean;
  targetView: ViewMode | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack, isDemoMode, targetView }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Define credentials mapping
  const credentialsMap: Record<string, { user: string; pass: string; label: string }> = {
    rental: { user: 'rental', pass: 'sagarental2026', label: 'RENTAL ALAT' },
    trip: { user: 'trip', pass: 'sagatrip2026', label: 'OPEN TRIP' },
    merch: { user: 'merchandise', pass: 'sagamerchandise2026', label: 'MERCHANDISE' },
  };

  const currentModule = targetView ? credentialsMap[targetView] : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isDemoMode) {
      setTimeout(() => {
        if (currentModule) {
          if (username === currentModule.user && password === currentModule.pass) {
            onLoginSuccess();
          } else {
            setError(`Username atau Password salah untuk akses ${currentModule.label}`);
          }
        } else {
          // Fallback if targetView is missing
          if (username === 'admin' && password === 'saga2026') {
            onLoginSuccess();
          } else {
            setError('Kredensial tidak valid.');
          }
        }
        setLoading(false);
      }, 800);
      return;
    }

    // Real Firebase Auth
    try {
      await signInWithEmailAndPassword(auth!, username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError('Gagal Login: Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-in fade-in zoom-in duration-300">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-stone-500 hover:text-emerald-900 font-medium transition-colors"
      >
        <ChevronLeft size={20} /> Kembali ke Home
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="bg-emerald-900 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl shadow-lg mb-4 transform rotate-6 border-2 border-orange-400">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {currentModule ? `${currentModule.label} ACCESS` : 'RESTRICTED ACCESS'}
          </h2>
          <p className="text-emerald-200 text-xs uppercase tracking-widest mt-1">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 animate-pulse">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Username Access</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text"
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                placeholder="Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Security Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="password"
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-emerald-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={20} /> LOGIN TO {currentModule?.user.toUpperCase() || 'SYSTEM'}
              </>
            )}
          </button>
        </form>

        <div className="p-6 bg-stone-50 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 font-medium italic">SAGA SECURITY PROTOCOL V3.0</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
