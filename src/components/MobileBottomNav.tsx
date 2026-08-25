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
    <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t px-3 py-2 ${
      isDarkMode ? 'bg-[#0f0f16]/95 border-[#1e1e2c]' : 'bg-white/95 border-zinc-200 shadow-lg'
    }`}>
      <div className="flex items-center justify-around">
        {/* 1. Calendar (Habits) */}
        <button
          onClick={() => onChangeTab('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-indigo-500 font-bold'
              : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-medium font-mono">Habits</span>
        </button>

        {/* 2. Statistics */}
        <button
          onClick={() => onChangeTab('statistics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'statistics'
              ? 'text-indigo-500 font-bold'
              : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-medium font-mono">Stats</span>
        </button>

        {/* 3. Center Big Add Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-indigo-500 active:scale-90 text-white rounded-full shadow-lg shadow-indigo-600/40 -mt-5 border-2 border-white/20 cursor-pointer transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* 4. Manage Tab */}
        <button
          onClick={() => onChangeTab('manage')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'manage'
              ? 'text-indigo-500 font-bold'
              : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-medium font-mono">Manage</span>
        </button>

        {/* 5. Profile (Placeholder action) */}
        <button
          onClick={onOpenProfile}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isDarkMode ? 'text-zinc-500 hover:text-indigo-400' : 'text-zinc-400 hover:text-indigo-600'
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-medium font-mono">Profile</span>
        </button>
      </div>
    </nav>
  );
};
