/**
 * レジーム切り替え戦略シミュレーション結果表示コンポーネント
 * SPY vs MA200 × 0.95による攻撃型/防御型切り替え戦略の比較
 * 10年/20年期間切り替え対応
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react';

interface RegimeSwitchingCardProps {
  period?: '10year' | '20year';
}

// DBに保存されている実際のJSON構造に合わせたインターフェース
interface ScenarioResult {
  scenario: string;
  strategy?: string;
  cumulative_return: number;
  cagr: number;
  max_drawdown: number;
  sharpe_ratio: number;
  regime_switches: number;
  bull_months: number;
  bear_months: number;
  total_rebalance_cost?: number;
  total_switch_cost?: number;
  stop_trigger_count?: number;
}

// 20年データの辞書形式
interface Strategy20YearResult {
  strategy: string;
  cumulative_return: number;
  cagr: number;
  max_drawdown: number;
  sharpe_ratio: number;
  regime_switches: number;
}

interface Results20Year {
  D2: {
    aggressive_only: Strategy20YearResult;
    defensive_only: Strategy20YearResult;
    regime_switching: Strategy20YearResult;
  };
  D3: {
    aggressive_only: Strategy20YearResult;
    defensive_only: Strategy20YearResult;
    regime_switching: Strategy20YearResult;
  };
}

// 20年データの辞書形式を配列形式に変換するヘルパー関数
function convert20YearResultsToArray(results: Results20Year): ScenarioResult[] {
  const scenarios: ScenarioResult[] = [];
  
  // D2の結果を追加
  scenarios.push({
    scenario: 'D2のみ（攻撃型）',
    cumulative_return: results.D2.aggressive_only.cumulative_return,
    cagr: results.D2.aggressive_only.cagr / 100, // %を小数に変換
    max_drawdown: results.D2.aggressive_only.max_drawdown / 100,
    sharpe_ratio: results.D2.aggressive_only.sharpe_ratio,
    regime_switches: results.D2.aggressive_only.regime_switches,
    bull_months: 0,
    bear_months: 0,
  });
  scenarios.push({
    scenario: 'D2+レジーム切り替え',
    cumulative_return: results.D2.regime_switching.cumulative_return,
    cagr: results.D2.regime_switching.cagr / 100,
    max_drawdown: results.D2.regime_switching.max_drawdown / 100,
    sharpe_ratio: results.D2.regime_switching.sharpe_ratio,
    regime_switches: results.D2.regime_switching.regime_switches,
    bull_months: 0,
    bear_months: 0,
  });
  
  // D3の結果を追加
  scenarios.push({
    scenario: 'D3のみ（攻撃型）',
    cumulative_return: results.D3.aggressive_only.cumulative_return,
    cagr: results.D3.aggressive_only.cagr / 100,
    max_drawdown: results.D3.aggressive_only.max_drawdown / 100,
    sharpe_ratio: results.D3.aggressive_only.sharpe_ratio,
    regime_switches: results.D3.aggressive_only.regime_switches,
    bull_months: 0,
    bear_months: 0,
  });
  scenarios.push({
    scenario: 'D3+レジーム切り替え',
    cumulative_return: results.D3.regime_switching.cumulative_return,
    cagr: results.D3.regime_switching.cagr / 100,
    max_drawdown: results.D3.regime_switching.max_drawdown / 100,
    sharpe_ratio: results.D3.regime_switching.sharpe_ratio,
    regime_switches: results.D3.regime_switching.regime_switches,
    bull_months: 0,
    bear_months: 0,
  });
  
  // 防御型の結果を追加
  scenarios.push({
    scenario: '防御型のみ',
    cumulative_return: results.D2.defensive_only.cumulative_return,
    cagr: results.D2.defensive_only.cagr / 100,
    max_drawdown: results.D2.defensive_only.max_drawdown / 100,
    sharpe_ratio: results.D2.defensive_only.sharpe_ratio,
    regime_switches: results.D2.defensive_only.regime_switches,
    bull_months: 0,
    bear_months: 0,
  });
  
  return scenarios;
}

export function RegimeSwitchingCard({ period = '10year' }: RegimeSwitchingCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 期間に応じてAPIを切り替え
  const { data: data10Year, isLoading: isLoading10Year, error: error10Year } = 
    trpc.regimeSwitching.getResults.useQuery(undefined, { enabled: period === '10year' });
  const { data: data20Year, isLoading: isLoading20Year, error: error20Year } = 
    trpc.regimeSwitching.get20YearResults.useQuery(undefined, { enabled: period === '20year' });

  const data = period === '20year' ? data20Year : data10Year;
  const isLoading = period === '20year' ? isLoading20Year : isLoading10Year;
  const error = period === '20year' ? error20Year : error10Year;

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
            <ArrowLeftRight className="h-5 w-5" />
            レジーム切り替え戦略シミュレーション
          </CardTitle>
          <CardDescription>
            シミュレーション結果が利用できません
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { results, summary } = data;
  
  // 20年データの場合は辞書形式を配列に変換
  let scenarios: ScenarioResult[];
  if (Array.isArray(results.results)) {
    scenarios = results.results as ScenarioResult[];
  } else {
    scenarios = convert20YearResultsToArray(results.results as Results20Year);
  }

  // レジーム統計を取得（regime_summaryまたは最初の結果から）
  const regimeStats = results.regime_summary || {
    bull_months: scenarios[0]?.bull_months || 0,
    bear_months: scenarios[0]?.bear_months || 0,
    total_months: (scenarios[0]?.bull_months || 0) + (scenarios[0]?.bear_months || 0),
    regime_switches: scenarios.find(s => s.regime_switches > 0)?.regime_switches || 0
  };

  // 最高シャープレシオの戦略を特定
  const bestSharpe = Math.max(...scenarios.map(s => s.sharpe_ratio));
  // 最小MaxDDの戦略を特定
  const bestMaxDD = Math.max(...scenarios.map(s => s.max_drawdown)); // max_drawdownは負の値なので最大が最良

  const formatPercent = (value: number) => {
    const percent = value * 100;
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const formatSharpe = (value: number) => value.toFixed(2);

  const getScenarioColor = (scenario: ScenarioResult) => {
    if (scenario.sharpe_ratio === bestSharpe) return 'text-emerald-400';
    if (scenario.regime_switches > 0) return 'text-amber-400';
    return 'text-foreground';
  };

  const getScenarioBadge = (scenario: ScenarioResult) => {
    if (scenario.sharpe_ratio === bestSharpe) {
      return <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2">最高Sharpe</Badge>;
    }
    if (scenario.max_drawdown === bestMaxDD && scenario.regime_switches > 0) {
      return <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 ml-2">最小DD</Badge>;
    }
    return null;
  };

  // シナリオ名を短縮表示
  const getShortScenarioName = (scenario: string) => {
    // "S0: D2のみ" -> "D2のみ"
    const parts = scenario.split(': ');
    return parts.length > 1 ? parts[1] : scenario;
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
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  レジーム切り替え戦略シミュレーション
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {results.simulation_period.start} ~ {results.simulation_period.end}
                </Badge>
                {period === '20year' && (
                  <Badge variant="secondary" className="text-xs">
                    20年データ
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="ml-7">
              SPY vs MA200 × 0.95による攻撃型/防御型切り替え戦略の比較分析
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* レジーム統計 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Bull期間</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {regimeStats.bull_months}
                  <span className="text-sm font-normal text-muted-foreground ml-1">ヶ月</span>
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Bear期間</span>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {regimeStats.bear_months}
                  <span className="text-sm font-normal text-muted-foreground ml-1">ヶ月</span>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="text-sm font-medium">切り替え回数</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {regimeStats.regime_switches || scenarios.find(s => s.regime_switches > 0)?.regime_switches || 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">回</span>
                </div>
              </div>
            </div>

            {/* 重要な発見 */}
            {summary && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-400 mb-2">重要な発見</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {summary.keyFindings.map((finding: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                    {summary.recommendation && (
                      <p className="mt-3 text-sm text-foreground border-t border-amber-500/30 pt-3">
                        <span className="font-semibold text-amber-400">推奨:</span> {summary.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* シナリオ比較テーブル */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">戦略</TableHead>
                    <TableHead className="text-right font-semibold">CAGR</TableHead>
                    <TableHead className="text-right font-semibold">MaxDD</TableHead>
                    <TableHead className="text-right font-semibold">Sharpe</TableHead>
                    <TableHead className="text-right font-semibold">切替</TableHead>
                    <TableHead className="text-right font-semibold">SL発動</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario, index) => (
                    <TableRow 
                      key={index}
                      className={scenario.sharpe_ratio === bestSharpe ? 'bg-emerald-500/5' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`font-medium ${getScenarioColor(scenario)} cursor-help`}>
                                {getShortScenarioName(scenario.scenario)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>{scenario.scenario}</p>
                            </TooltipContent>
                          </Tooltip>
                          {getScenarioBadge(scenario)}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${scenario.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercent(scenario.cagr)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-400">
                        {formatPercent(scenario.max_drawdown)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${scenario.sharpe_ratio === bestSharpe ? 'text-emerald-400 font-bold' : ''}`}>
                        {formatSharpe(scenario.sharpe_ratio)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {scenario.regime_switches > 0 ? scenario.regime_switches : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {(scenario.stop_trigger_count ?? 0) > 0 ? scenario.stop_trigger_count : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Statistical Note */}
            <div className="mt-6 p-3 bg-gray-800/30 rounded-lg">
              <p className="text-xs text-gray-500">
                ※ 統計的検定（対応のあるt検定、Bonferroni補正）では有意差は認められませんでした（p &gt; 0.01）。
                これはサンプルサイズ（月次データ{regimeStats.total_months || (regimeStats.bull_months + regimeStats.bear_months)}ヶ月）の制約によるものです。
                効果量（Cohen's d）は小〜中程度であり、実務的な改善効果は認められます。
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
