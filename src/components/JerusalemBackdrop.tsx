import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play } from 'lucide-react';

/** Decorative layers follow native scrolling; content and the map stay still. */
export function JerusalemBackdrop() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const scene = sceneRef.current;
    const hero = scene?.parentElement;
    if (!scene || !hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    let frame = 0;
    let visible = false;
    let listening = false;

    const paint = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / bounds.height));
      const strength = mobile.matches ? 0.35 : 1;
      scene.style.setProperty('--scene-drift', `${progress * 115 * strength}px`);
      scene.style.setProperty('--scene-near', `${progress * -55 * strength}px`);
      scene.style.setProperty('--scene-scale', `${1 + progress * 0.055 * strength}`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const stop = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      listening = false;
    };
    const sync = () => {
      stop();
      if (reducedMotion.matches) {
        scene.style.removeProperty('--scene-drift');
        scene.style.removeProperty('--scene-near');
        scene.style.removeProperty('--scene-scale');
      } else if (!paused && visible) {
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        listening = true;
        schedule();
      }
      scene.dataset.moving = String(listening);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
    reducedMotion.addEventListener('change', sync);
    return () => {
      stop();
      observer.disconnect();
      reducedMotion.removeEventListener('change', sync);
    };
  }, [paused]);

  return (
    <>
      <div ref={sceneRef} className="sira-jerusalem-scene" aria-hidden="true">
        <div className="sira-scene-photo">
          <img src="/images/jerusalem/dome-and-chain.jpg" alt="" width="1280" height="852" decoding="async" />
        </div>
        <div className="sira-scene-wash" />
        <div className="sira-scene-light" />
        <svg className="sira-scene-arches" viewBox="0 0 1440 780" preserveAspectRatio="xMidYMax slice" fill="none">
          <path d="M-95 800V385C-95 180 65 76 210 20C355 76 515 180 515 385V800 M-62 800V389C-62 203 81 106 210 53C339 106 482 203 482 389V800" />
          <path d="M1120 800V440C1120 283 1247 200 1360 156C1473 200 1600 283 1600 440V800 M1144 800V444C1144 302 1260 225 1360 185C1460 225 1576 302 1576 444V800" />
          <path d="M-40 704C280 644 420 794 728 725S1145 626 1480 688" strokeDasharray="2 11" />
          <circle cx="210" cy="53" r="5" /><circle cx="1360" cy="185" r="4" />
        </svg>
        <div className="sira-scene-fade" />
      </div>
      <div className="sira-scene-caption">
        <span><ArrowDown size={14} aria-hidden="true" /> مع كل خطوة، حكاية</span>
        <button type="button" className="sira-scene-toggle" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? 'تشغيل حركة الخلفية' : 'إيقاف حركة الخلفية'}>
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          <span>{paused ? 'تشغيل الحركة' : 'إيقاف الحركة'}</span>
        </button>
      </div>
    </>
  );
}
