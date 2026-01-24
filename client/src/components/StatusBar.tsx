import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import { MarketRegime, RefreshResult } from '@/hooks/useMarketSignals';

interface StatusBarProps {
  regime: MarketRegime;
  regimeJapanese: string;
  confidence: number;
  lastUpdated: Date;
  onRefresh: () => void;
  onForceRefresh?: () => void;
  loading: boolean;
  isRefreshing?: boolean;
  refreshResult?: RefreshResult;
}

export function StatusBar({ 
  regime, 
  regimeJapanese, 
  confidence, 
  lastUpdated, 
  onRefresh,
  onForceRefresh,
  loading,
  isRefreshing = false,
  refreshResult,
}: StatusBarProps) {
  const getRegimeColor = () => {
    switch (regime) {
      case 'bull': return 'text-[oklch(0.75_0.2_145)]';
      case 'bear': return 'text-[oklch(0.65_0.25_25)]';
      default: return 'text-[oklch(0.7_0.15_220)]';
    }
  };

  const getRegimeBgColor = () => {
    switch (regime) {
      case 'bull': return 'bg-[oklch(0.75_0.2_145)]/10 border-[oklch(0.75_0.2_145)]/30 hover:bg-[oklch(0.75_0.2_145)]/20';
      case 'bear': return 'bg-[oklch(0.65_0.25_25)]/10 border-[oklch(0.65_0.25_25)]/30 hover:bg-[oklch(0.65_0.25_25)]/20';
      default: return 'bg-[oklch(0.7_0.15_220)]/10 border-[oklch(0.7_0.15_220)]/30 hover:bg-[oklch(0.7_0.15_220)]/20';
    }
  };

  const getRegimeDisplay = () => {
    switch (regime) {
      case 'bull': return 'BULL';
      case 'bear': return 'BEAR';
      default: return 'NEUTRAL';
    }
  };

  // 更新結果のアイコンとスタイルを取得
  const getRefreshResultIcon = () => {
    if (!refreshResult || refreshResult.status === 'idle') return null;
    
    switch (refreshResult.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-[oklch(0.75_0.2_145)]" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-[oklch(0.65_0.25_25)]" />;
      default:
        return null;
    }
  };

  const getRefreshResultStyle = () => {
    if (!refreshResult || refreshResult.status === 'idle') return '';
    
    switch (refreshResult.status) {
      case 'loading':
        return 'bg-primary/10 border-primary/30 text-primary';
      case 'success':
        return 'bg-[oklch(0.75_0.2_145)]/10 border-[oklch(0.75_0.2_145)]/30 text-[oklch(0.75_0.2_145)]';
      case 'error':
        return 'bg-[oklch(0.65_0.25_25)]/10 border-[oklch(0.65_0.25_25)]/30 text-[oklch(0.65_0.25_25)]';
      default:
        return '';
    }
  };

  // 最終更新日時をコンパクトにフォーマット（ボタン内用）
  const formatLastUpdatedCompact = (date: Date) => {
    return date.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // シグナル強度を取得（高: 80%以上、中: 50-80%、低: 50%未満）
  const getSignalStrength = () => {
    if (confidence >= 80) return { label: '高', color: 'text-[oklch(0.75_0.2_145)]' };
    if (confidence >= 50) return { label: '中', color: 'text-[oklch(0.7_0.15_60)]' };
    return { label: '低', color: 'text-[oklch(0.65_0.25_25)]' };
  };

  const signalStrength = getSignalStrength();

  // 更新ハンドラ
  const handleRefresh = () => {
    if (!loading && !isRefreshing) {
      (onForceRefresh || onRefresh)();
    }
  };

  return (
    <div className="bg-card/50 border-b border-border backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Left: System Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-muted-foreground">PORTFOLIO ADVISOR</span>
            </div>
            <div className="h-4 w-px bg-border" />
            {/* レジームボタン（クリックで更新） */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className={`px-3 py-1.5 rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getRegimeBgColor()}`}
              title="クリックで最新データを取得"
            >
              <div className="flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-semibold ${getRegimeColor()}`}>
                    {getRegimeDisplay()} - {regimeJapanese}
                  </span>
                  <RefreshCw className={`w-3.5 h-3.5 ${getRegimeColor()} ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                </div>
                <span className={`font-mono text-[10px] opacity-70 ${getRegimeColor()}`}>
                  {isRefreshing ? '更新中...' : `更新: ${formatLastUpdatedCompact(lastUpdated)}`}
                </span>
              </div>
            </motion.button>
          </div>

          {/* Right: Status Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs font-mono">シグナル強度:</span>
              <span className={`text-sm font-mono font-semibold ${signalStrength.color}`}>
                {signalStrength.label}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            {/* 次回リバランス日ボタン */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/30">
              <Calendar className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-primary/70">次回リバランス</span>
                <span className="text-xs font-mono font-semibold text-primary">2026年2月1日</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 更新結果の通知バー */}
        <AnimatePresence>
          {refreshResult && refreshResult.status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`flex items-center gap-2 px-3 py-2 rounded border ${getRefreshResultStyle()}`}>
                {getRefreshResultIcon()}
                <span className="text-xs font-mono">
                  {refreshResult.message}
                </span>
                {refreshResult.status === 'error' && (
                  <span className="text-xs font-mono opacity-70 ml-auto">
                    バッチ処理データを使用中
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
