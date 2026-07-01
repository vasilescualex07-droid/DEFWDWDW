import { useState, useEffect, useRef } from 'react';
import { Play, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface WatchAdButtonProps {
  onReward: (amount: number) => void;
}

export const WatchAdButton = ({ onReward }: WatchAdButtonProps) => {
  const [canWatch, setCanWatch] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanWatch(true);
    }
  }, [cooldown]);

  const startMusic = () => {
    if (audioContextRef.current) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.15;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create a pumping bass synth pattern
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = audioContext.createOscillator();
      const noteGain = audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      noteGain.gain.setValueAtTime(0.3, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(noteGain);
      noteGain.connect(gainNode);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Bass pattern loop
    const pattern = [110, 110, 146.83, 110, 130.81, 110, 146.83, 164.81];
    let noteIndex = 0;
    
    const playPattern = () => {
      if (!audioContextRef.current) return;
      const now = audioContextRef.current.currentTime;
      playNote(pattern[noteIndex % pattern.length], now, 0.15);
      noteIndex++;
    };

    const intervalId = setInterval(playPattern, 200);
    (audioContextRef.current as any).intervalId = intervalId;
    setIsPlaying(true);
  };

  const stopMusic = () => {
    if (audioContextRef.current) {
      clearInterval((audioContextRef.current as any).intervalId);
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const startAd = () => {
    setShowAd(true);
    setAdProgress(0);
    setCanWatch(false);
    startMusic();
  };

  const closeAd = () => {
    stopMusic();
    setShowAd(false);
    setAdProgress(0);
  };

  // Ad progress timer (10 seconds)
  useEffect(() => {
    if (showAd && adProgress < 100) {
      const timer = setTimeout(() => {
        setAdProgress(prev => prev + 10); // 10% every second = 10 seconds total
      }, 1000);
      return () => clearTimeout(timer);
    } else if (adProgress >= 100 && showAd) {
      // Ad complete - give reward
      setTimeout(() => {
        onReward(10);
        closeAd();
        setCooldown(60); // 60 second cooldown
      }, 500);
    }
  }, [showAd, adProgress]);

  return (
    <>
      <Button
        onClick={startAd}
        disabled={!canWatch}
        variant="outline"
        className="border-gold text-gold hover:bg-gold hover:text-accent-foreground font-display gap-2"
      >
        <Play className="w-4 h-4" />
        {canWatch ? 'Watch Ad +$10' : `Wait ${cooldown}s`}
      </Button>

      <Dialog open={showAd} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg bg-background border-gold p-0 overflow-hidden [&>button]:hidden">
          <div className="relative">
            {/* Ad Content */}
            <div className="bg-gradient-to-br from-neon-purple via-background to-primary/30 p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
              <div className="absolute top-4 right-4 flex items-center gap-2 text-muted-foreground text-sm">
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-primary animate-pulse' : ''}`} />
                Ad
              </div>
              
              {/* Animated Logo */}
              <div className="relative mb-8">
                <div className="absolute inset-0 blur-xl bg-primary/50 animate-pulse rounded-full scale-150" />
                <h1 className="relative font-display text-5xl md:text-6xl font-black tracking-wider animate-pulse">
                  <span className="text-foreground">STAKE</span>
                  <span className="text-primary">LITE</span>
                </h1>
              </div>

              <p className="font-display text-xl text-muted-foreground mb-2">
                🎰 Play & Win Big 🎰
              </p>
              <p className="text-muted-foreground text-sm">
                No Real Money • Pure Entertainment
              </p>

              {/* Dancing coins animation */}
              <div className="flex gap-4 mt-6 text-4xl">
                {['💰', '🎲', '🚀', '💎', '🃏'].map((emoji, i) => (
                  <span 
                    key={i} 
                    className="animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {adProgress < 100 ? 'Watch to earn reward...' : '🎉 Reward earned!'}
                </span>
                <span className="font-display text-gold font-bold">+$10</span>
              </div>
              <Progress value={adProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {adProgress < 100 ? `${Math.ceil((100 - adProgress) / 10)}s remaining` : 'Complete!'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};