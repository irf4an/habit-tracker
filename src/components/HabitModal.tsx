import React, { useState, useEffect } from 'react';
import { Habit, HabitType, FrequencyType } from '../types';
import { X, Sliders, Hash, Calendar, Archive, Bell } from 'lucide-react';
import { requestNotificationPermission } from '../notification';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  initialHabit?: Habit | null;
  isDarkMode?: boolean;
}

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#3b82f6' },
  { name: 'Warm Amber', hex: '#eab308' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Coral Pink', hex: '#f43f5e' },
  { name: 'Purple Neon', hex: '#a855f7' },
  { name: 'Cyan Mint', hex: '#06b6d4' },
  { name: 'Bright Orange', hex: '#f97316' },
  { name: 'Indigo Deep', hex: '#6366f1' },
];

const PRESET_CATEGORIES = ['Health', 'Fitness', 'Learning', 'Productivity', 'Mindset', 'Finance'];
const PRESET_EMOJIS = ['💪', '📚', '🔥', '💧', '🏃', '🧘', '💻', '🎨', '🎯', '🥑', '😴', '📝', '🧘‍♂️', '🚴', '💡', '💰'];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
  isDarkMode = true,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [color, setColor] = useState('#3b82f6');
  const [category, setCategory] = useState('Fitness');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('everyday');
  const [weeklyTargetDays, setWeeklyTargetDays] = useState<number>(4);
  const [isArchived, setIsArchived] = useState<boolean>(false);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('20:00');

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name || '');
      setEmoji(initialHabit.emoji || '💪');
      setColor(initialHabit.color || '#3b82f6');
      setCategory(initialHabit.category || 'Fitness');
      setHabitType(initialHabit.type || 'boolean');
      setTargetValue(initialHabit.targetValue || (initialHabit.type === 'numeric' ? 10 : 1));
      setUnit(initialHabit.unit || '');
      setFrequency(initialHabit.frequency || 'everyday');
      setWeeklyTargetDays(initialHabit.weeklyTargetDays || 4);
      setIsArchived(!!initialHabit.archived);
      setReminderEnabled(!!initialHabit.reminderEnabled);
      setReminderTime(initialHabit.reminderTime || '20:00');
    } else {
      setName('');
      setEmoji('💪');
      setColor('#3b82f6');
      setCategory('Fitness');
      setHabitType('boolean');
      setTargetValue(1);
      setUnit('');
      setFrequency('everyday');
      setWeeklyTargetDays(4);
      setIsArchived(false);
      setReminderEnabled(false);
      setReminderTime('20:00');
    }
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleReminderToggle = async (checked: boolean) => {
    if (checked) {
      const granted = await requestNotificationPermission();
      setReminderEnabled(granted);
    } else {
      setReminderEnabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialHabit?.id,
      name: name.trim(),
      emoji,
      color,
      category,
      type: habitType,
      targetValue: habitType === 'numeric' ? Math.max(1, Number(targetValue)) : 1,
      unit: habitType === 'numeric' ? unit.trim() : undefined,
      frequency,
      weeklyTargetDays: frequency === 'weekly_target' ? weeklyTargetDays : undefined,
      archived: isArchived,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#14141c] border-[#8338ec]/35 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
        style={{
          boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        <div className={`flex items-center justify-between mb-5 border-b pb-3 ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {initialHabit ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <p className={`text-xs font-mono mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Customize tracking targets, frequency, and visual style.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#20202c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Habit Name */}
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Habit Title
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Gym Workout, Read Books, Drink Water"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 transition-colors text-sm font-medium focus:outline-none focus:border-[#8338ec] ${
                isDarkMode
                  ? 'bg-[#0c0c11] border-[#262638] text-white placeholder-zinc-600'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* Habit Type & Target (Boolean vs Numeric) */}
          <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-[#0d0d13] border-[#20202e]' : 'bg-zinc-50 border-zinc-200'}`}>
            <button
              type="button"
              onClick={() => setHabitType('boolean')}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                habitType === 'boolean'
                  ? 'bg-[#8338ec]/15 border-[#8338ec] text-[#8338ec] font-bold shadow-sm'
                  : isDarkMode
                  ? 'border-transparent text-zinc-400 hover:bg-[#181824]'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                <span>✓ Simple Yes/No</span>
              </div>
              <p className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Just mark done for the day
              </p>
            </button>

            <button
              type="button"
              onClick={() => setHabitType('numeric')}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                habitType === 'numeric'
                  ? 'bg-[#8338ec]/15 border-[#8338ec] text-[#8338ec] font-bold shadow-sm'
                  : isDarkMode
                  ? 'border-transparent text-zinc-400 hover:bg-[#181824]'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                <Hash className="w-3.5 h-3.5 text-[#8338ec]" />
                <span>Numeric Goal</span>
              </div>
              <p className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Target amount (e.g. 30 mins, 20 pages)
              </p>
            </button>
          </div>

          {/* If numeric type selected */}
          {habitType === 'numeric' && (
            <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border animate-in fade-in ${isDarkMode ? 'bg-[#111119] border-[#252538]' : 'bg-zinc-50 border-zinc-200'}`}>
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Target Daily Goal
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#8338ec] ${
                    isDarkMode ? 'bg-[#0a0a0f] border-[#28283c] text-white' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Unit Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. pages, mins, ml, km"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#8338ec] ${
                    isDarkMode ? 'bg-[#0a0a0f] border-[#28283c] text-white' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Frequency Type */}
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Frequency Schedule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'everyday', label: 'Everyday' },
                { id: 'weekdays', label: 'Weekdays' },
                { id: 'weekends', label: 'Weekends' },
                { id: 'weekly_target', label: 'X days / wk' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFrequency(f.id as FrequencyType)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-center ${
                    frequency === f.id
                      ? 'bg-[#8338ec] text-white border-[#8338ec] font-semibold shadow-md shadow-[#8338ec]/25'
                      : isDarkMode
                      ? 'bg-[#101016] border-[#222230] text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {frequency === 'weekly_target' && (
              <div className={`mt-2.5 flex items-center gap-3 p-2.5 rounded-xl border text-xs font-mono ${isDarkMode ? 'bg-[#101016] border-[#222230]' : 'bg-zinc-100 border-zinc-200'}`}>
                <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>Target days per week:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setWeeklyTargetDays(num)}
                      className={`w-7 h-7 rounded-lg text-xs cursor-pointer font-bold transition-all ${
                        weeklyTargetDays === num
                          ? 'bg-[#8338ec] text-white'
                          : isDarkMode ? 'bg-[#1a1a24] text-zinc-400 hover:text-white' : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#8338ec] ${
                  isDarkMode ? 'bg-[#0c0c11] border-[#262638] text-white' : 'bg-white border-zinc-300 text-zinc-900'
                }`}
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Color Accent
              </label>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      color === c.hex
                        ? 'scale-125 ring-2 ring-[#8338ec] ring-offset-2'
                        : 'hover:scale-110 opacity-75'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Emoji Selector */}
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Select Emoji
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {PRESET_EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 text-base rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    emoji === em
                      ? 'bg-[#8338ec]/20 border-2 border-[#8338ec] scale-110'
                      : isDarkMode
                      ? 'bg-[#1a1a24] border border-[#262636] hover:bg-[#252535]'
                      : 'bg-zinc-100 border border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Browser Push Reminder + Test send */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDarkMode ? 'bg-[#101017] border-[#222230]' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Daily Reminder</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-[#1a1a28] text-zinc-500' : 'bg-zinc-200 text-zinc-600'}`}>snooze + quiet hours</span>
              </div>
              <input type="checkbox" checked={reminderEnabled} onChange={(e) => handleReminderToggle(e.target.checked)} className="w-4 h-4 accent-[#8338ec] cursor-pointer rounded" />
            </div>
            {reminderEnabled && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Jam ingatan:</span>
                  <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className={`border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#8338ec] ${isDarkMode ? 'bg-[#0b0b10] border-[#2a2a3c] text-white' : 'bg-white border-zinc-300 text-zinc-900'}`} />
                  <button type="button" onClick={async () => {
                    const { sendHabitNotification } = await import('../notification');
                    const { requestNotificationPermission } = await import('../notification');
                    const ok = await requestNotificationPermission();
                    if (!ok) return;
                    sendHabitNotification(`Test — ${name || 'Habit'}`, 'Ini preview notifikasi pengingat harian.', emoji || '🔔');
                  }} className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${isDarkMode ? 'bg-[#1a1a28] border-[#2e2e40] text-zinc-300 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700'}`}>
                    Uji kirim
                  </button>
                </div>
                <p className={`text-[11px] leading-snug ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Atur quiet hours global di Manage → Cadangan Data. Snooze 10 menit tersedia dari notifikasi saat berbunyi.</p>
              </div>
            )}
          </div>

          {/* Archive Toggle (for editing existing) */}
          {initialHabit && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-[#111119] border-[#202030]' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                <Archive className="w-4 h-4 text-zinc-400" />
                <span>Archive this habit (hide from daily calendar)</span>
              </div>
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-4 h-4 accent-[#8338ec] cursor-pointer rounded"
              />
            </div>
          )}

          {/* Buttons */}
          <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#20202c]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#8338ec] hover:bg-[#722ed1] active:scale-95 rounded-xl transition-all shadow-lg shadow-[#8338ec]/30 cursor-pointer"
            >
              {initialHabit ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
