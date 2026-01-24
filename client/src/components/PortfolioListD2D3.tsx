import { motion } from 'framer-motion';
import { Swords, TrendingUp, TrendingDown, Loader2, AlertTriangle, Building2, Globe } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Holding {
  symbol: string;
  name: string;
  weight: number;
  momentum?: number;
  volatility?: number;
}

interface PortfolioListD2D3Props {
  strategy: 'd2' | 'd3';
  diversificationCount?: number;
}

export function PortfolioListD2D3({ strategy, diversificationCount }: PortfolioListD2D3Props) {
  const { data, isLoading, error } = trpc.portfolio.getD2D3Recommendations.useQuery(
    diversificationCount ? { diversificationCount } : undefined,
    {
      staleTime: 60000, // 1 minute
      retry: 2,
    }
  );

  const isD2 = strategy === 'd2';
  const primaryColor = isD2 ? 'oklch(0.7 0.15 220)' : 'oklch(0.75 0.2 145)';
  const Icon = isD2 ? Building2 : Globe;
  const title = isD2 ? 'D2戦略（S&P100ベース）' : 'D3戦略（S&P500ベース）';
  const subtitle = isD2 
    ? '安定性重視・大型株中心'
    : 'リターン重視・幅広い銘柄';

  const portfolioData = data ? (isD2 ? data.d2 : data.d3) : null;
  const holdings: Holding[] = portfolioData?.holdings ?? [];
  const usingFallback = portfolioData?.usingFallback ?? false;
  const fallbackReason = portfolioData?.fallbackReason;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-card"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">銘柄データを取得中...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-card"
      >
        <div className="text-center py-8">
          <p className="text-sm text-destructive">銘柄データの取得に失敗しました</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card"
    >
      {/* Fallback Warning */}
      {usingFallback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">
                フォールバックデータを使用中
              </p>
              <p className="text-xs text-amber-500/80 mt-0.5">
                {fallbackReason || 'API制限により一部の銘柄データが取得できませんでした。'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, ${primaryColor} 15%, transparent)` }}
          >
            <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-2xl font-mono font-bold"
            style={{ color: primaryColor }}
          >
            {holdings.length}
          </div>
          <p className="text-xs text-muted-foreground">銘柄</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">銘柄</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">ウェイト</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">モメンタム</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">ボラ</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <motion.tr
                key={holding.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">
                      {holding.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {holding.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="font-mono" style={{ color: primaryColor }}>
                    {holding.weight.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(holding.momentum ?? 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-[oklch(0.75_0.2_145)]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[oklch(0.65_0.25_25)]" />
                    )}
                    <span 
                      className="font-mono text-xs"
                      style={{ 
                        color: (holding.momentum ?? 0) >= 0 
                          ? 'oklch(0.75 0.2 145)' 
                          : 'oklch(0.65 0.25 25)' 
                      }}
                    >
                      {(holding.momentum ?? 0) >= 0 ? '+' : ''}{(holding.momentum ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="font-mono text-xs text-muted-foreground">
                    {(holding.volatility ?? 0).toFixed(1)}%
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-3 text-xs text-muted-foreground">
        {isD2 ? (
          <p>※ S&P100構成銘柄（時価総額上位100社）から6ヶ月モメンタム上位を選定し、ボラティリティ逆数でウェイト付け</p>
        ) : (
          <p>※ S&P500全銘柄から6ヶ月モメンタム上位100銘柄を動的選定し、さらに上位を最終選定。ボラティリティ逆数でウェイト付け</p>
        )}
      </div>
    </motion.div>
  );
}
