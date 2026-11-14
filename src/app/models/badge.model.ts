export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  requirement: string;
}

export const BADGE_TYPES = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
};

export const BADGES: Record<string, Badge> = {
  // 🌋 Earthquake
  'earthquake-bronze': {
    id: 'earthquake-bronze',
    name: 'Earthquake Beginner',
    emoji: '🥉',
    description: 'Completed Earthquake quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'earthquake-silver': {
    id: 'earthquake-silver',
    name: 'Earthquake Survivor',
    emoji: '🥈',
    description: 'Completed Earthquake quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'earthquake-gold': {
    id: 'earthquake-gold',
    name: 'Earthquake Expert',
    emoji: '🥇',
    description: 'Completed Earthquake quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },

  // 🌊 Tsunami
  'tsunami-bronze': {
    id: 'tsunami-bronze',
    name: 'Tsunami Beginner',
    emoji: '🥉',
    description: 'Completed Tsunami quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'tsunami-silver': {
    id: 'tsunami-silver',
    name: 'Tsunami Survivor',
    emoji: '🥈',
    description: 'Completed Tsunami quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'tsunami-gold': {
    id: 'tsunami-gold',
    name: 'Tsunami Expert',
    emoji: '🥇',
    description: 'Completed Tsunami quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },

  // 🌪️ Typhoon
  'typhoon-bronze': {
    id: 'typhoon-bronze',
    name: 'Typhoon Beginner',
    emoji: '🥉',
    description: 'Completed Typhoon quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'typhoon-silver': {
    id: 'typhoon-silver',
    name: 'Typhoon Survivor',
    emoji: '🥈',
    description: 'Completed Typhoon quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'typhoon-gold': {
    id: 'typhoon-gold',
    name: 'Typhoon Expert',
    emoji: '🥇',
    description: 'Completed Typhoon quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },

  // 💧 Flood
  'flood-bronze': {
    id: 'flood-bronze',
    name: 'Flood Beginner',
    emoji: '🥉',
    description: 'Completed Flood quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'flood-silver': {
    id: 'flood-silver',
    name: 'Flood Survivor',
    emoji: '🥈',
    description: 'Completed Flood quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'flood-gold': {
    id: 'flood-gold',
    name: 'Flood Expert',
    emoji: '🥇',
    description: 'Completed Flood quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },

  // ⚠️ Landslide
  'landslide-bronze': {
    id: 'landslide-bronze',
    name: 'Landslide Beginner',
    emoji: '🥉',
    description: 'Completed Landslide quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'landslide-silver': {
    id: 'landslide-silver',
    name: 'Landslide Survivor',
    emoji: '🥈',
    description: 'Completed Landslide quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'landslide-gold': {
    id: 'landslide-gold',
    name: 'Landslide Expert',
    emoji: '🥇',
    description: 'Completed Landslide quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },

  // 🌋 Volcanic
  'volcanic-bronze': {
    id: 'volcanic-bronze',
    name: 'Volcanic Beginner',
    emoji: '🥉',
    description: 'Completed Volcanic quiz with 60-79%',
    color: 'bg-amber-700',
    requirement: '60-79%',
  },
  'volcanic-silver': {
    id: 'volcanic-silver',
    name: 'Volcanic Survivor',
    emoji: '🥈',
    description: 'Completed Volcanic quiz with 80-89%',
    color: 'bg-gray-400',
    requirement: '80-89%',
  },
  'volcanic-gold': {
    id: 'volcanic-gold',
    name: 'Volcanic Expert',
    emoji: '🥇',
    description: 'Completed Volcanic quiz with 90-100%',
    color: 'bg-yellow-500',
    requirement: '90-100%',
  },
};

export function getBadgeForScore(disasterName: string, score: number): Badge | null {
  const key = disasterName.toLowerCase().replace('volcanic eruption','volcanic').replace(/\s+/g, '-');
  if (score >= 90) return BADGES[`${key}-gold`] || null;
  if (score >= 80) return BADGES[`${key}-silver`] || null;
  if (score >= 60) return BADGES[`${key}-bronze`] || null;
  return null;
}
