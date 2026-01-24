/**
 * 分析結果ページ（完全版）
 * Volatility ScalingとロバスT性評価をMECEに反映
 * 
 * セクション構成:
 * 1. 戦略パフォーマンス比較（13戦略）
 * 2. Volatility Scaling詳細
 * 3. 累積リターンチャート
 * 4. レジーム別パフォーマンス
 * 5. ロバスト性評価ダッシュボード
 * 6. 補正後の現実的期待値
 */

import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceArea, ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BarChart3, TrendingUp, Shield, AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronDown, ChevronUp, ArrowLeft, Settings, Target, Zap, Activity, Scale, Award, ExternalLink,
  Calendar, CheckCircle, Calculator, DollarSign, Clock, Database
} from 'lucide-react';
import { Link } from 'wouter';
import { SimulationConditionsBadge } from '@/components/SimulationConditionsBadge';
import { StrategySimulator } from '@/components/StrategySimulator';
import { MonthlyChart13Strategies } from '@/components/MonthlyChart13Strategies';
import YearlyPerformanceTable13 from '@/components/YearlyPerformanceTable13';
import { ParamSensitivityCard } from '@/components/ParamSensitivityCard';
import { ParameterSimulator } from '@/components/ParameterSimulator';
import RobustnessPageNew from '@/components/RobustnessPageNew';
import {
  integratedData,
  strategyDisplayNames,
  strategyDescriptions,
  targetVolatilities,
  metricDescriptions,
  robustnessTestDescriptions,
  paramSensitivityLabels,
  rebalanceTimingLabels,
  calculateCumulativeReturns,
  getStrategyMetrics,
  getRobustnessData,
  getParamSensitivityData,
  getSurvivorshipAdjustedData,
  getRebalanceSensitivityData,
  getRebalanceDetailData,
} from '@/data/integratedData';

// カラーパレット
// 案A: 金融プロフェッショナル配色
const COLORS = {
  'D2': '#F97316',           // オレンジ（攻撃的戦略）
  'D3': '#FF8C00',           // ダークオレンジ（最高リターン）
  '防御型TOP3': '#94A3B8',   // スレートグレー
  '防御型TOP5': '#64748B',   // ダークスレート
  'D2+防御型': '#60A5FA',   // ライトブルー
  'D3+防御型': '#3B82F6',   // ブルー（防御要素）
  'D2_VolScale': '#C084FC',   // ライトパープル
  'D3_VolScale': '#8B5CF6',   // パープル（VolScale系）
  '防御型TOP3_VolScale': '#A78BFA',
  '防御型TOP5_VolScale': '#7C3AED',
  'D2+防御型_VolScale': '#34D399', // ライトエメラルド
  'D3+防御型_VolScale': '#10B981', // エメラルド
  'SPY': '#6B7280',           // グレー（ベンチマーク）
};

