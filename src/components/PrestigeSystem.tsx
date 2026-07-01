import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Sparkles, TrendingUp, Zap, Gift, Shield, Coins, X, LucideIcon, Infinity } from "lucide-react";
import { toast } from "sonner";
import { getPrestigeUpgradeCost, totalPointsSpentForUpgradeLevel } from "@/lib/prestige";
import { playSound } from "@/hooks/useSounds";

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Coins,
  Zap,
  Gift,
};

interface PrestigeBonus {
  id: string;
  name: string;
  description: string;
  iconName: "TrendingUp" | "Coins" | "Zap" | "Gift";
  bonusPerLevel: number;
  currentLevel: number;
  type: "multiplier" | "cashback" | "xp" | "starting";
}

interface PrestigeSystemProps {
  level: number;
  balance: number;
  setBalance: (balance: number) => void;
  setLevel: (level: number) => void;
  setXp: (xp: number) => void;
  onPrestige?: () => void;
  onClose?: () => void;
}

// Get XP required for a specific level (exponential scaling)
export const getXpRequiredForLevel = (level: number): number => {
  const baseXp = 100;
  const scalingFactor = 1.15; // 15% more XP needed each level
  return Math.floor(baseXp * Math.pow(scalingFactor, level - 1));
};

// Calculate prestige points earned based on level (scaling rewards)
const calculatePrestigePoints = (level: number): number => {
  // Base 3 points, +1 for every 10 levels above 50
  const bonusPoints = Math.floor((level - 50) / 10);
  return Math.max(3, 3 + bonusPoints);
};

