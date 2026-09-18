/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { JERUSALEM_PLACES, JERUSALEM_ROUTES } from './data/jerusalemData';
import { LIFE_ROUTES } from './data/lifeData';
import { MomentView } from './components/LifeExperience';
import { Place, Route, UserDiscoveryProgress } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { PlaceDetailView } from './views/PlaceDetailView';
import { RoutesView } from './views/RoutesView';
import { RouteDetailView } from './views/RouteDetailView';
import { SearchView } from './views/SearchView';
import { AboutView } from './views/AboutView';
import { GamesView } from './views/GamesView';
import { loadSiraDatabaseData } from './services/siraData';
import { Heart, Sparkles, MapPin, Compass, Navigation } from 'lucide-react';

const STATIC_ALL_ROUTES = [...JERUSALEM_ROUTES, ...LIFE_ROUTES];
const STORAGE_KEY_PROGRESS = 'sira_discovery_progress_v1';
const STORAGE_KEY_FAVS = 'sira_favorites_v1';

export default function App() {
  // Current Route Path
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search + window.location.hash;
  });

  const path = currentPath.split(/[?#]/)[0];
  const params = new URLSearchParams(currentPath.split('?')[1]?.split('#')[0] || '');

  // Runtime data starts from the exact existing frontend objects, then Supabase overlays
  // the editable core fields. This preserves the map/routes/challenge IDs used by the UI.
  const [places, setPlaces] = useState<Place[]>(JERUSALEM_PLACES);
  const [routes, setRoutes] = useState<Route[]>(STATIC_ALL_ROUTES);

  // Selected Place state for map synchronicity
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => JERUSALEM_PLACES.find(p => p.slug === new URLSearchParams(window.location.search).get('place')) || JERUSALEM_PLACES[0]);

  useEffect(() => {
    let active = true;
    loadSiraDatabaseData()
      .then((data) => {
        if (!active) return;
        setPlaces(data.places);
        setRoutes(data.routes);
        const requestedSlug = new URLSearchParams(window.location.search).get('place');
        setSelectedPlace(data.places.find((p) => p.slug === requestedSlug) || data.places[0] || null);
      })
      .catch((error) => {
        // Keep the exact local content as a safe fallback instead of breaking the interface/map.
        console.warn('[Sira] Supabase data overlay unavailable; using bundled content.', error);
      });
    return () => { active = false; };
  }, []);

  // User Discovery Progress state (Points, Discovered Places, Completed Challenges)
  const [progress, setProgress] = useState<UserDiscoveryProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      totalPoints: 50,
      discoveredPlaceIds: ['bab-al-amoud'], // Bab al-Amoud discovered by default
      completedChallenges: [],
      favoritePlaceIds: [],
    };
  });

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['al-aqsa-mosque', 'bab-al-amoud'];
  });

  // Keep progress synced to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (e) {}
  }, [progress]);

  // Keep favorites synced to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  // Browser Navigation / History support
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search + window.location.hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      if (!path.includes('#')) window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    const requested = places.find(p => p.slug === params.get('place'));
    if (path === '/explore' && requested) setSelectedPlace(requested);
    const hash = currentPath.split('#')[1];
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }));
  }, [currentPath]);

  // Toggle Favorite
  const toggleFavorite = (placeId: string) => {
    setFavorites((prev) => {
      if (prev.includes(placeId)) {
        return prev.filter((id) => id !== placeId);
      } else {
        return [...prev, placeId];
      }
    });
  };

  // Challenge Completion Handler
  const handlePlaceChallengeSuccess = (placeId: string, points: number) => {
    setProgress((prev) => {
      if ((prev.completedChallenges || []).includes(placeId)) {
        return prev;
      }
      return {
        ...prev,
        totalPoints: prev.totalPoints + points,
        completedChallenges: [...(prev.completedChallenges || []), placeId],
        discoveredPlaceIds: !places.some(p => p.id === placeId) || prev.discoveredPlaceIds.includes(placeId)
          ? prev.discoveredPlaceIds
          : [...prev.discoveredPlaceIds, placeId],
      };
    });
  };

  // Mark place as discovered on visit
  const handleDiscoverPlace = (place: Place) => {
    setSelectedPlace(place);
    setProgress((prev) => {
      if (!prev.discoveredPlaceIds.includes(place.id)) {
        return {
          ...prev,
          totalPoints: prev.totalPoints + 20,
          discoveredPlaceIds: [...prev.discoveredPlaceIds, place.id],
        };
      }
      return prev;
    });
  };

  // Route Resolver
  const renderContent = () => {
    if (path.startsWith('/moment/')) return <MomentView id={path.split('/')[2]} onNavigate={navigate} />;
    // 1. Place Detail Route: /place/:slug
    if (path.startsWith('/place/')) {
      const slug = path.replace('/place/', '').split('/')[0];
      const foundPlace = places.find((p) => p.slug === slug);
      if (foundPlace) {
        return (
          <PlaceDetailView key={foundPlace.id}
            place={foundPlace}
            allPlaces={places}
            onNavigate={navigate}
            onPlaceChallengeSuccess={handlePlaceChallengeSuccess}
            isFavorite={favorites.includes(foundPlace.id)}
            onToggleFavorite={toggleFavorite}
          />
        );
      }
    }

    // 2. Route Detail: /routes/:slug
    if (path.startsWith('/routes/')) {
      const slug = path.replace('/routes/', '').split('/')[0];
      const foundRoute = routes.find((r) => r.slug === slug);
      if (foundRoute) {
        return (
          <RouteDetailView key={foundRoute.id}
            route={foundRoute}
            onChallengeSuccess={handlePlaceChallengeSuccess}
            places={places}
            onNavigate={navigate}
          />
        );
      }
    }

    // 3. Explore Page: /explore
    if (path === '/explore') {
      return (
        <ExploreView key={currentPath}
          initialCategory={params.get('category') || 'all'}
          places={places}
          routes={routes}
          selectedPlace={selectedPlace}
          onSelectPlace={handleDiscoverPlace}
          onNavigate={navigate}
        />
      );
    }

    // 4. Routes Index: /routes
    if (path === '/routes') {
      return (
        <RoutesView
          routes={routes}
          onNavigate={navigate}
        />
      );
    }

    // 5. Interactive games: /games
    if (path === '/games') {
      return (
        <GamesView
          places={places}
          routes={routes}
          progress={progress}
          onNavigate={navigate}
          onGameComplete={handlePlaceChallengeSuccess}
        />
      );
    }

    // 6. Search & Favorites: /search
    if (path === '/search') {
      return (
        <SearchView
          places={places}
          routes={routes}
          onNavigate={navigate}
          favorites={favorites}
        />
      );
    }

    // 7. About Page: /about
    if (path === '/about') {
      return (
        <AboutView onNavigate={navigate} />
      );
    }

    // Default / Home: /
    return (
      <HomeView
        places={places}
        routes={routes}
        progress={progress}
        onNavigate={navigate}
        onSelectPlace={handleDiscoverPlace}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] flex flex-col selection:bg-[#E5C158] selection:text-[#110B29] font-sans antialiased">
      {/* Top Main Navigation */}
      <Navbar
        currentPath={path}
        onNavigate={navigate}
        progress={progress}
        totalPlacesCount={places.length}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Global Footer (Visible on all views except full-screen map explore & route tracking) */}
      {path !== '/explore' && !path.startsWith('/routes/') && (
        <footer className="bg-[#090516] border-t border-[#201444] py-12 px-4 sm:px-6 lg:px-8 text-right">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            
            {/* Col 1: Sira Identity */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#FAF8F5] font-serif-ar">
                  سِـيـرَة | Sira
                </span>
                <span className="text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded">
                  القدس
                </span>
              </div>
              <p className="text-xs text-[#A89CB9] max-w-md leading-relaxed">
                سيرة منصة تفاعلية لاكتشاف القدس من خلال أماكنها وحكاياتها وتاريخها وجغرافيتها ودينها وذاكرتها وحياتها اليومية.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#E5C158]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>كل حجر يحمل حكاية • كل زقاق يشهد على تاريخ</span>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#FAF8F5] block mb-2">
                روابط الاستكشاف
              </span>
              <ul className="space-y-1.5 text-xs text-[#C4B7D8]">
                <li>
                  <button onClick={() => navigate('/explore')} className="hover:text-[#E5C158] transition-colors">
                    خريطة القدس الحية
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/routes')} className="hover:text-[#E5C158] transition-colors">
                    مسارات المشي في البلدة القديمة
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/games')} className="hover:text-[#E5C158] transition-colors">
                    الألعاب التفاعلية
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/search')} className="hover:text-[#E5C158] transition-colors">
                    بحث ومعجم الأماكن
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/about')} className="hover:text-[#E5C158] transition-colors">
                    فلسفة وتوثيق سيرة
                  </button>
                </li>
                <li>
                  <a href="/image-credits.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#E5C158] transition-colors">
                    مصادر الصور وتراخيصها
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Verified Places */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#FAF8F5] block mb-2">
                معالم موثقة
              </span>
              <ul className="space-y-1.5 text-xs text-[#C4B7D8]">
                {places.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate(`/place/${p.slug}`)}
                      className="hover:text-[#E5C158] transition-colors"
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="max-w-7xl mx-auto pt-6 border-t border-[#1C123D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7F7296]">
            <span>منصة «سيرة | Sira» — صُنعت بشغف لصون الهوية والذاكرة المقدسية</span>
            <span>القدس عاصمة فلسطين الأبدية</span>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentPath={path}
        onNavigate={navigate}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
