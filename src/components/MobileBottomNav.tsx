import React from 'react';
import { ViewTab } from '../types';
import { Calendar, BarChart3, SlidersHorizontal, Plus, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  onOpenProfile?: () => void;
  isDarkMode?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddModal,
  onOpenProfile,
  isDarkMode = true,
}) => {
  return (
    <nav aria-label="Navigasi utama" className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t px-2 py-2 ${isDarkMode ? 'bg-[#0f0f16]/95 border-[#1e1e2c]' : 'bg-white/95 border-zinc-200 shadow-lg'}`}>
      <div className="flex items-center justify-around">
        <button type="button" aria-current={activeTab === 'calendar' ? 'page' : undefined} aria-label="Habits — kalender kebiasaan" onClick={() => onChangeTab('calendar')} className={`p-2.5 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'calendar' ? 'text-white bg-[#8338ec] shadow-md shadow-[#8338ec]/25' : isDarkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}>
          <Calendar className="w-5 h-5 stroke-[2.2]" aria-hidden />
        </button>
        <button type="button" aria-current={activeTab === 'statistics' ? 'page' : undefined} aria-label="Statistik" onClick={() => onChangeTab('statistics')} className={`p-2.5 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'statistics' ? 'text-white bg-[#8338ec] shadow-md shadow-[#8338ec]/25' : isDarkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}>
          <BarChart3 className="w-5 h-5 stroke-[2.2]" aria-hidden />
        </button>
        <button type="button" aria-label="Tambah kebiasaan baru" onClick={onOpenAddModal} className="flex items-center justify-center w-11 h-11 bg-[#8338ec] hover:bg-[#722ed1] active:scale-90 text-white rounded-full shadow-lg shadow-[#8338ec]/30 -mt-6 border-2 border-white/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Plus className="w-6 h-6 stroke-[3]" aria-hidden />
        </button>
        <button type="button" aria-current={activeTab === 'manage' ? 'page' : undefined} aria-label="Kelola kebiasaan" onClick={() => onChangeTab('manage')} className={`p-2.5 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${activeTab === 'manage' ? 'text-white bg-[#8338ec] shadow-md shadow-[#8338ec]/25' : isDarkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}>
          <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" aria-hidden />
        </button>
        <button type="button" aria-label="Profil pengguna" onClick={onOpenProfile} className={`p-2.5 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}>
          <User className="w-5 h-5 stroke-[2.2]" aria-hidden />
        </button>
      </div>
    </nav>
  );
};
