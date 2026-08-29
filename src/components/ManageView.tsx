import React, { useState } from 'react';
import { Habit } from '../types';
import { MaterialIcon } from './MaterialIcon';
import { FluentOutlineIcon } from './FluentOutlineIcon';
import { exportHabitsToCSV } from '../utils';
import { requestNotificationPermission, sendHabitNotification } from '../notification';
import { QuietHours } from '../types';

interface ManageViewProps {
  habits: Habit[];
  isDarkMode?: boolean;
  quietHours: QuietHours;
  onQuietHoursChange: (qh: QuietHours) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleArchive: (habitId: string) => void;
  onReorderHabits: (habits: Habit[]) => void;
  onExport: () => void;
  onImport: () => void;
  onResetSample: () => void;
}

export const ManageView: React.FC<ManageViewProps> = ({
  habits,
  isDarkMode = true,
  quietHours,
  onQuietHoursChange,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleArchive,
  onReorderHabits,
  onExport,
  onImport,
  onResetSample,
}) => {
  const [showArchived, setShowArchived] = useState(false);

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  const displayedHabits = showArchived ? archivedHabits : activeHabits;

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= displayedHabits.length) return;

    const newDisplayed = [...displayedHabits];
    const temp = newDisplayed[index];
    newDisplayed[index] = newDisplayed[targetIdx];
    newDisplayed[targetIdx] = temp;

    const otherHabits = habits.filter((h) => (showArchived ? !h.archived : h.archived));
    onReorderHabits([...newDisplayed, ...otherHabits]);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* MAIN MANAGE CARD */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 transition-all ${
          isDarkMode
            ? 'bg-[#14141b] border-[#8338ec]/35 hover:border-[#8338ec]/55'
            : 'bg-white border-[#8338ec]/20 hover:border-[#8338ec]/40'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 20px rgba(131, 56, 236, 0.12)`
            : `0 8px 30px rgba(131, 56, 236, 0.08)`,
        }}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Kelola Kebiasaan
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Atur urutan, target, dan kebiasaan aktifmu.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center justify-center gap-1.5 sm:px-3 sm:py-2 p-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer leading-none ${
                showArchived
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : isDarkMode
                  ? 'bg-[#181824] border-[#2b2b3b] text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
              title={showArchived ? 'Melihat Arsip' : `Arsip Kebiasaan (${archivedHabits.length})`}
            >
              <MaterialIcon name="archive" size={16} />
              <span className="hidden sm:inline">{showArchived ? 'Diarsipkan' : `Arsip (${archivedHabits.length})`}</span>
            </button>
            <button
              onClick={onAddHabit}
              className="flex items-center justify-center gap-1 sm:px-3.5 sm:py-2 p-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-full text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-md shadow-[#8338ec]/25 leading-none"
              title="Tambah Kebiasaan Baru"
            >
              <MaterialIcon name="add" size={16} color="#ffffff" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          </div>
        </div>

        <div className="space-y-3" role="list" aria-label="Daftar kebiasaan — kelola urutan dan arsip">
          {displayedHabits.map((habit, idx) => {
            const completedCount = Object.keys(habit.history).filter((k) => habit.history[k] > 0).length;
            return (
              <div
                key={habit.id}
                role="listitem"
                aria-label={`${idx + 1}. ${habit.name} — ${completedCount} selesai`}
                className={`border rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col gap-2.5 focus-within:ring-2 focus-within:ring-[#8338ec] ${isDarkMode ? 'bg-[#0f0f15] border-[#1e1e28] hover:border-[#8338ec]/40' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'}`}
              >
                {/* Tier 1: Index + Emoji + Name + pills */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-mono font-bold shrink-0 ${
                    isDarkMode ? 'bg-[#181824] text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xl select-none shrink-0">{habit.emoji}</span>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                    <h4 className={`font-bold text-sm leading-snug truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {habit.name}
                    </h4>
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: habit.color }} />
                    {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 inline-flex items-center gap-1 leading-none ${
                        habit.timeOfDay === 'morning'
                          ? isDarkMode ? 'text-amber-300 bg-amber-500/10 border-amber-500/25' : 'text-amber-800 bg-amber-50 border-amber-300'
                          : habit.timeOfDay === 'afternoon'
                          ? isDarkMode ? 'text-sky-300 bg-sky-500/10 border-sky-500/25' : 'text-sky-800 bg-sky-50 border-sky-300'
                          : isDarkMode ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25' : 'text-indigo-800 bg-indigo-50 border-indigo-300'
                      }`}>
                        <span>{habit.timeOfDay === 'morning' ? '🌅 Pagi' : habit.timeOfDay === 'afternoon' ? '☀️ Siang' : '🌙 Malam'}</span>
                      </span>
                    )}
                    {habit.category && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 inline-flex items-center gap-1 leading-none ${
                        isDarkMode ? 'text-zinc-300 bg-[#161622] border-[#272738]' : 'text-zinc-600 bg-white border-zinc-200'
                      }`}>
                        <MaterialIcon name="label" size={12} />
                        {habit.category}
                      </span>
                    )}
                    {habit.type === 'numeric' && (
                      <span className="text-[10px] font-mono text-[#8338ec] bg-[#8338ec]/10 border border-[#8338ec]/20 px-2 py-0.5 rounded-full shrink-0 font-medium inline-flex items-center gap-1 leading-none">
                        <MaterialIcon name="flag" size={12} color="#8338ec" />
                        Target: {habit.targetValue} {habit.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier 2: Sub-info on Left, Action Toolbar on Right */}
                <div className={`flex items-center justify-between gap-2 pt-2 border-t ${
                  isDarkMode ? 'border-[#1b1b26]' : 'border-zinc-200/70'
                }`}>
                  <div className={`text-[11px] font-light font-mono truncate ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Sejak {habit.createdAt}
                  </div>

                  {/* Action Toolbar Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!showArchived && (
                      <>
                        <button
                          disabled={idx === 0}
                          onClick={() => moveHabit(idx, 'up')}
                          className={`w-8 h-8 flex items-center justify-center disabled:opacity-20 rounded-full transition-colors cursor-pointer border leading-none ${
                            isDarkMode
                              ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26] border-[#262636] bg-[#14141d]'
                              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-300 bg-white shadow-xs'
                          }`}
                          title="Geser ke atas"
                        >
                          <MaterialIcon name="arrow_upward" size={16} />
                        </button>
                        <button
                          disabled={idx === displayedHabits.length - 1}
                          onClick={() => moveHabit(idx, 'down')}
                          className={`w-8 h-8 flex items-center justify-center disabled:opacity-20 rounded-full transition-colors cursor-pointer border leading-none ${
                            isDarkMode
                              ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26] border-[#262636] bg-[#14141d]'
                              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-300 bg-white shadow-xs'
                          }`}
                          title="Geser ke bawah"
                        >
                          <MaterialIcon name="arrow_downward" size={16} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onToggleArchive(habit.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer border leading-none ${
                        isDarkMode
                          ? 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/30 border-[#262636] bg-[#14141d]'
                          : 'text-zinc-600 hover:text-amber-600 hover:bg-amber-50 border-zinc-300 bg-white shadow-xs'
                      }`}
                      title={habit.archived ? 'Kembalikan ke daftar utama' : 'Arsipkan kebiasaan'}
                    >
                      <MaterialIcon name={habit.archived ? 'unarchive' : 'archive'} size={16} />
                    </button>

                    <button
                      onClick={() => onEditHabit(habit)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer border leading-none ${
                        isDarkMode
                          ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26] border-[#262636] bg-[#14141d]'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-300 bg-white shadow-xs'
                      }`}
                      title="Ubah pengaturan"
                    >
                      <MaterialIcon name="edit" size={16} />
                    </button>

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer border leading-none ${
                        isDarkMode
                          ? 'text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 border-[#262636] bg-[#14141d]'
                          : 'text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border-zinc-300 bg-white shadow-xs'
                      }`}
                      title="Hapus kebiasaan"
                    >
                      <MaterialIcon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {displayedHabits.length === 0 && (
            <div className={`text-center py-10 px-4 text-sm rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 ${isDarkMode ? 'text-zinc-400 border-zinc-800 bg-[#0f0f16]' : 'text-zinc-600 border-zinc-300 bg-zinc-50'}`}>
              <FluentOutlineIcon name="book_open" size={32} color={isDarkMode ? '#a78bfa' : '#8338ec'} />
              <p className="text-xs max-w-xs">
                {showArchived ? 'Arsip kosong — kebiasaan yang diarsipkan akan muncul di sini.' : 'Belum ada kebiasaan aktif. Ketuk + Tambah untuk mulai.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DATA BACKUP & RECOVERY */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 transition-all ${
          isDarkMode
            ? 'bg-[#14141b] border-[#8338ec]/30 hover:border-[#8338ec]/50'
            : 'bg-white border-[#8338ec]/20 hover:border-[#8338ec]/40'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 20px rgba(131, 56, 236, 0.12)`
            : `0 8px 30px rgba(131, 56, 236, 0.08)`,
        }}
      >
        <h3 className={`text-sm sm:text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Cadangan Data & Quiet Hours</h3>
        <p className={`text-xs mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Simpan/pulihkan data, atur jam sunyi notifikasi, dan uji kirim.</p>
        <div className={`mb-4 p-3 rounded-xl border flex flex-wrap items-center gap-3 ${isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={quietHours.enabled} onChange={(e) => onQuietHoursChange({ ...quietHours, enabled: e.target.checked })} className="accent-[#8338ec]" />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quiet hours</span>
          </label>
          <input type="time" value={quietHours.start} onChange={(e) => onQuietHoursChange({ ...quietHours, start: e.target.value })} disabled={!quietHours.enabled} className={`border rounded-lg px-2 py-1 text-xs font-mono ${isDarkMode ? 'bg-[#0a0a10] border-[#252538] text-white disabled:opacity-40' : 'bg-white border-zinc-300 text-zinc-900 disabled:opacity-40'}`} />
          <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>sampai</span>
          <input type="time" value={quietHours.end} onChange={(e) => onQuietHoursChange({ ...quietHours, end: e.target.value })} disabled={!quietHours.enabled} className={`border rounded-lg px-2 py-1 text-xs font-mono ${isDarkMode ? 'bg-[#0a0a10] border-[#252538] text-white disabled:opacity-40' : 'bg-white border-zinc-300 text-zinc-900 disabled:opacity-40'}`} />
          <button
            onClick={async () => {
              const ok = await requestNotificationPermission();
              if (!ok) return;
              sendHabitNotification('Test notifikasi', 'Jika kamu melihat ini, notifikasi sudah aktif.', '🔔');
            }}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold border ${isDarkMode ? 'bg-[#1a1a28] border-[#2e2e40] text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'}`}
          >
            Uji notifikasi
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExport}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all border leading-none ${
              isDarkMode
                ? 'bg-[#1b1b26] hover:bg-[#262635] text-zinc-200 hover:text-white border-[#2d2d3d]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
          >
            <MaterialIcon name="download" size={16} />
            Backup JSON
          </button>
          <button
            onClick={() => exportHabitsToCSV(habits)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all border leading-none ${
              isDarkMode
                ? 'bg-[#1b1b26] hover:bg-[#262635] text-emerald-400 hover:text-emerald-300 border-[#2d2d3d]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-emerald-600 border-zinc-300'
            }`}
          >
            <MaterialIcon name="table_view" size={16} />
            Export CSV
          </button>
          <button
            onClick={onImport}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all border leading-none ${
              isDarkMode
                ? 'bg-[#1b1b26] hover:bg-[#262635] text-zinc-200 hover:text-white border-[#2d2d3d]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
          >
            <MaterialIcon name="upload" size={16} />
            Pulihkan Data
          </button>
          <button
            onClick={onResetSample}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-full text-xs font-semibold cursor-pointer transition-all sm:ml-auto leading-none"
          >
            <MaterialIcon name="refresh" size={16} />
            Reset Contoh
          </button>
        </div>
      </div>
    </div>
  );
};
