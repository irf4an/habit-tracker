import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Cloud, Lock, Mail, CheckCircle2, AlertCircle, LogOut, Key, ArrowRight, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onAuthSuccess: (user: { id: string; email: string }) => void;
  onSignOut: () => void;
  isDarkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onAuthSuccess,
  onSignOut,
  isDarkMode = true,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase URL & Anon Key belum diatur di file .env.local (Mode Local Storage aktif).',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setMessage({
            type: 'success',
            text: 'Akun berhasil dibuat! Silakan periksa email untuk verifikasi (atau langsung login jika auto-confirm aktif).',
          });
          if (data.session && data.user) {
            onAuthSuccess({ id: data.user.id, email: data.user.email || email });
            onClose();
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email || email });
          onClose();
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in" role="dialog" aria-modal="true" aria-label={userEmail ? 'Status sinkronisasi cloud' : isSignUp ? 'Daftar akun cloud' : 'Masuk akun cloud'} onClick={onClose}>
      <div role="document" onClick={(e) => e.stopPropagation()} className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-3 mb-5 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#8338ec]" />
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {userEmail ? 'Status Sinkronisasi Cloud' : isSignUp ? 'Daftar Akun Cloud' : 'Masuk Akun Cloud'}
            </h2>
          </div>

          <button type="button" aria-label="Tutup dialog" onClick={onClose} className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        {userEmail ? (
          <div className="space-y-4 animate-in fade-in">
            <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2.5" aria-hidden><CheckCircle2 className="w-6 h-6" /></div>
              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Tersambung ke Cloud</h4>
              <p className={`text-xs mt-1 font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{userEmail}</p>
              <p className={`text-[11px] mt-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Setiap habit yang kamu centang otomatis disinkronkan.</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              Keluar Akun (Logout)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Sinkronkan rutinitas habit dan streak kamu di semua perangkat (HP, Tablet, Laptop) secara real-time.
            </p>

            {message && (
              <div role="alert" className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />}
                <span>{message.text}</span>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className={`block text-xs font-mono uppercase mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Email</label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} aria-hidden />
                <input id="auth-email" type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0a0a0f] border-[#252538] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`} />
              </div>
            </div>
            <div>
              <label htmlFor="auth-password" className={`block text-xs font-mono uppercase mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Password</label>
              <div className="relative">
                <Key className={`w-4 h-4 absolute left-3 top-2.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} aria-hidden />
                <input id="auth-password" type="password" required minLength={6} placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0a0a0f] border-[#252538] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8338ec] hover:bg-[#722ed1] active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#8338ec]/25 cursor-pointer"
            >
              {loading ? 'Memproses...' : isSignUp ? 'Daftar Sekarang' : 'Masuk Akun'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className={`text-xs hover:underline cursor-pointer ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                {isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar gratis'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
