import React, { useState, useEffect } from 'react';

export const IOSInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-ios-dismissed');
    if (dismissed === 'true') return;

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Avoid showing on Android where beforeinstallprompt is available
    // but we still want to support it there

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS Safari there is no beforeinstallprompt, so show after a delay
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (isIOS) {
      timeout = setTimeout(() => setVisible(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      void outcome;
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-ios-dismissed', 'true');
    setVisible(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-[60] flex justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-sm w-full bg-[#1a1a28]/95 backdrop-blur-xl border border-[#2a2a3a] rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0EC9A0] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" />
            <path d="M5.5 6.8l1.2 1.2 2.2-2.2" stroke="#0EC9A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.7" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.7" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" />
            <path d="M16.5 17.8l1.2 1.2 2.2-2.2" stroke="#0EC9A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Pasang Habit Tracker</p>
          {isIOS ? (
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Tap tombol <span className="text-white font-semibold">Share</span> <span className="inline-block align-middle">⎙</span> di Safari, lalu pilih <span className="text-white font-semibold">Add to Home Screen</span>.
            </p>
          ) : deferredPrompt ? (
            <p className="text-xs text-zinc-400 mt-0.5">Pasang sebagai aplikasi untuk akses lebih cepat & offline.</p>
          ) : (
            <p className="text-xs text-zinc-400 mt-0.5">Tambahkan ke layar utama untuk akses cepat.</p>
          )}
          <div className="flex gap-2 mt-3">
            {deferredPrompt ? (
              <button onClick={handleInstall} className="px-4 py-1.5 bg-[#0EC9A0] hover:bg-[#0ab890] text-white rounded-full text-xs font-bold transition-colors">
                Pasang
              </button>
            ) : null}
            <button onClick={handleDismiss} className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-full text-xs font-semibold transition-colors">
              Nanti
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} aria-label="Tutup" className="p-1 -mr-1 text-zinc-500 hover:text-white shrink-0">✕</button>
      </div>
    </div>
  );
};

export default IOSInstallPrompt;
