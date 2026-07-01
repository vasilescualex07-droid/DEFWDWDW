import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setSoundEnabled, isSoundEnabled } from '@/hooks/useSounds';

export const SoundToggle = () => {
  const [enabled, setEnabled] = useState(() => isSoundEnabled());

  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setEnabled(!enabled)}
      className="text-muted-foreground hover:text-foreground"
      title={enabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </Button>
  );
};