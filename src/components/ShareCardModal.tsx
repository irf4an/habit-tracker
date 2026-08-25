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

  const streakStats = calculateStreak(habit.history);
  const todayStr = getTodayString();
  const isTodayDone = (habit.history[todayStr] || 0) >= (habit.targetValue || 1);

  // Mini 26-week heatmap for the card
  const { weeks } = getYearDays(26);

  const exportAsPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0b0b0e',
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
      alert('Failed to generate image. Try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const shareNative = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0b0b0e',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Blob failed');

      const file = new File([blob], 'habit-streak.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `My ${habit.name} Streak`,
          text: `${streakStats.currentStreak}-day streak on ${habit.name}!`,
          files: [file],
        });
      } else {
        // Fallback to download
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
        backgroundColor: '#0b0b0e',
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Image copied to clipboard!');
        } catch {
          alert('Clipboard not supported in this browser.');
        }
      });
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="max-w-md w-full space-y-4">
        {/* The actual shareable card */}
        <div
          ref={cardRef}
          className="rounded-3xl overflow-hidden border border-[#26263a]"
          style={{
            background: `linear-gradient(145deg, ${habit.color}18 0%, #0e0e16 45%)`,
          }}
        >
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${habit.color}25` }}
                >
                  {habit.emoji}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{habit.name}</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Minimal Habit Tracker
                  </p>
                </div>
              </div>

              {isTodayDone && (
                <div
                  className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
                  style={{ backgroundColor: `${habit.color}30`, color: habit.color }}
                >
                  TODAY ✓
                </div>
              )}
            </div>

            {/* Big Streak Number */}
            <div className="flex items-end gap-4">
              <div>
                <div className="text-6xl font-extrabold text-white font-mono leading-none tracking-tighter">
                  {streakStats.currentStreak}
                </div>
                <div className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">
                  Day Streak
                </div>
              </div>

              <div className="flex-1 space-y-2 pb-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Best Record</span>
                  <span className="text-white font-bold">{streakStats.bestStreak}d</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">30-Day Rate</span>
                  <span className="text-white font-bold">{streakStats.completionRate}%</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Total Logs</span>
                  <span className="text-white font-bold">{streakStats.totalCompleted}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-[#1a1a26] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${streakStats.completionRate}%`,
                  backgroundColor: habit.color,
                  boxShadow: `0 0 12px ${habit.color}88`,
                }}
              />
            </div>

            {/* Mini Heatmap */}
            <div className="flex gap-[2.5px] pt-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2.5px]">
                  {week.map((day) => {
                    const v = habit.history[day.dateStr] || 0;
                    const target = habit.targetValue || 1;
                    const done = habit.type === 'numeric' ? v >= target : v === 1;
                    if (day.isFuture) return <div key={day.dateStr} className="w-2 h-2" />;
                    return (
                      <div
                        key={day.dateStr}
                        className="w-2 h-2 rounded-[1.5px]"
                        style={{
                          backgroundColor: done ? habit.color : '#1d1d29',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 pt-2 border-t border-[#1e1e2c]">
              <span>Generated {todayStr}</span>
              <span>Track your habits daily</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 justify-center flex-wrap">
          <button
            onClick={exportAsPng}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating...' : 'Download PNG'}
          </button>

          <button
            onClick={shareNative}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a26] hover:bg-[#242434] border border-[#2e2e40] text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            <Copy className="w-4 h-4" />
            Copy Image
          </button>

          <button
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-white bg-[#1a1a26] hover:bg-[#242434] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
