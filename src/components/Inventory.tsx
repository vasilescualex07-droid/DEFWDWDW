import { useState, useEffect, useCallback } from 'react';
import { X, Package, Swords, Shield, ChevronRight, TrendingUp, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  type InventoryItem, type Equipment, type ItemSlot, type Rarity,
  RARITY_META, SLOT_META, ITEM_DATABASE,
  loadInventory, saveInventory, loadEquipment, saveEquipment,
  equipItem, unequipSlot, sellItem, aggregateBuffs,
} from '@/lib/inventory';
import { toast } from 'sonner';

interface InventoryProps {
  playerName: string;
  balance: number;
  onBalanceChange: (delta: number) => void;
  onClose: () => void;
}

const SLOT_LAYOUT: { slot: ItemSlot; gridClass: string }[] = [
  { slot: 'helmet', gridClass: 'col-start-2 row-start-1' },
  { slot: 'deck',   gridClass: 'col-start-1 row-start-2' },
  { slot: 'chest',  gridClass: 'col-start-2 row-start-2' },
  { slot: 'weapon', gridClass: 'col-start-3 row-start-2' },
  { slot: 'legs',   gridClass: 'col-start-2 row-start-3' },
  { slot: 'boots',  gridClass: 'col-start-2 row-start-4' },
];

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const m = RARITY_META[rarity];
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${m.bg} ${m.color} border ${m.border}`}>
      {m.label}
    </span>
  );
}

function BuffLine({ label, value, unit = '%' }: { label: string; value: number; unit?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-win font-bold">+{value}{unit}</span>
    </div>
  );
}

function BuffLines({ buffs }: { buffs: Record<string, number> }) {
  return (
    <>
      <BuffLine label="Boss Damage" value={buffs.bossDamageBonus} />
      <BuffLine label="Max HP" value={buffs.bossMaxHpBonus} unit="" />
      <BuffLine label="Damage Reduction" value={buffs.bossDamageReduction} />
      <BuffLine label="Dodge Speed" value={buffs.dodgeSpeedBonus} />
      <BuffLine label="Heal Bonus" value={buffs.healBonus} />
      <BuffLine label="Jackpot Bias" value={buffs.jackpotBias} unit="" />
      <BuffLine label="XP Bonus" value={buffs.xpMultiplier} />
      <BuffLine label="Win Rate Bonus" value={buffs.winRateBonus} />
      <BuffLine label="Cashback" value={buffs.cashbackBonus} />
      <BuffLine label="Profit Bonus" value={buffs.betProfitBonus} />
    </>
  );
}

function SlotCard({ slot, equipped, onClick }: { slot: ItemSlot; equipped?: InventoryItem; onClick: () => void }) {
  const meta = SLOT_META[slot];
  const rMeta = equipped ? RARITY_META[equipped.rarity] : null;
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center gap-1 p-1 ${
        equipped
          ? `${rMeta!.bg} ${rMeta!.border} shadow-lg`
          : 'bg-secondary/30 border-dashed border-white/20 hover:border-white/40'
      }`}
    >
      <span className="text-xl">{meta.icon}</span>
      {equipped ? (
        <>
          <span className={`text-[8px] font-bold leading-tight text-center ${rMeta!.color} truncate w-full px-0.5`}>{equipped.name.split(' ').slice(0, 2).join(' ')}</span>
        </>
      ) : (
        <span className="text-[9px] text-muted-foreground">{meta.label}</span>
      )}
    </button>
  );
}

