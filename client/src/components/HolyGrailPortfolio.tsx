import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Loader2, AlertTriangle, Building2, Globe, Shield, Sparkles, Database, Calendar } from 'lucide-react';
import { SimulationConditionsHeader } from './SimulationConditionsBadge';
import { DataSourceBadge, DataSource } from './DataSourceIndicator';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useMemo } from 'react';

interface Holding {
  symbol: string;
  name: string;
  weight: number;
  momentum?: number;
  volatility?: number;
  category?: string;
}

type StrategyType = 'd2' | 'd3' | 'defensive' | 'defensiveTop3' | 'defensiveTop5';

interface StrategyConfig {
  id: StrategyType;
  name: string;
  subtitle: string;
  icon: typeof Building2;
  gradientFrom: string;
  gradientTo: string;
  shadowColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  footerNote: string;
}

const STRATEGY_CONFIGS: Record<StrategyType, StrategyConfig> = {
  d2: {
    id: 'd2',
    name: 'D2戦略',
    subtitle: 'S&P100',
    icon: Building2,
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-600',
    shadowColor: 'shadow-blue-500/25',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'S&P100構成銘柄から6ヶ月モメンタム上位5銘柄を選定',
    footerNote: '※ S&P100構成銘柄から6ヶ月モメンタム上位5銘柄を選定し、ボラティリティ逆数でウェイト付け。月次リバランス。',
  },
  d3: {
    id: 'd3',
    name: 'D3戦略',
    subtitle: 'S&P500',
    icon: Globe,
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-600',
    shadowColor: 'shadow-emerald-500/25',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'S&P500全銘柄から6ヶ月モメンタム上位5銘柄を選定',
    footerNote: '※ S&P500全銘柄から6ヶ月モメンタム上位5銘柄に集中投資。ボラティリティ逆数でウェイト付け。',
  },
  defensive: {
    id: 'defensive',
    name: '防御型',
    subtitle: 'ETF・TOP3',
    icon: Shield,
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-orange-600',
    shadowColor: 'shadow-amber-500/25',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: '14種類のETFから6ヶ月モメンタム上位3銘柄を選定（統合戦略用）',
    footerNote: '※ 統合戦略での使用を想定。攻撃型との切替時に集中投資。CAGR 7.06%, 最大DD -21.99%',
  },
  defensiveTop3: {
    id: 'defensiveTop3',
    name: '防御型TOP3',
    subtitle: 'ETF・統合用',
    icon: Shield,
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-orange-600',
    shadowColor: 'shadow-amber-500/25',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: '14種類のETFから6ヶ月モメンタム上位3銘柄を選定（統合戦略用）',
    footerNote: '※ 統合戦略での使用を想定。攻撃型との切替時に集中投資。CAGR 7.06%, 最大DD -21.99%',
  },
  defensiveTop5: {
    id: 'defensiveTop5',
    name: '防御型TOP5',
    subtitle: 'ETF・単体運用',
    icon: Shield,
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-yellow-600',
    shadowColor: 'shadow-orange-500/25',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: '14種類のETFから6ヶ月モメンタム上位5銘柄を選定（単体運用向け）',
    footerNote: '※ 単体運用向け。分散効果でボラティリティ8.6%、最大DD-17.46%。CAGR 7.66%',
  },
};

// フォールバック用のデフォルト値（Holy Grailデータ: 2004-01〜2025-12）
// grail.json 2026-01-24生成、holygrail.parquetベースの最新シミュレーション結果
const DEFAULT_PERFORMANCE = {
  d2: { annualReturn: 20.73, maxDrawdown: -43.73 },  // CAGR: 20.73%, MaxDD: -43.73%
  d3: { annualReturn: 32.51, maxDrawdown: -48.28 },  // CAGR: 32.51%, MaxDD: -48.28%
  defensive: { annualReturn: 7.06, maxDrawdown: -21.99 },  // CAGR: 7.06%, MaxDD: -21.99% (TOP3選択)
  defensiveTop3: { annualReturn: 7.06, maxDrawdown: -21.99 },  // CAGR: 7.06%, MaxDD: -21.99%
  defensiveTop5: { annualReturn: 7.66, maxDrawdown: -17.46 },  // CAGR: 7.66%, MaxDD: -17.46%
};

