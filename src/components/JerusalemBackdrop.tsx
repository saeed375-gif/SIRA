import { useEffect, useRef } from 'react';

/** Real footage plays quietly; native scrolling moves through the film itself. */
export function JerusalemBackdrop() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const video = videoRef.current;
    const hero = scene?.parentElement;
    if (!scene || !video || !hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let disposed = false;
    let frame = 0;
    let resumeTimer = 0;
    let scrolling = false;
    let resumeAfterSeek = false;
    let targetTime = 0;
    let previousY = window.scrollY;
    let loaded = false;
    const canMove = () => visible && !document.hidden && !reducedMotion.matches && !disposed;
    const play = () => {
      if (!canMove() || scrolling) return;
      video.playbackRate = 0.85;
      void video.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
    };
    const seek = () => {
      if (!canMove() || !scrolling || video.seeking || !Number.isFinite(video.duration)) return;
      if (Math.abs(video.currentTime - targetTime) > 0.045) video.currentTime = targetTime;
    };
    const paint = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / bounds.height));
      hero.style.setProperty('--cinema-progress', String(progress));
      seek();
    };
    const onSeeked = () => {
      seek();
      if (resumeAfterSeek && !video.seeking) {
        scrolling = false;
        resumeAfterSeek = false;
        play();
      }
    };
    const onScroll = () => {
      const delta = window.scrollY - previousY;
      previousY = window.scrollY;
      if (!canMove()) return;
      if (!frame) frame = requestAnimationFrame(paint);
      if (Math.abs(delta) < 1 || video.readyState < 2 || !Number.isFinite(video.duration)) return;
      if (!scrolling) targetTime = video.currentTime;
      scrolling = true;
      resumeAfterSeek = false;
      video.pause();
      const duration = Math.max(0.1, video.duration - 0.1);
      // Short GOPs in the encoded clip keep both forward and reverse seeks quick.
      targetTime = ((targetTime + delta * 0.012) % duration + duration) % duration;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        resumeAfterSeek = true;
        onSeeked();
      }, 220);
    };
    const sync = () => {
      previousY = window.scrollY;
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(resumeTimer);
      cancelAnimationFrame(frame);
      frame = 0;
      scrolling = false;
      resumeAfterSeek = false;
      if (canMove()) {
        if (!loaded) {
          // Keep one full-HD source for every viewport so the hero never falls
          // back to a softer mobile encode after an orientation change.
          video.src = '/video/jerusalem-old-city-hero.mp4';
          video.load();
          loaded = true;
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        paint();
        play();
      } else video.pause();
      scene.dataset.active = String(canMove());
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('canplay', play);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('canplay', play);
      window.clearTimeout(resumeTimer);
      cancelAnimationFrame(frame);
      video.pause();
    };
  }, []);

  return (
    <div ref={sceneRef} className="sira-cinema-backdrop" aria-hidden="true">
      <video ref={videoRef} muted loop playsInline preload="metadata" poster="/video/jerusalem-old-city-hero-poster.jpg" disablePictureInPicture tabIndex={-1} />
      <div className="sira-cinema-shade" />
    </div>
  );
}
