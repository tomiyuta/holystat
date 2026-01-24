import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function HistoryCard() {
  const { data: history, isLoading, error } = trpc.market.getHistory.useQuery(
    { limit: 10 },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - サーバーキャッシュと同期
      retry: 2,
    }
  );

  const getRegimeConfig = (regime: string) => {
    switch (regime) {
      case 'bull':
        return {
          icon: TrendingUp,
          color: 'oklch(0.75 0.2 145)',
          bgColor: 'oklch(0.75 0.2 145 / 0.1)',
          label: '強気',
        };
      case 'bear':
        return {
          icon: TrendingDown,
          color: 'oklch(0.65 0.25 25)',
          bgColor: 'oklch(0.65 0.25 25 / 0.1)',
          label: '弱気',
        };
      default:
        return {
          icon: TrendingUp,
          color: 'oklch(0.7 0.15 220)',
          bgColor: 'oklch(0.7 0.15 220 / 0.1)',
          label: '不明',
        };
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-card"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">履歴を読み込み中...</span>
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
        <div className="text-center py-6">
          <p className="text-sm text-destructive">履歴の取得に失敗しました</p>
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">シグナル履歴</h3>
          <p className="text-xs text-muted-foreground">SPY vs MA200×0.95 判定履歴</p>
        </div>
      </div>

      {/* History List */}
      {history && history.length > 0 ? (
        <div className="space-y-2">
          {history.map((record, index) => {
            const config = getRegimeConfig(record.regime);
            const Icon = config.icon;
            const date = new Date(record.date);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-1.5 rounded"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono font-semibold text-sm"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        信頼度 {Number(record.confidence).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      SPY: ${Number(record.spyPrice).toFixed(2)} | 閾値: ${Number(record.threshold).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">履歴がありません</p>
        </div>
      )}
    </motion.div>
  );
}
