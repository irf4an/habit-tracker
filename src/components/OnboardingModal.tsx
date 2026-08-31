import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, Timer, Snowflake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCheckSound, playUncheckSound, playCelebrationSound } from '../sound';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartHabit: () => void;
  isDarkMode?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartHabit,
  isDarkMode = true,
}) => {
  const [step, setStep] = useState(1);
  const [demoChecked, setDemoChecked] = useState(false);

  useEffect(() => {
    if (!isOpen || step !== 2) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === '1') {
        setDemoChecked((prev) => {
          const next = !prev;
          if (next) { playCheckSound(); confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } }); }
          else playUncheckSound();
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, step]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else { playCelebrationSound(); confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); onClose(); onStartHabit(); }
  };

  const toggleDemoCheck = () => {
    setDemoChecked((prev) => {
      const next = !prev;
      if (next) { playCheckSound(); confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } }); }
      else playUncheckSound();
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay" role="dialog" aria-modal="true" aria-label="Panduan awal habit tracker" onClick={onClose}>
      <div role="document" onClick={(e) => e.stopPropagation()} className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl modal-card relative overflow-hidden ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`} style={{ boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.15)` }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1.5" aria-label={`Langkah ${step} dari 4`}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-6 bg-[#8338ec]' : step > i ? 'w-2 bg-[#8338ec]/50' : isDarkMode ? 'w-2 bg-[#262636]' : 'w-2 bg-zinc-200'}`} />
            ))}
          </div>
          <button onClick={onClose} aria-label="Tutup panduan" className={`p-1.5 rounded-lg border ${isDarkMode ? 'text-zinc-500 hover:text-zinc-200 border-transparent hover:border-[#2e2e40] hover:bg-[#1a1a28]' : 'text-zinc-400 hover:text-zinc-700 border-transparent hover:border-zinc-200 hover:bg-zinc-100'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Cara kerjanya</h3>
              <p className={`text-sm leading-relaxed mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Setiap kebiasaan punya kalender kotak kecil. Selesai hari ini → kotaknya menyala. Kosong? Kotak tetap abu-abu. Lama-lama polanya kelihatan.</p>
            </div>
            <div className={`p-3.5 rounded-2xl border flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-[#0c0c12] border-[#20202e]' : 'bg-zinc-50 border-zinc-200'}`} role="img" aria-label="Contoh heatmap 7 hari: 6 selesai, 1 kosong">
              {['#8338ec', '#8338ec', '#8338ec', isDarkMode ? '#1e1e28' : '#e4e4e7', '#8338ec', '#8338ec', '#8338ec'].map((c, idx) => (
                <div key={idx} className="w-4 h-4 rounded-[3px] shadow-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Warna kotaknya ikut warna kebiasaan yang kamu pilih.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Coba langsung — tekan 1</h3>
              <p className={`text-sm leading-relaxed mt-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Di HP, cukup ketuk kotaknya. Di laptop, pakai keyboard lebih cepat. Coba sekarang:</p>
            </div>
            <div onClick={toggleDemoCheck} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleDemoCheck()} className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${demoChecked ? (isDarkMode ? 'bg-[#8338ec]/15 border-[#8338ec]' : 'bg-violet-50 border-violet-300') : (isDarkMode ? 'bg-[#0c0c12] border-[#20202e] hover:border-[#2e2e40]' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300')}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-mono ${demoChecked ? 'bg-[#8338ec] text-white shadow-md' : isDarkMode ? 'bg-zinc-800 text-zinc-400 border border-dashed border-zinc-600' : 'bg-zinc-200 text-zinc-600 border border-dashed border-zinc-400'}`}>{demoChecked ? <Check className="w-5 h-5" /> : '1'}</div>
                <div>
                  <div className="flex items-center gap-1.5"><span className="text-xl">💪</span><span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Olahraga pagi</span></div>
                  <div className={`text-xs mt-0.5 ${demoChecked ? 'text-emerald-500 font-semibold' : isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{demoChecked ? 'Selesai hari ini — streak aman ✓' : 'Belum selesai hari ini'}</div>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${demoChecked ? 'bg-emerald-500 text-white border-emerald-600' : isDarkMode ? 'bg-[#1a1a28] text-zinc-400 border-[#2e2e40]' : 'bg-white text-zinc-600 border-zinc-200'}`}>{demoChecked ? 'Selesai' : 'Coba ketuk'}</span>
            </div>
            <div className={`text-xs space-y-1.5 p-3 rounded-xl border ${isDarkMode ? 'bg-[#0a0a10] border-[#1d1d28] text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
              <div className="flex items-center justify-between"><span>Tambah kebiasaan baru</span><kbd className={`px-1.5 py-0.5 rounded text-xs font-bold ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'}`}>N</kbd></div>
              <div className="flex items-center justify-between"><span>Tandai selesai hari ini</span><kbd className={`px-1.5 py-0.5 rounded text-xs font-bold ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'}`}>1 – 9</kbd></div>
              <div className="flex items-center justify-between"><span>Isi target/jurnal harian</span><span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Ketuk kotaknya</span></div>
            </div>
            <p className={`text-[11px] text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Tips: di laptop, urutan habit 1–9 sesuai urutan di beranda.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Jaga ritme, bukan sempurna</h3>
              <p className={`text-sm leading-relaxed mt-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Dua alat bantu biar nggak gampang bolong:</p>
            </div>
            <div className="space-y-2.5">
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-[#0c0c12] border-[#1f1f2c]' : 'bg-zinc-50 border-zinc-200'}`}>
                <Timer className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div><h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Timer fokus</h4><p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Mulai 15–60 menit dari ikon jam di kartu habit. Selesai → otomatis tercatat. Cocok kalau susah mulai.</p></div>
              </div>
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-[#0c0c12] border-[#1f1f2c]' : 'bg-zinc-50 border-zinc-200'}`}>
                <Snowflake className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div><h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Bekukan streak — maks 2×/minggu</h4><p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Sakit/libur? Ketuk ❄️ di kartu. Hari itu jadi istirahat, streak tidak putus. Kuota bergulir 2 kali per 7 hari — tooltip tombol tunjukkan sisa.</p></div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in text-center py-2">
            <div>
              <h3 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Mulai dari satu kebiasaan kecil</h3>
              <p className={`text-sm leading-relaxed mt-2 max-w-sm mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Data tersimpan di perangkatmu. Jika masuk akun, otomatis tersinkronkan ke perangkat lain.</p>
            </div>
            <div className={`p-3 rounded-2xl border text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-[#0c0c12] border-[#20202e] text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>Saran: pilih target yang paling mudah dijaga terlebih dahulu.</div>
          </div>
        )}

        <div className={`flex items-center justify-between pt-4 border-t mt-5 ${isDarkMode ? 'border-[#202030]' : 'border-zinc-200'}`}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className={`text-sm cursor-pointer flex items-center gap-1 ${isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}>← Back</button>
          ) : (
            <button type="button" onClick={onClose} className={`text-sm cursor-pointer ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}>Lewati</button>
          )}
          <button type="button" onClick={handleNext} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#8338ec]/25">
            {step === 4 ? <><Check className="w-4 h-4" /> Buat kebiasaan pertama</> : <>Lanjut <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
