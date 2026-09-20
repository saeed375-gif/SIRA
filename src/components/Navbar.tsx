import React, { useState } from 'react';
import { Compass, Map, Navigation, Info, Search, Sparkles, Menu, X, Gamepad2 } from 'lucide-react';
import { UserDiscoveryProgress } from '../types';
import { SiraLogo } from './SiraLogo';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  progress: UserDiscoveryProgress;
  totalPlacesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  progress,
  totalPlacesCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Compass },
    { path: '/explore', label: 'استكشف الخريطة', icon: Map },
    { path: '/routes', label: 'المسارات', icon: Navigation },
    { path: '/games', label: 'الألعاب التفاعلية', icon: Gamepad2 },
    { path: '/search', label: 'بحث', icon: Search },
    { path: '/about', label: 'عن سيرة', icon: Info },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const discoveredCount = progress.discoveredPlaceIds.length;
  const progressPercent = Math.round((discoveredCount / totalPlacesCount) * 100) || 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#110B29]/95 backdrop-blur-xl border-b border-[#261A4E] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo (Sira) */}
        <button
          onClick={() => handleNavClick('/')}
          aria-label="سيرة — الصفحة الرئيسية"
          className="flex shrink-0 items-center gap-3 text-right group focus-visible:outline-2 focus-visible:outline-[#E5C158] focus-visible:outline-offset-4 rounded-xl"
        >
          <SiraLogo className="w-14 h-14 border border-[#D4AF37]/40 group-hover:border-[#E5C158] transition-colors" />

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors font-serif-ar">
                سـيرة
              </span>
              <span className="text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/40 px-1.5 py-0.2 rounded font-num uppercase">
                Sira
              </span>
            </div>
            <span className="text-[10px] text-[#A89CB9] font-medium tracking-wide">
              عِش حكاية القدس
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#160E36]/80 p-1.5 rounded-2xl border border-[#2B1E55]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#110B29] shadow-md shadow-[#D4AF37]/20'
                    : 'text-[#C4B7D8] hover:text-[#FAF8F5] hover:bg-[#251854]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#110B29]' : 'text-[#E5C158]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Discovery Progress Badge & Actions */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Discovery Progress Pill */}
          <div
            onClick={() => handleNavClick('/explore')}
            className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#160E36] border border-[#3C2975] hover:border-[#D4AF37]/50 transition-all"
            title="معدل استكشافك لمعالم القدس"
          >
            <div className="flex items-center gap-1 text-[#E5C158]">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span className="text-xs font-bold font-num">
                {discoveredCount} / {totalPlacesCount}
              </span>
            </div>

            {/* Visual Mini Progress Dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPlacesCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx < discoveredCount ? 'bg-[#E5C158]' : 'bg-[#3C2975]'
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-bold text-[#C4B7D8] border-r border-[#2F2160] pr-2 mr-0.5">
              {progress.totalPoints} نقطة
            </span>
          </div>

          {/* Direct CTA */}
          <button
            onClick={() => handleNavClick('/routes/journey-in-heart-of-jerusalem')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFE79A] text-[#110B29] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>ابدأ رحلتك</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden w-11 h-11 grid place-items-center rounded-xl bg-[#160E36] border border-[#2B1E55] text-[#FAF8F5] focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#261A4E] bg-[#140E2E]/98 p-4 space-y-2 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#110B29]'
                    : 'text-[#D8CDE8] hover:bg-[#1E1344]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#E5C158]" />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="text-xs bg-[#110B29]/30 px-2 py-0.5 rounded">الحالي</span>}
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#2B1E55] flex items-center justify-between text-xs text-[#A89CB9] px-1">
            <span>اكتشفت: {discoveredCount} من {totalPlacesCount} أماكن</span>
            <span className="text-[#E5C158] font-bold font-num">{progress.totalPoints} نقطة اكتشاف</span>
          </div>
        </div>
      )}
    </header>
  );
};
