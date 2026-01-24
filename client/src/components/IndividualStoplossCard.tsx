/**
 * 個別銘柄ベースのストップロスシミュレーション結果カード
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Target, TrendingUp, TrendingDown, Shield, AlertTriangle } from "lucide-react";

interface ScenarioData {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  cumulativeReturn: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  stopLossTriggers: number;
  pValue?: number;
  significant?: boolean;
  cohensD?: number;
  effectSize?: string;
}

interface StrategyData {
  strategyId: string;
  strategyName: string;
  strategyNameJa: string;
  scenarios: ScenarioData[];
  bestBySharpe: string;
  bestByMaxDD: string;
}

export function IndividualStoplossCard() {
  const { data, isLoading, error } = trpc.individualStoploss.getResults.useQuery();

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.available || !data?.results) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <span className="ml-2 text-muted-foreground">
            個別銘柄ストップロスシミュレーションデータがありません
          </span>
        </CardContent>
      </Card>
    );
  }

  const { results } = data;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">個別銘柄ストップロスシミュレーション</CardTitle>
        </div>
        <CardDescription>
          {results.period.start}〜{results.period.end}（{results.period.months}ヶ月）
          <br />
          <span className="text-xs">
            ロジック: {results.parameters.action}、{results.parameters.recovery}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="d2" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="d2">D2戦略（S&P100）</TabsTrigger>
            <TabsTrigger value="d3">D3戦略（S&P500）</TabsTrigger>
          </TabsList>

          {results.strategies.map((strategy: StrategyData) => (
            <TabsContent key={strategy.strategyId} value={strategy.strategyId}>
              <div className="space-y-4">
                {/* シナリオ比較テーブル */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">シナリオ</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">CAGR</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">最大DD</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Sharpe</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">SL発動</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategy.scenarios.map((scenario: ScenarioData) => {
                        const isBestSharpe = scenario.id === strategy.bestBySharpe;
                        const isBestDD = scenario.id === strategy.bestByMaxDD;
                        
                        return (
                          <tr 
                            key={scenario.id} 
                            className={`border-b border-border/30 ${
                              isBestSharpe ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{scenario.nameJa}</span>
                                {isBestSharpe && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                    最良Sharpe
                                  </Badge>
                                )}
                                {isBestDD && !isBestSharpe && (
                                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                                    最良DD
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {scenario.description}
                              </div>
                            </td>
                            <td className="text-right py-2 px-2">
                              <div className="flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="font-mono text-green-500">
                                  {scenario.cagr.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-2">
                              <div className="flex items-center justify-end gap-1">
                                <TrendingDown className="w-3 h-3 text-red-500" />
                                <span className="font-mono text-red-500">
                                  {scenario.maxDrawdown.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-2">
                              <span className={`font-mono ${
                                scenario.sharpeRatio >= 1.5 ? 'text-green-500' : 
                                scenario.sharpeRatio >= 1.0 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {scenario.sharpeRatio.toFixed(2)}
                              </span>
                            </td>
                            <td className="text-right py-2 px-2">
                              <span className="font-mono text-muted-foreground">
                                {scenario.stopLossTriggers}回
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 統計的検定結果 */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">統計的検定（vs ベースライン）</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {strategy.scenarios
                      .filter((s: ScenarioData) => s.pValue !== undefined)
                      .map((scenario: ScenarioData) => (
                        <div key={scenario.id} className="flex justify-between">
                          <span className="text-muted-foreground">{scenario.nameJa}:</span>
                          <span>
                            p={scenario.pValue?.toFixed(4)} 
                            <span className="ml-1 text-muted-foreground">
                              ({scenario.effectSize})
                            </span>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* サマリー */}
        {results.summary && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              主な発見
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {results.summary.keyFindings.map((finding: string, index: number) => (
                <li key={index}>• {finding}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
