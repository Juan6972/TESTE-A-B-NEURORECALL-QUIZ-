import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import VturbPlayer from '@/VturbPlayer';
import { readProgress } from '@/vslProgress';
import { captureTracking, buildCheckoutUrl } from '@/tracking';
import {
  Headphones,
  Menu,
} from 'lucide-react';

const OfferSection = lazy(() => import('@/OfferSection'));

const navItems = ['CNN Headlines', 'CNN Shorts', 'TV Shows A-Z', 'CNN 10', 'TV Schedule'];

const OFFER_DELAY_MS = 2505000;
const OFFER_START_KEY = 'neurorecall_start_time';

function getRemainingDelay(): number {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(OFFER_START_KEY);
    if (stored) {
      const start = Number(stored);
      if (Number.isFinite(start) && start > 0 && start <= now) {
        const elapsed = now - start;
        return Math.max(0, OFFER_DELAY_MS - elapsed);
      }
    }
    localStorage.setItem(OFFER_START_KEY, String(now));
  } catch {
    // Keep the original visit timer working even if storage is unavailable.
  }
  return OFFER_DELAY_MS;
}

function CnnMark() {
  return <span className="cnn-mark" aria-label="CNN">CNN</span>;
}

function App() {
  const [offerVisible, setOfferVisible] = useState(false);
  const revealOfferAtTime = useCallback((time: number) => {
    if (time >= OFFER_DELAY_MS / 1000) setOfferVisible(true);
  }, []);
  const tracking = useMemo(() => captureTracking(), []);

  const checkoutLinks = useMemo(() => ({
    two: buildCheckoutUrl('https://www.jvzoo.com/b/118161/450937/99?aid=3640757', tracking),
    six: buildCheckoutUrl('https://www.jvzoo.com/b/118161/450941/99?aid=3640757', tracking),
    three: buildCheckoutUrl('https://www.jvzoo.com/b/118161/450939/99?aid=3640757', tracking),
  }), [tracking]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showoffer') === '1') {
      setOfferVisible(true);
      return;
    }

    const savedProgress = readProgress();
    if (savedProgress && savedProgress.time >= OFFER_DELAY_MS / 1000) {
      setOfferVisible(true);
      return;
    }

    const remaining = getRemainingDelay();

    if (remaining <= 0) {
      setOfferVisible(true);
      return;
    }

    const revealTimer = window.setTimeout(() => setOfferVisible(true), remaining);
    return () => window.clearTimeout(revealTimer);
  }, []);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="icon-button menu-button" aria-label="Open menu"><Menu size={22} /></button>
          <a className="brand" href="#top" aria-label="CNN Watch home"><CnnMark /><span>Watch</span></a>
          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} key={item}>{item}</a>)}
          </nav>
          <div className="header-actions">
            <button className="listen-button"><Headphones size={17} /> <span>Listen</span></button>
            <button className="signin-button">Sign in</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="watch-section">
          <header className="article-header">
            <div className="article-kicker">REPORT:</div>
            <h1>The Real Reason Bill Gates Is Investing Millions In Asia: He Discovered The "Sharp Mind Protocol"</h1>
            <p>Research connected to the University of Tokyo reveals a 13-second homemade ritual that may clear brain fog in days and support short-term memory — without relying on drugs alone.</p>
          </header>
          <div className="player vturb-player-frame" role="region" aria-label="VTurb video player">
            <VturbPlayer onProgress={revealOfferAtTime} />
          </div>
        </section>

        <div id="oferta-escondida" className={`offer-section${offerVisible ? ' is-visible' : ''}`} aria-hidden={!offerVisible}>
          {offerVisible && <Suspense fallback={null}><OfferSection checkoutLinks={checkoutLinks} /></Suspense>}
        </div>
      </main>
    </div>
  );
}

export default App;
