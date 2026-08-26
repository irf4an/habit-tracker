import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Keyboard, ArrowRight, Check, X, Timer, Snowflake, Flame } from 'lucide-react';
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
  const [demoFrozen, setDemoFrozen] = useState(false);

  // Allow interactive keyboard test on step 2
  useEffect(() => {
    if (!isOpen || step !== 2) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1') {
        setDemoChecked((prev) => {
          const next = !prev;
          if (next) {
            playCheckSound();
            confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
          } else {
            playUncheckSound();
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      playCelebrationSound();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
      onStartHabit();
    }
  };

  const toggleDemoCheck = () => {
    setDemoChecked((prev) => {
      const next = !prev;
      if (next) {
        playCheckSound();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
      } else {
        playUncheckSound();
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden ${
          isDarkMode
            ? 'bg-[#12121a] border-[#8338ec]/35 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Top Progress Dots & Close */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-6 bg-[#8338ec]' : isDarkMode ? 'w-2 bg-[#262636]' : 'w-2 bg-zinc-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Konsep & Visual Heatmap */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#8338ec]/15 border border-[#8338ec]/30 flex items-center justify-center text-2xl text-[#8338ec]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                1. Visualisasi Heatmap Harian
              </h3>
              <p className={`text-xs leading-relaxed mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Setiap kebiasaan dipantau melalui matriks kotak harian (seperti GitHub). Setiap kali kamu menyelesaikan rutinitas, kotak akan menyala dengan warna pilihanmu!
              </p>
            </div>

            {/* Visual demo preview */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-center gap-1.5 ${
              isDarkMode ? 'bg-[#0c0c12] border-[#20202e]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              {['#3b82f6', '#3b82f6', '#3b82f6', isDarkMode ? '#1e1e28' : '#e4e4e7', '#3b82f6', '#3b82f6', '#3b82f6'].map(
                (c, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-[3px] shadow-sm transition-transform hover:scale-125"
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Coba Langsung Shortcut Keyboard (Interactive Test) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-500">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                2. Coba Shortcut Instan
              </h3>
              <p className={`text-xs leading-relaxed mt-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Kamu bisa mencatat kebiasaan dengan cepat memakai tombol angka di keyboard. <strong>Coba tekan tombol '1' di keyboardmu sekarang:</strong>
              </p>
            </div>

            {/* Interactive Demo Habit Card */}
            <div
              onClick={toggleDemoCheck}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                demoChecked
                  ? isDarkMode ? 'bg-indigo-950/25 border-[#8338ec]' : 'bg-indigo-50/50 border-indigo-300'
                  : isDarkMode ? 'bg-[#0c0c12] border-[#20202e]' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    demoChecked ? 'bg-[#3b82f6] text-white shadow-md' : 'bg-zinc-700/30 text-zinc-500 border border-dashed border-zinc-500'
                  }`}
                >
                  {demoChecked ? <Check className="w-5 h-5 stroke-[2.8]" /> : <span className="text-xs font-mono">1</span>}
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">💪</span>
                    <span className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Latihan Gym</span>
                  </div>
                  <div className={`text-[10.5px] font-mono mt-0.5 ${demoChecked ? 'text-[#3b82f6] font-bold' : isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {demoChecked ? '🔥 4h streak • Selesai hari ini!' : 'Tekan [1] untuk centang'}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-1 bg-white/10 rounded-lg text-xs">
                {demoChecked ? '✓ Berhasil' : 'Coba Tekan'}
              </span>
            </div>

            <div className={`text-[11px] font-mono space-y-1 p-2.5 rounded-xl border ${
              isDarkMode ? 'bg-[#0a0a10] border-[#1d1d28] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              <div>• Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-bold">N</kbd> : Tambah habit baru kapan saja</div>
              <div>• Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-bold">1 - 9</kbd> : Centang habit hari ini</div>
            </div>
          </div>
        )}

        {/* STEP 3: Fitur Unggulan (Pomodoro & Freeze) */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl text-cyan-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                3. Pomodoro Focus &amp; Rest Day
              </h3>
              <p className={`text-xs leading-relaxed mt-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Fitur pintar untuk membantumu tetap konsisten tanpa merasa terbebani:
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Pomodoro */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode ? 'bg-[#0c0c12] border-[#1f1f2c]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <Timer className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Pomodoro Focus Timer
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Klik ikon jam di kartu habit untuk sesi fokus (15-60 menit). Saat timer selesai, habit otomatis tercentang!
                  </p>
                </div>
              </div>

              {/* Streak Freeze */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode ? 'bg-[#0c0c12] border-[#1f1f2c]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <Snowflake className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Streak Freeze (Rest Day)
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Sedang sakit atau libur? Klik ikon salju ❄️ agar rantai streak kamu terlindungi dan tidak reset ke 0.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Siap Memulai */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🚀
            </div>
            <div>
              <h3 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Siap Membangun Disiplin?
              </h3>
              <p className={`text-xs leading-relaxed mt-2 max-w-xs mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Data tersimpan otomatis &amp; bisa disinkronkan ke cloud. Mulai dengan membuat 1 kebiasaan kecil hari ini!
              </p>
            </div>

            <div className={`p-3 rounded-2xl border text-xs font-medium ${
              isDarkMode ? 'bg-[#0c0c12] border-[#20202e] text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              💡 "Langkah kecil setiap hari menghasilkan lompatan besar di masa depan."
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className={`flex items-center justify-between pt-4 border-t mt-5 ${
          isDarkMode ? 'border-[#202030]' : 'border-zinc-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`text-xs font-mono cursor-pointer ${
              isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Lewati
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#8338ec]/25"
          >
            {step === 4 ? (
              <>
                <Check className="w-4 h-4" />
                Mulai Sekarang
              </>
            ) : (
              <>
                Lanjut
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
