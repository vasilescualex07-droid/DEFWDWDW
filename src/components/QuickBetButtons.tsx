import { Button } from '@/components/ui/button';
import { playSound } from '@/hooks/useSounds';

interface QuickBetButtonsProps {
  balance: number;
  currentBet: number;
  onBetChange: (amount: number) => void;
  disabled?: boolean;
  minBet?: number;
}

export const QuickBetButtons = ({ 
  balance, 
  currentBet, 
  onBetChange, 
  disabled,
  minBet = 1 
}: QuickBetButtonsProps) => {
  const quickBets = [
    { label: 'Min', value: minBet },
    { label: '×2', multiply: 2 },
    { label: '÷2', divide: 2 },
    { label: '10%', percent: 0.1 },
    { label: '25%', percent: 0.25 },
    { label: '50%', percent: 0.5 },
    { label: 'Max', value: balance },
  ];

  const handleQuickBet = (action: { 
    label: string; 
    value?: number; 
    multiply?: number; 
    divide?: number;
    percent?: number;
  }) => {
    playSound('click');
    
    if (action.value !== undefined) {
      onBetChange(Math.max(minBet, Math.min(action.value, balance)));
    } else if (action.multiply) {
      onBetChange(Math.max(minBet, Math.min(currentBet * action.multiply, balance)));
    } else if (action.divide) {
      onBetChange(Math.max(minBet, Math.floor(currentBet / action.divide)));
    } else if (action.percent) {
      onBetChange(Math.max(minBet, Math.min(Math.floor(balance * action.percent), balance)));
    }
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {quickBets.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          size="sm"
          onClick={() => handleQuickBet(action)}
          disabled={disabled}
          className="h-7 px-2 text-xs font-display bg-secondary/50 hover:bg-primary/20 hover:text-primary border border-border/30 transition-all duration-150 hover:scale-105 active:scale-95"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};
