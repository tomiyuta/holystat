/**
 * 年次パフォーマンス詳細表コンポーネント（13戦略対応）
 * 13戦略の年次リターン、MaxDD、勝率を一覧表示
 * 危機年（2008, 2020等）を強調表示
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  crisisYears,
  strategyNames,
  yearlyReturns,
  summaryStats,
  years,
  strategies,
} from '@/data/yearlyPerformanceData';
import { TrendingUp, TrendingDown, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

// 表示モード
type ViewMode = 'yearly' | 'summary' | 'comparison';

// 色の定義
const getReturnColor = (value: number): string => {
  if (value >= 50) return 'text-emerald-400';
  if (value >= 20) return 'text-green-400';
  if (value >= 0) return 'text-green-300';
  if (value >= -10) return 'text-red-300';
  if (value >= -20) return 'text-red-400';
  return 'text-red-500';
};

const getReturnBgColor = (value: number): string => {
  if (value >= 50) return 'bg-emerald-500/20';
  if (value >= 20) return 'bg-green-500/15';
  if (value >= 0) return 'bg-green-500/10';
  if (value >= -10) return 'bg-red-500/10';
  if (value >= -20) return 'bg-red-500/15';
  return 'bg-red-500/20';
};

export default function YearlyPerformanceTable13() {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([
    'D3', 'D3+防御型', 'D3+防御型_VolScale', 'SPY'
  ]);
  const [sortColumn, setSortColumn] = useState<string>('cagr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllStrategies, setShowAllStrategies] = useState(false);

  // 戦略の選択/解除
  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  // 全戦略表示/主要戦略のみ
  const displayStrategies = showAllStrategies ? strategies : selectedStrategies;

  // ソート済みサマリー
  const sortedSummary = useMemo(() => {
    const entries = Object.entries(summaryStats);
    return entries.sort((a, b) => {
      const aVal = a[1][sortColumn as keyof typeof a[1]] as number;
      const bVal = b[1][sortColumn as keyof typeof b[1]] as number;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [sortColumn, sortDirection]);

  // ソートハンドラー
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // ソートアイコン
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'desc' ? 
      <ChevronDown className="w-4 h-4 inline ml-1" /> : 
      <ChevronUp className="w-4 h-4 inline ml-1" />;
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">年次パフォーマンス詳細（13戦略）</CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* 表示モード切替 */}
            <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
              <Button
                variant={viewMode === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('yearly')}
                className="text-xs"
              >
                年次リターン
              </Button>
              <Button
                variant={viewMode === 'summary' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('summary')}
                className="text-xs"
              >
                サマリー統計
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className="text-xs"
              >
                危機年比較
              </Button>
            </div>

            {/* 全戦略表示切替 */}
            <Button
              variant={showAllStrategies ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAllStrategies(!showAllStrategies)}
              className="text-xs"
            >
              {showAllStrategies ? '主要戦略のみ' : '全13戦略表示'}
            </Button>
          </div>
        </div>

        {/* 戦略選択（主要戦略モード時） */}
        {!showAllStrategies && (
          <div className="flex flex-wrap gap-2 mt-4">
            {strategies.map(strategy => (
              <Button
                key={strategy}
                variant={selectedStrategies.includes(strategy) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleStrategy(strategy)}
                className="text-xs"
              >
                {strategyNames[strategy] || strategy}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* 年次リターン表 */}
        {viewMode === 'yearly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-card/50 z-10">年</th>
                  {displayStrategies.map(strategy => (
                    <th key={strategy} className="text-right py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">
                      {strategyNames[strategy] || strategy}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map(year => {
                  const isCrisis = year in crisisYears;
                  return (
                    <tr 
                      key={year} 
                      className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${
                        isCrisis ? 'bg-red-500/10' : ''
                      }`}
                    >
                      <td className={`py-2 px-3 font-mono sticky left-0 bg-card/50 z-10 ${
                        isCrisis ? 'bg-red-500/10' : ''
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={isCrisis ? 'text-red-400 font-semibold' : ''}>{year}</span>
                          {isCrisis && (
                            <span className="text-xs text-red-400 hidden sm:inline">
                              ({crisisYears[year]})
                            </span>
                          )}
                        </div>
                      </td>
                      {displayStrategies.map(strategy => {
                        const value = yearlyReturns[strategy]?.[year.toString()] ?? 0;
                        return (
                          <td 
                            key={strategy} 
                            className={`py-2 px-3 text-right font-mono ${getReturnColor(value)} ${getReturnBgColor(value)}`}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {value >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* サマリー統計表 */}
        {viewMode === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">戦略</th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('cagr')}
                  >
                    CAGR <SortIcon column="cagr" />
                  </th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('maxDrawdown')}
                  >
                    MaxDD <SortIcon column="maxDrawdown" />
                  </th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('sharpe')}
                  >
                    Sharpe <SortIcon column="sharpe" />
                  </th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('sortino')}
                  >
                    Sortino <SortIcon column="sortino" />
                  </th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('calmar')}
                  >
                    Calmar <SortIcon column="calmar" />
                  </th>
                  <th 
                    className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('winRate')}
                  >
                    勝率 <SortIcon column="winRate" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSummary
                  .filter(([strategy]) => showAllStrategies || selectedStrategies.includes(strategy))
                  .map(([strategy, stats], index) => (
                    <tr 
                      key={strategy} 
                      className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${
                        index === 0 ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">TOP</span>}
                          {strategyNames[strategy] || strategy}
                        </div>
                      </td>
                      <td className={`py-2 px-3 text-right font-mono ${getReturnColor(stats.cagr)}`}>
                        +{stats.cagr.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-red-400">
                        {stats.maxDrawdown.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {stats.sharpe.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {stats.sortino.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {stats.calmar.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono ${
                        stats.winRate >= 80 ? 'text-emerald-400' : 
                        stats.winRate >= 70 ? 'text-green-400' : 
                        'text-yellow-400'
                      }`}>
                        {stats.winRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 危機年比較 */}
        {viewMode === 'comparison' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>危機年における各戦略のパフォーマンスを比較</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">危機イベント</th>
                    {displayStrategies.map(strategy => (
                      <th key={strategy} className="text-right py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">
                        {strategyNames[strategy] || strategy}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(crisisYears).map(([year, event]) => (
                    <tr key={year} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-red-400">{year}</span>
                          <span className="text-xs text-muted-foreground">{event}</span>
                        </div>
                      </td>
                      {displayStrategies.map(strategy => {
                        const value = yearlyReturns[strategy]?.[year] ?? 0;
                        const spyValue = yearlyReturns['SPY']?.[year] ?? 0;
                        const outperformsSpy = value > spyValue;
                        return (
                          <td 
                            key={strategy} 
                            className={`py-2 px-3 text-right font-mono ${getReturnColor(value)}`}
                          >
                            <div className="flex flex-col items-end">
                              <span>{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span>
                              {strategy !== 'SPY' && (
                                <span className={`text-xs ${outperformsSpy ? 'text-green-400' : 'text-red-400'}`}>
                                  vs SPY: {(value - spyValue) >= 0 ? '+' : ''}{(value - spyValue).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 危機年サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {displayStrategies.map(strategy => {
                const crisisReturns = Object.keys(crisisYears).map(year => 
                  yearlyReturns[strategy]?.[year] ?? 0
                );
                const avgCrisisReturn = crisisReturns.reduce((a, b) => a + b, 0) / crisisReturns.length;
                const worstCrisisReturn = Math.min(...crisisReturns);
                const positiveCount = crisisReturns.filter(r => r > 0).length;
                
                return (
                  <Card key={strategy} className="bg-muted/20 border-border/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{strategyNames[strategy] || strategy}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">危機年平均:</span>
                          <span className={getReturnColor(avgCrisisReturn)}>
                            {avgCrisisReturn >= 0 ? '+' : ''}{avgCrisisReturn.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">最悪年:</span>
                          <span className="text-red-400">{worstCrisisReturn.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">プラス年:</span>
                          <span className={positiveCount >= 4 ? 'text-green-400' : 'text-yellow-400'}>
                            {positiveCount}/{crisisReturns.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-6 pt-4 border-t border-border/30">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>バックテスト期間: 2004-2025（22年間）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/20 rounded" />
              <span>危機年</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500/20 rounded" />
              <span>+50%以上</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500/15 rounded" />
              <span>+20%以上</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
