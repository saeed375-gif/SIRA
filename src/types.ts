export type CategoryType = 'history' | 'religion' | 'geography' | 'identity' | 'memory' | 'life';

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  image?: string;
  highlight?: string;
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  englishName: string;
  distanceMeters: number;
  walkMinutes: number;
  lat: number;
  lng: number;
  category: CategoryType;
}

export interface ChallengeOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface Challenge {
  id: string;
  question: string;
  type: 'choice' | 'identify_photo' | 'order_events';
  options: ChallengeOption[];
  correctOptionId: string;
  explanation: string;
  rewardPoints: number;
}

export interface SourceCitation {
  id?: string;
  url?: string;
  isDemo?: boolean;
  title: string;
  type: 'كتاب' | 'أرشيف' | 'مقابلة' | 'مؤسسة' | 'مادة مرئية' | 'تسجيل' | 'محتوى تجريبي' | 'مخطوط تاريخي' | 'سجل وقفي' | 'توثيق معماري' | 'شهادة شفوية' | 'مرجع أثري';
  author: string;
  yearOrPeriod: string;
  quote?: string;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  category: CategoryType;
  categoryLabel: string;
  layers?: CategoryType[];
  location: {
    lat: number;
    lng: number;
  };
  quarter: string;
  shortDescription: string;
  fullStory: string;
  coverImage: string;
  gallery: Array<{ url: string; caption: string; year?: string }>;
  comparison: {
    oldImage: string;
    todayImage: string;
    oldYear: string;
    todayYear: string;
    note: string;
  };
  timeline: TimelineEvent[];
  religiousSignificance: string;
  livingMemory: string;
  audioStory: {
    title: string;
    durationSeconds: number;
    narrator: string;
    script: string;
    audioTextHighlights: Array<{ time: number; text: string }>;
  };
  nearbyPlaces: NearbyPlace[];
  challenge: Challenge;
  sources: SourceCitation[];
  nextPlaceSlug: string;
  tags: string[];
}

export interface RouteStop {
  stepNumber: number;
  placeId: string;
  placeSlug: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  highlightText: string;
  audioDuration: string;
  walkFromPrevMinutes?: number;
  storyId?: string;
  challenge?: Challenge;
}

export interface Route {
  id: string;
  slug: string;
  title: string;
  englishTitle: string;
  category?: CategoryType;
  theme?: 'tastes' | 'markets' | 'crafts' | 'sounds' | 'morning';
  isDemo?: boolean;
  subtitle: string;
  durationMinutes: number;
  distanceKm: number;
  difficulty: 'سهل' | 'متوسط' | 'جبلي';
  description: string;
  coverImage: string;
  stops: RouteStop[];
  polyline: Array<{ lat: number; lng: number }>;
  tags: string[];
}

export interface UserDiscoveryProgress {
  discoveredPlaceIds: string[];
  completedChallenges: string[];
  totalPoints: number;
  favoritePlaceIds: string[];
}


export type DailyLifeCategory = 'food' | 'craft' | 'market' | 'culture' | 'tradition' | 'people' | 'sound' | 'daily-life';
export interface LifeStory {
  id: string;
  contentType: 'story' | 'moment' | 'food' | 'craft' | 'person' | 'audio';
  category: DailyLifeCategory;
  placeId: string;
  relatedPlaces?: string[];
  title: string;
  summary: string;
  body: string;
  image: string;
  imageAlt: string;
  context?: string;
  person?: { name: string; relationship: string };
  audioUrl?: string;
  audioDurationSeconds?: number;
  audioTranscript?: string;
  videoUrl?: string;
  sources: SourceCitation[];
  tags: string[];
  isDemo: boolean;
}
