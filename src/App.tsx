import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import VturbPlayer from '@/VturbPlayer';
import { captureTracking, buildCheckoutUrl } from '@/tracking';
import {
  Headphones,
  Menu,
} from 'lucide-react';

const OfferSection = lazy(() => import('@/OfferSection'));

const navItems = ['CNN Headlines', 'CNN Shorts', 'TV Shows A-Z', 'CNN 10', 'TV Schedule'];

const PITCH_SECONDS = 2760; // 46:00 on the video clock, not elapsed visit time.

function CnnMark() {
  return <span className="cnn-mark" aria-label="CNN">CNN</span>;
}

function App() {
  const [offerVisible, setOfferVisible] = useState(false);
  const revealOfferAtTime = useCallback((time: number) => {
    if (Number.isFinite(time) && time >= PITCH_SECONDS) setOfferVisible(true);
  }, []);
  const tracking = useMemo(() => captureTracking(), []);

  const checkoutLinks = useMemo(() => ({
    two: buildCheckoutUrl('https://jvz7.com/c/3640757/448283', tracking),
    six: buildCheckoutUrl('https://jvz7.com/c/3640757/448297', tracking),
    three: buildCheckoutUrl('https://jvz7.com/c/3640757/448295', tracking),
  }), [tracking]);

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

        <div id="oferta-escondida" className={`offer-section${offerVisible ? ' is-visible' : ''}`} hidden={!offerVisible} aria-hidden={!offerVisible}>
          {offerVisible && <Suspense fallback={null}><OfferSection checkoutLinks={checkoutLinks} /></Suspense>}
        </div>
      </main>
    </div>
  );
}

export default App;
