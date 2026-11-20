/**
 * Lesson video qualities. One 480p copy ships inside the app so every video plays offline;
 * the other qualities stream from the project's GitHub Pages site (docs/videos/<quality>/).
 */
export type VideoQuality = '144p' | '240p' | '480p' | '720p' | '1080p';

export const OFFLINE_QUALITY: VideoQuality = '480p';
export const VIDEO_HOST = 'https://imbatzyyy.github.io/Impact-Aid/videos/';
const STORAGE_KEY = 'ia.videoQuality';

export interface QualityOption { id: VideoQuality; label: string; offline: boolean; }

export const QUALITIES: readonly QualityOption[] = [
  { id: '144p', label: 'Lowest data', offline: false },
  { id: '240p', label: 'Data saver', offline: false },
  { id: '480p', label: 'Saved on your phone', offline: true },
  { id: '720p', label: 'HD', offline: false },
  { id: '1080p', label: 'Full HD', offline: false },
];

/** Megabytes each streamed file uses, rounded from docs/videos. Keyed by course `video`. Update after re-encoding. */
export const STREAM_MB: Readonly<Record<string, Readonly<Partial<Record<VideoQuality, number>>>>> = {
  'earthquake/earthquake': { '144p': 3, '240p': 3, '720p': 7, '1080p': 11 },
  'tsunami/tsunami': { '144p': 3, '240p': 3, '720p': 10, '1080p': 23 },
  'typhoon/typhoon': { '144p': 3, '240p': 5, '720p': 17, '1080p': 46 },
  'flood/floods': { '144p': 4, '240p': 6, '720p': 20, '1080p': 45 },
  'landslide/landslide': { '144p': 3, '240p': 4, '720p': 14, '1080p': 32 },
  'volcano/volcano': { '144p': 2, '240p': 3, '720p': 6, '1080p': 9 },
};

const isQuality = (value: unknown): value is VideoQuality => QUALITIES.some(q => q.id === value);

/** Where the player loads a lesson video from for the given quality. */
export function videoSrc(video: string, quality: VideoQuality): string {
  return quality === OFFLINE_QUALITY ? `assets/lessons/${video}.mp4` : `${VIDEO_HOST}${quality}/${video}.mp4`;
}

/** Approximate streaming cost for one video, or null for the offline copy or an unknown file. */
export function streamMegabytes(video: string, quality: VideoQuality): number | null {
  return quality === OFFLINE_QUALITY ? null : STREAM_MB[video]?.[quality] ?? null;
}

/** The quality this device chose last time, or the offline copy. */
export function savedQuality(): VideoQuality {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isQuality(value) ? value : OFFLINE_QUALITY;
  } catch {
    return OFFLINE_QUALITY;
  }
}

export function rememberQuality(quality: VideoQuality): void {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, quality); } catch { /* Private mode or full storage: the choice lasts this visit only. */ }
}

/** A streamed choice can't play without a connection, so an offline device starts on the saved copy. */
export function startingQuality(online: boolean): VideoQuality {
  const saved = savedQuality();
  return online || saved === OFFLINE_QUALITY ? saved : OFFLINE_QUALITY;
}
