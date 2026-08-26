import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { Play, Pause, RotateCcw, Check, X, Minimize2, Maximize2, Sparkles, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playPomodoroBell, playCheckSound } from '../sound';

export interface PomodoroSession {
  habit: Habit;
  totalSeconds: number; // e.g. 25 * 60
  remainingSeconds: number;
  isRunning: boolean;
}

interface PomodoroTimerProps {
  session: PomodoroSession | null;
  onUpdateSession: (session: PomodoroSession | null) => void;
  onCompleteHabit: (habitId: string, minutesCompleted: number) => void;
  isDarkMode?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  session,
  onUpdateSession,
  onCompleteHabit,
  isDarkMode = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // minutes

  // All hooks must be above any early return (Rules of Hooks — fixes React #310)
  useEffect(() => {
    if (!session || !session.isRunning || session.remainingSeconds <= 0) return;
    const interval: number = window.setInterval(() => {
      onUpdateSession({
        ...session,
        remainingSeconds: session.remainingSeconds - 1,
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, onUpdateSession]);

  useEffect(() => {
    if (!session || session.remainingSeconds !== 0) return;
    playPomodoroBell();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: [session.habit.color, '#ffffff', '#fbbf24'],
    });
    const minutesDone = Math.round(session.totalSeconds / 60);
    onCompleteHabit(session.habit.id, minutesDone);
    onUpdateSession(null);
  }, [session, onUpdateSession, onCompleteHabit]);

  useEffect(() => {
    if (!session || isMinimized) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onUpdateSession(null); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [session, onUpdateSession, isMinimized]);

  if (!session) return null;

  const minutes = Math.floor(session.remainingSeconds / 60);
  const seconds = session.remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((session.totalSeconds - session.remainingSeconds) / session.totalSeconds) * 100;

  const togglePlayPause = () => {
    onUpdateSession({
      ...session,
      isRunning: !session.isRunning,
    });
  };

  const resetTimer = () => {
    onUpdateSession({
      ...session,
      remainingSeconds: session.totalSeconds,
      isRunning: false,
    });
  };

  const setDuration = (mins: number) => {
    setSelectedDuration(mins);
    onUpdateSession({
      ...session,
      totalSeconds: mins * 60,
      remainingSeconds: mins * 60,
      isRunning: false,
    });
  };

  const finishEarly = () => {
    if (window.confirm('Tandai habit ini sudah selesai sekarang?')) {
      playCheckSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      const minutesDone = Math.round((session.totalSeconds - session.remainingSeconds) / 60) || 1;
      onCompleteHabit(session.habit.id, minutesDone);
      onUpdateSession(null);
    }
  };

  // FLOATING MINIMIZED BAR — render di atas modal, tanpa backdrop hitam ganda
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 left-5 z-[90] animate-in slide-in-from-bottom duration-200">
        <div
          className="bg-[#14141d]/95 backdrop-blur-md border border-[#2a2a3e] rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3.5"
          style={{ boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${session.habit.color}25` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse" aria-hidden>{session.habit.emoji}</span>
            <div>
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                <span>{session.habit.name}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: session.habit.color }} aria-hidden />
              </div>
              <div className="text-[11px] font-mono text-indigo-400 font-semibold">{timeFormatted} {session.isRunning ? '• Focusing' : '• Paused'}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={session.isRunning ? 'Jeda timer' : 'Lanjutkan timer'} onClick={togglePlayPause} className="p-1.5 bg-[#20202e] hover:bg-[#2c2c40] text-white rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{session.isRunning ? <Pause className="w-3.5 h-3.5" aria-hidden /> : <Play className="w-3.5 h-3.5 fill-white" aria-hidden />}</button>
            <button type="button" aria-label="Perbesar timer" onClick={() => setIsMinimized(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#20202e] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" title="Expand timer"><Maximize2 className="w-3.5 h-3.5" aria-hidden /></button>
            <button type="button" aria-label="Hentikan timer" onClick={() => onUpdateSession(null)} className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" title="Stop timer"><X className="w-3.5 h-3.5" aria-hidden /></button>
          </div>
        </div>
      </div>
    );
  }

  // FULL FOCUS MODAL
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in" role="dialog" aria-modal="true" aria-label={`Timer fokus untuk ${session.habit.name}`} onClick={() => onUpdateSession(null)}>
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-md w-full p-7 shadow-2xl relative overflow-hidden text-center ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 50px ${session.habit.color}20`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
            isDarkMode ? 'text-zinc-400 bg-[#1a1a26] border-[#2b2b3d]' : 'text-zinc-600 bg-zinc-100 border-zinc-300'
          }`}>
            <Timer className="w-3.5 h-3.5 text-[#8338ec]" />
            <span>Pomodoro Focus Mode</span>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" aria-label="Minimize timer" onClick={() => setIsMinimized(true)} className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`} title="Minimize to floating widget"><Minimize2 className="w-4 h-4" aria-hidden /></button>
            <button type="button" aria-label="Tutup timer" onClick={() => onUpdateSession(null)} className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`} title="Close timer"><X className="w-4 h-4" aria-hidden /></button>
          </div>
        </div>
        <div className="my-5">
          <span className="text-4xl inline-block mb-2 select-none animate-bounce" aria-hidden>{session.habit.emoji}</span>
          <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{session.habit.name}</h2>
          <p className={`text-xs font-mono mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Sedang berfokus — timer berjalan</p>
        </div>
        <div className="relative my-8 flex flex-col items-center justify-center">
          <div aria-live="polite" aria-atomic="true" className={`text-7xl font-extrabold font-mono tracking-tighter ${isDarkMode ? 'text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'text-zinc-900'}`}>{timeFormatted}</div>

          {/* Progress bar */}
          <div className={`w-56 h-2 rounded-full overflow-hidden mt-6 ${isDarkMode ? 'bg-[#1b1b26]' : 'bg-zinc-200'}`}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: session.habit.color,
                boxShadow: `0 0 14px ${session.habit.color}`,
              }}
            />
          </div>
        </div>

        {/* Quick Duration Presets */}
        <div className="flex items-center justify-center gap-2 mb-7">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => setDuration(mins)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                session.totalSeconds === mins * 60
                  ? 'bg-[#8338ec] border-[#8338ec] text-white font-bold shadow-md shadow-[#8338ec]/30'
                  : isDarkMode
                  ? 'bg-[#181824] border-[#28283a] text-zinc-400 hover:text-white'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Main Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button type="button" aria-label="Reset timer" onClick={resetTimer} className={`p-3 rounded-2xl cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#181824] hover:bg-[#222232] text-zinc-400 hover:text-white border-[#2a2a3c]' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'}`} title="Reset timer"><RotateCcw className="w-5 h-5" aria-hidden /></button>
          <button type="button" aria-label={session.isRunning ? 'Jeda timer' : 'Mulai fokus'} onClick={togglePlayPause} className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-2 ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95' : 'bg-[#8338ec] text-white hover:bg-[#722ed1] active:scale-95 shadow-[#8338ec]/30'}`}>
            {session.isRunning ? <><Pause className="w-5 h-5 fill-current" aria-hidden /> Jeda</> : <><Play className="w-5 h-5 fill-current" aria-hidden /> Mulai</>}
          </button>
          <button type="button" aria-label="Selesaikan lebih awal dan tandai habit selesai" onClick={finishEarly} className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-2xl cursor-pointer border border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" title="Selesaikan lebih awal"><Check className="w-5 h-5 stroke-[2.5]" aria-hidden /></button>
        </div>
      </div>
    </div>
  );
};
