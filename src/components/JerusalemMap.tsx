import React, { useEffect, useRef, useState, useCallback } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Place, Route, RouteStop } from '../types';
import { MapPin, Navigation, Eye, EyeOff, Volume2, Compass, Layers, ChevronLeft } from 'lucide-react';

interface JerusalemMapProps {
  places: Place[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place) => void;
  activeRoute?: Route | null;
  activeStopIndex?: number;
  onSelectStop?: (stop: RouteStop, index: number) => void;
  interactive?: boolean;
  className?: string;
  zoomLevel?: number;
  centerCoords?: { lat: number; lng: number };
  showControls?: boolean;
  onExplorePlace?: (placeSlug: string) => void;
  gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none';
}

type SiraMapType = 'roadmap' | 'hybrid';

// Google Maps is deliberately styled to retain Sira's midnight-and-gold identity.
const SIRA_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#140E2E' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#140E2E' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#DDD5C7' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#E5C158' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#E5C158' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1B143A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#261A4E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#36246E' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#B6A68E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A2675' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#E5C158' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090518' }] },
];

let configuredKey: string | undefined;

export const JerusalemMap: React.FC<JerusalemMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  activeRoute,
  activeStopIndex,
  onSelectStop,
  interactive = true,
  className = 'w-full h-full min-h-[450px]',
  zoomLevel = 16,
  centerCoords = { lat: 31.7788, lng: 35.2315 }, // Center of Jerusalem Old City
  showControls = true,
  onExplorePlace,
  gestureHandling = 'cooperative',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<google.maps.Polyline | null>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<SiraMapType>('roadmap');
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [overlaysVisible, setOverlaysVisible] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(max-width: 640px)').matches
  );
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY?.trim();

  // Helper to create SVG data URL for custom Sira Pin Marker
  const createMarkerIcon = useCallback((
    isSelected: boolean,
    isHovered: boolean,
    badgeNumber?: number | string,
    isRouteStop?: boolean
  ): google.maps.Icon => {
    const size = isSelected ? 48 : isHovered ? 44 : 38;
    const gold = '#E5C158';
    const darkPurple = '#160E36';
    const deepPurple = '#2A1A5E';
    const strokeColor = isSelected ? '#FFE79A' : isHovered ? '#FFFFFF' : gold;
    const glowFilter = isSelected
      ? `<filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
           <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
           <feMerge>
             <feMergeNode in="coloredBlur"/>
             <feMergeNode in="SourceGraphic"/>
           </feMerge>
         </filter>`
      : '';

    const labelText = badgeNumber !== undefined ? (typeof badgeNumber === 'number' ? String(badgeNumber).padStart(2, '0') : badgeNumber) : '';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 48 58">
        <defs>
          ${glowFilter}
          <radialGradient id="pinGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="${isRouteStop ? '#D4AF37' : deepPurple}"/>
            <stop offset="100%" stop-color="${darkPurple}"/>
          </radialGradient>
        </defs>
        ${isSelected ? `<circle cx="24" cy="24" r="23" fill="none" stroke="${gold}" stroke-width="2" opacity="0.6" stroke-dasharray="4 3" />` : ''}
        <g ${isSelected ? 'filter="url(#glow)"' : ''}>
          <!-- Pin body -->
          <path d="M24 2C13.5 2 5 10.5 5 21C5 34 24 54 24 54C24 54 43 34 43 21C43 10.5 34.5 2 24 2Z" 
                fill="url(#pinGrad)" 
                stroke="${strokeColor}" 
                stroke-width="${isSelected ? 3 : 2}" />
          <!-- Inner circle -->
          <circle cx="24" cy="21" r="${badgeNumber !== undefined ? 13 : 8}" fill="${isRouteStop ? '#160E36' : gold}" />
          ${labelText ? `
            <text x="24" y="26" 
                  font-family="'Plus Jakarta Sans', sans-serif" 
                  font-weight="700" 
                  font-size="12" 
                  fill="${gold}" 
                  text-anchor="middle">${labelText}</text>
          ` : `
            <circle cx="24" cy="21" r="4" fill="${darkPurple}" />
          `}
        </g>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, size + 10),
      anchor: new google.maps.Point(size / 2, size + 8),
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!apiKey) {
        setLoadError('لم يتم ضبط مفتاح Google Maps.');
        return;
      }

      try {
        if (configuredKey !== apiKey) {
          setOptions({ key: apiKey, v: 'weekly', language: 'ar' });
          configuredKey = apiKey;
        }
        await importLibrary('maps');
        if (!isMounted || !mapContainerRef.current) return;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: centerCoords,
          zoom: zoomLevel,
          disableDefaultUI: !showControls,
          zoomControl: showControls,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: SIRA_MAP_STYLES,
          gestureHandling: interactive ? gestureHandling : 'none',
          backgroundColor: '#140E2E',
          minZoom: 13,
          maxZoom: 20,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err: any) {
        console.error('Failed to load Google Maps:', err);
        if (isMounted) setLoadError(err?.message || 'تعذر تحميل خريطة Google Maps');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.clear();
      mapInstanceRef.current = null;
    };
  }, [apiKey]);

  // Update center and zoom when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    if (selectedPlace) {
      mapInstanceRef.current.panTo(selectedPlace.location);
      mapInstanceRef.current.setZoom(17);
    } else if (centerCoords) {
      mapInstanceRef.current.panTo(centerCoords);
    }
  }, [selectedPlace, centerCoords, mapLoaded]);

  const toggleMapStyle = () => {
    if (!mapInstanceRef.current) return;
    const nextType: SiraMapType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(nextType === 'hybrid' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP);
    if (nextType === 'roadmap') mapInstanceRef.current.setOptions({ styles: SIRA_MAP_STYLES });
    setMapType(nextType);
  };

  // Render & update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isHovered = hoveredPlaceId === place.id;

      // Check if place is part of active route
      let routeBadge: number | undefined = undefined;
      if (activeRoute) {
        const currentStop = activeStopIndex !== undefined ? activeRoute.stops[activeStopIndex] : undefined;
        const stop = currentStop?.placeId === place.id ? currentStop : activeRoute.stops.find((s) => s.placeId === place.id || s.placeSlug === place.slug);
        if (stop) {
          routeBadge = stop.stepNumber;
        }
      }

      const icon = createMarkerIcon(isSelected, isHovered, routeBadge || (place.layers?.includes('life') ? '•' : undefined), !!routeBadge);

      const marker = new google.maps.Marker({
        position: place.location,
        map,
        title: place.name,
        icon,
        zIndex: isSelected ? 100 : routeBadge ? 50 : 10,
        animation: isSelected && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? google.maps.Animation.DROP : undefined,
      });

      marker.addListener('click', () => {
        setOverlaysVisible(true);
        if (onSelectPlace) {
          onSelectPlace(place);
        }
        if (activeRoute && onSelectStop) {
          const index = activeRoute.stops.findIndex(s => s.placeId === place.id);
          if (index >= 0) onSelectStop(activeRoute.stops[index], index);
        }
        map.panTo(place.location);
      });

      marker.addListener('mouseover', () => {
        setHoveredPlaceId(place.id);
      });

      marker.addListener('mouseout', () => {
        setHoveredPlaceId(null);
      });

      markersRef.current.set(place.id, marker);
    });
  }, [places, selectedPlace, hoveredPlaceId, activeRoute, mapLoaded, createMarkerIcon, onSelectPlace, onSelectStop, activeStopIndex]);

  // Render Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;

    // Clean up old polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      routeGlowPolylineRef.current.setMap(null);
      routeGlowPolylineRef.current = null;
    }

    if (activeRoute && activeRoute.polyline && activeRoute.polyline.length > 0) {
      // Glow underlay polyline
      const glowLine = new google.maps.Polyline({
        path: activeRoute.polyline,
        geodesic: true,
        strokeColor: '#D4AF37',
        strokeOpacity: 0.35,
        strokeWeight: 10,
        map,
      });
      routeGlowPolylineRef.current = glowLine;

      // Crisp gold route polyline
      const line = new google.maps.Polyline({
        path: activeRoute.polyline,
        geodesic: true,
        strokeColor: '#E5C158',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        map,
      });
      routePolylineRef.current = line;

      // Fit bounds to show entire route comfortably
      const bounds = new google.maps.LatLngBounds();
      activeRoute.polyline.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [activeRoute, mapLoaded]);

  // Recenter to Old City heart
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: 31.7788, lng: 35.2315 });
      mapInstanceRef.current.setZoom(16);
    }
  };

  return (
    <div className={`sira-map-shell relative isolate z-0 overflow-hidden rounded-2xl border border-[#2B1E55] bg-[#110B29] ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[180px]" />

      {/* Loading Overlay */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center bg-[#110B29]/90 backdrop-blur-md text-[#FAF8F5]">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#E5C158] animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-semibold text-[#FAF8F5]">جاري تحميل خريطة القدس الحية...</p>
          <span className="text-xs text-[#A89CB9] mt-1">Google Maps Platform • منصة سيرة</span>
        </div>
      )}

      {/* Error State Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center p-6 text-center bg-[#140E36] text-[#FAF8F5]">
          <MapPin className="w-12 h-12 text-[#E5C158] mb-3" />
          <h3 className="text-xl font-bold mb-2">خريطة القدس التفاعلية</h3>
          <p className="text-sm text-[#D3C7E3] max-w-md mb-4 leading-relaxed">
            تم ضبط إحداثيات ومسارات القدس بدقة. يمكنك استكشاف المواقع التفاعلية مباشرة.
          </p>
        </div>
      )}

      {/* Floating controls remain inside the map, including the restored cards toggle. */}
      {mapLoaded && (
        <div className="absolute top-2 left-14 sm:top-4 sm:left-16 z-[1001] flex items-center gap-1.5 sm:gap-2">
          {showControls && (
            <button
              id="map-style-toggle"
              onClick={toggleMapStyle}
              className="min-w-10 min-h-10 flex items-center justify-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-xs font-semibold text-[#FAF8F5] border border-[#3C2975] shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="تبديل نمط الخريطة"
              aria-label={mapType === 'roadmap' ? 'عرض صور الأقمار الصناعية' : 'عرض خريطة الشوارع'}
            >
              <Layers className="w-4 h-4 text-[#E5C158]" />
              <span className="hidden sm:inline">{mapType === 'roadmap' ? 'قمر صناعي' : 'خريطة الشوارع'}</span>
            </button>
          )}
          {showControls && (
            <button
              id="map-recenter-btn"
              onClick={handleRecenter}
              className="w-10 h-10 grid place-items-center rounded-xl bg-[#160E36]/90 hover:bg-[#251854] text-[#E5C158] border border-[#3C2975] shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="إعادة التمركز في قلب البلدة القديمة"
              aria-label="إعادة تمركز الخريطة في قلب البلدة القديمة"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
          {(selectedPlace || activeRoute) && (
            <button
              id="map-overlays-toggle"
              onClick={() => setOverlaysVisible((visible) => !visible)}
              aria-pressed={!overlaysVisible}
              aria-label={overlaysVisible ? 'إخفاء بطاقات المعلومات عن الخريطة' : 'إظهار بطاقات المعلومات على الخريطة'}
              className={`min-w-10 min-h-10 flex items-center justify-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border shadow-xl backdrop-blur-md transition-all active:scale-95 ${overlaysVisible ? 'bg-[#160E36]/90 text-[#FAF8F5] border-[#3C2975] hover:bg-[#251854]' : 'bg-[#E5C158] text-[#110B29] border-[#E5C158]'}`}
              title={overlaysVisible ? 'إخفاء بطاقات المكان والمسار' : 'إظهار بطاقات المكان والمسار'}
            >
              {overlaysVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{overlaysVisible ? 'إخفاء البطاقات' : 'إظهار البطاقات'}</span>
            </button>
          )}
        </div>
      )}

      {/* Route Info Badge (if active route) */}
      {activeRoute && overlaysVisible && (
        <div className="hidden md:block absolute top-4 right-4 z-[1000] max-w-xs md:max-w-sm rounded-2xl bg-[#160E36]/95 border border-[#D4AF37]/40 p-3 shadow-2xl backdrop-blur-md text-right">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E5C158] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              <Navigation className="w-3 h-3" />
              مسار حي على الخريطة
            </span>
            <span className="text-[11px] font-num text-[#A89CB9]">
              {activeRoute.distanceKm} كم • {activeRoute.durationMinutes} دقيقة مشياً
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#FAF8F5] leading-snug">{activeRoute.title}</h4>
          <p className="text-[11px] text-[#C4B7D8] line-clamp-1 mt-0.5">{activeRoute.subtitle}</p>
        </div>
      )}

      {/* Selected Place Live Preview Card (Matching Poster Al-Aqsa Card) */}
      {selectedPlace && overlaysVisible && (
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-96 z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-[#160E36]/95 border border-[#E5C158]/50 shadow-2xl backdrop-blur-xl p-3 sm:p-4 overflow-hidden relative group">
            {/* Subtle Golden Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="hidden md:flex items-start gap-3">
              {/* Place Thumbnail */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-[#44307E]">
                <img
                  src={selectedPlace.coverImage}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-[#110B29]/80 text-[#E5C158] px-1.5 py-0.5 rounded backdrop-blur-xs">
                  {selectedPlace.categoryLabel.split(' ')[0]}
                </span>
              </div>

              {/* Place Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-medium text-[#D4AF37] tracking-wide">
                    {selectedPlace.quarter}
                  </span>
                  <span className="text-[10px] font-num text-[#8E80A4]">
                    {selectedPlace.location.lat.toFixed(4)}°N
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#FAF8F5] truncate mt-0.5">
                  {selectedPlace.name}
                </h4>
                <p className="text-[11px] text-[#A89CB9] truncate font-num">
                  {selectedPlace.englishName}
                </p>

                <p className="text-xs text-[#D8CDE8] line-clamp-2 mt-1 leading-relaxed">
                  {selectedPlace.shortDescription}
                </p>
              </div>
            </div>

            <h4 className="md:hidden text-sm font-bold">{selectedPlace.name}</h4>
            {/* Actions Bar */}
            <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-[#2D1F5B] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#E5C158]">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-num text-[10px]">
                  {Math.floor(selectedPlace.audioStory.durationSeconds / 60)}:
                  {(selectedPlace.audioStory.durationSeconds % 60).toString().padStart(2, '0')} قصة صوتية
                </span>
              </div>

              <button
                id={`explore-place-btn-${selectedPlace.slug}`}
                onClick={() => onExplorePlace ? onExplorePlace(selectedPlace.slug) : window.location.assign(`/place/${selectedPlace.slug}`)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#F3D77A] text-[#110B29] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
              >
                <span>اكتشف الحكاية</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
