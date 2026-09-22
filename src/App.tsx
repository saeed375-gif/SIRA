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
import { GamesAuthLoading, GamesAuthView } from './views/GamesAuthView';
import { loadSiraDatabaseData } from './services/siraData';
import { loadSiraProgress, restoreSiraSession, saveSiraProgress, signOutFromSira, syncSiraProgress, type SiraSession } from './services/auth';
import { cleanGameCompletions, hasActiveGameCompletion } from './lib/gameRewards';
import { getInitialPlatformLanguage, getLanguageDirection, type PlatformLanguage } from './lib/translation';
import { Heart, Sparkles, MapPin, Compass, Navigation } from 'lucide-react';

const STATIC_ALL_ROUTES = [...JERUSALEM_ROUTES, ...LIFE_ROUTES];
const STORAGE_KEY_PROGRESS = 'sira_discovery_progress_v1';
const STORAGE_KEY_FAVS = 'sira_favorites_v1';
const STORAGE_KEY_THEME = 'sira_color_theme_v1';
type SiraTheme = 'dark' | 'light';

const DEFAULT_PROGRESS: UserDiscoveryProgress = {
  totalPoints: 50,
  discoveredPlaceIds: ['bab-al-amoud'],
  completedChallenges: [],
  favoritePlaceIds: [],
  journeys: {},
  kidsMapGame: { completedStageIds: [], stagePoints: 0 },
};

const uniqueStrings = (value: unknown, maximum = 250) => Array.from(new Set(
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 160) : [],
)).slice(0, maximum);
const uniqueNumbers = (value: unknown, maximum = 50) => Array.from(new Set(
  Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : [],
)).slice(0, maximum);

const normalizeProgress = (value: unknown): UserDiscoveryProgress => {
  const source = value && typeof value === 'object' ? value as Partial<UserDiscoveryProgress> : {};
  const sourceJourneys = source.journeys && typeof source.journeys === 'object' ? source.journeys : {};
  const journeys = Object.fromEntries(Object.entries(sourceJourneys).slice(0, 50).map(([id, journey]) => {
    const details = journey && typeof journey === 'object' ? journey : {};
    const completedAt = typeof (details as { completedAt?: unknown }).completedAt === 'string' ? (details as { completedAt: string }).completedAt : undefined;
    return [id, { revealedStopNumbers: uniqueNumbers((details as { revealedStopNumbers?: unknown }).revealedStopNumbers), ...(completedAt ? { completedAt } : {}) }];
  }));
  const kids = source.kidsMapGame && typeof source.kidsMapGame === 'object' ? source.kidsMapGame : DEFAULT_PROGRESS.kidsMapGame!;
  return {
    totalPoints: Math.max(0, Math.min(1_000_000, Math.floor(Number(source.totalPoints) || DEFAULT_PROGRESS.totalPoints))),
    discoveredPlaceIds: uniqueStrings(source.discoveredPlaceIds),
    // Game completions used to be stored permanently with other challenges.
    // Drop those legacy entries so every account starts this daily reward cycle fresh.
    completedChallenges: uniqueStrings(source.completedChallenges, 500).filter((id) => !id.startsWith('game:')),
    gameCompletions: cleanGameCompletions(source.gameCompletions),
    favoritePlaceIds: uniqueStrings(source.favoritePlaceIds),
    journeys,
    kidsMapGame: {
      completedStageIds: uniqueStrings(kids.completedStageIds, 20),
      stagePoints: Math.max(0, Math.min(10_000, Math.floor(Number(kids.stagePoints) || 0))),
      ...(kids.entryFeePaid ? { entryFeePaid: true } : {}),
    },
  };
};

const readStoredProgress = () => {
  try { return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) || 'null')); } catch { return DEFAULT_PROGRESS; }
};

const readStoredFavorites = () => {
  try { return uniqueStrings(JSON.parse(localStorage.getItem(STORAGE_KEY_FAVS) || 'null')); } catch { return ['al-aqsa-mosque', 'bab-al-amoud']; }
};

const progressSyncKey = (userId: string) => `sira_progress_sync_v1:${userId}`;

