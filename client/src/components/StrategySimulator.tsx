/**
 * 戦略シミュレーター
 * 目標Volatilityと投資金額を入力すると、期待されるCAGR/MaxDD/Sharpeと
 * 円建ての期待リターン/最大損失額を動的に計算
 * 
 * データソース: volscale_optimization.json の回帰分析結果を使用
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Info,
  AlertTriangle,
  Target,
  Wallet,
  DollarSign,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 戦略別の回帰係数（volscale_optimization.jsonから導出）
// y = a * targetVol + b の形式
const STRATEGY_COEFFICIENTS = {
  'D2': {
    name: 'D2（S&P100）',
    description: 'S&P100からモメンタム上位5銘柄',
    color: 'cyan',
    minVol: 8,
    maxVol: 25,
    optimalVol: 19,
    // 回帰係数
    cagr: { a: 0.85, b: 6.5 },      // CAGR = 0.85 * vol + 6.5
    maxDD: { a: -1.2, b: -5.0 },    // MaxDD = -1.2 * vol - 5.0
    sharpe: { a: 0.008, b: 1.12 },  // Sharpe = 0.008 * vol + 1.12
  },
  'D3': {
    name: 'D3（S&P500）',
    description: 'S&P500からモメンタム上位5銘柄',
    color: 'emerald',
    minVol: 8,
    maxVol: 25,
    optimalVol: 19,
    cagr: { a: 1.1, b: 6.0 },
    maxDD: { a: -1.4, b: -4.0 },
    sharpe: { a: 0.005, b: 1.14 },
  },
  '防御型TOP3': {
    name: '防御型TOP3',
    description: '低ボラティリティ上位3銘柄',
    color: 'amber',
    minVol: 5,
    maxVol: 15,
    optimalVol: 8,
    cagr: { a: 0.6, b: 4.0 },
    maxDD: { a: -0.8, b: -8.0 },
    sharpe: { a: 0.015, b: 0.70 },
  },
  '防御型TOP5': {
    name: '防御型TOP5',
    description: '低ボラティリティ上位5銘柄',
    color: 'amber',
    minVol: 5,
    maxVol: 15,
    optimalVol: 8,
    cagr: { a: 0.65, b: 4.5 },
    maxDD: { a: -0.75, b: -7.0 },
    sharpe: { a: 0.018, b: 0.84 },
  },
  'D2+防御型': {
    name: 'D2+防御型（レジーム切替）',
    description: 'Bull時D2、Bear時防御型TOP3',
    color: 'purple',
    minVol: 8,
    maxVol: 20,
    optimalVol: 14,
    cagr: { a: 0.75, b: 6.5 },
    maxDD: { a: -0.9, b: -6.0 },
    sharpe: { a: 0.012, b: 1.02 },
  },
  'D3+防御型': {
    name: 'D3+防御型（レジーム切替）',
    description: 'Bull時D3、Bear時防御型TOP3',
    color: 'purple',
    minVol: 8,
    maxVol: 20,
    optimalVol: 14,
    cagr: { a: 0.9, b: 7.8 },
    maxDD: { a: -1.0, b: -8.0 },
    sharpe: { a: 0.01, b: 1.08 },
  },
};

type StrategyKey = keyof typeof STRATEGY_COEFFICIENTS;

interface SimulationResult {
  cagr: number;
  maxDD: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

function calculateMetrics(strategy: StrategyKey, targetVol: number): SimulationResult {
  const coef = STRATEGY_COEFFICIENTS[strategy];
  
  const cagr = coef.cagr.a * targetVol + coef.cagr.b;
  const maxDD = coef.maxDD.a * targetVol + coef.maxDD.b;
  const sharpe = coef.sharpe.a * targetVol + coef.sharpe.b;
  
  // Sortino ≈ Sharpe * 1.5〜2.0（下方リスクが小さいため）
  const sortino = sharpe * 1.8;
  
  // Calmar = CAGR / |MaxDD|
  const calmar = Math.abs(maxDD) > 0 ? cagr / Math.abs(maxDD) : 0;
  
  return {
    cagr: Math.max(0, cagr),
    maxDD: Math.min(0, maxDD),
    sharpe: Math.max(0, sharpe),
    sortino: Math.max(0, sortino),
    calmar: Math.max(0, calmar),
  };
}

// 為替レートを取得するカスタムフック
function useExchangeRate() {
  const [rate, setRate] = useState<number>(158); // デフォルト値
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=JPY');
        if (!response.ok) throw new Error('Failed to fetch exchange rate');
        const data = await response.json();
        setRate(data.rates.JPY);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Exchange rate fetch error:', err);
        setError('為替レートの取得に失敗しました');
        // フォールバック値を維持
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
    // 1時間ごとに更新
    const interval = setInterval(fetchRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { rate, loading, error, lastUpdated };
}

// 金額をフォーマット（日本円）
function formatJPY(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}億円`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}万円`;
  }
  return `${amount.toLocaleString()}円`;
}

// 金額をフォーマット（短縮形）
function formatJPYShort(amount: number): string {
  if (Math.abs(amount) >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}億`;
  } else if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(0)}万`;
  }
  return `${amount.toLocaleString()}`;
}

export function StrategySimulator() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>('D3+防御型');
  const [targetVol, setTargetVol] = useState(14);
  const [investmentAmount, setInvestmentAmount] = useState(10000000); // デフォルト1000万円
  const [investmentInput, setInvestmentInput] = useState('1000');
  
  // 為替レートを取得
  const { rate: exchangeRate, loading: rateLoading, lastUpdated: rateLastUpdated } = useExchangeRate();
  
  const strategyConfig = STRATEGY_COEFFICIENTS[selectedStrategy];
  
  const result = useMemo(() => {
    return calculateMetrics(selectedStrategy, targetVol);
  }, [selectedStrategy, targetVol]);
  
  const optimalResult = useMemo(() => {
    return calculateMetrics(selectedStrategy, strategyConfig.optimalVol);
  }, [selectedStrategy, strategyConfig.optimalVol]);
  
  // 円建ての期待リターンと最大損失額
  const financialProjection = useMemo(() => {
    const expectedReturn1Y = investmentAmount * (result.cagr / 100);
    const expectedReturn3Y = investmentAmount * Math.pow(1 + result.cagr / 100, 3) - investmentAmount;
    const expectedReturn5Y = investmentAmount * Math.pow(1 + result.cagr / 100, 5) - investmentAmount;
    const maxLoss = investmentAmount * (result.maxDD / 100);
    
    // サバイバーシップバイアス補正後（-2%pt/年）
    const adjustedCAGR = result.cagr - 2;
    const adjustedReturn1Y = investmentAmount * (adjustedCAGR / 100);
    const adjustedReturn3Y = investmentAmount * Math.pow(1 + adjustedCAGR / 100, 3) - investmentAmount;
    const adjustedReturn5Y = investmentAmount * Math.pow(1 + adjustedCAGR / 100, 5) - investmentAmount;
    
    return {
      expectedReturn1Y,
      expectedReturn3Y,
      expectedReturn5Y,
      maxLoss,
      adjustedReturn1Y,
      adjustedReturn3Y,
      adjustedReturn5Y,
    };
  }, [investmentAmount, result]);
  
  const isOptimal = Math.abs(targetVol - strategyConfig.optimalVol) <= 1;
  const isHighRisk = targetVol > strategyConfig.optimalVol + 3;
  const isLowReturn = targetVol < strategyConfig.optimalVol - 3;
  
  const getColorClass = (color: string) => {
    switch (color) {
      case 'cyan': return 'border-cyan-500/50 bg-cyan-500/10 text-cyan-500';
      case 'emerald': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500';
      case 'amber': return 'border-amber-500/50 bg-amber-500/10 text-amber-500';
      case 'purple': return 'border-purple-500/50 bg-purple-500/10 text-purple-500';
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-500';
    }
  };

  const handleInvestmentChange = (value: string) => {
    setInvestmentInput(value);
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(numValue) && numValue > 0) {
      setInvestmentAmount(numValue * 10000); // 万円単位で入力
    }
  };

  const presetAmounts = [
    { label: '100万', value: 100 },
    { label: '500万', value: 500 },
    { label: '1000万', value: 1000 },
    { label: '3000万', value: 3000 },
    { label: '5000万', value: 5000 },
    { label: '1億', value: 10000 },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle>戦略シミュレーター</CardTitle>
        </div>
        <CardDescription>
          目標ボラティリティと投資金額を調整して、期待されるパフォーマンスを確認
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 戦略選択 */}
        <div>
          <label className="text-sm font-medium mb-3 block">戦略を選択</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(STRATEGY_COEFFICIENTS) as StrategyKey[]).map((key) => {
              const config = STRATEGY_COEFFICIENTS[key];
              const isSelected = selectedStrategy === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedStrategy(key);
                    setTargetVol(config.optimalVol);
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    isSelected 
                      ? getColorClass(config.color)
                      : "border-border hover:border-primary/50 bg-background/50"
                  )}
                >
                  <div className="font-medium text-sm">{config.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    最適Vol: {config.optimalVol}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 目標Vol スライダー */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">目標ボラティリティ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono">{targetVol}%</span>
              {isOptimal && (
                <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                  最適
                </Badge>
              )}
              {isHighRisk && (
                <Badge variant="outline" className="border-red-500 text-red-500">
                  高リスク
                </Badge>
              )}
              {isLowReturn && (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  低リターン
                </Badge>
              )}
            </div>
          </div>
          
          <Slider
            value={[targetVol]}
            onValueChange={(value) => setTargetVol(value[0])}
            min={strategyConfig.minVol}
            max={strategyConfig.maxVol}
            step={1}
            className="mb-2"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{strategyConfig.minVol}%（保守的）</span>
            <span className="text-primary">{strategyConfig.optimalVol}%（最適）</span>
            <span>{strategyConfig.maxVol}%（積極的）</span>
          </div>
        </div>
        
        {/* 投資金額入力 */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-medium">投資金額</span>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Input
                type="text"
                value={investmentInput}
                onChange={(e) => handleInvestmentChange(e.target.value)}
                className="pr-12 text-lg font-mono"
                placeholder="1000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                万円
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setInvestmentInput(preset.value.toString());
                  setInvestmentAmount(preset.value * 10000);
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-all",
                  investmentAmount === preset.value * 10000
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/50 border border-border hover:border-primary/50"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            投資金額: <span className="font-mono font-medium text-foreground">{formatJPY(investmentAmount)}</span>
          </div>
          
          {/* 為替レート表示 */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span>USD/JPY:</span>
                <span className="font-mono font-medium text-foreground">
                  {rateLoading ? '読込中...' : `¥${exchangeRate.toFixed(2)}`}
                </span>
              </div>
              {rateLastUpdated && (
                <span className="text-muted-foreground">
                  更新: {rateLastUpdated.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ドル換算: <span className="font-mono">${(investmentAmount / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
        
        {/* シミュレーション結果 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">期待CAGR</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {result.cagr.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              最適時: {optimalResult.cagr.toFixed(1)}%
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">期待MaxDD</span>
            </div>
            <div className="text-2xl font-bold font-mono text-red-500">
              {result.maxDD.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              最適時: {optimalResult.maxDD.toFixed(1)}%
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">期待Sharpe</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {result.sharpe.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              最適時: {optimalResult.sharpe.toFixed(2)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">期待Sortino</span>
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-500">
              {result.sortino.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              最適時: {optimalResult.sortino.toFixed(2)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">期待Calmar</span>
            </div>
            <div className="text-2xl font-bold font-mono text-purple-500">
              {result.calmar.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              最適時: {optimalResult.calmar.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* 円建て期待リターン/最大損失額 */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">円建て期待リターン（{formatJPY(investmentAmount)}投資時）</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-xs text-muted-foreground mb-1">1年後期待リターン</div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                +{formatJPYShort(financialProjection.expectedReturn1Y)}円
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                補正後: +{formatJPYShort(financialProjection.adjustedReturn1Y)}円
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-xs text-muted-foreground mb-1">3年後期待リターン</div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                +{formatJPYShort(financialProjection.expectedReturn3Y)}円
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                補正後: +{formatJPYShort(financialProjection.adjustedReturn3Y)}円
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-xs text-muted-foreground mb-1">5年後期待リターン</div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                +{formatJPYShort(financialProjection.expectedReturn5Y)}円
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                補正後: +{formatJPYShort(financialProjection.adjustedReturn5Y)}円
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-xs text-muted-foreground mb-1">最大損失額（MaxDD時）</div>
              <div className="text-xl font-bold font-mono text-red-500">
                {formatJPYShort(financialProjection.maxLoss)}円
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                投資額の{Math.abs(result.maxDD).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            ※ 「補正後」はサバイバーシップバイアス補正（-2%pt/年）を適用した保守的な推定値です
          </div>
        </div>
        
        {/* 投資シナリオ比較 */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium">投資シナリオ比較</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium">シナリオ</th>
                  <th className="text-right py-2 px-2 font-medium">1年後</th>
                  <th className="text-right py-2 px-2 font-medium">3年後</th>
                  <th className="text-right py-2 px-2 font-medium">5年後</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <span className="text-emerald-500 font-medium">楽観シナリオ</span>
                    <span className="text-xs text-muted-foreground ml-1">(CAGR+5%)</span>
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-emerald-500">
                    +{formatJPYShort(investmentAmount * ((result.cagr + 5) / 100))}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-emerald-500">
                    +{formatJPYShort(investmentAmount * (Math.pow(1 + (result.cagr + 5) / 100, 3) - 1))}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-emerald-500">
                    +{formatJPYShort(investmentAmount * (Math.pow(1 + (result.cagr + 5) / 100, 5) - 1))}円
                  </td>
                </tr>
                <tr className="border-b border-border/50 bg-primary/5">
                  <td className="py-2 px-2">
                    <span className="text-primary font-medium">基本シナリオ</span>
                    <span className="text-xs text-muted-foreground ml-1">(CAGR {result.cagr.toFixed(1)}%)</span>
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    +{formatJPYShort(financialProjection.expectedReturn1Y)}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    +{formatJPYShort(financialProjection.expectedReturn3Y)}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    +{formatJPYShort(financialProjection.expectedReturn5Y)}円
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <span className="text-amber-500 font-medium">保守シナリオ</span>
                    <span className="text-xs text-muted-foreground ml-1">(補正後)</span>
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-amber-500">
                    +{formatJPYShort(financialProjection.adjustedReturn1Y)}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-amber-500">
                    +{formatJPYShort(financialProjection.adjustedReturn3Y)}円
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-amber-500">
                    +{formatJPYShort(financialProjection.adjustedReturn5Y)}円
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2">
                    <span className="text-red-500 font-medium">悲観シナリオ</span>
                    <span className="text-xs text-muted-foreground ml-1">(MaxDD発生)</span>
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-red-500" colSpan={3}>
                    最大損失: {formatJPYShort(financialProjection.maxLoss)}円
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 注意事項 */}
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-amber-500 mb-1">シミュレーションの限界</p>
              <ul className="space-y-1 text-xs">
                <li>• 過去データに基づく推定であり、将来のパフォーマンスを保証するものではありません</li>
                <li>• 回帰モデルによる近似値のため、実際の結果とは異なる場合があります</li>
                <li>• 為替リスク、取引コスト、税金は考慮されていません</li>
                <li>• 「補正後」はサバイバーシップバイアス補正（-2%pt/年）を適用した保守的な推定値です</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 推奨設定 */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-emerald-500 mb-1">推奨設定</p>
              <p className="text-muted-foreground">
                <strong>{strategyConfig.name}</strong>の最適目標Volは
                <strong className="text-emerald-500"> {strategyConfig.optimalVol}%</strong>です。
                この設定でSharpe比が最大化されます。
                {investmentAmount >= 10000000 && (
                  <span className="block mt-1">
                    {formatJPY(investmentAmount)}の投資で、保守シナリオでも5年後に
                    <strong className="text-emerald-500"> +{formatJPYShort(financialProjection.adjustedReturn5Y)}円</strong>
                    の期待リターンが見込めます。
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
