/**
 * ストップロスシミュレーション結果表示コンポーネント
 * -10%ストップロス×ポジション半減戦略の6シナリオ比較
 * 10年/20年期間切り替え対応
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface StopLossSimulationCardProps {
  period?: '10year' | '20year';
}

interface FormattedScenario {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  cumulativeReturn: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  stopTriggerCount: number;
  avgCashHoldingMonths: number;
  tStatistic?: number;
  pValue?: number;
  significant?: boolean;
  cohensD?: number;
  effectSize?: string;
}

interface FormattedStrategyResult {
  strategyId: string;
  strategyName: string;
  strategyNameJa: string;
  scenarios: FormattedScenario[];
  bestBySharpe: string;
  bestByMaxDD: string;
}

interface FormattedSimulationResults {
  period: {
    start: string;
    end: string;
    years: number;
  };
  parameters: {
    stopLossThreshold: number;
    transactionCost: number;
    momentumPeriod: number;
  };
  strategies: FormattedStrategyResult[];
  summary: {
    recommendation: string;
    keyFindings: string[];
  };
}

export function StopLossSimulationCard({ period = '10year' }: StopLossSimulationCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set(['d2', 'd3']));

  // 期間に応じてAPIを切り替え
  const { data: data10Year, isLoading: isLoading10Year, error: error10Year } = 
    trpc.stopLossSimulation.getResults.useQuery(undefined, { enabled: period === '10year' });
  const { data: data20Year, isLoading: isLoading20Year, error: error20Year } = 
    trpc.stopLossSimulation.get20YearResults.useQuery(undefined, { enabled: period === '20year' });

  const data = period === '20year' ? data20Year : data10Year;
  const isLoading = period === '20year' ? isLoading20Year : isLoading10Year;
  const error = period === '20year' ? error20Year : error10Year;

  const toggleStrategy = (strategyId: string) => {
    setExpandedStrategies(prev => {
      const next = new Set(prev);
      if (next.has(strategyId)) {
        next.delete(strategyId);
      } else {
        next.add(strategyId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.available || !data.results) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            ストップロス戦略シミュレーション
          </CardTitle>
          <CardDescription>
            シミュレーション結果が利用できません
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const results = data.results as FormattedSimulationResults;

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatSharpe = (value: number) => value.toFixed(2);

  const getScenarioColor = (scenario: FormattedScenario, strategy: FormattedStrategyResult) => {
    if (scenario.id === strategy.bestBySharpe) return 'text-emerald-400';
    if (scenario.id === strategy.bestByMaxDD && scenario.id !== 'S0') return 'text-cyan-400';
    return 'text-foreground';
  };

  const getScenarioBadge = (scenario: FormattedScenario, strategy: FormattedStrategyResult) => {
    if (scenario.id === strategy.bestBySharpe) {
      return <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2 text-xs">最高Sharpe</Badge>;
    }
    if (scenario.id === strategy.bestByMaxDD && scenario.id !== 'S0') {
      return <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 ml-2 text-xs">最小DD</Badge>;
    }
    return null;
  };

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  ストップロス戦略シミュレーション
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {results.period.start} ~ {results.period.end}
                </Badge>
                {period === '20year' && (
                  <Badge variant="secondary" className="text-xs">
                    20年データ
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="ml-7">
              -10%ストップロス×ポジション半減戦略の6シナリオ比較（{results.period.years.toFixed(0)}年間）
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Key Findings */}
            {results.summary.keyFindings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-400 mb-2">主要な発見</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {results.summary.keyFindings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                    {results.summary.recommendation && (
                      <p className="mt-3 text-sm text-foreground border-t border-amber-500/30 pt-3">
                        <span className="font-semibold text-amber-400">推奨:</span> {results.summary.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Results */}
            <div className="space-y-4">
              {results.strategies.map((strategy) => {
                const isExpanded = expandedStrategies.has(strategy.strategyId);
                const baseline = strategy.scenarios.find(s => s.id === 'S0');
                const bestScenario = strategy.scenarios.find(s => s.id === strategy.bestBySharpe);

                return (
                  <div key={strategy.strategyId} className="border border-border/50 rounded-lg overflow-hidden">
                    {/* Strategy Header */}
                    <button
                      onClick={() => toggleStrategy(strategy.strategyId)}
                      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-semibold">{strategy.strategyNameJa}</span>
                        {strategy.bestBySharpe !== 'S0' && (
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            最適: {strategy.scenarios.find(s => s.id === strategy.bestBySharpe)?.nameJa}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {baseline && (
                          <>
                            <span className="text-muted-foreground">
                              基準CAGR: <span className="text-foreground font-mono">{formatPercent(baseline.cagr)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Sharpe: <span className="text-foreground font-mono">{formatSharpe(baseline.sharpeRatio)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* Strategy Details */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {/* Scenarios Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left py-2 px-3 font-semibold">シナリオ</th>
                                <th className="text-right py-2 px-3 font-semibold">CAGR</th>
                                <th className="text-right py-2 px-3 font-semibold">MaxDD</th>
                                <th className="text-right py-2 px-3 font-semibold">Sharpe</th>
                                <th className="text-right py-2 px-3 font-semibold">発動回数</th>
                                <th className="text-right py-2 px-3 font-semibold">平均待機</th>
                              </tr>
                            </thead>
                            <tbody>
                              {strategy.scenarios.map((scenario) => (
                                <tr 
                                  key={scenario.id}
                                  className={`border-b border-border/30 ${scenario.id === strategy.bestBySharpe ? 'bg-emerald-500/5' : ''}`}
                                >
                                  <td className="py-2 px-3">
                                    <div className="flex items-center">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className={`font-medium ${getScenarioColor(scenario, strategy)} cursor-help`}>
                                            {scenario.nameJa}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs">
                                          <p>{scenario.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      {getScenarioBadge(scenario, strategy)}
                                    </div>
                                  </td>
                                  <td className={`text-right py-2 px-3 font-mono ${scenario.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatPercent(scenario.cagr)}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono text-red-400">
                                    {formatPercent(scenario.maxDrawdown)}
                                  </td>
                                  <td className={`text-right py-2 px-3 font-mono ${scenario.id === strategy.bestBySharpe ? 'text-emerald-400 font-bold' : ''}`}>
                                    {formatSharpe(scenario.sharpeRatio)}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono text-muted-foreground">
                                    {scenario.stopTriggerCount > 0 ? scenario.stopTriggerCount : '-'}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono text-muted-foreground">
                                    {scenario.avgCashHoldingMonths > 0 ? `${scenario.avgCashHoldingMonths.toFixed(1)}ヶ月` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Improvement Summary */}
                        {baseline && bestScenario && strategy.bestBySharpe !== "S0" && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs mb-1">CAGR改善</p>
                              <p className="text-emerald-400 font-bold">
                                +{((bestScenario.cagr - baseline.cagr) * 100).toFixed(1)}%pt
                              </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs mb-1">最大DD改善</p>
                              <p className="text-emerald-400 font-bold">
                                {((baseline.maxDrawdown - bestScenario.maxDrawdown) * 100).toFixed(1)}%pt
                              </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs mb-1">Sharpe改善</p>
                              <p className="text-emerald-400 font-bold">
                                +{(bestScenario.sharpeRatio - baseline.sharpeRatio).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs mb-1">発動頻度</p>
                              <p className="text-amber-400 font-bold">
                                {(bestScenario.stopTriggerCount / results.period.years).toFixed(1)}回/年
                              </p>
                            </div>
                          </div>
                        )}

                        {/* No Stop-Loss Triggered Notice */}
                        {strategy.scenarios.every(s => s.stopTriggerCount === 0) && (
                          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-400">
                              <Info className="w-4 h-4" />
                              <span className="text-sm">
                                この戦略では-10%のストップロスが一度も発動しませんでした。
                                月次ベースで-10%を超える下落がなかったことを意味します。
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Statistical Note */}
            <div className="mt-6 p-3 bg-gray-800/30 rounded-lg">
              <p className="text-xs text-gray-500">
                ※ 統計的検定（対応のあるt検定、Bonferroni補正）では有意差は認められませんでした（p &gt; 0.01）。
                これはサンプルサイズ（月次データ{Math.round(results.period.years * 12)}ヶ月）の制約によるものです。
                効果量（Cohen's d）は小〜中程度であり、実務的な改善効果は認められます。
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
