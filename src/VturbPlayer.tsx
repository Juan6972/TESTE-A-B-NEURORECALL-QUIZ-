import { Play, RotateCcw } from '@/Icons';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { clearProgress, readProgress, saveProgress, VIDEO_ID } from '@/vslProgress';

const SCRIPT_ID = 'vturb-player-script';
const SCRIPT_SRC = `https://scripts.converteai.net/8aa6c6ac-46cf-4690-add0-cb453ebdb6f0/players/${VIDEO_ID}/v4/player.js`;

// VTurb smartplayer v4's public custom-element API. Timeupdate uses detail.time,
// not the DOM video event or the legacy window.smartplayer compatibility API.
interface SmartPlayer extends HTMLElement {
  config?: { smartAutoPlay?: { items?: unknown[] } };
  setup(config: { language: string; smartAutoPlay: { items: unknown[] } }): Promise<void>;
  currentTime: number;
  duration: number;
  paused: boolean;
  seek(time: number): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  unmute(): void;
}

export default function VturbPlayer({ onProgress }: { onProgress: (time: number) => void }) {
  const playerRef = useRef<SmartPlayer | null>(null);
  const [initialProgress] = useState(readProgress);
  const [resumeProgress, setResumeProgress] = useState(initialProgress);
  const waitingForChoice = useRef(Boolean(initialProgress));
  const hasEnded = useRef(false);
  const isReady = useRef(false);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Replace the native 30-day resume controller so only our seven-day record and
  // one overlay control returning viewers. Keep fresh-visit autoplay settings.
  // On return, disable smart autoplay before setup, so it cannot reset a seek or
  // start audio behind the choice. custom-config is supported by VTurb v4.
  const customConfig = useMemo(() => JSON.stringify({
    language: 'en',
    resume: {
      active: false,
      title: "You've already started watching this video",
      play: 'Continue watching',
      replay: 'Start over',
      watchedTitle: "You've finished watching this video",
      watchedReplay: 'Watch again',
    },
    ...(initialProgress ? { smartAutoPlay: { active: false } } : {}),
  }), [initialProgress]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    let lastSaveAt = 0;
    let localized = false;

    const persist = () => {
      if (!isReady.current || waitingForChoice.current || hasEnded.current) return;
      saveProgress(player.currentTime, player.duration);
    };
    const onReady = () => {
      const items = player.config?.smartAutoPlay?.items;
      if (!localized && items) {
        localized = true;
        const translations: Record<string, string> = {
          'Seu vídeo já começou': 'Your video has already started',
          'Clique para ouvir': 'Click to unmute',
        };
        const original = JSON.stringify(items);
        const translated = JSON.parse(original, (_key, value) =>
          typeof value === 'string' ? translations[value] ?? value : value);
        if (JSON.stringify(translated) !== original) {
          // Keep VTurb's original artwork, layout and IDs; translate text only.
          void player.setup({ language: 'en', smartAutoPlay: { items: translated } });
        }
      }
      isReady.current = true;
      setReady(true);
      if (waitingForChoice.current) player.pause();
    };
    const onTimeUpdate = (event: Event) => {
      if (waitingForChoice.current || hasEnded.current) return;
      const time = (event as CustomEvent<{ time: number }>).detail.time;
      if (!Number.isFinite(time)) return;
      onProgress(time);
      if (Number.isFinite(player.duration) && player.duration > 0 && time >= player.duration - 5) {
        clearProgress();
        return;
      }
      if (time > 5 && Date.now() - lastSaveAt >= 2000) {
        saveProgress(time, player.duration);
        lastSaveAt = Date.now();
      }
    };
    const onPlay = () => {
      if (waitingForChoice.current) player.pause();
      else hasEnded.current = false;
    };
    const onEnded = () => {
      hasEnded.current = true;
      clearProgress();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const progress = readProgress();
      if (!progress) return;
      // Back/forward cache restores React without mounting it again.
      waitingForChoice.current = true;
      player.pause();
      setResumeProgress(progress);
    };
    const onScriptError = () => setError('The video could not load. Please refresh the page to try again.');

    player.addEventListener('player:ready', onReady);
    player.addEventListener('video:timeupdate', onTimeUpdate);
    player.addEventListener('video:play', onPlay);
    player.addEventListener('video:ended', onEnded);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', persist);
    window.addEventListener('beforeunload', persist);
    window.addEventListener('pageshow', onPageShow);

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'text/javascript';
      script.src = SCRIPT_SRC;
      script.async = true;
      script.addEventListener('error', onScriptError);
      document.head.appendChild(script);
    } else {
      script.addEventListener('error', onScriptError);
    }

    return () => {
      persist();
      player.removeEventListener('player:ready', onReady);
      player.removeEventListener('video:timeupdate', onTimeUpdate);
      player.removeEventListener('video:play', onPlay);
      player.removeEventListener('video:ended', onEnded);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', persist);
      window.removeEventListener('beforeunload', persist);
      window.removeEventListener('pageshow', onPageShow);
      script.removeEventListener('error', onScriptError);
    };
  }, [onProgress]);

  const startPlayback = async (restart: boolean) => {
    const player = playerRef.current;
    if (!player || !ready || starting || !resumeProgress) return;
    setStarting(true);
    setError('');
    try {
      const time = restart ? 0 : resumeProgress.time;
      if (restart) clearProgress();
      // seek() waits for VTurb readiness. Both calls stay in this user-click flow;
      // no script reload, synthetic click or tracking event is needed.
      await player.seek(time);
      waitingForChoice.current = false;
      hasEnded.current = false;
      player.unmute();
      await player.play();
      // VTurb logs some playback failures instead of rejecting play().
      if (player.paused) throw new Error('VTurb playback did not start');
      onProgress(time);
      setResumeProgress(null);
    } catch {
      waitingForChoice.current = true;
      setError('The video could not start. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className={`vsl-player-shell${ready ? ' is-ready' : ''}`}>
      {createElement('vturb-smartplayer', {
        id: `vid-${VIDEO_ID}`,
        ref: playerRef,
        'custom-config': customConfig,
      }, createElement('div', { className: 'vturb-player-placeholder' }))}
      {resumeProgress && (
        <div className="vsl-resume-overlay">
          <div className="vsl-resume-panel" role="group" aria-labelledby="vsl-resume-title" aria-busy={!ready || starting}>
            <h2 id="vsl-resume-title">Ready to keep watching?</h2>
            <button className="vsl-resume-continue" type="button" disabled={!ready || starting} onClick={() => void startPlayback(false)}>
              <span className="vsl-resume-icon" aria-hidden="true"><Play /></span>
              {starting ? 'Starting video…' : 'Continue watching'}
            </button>
            <button className="vsl-resume-restart" type="button" disabled={!ready || starting} onClick={() => void startPlayback(true)}>
              <span className="vsl-resume-icon" aria-hidden="true"><RotateCcw /></span>
              Start over
            </button>
            {!ready && !error && <p className="vsl-resume-status" role="status">Loading video…</p>}
            {error && <p className="vsl-resume-status" role="alert">{error}</p>}
          </div>
        </div>
      )}
      {!resumeProgress && error && <p className="vsl-resume-status" role="alert">{error}</p>}
    </div>
  );
}
