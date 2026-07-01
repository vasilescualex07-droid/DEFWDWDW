import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  type TriggerWinExplosionOptions,
  WinExplosionSystem,
} from '@/lib/winExplosionSystem';

export interface WinExplosionHandle {
  triggerWinExplosion: (opts?: TriggerWinExplosionOptions) => void;
}

export const WinExplosionCanvas = forwardRef<WinExplosionHandle, { className?: string }>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const flashRef = useRef<HTMLDivElement | null>(null);
    const systemRef = useRef<WinExplosionSystem | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const system = new WinExplosionSystem(canvas, flashRef.current ?? undefined);
      systemRef.current = system;
      system.resize();

      const onResize = () => system.resize();
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        system.destroy();
        systemRef.current = null;
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        triggerWinExplosion: (opts?: TriggerWinExplosionOptions) => {
          systemRef.current?.triggerWinExplosion(opts);
        },
      }),
      []
    );

    return (
      <div className={`fixed inset-0 pointer-events-none z-[35] ${className}`} aria-hidden>
        <canvas ref={canvasRef} className="absolute inset-0" />
        <div
          ref={flashRef}
          className="absolute inset-0"
          style={{
            opacity: 0,
            mixBlendMode: 'screen',
            transition: 'opacity 90ms linear',
            background:
              'radial-gradient(circle at 50% 45%, rgba(234,242,255,0.38) 0%, rgba(159,231,255,0.2) 38%, rgba(111,0,255,0.12) 70%, transparent 100%)',
          }}
        />
      </div>
    );
  }
);

WinExplosionCanvas.displayName = 'WinExplosionCanvas';

