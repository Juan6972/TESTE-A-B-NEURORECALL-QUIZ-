export const VIDEO_ID = '6adf45c8f9793299f8e5f7ae';
export const PROGRESS_KEY = `vsl_progress_${VIDEO_ID}`;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface VideoProgress {
  time: number;
  updatedAt: number;
  duration?: number;
}

export function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Playback must still work when storage is unavailable.
  }
}

export function readProgress(): VideoProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const progress: VideoProgress = JSON.parse(raw);
    const age = Date.now() - progress.updatedAt;
    if (
      !Number.isFinite(progress.time) || progress.time <= 5 ||
      !Number.isFinite(progress.updatedAt) || age < 0 || age > MAX_AGE_MS ||
      (progress.duration !== undefined && (
        !Number.isFinite(progress.duration) || progress.duration <= 0 ||
        progress.time >= progress.duration - 5
      ))
    ) {
      clearProgress();
      return null;
    }
    return progress;
  } catch {
    clearProgress();
    return null;
  }
}

export function saveProgress(time: number, duration?: number) {
  if (!Number.isFinite(time)) return;
  const knownDuration = duration !== undefined && Number.isFinite(duration) && duration > 0
    ? duration : undefined;
  if (knownDuration !== undefined && time >= knownDuration - 5) {
    clearProgress();
    return;
  }
  if (time <= 5) return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      time, duration: knownDuration, updatedAt: Date.now(),
    }));
  } catch {
    // Storage restrictions must not interrupt the video.
  }
}
