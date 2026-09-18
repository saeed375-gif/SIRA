import React, { useState, useMemo } from 'react';
import { Place, Route } from '../types';
import { Search, MapPin, Volume2, Sparkles, ChevronLeft, Heart, X, Filter } from 'lucide-react';

interface SearchViewProps {
  places: Place[];
  routes: Route[];
  onNavigate: (path: string) => void;
  favorites: string[];
}

export const SearchView: React.FC<SearchViewProps> = ({
  places,
  routes,
  onNavigate,
  favorites,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [showOnlyFavs, setShowOnlyFavs] = useState<boolean>(false);

  const quarters = ['all', 'باب العمود', 'الحرم القدسي الشريف', 'حارة النصارى', 'الحي الإسلامي'];

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.englishName.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      const matchesQuarter =
        filterQuarter === 'all' || p.quarter.includes(filterQuarter);

      const matchesFavs = !showOnlyFavs || favorites.includes(p.id);

      return matchesSearch && matchesQuarter && matchesFavs;
    });
  }, [places, searchTerm, filterQuarter, showOnlyFavs, favorites]);

  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-24 md:pb-16 text-right">
      {/* Search Header */}
      <div className="bg-[#140E2E] border-b border-[#24174B] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              فهرس ومعجم القدس الحي
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#FAF8F5] font-serif-ar">
              ابحث في ذاكرة ومعالم القدس
            </h1>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، الحارة، الحقبة التاريخية، أو الكلمات الدلالية..."
              className="w-full bg-[#18103A] border-2 border-[#3C2975] focus:border-[#E5C158] rounded-2xl py-4 pr-12 pl-12 text-sm text-[#FAF8F5] placeholder-[#7F7296] focus:outline-none transition-all shadow-2xl"
            />
            <Search className="absolute right-4 top-4 w-5 h-5 text-[#A89CB9]" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-4 top-3.5 p-1 rounded-full text-[#A89CB9] hover:text-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Quarter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs text-[#A89CB9] ml-1">الحارة:</span>
              {quarters.map((q) => (
                <button
                  key={q}
                  onClick={() => setFilterQuarter(q)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterQuarter === q
                      ? 'bg-[#E5C158] text-[#110B29] shadow-md'
                      : 'bg-[#18103A] text-[#C4B7D8] border border-[#2B1E55] hover:text-[#FAF8F5]'
                  }`}
                >
                  {q === 'all' ? 'كافة الأحياء' : q}
                </button>
              ))}
            </div>

            {/* Favorite Filter Toggle */}
            <button
              onClick={() => setShowOnlyFavs(!showOnlyFavs)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showOnlyFavs
                  ? 'bg-[#D4AF37] text-[#110B29] border-[#D4AF37]'
                  : 'bg-[#18103A] text-[#C4B7D8] border-[#2B1E55] hover:text-[#FAF8F5]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showOnlyFavs ? 'fill-current' : ''}`} />
              <span>المفضلة فقط ({favorites.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="flex items-center justify-between text-xs text-[#A89CB9]">
          <span>نتائج البحث: ({filteredPlaces.length} مكان)</span>
          {showOnlyFavs && <span className="text-[#E5C158]">تصفية المفضلة مفعّلة</span>}
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="text-center py-16 bg-[#160E36] rounded-2xl border border-[#2B1E55] p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-[#E5C158] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#FAF8F5]">لا توجد نتائج مطابقة</h3>
            <p className="text-xs text-[#A89CB9]">
              جرّب كتابة كلمات مختلفة مثل "المسجد"، "القيامة"، "باب العمود"، أو إزالة التصفية.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => onNavigate(`/place/${place.slug}`)}
                className="cursor-pointer rounded-2xl bg-[#160E36] border border-[#2B1E55] hover:border-[#D4AF37] p-4 sm:p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
              >
                <img
                  src={place.coverImage}
                  alt={place.name}
                  className="w-full sm:w-28 h-32 sm:h-24 rounded-xl object-cover border border-[#3C2975] flex-shrink-0 group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#E5C158]">
                      {place.categoryLabel} • {place.quarter}
                    </span>
                    <span className="text-xs font-num text-[#8E80A4]">
                      {place.timeline[0]?.year}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#FAF8F5] group-hover:text-[#E5C158] transition-colors truncate">
                    {place.name}
                  </h3>

                  <p className="text-xs text-[#C4B7D8] line-clamp-2 leading-relaxed">
                    {place.shortDescription}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[#A89CB9]">
                    <Volume2 className="w-3.5 h-3.5 text-[#E5C158]" />
                    <span className="font-num">
                      قصة صوتية: {Math.floor(place.audioStory.durationSeconds / 60)} دقيقة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#E5C158] group-hover:translate-x-[-4px] transition-transform mr-auto sm:mr-0">
                  <span>اكتشف المكان</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
