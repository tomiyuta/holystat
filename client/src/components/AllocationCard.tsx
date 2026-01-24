import { motion } from 'framer-motion';
import { PieChart, Swords, Shield } from 'lucide-react';
import { PortfolioAllocation, MarketRegime } from '@/hooks/useMarketSignals';

interface AllocationCardProps {
  allocation: PortfolioAllocation;
  regime: MarketRegime;
}

export function AllocationCard({ allocation, regime }: AllocationCardProps) {
  const attackColor = 'oklch(0.75 0.2 145)';
  const defenseColor = 'oklch(0.8 0.15 200)';

  // D2/D3システム: 強気は攻撃型100%、弱気は防御型100%
  const isBull = regime === 'bull';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <PieChart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">推奨ポートフォリオ配分</h3>
          <p className="text-xs text-muted-foreground">SPY vs MA200×0.95 シグナルに基づく配分</p>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="mb-6">
        <div className="h-8 rounded-lg overflow-hidden flex">
          {allocation.aggressive > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${allocation.aggressive}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="flex items-center justify-center"
              style={{ backgroundColor: attackColor }}
            >
              <span className="text-xs font-mono font-bold text-background">
                攻撃型 {allocation.aggressive}%
              </span>
            </motion.div>
          )}
          {allocation.defensive > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${allocation.defensive}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="flex items-center justify-center"
              style={{ backgroundColor: defenseColor }}
            >
              <span className="text-xs font-mono font-bold text-background">
                防御型 {allocation.defensive}%
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attack Strategy */}
        <div className={`p-4 rounded-lg border bg-secondary/30 ${isBull ? 'border-emerald-500/50' : 'border-border'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-4 h-4" style={{ color: attackColor }} />
            <span className="text-sm font-medium">攻撃型ポートフォリオ</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">配分比率</span>
              <span className="font-mono font-bold" style={{ color: attackColor }}>
                {allocation.aggressive}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">D2銘柄数</span>
              <span className="font-mono font-bold text-foreground">10銘柄</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">D3銘柄数</span>
              <span className="font-mono font-bold text-foreground">10銘柄</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              モメンタム上位銘柄を均等配分
            </div>
          </div>
        </div>

        {/* Defense Strategy */}
        <div className={`p-4 rounded-lg border bg-secondary/30 ${!isBull ? 'border-blue-500/50' : 'border-border'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" style={{ color: defenseColor }} />
            <span className="text-sm font-medium">防御型ポートフォリオ</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">配分比率</span>
              <span className="font-mono font-bold" style={{ color: defenseColor }}>
                {allocation.defensive}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">ETF数</span>
              <span className="font-mono font-bold text-foreground">4銘柄</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              債券ETF中心の低リスク構成
            </div>
          </div>
        </div>
      </div>

      {/* Regime-specific Note */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          {isBull ? (
            <>
              <span className="font-semibold text-[oklch(0.75_0.2_145)]">強気シグナル</span>
              （SPY ≥ MA200×0.95）により、攻撃型ポートフォリオ100%でリターンを追求します。
            </>
          ) : (
            <>
              <span className="font-semibold text-[oklch(0.65_0.25_25)]">弱気シグナル</span>
              （SPY &lt; MA200×0.95）により、防御型ポートフォリオ100%でリスクを抑制します。
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