export function HolyGrailPortfolio() {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('d2');
  
  // ポートフォリオ構成銘柄を取得
  const { data, isLoading, error } = trpc.portfolio.getD2D3Recommendations.useQuery(undefined, {
    staleTime: 60000,
    retry: 2,
  });

  // パフォーマンスデータを取得（20年バックテスト結果）
  const { data: performanceData } = trpc.performance.get20YearData.useQuery(undefined, {
    staleTime: 300000, // 5分キャッシュ
    retry: 1,
  });

  // 市場環境に応じたデフォルト戦略（推奨ではなく参考表示）
  const regime = data?.regime ?? 'bull';
  // 弱気相場: 防御型TOP5をデフォルト表示
  // 強気相場: D2をデフォルト表示
  const defaultStrategy: StrategyType = regime === 'bear' ? 'defensiveTop5' : 'd2';
  
  // 初回ロード時にデフォルト戦略を選択
  useEffect(() => {
    if (data && !isLoading) {
      setActiveStrategy(defaultStrategy);
    }
  }, [data, isLoading, defaultStrategy]);

  // パフォーマンス値を動的に取得（補正前/補正後の両方）
  const getPerformanceValues = useMemo(() => {
    return (strategy: StrategyType) => {
      // 防御型TOP3/TOP5はシミュレーション結果のデフォルト値を使用（APIは防御型のバックテストデータを返さないため）
      if (strategy === 'defensiveTop3' || strategy === 'defensiveTop5') {
        return {
          annualReturn: DEFAULT_PERFORMANCE[strategy].annualReturn,
          maxDrawdown: DEFAULT_PERFORMANCE[strategy].maxDrawdown,
          rawAnnualReturn: DEFAULT_PERFORMANCE[strategy].annualReturn,
          biasCorrection: null,
          hasAdjusted: false,
          dataSource: 'backtest' as const,
        };
      }
      
      if (performanceData) {
        const strategyData = performanceData[strategy];
        if (strategyData?.summary) {
          // 補正後の値があれば使用
          const adjustedSummary = strategyData.adjustedSummary;
          const rawSummary = strategyData.rawSummary || strategyData.summary;
          
          return {
            // 補正後の値（メイン表示）
            annualReturn: adjustedSummary?.annualizedReturn ?? strategyData.summary.annualizedReturn,
            maxDrawdown: strategyData.summary.maxDrawdown, // ドローダウンは補正しない
            // 補正前の値（参考表示）
            rawAnnualReturn: rawSummary?.annualizedReturn ?? strategyData.summary.annualizedReturn,
            // バイアス補正情報
            biasCorrection: adjustedSummary?.biasCorrection,
            hasAdjusted: !!adjustedSummary,
            dataSource: strategyData.dataSource,
          };
        }
      }
      // フォールバック
      return {
        ...DEFAULT_PERFORMANCE[strategy],
        rawAnnualReturn: DEFAULT_PERFORMANCE[strategy].annualReturn,
        biasCorrection: null,
        hasAdjusted: false,
        dataSource: 'fallback' as const,
      };
    };
  }, [performanceData]);

  // バックテスト期間を取得
  const backtestPeriod = useMemo(() => {
    if (performanceData?.metadata?.dataRange) {
      const { start, end } = performanceData.metadata.dataRange;
      const startDate = new Date(start);
      const endDate = new Date(end);
      // 正確な月数計算: (終了年-開始年)*12 + (終了月-開始月) + 1
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth()) + 1;
      return {
        start: `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`,
        end: `${endDate.getFullYear()}年${endDate.getMonth() + 1}月`,
        months,
      };
    }
    return null;
  }, [performanceData]);

  const getPortfolioData = (strategy: StrategyType) => {
    if (!data) return null;
    switch (strategy) {
      case 'd2': return data.d2;
      case 'd3': return data.d3;
      case 'defensive': return data.defensive;
      case 'defensiveTop3': return data.defensive; // TOP3はdefensiveの上位3銘柄を使用
      case 'defensiveTop5': return data.defensive; // TOP5はdefensiveの全データを使用
      default: return null;
    }
  };

  const portfolioData = getPortfolioData(activeStrategy);
  // 防御型TOP3は上位3銘柄、TOP5は上位5銘柄を表示
  // TOP3選択時はリスク逆数ウェイトを再計算して合計100%に調整
  const rawHoldings: Holding[] = portfolioData?.holdings ?? [];
  const holdings: Holding[] = useMemo(() => {
    if (activeStrategy === 'defensiveTop3') {
      const top3 = rawHoldings.slice(0, 3);
      // リスク逆数ウェイトを再計算: ウェイト = (1÷リスク) ÷ Σ(1÷リスク)
      // リスクはボラティリティを使用、なければ元のウェイトから1を使用
      const totalInverseRisk = top3.reduce((sum, h) => {
        const risk = h.volatility || (h.weight > 0 ? 1 / h.weight : 1);
        return sum + (1 / risk);
      }, 0);
      
      return top3.map(h => {
        const risk = h.volatility || (h.weight > 0 ? 1 / h.weight : 1);
        const newWeight = totalInverseRisk > 0 ? ((1 / risk) / totalInverseRisk) * 100 : h.weight;
        return {
          ...h,
          weight: Math.round(newWeight * 10) / 10, // 小数点1桁に丸める
        };
      });
    } else if (activeStrategy === 'defensiveTop5') {
      return rawHoldings.slice(0, 5);
    }
    return rawHoldings;
  }, [activeStrategy, rawHoldings]);
  const usingFallback = portfolioData?.usingFallback ?? false;
  const fallbackReason = portfolioData?.fallbackReason;
  const config = STRATEGY_CONFIGS[activeStrategy];
  const performance = getPerformanceValues(activeStrategy);

  // データソース情報
  const dataSource = (data?.dataSource ?? 'fallback') as DataSource;
  const dataAge = data?.dataAge ?? -1;
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated) : new Date();

  // 次回リバランス日を計算（毎月1日）
  const nextRebalanceDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    // 今日が1日なら今日、それ以外は来月1日
    if (day === 1) {
      return new Date(year, month, 1);
    } else {
      return new Date(year, month + 1, 1);
    }
  }, []);

  // リバランス日までの日数を計算
  const daysUntilRebalance = useMemo(() => {
    const now = new Date();
    const diffTime = nextRebalanceDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [nextRebalanceDate]);

  // リバランス日のフォーマット
  const formatRebalanceDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 年率リターンと最大DDのフォーマット
  const formatReturn = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatDrawdown = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >

      {/* 戦略タブ（4タブ: D2, D3, 防御型TOP3, 防御型TOP5）とデータソースバッジ */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border flex-wrap justify-center">
          {(['d2', 'd3', 'defensiveTop3', 'defensiveTop5'] as StrategyType[]).map((strategy) => {
            const strategyConfig = STRATEGY_CONFIGS[strategy];
            const Icon = strategyConfig.icon;
            const isActive = activeStrategy === strategy;
            return (
              <button
                key={strategy}
                onClick={() => setActiveStrategy(strategy)}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${strategyConfig.gradientFrom} ${strategyConfig.gradientTo} text-white shadow-lg ${strategyConfig.shadowColor}`
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{strategyConfig.name}</div>
                  <div className="text-xs opacity-80">{strategyConfig.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
        {/* データソースバッジと次回リバランス日 */}
        <div className="flex items-center gap-3">
          {data && (
            <DataSourceBadge
              dataSource={dataSource}
              dataAge={dataAge}
              lastUpdated={lastUpdated}
            />
          )}
          {/* 次回リバランス日表示 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              次回リバランス: {formatRebalanceDate(nextRebalanceDate)}
              {daysUntilRebalance > 0 && (
                <span className="ml-1 text-muted-foreground">(あと{daysUntilRebalance}日)</span>
              )}
              {daysUntilRebalance === 0 && (
                <span className="ml-1 text-emerald-400">(本日)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="ml-3 text-muted-foreground">聖杯ポートフォリオを構築中...</span>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="text-center py-12 bg-destructive/10 rounded-2xl border border-destructive/30">
          <p className="text-destructive font-medium">データの取得に失敗しました</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      )}

      {/* メインコンテンツ */}
      {!isLoading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStrategy}
            initial={{ opacity: 0, x: activeStrategy === 'd2' ? -20 : activeStrategy === 'd3' ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >

            {/* フォールバック警告 */}
            {usingFallback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-500">フォールバックデータを使用中</p>
                    <p className="text-sm text-amber-500/80 mt-1">
                      {fallbackReason || 'API制限により一部の銘柄データが取得できませんでした。'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 戦略サマリー */}
            <div className={`mb-6 p-6 rounded-2xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgColor} to-transparent`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${config.textColor}`}>
                    {config.name}（{config.subtitle}）
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold font-mono ${config.textColor}`}>
                    {holdings.length}
                  </div>
                  <p className="text-sm text-muted-foreground">構成銘柄</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">年率リターン</p>
                    {backtestPeriod && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted/50 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {backtestPeriod.months}ヶ月BT
                      </span>
                    )}
                    {performance.hasAdjusted && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                        バイアス補正済
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${config.textColor}`}>
                    {formatReturn(performance.annualReturn)}
                  </p>
                  {/* 補正前の値を参考表示 */}
                  {performance.hasAdjusted && performance.rawAnnualReturn !== performance.annualReturn && (
                    <p className="text-xs text-muted-foreground mt-1">
                      補正前: {formatReturn(performance.rawAnnualReturn)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">最大ドローダウン</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatDrawdown(performance.maxDrawdown)}
                  </p>
                </div>
              </div>
              {/* サバイバーシップバイアス補正の説明 */}
              {performance.hasAdjusted && performance.biasCorrection && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 font-medium mb-1">
                    サバイバーシップバイアス補正
                  </p>
                  <p className="text-xs text-muted-foreground">
                    現在のS&P500構成銘柄で過去をバックテストすると、倒産・除外銘柄が含まれないためリターンが過大評価されます。
                    年率{performance.biasCorrection.annualRate}%を差し引いて補正しています。
                  </p>
                </div>
              )}
              {/* シミュレーション条件バッジ */}
              <div className="mt-3 pt-3 border-t border-border/30">
                <SimulationConditionsHeader />
              </div>
            </div>

            {/* 銘柄テーブル */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur">
              <table className="w-full">
                <thead>
                  <tr className={config.bgColor}>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">銘柄</th>
                    <th className="px-6 py-4 text-right font-semibold text-foreground">ウェイト</th>
                    <th className="px-6 py-4 text-right font-semibold text-foreground">6ヶ月モメンタム</th>
                    <th className="px-6 py-4 text-right font-semibold text-foreground">
                      {activeStrategy === 'defensive' ? 'カテゴリ' : 'ボラティリティ'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <motion.tr
                      key={holding.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center text-sm font-bold ${config.textColor}`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{holding.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {holding.name || holding.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
                          {holding.weight.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {holding.momentum !== undefined ? (
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-mono">
                              +{holding.momentum.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {activeStrategy === 'defensive' ? (
                          <span className="text-muted-foreground text-sm">
                            {holding.category || '-'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">
                            {holding.volatility !== undefined 
                              ? `${(holding.volatility * 100).toFixed(1)}%` 
                              : '-'}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* フッターノート */}
            <div className="mt-4 text-xs text-muted-foreground text-center">
              {config.footerNote}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
