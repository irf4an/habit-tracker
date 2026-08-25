import React, { useState } from 'react';
import { Habit } from '../types';
import { Plus, Trash2, Edit3, MoveUp, MoveDown, Download, Upload, RefreshCw, Archive, ArchiveRestore } from 'lucide-react';

interface ManageViewProps {
  habits: Habit[];
  isDarkMode?: boolean;
  onAddHabit: () => void;
  onEditHabit: (habit) => void;
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
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Manage Habits
            </h3>
            <p className={`text-[11px] font-mono mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Reorder priorities, archive inactive, or edit settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showArchived
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : isDarkMode
                  ? 'bg-[#181824] border-[#2b2b3b] text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Archived' : `Archived (${archivedHabits.length})`}</span>
            </button>

            <button
              onClick={onAddHabit}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-md shadow-[#8338ec]/25"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* LIST OF HABITS (COMPACT & CLEAN SINGLE ROW LAYOUT) */}
        <div className="space-y-2.5">
          {displayedHabits.map((habit, idx) => (
            <div
              key={habit.id}
              className={`border rounded-xl p-3 flex items-center justify-between gap-2.5 transition-all ${
                isDarkMode
                  ? 'bg-[#0f0f15] border-[#1e1e28] hover:border-[#8338ec]/40'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {/* Left Info: Index, Emoji, Name, Category */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono shrink-0 ${
                  isDarkMode ? 'bg-[#181824] text-zinc-400' : 'bg-zinc-200 text-zinc-700 font-semibold'
                }`}>
                  {idx + 1}
                </span>

                <span className="text-xl select-none shrink-0">{habit.emoji}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-xs sm:text-sm truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {habit.name}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.category && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                        isDarkMode ? 'text-zinc-400 bg-[#161622] border-[#272738]' : 'text-zinc-600 bg-zinc-200 border-zinc-300'
                      }`}>
                        {habit.category}
                      </span>
                    )}
                    {habit.type === 'numeric' && (
                      <span className="text-[9px] font-mono text-[#8338ec] bg-[#8338ec]/10 border border-[#8338ec]/20 px-1.5 py-0.2 rounded shrink-0 font-medium">
                        {habit.targetValue} {habit.unit}
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {Object.keys(habit.history).filter((k) => habit.history[k] > 0).length} check-ins logged
                  </div>
                </div>
              </div>

              {/* Right Action Icons (Compact & Clean Toolbar) */}
              <div className="flex items-center gap-1 shrink-0">
                {!showArchived && (
                  <>
                    <button
                      disabled={idx === 0}
                      onClick={() => moveHabit(idx, 'up')}
                      className={`p-1.5 disabled:opacity-20 rounded-lg transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26]'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
                      }`}
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === displayedHabits.length - 1}
                      onClick={() => moveHabit(idx, 'down')}
                      className={`p-1.5 disabled:opacity-20 rounded-lg transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26]'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
                      }`}
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => onToggleArchive(habit.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/30'
                      : 'text-zinc-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title={habit.archived ? 'Restore to calendar' : 'Archive'}
                >
                  {habit.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onEditHabit(habit)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a26]'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {displayedHabits.length === 0 && (
            <div className="text-center py-6 text-zinc-400 text-xs font-mono">
              {showArchived
                ? 'No archived habits.'
                : 'No active habits. Click "+ Add" above to create one!'}
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
        <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Data Backup & Recovery</h3>
        <p className={`text-[11px] font-mono mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Export atau import file cadangan JSON dari LocalStorage.
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
              isDarkMode
                ? 'bg-[#1b1b26] hover:bg-[#262635] text-zinc-200 hover:text-white border-[#2d2d3d]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={onImport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
              isDarkMode
                ? 'bg-[#1b1b26] hover:bg-[#262635] text-zinc-200 hover:text-white border-[#2d2d3d]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
          <button
            onClick={onResetSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold cursor-pointer transition-all sm:ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
};
