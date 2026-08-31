import React, { useState, useMemo } from 'react';
import { Habit, DailyMood } from '../types';
import { MaterialIcon } from './MaterialIcon';

interface ReflectionFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  isDarkMode?: boolean;
  onSaveNote: (habitId: string, dateStr: string, note: string, mood?: DailyMood) => void;
}

interface NoteEntry {
  habitId: string;
  habitName: string;
  habitEmoji: string;
  habitColor: string;
  habitCategory?: string;
  habitType?: string;
  unit?: string;
  targetValue?: number;
  dateStr: string;
  note: string;
  mood?: DailyMood;
  value: number;
}

const MOOD_EMOJIS: Record<DailyMood, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Senang' },
  energetic: { emoji: '⚡', label: 'Semangat' },
  focused: { emoji: '🔥', label: 'Fokus' },
  tired: { emoji: '😴', label: 'Lelah' },
  stressed: { emoji: '🌧️', label: 'Berat' },
};

export const ReflectionFeedModal: React.FC<ReflectionFeedModalProps> = ({
  isOpen,
  onClose,
  habits,
  isDarkMode = true,
  onSaveNote,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<NoteEntry | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editMood, setEditMood] = useState<DailyMood | undefined>(undefined);

  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  // Aggregate all notes from all habits into a single list
  const allNotes = useMemo(() => {
    const entries: NoteEntry[] = [];
    habits.forEach((habit) => {
      if (!habit.notes) return;
      Object.entries(habit.notes).forEach(([dateStr, note]) => {
        if (note && note.trim()) {
          entries.push({
            habitId: habit.id,
            habitName: habit.name,
            habitEmoji: habit.emoji,
            habitColor: habit.color,
            habitCategory: habit.category,
            habitType: habit.type,
            unit: habit.unit,
            targetValue: habit.targetValue,
            dateStr,
            note: note.trim(),
            mood: habit.moods?.[dateStr],
            value: habit.history[dateStr] || 0,
          });
        }
      });
    });

    // Sort descending by date (newest first)
    return entries.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [habits]);

  // Filter by habit, mood, and search query
  const filteredNotes = useMemo(() => {
    return allNotes.filter((entry) => {
      if (selectedHabitId !== 'all' && entry.habitId !== selectedHabitId) {
        return false;
      }
      if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNote = entry.note.toLowerCase().includes(q);
        const matchName = entry.habitName.toLowerCase().includes(q);
        const matchDate = entry.dateStr.includes(q);
        return matchNote || matchName || matchDate;
      }
      return true;
    });
  }, [allNotes, selectedHabitId, selectedMoodFilter, searchQuery]);

  if (!isOpen) return null;

  const handleStartEdit = (entry: NoteEntry) => {
    setEditingEntry(entry);
    setEditText(entry.note);
    setEditMood(entry.mood);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    onSaveNote(editingEntry.habitId, editingEntry.dateStr, editText, editMood);
    setEditingEntry(null);
  };

  const handleDeleteNote = (entry: NoteEntry) => {
    if (window.confirm(`Hapus catatan tanggal ${entry.dateStr} untuk "${entry.habitName}"?`)) {
      onSaveNote(entry.habitId, entry.dateStr, '');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Feed Jurnal Refleksi"
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl modal-card relative max-h-[90vh] flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-4 shrink-0 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8338ec]/20 border border-[#8338ec]/30 flex items-center justify-center text-[#a78bfa]">
              <MaterialIcon name="edit_note" size={24} color="#8338ec" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Jurnal Refleksi
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {allNotes.length === 0
                  ? 'Belum ada catatan yang tersimpan'
                  : `${allNotes.length} catatan refleksi tersimpan`}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup jurnal"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
              isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="space-y-2.5 mb-4 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kata kunci catatan atau tanggal (YYYY-MM-DD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
                isDarkMode
                  ? 'bg-[#0c0c11] border-[#262638] text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* Mood Filter Row (Mini Mood Tracker v1.2) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border leading-none cursor-pointer ${
                selectedMoodFilter === 'all'
                  ? 'bg-[#8338ec] border-[#8338ec] text-white shadow-xs'
                  : isDarkMode
                  ? 'bg-[#161622] border-[#262636] text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Mood
            </button>
            {(Object.keys(MOOD_EMOJIS) as DailyMood[]).map((mKey) => (
              <button
                key={mKey}
                type="button"
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === mKey ? 'all' : mKey)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all border leading-none inline-flex items-center gap-1 cursor-pointer ${
                  selectedMoodFilter === mKey
                    ? 'bg-[#8338ec] border-[#8338ec] text-white font-semibold shadow-xs'
                    : isDarkMode
                    ? 'bg-[#161622] border-[#262636] text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{MOOD_EMOJIS[mKey].emoji}</span>
                <span>{MOOD_EMOJIS[mKey].label}</span>
              </button>
            ))}
          </div>

          {/* Habit Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedHabitId('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border leading-none cursor-pointer ${
                selectedHabitId === 'all'
                  ? 'bg-[#8338ec] border-[#8338ec] text-white shadow-xs'
                  : isDarkMode
                  ? 'bg-[#161622] border-[#262636] text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Habit ({allNotes.length})
            </button>
            {habits.map((h) => {
              const count = Object.keys(h.notes || {}).filter((k) => h.notes?.[k]?.trim()).length;
              if (count === 0) return null;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHabitId(h.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all border leading-none inline-flex items-center gap-1 cursor-pointer ${
                    selectedHabitId === h.id
                      ? 'bg-[#8338ec] border-[#8338ec] text-white font-semibold shadow-xs'
                      : isDarkMode
                      ? 'bg-[#161622] border-[#262636] text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>{h.emoji}</span>
                  <span>{h.name}</span>
                  <span className="opacity-70 text-[10.5px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Notes List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          {filteredNotes.length === 0 ? (
            <div className={`text-center py-12 px-4 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2.5 ${
              isDarkMode ? 'bg-[#0e0e15] border-[#1e1e28] text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#8338ec]/10 border border-[#8338ec]/20 flex items-center justify-center text-[#8338ec]">
                <MaterialIcon name="edit_note" size={24} color="#8338ec" />
              </div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {allNotes.length === 0 ? 'Belum Ada Catatan Refleksi' : 'Tidak Ada Catatan yang Cocok'}
              </p>
              <p className="text-xs max-w-xs leading-relaxed">
                {allNotes.length === 0
                  ? 'Ketik refleksi harianmu dengan mengetuk ikon pensil di kartu kebiasaan atau klik kotak kalender.'
                  : 'Coba ganti filter kebiasaan atau kata kunci pencarian.'}
              </p>
            </div>
          ) : (
            filteredNotes.map((entry, idx) => (
              <div
                key={`${entry.habitId}-${entry.dateStr}-${idx}`}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isDarkMode
                    ? 'bg-[#151520] border-[#222234] hover:border-[#8338ec]/40'
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Entry Top Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0 leading-none">{entry.habitEmoji}</span>
                    <span className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {entry.habitName}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.habitColor }}
                    />
                    {entry.habitCategory && (
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                        isDarkMode ? 'text-zinc-300 bg-[#191928] border-[#2b2b40]' : 'text-zinc-600 bg-white border-zinc-200'
                      }`}>
                        {entry.habitCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {entry.mood && MOOD_EMOJIS[entry.mood] && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${
                          isDarkMode ? 'bg-[#1e1e30] border-[#31314a] text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'
                        }`}
                        title={`Mood: ${MOOD_EMOJIS[entry.mood].label}`}
                      >
                        <span>{MOOD_EMOJIS[entry.mood].emoji}</span>
                        <span className="text-[10px] hidden sm:inline">{MOOD_EMOJIS[entry.mood].label}</span>
                      </span>
                    )}
                    <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-[#a78bfa]' : 'text-[#8338ec]'}`}>
                      {entry.dateStr}
                    </span>
                    <button
                      type="button"
                      aria-label="Edit catatan"
                      onClick={() => handleStartEdit(entry)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border leading-none ${
                        isDarkMode ? 'text-zinc-400 hover:text-white border-transparent hover:bg-[#202030]' : 'text-zinc-600 hover:text-zinc-900 border-transparent hover:bg-zinc-200'
                      }`}
                      title="Edit catatan"
                    >
                      <MaterialIcon name="edit" size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus catatan"
                      onClick={() => handleDeleteNote(entry)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-transparent leading-none"
                      title="Hapus catatan"
                    >
                      <MaterialIcon name="delete" size={14} />
                    </button>
                  </div>
                </div>

                {/* Entry Note Text / Inline Edit */}
                {editingEntry && editingEntry.habitId === entry.habitId && editingEntry.dateStr === entry.dateStr ? (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    {/* Inline Mood Picker */}
                    <div className="flex items-center gap-1">
                      {(Object.keys(MOOD_EMOJIS) as DailyMood[]).map((mKey) => (
                        <button
                          key={mKey}
                          type="button"
                          onClick={() => setEditMood(editMood === mKey ? undefined : mKey)}
                          className={`px-2 py-1 rounded-lg text-xs border transition-all ${
                            editMood === mKey
                              ? 'bg-[#8338ec] text-white border-[#8338ec]'
                              : isDarkMode
                              ? 'bg-[#0f0f16] border-[#222234] text-zinc-400'
                              : 'bg-white border-zinc-200 text-zinc-600'
                          }`}
                        >
                          {MOOD_EMOJIS[mKey].emoji} {MOOD_EMOJIS[mKey].label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
                        isDarkMode ? 'bg-[#0a0a0f] border-[#28283c] text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingEntry(null)}
                        className={`px-3 py-1.5 text-xs rounded-lg ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-4 py-1.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-lg text-xs font-bold shadow-sm"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    "{entry.note}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReflectionFeedModal;
