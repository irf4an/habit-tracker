import React, { useState, useRef, lazy, Suspense } from 'react';
import { Habit, ViewTab, QuietHours } from './types';
import { HabitCard } from './components/HabitCard';
import { StatsView } from './components/StatsView';
import { ManageView } from './components/ManageView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PomodoroSession } from './components/PomodoroTimer';
import { calculateBadges } from './achievements';
import { getTodayString } from './utils';
import { HelpCircle, Sun, Moon } from 'lucide-react';
import { MaterialIcon } from './components/MaterialIcon';
import { FluentOutlineIcon } from './components/FluentOutlineIcon';

// Custom Hooks (ADR-0001: State Decomposition)
import { useHabits } from './hooks/useHabits';
import { useAuthProfile } from './hooks/useAuthProfile';
import { useReminders } from './hooks/useReminders';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';

// Lazy Loaded Modals for Code-Splitting (ADR-0002)
const HabitModal = lazy(() => import('./components/HabitModal').then((m) => ({ default: m.HabitModal })));
const ShareCardModal = lazy(() => import('./components/ShareCardModal').then((m) => ({ default: m.ShareCardModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then((m) => ({ default: m.OnboardingModal })));
const PomodoroTimer = lazy(() => import('./components/PomodoroTimer').then((m) => ({ default: m.PomodoroTimer })));
const AchievementsModal = lazy(() => import('./components/AchievementsModal').then((m) => ({ default: m.AchievementsModal })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then((m) => ({ default: m.ProfileModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then((m) => ({ default: m.HelpModal })));

export function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('calendar');
  const [isFullView, setIsFullView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('all');

  // Modal Visibility States
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [shareHabit, setShareHabit] = useState<Habit | null>(null);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null);

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('minimal_habit_onboarded_v1');
    } catch {
      return false;
    }
  });

  const [quietHours, setQuietHours] = useState<QuietHours>(() => {
    try {
      const raw = localStorage.getItem('minimal_habit_quiet_hours_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { enabled: false, start: '22:00', end: '07:00' };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook 1: Theme Management
  const { isDarkMode, toggleTheme } = useTheme();

  // Hook 2: User Profile & Cloud Auth
  const {
    userId,
    userEmail,
    userProfile,
    handleAuthSuccess,
    handleSignOut,
    handleSaveProfile,
  } = useAuthProfile([], () => {});

  // Hook 3: Habit Data & Operations with Connected userId
  const {
    habits,
    setHabits,
    handleToggleDate,
    handleSaveNote,
    handleToggleFreeze,
    handleSaveHabit,
    handleDeleteHabit,
    handleToggleArchive,
    handlePomodoroComplete,
    handleResetSample,
  } = useHabits(userId);

  // Hook 4: Daily Reminders & Quiet Hours
  useReminders(habits, setHabits, quietHours);

  // Hook 5: Global Keyboard Shortcuts (N, 1-9)
  useKeyboardShortcuts({
    habits,
    onOpenNewHabit: () => {
      setEditingHabit(null);
      setIsModalOpen(true);
    },
    onToggleDate: handleToggleDate,
  });

  // Pomodoro Actions
  const handleStartPomodoro = (habit: Habit) => {
    setIsModalOpen(false);
    setShowProfile(false);
    setShowAuth(false);
    setShowAchievements(false);
    setShowHelp(false);
    setPomodoroSession({
      habit,
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      isRunning: true,
    });
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('minimal_habit_onboarded_v1', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Import / Export Helpers
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(habits, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `minimal-habit-tracker-backup-${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setHabits(parsed);
          alert('Data habits berhasil diimpor!');
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter habits for calendar view (Category & Time of Day)
  const categories = ['All', ...Array.from(new Set(habits.map((h) => h.category).filter(Boolean)))];
  const activeHabits = habits.filter((h) => !h.archived);
  const { unlockedCount, totalCount, level } = calculateBadges(habits);
  
  const filteredHabits = activeHabits.filter((h) => {
    // Filter Category
    if (selectedCategory !== 'All' && h.category !== selectedCategory) {
      return false;
    }
    // Filter Time of Day
    if (selectedTimeOfDay !== 'all') {
      const habitTime = h.timeOfDay || 'anytime';
      if (selectedTimeOfDay !== habitTime) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={`min-h-[100dvh] flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-[#0b0b0e] text-zinc-100 selection:bg-indigo-600 selection:text-white' : 'bg-[#fbfbfe] text-zinc-900 selection:bg-indigo-500 selection:text-white'}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-[#8338ec] text-white px-3 py-1.5 rounded-lg text-sm z-[100]">Lompat ke konten</a>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" aria-hidden />

      {/* App Header */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${isDarkMode ? 'bg-[#0b0b0e]/90 border-[#1c1c26]' : 'bg-[#fbfbfe]/90 border-zinc-200'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buka panduan shortcut"
              onClick={() => setShowHelp(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 hover:text-white border-[#282838]' : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-300'}`}
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden />
              <span className="hidden sm:inline">Panduan</span>
              <span className="sm:hidden">Help</span>
            </button>

            <button
              type="button"
              aria-label={`Pencapaian level ${level}, ${unlockedCount} dari ${totalCount} lencana terbuka`}
              onClick={() => setShowAchievements(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-amber-300 hover:text-amber-200 border-amber-500/30' : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'}`}
            >
              <span aria-hidden>🏆</span>
              <span>Lv.{level}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${isDarkMode ? 'text-zinc-400 bg-[#161622] border-amber-500/20' : 'text-amber-900 bg-amber-100 border-amber-300'}`}>
                {unlockedCount}/{totalCount}
              </span>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Navigasi utama" className={`hidden sm:flex items-center p-1 rounded-full border shadow-inner ${isDarkMode ? 'bg-[#14141d] border-[#8338ec]/35' : 'bg-zinc-100 border-[#8338ec]/25'}`} style={{ boxShadow: `0 0 16px rgba(131,56,236,0.12)` }}>
            <button type="button" aria-current={activeTab === 'calendar' ? 'page' : undefined} onClick={() => setActiveTab('calendar')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'calendar' ? 'bg-white text-zinc-950 font-semibold shadow-md' : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>
              <MaterialIcon name="calendar_month" size={16} />
              Calendar
            </button>
            <button type="button" aria-current={activeTab === 'statistics' ? 'page' : undefined} onClick={() => setActiveTab('statistics')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'statistics' ? 'bg-white text-zinc-950 font-semibold shadow-md' : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>
              <MaterialIcon name="bar_chart" size={16} />
              Statistics
            </button>
            <button type="button" aria-current={activeTab === 'manage' ? 'page' : undefined} onClick={() => setActiveTab('manage')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'manage' ? 'bg-white text-zinc-950 font-semibold shadow-md' : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}>
              <MaterialIcon name="tune" size={16} />
              Manage
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" aria-label={isDarkMode ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'} onClick={toggleTheme} title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'} className={`p-2 rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#161620] hover:bg-[#20202c] text-amber-300 border-[#282838]' : 'bg-white hover:bg-zinc-100 text-indigo-600 border-zinc-300 shadow-sm'}`}>
              {isDarkMode ? <Sun className="w-4 h-4" aria-hidden /> : <Moon className="w-4 h-4" aria-hidden />}
            </button>
            <button type="button" aria-label={`Profil ${userProfile.name}, level ${level}`} onClick={() => setShowProfile(true)} className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer select-none transition-transform active:scale-95 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1a1a28] border-[#8338ec]/40 shadow-sm shadow-[#8338ec]/20' : 'bg-indigo-50 border-indigo-200'}`} title="Profil Pengguna">
              <span aria-hidden>{userProfile.avatarEmoji}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-10 outline-none">
        {/* Time of Day & Category Filter Bar */}
        {activeTab === 'calendar' && (
          <div className="space-y-2.5 mb-4">
            {/* Row 1: Time of Day Filter (Habit Stacking v1.1) + Full View Toggle */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className={`flex items-center gap-1.5 p-1 rounded-full border shadow-inner ${
                isDarkMode
                  ? 'bg-[#13131b] border-[#8338ec]/30'
                  : 'bg-zinc-100 border-zinc-300'
              }`}>
                {[
                  { id: 'all', label: 'Semua Waktu', icon: '⚡' },
                  { id: 'morning', label: 'Pagi', icon: '🌅' },
                  { id: 'afternoon', label: 'Siang', icon: '☀️' },
                  { id: 'evening', label: 'Malam', icon: '🌙' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTimeOfDay(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 leading-none ${
                      selectedTimeOfDay === t.id
                        ? 'bg-[#8338ec] text-white shadow-sm'
                        : isDarkMode
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.label === 'Semua Waktu' ? 'Semua' : t.label}</span>
                  </button>
                ))}
              </div>

              {/* Full View Toggle */}
              <div className="flex items-center gap-2.5 ml-auto">
                <span className={`text-xs font-mono select-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Full View</span>
                <button
                  type="button"
                  onClick={() => setIsFullView((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isFullView ? 'bg-[#8338ec]' : isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      isFullView ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Row 2: Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat!)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border inline-flex items-center gap-1.5 leading-none ${
                    selectedCategory === cat
                      ? isDarkMode
                        ? 'bg-[#8338ec]/20 border-[#8338ec] text-[#a78bfa] font-semibold shadow-xs'
                        : 'bg-[#8338ec] border-[#8338ec] text-white font-semibold shadow-sm'
                      : isDarkMode
                      ? 'bg-[#14141c] border-[#222230] text-zinc-400 hover:text-zinc-200'
                      : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                  }`}
                >
                  <MaterialIcon name={cat === 'All' ? 'apps' : 'label'} size={12} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENTS */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {filteredHabits.map((habit, index) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={index}
                isFullView={isFullView}
                isDarkMode={isDarkMode}
                onToggleDate={handleToggleDate}
                onToggleFreeze={handleToggleFreeze}
                onSaveNote={handleSaveNote}
                onShareHabit={setShareHabit}
                onStartPomodoro={handleStartPomodoro}
              />
            ))}

            {filteredHabits.length === 0 && (
              <div className={`border rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#111116] border-[#8338ec]/35' : 'bg-white border-zinc-200 shadow-sm'}`}>
                {/* Sprout in Pot Illustration (Tunas Tanaman dalam Pot) */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-xl ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-[#181828] to-[#12121d] border-[#8338ec]/40 text-[#a78bfa]'
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50/50 border-purple-200 text-[#8338ec]'
                  }`}>
                    <FluentOutlineIcon name="plant" size={40} />
                  </div>
                  {/* Floating badge sparkle */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#8338ec] text-white flex items-center justify-center shadow-md">
                    <MaterialIcon name="local_fire_department" size={14} color="#ffffff" />
                  </div>
                </div>

                <h3 className={`text-lg font-bold mb-1.5 tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {habits.length === 0 ? 'Belum Ada Kebiasaan' : 'Tidak Ada yang Cocok'}
                </h3>
                <p className={`text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {habits.length === 0
                    ? 'Mulai dari satu tunas kebiasaan kecil — siram konsistensinya setiap hari.'
                    : 'Coba ubah filter kategori atau waktu di atas.'}
                </p>
                <button
                  onClick={() => { setEditingHabit(null); setIsModalOpen(true); }}
                  className="px-6 py-3 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-full text-xs font-bold cursor-pointer shadow-lg shadow-[#8338ec]/30 active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <MaterialIcon name="add" size={18} color="#ffffff" />
                  <span>Buat kebiasaan pertama</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && <StatsView habits={activeHabits} isDarkMode={isDarkMode} />}

        {activeTab === 'manage' && (
          <ManageView
            habits={habits}
            isDarkMode={isDarkMode}
            quietHours={quietHours}
            onQuietHoursChange={setQuietHours}
            onAddHabit={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            onEditHabit={(habit) => {
              setEditingHabit(habit);
              setIsModalOpen(true);
            }}
            onDeleteHabit={handleDeleteHabit}
            onToggleArchive={handleToggleArchive}
            onReorderHabits={setHabits}
            onExport={handleExport}
            onImport={handleImportClick}
            onResetSample={handleResetSample}
          />
        )}
      </main>

      {/* Floating Keyboard Legend (Desktop only) */}
      <footer className="hidden sm:flex sticky bottom-4 right-4 max-w-fit ml-auto mr-4 pointer-events-none z-20">
        <div className="bg-[#12121ad9] backdrop-blur-md border border-[#242432] text-zinc-400 text-[11px] font-mono px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1f1f2c] text-zinc-200 rounded border border-[#2e2e40]">N</kbd>
            <span>New habit</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1f1f2c] text-zinc-200 rounded border border-[#2e2e40]">1-5</kbd>
            <span>Toggle</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav (<640px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingHabit(null);
          setIsModalOpen(true);
        }}
        onOpenProfile={() => setShowProfile(true)}
        isDarkMode={isDarkMode}
      />

      {/* Modals with Lazy Suspense */}
      <Suspense fallback={null}>
        <PomodoroTimer
          session={pomodoroSession}
          onUpdateSession={setPomodoroSession}
          onCompleteHabit={handlePomodoroComplete}
          isDarkMode={isDarkMode}
        />
      </Suspense>

      <Suspense fallback={null}>
        {isModalOpen && (
          <HabitModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveHabit}
            initialHabit={editingHabit}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {shareHabit && (
          <ShareCardModal habit={shareHabit} onClose={() => setShareHabit(null)} isDarkMode={isDarkMode} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showHelp && (
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showProfile && (
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            profile={userProfile}
            onSaveProfile={handleSaveProfile}
            habits={habits}
            userEmail={userEmail}
            onOpenAuth={() => setShowAuth(true)}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showAuth && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            userEmail={userEmail}
            onAuthSuccess={handleAuthSuccess}
            onSignOut={handleSignOut}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showAchievements && (
          <AchievementsModal
            isOpen={showAchievements}
            onClose={() => setShowAchievements(false)}
            habits={habits}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={handleCloseOnboarding}
            onStartHabit={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
