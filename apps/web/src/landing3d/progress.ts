import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const landingProgress = { value: 0 };

export function useLandingProgress(container: RefObject<HTMLElement | null>, reducedMotion: boolean) {
  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const context = gsap.context(() => {
      const lenis = reducedMotion || window.matchMedia('(pointer: coarse)').matches
        ? null
        : new Lenis({ autoRaf: false, lerp: 0.08 });
      const setProgress = (value: number) => { landingProgress.value = value; };
      const trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => setProgress(self.progress),
      });
      let frame: ((time: number) => void) | null = null;
      if (lenis) {
        lenis.on('scroll', ScrollTrigger.update);
        frame = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(frame);
        gsap.ticker.lagSmoothing(0);
      }
      ScrollTrigger.refresh();

      return () => {
        if (lenis) {
          lenis.off('scroll', ScrollTrigger.update);
          lenis.destroy();
          if (frame) gsap.ticker.remove(frame);
        }
        trigger.kill();
        landingProgress.value = 0;
      };
    }, element);

    return () => context.revert();
  }, [container, reducedMotion]);
}