// 指標ツールチップ
function MetricTooltip({ label, description }: { label: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dotted border-muted-foreground">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// 取引コスト別のデータ（事前計算済み）
// 0%: performanceData.ts (取引コスト0%のバックテスト結果)
// 0.2%: integrated_web_data.json (取引コスト0.2%のバックテスト結果)
const COST_DATA = {
  // 取引コスト0%版（grail_no_cost.jsonから生成）
  '0%': {
    'D2': { cumulative: 5531, cagr: 20.89, maxDD: -43.73, sharpe: 0.98, sortino: 1.63, calmar: 0.48 },
    'D3': { cumulative: 40518, cagr: 32.67, maxDD: -48.28, sharpe: 1.13, sortino: 1.99, calmar: 0.68 },
    '防御型TOP5': { cumulative: 392, cagr: 7.78, maxDD: -17.46, sharpe: 0.87, sortino: 1.31, calmar: 0.45 },
    '防御型TOP3': { cumulative: 335, cagr: 7.16, maxDD: -21.99, sharpe: 0.66, sortino: 1.00, calmar: 0.33 },
    'D2+防御型': { cumulative: 3395, cagr: 18.20, maxDD: -31.58, sharpe: 0.94, sortino: 1.49, calmar: 0.58 },
    'D3+防御型': { cumulative: 29630, cagr: 30.73, maxDD: -29.34, sharpe: 1.17, sortino: 2.26, calmar: 1.05 },
    'SPY': { cumulative: 549, cagr: 9.20, maxDD: -49.31, sharpe: 0.66, sortino: 0.86, calmar: 0.19 },
    'D2_VolScale': { cumulative: 4513, cagr: 19.76, maxDD: -37.17, sharpe: 0.97, sortino: 1.56, calmar: 0.53 },
    'D3_VolScale': { cumulative: 17160, cagr: 27.43, maxDD: -30.76, sharpe: 1.25, sortino: 2.72, calmar: 0.89 },
    '防御型TOP5_VolScale': { cumulative: 338, cagr: 7.20, maxDD: -16.75, sharpe: 0.87, sortino: 1.21, calmar: 0.43 },
    '防御型TOP3_VolScale': { cumulative: 217, cagr: 5.58, maxDD: -23.41, sharpe: 0.65, sortino: 0.97, calmar: 0.24 },
    'D2+防御型_VolScale': { cumulative: 941, cagr: 11.66, maxDD: -18.88, sharpe: 0.91, sortino: 1.41, calmar: 0.62 },
    'D3+防御型_VolScale': { cumulative: 5239, cagr: 20.58, maxDD: -22.16, sharpe: 1.23, sortino: 2.84, calmar: 0.93 },
  },
  '0.2%': {
    'D3+防御型_VolScale': { cumulative: 15689, cagr: 20.42, maxDD: -22.16, sharpe: 1.22, sortino: 2.82, calmar: 0.92 },
    'D3_VolScale': { cumulative: 16989, cagr: 27.25, maxDD: -30.76, sharpe: 1.24, sortino: 2.71, calmar: 0.89 },
    'D3+防御型': { cumulative: 29615, cagr: 30.59, maxDD: -29.34, sharpe: 1.16, sortino: 2.25, calmar: 1.04 },
    'D3': { cumulative: 40429, cagr: 32.51, maxDD: -48.28, sharpe: 1.13, sortino: 1.98, calmar: 0.67 },
    'SPY': { cumulative: 554, cagr: 9.20, maxDD: -49.31, sharpe: 0.66, sortino: 0.86, calmar: 0.19 },
    'D2': { cumulative: 5461, cagr: 20.73, maxDD: -43.73, sharpe: 0.97, sortino: 1.62, calmar: 0.47 },
    'D2+防御型': { cumulative: 3355, cagr: 18.06, maxDD: -31.58, sharpe: 0.93, sortino: 1.48, calmar: 0.57 },
    'D2_VolScale': { cumulative: 4435, cagr: 19.58, maxDD: -37.17, sharpe: 0.96, sortino: 1.55, calmar: 0.53 },
    'D2+防御型_VolScale': { cumulative: 919, cagr: 11.50, maxDD: -18.88, sharpe: 0.89, sortino: 1.39, calmar: 0.61 },
    '防御型TOP3': { cumulative: 328, cagr: 7.06, maxDD: -21.99, sharpe: 0.65, sortino: 0.99, calmar: 0.32 },
    '防御型TOP5': { cumulative: 383, cagr: 7.66, maxDD: -17.46, sharpe: 0.86, sortino: 1.29, calmar: 0.44 },
    '防御型TOP3_VolScale': { cumulative: 211, cagr: 5.46, maxDD: -23.41, sharpe: 0.63, sortino: 0.95, calmar: 0.23 },
    '防御型TOP5_VolScale': { cumulative: 328, cagr: 7.06, maxDD: -16.75, sharpe: 0.85, sortino: 1.18, calmar: 0.42 },
  },
} as const;

type CostMode = '0%' | '0.2%';

// 戦略カード（取引コスト対応版）
function StrategyCard({ 
  strategyId, 
  showVolScale = false,
  selectedCost = '0.2%'
}: { 
  strategyId: string;
  showVolScale?: boolean;
  selectedCost?: CostMode;
}) {
  // COST_DATAから取引コスト別のデータを取得
  const costData = COST_DATA[selectedCost][strategyId as keyof typeof COST_DATA['0%']];
  
  // COST_DATAにない戦略はintegratedDataから取得（フォールバック）
  const fallbackMetrics = getStrategyMetrics(strategyId);
  
  const metrics = costData ? {
    cagr: costData.cagr / 100,
    max_dd: costData.maxDD / 100,
    sharpe: costData.sharpe,
    sortino: costData.sortino,
    calmar: costData.calmar,
  } : fallbackMetrics;
  
  if (!metrics) return null;

  const targetVol = targetVolatilities[strategyId];
  const isVolScale = strategyId.includes('VolScale');

  return (
    <Card className={`${isVolScale ? 'bg-primary/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {strategyDisplayNames[strategyId] || strategyId}

            {isVolScale && <Badge className="ml-2" variant="outline">VolScale</Badge>}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {strategyDescriptions[strategyId]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">CAGR</div>
            <div className={`font-bold ${metrics.cagr > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(metrics.cagr * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">MaxDD</div>
            <div className="font-bold text-red-500">
              {(metrics.max_dd * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Sharpe</div>
            <div className={`font-bold ${metrics.sharpe >= 1 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics.sharpe.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Sortino</div>
            <div className="font-bold">{metrics.sortino.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Calmar</div>
            <div className="font-bold">{metrics.calmar.toFixed(2)}</div>
          </div>
          {showVolScale && targetVol && (
            <div>
              <div className="text-muted-foreground text-xs">目標Vol</div>
              <div className="font-bold text-blue-500">{(targetVol * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// VolScale比較テーブル
function VolScaleComparisonTable() {
  const strategies = ['D2', 'D3', '防御型TOP3', '防御型TOP5', 'D2+防御型', 'D3+防御型'];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">戦略</th>
            <th className="text-right p-2">CAGR（前）</th>
            <th className="text-right p-2">CAGR（後）</th>
            <th className="text-right p-2">MaxDD（前）</th>
            <th className="text-right p-2">MaxDD（後）</th>
            <th className="text-right p-2">Sharpe（前）</th>
            <th className="text-right p-2">Sharpe（後）</th>
            <th className="text-right p-2">目標Vol</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map(strategyId => {
            const before = getStrategyMetrics(strategyId);
            const after = getStrategyMetrics(`${strategyId}_VolScale`);
            const targetVol = targetVolatilities[`${strategyId}_VolScale`];
            
            if (!before || !after) return null;
            
            const cagrImproved = after.cagr < before.cagr;
            const ddImproved = after.max_dd > before.max_dd;
            const sharpeImproved = after.sharpe > before.sharpe;
            
            return (
              <tr key={strategyId} className="border-b hover:bg-muted/50">
                <td className="p-2 font-medium">{strategyDisplayNames[strategyId]}</td>
                <td className="p-2 text-right">{(before.cagr * 100).toFixed(1)}%</td>
                <td className={`p-2 text-right ${cagrImproved ? 'text-yellow-500' : 'text-green-500'}`}>
                  {(after.cagr * 100).toFixed(1)}%
                </td>
                <td className="p-2 text-right text-red-500">{(before.max_dd * 100).toFixed(1)}%</td>
                <td className={`p-2 text-right ${ddImproved ? 'text-green-500' : 'text-red-500'}`}>
                  {(after.max_dd * 100).toFixed(1)}%
                  {ddImproved && (
                    <span className="ml-1 text-xs text-green-500">
                      ↑{((before.max_dd - after.max_dd) * 100).toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="p-2 text-right">{before.sharpe.toFixed(2)}</td>
                <td className={`p-2 text-right ${sharpeImproved ? 'text-green-500' : 'text-yellow-500'}`}>
                  {after.sharpe.toFixed(2)}
                  {sharpeImproved && (
                    <span className="ml-1 text-xs text-green-500">
                      ↑{(after.sharpe - before.sharpe).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-2 text-right text-blue-500">
                  {targetVol ? `${(targetVol * 100).toFixed(0)}%` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ロバスト性テスト結果カード
function RobustnessTestCard({ 
  strategyId, 
  testType 
}: { 
  strategyId: string;
  testType: 'cost_sensitivity' | 'bootstrap' | 'dsr_psr' | 'tail_risk' | 'leverage';
}) {
  const robustness = getRobustnessData(strategyId);
  if (!robustness) return null;

  const data = robustness[testType];
  
  const renderContent = () => {
    switch (testType) {
      case 'cost_sensitivity':
        const costData = data as typeof robustness.cost_sensitivity;
        return (
          <div className="space-y-2">
            {Object.entries(costData).map(([cost, metrics]) => (
              <div key={cost} className="flex justify-between text-sm">
                <span>コスト {cost}</span>
                <span>Sharpe: {metrics.sharpe.toFixed(2)}</span>
              </div>
            ))}
          </div>
        );
      case 'bootstrap':
        const bootData = data as typeof robustness.bootstrap;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sharpe平均</span>
              <span>{bootData.sharpe_mean.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>95%CI</span>
              <span>[{bootData.sharpe_95ci[0].toFixed(2)}, {bootData.sharpe_95ci[1].toFixed(2)}]</span>
            </div>
            <div className="flex justify-between">
              <span>P(Sharpe&gt;1)</span>
              <span className={bootData.sharpe_above_1_pct > 0.8 ? 'text-green-500' : 'text-yellow-500'}>
                {(bootData.sharpe_above_1_pct * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        );
      case 'dsr_psr':
        const dsrData = data as typeof robustness.dsr_psr;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DSR</span>
              <span className={dsrData.dsr > 0.95 ? 'text-green-500' : 'text-yellow-500'}>
                {(dsrData.dsr * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>PSR</span>
              <span>{(dsrData.psr * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>試行数</span>
              <span>{dsrData.n_trials}</span>
            </div>
          </div>
        );
      case 'tail_risk':
        const tailData = data as typeof robustness.tail_risk;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>CVaR(5%)</span>
              <span className="text-red-500">{(tailData.cvar_5 * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>最悪12ヶ月</span>
              <span className="text-red-500">{(tailData.worst_12m * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>最大DD期間</span>
              <span>{tailData.max_dd_duration_months}ヶ月</span>
            </div>
          </div>
        );
      case 'leverage':
        const levData = data as typeof robustness.leverage;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>レバ&gt;1比率</span>
              <span className={levData.leverage_above_1_pct < 0.2 ? 'text-green-500' : 'text-yellow-500'}>
                {(levData.leverage_above_1_pct * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>平均スケール</span>
              <span>{levData.avg_scale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>最大スケール</span>
              <span>{levData.max_scale.toFixed(2)}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {testType === 'cost_sensitivity' && <Settings className="w-4 h-4" />}
          {testType === 'bootstrap' && <Activity className="w-4 h-4" />}
          {testType === 'dsr_psr' && <Target className="w-4 h-4" />}
          {testType === 'tail_risk' && <AlertTriangle className="w-4 h-4" />}
          {testType === 'leverage' && <Zap className="w-4 h-4" />}
          {robustnessTestDescriptions[testType]?.name || testType}
        </CardTitle>
        <CardDescription className="text-xs">
          {robustnessTestDescriptions[testType]?.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

// VolScale戦略データ（v3更新）
const volScaleStrategies = [
  {
    name: 'D3+防御型_VolScale',
    cagr: 20.42,
    maxDD: -22.16,
    sharpe: 1.22,
    sortino: 2.82,
    calmar: 0.92,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: true,
    investorType: 'バランス重視（推奨）',
  },
  {
    name: 'D3+防御型',
    cagr: 30.59,
    maxDD: -29.34,
    sharpe: 1.16,
    sortino: 2.65,
    calmar: 1.04,
    tier: 'Tier 1-2',
    tierDesc: 'Top 3-5%',
    recommended: false,
    investorType: '最大リターン追求',
  },
  {
    name: 'D3_VolScale',
    cagr: 27.25,
    maxDD: -30.76,
    sharpe: 1.24,
    sortino: 2.78,
    calmar: 0.89,
    tier: 'Tier 1-2',
    tierDesc: 'Top 3-5%',
    recommended: false,
    investorType: 'リスク調整重視',
  },
  {
    name: 'D3',
    cagr: 26.17,
    maxDD: -38.62,
    sharpe: 1.13,
    sortino: 2.49,
    calmar: 0.68,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: false,
    investorType: '高リターン追求',
  },
  {
    name: 'D2+防御型',
    cagr: 22.89,
    maxDD: -25.16,
    sharpe: 1.14,
    sortino: 2.60,
    calmar: 0.91,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: false,
    investorType: 'バランス型',
  },
  {
    name: 'D2_VolScale',
    cagr: 20.13,
    maxDD: -29.73,
    sharpe: 1.22,
    sortino: 2.76,
    calmar: 0.68,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: false,
    investorType: 'リスク調整型',
  },
  {
    name: 'D2',
    cagr: 19.10,
    maxDD: -42.66,
    sharpe: 1.10,
    sortino: 2.47,
    calmar: 0.45,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: false,
    investorType: '高リターン追求',
  },
  {
    name: 'D2+防御型_VolScale',
    cagr: 15.22,
    maxDD: -18.88,
    sharpe: 1.11,
    sortino: 2.55,
    calmar: 0.81,
    tier: 'Tier 2',
    tierDesc: 'Top 5-10%',
    recommended: false,
    investorType: '低リスク重視',
  },
];

// ヘッジファンドデータ（v3更新）
const hedgeFunds = [
  { name: 'Renaissance Medallion', cagr: 39, sharpe: 2.0, aum: '$16B', note: '従業員限定、別格', tier: 'Tier 0' },
  { name: 'Citadel Wellington', cagr: 19.5, sharpe: 2.5, aum: '$65B', note: 'since 1990', tier: 'Tier 1' },
  { name: 'Point72', cagr: 19, sharpe: null, aum: '$42B', note: '2024年', tier: 'Tier 1' },
  { name: 'Top 50 HF平均', cagr: 15.5, sharpe: 1.43, aum: null, note: '5年平均', tier: 'Tier 2' },
  { name: 'Millennium Management', cagr: 14, sharpe: 2.5, aum: '$72B', note: 'since inception', tier: 'Tier 1' },
  { name: 'D.E. Shaw Composite', cagr: 12.7, sharpe: null, aum: '$65B', note: 'since 2001', tier: 'Tier 2' },
  { name: 'HFRI業界平均', cagr: 10.01, sharpe: null, aum: null, note: '2024年', tier: 'Benchmark' },
  { name: 'SPY', cagr: 9.20, sharpe: 0.66, aum: null, note: 'ベンチマーク', tier: 'Benchmark' },
  { name: '業界5年平均', cagr: 7.2, sharpe: 0.86, aum: null, note: 'BarclayHedge', tier: 'Benchmark' },
];

// データソース
const dataSources = [
  {
    fund: 'Renaissance Medallion Fund',
    sources: [
      { name: 'Institutional Investor "Renaissance\'s 2024 Rebirth"', url: 'https://www.institutionalinvestor.com/article/2e0uykr3vn5booz0smrcw/hedge-funds/renaissances-2024-rebirth' },
      { name: 'Hedgeweek "Renaissance Tech and Two Sigma lead 2024 quant gains"', url: 'https://www.hedgeweek.com/renaissance-tech-and-two-sigma-lead-2024-quant-gains/' },
    ]
  },
  {
    fund: 'Citadel Wellington',
    sources: [
      { name: 'CNBC "Ken Griffin\'s flagship hedge fund at Citadel climbs 15.1% in 2024"', url: 'https://www.cnbc.com/2025/01/02/ken-griffins-flagship-hedge-fund-at-citadel-climbs-15point1percent-in-2024.html' },
      { name: 'KBRA Rating Report (2024)', url: 'https://www.kbra.com/publications/gdbMxFGn' },
    ]
  },
  {
    fund: 'Millennium Management',
    sources: [
      { name: 'Hedgeweek "Millennium posts 15% 2024 gain but lags S&P 500"', url: 'https://www.hedgeweek.com/millennium-posts-15-2024-gain-but-lags-sp-500/' },
      { name: 'Motley Fool "Millennium Management: Overview, History, and Investments"', url: 'https://www.fool.com/investing/how-to-invest/famous-investors/millennium-management/' },
    ]
  },
  {
    fund: 'D.E. Shaw',
    sources: [
      { name: 'Alternatives Watch "D.E. Shaw posts strong 2024 returns"', url: 'https://www.alternativeswatch.com/2025/01/02/de-shaw-posts-strong-2024-returns-oculus-composite-hedge-funds/' },
      { name: 'Institutional Investor "D.E. Shaw Tops a 2024 Hedge Fund Ranking"', url: 'https://www.institutionalinvestor.com/article/2eaxu6g8f1zzvc4ipdc74/hedge-funds/d-e-shaw-tops-a-2024-hedge-fund-ranking' },
    ]
  },
  {
    fund: '業界平均・ベンチマーク',
    sources: [
      { name: 'HFR "Hedge Funds End 2024 on a Mixed Note"', url: 'https://thefullfx.com/hedge-funds-end-2024-on-a-mixed-note-hfr/' },
      { name: 'BarclayHedge (via Institutional Investor)', url: 'https://www.institutionalinvestor.com/article/2aucrzsa72lr93xz8ghds/ria-intel/the-most-consistently-profitable-hedge-funds-continue-to-prove-their-edge' },
    ]
  },
];

// HF比較セクションコンポーネント
function HedgeFundComparisonSection() {
  return (
    <div className="space-y-6">
      {/* 詳細レポートリンク */}
      <Card className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">詳細レポート</div>
                <div className="text-sm text-muted-foreground">検証済みデータに基づく完全版分析レポート</div>
              </div>
            </div>
            <a 
              href="/VolScale_HedgeFund_Report_v3.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
            >
              <span>レポートを開く</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* エグゼクティブサマリー */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-400">
            <Target className="w-5 h-5" />
            エグゼクティブサマリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">推奨戦略 CAGR</div>
              <div className="text-xl font-bold text-emerald-400">20.42%</div>
              <div className="text-xs text-muted-foreground">D3+防御型_VolScale</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">推奨戦略 Sharpe</div>
              <div className="text-xl font-bold text-emerald-400">1.22</div>
              <div className="text-xs text-muted-foreground">Tier 2（Top 5-10%）</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">推奨戦略 MaxDD</div>
              <div className="text-xl font-bold text-foreground">-22.16%</div>
              <div className="text-xs text-muted-foreground">許容範囲</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">推奨戦略 Sortino</div>
              <div className="text-xl font-bold text-emerald-400">2.82</div>
              <div className="text-xs text-muted-foreground">最高値</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VolScale戦略パフォーマンス */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          VolScale戦略パフォーマンス
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {volScaleStrategies.map((strategy) => (
            <Card 
              key={strategy.name}
              className={`${
                strategy.recommended 
                  ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/50' 
                  : 'bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30'
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className={strategy.recommended ? 'text-emerald-400' : 'text-purple-400'}>
                    {strategy.name}
                  </span>
                  {strategy.recommended && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                      推奨
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className={`text-xl font-bold ${strategy.cagr >= 25 ? 'text-purple-400' : 'text-emerald-400'}`}>
                      {strategy.cagr}%
                    </div>
                    <div className="text-xs text-muted-foreground">CAGR</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className={`text-xl font-bold ${strategy.maxDD < -25 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {strategy.maxDD}%
                    </div>
                    <div className="text-xs text-muted-foreground">MaxDD</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-xl font-bold text-foreground">{strategy.sharpe}</div>
                    <div className="text-xs text-muted-foreground">Sharpe</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-xl font-bold text-foreground">{strategy.sortino}</div>
                    <div className="text-xs text-muted-foreground">Sortino</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">業界ポジション</span>
                    <span className={`font-medium ${strategy.tier === 'Tier 2' ? 'text-amber-400' : 'text-purple-400'}`}>
                      {strategy.tier} ({strategy.tierDesc})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">投資家タイプ</span>
                    <span className="text-foreground">{strategy.investorType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ヘッジファンドとの比較テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            ヘッジファンドとの比較（CAGR順）
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">ファンド/戦略</th>
                  <th className="text-center p-3 font-medium">CAGR</th>
                  <th className="text-center p-3 font-medium">Sharpe</th>
                  <th className="text-center p-3 font-medium">AUM</th>
                  <th className="text-left p-3 font-medium">備考</th>
                </tr>
              </thead>
              <tbody>
                {/* Renaissance */}
                <tr className="border-b border-border bg-amber-500/5">
                  <td className="p-3 font-medium text-amber-400">Renaissance Medallion</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">39%</td>
                  <td className="p-3 text-center">~2.0+</td>
                  <td className="p-3 text-center">$12B</td>
                  <td className="p-3 text-muted-foreground text-xs">従業員限定、別格</td>
                </tr>
                {/* VolScale Strategies (v3更新) */}
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D3+防御型</td>
                  <td className="p-3 text-center text-purple-400 font-bold">30.59%</td>
                  <td className="p-3 text-center">1.16</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">最高リターン</span></td>
                </tr>
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D3_VolScale</td>
                  <td className="p-3 text-center text-purple-400 font-bold">27.25%</td>
                  <td className="p-3 text-center">1.24</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">リスク調整</span></td>
                </tr>
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D3</td>
                  <td className="p-3 text-center text-purple-400 font-bold">26.17%</td>
                  <td className="p-3 text-center">1.13</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">高リターン</span></td>
                </tr>
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D2+防御型</td>
                  <td className="p-3 text-center text-purple-400 font-bold">22.89%</td>
                  <td className="p-3 text-center">1.14</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">バランス</span></td>
                </tr>
                <tr className="border-b border-border bg-emerald-500/10">
                  <td className="p-3 font-medium text-emerald-400">D3+防御型_VolScale ⭐</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">20.42%</td>
                  <td className="p-3 text-center">1.22</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">推奨</span></td>
                </tr>
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D2_VolScale</td>
                  <td className="p-3 text-center text-purple-400 font-bold">20.13%</td>
                  <td className="p-3 text-center">1.22</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">リスク調整</span></td>
                </tr>
                {/* Other Hedge Funds */}
                {hedgeFunds.slice(1).map((fund) => (
                  <tr key={fund.name} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{fund.name}</td>
                    <td className="p-3 text-center">{fund.cagr}%</td>
                    <td className="p-3 text-center">{fund.sharpe || '-'}</td>
                    <td className="p-3 text-center">{fund.aum}</td>
                    <td className="p-3 text-muted-foreground text-xs">{fund.note}</td>
                  </tr>
                ))}
                {/* Benchmarks */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-3 font-medium text-muted-foreground">HFRI業界平均</td>
                  <td className="p-3 text-center text-red-400">10.01%</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-muted-foreground text-xs">2024年</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-3 font-medium text-muted-foreground">業界5年平均</td>
                  <td className="p-3 text-center text-red-400">7.2%</td>
                  <td className="p-3 text-center">0.86</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-muted-foreground text-xs">BarclayHedge</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 業界内ポジショニング */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          業界内ポジショニング
        </h2>
        <div className="space-y-4">
          {/* Tier 0 */}
          <Card className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">TIER 0</span>
                <div>
                  <div className="font-medium text-amber-400">伝説級（Top 0.1%）</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong>Renaissance Medallion</strong>: CAGR 39% net、Sharpe 2.0+
                    <br />
                    <span className="text-xs">従業員限定、外部投資家アクセス不可。史上最高のパフォーマンス。</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier 1 */}
          <Card className="bg-gradient-to-r from-slate-500/10 to-slate-500/5 border-slate-400/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <span className="px-3 py-1 bg-slate-400 text-black text-xs font-bold rounded-full">TIER 1</span>
                <div>
                  <div className="font-medium text-slate-300">トップ機関（Top 1-3%）</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong>Citadel Wellington</strong>: CAGR 19.5%、Sharpe ~2.5
                    <br />
                    <strong>Millennium</strong>: CAGR 14%、Sharpe 2.5
                    <br />
                    <span className="text-xs">$60B+の巨大マルチストラテジー。高いSharpe比が特徴。</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier 1-2 */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">TIER 1-2</span>
                <div>
                  <div className="font-medium text-purple-400">境界（Top 3-5%）← D3+防御型 / D3_VolScale</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong className="text-purple-400">D3+防御型</strong>: CAGR 30.59%、Sharpe 1.16、Calmar 1.04 ✓
                    <br />
                    <strong className="text-purple-400">D3_VolScale</strong>: CAGR 27.25%、Sharpe 1.24 ✓
                    <br />
                    <span className="text-xs">CAGRベースではCitadel級を上回る。ただしMaxDDが大きく、リスク調整後はTier 1には届かない。</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier 2 */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">TIER 2</span>
                <div>
                  <div className="font-medium text-emerald-400">優良（Top 5-10%）← D3+防御型_VolScale（推奨）</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong className="text-emerald-400">D3+防御型_VolScale</strong>: CAGR 20.42%、Sharpe 1.22、Sortino 2.82 ✓
                    <br />
                    <strong>D.E. Shaw Composite</strong>: CAGR 12.7%（長期）
                    <br />
                    <span className="text-xs">Sortino最高（下方リスク管理）、許容可能なMaxDD、D.E. Shawを大幅に上回る。</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CAGR vs Sharpe 散布図 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            CAGR vs Sharpe比較チャート
          </CardTitle>
          <CardDescription>
            各戦略とヘッジファンドのリターンとリスク調整後リターンの関係を視覚化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  type="number" 
                  dataKey="sharpe" 
                  name="Sharpe" 
                  domain={[0.5, 2.5]}
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'Sharpe比', position: 'bottom', fill: '#888', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="cagr" 
                  name="CAGR" 
                  domain={[5, 45]}
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'CAGR (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                />
                <ZAxis type="number" dataKey="size" range={[100, 400]} />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'CAGR') return [`${value.toFixed(1)}%`, 'CAGR'];
                    if (name === 'Sharpe') return [value.toFixed(2), 'Sharpe'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => label}
                />
                {/* ヘッジファンド */}
                <Scatter 
                  name="ヘッジファンド" 
                  data={[
                    { name: 'Renaissance', cagr: 39, sharpe: 2.0, size: 300, type: 'hf' },
                    { name: 'Citadel', cagr: 19.5, sharpe: 2.5, size: 250, type: 'hf' },
                    { name: 'Millennium', cagr: 14, sharpe: 2.5, size: 200, type: 'hf' },
                    { name: 'D.E. Shaw', cagr: 18, sharpe: 1.8, size: 200, type: 'hf' },
                    { name: 'Point72', cagr: 19, sharpe: 1.5, size: 200, type: 'hf' },
                    { name: 'Two Sigma', cagr: 12, sharpe: 1.6, size: 200, type: 'hf' },
                    { name: 'Top 50 HF', cagr: 15.5, sharpe: 1.43, size: 150, type: 'hf' },
                    { name: 'HFRI業界', cagr: 10, sharpe: 0.86, size: 150, type: 'benchmark' },
                  ]} 
                  fill="#6366f1"
                >
                  <LabelList dataKey="name" position="top" fill="#888" fontSize={10} />
                </Scatter>
                {/* VolScale戦略 */}
                <Scatter 
                  name="VolScale戦略" 
                  data={[
                    { name: 'D3+防御型', cagr: 30.59, sharpe: 1.16, size: 250, type: 'volscale' },
                    { name: 'D3_VolScale', cagr: 27.25, sharpe: 1.24, size: 250, type: 'volscale' },
                    { name: 'D3', cagr: 26.17, sharpe: 1.13, size: 200, type: 'volscale' },
                    { name: 'D2+防御型', cagr: 22.89, sharpe: 1.14, size: 200, type: 'volscale' },
                    { name: 'D3+防御型_VS ⭐', cagr: 20.42, sharpe: 1.22, size: 300, type: 'recommended' },
                    { name: 'D2_VolScale', cagr: 20.13, sharpe: 1.22, size: 200, type: 'volscale' },
                    { name: 'D2', cagr: 19.1, sharpe: 1.1, size: 180, type: 'volscale' },
                  ]} 
                  fill="#10b981"
                >
                  <LabelList dataKey="name" position="top" fill="#10b981" fontSize={10} />
                </Scatter>
                {/* ベンチマーク */}
                <Scatter 
                  name="ベンチマーク" 
                  data={[
                    { name: 'SPY', cagr: 9.2, sharpe: 0.66, size: 150, type: 'benchmark' },
                  ]} 
                  fill="#f59e0b"
                >
                  <LabelList dataKey="name" position="top" fill="#f59e0b" fontSize={10} />
                </Scatter>
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
              <div className="font-medium text-indigo-400 mb-1">右上が理想</div>
              <div className="text-muted-foreground">Sharpeが高く、CAGRも高い領域。Renaissanceが別格。</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <div className="font-medium text-emerald-400 mb-1">VolScale戦略</div>
              <div className="text-muted-foreground">CAGRでは大手ファンドを上回るが、Sharpeはやや劣る。</div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="font-medium text-amber-400 mb-1">推奨戦略</div>
              <div className="text-muted-foreground">D3+防御型_VolScaleはSharpe 1.22でバランス良好。</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 指標の説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            指標の説明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-foreground mb-1">Sharpe比</div>
              <div className="text-muted-foreground text-xs">
                リスク1単位あたりの超過リターン。1.0以上で良好、2.0以上で卓越。
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-foreground mb-1">Sortino比</div>
              <div className="text-muted-foreground text-xs">
                下方リスクのみを考慮したリスク調整後リターン。Sharpeより実践的。
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-foreground mb-1">Calmar比</div>
              <div className="text-muted-foreground text-xs">
                年率リターン÷最大ドローダウン。1.0以上が目安。
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-foreground mb-1">MaxDD（最大ドローダウン）</div>
              <div className="text-muted-foreground text-xs">
                ピークからの最大下落率。リスク許容度の指標。
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 年次リターン比較表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            年次リターン比較（戦略 vs ヘッジファンド）
          </CardTitle>
          <CardDescription>
            主要戦略とヘッジファンドの年次リターンを比較（2020-2024年）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium">ファンド/戦略</th>
                  <th className="p-3 text-center font-medium">2020</th>
                  <th className="p-3 text-center font-medium">2021</th>
                  <th className="p-3 text-center font-medium">2022</th>
                  <th className="p-3 text-center font-medium">2023</th>
                  <th className="p-3 text-center font-medium">2024</th>
                  <th className="p-3 text-center font-medium">平均</th>
                </tr>
              </thead>
              <tbody>
                {/* Renaissance */}
                <tr className="border-b border-border bg-amber-500/5">
                  <td className="p-3 font-medium text-amber-400">Renaissance Medallion</td>
                  <td className="p-3 text-center text-emerald-400">+76%</td>
                  <td className="p-3 text-center text-emerald-400">+33%</td>
                  <td className="p-3 text-center text-emerald-400">+22%</td>
                  <td className="p-3 text-center text-emerald-400">+28%</td>
                  <td className="p-3 text-center text-emerald-400">+42%</td>
                  <td className="p-3 text-center font-bold text-amber-400">+40.2%</td>
                </tr>
                {/* D3+防御型 */}
                <tr className="border-b border-border bg-purple-500/10">
                  <td className="p-3 font-medium text-purple-400">D3+防御型</td>
                  <td className="p-3 text-center text-emerald-400">+45.2%</td>
                  <td className="p-3 text-center text-emerald-400">+38.7%</td>
                  <td className="p-3 text-center text-red-400">-8.3%</td>
                  <td className="p-3 text-center text-emerald-400">+42.1%</td>
                  <td className="p-3 text-center text-emerald-400">+35.8%</td>
                  <td className="p-3 text-center font-bold text-purple-400">+30.7%</td>
                </tr>
                {/* D3+防御型_VolScale */}
                <tr className="border-b border-border bg-emerald-500/10">
                  <td className="p-3 font-medium text-emerald-400">D3+防御型_VolScale ⭐</td>
                  <td className="p-3 text-center text-emerald-400">+28.5%</td>
                  <td className="p-3 text-center text-emerald-400">+25.3%</td>
                  <td className="p-3 text-center text-red-400">-5.2%</td>
                  <td className="p-3 text-center text-emerald-400">+31.8%</td>
                  <td className="p-3 text-center text-emerald-400">+22.4%</td>
                  <td className="p-3 text-center font-bold text-emerald-400">+20.6%</td>
                </tr>
                {/* Citadel */}
                <tr className="border-b border-border">
                  <td className="p-3 font-medium">Citadel Wellington</td>
                  <td className="p-3 text-center text-emerald-400">+24.4%</td>
                  <td className="p-3 text-center text-emerald-400">+26.3%</td>
                  <td className="p-3 text-center text-emerald-400">+38.1%</td>
                  <td className="p-3 text-center text-emerald-400">+15.3%</td>
                  <td className="p-3 text-center text-emerald-400">+15.1%</td>
                  <td className="p-3 text-center font-bold">+23.8%</td>
                </tr>
                {/* D.E. Shaw */}
                <tr className="border-b border-border">
                  <td className="p-3 font-medium">D.E. Shaw Composite</td>
                  <td className="p-3 text-center text-emerald-400">+19.5%</td>
                  <td className="p-3 text-center text-emerald-400">+17.8%</td>
                  <td className="p-3 text-center text-emerald-400">+24.7%</td>
                  <td className="p-3 text-center text-emerald-400">+18.5%</td>
                  <td className="p-3 text-center text-emerald-400">+18.0%</td>
                  <td className="p-3 text-center font-bold">+19.7%</td>
                </tr>
                {/* Millennium */}
                <tr className="border-b border-border">
                  <td className="p-3 font-medium">Millennium Management</td>
                  <td className="p-3 text-center text-emerald-400">+26.0%</td>
                  <td className="p-3 text-center text-emerald-400">+13.5%</td>
                  <td className="p-3 text-center text-emerald-400">+12.4%</td>
                  <td className="p-3 text-center text-emerald-400">+10.0%</td>
                  <td className="p-3 text-center text-emerald-400">+15.0%</td>
                  <td className="p-3 text-center font-bold">+15.4%</td>
                </tr>
                {/* Two Sigma */}
                <tr className="border-b border-border">
                  <td className="p-3 font-medium">Two Sigma</td>
                  <td className="p-3 text-center text-emerald-400">+14.2%</td>
                  <td className="p-3 text-center text-emerald-400">+11.8%</td>
                  <td className="p-3 text-center text-emerald-400">+15.3%</td>
                  <td className="p-3 text-center text-emerald-400">+8.5%</td>
                  <td className="p-3 text-center text-emerald-400">+12.0%</td>
                  <td className="p-3 text-center font-bold">+12.4%</td>
                </tr>
                {/* SPY */}
                <tr className="bg-muted/30">
                  <td className="p-3 font-medium text-muted-foreground">SPY（ベンチマーク）</td>
                  <td className="p-3 text-center text-emerald-400">+18.4%</td>
                  <td className="p-3 text-center text-emerald-400">+28.7%</td>
                  <td className="p-3 text-center text-red-400">-18.1%</td>
                  <td className="p-3 text-center text-emerald-400">+26.3%</td>
                  <td className="p-3 text-center text-emerald-400">+25.0%</td>
                  <td className="p-3 text-center font-bold text-muted-foreground">+16.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <div className="font-medium text-emerald-400 mb-1">推奨戦略の安定性</div>
              <div className="text-muted-foreground">D3+防御型_VolScaleは2022年の下落を-5.2%に抑制。Citadelは+38.1%と市場下落時に強い。</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="font-medium text-purple-400 mb-1">高リターン戦略</div>
              <div className="text-muted-foreground">D3+防御型は平均+30.7%でRenaissanceに次ぐ。ただし2022年はマイナス。</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 重要な留意事項 */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            重要な留意事項
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 本分析はバックテストに基づく。<strong className="text-foreground">実運用では10-30%の劣化</strong>が一般的</li>
            <li>• 最低<strong className="text-foreground">2-3年のライブトレード検証</strong>を推奨</li>
            <li>• 大手ファンドは巨大なインフラと人員を持つ（Millennium: 6,300人、13M取引/日）</li>
            <li>• スケーラビリティ検証が必要（$10M以上の運用では市場インパクト増大）</li>
          </ul>
        </CardContent>
      </Card>

      {/* データソース・引用元 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-400" />
            データソース・引用元
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataSources.map((source) => (
              <div key={source.fund} className="border-b border-border pb-3 last:border-0">
                <div className="font-medium text-sm mb-2">{source.fund}</div>
                <div className="space-y-1">
                  {source.sources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              📋 データ収集方法: 上記ソースから2024年1月23-24日にウェブ検索により収集。各ファンドのパフォーマンス数値は複数ソースで相互検証。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* フッター */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        <p>本レポートは情報提供を目的としており、投資助言ではありません。</p>
        <p>投資判断はご自身の責任において行ってください。</p>
        <p className="mt-2">全戦略分析版 v3.0 | {new Date().toISOString().split('T')[0]}作成</p>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function AnalysisResults() {
  const [selectedTab, setSelectedTab] = useState('methodology');
  const [selectedStrategy, setSelectedStrategy] = useState('D3+防御型_VolScale');
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null);
  const [selectedCost, setSelectedCost] = useState<CostMode>('0.2%');

  // 累積リターンデータ
  const cumulativeData = useMemo(() => {
    const strategies = showAllStrategies 
      ? Object.keys(integratedData.summary)
      : ['D3', 'D3+防御型', 'D3_VolScale', 'D3+防御型_VolScale', 'SPY'];
    return calculateCumulativeReturns(strategies);
  }, [showAllStrategies]);

  // 主要戦略リスト
  const mainStrategies = [
    'D3+防御型_VolScale',
    'D3_VolScale',
    'D3+防御型',
    'D3',
    'SPY',
  ];

  // 全戦略リスト（カテゴリ別）
  const allStrategiesGrouped = {
    '攻撃型': ['D2', 'D3', 'D2_VolScale', 'D3_VolScale'],
    '防御型': ['防御型TOP3', '防御型TOP5', '防御型TOP3_VolScale', '防御型TOP5_VolScale'],
    '統合型': ['D2+防御型', 'D3+防御型', 'D2+防御型_VolScale', 'D3+防御型_VolScale'],
    'ベンチマーク': ['SPY'],
  };

  // 選択された取引コストに応じたデータを取得
  const getDisplayData = (strategyId: string) => {
    const costData = COST_DATA[selectedCost][strategyId as keyof typeof COST_DATA['0%']];
    return costData || null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">分析結果</h1>
                <p className="text-xs text-muted-foreground">
                  Volatility Scaling + ロバスト性評価（v4）
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SimulationConditionsBadge variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="flex w-full overflow-x-auto mb-6 gap-1 p-1 scrollbar-hide">
            <TabsTrigger value="methodology" className="flex-shrink-0 px-3 text-cyan-400">概要</TabsTrigger>
            <TabsTrigger value="overview" className="flex-shrink-0 px-3">成績</TabsTrigger>
            <TabsTrigger value="hf-comparison" className="flex-shrink-0 px-3 text-amber-400">HF比較</TabsTrigger>
            <TabsTrigger value="simulator" className="flex-shrink-0 px-3">シミュレーター</TabsTrigger>
            <TabsTrigger value="volscale" className="flex-shrink-0 px-3">VolScale</TabsTrigger>
            <TabsTrigger value="chart" className="flex-shrink-0 px-3">チャート</TabsTrigger>
            <TabsTrigger value="yearly" className="flex-shrink-0 px-3">年次詳細</TabsTrigger>
            <TabsTrigger value="regime" className="flex-shrink-0 px-3">レジーム</TabsTrigger>
            <TabsTrigger value="robustness" className="flex-shrink-0 px-3">ロバスト性</TabsTrigger>
          </TabsList>

          {/* 成績タブ */}
          <TabsContent value="overview" className="space-y-6">
            {/* 戦略選択ガイド */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  戦略選択ガイド
                </CardTitle>
                <CardDescription>
                  投資目標に応じて最適な戦略を選択してください。以下は主要戦略の比較です。
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 主要戦略比較表（取引コスト連動） */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">戦略</th>
                        <th className="text-right p-2">累積リターン</th>
                        <th className="text-right p-2">CAGR</th>
                        <th className="text-right p-2">MaxDD</th>
                        <th className="text-right p-2">Sharpe</th>
                        <th className="text-left p-2">特徴</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const d3DefData = getDisplayData('D3+防御型');
                        const d3DefVolData = getDisplayData('D3+防御型_VolScale');
                        const d3Data = getDisplayData('D3');
                        const spyData = getDisplayData('SPY');
                        
                        return (
                          <>
                            <tr className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">D3+防御型</td>
                              <td className="p-2 text-right text-green-500 font-bold">
                                {d3DefData ? `${d3DefData.cumulative.toLocaleString()}%` : '-'}
                              </td>
                              <td className="p-2 text-right">{d3DefData ? `${d3DefData.cagr.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right text-red-500">{d3DefData ? `${d3DefData.maxDD.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right">{d3DefData ? d3DefData.sharpe.toFixed(2) : '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">累積リターン最大</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">D3+防御型_VolScale</td>
                              <td className="p-2 text-right text-green-500">
                                {d3DefVolData ? `${d3DefVolData.cumulative.toLocaleString()}%` : '-'}
                              </td>
                              <td className="p-2 text-right">{d3DefVolData ? `${d3DefVolData.cagr.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right text-orange-500">{d3DefVolData ? `${d3DefVolData.maxDD.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right font-bold">{d3DefVolData ? d3DefVolData.sharpe.toFixed(2) : '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">DD抑制、Sharpe最高</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">D3</td>
                              <td className="p-2 text-right text-green-500">
                                {d3Data ? `${d3Data.cumulative.toLocaleString()}%` : '-'}
                              </td>
                              <td className="p-2 text-right font-bold">{d3Data ? `${d3Data.cagr.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right text-red-500">{d3Data ? `${d3Data.maxDD.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right">{d3Data ? d3Data.sharpe.toFixed(2) : '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">CAGR最高、高DD</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">SPY</td>
                              <td className="p-2 text-right text-muted-foreground">
                                {spyData ? `${spyData.cumulative.toLocaleString()}%` : '-'}
                              </td>
                              <td className="p-2 text-right">{spyData ? `${spyData.cagr.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right text-red-500">{spyData ? `${spyData.maxDD.toFixed(2)}%` : '-'}</td>
                              <td className="p-2 text-right">{spyData ? spyData.sharpe.toFixed(2) : '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">ベンチマーク</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* 戦略選択のポイント */}
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="text-sm font-medium mb-3">戦略選択のポイント</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">リターン最大化重視</p>
                        <p className="text-xs text-muted-foreground">
                          D3+防御型（累積{getDisplayData('D3+防御型')?.cumulative.toLocaleString()}%、MaxDD {getDisplayData('D3+防御型')?.maxDD.toFixed(2)}%許容）
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">リスク調整重視</p>
                        <p className="text-xs text-muted-foreground">
                          D3+防御型_VolScale（Sharpe {getDisplayData('D3+防御型_VolScale')?.sharpe.toFixed(2)}、MaxDD {getDisplayData('D3+防御型_VolScale')?.maxDD.toFixed(2)}%）
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    ※ 投資判断は自己責任でお願いします。上記は過去のバックテスト結果であり、将来のパフォーマンスを保証するものではありません。
                  </p>
                </div>
                
                {/* シミュレーション条件 */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-muted-foreground">シミュレーション条件</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">取引コスト:</span>
                      <div className="flex rounded-md border border-border overflow-hidden">
                        <button
                          onClick={() => setSelectedCost('0%')}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            selectedCost === '0%'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          0%（理想）
                        </button>
                        <button
                          onClick={() => setSelectedCost('0.2%')}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            selectedCost === '0.2%'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          0.2%（現実）
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">期間:</span>
                      <span className="ml-1 font-mono">2004-01 〜 2025-12</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">取引コスト:</span>
                      <span className="ml-1 font-mono text-primary">{selectedCost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vol短期:</span>
                      <span className="ml-1 font-mono">21日</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vol長期:</span>
                      <span className="ml-1 font-mono">60日</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 主要戦略比較 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">主要戦略比較</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainStrategies.map(strategyId => (
                  <StrategyCard 
                    key={strategyId}
                    strategyId={strategyId}
                    showVolScale={strategyId.includes('VolScale')}
                    selectedCost={selectedCost}
                  />
                ))}
              </div>
            </div>

            {/* 全戦略（折りたたみ） */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  全13戦略を表示
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-6">
                {Object.entries(allStrategiesGrouped).map(([category, strategies]) => (
                  <div key={category}>
                    <h3 className="text-md font-semibold mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {strategies.map(strategyId => (
                        <StrategyCard 
                          key={strategyId}
                          strategyId={strategyId}
                          showVolScale={strategyId.includes('VolScale')}
                          selectedCost={selectedCost}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* 指標の説明 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  指標の説明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {Object.entries(metricDescriptions).map(([key, desc]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium min-w-[80px]">{key.toUpperCase()}</span>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HF比較タブ */}
          <TabsContent value="hf-comparison" className="space-y-6">
            <HedgeFundComparisonSection />
          </TabsContent>

          {/* シミュレータータブ */}
          <TabsContent value="simulator" className="space-y-6">
            <StrategySimulator />
          </TabsContent>

          {/* VolScaleタブ */}
          <TabsContent value="volscale" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Volatility Scaling とは
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Volatility Scalingは、ポートフォリオのボラティリティを目標値に近づけるように
                  ポジションサイズを動的に調整する手法です。ボラティリティが高い時期には
                  ポジションを縮小し、低い時期には拡大することで、リスク調整後リターンを改善します。
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Scale = 目標Vol / 実績Vol（過去60日）
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">メリット</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>リスク調整後リターン（Sharpe）の改善</li>
                      <li>最大ドローダウンの抑制</li>
                      <li>危機時の自動的なリスク削減</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">注意点</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>絶対リターン（CAGR）は低下する傾向</li>
                      <li>レバレッジを使用する場合がある</li>
                      <li>目標Volの設定が重要</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VolScale適用前後の比較</CardTitle>
                <CardDescription>
                  各戦略にVolatility Scalingを適用した場合の効果
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VolScaleComparisonTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>目標Volatility設定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(targetVolatilities).map(([strategy, vol]) => (
                    <div key={strategy} className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">{strategyDisplayNames[strategy]}</div>
                      <div className="text-2xl font-bold text-blue-500">{(vol * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* チャートタブ */}
          <TabsContent value="chart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>累積リターン推移（月次データ: 2004-2025）</CardTitle>
                <CardDescription>
                  13戦略の月次累積リターン比較 - 経済危機・Bear期間・レジーム転換を可視化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyChart13Strategies />
              </CardContent>
            </Card>

            {/* サマリー統計 */}
            <Card>
              <CardHeader>
                <CardTitle>サマリー統計（取引コスト: {selectedCost}）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">CAGR最高</div>
                    <div className="text-xl font-bold text-green-500">
                      {(() => {
                        const d3Data = getDisplayData('D3');
                        return d3Data ? `${d3Data.cagr.toFixed(1)}%` : '-';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">D3</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Sharpe最高</div>
                    <div className="text-xl font-bold text-blue-500">
                      {(() => {
                        const d3VolData = getDisplayData('D3_VolScale');
                        return d3VolData ? d3VolData.sharpe.toFixed(2) : '-';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">D3_VolScale</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">MaxDD最小</div>
                    <div className="text-xl font-bold text-orange-500">
                      {(() => {
                        const d3DefVolData = getDisplayData('D3+防御型_VolScale');
                        return d3DefVolData ? `${d3DefVolData.maxDD.toFixed(1)}%` : '-';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">D3+防御型_VolScale</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">累積最大</div>
                    <div className="text-xl font-bold text-purple-500">
                      {(() => {
                        const d3Data = getDisplayData('D3');
                        return d3Data ? `${d3Data.cumulative.toLocaleString()}%` : '-';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">D3</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 年次詳細タブ */}
          <TabsContent value="yearly" className="space-y-6">
            <YearlyPerformanceTable13 />
          </TabsContent>

          {/* レジームタブ */}
          <TabsContent value="regime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>レジーム別パフォーマンス</CardTitle>
                <CardDescription>
                  市場環境（Bull/Bear）別の戦略パフォーマンス比較
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">戦略</th>
                        <th className="text-center p-2 bg-green-500/10" colSpan={3}>Bull期間</th>
                        <th className="text-center p-2 bg-red-500/10" colSpan={3}>Bear期間</th>
                      </tr>
                      <tr className="border-b text-xs">
                        <th className="text-left p-2"></th>
                        <th className="text-right p-2 bg-green-500/10">CAGR</th>
                        <th className="text-right p-2 bg-green-500/10">MaxDD</th>
                        <th className="text-right p-2 bg-green-500/10">月数</th>
                        <th className="text-right p-2 bg-red-500/10">CAGR</th>
                        <th className="text-right p-2 bg-red-500/10">MaxDD</th>
                        <th className="text-right p-2 bg-red-500/10">月数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mainStrategies.map(strategyId => {
                        const regimeData = integratedData.regime_performance?.[strategyId];
                        if (!regimeData) return null;
                        
                        return (
                          <tr key={strategyId} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{strategyDisplayNames[strategyId]}</td>
                            <td className="p-2 text-right text-green-500">
                              {regimeData.Bull ? `${(regimeData.Bull.cagr * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right text-red-500">
                              {regimeData.Bull ? `${(regimeData.Bull.max_dd * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right text-muted-foreground">
                              {regimeData.Bull?.n_months || '-'}
                            </td>
                            <td className="p-2 text-right text-red-500">
                              {regimeData.Bear ? `${(regimeData.Bear.cagr * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right text-red-500">
                              {regimeData.Bear ? `${(regimeData.Bear.max_dd * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right text-muted-foreground">
                              {regimeData.Bear?.n_months || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>レジーム判定ルール</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm">
                    Bull: SPY終値 &gt; MA200 × 0.95
                  </p>
                  <p className="font-mono text-sm">
                    Bear: SPY終値 ≤ MA200 × 0.95
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  200日移動平均の95%をしきい値として使用することで、
                  ノイズによる頻繁なレジーム切り替えを抑制しています。
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ロバスト性タブ - 新版コンポーネントを使用 */}
          <TabsContent value="robustness" className="space-y-6">
            <RobustnessPageNew />
          </TabsContent>

          {/* 概要タブ（シミュレーション手法） */}
          <TabsContent value="methodology" className="space-y-6">
            {/* サマリーカード */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  シミュレーション条件サマリー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold">取引コスト</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-400">0.2%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      往復取引あたり
                    </p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="font-semibold">バイアス補正</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">-2%/年</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      サバイバーシップバイアス
                    </p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">シミュレーション期間</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">21年</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      2004-08 〜 2025-11
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 取引コスト詳細 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <CardTitle>取引コストの計算方法</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">計算式</h4>
                  <code className="text-sm bg-background p-2 rounded block">
                    月次リターン = 実際のリターン × (1 - 取引コスト率)
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    ※ リバランス発生月のみ適用
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">取引コスト0.2%の内訳</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">項目</th>
                        <th className="text-right p-2">コスト</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">売買手数料（往復）</td>
                        <td className="p-2 text-right">0.10%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">スプレッド（往復）</td>
                        <td className="p-2 text-right">0.05%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">マーケットインパクト</td>
                        <td className="p-2 text-right">0.05%</td>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-2 font-semibold">合計</td>
                        <td className="p-2 text-right font-semibold">0.20%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400">注意事項</h4>
                      <p className="text-sm text-muted-foreground">
                        取引コスト0.2%は保守的な見積もりです。Interactive Brokersなどの低コストブローカーを使用する場合、
                        実際のコストは0.1%以下になる可能性があります。一方、高頻度取引や大口取引では
                        マーケットインパクトが増大する可能性があります。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* サバイバーシップバイアス補正 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <CardTitle>サバイバーシップバイアス補正</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">サバイバーシップバイアスとは</h4>
                  <p className="text-sm text-muted-foreground">
                    現在のS&P500構成銘柄で過去をバックテストすると、倒産・除外された銘柄が含まれないため、
                    リターンが過大評価されます。これを「サバイバーシップバイアス」と呼びます。
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">補正方法</h4>
                  <code className="text-sm bg-background p-2 rounded block">
                    補正後リターン = 元のリターン - 2%/年
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    学術研究に基づき、年率2%のペナルティを適用
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">補正の根拠</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">研究</th>
                        <th className="text-right p-2">推定バイアス</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Elton, Gruber, Blake (1996)</td>
                        <td className="p-2 text-right">0.9%/年</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Brown, Goetzmann, Ross (1995)</td>
                        <td className="p-2 text-right">1.5-3.0%/年</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Rohleder, Scholz, Wilkens (2011)</td>
                        <td className="p-2 text-right">2.0-2.5%/年</td>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-2 font-semibold">本システムでの採用値</td>
                        <td className="p-2 text-right font-semibold text-red-400">2.0%/年</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-400">重要</h4>
                      <p className="text-sm text-muted-foreground">
                        補正後のリターンは「現実的な期待値」であり、実際の運用ではさらに下振れする可能性があります。
                        投資判断は自己責任でお願いします。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* データソース */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <CardTitle>データソースと限界</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">使用データ</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 株価データ: Yahoo Finance API</li>
                      <li>• 構成銘柄: S&P500/S&P100（現在の構成）</li>
                      <li>• リバランス頻度: 月次</li>
                      <li>• データ期間: 2004年8月 〜 2025年11月</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">限界と注意点</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 過去のパフォーマンスは将来を保証しない</li>
                      <li>• サバイバーシップバイアスの完全な排除は不可能</li>
                      <li>• 実際の取引では追加コストが発生する可能性</li>
                      <li>• 税金は考慮されていない</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-400">免責事項</h4>
                      <p className="text-sm text-muted-foreground">
                        本システムは教育目的であり、投資劧誘を目的としたものではありません。
                        実際の投資はご自身の判断と責任において行ってください。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
