import React, { useRef, useState } from 'react';
import { Habit } from '../types';
import { calculateStreak, getYearDays, getTodayString } from '../utils';
import { X, Download, Share2, Copy } from 'lucide-react';
import html2canvas from 'html2canvas-pro';

interface ShareCardModalProps {
  habit: Habit;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ habit, onClose, isDarkMode = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const streakStats = calculateStreak(habit.history, habit.frozenDates || [], habit);
  const todayStr = getTodayString();
  const isTodayDone = (habit.history[todayStr] || 0) >= (habit.targetValue || 1);

  // Mini 26-week heatmap for the card
  const { weeks } = getYearDays(26);

  const exportAsPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: isDarkMode ? '#0b0b0e' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `habit-${habit.name.replace(/\s+/g, '-').toLowerCase()}-streak.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Gagal membuat gambar PNG. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const shareNative = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: isDarkMode ? '#0b0b0e' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Blob failed');

      const file = new File([blob], 'habit-streak.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Rekor ${habit.name} Saya`,
          text: `Sudah ${streakStats.currentStreak} hari konsisten di ${habit.name}! 🔥`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'habit-streak.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: isDarkMode ? '#0b0b0e' : '#ffffff',
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Gambar berhasil disalin ke clipboard!');
        } catch {
          alert('Fitur clipboard tidak didukung di browser ini.');
        }
      });
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay" role="dialog" aria-modal="true" aria-label={`Bagikan streak ${habit.name}`} onClick={onClose}>
      <div className="max-w-md w-full space-y-4" modal-card role="document" onClick={(e) => e.stopPropagation()}>
        {/* THE SHAREABLE CARD */}
        <div
          ref={cardRef}
          className={`rounded-3xl overflow-hidden border transition-all ${
            isDarkMode
              ? 'border-[#8338ec]/35 text-white'
              : 'border-zinc-200 text-zinc-900 shadow-2xl'
          }`}
          style={{
            background: isDarkMode
              ? `linear-gradient(145deg, ${habit.color}20 0%, #0e0e16 50%)`
              : '#ffffff',
            boxShadow: isDarkMode ? `0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.10)`,
          }}
        >
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner select-none"
                  style={{ backgroundColor: `${habit.color}25` }}
                >
                  {habit.emoji}
                </div>
                <div>
                  <h3 className={`font-extrabold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    {habit.name}
                  </h3>
                  <p className="text-[10px] font-mono text-[#8338ec] font-semibold uppercase tracking-widest mt-0.5">
                    Minimal Habit Tracker
                  </p>
                </div>
              </div>

              {isTodayDone && (
                <div
                  className="px-3 py-1 rounded-full text-[10.5px] font-mono font-bold"
                  style={{ backgroundColor: `${habit.color}25`, color: habit.color }}
                >
                  HARI INI ✓
                </div>
              )}
            </div>

            {/* Big Streak Number & Statistics */}
            <div className="flex items-end gap-4">
              <div>
                <div className={`text-6xl font-extrabold font-mono leading-none tracking-tighter ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  {streakStats.currentStreak}
                </div>
                <div className={`text-xs font-mono mt-1 uppercase tracking-wider ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Hari Streak
                </div>
              </div>

              <div className="flex-1 space-y-2 pb-1 font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Rekor Terbaik</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{streakStats.bestStreak} hari</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Konsistensi 30H</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{streakStats.completionRate}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Total Selesai</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{streakStats.totalCompleted}x</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1a1a26]' : 'bg-zinc-200'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${streakStats.completionRate}%`,
                  backgroundColor: habit.color,
                  boxShadow: `0 0 10px ${habit.color}88`,
                }}
              />
            </div>

            {/* Mini Heatmap Preview */}
            <div className="flex gap-[2.5px] pt-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2.5px]">
                  {week.map((day) => {
                    const v = habit.history[day.dateStr] || 0;
                    const target = habit.targetValue || 1;
                    const done = habit.type === 'numeric' ? v >= target : v === 1;
                    const isFrozen = (habit.frozenDates || []).includes(day.dateStr);

                    if (day.isFuture) return <div key={day.dateStr} className="w-2 h-2" />;
                    return (
                      <div
                        key={day.dateStr}
                        className="w-2 h-2 rounded-[1.5px]"
                        style={{
                          backgroundColor: done
                            ? habit.color
                            : isFrozen
                            ? '#0284c7'
                            : isDarkMode
                            ? '#1d1d29'
                            : '#e4e4e7',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Card Footer */}
            <div className={`flex items-center justify-between text-[9.5px] font-mono pt-2.5 border-t ${
              isDarkMode ? 'text-zinc-500 border-[#1e1e2c]' : 'text-zinc-400 border-zinc-200'
            }`}>
              <span>Tanggal: {todayStr}</span>
              <span>Disiplin setiap hari 🔥</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-center flex-wrap">
          <button type="button" aria-label="Download kartu streak sebagai PNG" onClick={exportAsPng} disabled={isExporting} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
            <Download className="w-4 h-4" aria-hidden />
            {isExporting ? 'Memproses...' : 'Download PNG'}
          </button>
          <button type="button" aria-label="Bagikan kartu streak" onClick={shareNative} disabled={isExporting} className="flex items-center gap-2 px-4 py-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-[#8338ec]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec]">
            <Share2 className="w-4 h-4" aria-hidden /> Bagikan
          </button>
          <button type="button" aria-label="Salin gambar ke clipboard" onClick={copyToClipboard} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1a1a26] hover:bg-[#242434] border-[#2e2e40] text-zinc-300 hover:text-white' : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 shadow-sm'}`}>
            <Copy className="w-4 h-4" aria-hidden /> Salin Gambar
          </button>
          <button type="button" aria-label="Tutup dialog bagikan" onClick={onClose} className={`p-2.5 rounded-xl transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1a1a26] hover:bg-[#242434] border-[#2e2e40] text-zinc-400 hover:text-white' : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-500 hover:text-zinc-900 shadow-sm'}`}>
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
