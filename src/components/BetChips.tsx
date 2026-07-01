interface BetChipsProps {
  value: number;
  onChange: (v: number) => void;
  balance: number;
  disabled?: boolean;
}

export const BetChips = ({ value, onChange, balance, disabled }: BetChipsProps) => {
  const chips = [10, 25, 100, 500];
  const btn = (label: string, action: () => void, color: 'gold' | 'blue' | 'muted' = 'muted') => {
    const colors = {
      gold: 'bg-gold/15 text-gold border-gold/30 hover:bg-gold/28',
      blue: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/28',
      muted: 'bg-secondary text-muted-foreground border-border hover:bg-secondary/70',
    };
    return (
      <button
        key={label}
        disabled={disabled}
        onClick={action}
        className={`px-2.5 py-1 text-xs font-display font-bold rounded-md border transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${colors[color]}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip =>
        btn(`+$${chip}`, () => onChange(Math.min(balance, value + chip)), 'gold')
      )}
      {btn('½', () => onChange(Math.max(1, Math.round(value / 2))))}
      {btn('×2', () => onChange(Math.min(balance, value * 2)))}
      {btn('CLR', () => onChange(1))}
      {btn('MAX', () => onChange(balance), 'blue')}
    </div>
  );
};
