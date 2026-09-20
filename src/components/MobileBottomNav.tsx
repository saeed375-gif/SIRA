import React from 'react';
import { Compass, Map, Navigation, Search, Gamepad2 } from 'lucide-react';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  favoritesCount,
}) => {
  const tabs = [
    { path: '/', label: 'الرئيسية', icon: Compass },
    { path: '/explore', label: 'استكشف', icon: Map },
    { path: '/routes', label: 'المسارات', icon: Navigation },
    { path: '/games', label: 'ألعاب', icon: Gamepad2 },
    { path: '/search', label: 'بحث', icon: Search, badge: favoritesCount > 0 ? favoritesCount : undefined },
  ];

  return (
    <div className="sira-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#110B29]/95 backdrop-blur-xl border-t border-[#261A4E] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path ||
            (tab.path !== '/' && currentPath.startsWith(tab.path)) ||
            (tab.path === '/explore' && currentPath.startsWith('/place/'));
          return (
            <button
              key={tab.path}
              id={`mobile-tab-${tab.label}`}
              onClick={() => onNavigate(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.path === '/search' && favoritesCount > 0 ? `بحث، لديك ${favoritesCount} أماكن مفضلة` : tab.label}
              className="min-w-0 min-h-12 flex-1 flex flex-col items-center justify-center py-1 px-1 sm:px-3 relative group focus:outline-none"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#D4AF37] text-[#110B29] scale-110 shadow-lg shadow-[#D4AF37]/30' : 'text-[#8E80A4] group-hover:text-[#FAF8F5]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-bold mt-1 transition-colors ${
                  isActive ? 'text-[#E5C158]' : 'text-[#8E80A4]'
                }`}
              >
                {tab.label}
              </span>
              {tab.badge !== undefined && (
                <span className="absolute top-0.5 right-[22%] w-4 h-4 rounded-full bg-[#E5C158] text-[#110B29] text-[9px] font-bold flex items-center justify-center font-num">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
