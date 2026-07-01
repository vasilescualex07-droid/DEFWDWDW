import { useEffect, useRef, useCallback } from 'react';

export const usePerformanceOptimizer = () => {
  const frameTimeRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const isLowPerformanceModeRef = useRef(false);

  const measureFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    frameTimeRef.current.push(delta);
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }

    const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
    const fps = 1000 / avgFrameTime;

    if (fps < 30 && !isLowPerformanceModeRef.current) {
      isLowPerformanceModeRef.current = true;
      document.body.classList.add('low-performance-mode');
    } else if (fps > 50 && isLowPerformanceModeRef.current) {
      isLowPerformanceModeRef.current = false;
      document.body.classList.remove('low-performance-mode');
    }

    requestAnimationFrame(measureFPS);
  }, []);

  useEffect(() => {
    const animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, [measureFPS]);

  const getCurrentFPS = useCallback(() => {
    if (frameTimeRef.current.length === 0) return 60;
    const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
    return Math.round(1000 / avgFrameTime);
  }, []);

  const isLowPerformanceMode = useCallback(() => isLowPerformanceModeRef.current, []);

  return {
    getCurrentFPS,
    isLowPerformanceMode
  };
};
