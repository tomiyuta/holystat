import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { MarketRegime } from '@/hooks/useMarketSignals';

interface RegimeIndicatorProps {
  regime: MarketRegime;
  regimeJapanese: string;
  confidence: number;
  bullCount: number;
  bearCount: number;
}

export function RegimeIndicator({ 
  regime, 
  regimeJapanese, 
  confidence, 
  bullCount, 
  bearCount 
}: RegimeIndicatorProps) {
  const getRegimeConfig = () => {
    switch (regime) {
      case 'bull':
        return {
          icon: TrendingUp,
          color: 'oklch(0.75 0.2 145)',
          bgColor: 'oklch(0.75 0.2 145 / 0.1)',
          borderColor: 'oklch(0.75 0.2 145 / 0.3)',
          message: '市場は上昇トレンドにあります',
          recommendation: '攻撃的なポジションを推奨',
          display: 'BULL',
        };
      case 'bear':
        return {
          icon: TrendingDown,
          color: 'oklch(0.65 0.25 25)',
          bgColor: 'oklch(0.65 0.25 25 / 0.1)',
          borderColor: 'oklch(0.65 0.25 25 / 0.3)',
          message: '市場は下降トレンドの兆候があります',
          recommendation: '防御的なポジションを推奨',
          display: 'BEAR',
        };
      default:
        return {
          icon: Minus,
          color: 'oklch(0.7 0.15 220)',
          bgColor: 'oklch(0.7 0.15 220 / 0.1)',
          borderColor: 'oklch(0.7 0.15 220 / 0.3)',
          message: '市場は方向感が定まっていません',
          recommendation: 'バランスの取れたポジションを推奨',
          display: 'NEUTRAL',
        };
    }
  };

  const config = getRegimeConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="terminal-card relative overflow-hidden"
    >
      {/* Background Glow Effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at top right, ${config.bgColor}, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Main Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                boxShadow: [
                  `0 0 20px ${config.color}`,
                  `0 0 40px ${config.color}`,
                  `0 0 20px ${config.color}`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-4 rounded-xl"
              style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}
            >
              <Icon className="w-8 h-8" style={{ color: config.color }} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h2 
                  className="text-3xl font-bold font-mono"
                  style={{ color: config.color }}
                >
                  {config.display}
                </h2>
                <span className="text-xl text-muted-foreground">-</span>
                <span className="text-xl font-semibold text-foreground">
                  {regimeJapanese}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {config.message}
              </p>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">判定信頼度</div>
            <div 
              className="text-4xl font-mono font-bold"
              style={{ color: config.color }}
            >
              {confidence.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Signal Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[oklch(0.75_0.2_145)]" />
              <span className="text-sm font-medium">好況シグナル</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-[oklch(0.75_0.2_145)]">
                {bullCount}
              </span>
              <span className="text-sm text-muted-foreground">/ 3 点灯</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[oklch(0.65_0.25_25)]" />
              <span className="text-sm font-medium">不況シグナル</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-[oklch(0.65_0.25_25)]">
                {bearCount}
              </span>
              <span className="text-sm text-muted-foreground">/ 5 点灯</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          }}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: config.color }} />
            <span className="text-sm font-medium" style={{ color: config.color }}>
              {config.recommendation}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
