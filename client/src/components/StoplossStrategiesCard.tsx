import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertCircle } from "lucide-react";
import { stoplossStrategiesData } from "@/data/stoplossStrategiesData";

interface StrategyMetrics {
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  cumulativeReturn: number;
  stopLossTriggers?: number;
  recoveryEvents?: number;
  winRate?: number;
  regimeSwitches?: number;
}

interface Improvement {
  cagrDiff: number;
  drawdownDiff: number;
  sharpeDiff: number;
}

interface StrategyData {
  strategyName: string;
  metrics: StrategyMetrics;
  improvement?: Improvement;
}

interface StoplossStrategiesCardProps {
  strategyType: "D2" | "D3";
  strategies: {
    baseline: StrategyData;
    caseB: StrategyData;
    caseBWithRegime: StrategyData;
  };
}

const RECESSION_YEARS = {
  "2008": "金融危機",
  "2020": "コロナ"
};

const getRecessionBackground = (year: string): string => {
  if (year === "2008" || year === "2020") {
    return "bg-red-900/20 border-l-4 border-red-500";
  }
  return "";
};

const getReturnColor = (value: number): string => {
  if (value >= 50) return "text-green-400";
  if (value >= 30) return "text-green-300";
  if (value >= 10) return "text-green-200";
  if (value >= 0) return "text-gray-300";
  if (value >= -20) return "text-orange-300";
  return "text-red-400";
};

export function StoplossStrategiesCard({
  strategyType = "D2",
  strategies,
}: Partial<StoplossStrategiesCardProps> = {}) {
  const data = strategies || stoplossStrategiesData[strategyType];
  
  const renderMetricsComparison = () => {
    const entries = Object.entries(data) as [string, StrategyData][];
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {entries.map(([key, strategy]) => (
          <div key={key} className="border border-border rounded-lg p-4 bg-card/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {strategy.strategyName}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CAGR:</span>
                <span className="font-semibold text-green-400">
                  {strategy.metrics.cagr.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最大DD:</span>
                <span className="font-semibold text-red-400">
                  {strategy.metrics.maxDrawdown.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">シャープ:</span>
                <span className="font-semibold text-blue-400">
                  {strategy.metrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
              {strategy.metrics.stopLossTriggers !== undefined && strategy.metrics.stopLossTriggers > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SL発動:</span>
                  <span className="font-semibold text-yellow-400">
                    {strategy.metrics.stopLossTriggers}回
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          個別銘柄ストップロス戦略シミュレーション
        </CardTitle>
        <CardDescription>
          {strategyType}戦略：個別銘柄が-10%以上下落した場合、その銘柄のみ50%売却
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* メトリクス比較 */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            パフォーマンス指標比較
          </h3>
          {renderMetricsComparison()}
        </div>

        {/* 統計的検定結果 */}
        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-muted-foreground">
          <strong>統計的検定（Bonferroni補正）：</strong>
          全シナリオで有意差なし（p &gt; 0.05）。リスク調整後リターンは改善するものの、
          統計的には有意ではありません。
        </div>
      </CardContent>
    </Card>
  );
}