const PrestigeSystem = ({ level, balance, setBalance, setLevel, setXp, onPrestige, onClose }: PrestigeSystemProps) => {
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [bonuses, setBonuses] = useState<PrestigeBonus[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [totalPrestigePoints, setTotalPrestigePoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);

  const PRESTIGE_REQUIREMENT = 50;

  useEffect(() => {
    const savedPrestige = localStorage.getItem("prestigeLevel");
    const savedBonuses = localStorage.getItem("prestigeBonuses");
    const savedPoints = localStorage.getItem("prestigePoints");

    if (savedPrestige) {
      setPrestigeLevel(parseInt(savedPrestige));
    }
    if (savedPoints) {
      const points = parseInt(savedPoints);
      setTotalPrestigePoints(points);
    }
    if (savedBonuses) {
      setBonuses(JSON.parse(savedBonuses));
    } else {
      setBonuses(getInitialBonuses());
    }
  }, []);

  useEffect(() => {
    if (bonuses.length > 0) {
      localStorage.setItem("prestigeBonuses", JSON.stringify(bonuses));
      const spentPoints = bonuses.reduce(
        (sum, b) => sum + totalPointsSpentForUpgradeLevel(b.currentLevel),
        0
      );
      setAvailablePoints(Math.max(0, totalPrestigePoints - spentPoints));
    }
  }, [bonuses, totalPrestigePoints]);

  const getInitialBonuses = (): PrestigeBonus[] => [
    {
      id: "multiplier",
      name: "Win Multiplier",
      description: "Increase all win payouts by 5% per level",
      iconName: "TrendingUp",
      bonusPerLevel: 5,
      currentLevel: 0,
      type: "multiplier"
    },
    {
      id: "cashback",
      name: "Loss Cashback",
      description: "Get 2% of losses back per level",
      iconName: "Coins",
      bonusPerLevel: 2,
      currentLevel: 0,
      type: "cashback"
    },
    {
      id: "xp",
      name: "XP Boost",
      description: "Earn 10% more XP per level",
      iconName: "Zap",
      bonusPerLevel: 10,
      currentLevel: 0,
      type: "xp"
    },
    {
      id: "starting",
      name: "Starting Bonus",
      description: "+$500 starting balance per level after prestige",
      iconName: "Gift",
      bonusPerLevel: 500,
      currentLevel: 0,
      type: "starting"
    }
  ];

  const getPrestigeRewards = () => {
    const baseStarting = 1000;
    const startingBonus = bonuses.find(b => b.id === "starting");
    const bonusAmount = startingBonus ? startingBonus.currentLevel * startingBonus.bonusPerLevel : 0;
    return baseStarting + bonusAmount;
  };

  const pointsEarned = calculatePrestigePoints(level);

  const performPrestige = () => {
    if (level < PRESTIGE_REQUIREMENT) return;

    const newPrestigeLevel = prestigeLevel + 1;
    const newPoints = totalPrestigePoints + pointsEarned;
    const startingBalance = getPrestigeRewards();

    // Reset progress
    setLevel(1);
    setXp(0);
    setBalance(startingBalance);

    // Update prestige stats
    setPrestigeLevel(newPrestigeLevel);
    setTotalPrestigePoints(newPoints);

    // Save to localStorage
    localStorage.setItem("prestigeLevel", newPrestigeLevel.toString());
    localStorage.setItem("prestigePoints", newPoints.toString());

    setShowConfirm(false);
    onPrestige?.();
    toast.success(`🌟 Prestige ${newPrestigeLevel}! Earned ${pointsEarned} points!`);
  };

  const upgradeBonus = (bonusId: string) => {
    const bonus = bonuses.find((b) => b.id === bonusId);
    if (!bonus) return;
    const cost = getPrestigeUpgradeCost(bonus.currentLevel);
    if (availablePoints < cost) return;

    setBonuses((prev) =>
      prev.map((b) => (b.id === bonusId ? { ...b, currentLevel: b.currentLevel + 1 } : b))
    );
    playSound('click');
    toast.success(`${bonus.name} +1 (−${cost} pts)`);
  };

  const getPrestigeColor = () => {
    if (prestigeLevel >= 10) return "from-red-500 to-orange-500";
    if (prestigeLevel >= 7) return "from-purple-500 to-pink-500";
    if (prestigeLevel >= 5) return "from-yellow-400 to-amber-500";
    if (prestigeLevel >= 3) return "from-blue-400 to-cyan-500";
    if (prestigeLevel >= 1) return "from-green-400 to-emerald-500";
    return "from-gray-400 to-gray-500";
  };

  const getPrestigeTitle = () => {
    if (prestigeLevel >= 10) return "Legendary";
    if (prestigeLevel >= 7) return "Mythic";
    if (prestigeLevel >= 5) return "Master";
    if (prestigeLevel >= 3) return "Expert";
    if (prestigeLevel >= 1) return "Veteran";
    return "Novice";
  };

  const canUpgrade = (bonus: PrestigeBonus): boolean => {
    const cost = getPrestigeUpgradeCost(bonus.currentLevel);
    return availablePoints >= cost;
  };

  const canPrestige = level >= PRESTIGE_REQUIREMENT;
  const progressToPrestige = Math.min((level / PRESTIGE_REQUIREMENT) * 100, 100);

  // Calculate active bonuses for display
  const activeMultiplier = bonuses.find(b => b.id === "multiplier")?.currentLevel ?? 0;
  const activeCashback = bonuses.find(b => b.id === "cashback")?.currentLevel ?? 0;
  const activeXpBoost = bonuses.find(b => b.id === "xp")?.currentLevel ?? 0;
  const activeStarting = bonuses.find(b => b.id === "starting")?.currentLevel ?? 0;

  // Calculate XP scaling info
  const currentXpRequired = getXpRequiredForLevel(level);
  const nextXpRequired = getXpRequiredForLevel(level + 1);

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-300">
            <Crown className="w-6 h-6" />
            Prestige System
          </CardTitle>
          <div className="flex items-center gap-2">
            {prestigeLevel > 0 && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getPrestigeColor()}`}>
                <Star className="w-4 h-4 text-white" />
                <span className="font-bold text-white">P{prestigeLevel}</span>
                <span className="text-sm text-white/80">{getPrestigeTitle()}</span>
              </div>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* XP Scaling Info */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              XP Scaling
            </span>
            <span className="text-muted-foreground">Difficulty increases each level</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">{currentXpRequired}</div>
              <div className="text-xs text-muted-foreground">XP for Level {level}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{nextXpRequired}</div>
              <div className="text-xs text-muted-foreground">XP for Level {level + 1}</div>
            </div>
          </div>
        </div>

        {/* Prestige Progress */}
        <div className="p-4 rounded-lg bg-card/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress to Next Prestige</span>
            <span className="text-sm text-muted-foreground">Level {level}/{PRESTIGE_REQUIREMENT}</span>
          </div>
          <Progress value={progressToPrestige} className="h-3 mb-3" />
          
          {canPrestige ? (
            !showConfirm ? (
              <Button 
                onClick={() => setShowConfirm(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Prestige Now (+{pointsEarned} Points)
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Prestige will reset your level to 1 and your balance to ${getPrestigeRewards().toLocaleString()}.
                    You'll earn <strong>{pointsEarned} prestige points</strong> (bonus for high level!) to unlock permanent bonuses!
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                    onClick={performPrestige}
                  >
                    Confirm Prestige
                  </Button>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Reach level {PRESTIGE_REQUIREMENT} to unlock prestige
            </p>
          )}
        </div>

        {/* Active Bonuses Display */}
        {prestigeLevel > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {activeMultiplier > 0 && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-400">+{activeMultiplier * 5}%</div>
                <div className="text-xs text-muted-foreground">Win</div>
              </div>
            )}
            {activeCashback > 0 && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                <Coins className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-blue-400">{activeCashback * 2}%</div>
                <div className="text-xs text-muted-foreground">Cashback</div>
              </div>
            )}
            {activeXpBoost > 0 && (
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-yellow-400">+{activeXpBoost * 10}%</div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            )}
            {activeStarting > 0 && (
              <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-center">
                <Gift className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-pink-400">+${(activeStarting * 500).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Start</div>
              </div>
            )}
          </div>
        )}

        {/* Prestige Bonuses - UNLIMITED */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Permanent Upgrades
              <span className="text-xs text-purple-400 flex items-center gap-1">
                <Infinity className="w-3 h-3" /> Unlimited
              </span>
            </h4>
            <span className={`text-sm px-2 py-1 rounded ${availablePoints > 0 ? "bg-purple-500/20 text-purple-300" : "bg-muted text-muted-foreground"}`}>
              {availablePoints} points
            </span>
          </div>
          
          <div className="grid gap-3">
            {bonuses.map(bonus => {
              const cost = getPrestigeUpgradeCost(bonus.currentLevel);
              const canAfford = availablePoints >= cost;
              
              return (
                <div 
                  key={bonus.id}
                  className="p-3 rounded-lg bg-card/50 border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      {(() => {
                        const Icon = iconMap[bonus.iconName];
                        return Icon ? <Icon className="w-5 h-5" /> : null;
                      })()}
                    </div>
                    <div>
                      <h5 className="font-medium">{bonus.name}</h5>
                      <p className="text-xs text-muted-foreground">{bonus.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {bonus.type === "multiplier" && `+${bonus.currentLevel * bonus.bonusPerLevel}%`}
                        {bonus.type === "cashback" && `${bonus.currentLevel * bonus.bonusPerLevel}%`}
                        {bonus.type === "xp" && `+${bonus.currentLevel * bonus.bonusPerLevel}%`}
                        {bonus.type === "starting" && `+$${(bonus.currentLevel * bonus.bonusPerLevel).toLocaleString()}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lvl {bonus.currentLevel}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => upgradeBonus(bonus.id)}
                      disabled={!canAfford}
                      className="w-16"
                    >
                      +{cost}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestige History */}
        {prestigeLevel > 0 && (
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-300">Prestige History</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Total Prestiges: {prestigeLevel} | Total Points Earned: {totalPrestigePoints}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrestigeSystem;

export { getPrestigeBonuses, getPrestigeLevel } from "@/lib/prestige";
