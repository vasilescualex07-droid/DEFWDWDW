import { useEffect, useState } from 'react';

interface HouseVaultProps {
  vault: number;
  maxVault: number;
  run: number;
}

export const HouseVault = ({ vault, maxVault, run }: HouseVaultProps) => {
  const [prevVault, setPrevVault] = useState(vault);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (vault < prevVault) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      setPrevVault(vault);
      return () => clearTimeout(t);
    }
    setPrevVault(vault);
  }, [vault]);

  const pct = Math.max(0, vault / maxVault);
  const isCritical = pct < 0.2;
  const isDanger   = pct < 0.5;

  const barColor = isCritical
    ? 'linear-gradient(90deg, #dc2626, #ef4444)'
    : isDanger
    ? 'linear-gradient(90deg, #f97316, #fb923c)'
    : 'linear-gradient(90deg, #16a34a, #22c55e)';

  const labelColor = isCritical ? '#ef4444' : isDanger ? '#fb923c' : '#86efac';

  return (
    <div
      className={`flex flex-col gap-1 min-w-[160px] transition-all duration-300 ${flash ? 'scale-105' : 'scale-100'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-display font-black tracking-[0.18em] uppercase"
          style={{ color: labelColor }}
        >
          {isCritical ? '⚠ VAULT CRITICAL' : `🏦 VAULT · RUN ${run}`}
        </span>
        <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: labelColor }}>
          ${vault.toLocaleString()} / ${maxVault.toLocaleString()}
        </span>
      </div>

      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct * 100}%`,
            background: barColor,
            boxShadow: isCritical
              ? '0 0 8px rgba(239,68,68,0.8)'
              : isDanger
              ? '0 0 8px rgba(251,146,60,0.6)'
              : '0 0 8px rgba(34,197,94,0.5)',
          }}
        />
        {isCritical && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)',
              animation: 'shimmer 1s infinite',
            }}
          />
        )}
      </div>

      {isCritical && (
        <p className="text-[9px] font-display tracking-widest text-red-400 animate-pulse text-center">
          BANKRUPT IMMINENT
        </p>
      )}
    </div>
  );
};