const getInitialTheme = (): SiraTheme => {
  try {
    return localStorage.getItem(STORAGE_KEY_THEME) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export default function App() {
  const [theme, setTheme] = useState<SiraTheme>(getInitialTheme);
  const [language, setLanguage] = useState<PlatformLanguage>(getInitialPlatformLanguage);
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

  // Authentication is intentionally scoped to the games experience. The rest of Sira
  // remains available to guests without creating an account.
  const [gameSession, setGameSession] = useState<SiraSession | null>(null);
  const [gameAuthStatus, setGameAuthStatus] = useState<'idle' | 'loading' | 'guest' | 'authenticated'>('idle');
  const [progressSyncReady, setProgressSyncReady] = useState(false);

  useEffect(() => {
    if (path !== '/games') return;
    let active = true;
    setGameAuthStatus('loading');
    restoreSiraSession()
      .then((session) => {
        if (!active) return;
        setGameSession(session);
        setGameAuthStatus(session ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (!active) return;
        setGameSession(null);
        setGameAuthStatus('guest');
      });
    return () => { active = false; };
  }, [path]);

  const handleGameAuthenticated = (session: SiraSession) => {
    setProgressSyncReady(false);
    setGameSession(session);
    setGameAuthStatus('authenticated');
  };

  const handleGameSignOut = async () => {
    const accessToken = gameSession?.accessToken;
    setGameSession(null);
    setProgressSyncReady(false);
    setGameAuthStatus('guest');
    try { await signOutFromSira(accessToken); } catch { /* Local session is already cleared. */ }
  };

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
  const [progress, setProgress] = useState<UserDiscoveryProgress>(readStoredProgress);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(readStoredFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch { /* The visual preference remains active for this visit. */ }
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getLanguageDirection(language);
  }, [language]);

  const toggleTheme = () => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');

  // Keep progress synced to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (e) {}
  }, [progress]);

  // A signed-in account is the source of truth across devices. On the first
  // version that supports cloud sync, safely merge each device's old local
  // balance once, then use the stored Supabase account data thereafter.
  useEffect(() => {
    let active = true;
    if (!gameSession) {
      setProgressSyncReady(false);
      return () => { active = false; };
    }

    setProgressSyncReady(false);
    const localProgress = normalizeProgress({ ...readStoredProgress(), favoritePlaceIds: readStoredFavorites() });
    const sync = async () => {
      const alreadyMigrated = localStorage.getItem(progressSyncKey(gameSession.user.id)) === '1';
      const cloudProgress = alreadyMigrated
        ? await loadSiraProgress(gameSession.accessToken)
        : await syncSiraProgress(localProgress, gameSession.accessToken);
      if (!active) return;
      if (cloudProgress) {
        const next = normalizeProgress(cloudProgress);
        setProgress(next);
        setFavorites(next.favoritePlaceIds);
      }
      if (!alreadyMigrated) localStorage.setItem(progressSyncKey(gameSession.user.id), '1');
    };

    void sync().catch((error) => console.warn('[Sira] Unable to restore cloud progress.', error)).finally(() => {
      if (active) setProgressSyncReady(true);
    });
    return () => { active = false; };
  }, [gameSession]);

  useEffect(() => {
    if (!gameSession || !progressSyncReady) return;
    const timer = window.setTimeout(() => {
      void saveSiraProgress({ ...progress, favoritePlaceIds: favorites }, gameSession.accessToken)
        .catch((error) => console.warn('[Sira] Unable to save cloud progress.', error));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [favorites, gameSession, progress, progressSyncReady]);

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
      const next = prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId];
      setProgress((current) => ({ ...current, favoritePlaceIds: next }));
      return next;
    });
  };

  // Challenge Completion Handler
  const handlePlaceChallengeSuccess = (placeId: string, points: number) => {
    if ((progress.completedChallenges || []).includes(placeId)) return false;
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
    return true;
  };

  // Games use the same platform balance shown everywhere else in Sira.
  const handleGameComplete = (gameId: string, points: number) => {
    if (hasActiveGameCompletion(progress.gameCompletions, gameId)) return false;
    setProgress((prev) => {
      if (hasActiveGameCompletion(prev.gameCompletions, gameId)) return prev;
      return {
        ...prev,
        totalPoints: prev.totalPoints + points,
        gameCompletions: { ...(prev.gameCompletions || {}), [gameId]: new Date().toISOString() },
      };
    });
    return true;
  };

  // Entering the children's map consumes 250 platform points once. Stage
  // keys are deliberately kept separate and never change the platform score.
  const handleKidsMapEntry = () => {
    const currentGame = progress.kidsMapGame || { completedStageIds: [], stagePoints: 0 };
    if (currentGame.entryFeePaid || currentGame.completedStageIds.length > 0) return true;
    if (progress.totalPoints < 250) return false;

    setProgress((prev) => {
      const kidsMapGame = prev.kidsMapGame || { completedStageIds: [], stagePoints: 0 };
      if (kidsMapGame.entryFeePaid || kidsMapGame.completedStageIds.length > 0 || prev.totalPoints < 250) return prev;
      return {
        ...prev,
        totalPoints: prev.totalPoints - 250,
        kidsMapGame: { ...kidsMapGame, entryFeePaid: true },
      };
    });
    return true;
  };

  const handleKidsMapStageComplete = (stageId: string) => {
    const isNewDailyCycle = !hasActiveGameCompletion(progress.gameCompletions, 'game:kids-map-v2')
      && Boolean(progress.gameCompletions?.['game:kids-map-v2']);
    const currentKidsMap = progress.kidsMapGame || { completedStageIds: [], stagePoints: 0 };
    if (!isNewDailyCycle && currentKidsMap.completedStageIds.includes(stageId)) return false;
    setProgress((prev) => {
      const previousKidsMap = prev.kidsMapGame || { completedStageIds: [], stagePoints: 0 };
      const resetExpiredCycle = !hasActiveGameCompletion(prev.gameCompletions, 'game:kids-map-v2')
        && Boolean(prev.gameCompletions?.['game:kids-map-v2']);
      const kidsMapGame = resetExpiredCycle
        ? { ...previousKidsMap, completedStageIds: [], stagePoints: 0 }
        : previousKidsMap;
      if (kidsMapGame.completedStageIds.includes(stageId)) return prev;
      return {
        ...prev,
        kidsMapGame: {
          ...kidsMapGame,
          completedStageIds: [...kidsMapGame.completedStageIds, stageId],
          stagePoints: kidsMapGame.stagePoints + 50,
        },
      };
    });
    return true;
  };

  const handleJourneyStopReveal = (journeyId: string, stopNumber: number) => {
    setProgress((prev) => {
      const journeys = prev.journeys || {};
      const journey = journeys[journeyId] || { revealedStopNumbers: [] };
      if (journey.revealedStopNumbers.includes(stopNumber)) return prev;
      return {
        ...prev,
        journeys: {
          ...journeys,
          [journeyId]: { ...journey, revealedStopNumbers: [...journey.revealedStopNumbers, stopNumber] },
        },
      };
    });
  };

  const handleJourneyComplete = (journeyId: string) => {
    setProgress((prev) => {
      const journeys = prev.journeys || {};
      const journey = journeys[journeyId] || { revealedStopNumbers: [] };
      if (journey.completedAt) return prev;
      return {
        ...prev,
        journeys: { ...journeys, [journeyId]: { ...journey, completedAt: new Date().toISOString() } },
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
            journeyProgress={progress.journeys?.[foundRoute.id]}
            onJourneyStopReveal={(stopNumber) => handleJourneyStopReveal(foundRoute.id, stopNumber)}
            onJourneyComplete={() => handleJourneyComplete(foundRoute.id)}
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
      if (gameAuthStatus === 'idle' || gameAuthStatus === 'loading') return <GamesAuthLoading />;
      if (!gameSession) {
        return <GamesAuthView onAuthenticated={handleGameAuthenticated} onBack={() => navigate('/')} />;
      }
      if (!progressSyncReady) return <GamesAuthLoading />;
      return (
        <GamesView
          places={places}
          routes={routes}
          progress={progress}
          onNavigate={navigate}
          onGameComplete={handleGameComplete}
          onKidsMapEntry={handleKidsMapEntry}
          onKidsMapStageComplete={handleKidsMapStageComplete}
          user={gameSession.user}
          onSignOut={handleGameSignOut}
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
    <div dir={getLanguageDirection(language)} lang={language} className={`sira-theme sira-theme-${theme} min-h-screen bg-[#0D081F] text-[#FAF8F5] flex flex-col selection:bg-[#E5C158] selection:text-[#110B29] font-sans antialiased`}>
      {/* Top Main Navigation */}
      <Navbar
        currentPath={path}
        onNavigate={navigate}
        progress={progress}
        totalPlacesCount={places.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Global Footer (Visible on all views except full-screen map explore & route tracking) */}
      {path !== '/explore' && !path.startsWith('/routes/') && (
        <footer className="sira-site-footer bg-[#090516] border-t border-[#201444] py-12 px-4 sm:px-6 lg:px-8 text-right">
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
