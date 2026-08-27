import React from 'react';
import { FluentOutlineIcon } from './FluentOutlineIcon';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, isDarkMode = true }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay" role="dialog" aria-modal="true" aria-label="Panduan dan shortcut" onClick={onClose}>
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl modal-card relative max-h-[90vh] overflow-y-auto no-scrollbar ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header with Fluent Sparkle & Dismiss */}
        <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <FluentOutlineIcon name="sparkle" size={24} color="#8338ec" />
            <h3 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Panduan & Shortcut
            </h3>
          </div>

          <button type="button" aria-label="Tutup panduan" onClick={onClose} className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
            <FluentOutlineIcon name="dismiss" size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Gunakan tombol cepat untuk mencatat tanpa banyak klik.</p>

          <div className="space-y-2">
            {/* N key */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <kbd className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm ${
                  isDarkMode ? 'bg-[#1a1a28] border-[#2f2f44] text-[#8338ec]' : 'bg-white border-zinc-300 text-indigo-600'
                }`}>
                  N
                </kbd>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Tambah kebiasaan baru
                </span>
              </div>
              <span className={`text-[10.5px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Global</span>
            </div>

            {/* 1 - 9 keys */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <kbd className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm ${
                  isDarkMode ? 'bg-[#1a1a28] border-[#2f2f44] text-[#8338ec]' : 'bg-white border-zinc-300 text-indigo-600'
                }`}>
                  1 - 9
                </kbd>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Centang habit hari ini
                </span>
              </div>
              <span className={`text-[10.5px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Sesuai No.</span>
            </div>

            {/* Shift + Click */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <kbd className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm ${
                  isDarkMode ? 'bg-[#1a1a28] border-[#2f2f44] text-[#8338ec]' : 'bg-white border-zinc-300 text-indigo-600'
                }`}>
                  Shift + Klik
                </kbd>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Catat jurnal / target angka
                </span>
              </div>
              <span className={`text-[10.5px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Di Heatmap</span>
            </div>
          </div>

          <div className="pt-2">
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-2 cursor-pointer transition-all">Mengerti</button>
          </div>
        </div>
      </div>
    </div>
  );
};
