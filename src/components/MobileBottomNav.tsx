import React from 'react';
import { ViewTab } from '../types';
import { MaterialIcon } from './MaterialIcon';
import { IOSGlyphIcon } from './IOSGlyphIcon';

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
    <nav
      aria-label="Navigasi utama"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] transition-colors ${
        isDarkMode ? 'bg-[#0f0f16]/95 border-[#1e1e2c]' : 'bg-white/95 border-zinc-200 shadow-lg'
      }`}
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {/* Calendar Tab */}
        <button
          type="button"
          aria-current={activeTab === 'calendar' ? 'page' : undefined}
          aria-label="Habits — kalender kebiasaan"
          onClick={() => onChangeTab('calendar')}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] leading-none shrink-0 transition-all duration-200 ${
            activeTab === 'calendar'
              ? 'text-white bg-[#8338ec] shadow-lg shadow-[#8338ec]/35 scale-105'
              : isDarkMode
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
        >
          {activeTab === 'calendar' ? (
            <IOSGlyphIcon name="calendar_fill" size={26} color="#ffffff" />
          ) : (
            <MaterialIcon name="calendar_month" size={22} />
          )}
        </button>

        {/* Statistics Tab */}
        <button
          type="button"
          aria-current={activeTab === 'statistics' ? 'page' : undefined}
          aria-label="Statistik"
          onClick={() => onChangeTab('statistics')}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] leading-none shrink-0 transition-all duration-200 ${
            activeTab === 'statistics'
              ? 'text-white bg-[#8338ec] shadow-lg shadow-[#8338ec]/35 scale-105'
              : isDarkMode
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
        >
          {activeTab === 'statistics' ? (
            <IOSGlyphIcon name="chart_fill" size={26} color="#ffffff" />
          ) : (
            <MaterialIcon name="bar_chart" size={22} />
          )}
        </button>

        {/* Center Add Button (SF Symbol 30px iOS Glyph Plus) */}
        <button
          type="button"
          aria-label="Tambah kebiasaan baru"
          onClick={onOpenAddModal}
          className="flex items-center justify-center w-13 h-13 bg-[#8338ec] hover:bg-[#722ed1] active:scale-95 text-white rounded-full shadow-xl shadow-[#8338ec]/40 -mt-7 border-[3px] border-white/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white leading-none shrink-0 transition-transform"
        >
          <IOSGlyphIcon name="plus_fill" size={28} color="#ffffff" />
        </button>

        {/* Manage Tab */}
        <button
          type="button"
          aria-current={activeTab === 'manage' ? 'page' : undefined}
          aria-label="Kelola kebiasaan"
          onClick={() => onChangeTab('manage')}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] leading-none shrink-0 transition-all duration-200 ${
            activeTab === 'manage'
              ? 'text-white bg-[#8338ec] shadow-lg shadow-[#8338ec]/35 scale-105'
              : isDarkMode
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
        >
          {activeTab === 'manage' ? (
            <IOSGlyphIcon name="sliders_fill" size={26} color="#ffffff" />
          ) : (
            <MaterialIcon name="tune" size={22} />
          )}
        </button>

        {/* Profile Button */}
        <button
          type="button"
          aria-label="Profil pengguna"
          onClick={onOpenProfile}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] leading-none shrink-0 transition-all duration-200 ${
            isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
        >
          <IOSGlyphIcon name="avatar_placeholder" size={26} />
        </button>
      </div>
    </nav>
  );
};
