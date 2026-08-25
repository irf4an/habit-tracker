import React, { useState } from 'react';
import { Sparkles, Calendar, Keyboard, ArrowRight, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCelebrationSound } from '../sound';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartHabit: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartHabit,
}) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      playCelebrationSound();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
      onStartHabit();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#13131b] border border-[#262638] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Top Progress Dots & Close */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-6 bg-indigo-500' : 'w-2 bg-[#262636]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Concept & Heatmap */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Visual Daily Momentum
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                Setiap hari direpresentasikan dalam kotak heatmap 52-minggu seperti GitHub. Semakin konsisten kamu menyelesaikan rutinitas, semakin berwarna grid-mu!
              </p>
            </div>

            {/* Visual demo preview */}
            <div className="p-3 bg-[#0c0c12] rounded-xl border border-[#20202e] flex items-center gap-1.5 justify-center">
              {['#3b82f6', '#3b82f6', '#1d1d29', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6'].map(
                (c, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-[3px] shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* Step 2: Shortcuts & Pro Tips */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Lightning Fast Shortcuts
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                Tidak perlu banyak klik! Cukup gunakan keyboard untuk mencatat rutinitas dengan instan:
              </p>
            </div>

            <div className="space-y-2 bg-[#0c0c12] p-3.5 rounded-xl border border-[#20202e] text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Tekan <kbd className="px-1.5 py-0.5 bg-[#20202e] text-white rounded">N</kbd></span>
                <span className="text-zinc-500">Tambah habit baru</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Tekan <kbd className="px-1.5 py-0.5 bg-[#20202e] text-white rounded">1 - 9</kbd></span>
                <span className="text-zinc-500">Centang habit hari ini</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span><kbd className="px-1.5 py-0.5 bg-[#20202e] text-white rounded">Shift + Klik</kbd></span>
                <span className="text-zinc-500">Catat jurnal / angka</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Call to Action */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Siap Membangun Disiplin?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                Data tersimpan aman di browser-mu (offline-ready & bisa diexport kapan saja). Mulai dengan 1 habit kecil sekarang!
              </p>
            </div>

            <div className="p-3 bg-[#0c0c12] rounded-xl border border-[#20202e] text-center text-xs text-emerald-400 font-mono font-medium">
              💡 "Small daily improvements over time lead to stunning results."
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#202030] mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            Lewati
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            {step === 3 ? (
              <>
                <Check className="w-4 h-4" />
                Mulai Habit Pertama
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