function ItemCard({ item, isEquipped, onClick }: { item: InventoryItem; isEquipped: boolean; onClick: () => void }) {
  const m = RARITY_META[item.rarity];
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg border text-left transition-all duration-200 hover:scale-[1.03] ${m.bg} ${m.border} ${isEquipped ? 'ring-2 ring-win/60' : ''}`}
    >
      {isEquipped && (
        <div className="absolute -top-1.5 -right-1.5 bg-win text-black text-[8px] font-bold px-1 py-0.5 rounded-full">EQ</div>
      )}
      <div className="text-lg mb-0.5">{SLOT_META[item.slot].icon}</div>
      <div className={`text-[10px] font-bold leading-tight ${m.color} truncate`}>{item.name}</div>
      <RarityBadge rarity={item.rarity} />
    </button>
  );
}

export const Inventory = ({ playerName, onBalanceChange, onClose }: InventoryProps) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [equipment, setEquipment] = useState<Equipment>({});
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [filterSlot, setFilterSlot] = useState<ItemSlot | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');

  const reload = useCallback(() => {
    setItems(loadInventory(playerName));
    setEquipment(loadEquipment(playerName));
  }, [playerName]);

  useEffect(() => { reload(); }, [reload]);

  const buffs = aggregateBuffs(equipment);
  const equippedUids = new Set(Object.values(equipment).filter(Boolean).map(i => i!.uid));

  const filtered = items.filter(i => {
    if (filterSlot !== 'all' && i.slot !== filterSlot) return false;
    if (filterRarity !== 'all' && i.rarity !== filterRarity) return false;
    return true;
  }).sort((a, b) => RARITY_META[b.rarity].order - RARITY_META[a.rarity].order);

  const handleEquip = (item: InventoryItem) => {
    equipItem(playerName, item.uid);
    reload();
    toast.success(`Equipped: ${item.name}!`);
    setSelected(null);
  };

  const handleUnequip = (slot: ItemSlot) => {
    unequipSlot(playerName, slot);
    reload();
    toast(`Unequipped ${SLOT_META[slot].label}`);
    setSelected(null);
  };

  const handleSell = (item: InventoryItem) => {
    const value = sellItem(playerName, item.uid);
    reload();
    if (selected?.uid === item.uid) setSelected(null);
    onBalanceChange(value);
    toast.success(`Sold ${item.name} for $${value.toLocaleString()}!`);
  };

  const totalBufValues = Object.values(buffs).filter(Boolean).length;

  const rarities: Rarity[] = ['common','uncommon','rare','epic','legendary','mythic','cosmic','transcendent'];

  return (
    <div className="flex flex-col h-full max-h-[90vh] bg-gradient-to-br from-card via-purple-950/10 to-card rounded-2xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white">INVENTORY</h2>
            <p className="text-xs text-muted-foreground">{items.length} items · {Object.values(equipment).filter(Boolean).length}/6 equipped</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Equipment Grid */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Equipment
            </h3>
            <div className="grid grid-cols-3 grid-rows-4 gap-2 max-w-[220px] mx-auto">
              {SLOT_LAYOUT.map(({ slot, gridClass }) => (
                <div key={slot} className={gridClass}>
                  <SlotCard
                    slot={slot}
                    equipped={equipment[slot]}
                    onClick={() => {
                      if (equipment[slot]) setSelected(equipment[slot]!);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Buffs */}
          {totalBufValues > 0 && (
            <div className="p-3 rounded-xl bg-win/5 border border-win/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-win" />
                <span className="text-xs font-bold text-win uppercase tracking-widest">Active Buffs</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <BuffLines buffs={buffs as Record<string, number>} />
              </div>
            </div>
          )}
          {totalBufValues === 0 && (
            <div className="p-3 rounded-xl bg-secondary/20 border border-white/10 text-center text-xs text-muted-foreground">
              Equip items to gain buffs
            </div>
          )}

          {/* Bag */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> Bag ({items.length})
              </h3>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              <button
                onClick={() => setFilterSlot('all')}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filterSlot === 'all' ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}
              >All Slots</button>
              {(Object.keys(SLOT_META) as ItemSlot[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSlot(s === filterSlot ? 'all' : s)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filterSlot === s ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}
                >
                  {SLOT_META[s].icon}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              <button
                onClick={() => setFilterRarity('all')}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filterRarity === 'all' ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-muted-foreground'}`}
              >All</button>
              {rarities.map(r => {
                const m = RARITY_META[r];
                const count = items.filter(i => i.rarity === r).length;
                if (!count && filterRarity !== r) return null;
                return (
                  <button
                    key={r}
                    onClick={() => setFilterRarity(r === filterRarity ? 'all' : r)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all ${filterRarity === r ? `${m.bg} ${m.border} ${m.color}` : 'border-white/10 text-muted-foreground'}`}
                  >
                    {m.label} {count > 0 && <span className="opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No items yet.</p>
                <p className="text-xs">Defeat bosses to earn drops!</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No items match filter</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filtered.map(item => (
                  <ItemCard
                    key={item.uid}
                    item={item}
                    isEquipped={equippedUids.has(item.uid)}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Panel */}
      {selected && (
        <div className="border-t border-white/10 p-4 bg-black/40">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${RARITY_META[selected.rarity].bg} border ${RARITY_META[selected.rarity].border}`}>
              <span className="text-2xl">{SLOT_META[selected.slot].icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-display text-sm ${RARITY_META[selected.rarity].color}`}>{selected.name}</h3>
                <RarityBadge rarity={selected.rarity} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 italic">{selected.lore}</p>
              <div className="mt-2 space-y-0.5">
                <BuffLines buffs={selected.buffs as Record<string, number>} />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="shrink-0">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            {equippedUids.has(selected.uid) ? (
              <Button
                onClick={() => handleUnequip(selected.slot)}
                variant="outline"
                size="sm"
                className="flex-1 border-white/20"
              >
                Unequip
              </Button>
            ) : (
              <Button
                onClick={() => handleEquip(selected)}
                size="sm"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-3.5 h-3.5 mr-1" /> Equip
              </Button>
            )}
            <Button
              onClick={() => handleSell(selected)}
              size="sm"
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              Sell ${selected.sellValue.toLocaleString()}
            </Button>
          </div>

          {equipment[selected.slot] && equipment[selected.slot]?.uid !== selected.uid && (
            <div className="mt-2 text-[10px] text-orange-400/80">
              ⚠️ Equipping this will replace {equipment[selected.slot]!.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
