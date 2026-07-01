import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Zap, Cpu } from 'lucide-react';

interface PerformanceSettingsProps {
  onPerformanceChange?: (settings: PerformanceSettings) => void;
}

interface PerformanceSettings {
  particleMode: 'low' | 'medium' | 'high';
  maxFPS: 30 | 60 | 120;
  enableGlow: boolean;
  enableCameraEffects: boolean;
}

export const PerformanceSettings = ({ onPerformanceChange }: PerformanceSettingsProps) => {
  const [settings, setSettings] = useState<PerformanceSettings>({
    particleMode: 'high',
    maxFPS: 60,
    enableGlow: true,
    enableCameraEffects: true
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('performanceSettings', JSON.stringify(settings));
    onPerformanceChange?.(settings);
  }, [settings, onPerformanceChange]);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('performanceSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to load performance settings:', e);
      }
    }
  }, []);

  const getParticleCount = () => {
    switch (settings.particleMode) {
      case 'low': return 15;
      case 'medium': return 30;
      case 'high': return 50;
      default: return 30;
    }
  };

  const getPerformanceLabel = () => {
    const fps = settings.maxFPS;
    const particles = getParticleCount();
    
    if (fps === 30 && particles <= 15) return 'Ultra Low';
    if (fps === 30 && particles <= 30) return 'Low';
    if (fps === 60 && particles <= 30) return 'Medium';
    if (fps === 60 && particles >= 50) return 'High';
    if (fps === 120) return 'Ultra High';
    return 'Custom';
  };

  const getPerformanceColor = () => {
    const label = getPerformanceLabel();
    switch (label) {
      case 'Ultra Low': return 'text-green-600';
      case 'Low': return 'text-blue-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Ultra High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="bg-black/50 border-white/20 text-white hover:bg-black/70"
      >
        <Monitor className="w-4 h-4 mr-2" />
        Performance
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 bg-black/90 border border-white/20 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Performance Settings</h3>
              <div className={`text-sm font-medium ${getPerformanceColor()}`}>
                {getPerformanceLabel()}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-white text-sm">Quality Level</Label>
                <Select
                  value={settings.particleMode}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setSettings(prev => ({ ...prev, particleMode: value }))
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="low">Low (15 particles)</SelectItem>
                    <SelectItem value="medium">Medium (30 particles)</SelectItem>
                    <SelectItem value="high">High (50 particles)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm">Max FPS: {settings.maxFPS}</Label>
                <Slider
                  value={[settings.maxFPS]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, maxFPS: value as 30 | 60 | 120 }))}
                  min={30}
                  max={120}
                  step={30}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30 FPS</span>
                  <span>60 FPS</span>
                  <span>120 FPS</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white text-sm">Camera Effects</Label>
                <Button
                  variant={settings.enableCameraEffects ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, enableCameraEffects: !prev.enableCameraEffects }))}
                  className="w-20"
                >
                  {settings.enableCameraEffects ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white text-sm">Glow Effects</Label>
                <Button
                  variant={settings.enableGlow ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, enableGlow: !prev.enableGlow }))}
                  className="w-20"
                >
                  {settings.enableGlow ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center">
                  <Cpu className="w-3 h-3 mr-1" />
                  <span>Particles: {getParticleCount()}</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  <span>Effects: {settings.enableCameraEffects && settings.enableGlow ? 'Full' : 'Partial'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
