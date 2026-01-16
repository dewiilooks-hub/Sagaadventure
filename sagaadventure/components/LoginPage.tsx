
import React, { useState } from 'react';
import { User, ChevronLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth } from '../services/firebase';
import BrandLogo from './BrandLogo';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const credentialsMap: Record<string, { user: string; pass: string; label: string }> = {
    rental: { user: 'rental', pass: 'sagarental2026', label: 'RENTAL' },
    trip: { user: 'trip', pass: 'sagatrip2026', label: 'TRIP' },
    merch: { user: 'merchandise', pass: 'sagamerchandise2026', label: 'MERCH' },
    ticket: { user: 'ticket', pass: 'sagaticket2026', label: 'TICKET' },
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
            setError(`Kredensial salah untuk akses ${currentModule.label}`);
          }
        } else {
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

    try {
      if (auth) {
        // v8 signInWithEmailAndPassword is a method on the auth object
        await auth.signInWithEmailAndPassword(username, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      setError('Gagal Login: Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-in fade-in duration-500 relative min-h-[80vh] flex flex-col justify-center overflow-hidden">
      {/* Small Minimalist Watermark - Reduced and Font Regular */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none text-center w-full">
        <span className="text-[8px] font-normal tracking-[0.8em] uppercase whitespace-nowrap">SAGA ADVENTURE</span>
      </div>

      <button 
        onClick={onBack}
        className="absolute top-0 left-6 flex items-center gap-2 text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-stone-50 overflow-hidden relative z-10">
        <div className="bg-stone-900 p-10 text-center relative">
          <div className="flex justify-center mb-6">
             <BrandLogo size={12} color="white" />
          </div>
          <div className="h-px w-6 bg-white/10 mx-auto mb-4"></div>
          <h2 className="text-[9px] font-bold text-white tracking-[0.3em] uppercase opacity-40">
            {currentModule ? `${currentModule.label} Access` : 'Security Portal'}
          </h2>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em] ml-2">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                type="text"
                required
                className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100 transition-all"
                placeholder="ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em] ml-2">Security Key</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-100 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-900 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-[9px] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Verify Access"
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-10 text-center opacity-10">
        <p className="text-[7px] font-bold tracking-[0.4em] uppercase">Authorized Entry Only</p>
      </div>
    </div>
  );
};

export default LoginPage;
