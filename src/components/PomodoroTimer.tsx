import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { Play, Pause, RotateCcw, X, Minimize2, Maximize2, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playPomodoroBell } from '../sound';
import { requestNotificationPermission, sendHabitNotification } from '../notification';

export interface PomodoroSession {
  habit: Habit;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  targetEndTime?: number; // epoch ms when current run will hit 00:00
  startedAt?: number; // unique id for dedup across reloads
  completedAt?: number; // set once when session counted, prevents double-count on reload
}

interface PomodoroTimerProps {
  session: PomodoroSession | null;
  onUpdateSession: (session: PomodoroSession | null) => void;
  onCompleteHabit: (habitId: string, minutesCompleted: number) => void;
  isDarkMode?: boolean;
}

type PostFocusState = 'idle' | 'finished';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  session,
  onUpdateSession,
  onCompleteHabit,
  isDarkMode = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [postFocusState, setPostFocusState] = useState<PostFocusState>('idle');
  const [restSeconds, setRestSeconds] = useState(5 * 60);
  const [isRestRunning, setIsRestRunning] = useState(false);

  // Main focus countdown — true targetEndTime persistence (immune to tab switch / CPU throttling)
  useEffect(() => {
    if (!session || postFocusState !== 'idle') return;
    if (!session.isRunning || session.remainingSeconds <= 0) return;

    // Use existing targetEndTime or initialize one
    const targetEnd = session.targetEndTime || (Date.now() + session.remainingSeconds * 1000);
    if (!session.targetEndTime) {
      onUpdateSession({ ...session, targetEndTime: targetEnd });
      return;
    }

    const check = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
      if (remaining !== session.remainingSeconds) {
        onUpdateSession({ ...session, remainingSeconds: remaining });
      }
    };

    const id = window.setInterval(check, 500);

    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, [session?.isRunning, session?.targetEndTime, postFocusState]);

  // Rest countdown
  useEffect(() => {
    if (postFocusState !== 'finished' || !isRestRunning || restSeconds <= 0) return;
    const id = window.setInterval(() => setRestSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [postFocusState, isRestRunning, restSeconds]);

  useEffect(() => {
    if (postFocusState === 'finished' && restSeconds === 0 && isRestRunning) {
      playPomodoroBell();
      setIsRestRunning(false);
    }
  }, [postFocusState, restSeconds, isRestRunning]);

  // Focus finished — single-shot with dedup across reloads
  // Bug: tanpa dedup, tiap hard-refresh yang memicu remainingSeconds=0 akan mengeksekusi effect ini lagi → fokus dobel.
  useEffect(() => {
    if (!session || session.remainingSeconds !== 0 || postFocusState !== 'idle') return;
    // Jika sesi ini sudah pernah dihitung, jangan hitung lagi
    if (session.completedAt) {
      setPostFocusState('finished');
      setRestSeconds(5 * 60);
      setIsRestRunning(false);
      return;
    }
    playPomodoroBell();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: [session.habit.color, '#ffffff', '#10b981'] });
    const minutesDone = Math.round(session.totalSeconds / 60) || 25;
    // Tandai completed sebelum callback agar reload berikutnya tidak dobel
    onUpdateSession({ ...session, completedAt: Date.now(), isRunning: false });
    onCompleteHabit(session.habit.id, minutesDone);
    sendHabitNotification(
      `Sesi Fokus Selesai! 🎉`,
      `Hebat! Kamu telah menyelesaikan ${minutesDone} menit fokus pada ${session.habit.name}.`,
      session.habit.emoji || '🎯',
      'pomodoro-finish-notif'
    );
    setPostFocusState('finished');
    setRestSeconds(5 * 60);
    setIsRestRunning(false);
  }, [session, onCompleteHabit, postFocusState, onUpdateSession]);

  useEffect(() => {
    if (!session || isMinimized) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onUpdateSession(null); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [session, onUpdateSession, isMinimized]);

  // Live OS Notification Timer & Page Title Countdown
  useEffect(() => {
    if (!session || typeof window === 'undefined') return;
    if (!session.isRunning || postFocusState !== 'idle') return;

    // OS Notification bar: kirim update per menit jika izin notifikasi aktif
    let lastNotifiedMins: number | null = null;

    const updateOSNotification = (force = false) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = Date.now();
      const targetEnd = session.targetEndTime || now + session.remainingSeconds * 1000;
      const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));

      if (remaining <= 0) return;

      const mins = Math.ceil(remaining / 60); // ceil agar 4:01 masih 5m, bukan 4m
      if (!force && lastNotifiedMins === mins) return;
      lastNotifiedMins = mins;

      sendHabitNotification(
        `Sedang Fokus: ${mins}m tersisa`,
        `Fokus pada ${session.habit.name}. Target selesai ${new Date(targetEnd).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
        '⏱️',
        'pomodoro-live-timer'
      );
    };

    updateOSNotification(true);
    const nInterval = setInterval(() => updateOSNotification(false), 60000);

    // Title Tab Live Countdown (per detik)
    const originalTitle = document.title;
    const titleInterval = setInterval(() => {
      const now = Date.now();
      const targetEnd = session.targetEndTime || now + session.remainingSeconds * 1000;
      const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toString().padStart(2, '0');
      document.title = `(${mins}:${secs}) 🎯 ${session.habit.name}`;
    }, 1000);

    // Cleanup: restore title & clear intervals when paused/stopped/minimized
    return () => {
      clearInterval(nInterval);
      clearInterval(titleInterval);
      document.title = originalTitle;
    };
  }, [session?.isRunning, session?.targetEndTime, postFocusState]);

  if (!session) return null;

  const minutes = Math.floor(session.remainingSeconds / 60);
  const seconds = session.remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const restMin = Math.floor(restSeconds / 60);
  const restSec = restSeconds % 60;
  const restFormatted = `${String(restMin).padStart(2, '0')}:${String(restSec).padStart(2, '0')}`;
  const progressPercent = ((session.totalSeconds - session.remainingSeconds) / session.totalSeconds) * 100;

  const togglePlayPause = async () => {
    if (session.isRunning) {
      // Pause: remove targetEndTime so remainingSeconds freezes
      onUpdateSession({
        ...session,
        isRunning: false,
        targetEndTime: undefined,
      });
    } else {
      // Saat user menekan Mulai, minta izin notifikasi secara eksplisit jika belum pernah diminta
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
          await requestNotificationPermission();
        } catch {}
      }

      // Resume: set new targetEndTime = now + remainingSeconds, dan set startedAt jika belum ada
      onUpdateSession({
        ...session,
        isRunning: true,
        targetEndTime: Date.now() + session.remainingSeconds * 1000,
        startedAt: session.startedAt || Date.now(),
        completedAt: undefined,
      });
    }
  };

  const resetTimer = () => {
    setPostFocusState('idle');
    onUpdateSession({
      ...session,
      remainingSeconds: session.totalSeconds,
      isRunning: false,
      targetEndTime: undefined,
    });
  };

  const setDuration = (mins: number) => {
    setPostFocusState('idle');
    onUpdateSession({
      ...session,
      totalSeconds: mins * 60,
      remainingSeconds: mins * 60,
      isRunning: false,
      targetEndTime: undefined,
    });
  };
  const continueFocus = () => {
    setPostFocusState('idle');
    setIsRestRunning(false);
    onUpdateSession({
      ...session,
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      isRunning: false,
      targetEndTime: undefined,
      startedAt: undefined,
      completedAt: undefined,
    });
  };

  if (isMinimized) {
    const isFinished = postFocusState === 'finished';
    return (
      <div className="fixed bottom-[74px] sm:bottom-5 left-3 right-3 sm:left-5 sm:right-auto sm:max-w-xs z-[45] animate-in slide-in-from-bottom duration-200">
        <div
          className={`backdrop-blur-md border rounded-2xl px-3.5 py-2.5 shadow-2xl flex items-center justify-between gap-3 ${
            isDarkMode
              ? 'bg-[#14141d]/95 border-[#2a2a3e] text-white'
              : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
          }`}
          style={{
            boxShadow: isDarkMode
              ? `0 10px 32px rgba(0,0,0,0.7), 0 0 20px ${session.habit.color}25`
              : `0 10px 30px rgba(0,0,0,0.12), 0 0 20px ${session.habit.color}20`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none" onClick={() => setIsMinimized(false)}>
            <span className="text-xl shrink-0" aria-hidden>{isFinished ? '☕' : session.habit.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{session.habit.name}</div>
              <div className="text-[10.5px] font-mono font-semibold flex items-center gap-1.5" style={{ color: isFinished ? '#10b981' : session.habit.color }}>
                <span>{isFinished ? restFormatted : timeFormatted}</span>
                <span className="opacity-60">•</span>
                <span className="font-normal truncate">{isFinished ? 'Istirahat' : 'Fokus'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isFinished && (
              <button
                type="button"
                aria-label={session.isRunning ? 'Jeda timer' : 'Mulai timer'}
                onClick={togglePlayPause}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#20202e] hover:bg-[#2c2c40] text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                }`}
              >
                {session.isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            )}
            <button
              type="button"
              aria-label="Perbesar timer"
              onClick={() => setIsMinimized(false)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode
                  ? 'text-zinc-400 hover:text-white hover:bg-[#20202e]'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Tutup timer"
              onClick={() => onUpdateSession(null)}
              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFinished = postFocusState === 'finished';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay" role="dialog" aria-modal="true" onClick={() => onUpdateSession(null)}>
      <div role="document" onClick={(e) => e.stopPropagation()} className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl modal-card relative overflow-hidden text-center ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} style={{ boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 50px ${session.habit.color}20` : `0 20px 50px rgba(0,0,0,0.15)` }}>
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${isDarkMode ? 'text-zinc-400 bg-[#1a1a26] border-[#2b2b3d]' : 'text-zinc-600 bg-zinc-100 border-zinc-300'}`}>
            <Timer className="w-3.5 h-3.5 text-[#8338ec]" />
            <span>{isFinished ? 'Selesai — habit tercatat' : 'Pomodoro Focus Mode'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsMinimized(true)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}><Minimize2 className="w-4 h-4" /></button>
            <button type="button" onClick={() => onUpdateSession(null)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="my-4">
          <span className="text-4xl inline-block mb-2 select-none" aria-hidden>{isFinished ? '✅' : session.habit.emoji}</span>
          <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{isFinished ? 'Sesi fokus selesai' : session.habit.name}</h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{isFinished ? 'Kebiasaan hari ini sudah tercatat. Mau istirahat sebentar?' : 'Fokus penuh — hilangkan distraksi'}</p>
        </div>

        <div className="relative my-6 flex flex-col items-center justify-center">
          <div className={`text-6xl sm:text-7xl font-extrabold font-mono tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{isFinished ? restFormatted : timeFormatted}</div>
          <div className={`w-60 h-2 rounded-full overflow-hidden mt-5 ${isDarkMode ? 'bg-[#1b1b26]' : 'bg-zinc-200'}`}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: isFinished ? `${(300 - restSeconds) / 3}%` : `${progressPercent}%`, backgroundColor: isFinished ? '#10b981' : session.habit.color, boxShadow: `0 0 14px ${isFinished ? '#10b981' : session.habit.color}88` }} />
          </div>
          {isFinished && <p className="text-xs font-mono mt-2 text-emerald-500">Istirahat 5 menit — opsional</p>}
        </div>

        {!isFinished ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {[5, 15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono border ${session.totalSeconds === mins * 60 ? 'bg-[#8338ec] border-[#8338ec] text-white font-bold shadow-md' : isDarkMode ? 'bg-[#181824] border-[#28283a] text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-600'}`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={resetTimer} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#181824] hover:bg-[#222232] text-zinc-400 border-[#2a2a3c]' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}><RotateCcw className="w-5 h-5" /></button>
              <button type="button" onClick={togglePlayPause} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl active:scale-95" style={{ backgroundColor: session.habit.color, boxShadow: `0 8px 25px ${session.habit.color}40` }}>
                {session.isRunning ? <><Pause className="w-5 h-5 fill-current" /> Jeda</> : <><Play className="w-5 h-5 fill-current" /> Mulai</>}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button type="button" onClick={() => setIsRestRunning((v) => !v)} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white active:scale-95 cursor-pointer shadow-md ${isRestRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {isRestRunning ? <><Pause className="w-4 h-4 fill-current" /> Jeda istirahat</> : <><Play className="w-4 h-4 fill-current" /> Mulai istirahat 5′</>}
              </button>
              <button type="button" onClick={continueFocus} className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-[#8338ec] hover:bg-[#722ed1] text-white active:scale-95 cursor-pointer shadow-md shadow-[#8338ec]/25">
                Lanjut fokus
              </button>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Pilih lanjut untuk mulai sesi berikutnya atau tutup lewat tombol ✕ di atas.</p>
          </div>
        )}
      </div>
    </div>
  );
};