import React, { useState, useEffect } from 'react';
import { Habit, HabitType, FrequencyType, TimeOfDay } from '../types';
import { X, Sliders, Hash, Calendar, Archive, Bell, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { requestNotificationPermission, sendHabitNotification } from '../notification';

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
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
  const [isArchived, setIsArchived] = useState<boolean>(false);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

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
      setTimeOfDay(initialHabit.timeOfDay || 'anytime');
      setIsArchived(!!initialHabit.archived);
      setReminderEnabled(!!initialHabit.reminderEnabled);
      setReminderTime(initialHabit.reminderTime || '20:00');
      const hasAdvanced = !!(initialHabit.type === 'numeric' || initialHabit.frequency !== 'everyday' || initialHabit.timeOfDay !== 'anytime' || initialHabit.reminderEnabled || initialHabit.category !== 'Fitness');
      setShowAdvanced(hasAdvanced || !!initialHabit);
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
      setTimeOfDay('anytime');
      setIsArchived(false);
      setReminderEnabled(false);
      setReminderTime('20:00');
      setShowAdvanced(false);
    }
  }, [initialHabit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

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
      timeOfDay,
      archived: isArchived,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-overlay duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={initialHabit ? 'Ubah kebiasaan' : 'Buat kebiasaan baru'}
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-2xl w-full modal-card max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar ${
          isDarkMode ? 'bg-[#14141c] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
        style={{
          boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        <div className={`flex items-center justify-between mb-5 border-b pb-3 ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {initialHabit ? 'Ubah kebiasaan' : 'Buat kebiasaan baru'}
            </h2>
            <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {initialHabit ? 'Sesuaikan detail dan jadwal kebiasaan.' : 'Mulai dari target kecil yang mudah dijaga.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#20202c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="habit-title" className={`block text-sm font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Kebiasaan apa yang mau kamu jaga? <span aria-hidden className="text-rose-500">*</span></label>
            <input id="habit-title" type="text" required autoFocus placeholder="Mis. Minum air, baca 10 halaman..." value={name} onChange={(e) => setName(e.target.value)} className={`w-full border rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0c0c11] border-[#262638] text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
          </div>
          <div>
            <p className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Pilih ikon biar makin kamu banget</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_EMOJIS.slice(0, 8).map((em) => (
                <button type="button" key={em} aria-label={`Pilih ${em}`} aria-pressed={emoji === em} onClick={() => setEmoji(em)} className={`w-9 h-9 text-base rounded-xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${emoji === em ? 'bg-[#8338ec]/20 border-2 border-[#8338ec] scale-105' : isDarkMode ? 'bg-[#1a1a24] border border-[#262636] hover:bg-[#252535]' : 'bg-zinc-100 border border-zinc-300 hover:bg-zinc-200'}`}>{em}</button>
              ))}
            </div>
          </div>

          {/* Time of Day Direct Picker (Habit Stacking v1.1 - Promoted to main view) */}
          <div>
            <p className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Waktu pelaksanaan (Habit Stacking)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'morning', label: 'Pagi', icon: '🌤️' },
                { id: 'afternoon', label: 'Siang', icon: '☀️' },
                { id: 'evening', label: 'Malam', icon: '🌙' },
                { id: 'anytime', label: 'Bebas', icon: '🕒' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTimeOfDay(t.id as TimeOfDay)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex flex-col items-center gap-0.5 text-center ${
                    timeOfDay === t.id
                      ? 'bg-[#8338ec] text-white border-[#8338ec] shadow-md shadow-[#8338ec]/25'
                      : isDarkMode
                      ? 'bg-[#0f0f16] border-[#222230] text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${isDarkMode ? 'bg-[#0d0d13] border-[#20202e] text-zinc-300 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}
          >
            <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Pengaturan lanjutan (Target angka, Frekuensi)</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showAdvanced && (
            <div className="space-y-4 animate-in fade-in">
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border ${isDarkMode ? 'bg-[#0d0d13] border-[#20202e]' : 'bg-zinc-50 border-zinc-200'}`}>
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
                <span>✓ Centang Harian</span>
              </div>
              <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Cukup tandai selesai hari itu</p>
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
                <span>Target Angka</span>
              </div>
              <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Mis. 20 halaman / 30 menit</p>
            </button>

            <button
              type="button"
              onClick={() => setHabitType('negative')}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                habitType === 'negative'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-500 font-bold shadow-sm'
                  : isDarkMode
                  ? 'border-transparent text-zinc-400 hover:bg-[#181824]'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                <span>🛡️ Berhenti / Menahan</span>
              </div>
              <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Anti-habit: No rokok, no sugar</p>
            </button>
          </div>

          {habitType === 'numeric' && (
            <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-[#111119] border-[#252538]' : 'bg-zinc-50 border-zinc-200'}`}>
              <div>
                <label htmlFor="habit-target" className={`block text-[11px] mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Target harian</label>
                <input id="habit-target" type="number" inputMode="numeric" min={1} value={targetValue} onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))} className={`w-full border rounded-lg px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0a0a0f] border-[#28283c] text-white' : 'bg-white border-zinc-300 text-zinc-900'}`} />
              </div>
              <div>
                <label htmlFor="habit-unit" className={`block text-[11px] mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Satuannya apa?</label>
                <input id="habit-unit" type="text" placeholder="halaman, menit, ml, km" value={unit} onChange={(e) => setUnit(e.target.value)} className={`w-full border rounded-lg px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0a0a0f] border-[#28283c] text-white' : 'bg-white border-zinc-300 text-zinc-900'}`} />
              </div>
            </div>
          )}

          <div>
            <p className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Mau dijadwalkan kapan?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'everyday', label: 'Setiap hari' },
                { id: 'weekdays', label: 'Hari kerja' },
                { id: 'weekends', label: 'Akhir pekan' },
                { id: 'weekly_target', label: 'X hari/mgg' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFrequency(f.id as FrequencyType)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-center ${frequency === f.id ? 'bg-[#8338ec] text-white border-[#8338ec] font-semibold shadow-md shadow-[#8338ec]/25' : isDarkMode ? 'bg-[#101016] border-[#222230] text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {frequency === 'weekly_target' && (
              <div className={`mt-2 flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono ${isDarkMode ? 'bg-[#101016] border-[#222230]' : 'bg-zinc-100 border-zinc-200'}`}>
                <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>Target/minggu:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button type="button" key={num} onClick={() => setWeeklyTargetDays(num)} className={`w-7 h-7 rounded-lg text-xs cursor-pointer font-bold transition-all ${weeklyTargetDays === num ? 'bg-[#8338ec] text-white' : isDarkMode ? 'bg-[#1a1a24] text-zinc-400 hover:text-white' : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-200'}`}>{num}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="habit-category" className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Masuk kategori apa?</label>
              <select id="habit-category" value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0c0c11] border-[#262638] text-white' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                {PRESET_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <p className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Warna favoritmu?</p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {PRESET_COLORS.map((c) => (
                  <button type="button" key={c.hex} aria-label={c.name} aria-pressed={color === c.hex} onClick={() => setColor(c.hex)} className={`w-6 h-6 rounded-full cursor-pointer transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${color === c.hex ? 'scale-125 ring-2 ring-[#8338ec] ring-offset-2' : 'hover:scale-110 opacity-75'}`} style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Mau ganti ikon lain?</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_EMOJIS.slice(8).map((em) => (
                <button type="button" key={em} aria-label={`Pilih ${em}`} aria-pressed={emoji === em} onClick={() => setEmoji(em)} className={`w-8 h-8 text-base rounded-lg flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${emoji === em ? 'bg-[#8338ec]/20 border-2 border-[#8338ec] scale-110' : isDarkMode ? 'bg-[#1a1a24] border border-[#262636] hover:bg-[#252535]' : 'bg-zinc-100 border border-zinc-300 hover:bg-zinc-200'}`}>{em}</button>
              ))}
            </div>
          </div>

          <div className={`p-3 rounded-xl border space-y-2 ${isDarkMode ? 'bg-[#101017] border-[#222230]' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                <Bell className="w-4 h-4 text-amber-500" aria-hidden />
                <span>Ingatkan aku tiap hari</span>
              </div>
              <input type="checkbox" aria-label="Aktifkan pengingat harian" checked={reminderEnabled} onChange={(e) => handleReminderToggle(e.target.checked)} className="w-4 h-4 accent-[#8338ec] cursor-pointer rounded" />
            </div>
            {reminderEnabled && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3">
                  <label htmlFor="habit-reminder-time" className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Jam berapa enaknya?</label>
                  <input id="habit-reminder-time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className={`border rounded-lg px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0b0b10] border-[#2a2a3c] text-white' : 'bg-white border-zinc-300 text-zinc-900'}`} />
                  <button type="button" onClick={async () => {
                    const ok = await requestNotificationPermission();
                    if (!ok) return;
                    sendHabitNotification(`Pengingat: ${name || 'Kebiasaan'}`, 'Waktunya menyelesaikan kebiasaan harianmu.', emoji || '🔔');
                  }} className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1a1a28] border-[#2e2e40] text-zinc-300 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700'}`}>Coba dulu</button>
                </div>
                <p className={`text-[11px] leading-snug ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Tenang, kamu bisa atur jam sunyi di halaman Kelola. Kalau kelewat, nanti ada snooze 10 menit kok.</p>
              </div>
            )}
          </div>

          {initialHabit && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-[#111119] border-[#202030]' : 'bg-zinc-50 border-zinc-200'}`}>
              <label htmlFor="habit-archived" className={`flex items-center gap-2 text-xs cursor-pointer ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                <Archive className="w-4 h-4 text-zinc-400" aria-hidden />
                <span>Istirahat dulu dari beranda?</span>
              </label>
              <input id="habit-archived" type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} className="w-4 h-4 accent-[#8338ec] cursor-pointer rounded" />
            </div>
          )}

          </div>
          )}

          <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
            <button type="button" onClick={onClose} className={`px-4 py-2 text-xs font-medium rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#20202c]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}`}>Nanti aja</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-[#8338ec] hover:bg-[#722ed1] active:scale-95 rounded-xl transition-all shadow-lg shadow-[#8338ec]/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-2">{initialHabit ? 'Simpan ya' : 'Siap, buat sekarang!'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
