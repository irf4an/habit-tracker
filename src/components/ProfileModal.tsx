import React, { useState } from 'react';
import { UserProfile, Habit } from '../types';
import { calculateBadges } from '../achievements';
import { X, User, Trophy, Flame, CheckCircle2, Edit2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  habits: Habit[];
  isDarkMode?: boolean;
}

const PRESET_AVATARS = ['⚡', '🦁', '🚀', '🧘', '🎯', '🔥', '💎', '🦊', '🦉', '🦾'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  habits,
  isDarkMode = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);

  if (!isOpen) return null;

  const { level, levelTitle, totalXp, unlockedCount, totalCount } = calculateBadges(habits);

  const totalCompletions = habits.reduce(
    (acc, h) => acc + Object.keys(h.history).filter((k) => h.history[k] > 0).length,
    0
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim() || 'Champion',
      bio: bio.trim() || 'Building daily momentum 🚀',
      avatarEmoji,
    });
    setIsEditing(false);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className={`border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#12121a] border-[#8338ec]/35 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Top Header */}
        <div className={`flex items-center justify-between border-b pb-3 mb-5 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#8338ec]" />
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Profil Pengguna
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  isDarkMode
                    ? 'bg-[#181824] border-[#2b2b3b] text-zinc-300 hover:text-white'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                }`}
                title="Edit Profil"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Card Preview or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 animate-in fade-in">
            {/* Avatar Selector */}
            <div>
              <label className={`block text-xs font-mono uppercase mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Pilih Avatar Emoji
              </label>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatarEmoji(av)}
                    className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      avatarEmoji === av
                        ? 'bg-[#8338ec]/20 border-2 border-[#8338ec] scale-110'
                        : isDarkMode
                        ? 'bg-[#1a1a24] border border-[#262636] hover:bg-[#252535]'
                        : 'bg-zinc-100 border border-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-mono uppercase mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Nama Panggilan
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#8338ec] ${
                  isDarkMode
                    ? 'bg-[#0c0c11] border-[#262638] text-white'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-mono uppercase mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Bio / Motto
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. 1% better every day"
                className={`w-full border rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#8338ec] ${
                  isDarkMode
                    ? 'bg-[#0c0c11] border-[#262638] text-white'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`px-3.5 py-2 text-xs font-medium rounded-xl ${
                  isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            {/* User Identity Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8338ec]/30 to-indigo-600/20 border border-[#8338ec]/40 flex items-center justify-center text-3xl shadow-inner select-none">
                {profile.avatarEmoji}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-extrabold text-lg sm:text-xl truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {profile.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8338ec] text-white">
                    Lv.{level}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  "{profile.bio}"
                </p>
                <p className={`text-[10.5px] font-mono mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Bergabung sejak {profile.joinedDate}
                </p>
              </div>
            </div>

            {/* Level & Rank Banner */}
            <div className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-gradient-to-r from-indigo-950/40 via-[#181826] to-[#12121c] border-[#8338ec]/35'
                : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-zinc-50 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-2 font-mono">
                <div>
                  <span className="text-[10.5px] font-bold uppercase text-[#8338ec] tracking-wider block">
                    GELAR KEBIASAAN
                  </span>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{levelTitle}</h4>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{totalXp} XP</span>
                  <span className={`text-[10.5px] block ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{unlockedCount}/{totalCount} Badge</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className={`p-3 rounded-xl border text-center ${
                isDarkMode ? 'bg-[#0f0f15] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className={`text-[10.5px] uppercase ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Selesai</span>
                <div className={`text-2xl font-bold font-sans mt-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{totalCompletions}x</div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isDarkMode ? 'bg-[#0f0f15] border-[#1e1e28]' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className={`text-[10.5px] uppercase ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Habit Aktif</span>
                <div className={`text-2xl font-bold font-sans mt-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{habits.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
