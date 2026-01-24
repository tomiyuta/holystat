/**
 * 組み合わせ戦略（レジーム切り替え＋ストップロス）シミュレーション結果表示コンポーネント
 * 20年バックテストデータに基づく7シナリオ比較
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
  Layers,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';

interface FormattedCombinedScenario {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  cumulativeReturn: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  regimeSwitches: number;
  stopLossTriggers: number;
  tStatistic?: number;
  pValue?: number;
  significant?: boolean;
  cohensD?: number;
  effectSize?: string;
}

interface FormattedCombinedStrategyResult {
  strategyId: string;
  strategyName: string;
  strategyNameJa: string;
  scenarios: FormattedCombinedScenario[];
  bestBySharpe: string;
  bestByMaxDD: string;
}

interface FormattedCombinedSimulationResults {
  period: {
    start: string;
    end: string;
    months: number;
    years: number;
  };
  strategies: FormattedCombinedStrategyResult[];
  summary: {
    recommendation: string;
    keyFindings: string[];
  };
}

export function CombinedStrategyCard() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set(['d2', 'd3']));

  const { data, isLoading, error } = trpc.combinedStrategy.getResults.useQuery();

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
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-64 bg-gray-800" />
          <Skeleton className="h-4 w-96 bg-gray-800 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full bg-gray-800" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.available || !data?.results) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-400">
            <Layers className="w-5 h-5" />
            組み合わせ戦略シミュレーション
          </CardTitle>
          <CardDescription className="text-gray-500">
            データが利用できません
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const results = data.results as FormattedCombinedSimulationResults;

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/30">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    組み合わせ戦略シミュレーション
                    <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                      レジーム切り替え＋ストップロス
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {results.period.start} ～ {results.period.end}（{results.period.years}年間、{results.period.months}ヶ月）
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* 戦略概要 */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 border border-purple-500/30">
              <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                組み合わせ戦略の仕組み
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">レジーム切り替え</p>
                    <p className="text-gray-400">SPY &gt; MA200×0.95 → 攻撃型</p>
                    <p className="text-gray-400">SPY &lt; MA200×0.95 → 防御型</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">ストップロス</p>
                    <p className="text-gray-400">-10%下落でポジション半減</p>
                    <p className="text-gray-400">残り50%をキャッシュ保有</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">再投資タイミング</p>
                    <p className="text-gray-400">4種類の戦略を比較検証</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 各戦略の結果 */}
            {results.strategies.map((strategy) => (
              <div key={strategy.strategyId} className="space-y-3">
                <Collapsible
                  open={expandedStrategies.has(strategy.strategyId)}
                  onOpenChange={() => toggleStrategy(strategy.strategyId)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedStrategies.has(strategy.strategyId) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-semibold text-white">{strategy.strategyNameJa}</span>
                        <Badge variant="outline" className="text-xs">
                          {strategy.scenarios.length}シナリオ
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-emerald-400">
                              最高Sharpe: {strategy.scenarios.find(s => s.id === strategy.bestBySharpe)?.sharpeRatio.toFixed(2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>シャープレシオが最も高いシナリオ</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-blue-400">
                              最小DD: {strategy.scenarios.find(s => s.id === strategy.bestByMaxDD)?.maxDrawdown.toFixed(1)}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>最大ドローダウンが最も小さいシナリオ</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-400 font-medium">シナリオ</th>
                            <th className="px-3 py-2 text-right text-gray-400 font-medium">CAGR</th>
                            <th className="px-3 py-2 text-right text-gray-400 font-medium">最大DD</th>
                            <th className="px-3 py-2 text-right text-gray-400 font-medium">Sharpe</th>
                            <th className="px-3 py-2 text-right text-gray-400 font-medium">切替回数</th>
                            <th className="px-3 py-2 text-right text-gray-400 font-medium">SL発動</th>
                            <th className="px-3 py-2 text-center text-gray-400 font-medium">統計</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {strategy.scenarios.map((scenario) => {
                            const isBestSharpe = scenario.id === strategy.bestBySharpe;
                            const isBestDD = scenario.id === strategy.bestByMaxDD;
                            const isBaseline = scenario.id === 'baseline';
                            
                            return (
                              <tr 
                                key={scenario.id} 
                                className={`hover:bg-gray-800/30 ${
                                  isBestSharpe || isBestDD ? 'bg-emerald-500/5' : ''
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="text-white font-medium">{scenario.nameJa}</span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{scenario.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    {isBestSharpe && (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                        <Zap className="w-3 h-3 mr-1" />
                                        Sharpe最高
                                      </Badge>
                                    )}
                                    {isBestDD && !isBestSharpe && (
                                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                        <Shield className="w-3 h-3 mr-1" />
                                        DD最小
                                      </Badge>
                                    )}
                                    {isBaseline && (
                                      <Badge variant="outline" className="text-gray-400 text-xs">
                                        ベースライン
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className={scenario.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    {scenario.cagr >= 0 ? '+' : ''}{scenario.cagr.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-red-400">{scenario.maxDrawdown.toFixed(1)}%</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-cyan-400 font-medium">{scenario.sharpeRatio.toFixed(2)}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-gray-400">{scenario.regimeSwitches}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-gray-400">{scenario.stopLossTriggers}</span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {!isBaseline && scenario.pValue !== undefined && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            scenario.significant 
                                              ? 'border-emerald-500/50 text-emerald-400' 
                                              : 'border-gray-600 text-gray-500'
                                          }`}
                                        >
                                          {scenario.effectSize || 'N/A'}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-1">
                                          <p>p値: {scenario.pValue?.toFixed(4)}</p>
                                          <p>Cohen's d: {scenario.cohensD?.toFixed(3)}</p>
                                          <p>効果量: {scenario.effectSize}</p>
                                          <p className="text-gray-400">
                                            {scenario.significant 
                                              ? '統計的に有意（Bonferroni補正後）' 
                                              : '統計的に有意ではない'}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}

            {/* 主要な発見 */}
            {results.summary?.keyFindings && results.summary.keyFindings.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  主要な発見
                </h4>
                <ul className="space-y-2">
                  {results.summary.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 注意事項 */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-amber-200/80">
                  <p className="font-medium mb-1">シミュレーションの前提条件</p>
                  <ul className="space-y-0.5 text-amber-200/60">
                    <li>• 取引コストは考慮していません</li>
                    <li>• 月次リバランスを前提としています</li>
                    <li>• 過去のパフォーマンスは将来の結果を保証しません</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
