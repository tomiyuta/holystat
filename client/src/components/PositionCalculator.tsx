/**
 * ポジション計算コンポーネント
 * 
 * 日本円の資金量を入力すると、D2/D3/防御型ポートフォリオの
 * 各銘柄に対して具体的な購入株数を計算・表示します。
 * 
 * Volatility Scaling（ボラティリティスケーリング）機能を搭載:
 * - 目標ボラティリティに基づいてポジションサイズを自動調整
 * - スケールファクター > 1.0 の場合はレバレッジが必要
 * - スケールファクター < 1.0 の場合は現金保有を推奨
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Wallet,
  PieChart,
  ArrowRight,
  RefreshCw,
  Settings,
  Zap,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  usePositionCalculator,
  formatJPY,
  formatUSD,
  formatPercent,
  type StrategyType,
} from '@/hooks/usePositionCalculator';

// ポートフォリオ結果の型
interface PortfolioResultData {
  strategyName: string;
  strategyDescription: string;
  totalJPY: number;
  totalUSD: number;
  exchangeRate: number;
  allocations: Array<{
    symbol: string;
    name: string;
    targetWeight: number;
    allocatedJPY: number;
    allocatedUSD: number;
    currentPrice: number;
    shares: number;
    actualAllocatedUSD: number;
    actualAllocatedJPY: number;
    actualWeight: number;
    remainder: number;
  }>;
  totalAllocatedUSD: number;
  totalAllocatedJPY: number;
  remainderUSD: number;
  remainderJPY: number;
  utilizationRate: number;
}

// VolScale情報の型
interface VolScaleInfo {
  enabled: boolean;
  targetVolatility: number;
  currentVolatility: number;
  scaleFactor: number;
  originalTotalUSD: number;
  scaledTotalUSD: number;
  leverageNote: string;
}

// ポートフォリオ結果テーブル
interface PortfolioResultProps {
  result: PortfolioResultData;
  color: string;
  icon: React.ReactNode;
  volScaleInfo?: VolScaleInfo;
}

function PortfolioResult({ result, color, icon, volScaleInfo }: PortfolioResultProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={'border-2 ' + color}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{result.strategyName}</CardTitle>
              <CardDescription>{result.strategyDescription}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">資金利用率</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercent(result.utilizationRate)}
              </div>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {/* VolScale情報 */}
              {volScaleInfo && volScaleInfo.enabled && (
                <VolScaleInfoPanel volScaleInfo={volScaleInfo} />
              )}

              {/* サマリー */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <SummaryCard label="投資総額" value={formatJPY(result.totalJPY)} subValue={formatUSD(result.totalUSD)} />
                <SummaryCard label="実際の配分額" value={formatJPY(result.totalAllocatedJPY)} subValue={formatUSD(result.totalAllocatedUSD)} />
                <SummaryCard label="余り" value={formatJPY(result.remainderJPY)} subValue={formatUSD(result.remainderUSD)} />
                <SummaryCard label="為替レート" value={`¥${result.exchangeRate.toFixed(2)}/USD`} />
              </div>

              {/* 銘柄テーブル */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">銘柄</th>
                      <th className="text-right py-2 px-2">目標比率</th>
                      <th className="text-right py-2 px-2">株価</th>
                      <th className="text-right py-2 px-2 font-bold text-primary">購入株数</th>
                      <th className="text-right py-2 px-2">実際の配分</th>
                      <th className="text-right py-2 px-2">実際の比率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocations.map((alloc) => (
                      <tr key={alloc.symbol} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <div className="font-mono font-bold">{alloc.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{alloc.name}</div>
                        </td>
                        <td className="text-right py-2 px-2 font-mono">{alloc.targetWeight.toFixed(1)}%</td>
                        <td className="text-right py-2 px-2 font-mono">{formatUSD(alloc.currentPrice)}</td>
                        <td className="text-right py-2 px-2 font-mono font-bold text-primary text-lg">{alloc.shares}</td>
                        <td className="text-right py-2 px-2">
                          <div className="font-mono">{formatUSD(alloc.actualAllocatedUSD)}</div>
                          <div className="text-xs text-muted-foreground">{formatJPY(alloc.actualAllocatedJPY)}</div>
                        </td>
                        <td className="text-right py-2 px-2 font-mono">{alloc.actualWeight.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// サマリーカード
function SummaryCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-bold">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </div>
  );
}

// VolScale情報パネル
function VolScaleInfoPanel({ volScaleInfo }: { volScaleInfo: VolScaleInfo }) {
  return (
    <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
      <div className="flex items-center gap-2 mb-2">
        <Scale className="w-4 h-4 text-primary" />
        <span className="font-medium text-primary">Volatility Scaling適用</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">目標Vol</div>
          <div className="font-mono font-bold">{volScaleInfo.targetVolatility}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">現在Vol</div>
          <div className="font-mono font-bold">{volScaleInfo.currentVolatility}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">スケール</div>
          <div className={'font-mono font-bold ' + (
            volScaleInfo.scaleFactor > 1.0 ? 'text-amber-500' :
            volScaleInfo.scaleFactor < 1.0 ? 'text-blue-500' :
            'text-emerald-500'
          )}>
            {volScaleInfo.scaleFactor.toFixed(2)}x
          </div>
        </div>
      </div>
      {volScaleInfo.leverageNote && (
        <LeverageWarning note={volScaleInfo.leverageNote} />
      )}
    </div>
  );
}

// レバレッジ警告
function LeverageWarning({ note }: { note: string }) {
  return (
    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div className="space-y-2">
          <div className="text-sm font-medium text-amber-500">{note}</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">信用取引について:</p>
            <p>
              スケールファクターが1.0を超える場合、目標ボラティリティを達成するには
              投入資金以上のポジションが必要です。これを実現する方法として
              <span className="text-amber-500 font-medium">信用取引（マージン取引）</span>があります。
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">なぜレバレッジETFではないのか:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>レバレッジETFは日次リバランスによる<span className="text-amber-500">ボラティリティドラッグ</span>が発生</li>
              <li>長期保有では複利効果が逆に働き、期待リターンが低下</li>
              <li>信用取引は元本に対するレバレッジを直接コントロール可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 入力セクション
function InputSection({ calc }: { calc: ReturnType<typeof usePositionCalculator> }) {
  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>購入株数計算</CardTitle>
            <CardDescription>
              投資資金を入力すると、各戦略の銘柄ごとに購入すべき株数を計算します
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 為替レート表示 */}
          <ExchangeRateDisplay 
            exchangeRate={calc.exchangeRate} 
            isLoading={calc.isLoadingRate} 
          />

          {/* 金額入力 */}
          <AmountInput calc={calc} />

          {/* プリセットボタン */}
          <PresetButtons calc={calc} />

          {/* 入力バリデーション */}
          {calc.parsedAmount > 0 && !calc.isValidAmount && (
            <p className="text-sm text-destructive">最低投資金額は1万円です</p>
          )}

          {/* VolScale設定 */}
          <VolScaleSettings calc={calc} />
        </div>
      </CardContent>
    </Card>
  );
}

// 為替レート表示
function ExchangeRateDisplay({ exchangeRate, isLoading }: { exchangeRate: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>為替レートを取得中...</span>
      </div>
    );
  }

  if (!exchangeRate) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <DollarSign className="w-4 h-4 text-primary" />
      <span className="text-foreground font-medium">為替レート: 1 USD = {exchangeRate.rate.toFixed(2)} JPY</span>
      <span className={
        exchangeRate.source === 'frankfurter' 
          ? 'text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400' 
          : exchangeRate.source === 'batch'
          ? 'text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400'
          : 'text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400'
      }>
        {exchangeRate.source === 'frankfurter' ? 'ECBレート' 
         : exchangeRate.source === 'batch' ? 'バッチデータ'
         : 'フォールバック'}
      </span>
    </div>
  );
}

// 金額入力
function AmountInput({ calc }: { calc: ReturnType<typeof usePositionCalculator> }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          value={calc.amountInput}
          onChange={(e) => calc.setAmountInput(e.target.value)}
          placeholder="1,000,000"
          className="pl-10 pr-12 text-lg font-mono h-12"
          onKeyDown={(e) => e.key === 'Enter' && calc.handleCalculate()}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">円</span>
      </div>
      <Button 
        onClick={calc.handleCalculate}
        disabled={!calc.canCalculate}
        className="h-12 px-6"
      >
        {calc.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            計算
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

// プリセットボタン
function PresetButtons({ calc }: { calc: ReturnType<typeof usePositionCalculator> }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {calc.presets.map((preset) => (
        <Button
          key={preset.value}
          variant="outline"
          size="sm"
          onClick={() => calc.handlePresetSelect(preset.value)}
          className={calc.submittedAmount === preset.value ? 'border-primary' : ''}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

// VolScale設定
function VolScaleSettings({ calc }: { calc: ReturnType<typeof usePositionCalculator> }) {
  return (
    <Collapsible open={calc.volScaleSettingsOpen} onOpenChange={calc.setVolScaleSettingsOpen}>
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold transition-colors ${!calc.volScaleEnabled ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>OFF</span>
            <Switch
              id="volscale-toggle"
              checked={calc.volScaleEnabled}
              onCheckedChange={calc.setVolScaleEnabled}
            />
            <span className={`text-xs font-bold transition-colors ${calc.volScaleEnabled ? 'text-primary' : 'text-muted-foreground/50'}`}>ON</span>
          </div>
          <Label htmlFor="volscale-toggle" className="flex items-center gap-2 cursor-pointer">
            <Scale className="w-4 h-4 text-primary" />
            <span className="font-medium">Volatility Scaling</span>
            {calc.volScaleEnabled && (
              <Badge variant="secondary" className="text-xs">
                {calc.currentTargetVol}% 目標
              </Badge>
            )}
          </Label>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <Settings className="w-4 h-4" />
            設定
            {calc.volScaleSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <VolScaleSettingsPanel calc={calc} />
      </CollapsibleContent>
    </Collapsible>
  );
}

// VolScale設定パネル
function VolScaleSettingsPanel({ calc }: { calc: ReturnType<typeof usePositionCalculator> }) {
  return (
    <div className="mt-3 p-4 bg-muted/20 rounded-lg border border-border space-y-4">
      {/* 戦略選択 */}
      <div className="space-y-2">
        <Label>戦略タイプ</Label>
        <Select
          value={calc.selectedStrategy}
          onValueChange={(value) => calc.handleStrategyChange(value as StrategyType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(calc.strategyNames) as StrategyType[]).map((key) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center justify-between w-full">
                  <span>{calc.strategyNames[key]}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    目標Vol: {calc.defaultTargetVols[key]}%
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 目標ボラティリティ調整 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>目標ボラティリティ</Label>
          <span className="text-sm font-mono font-bold text-primary">
            {calc.currentTargetVol}%
          </span>
        </div>
        <Slider
          value={[calc.currentTargetVol]}
          onValueChange={([value]) => calc.setCustomTargetVol(value)}
          min={5}
          max={30}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>低リスク (5%)</span>
          <span>高リスク (30%)</span>
        </div>
      </div>

      {/* VolScale説明 */}
      <div className="p-3 bg-background rounded-lg text-sm space-y-2">
        <div className="flex items-center gap-2 font-medium">
          <Info className="w-4 h-4 text-primary" />
          Volatility Scalingとは
        </div>
        <p className="text-muted-foreground">
          目標ボラティリティに対して、現在の市場ボラティリティに基づいてポジションサイズを自動調整する手法です。
          ボラティリティが高い時はポジションを縮小し、低い時は拡大することで、リスク調整後リターンを改善します。
        </p>
        <p className="text-xs text-amber-500 mt-2">
          ※ 現在のボラティリティは過去の平均値を使用しています。実運用では市場環境に応じて調整してください。
          スケールファクターの上限は1.5倍（バックテスト整合）です。
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">平均ボラティリティ</div>
            <div className="font-mono font-bold">{calc.currentAvgVol}%</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">予想スケール</div>
            <div className="font-mono font-bold">{calc.expectedScaleFactor.toFixed(2)}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 市場環境表示
function MarketRegimeDisplay({ regime, regimeJapanese, allocation, onRefresh }: {
  regime: string;
  regimeJapanese: string;
  allocation: { aggressive: number; defensive: number };
  onRefresh: () => void;
}) {
  const isBull = regime === 'bull';
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
      isBull ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'
    }`}>
      <div className="flex items-center gap-3">
        <PieChart className={`w-5 h-5 ${isBull ? 'text-emerald-400' : 'text-red-400'}`} />
        <div>
          <div className="font-medium">{regimeJapanese}</div>
          <div className="text-sm text-muted-foreground">
            推奨配分: 攻撃型 {allocation.aggressive}% / 防御型 {allocation.defensive}%
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        再計算
      </Button>
    </div>
  );
}

// 注意事項
function Disclaimer({ isVolScale = false }: { isVolScale?: boolean }) {
  return (
    <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
      <p className="font-medium mb-2">注意事項:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>株価はリアルタイムではなく、直近の終値を使用しています</li>
        <li>購入株数は整数に切り捨てて計算しています</li>
        <li>実際の取引では、手数料・スプレッド・為替変動を考慮してください</li>
        {isVolScale ? (
          <>
            <li>スケールファクター &gt; 1.0 の場合、レバレッジ（信用取引）が必要です</li>
            <li>ボラティリティスケーリングは過去のデータに基づく推定であり、将来のパフォーマンスを保証するものではありません</li>
          </>
        ) : (
          <li>配分比率はリスク調整後（ボラティリティの逆数で重み付け）の値です</li>
        )}
      </ul>
    </div>
  );
}

// メインコンポーネント
export function PositionCalculator() {
  const calc = usePositionCalculator();

  return (
    <div className="space-y-6">
      {/* 入力セクション */}
      <InputSection calc={calc} />

      {/* ローディング */}
      {calc.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">株価を取得中...</p>
          </div>
        </div>
      )}

      {/* VolScale結果 */}
      {calc.volScaleEnabled && calc.volScalePositions && !calc.isCalculatingVolScale && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <MarketRegimeDisplay
            regime={calc.volScalePositions.regime}
            regimeJapanese={calc.volScalePositions.regimeJapanese}
            allocation={calc.volScalePositions.allocation}
            onRefresh={calc.handleRefresh}
          />

          <PortfolioResult
            result={calc.volScalePositions.portfolio}
            color="border-primary/30"
            icon={<Zap className="w-6 h-6 text-primary" />}
            volScaleInfo={calc.volScalePositions.portfolio.volScaleInfo}
          />

          <Disclaimer isVolScale />
        </motion.div>
      )}

      {/* 通常結果 */}
      {!calc.volScaleEnabled && calc.positions && !calc.isCalculating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <MarketRegimeDisplay
            regime={calc.positions.regime}
            regimeJapanese={calc.positions.regimeJapanese}
            allocation={calc.positions.allocation}
            onRefresh={calc.handleRefresh}
          />

          <Tabs defaultValue="d2" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="d2" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                D2 (S&P100)
              </TabsTrigger>
              <TabsTrigger value="d3" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                D3 (S&P500)
              </TabsTrigger>
              <TabsTrigger value="defensiveTop3" className="gap-2">
                <Shield className="w-4 h-4" />
                防御型TOP3
              </TabsTrigger>
              <TabsTrigger value="defensiveTop5" className="gap-2">
                <Shield className="w-4 h-4" />
                防御型TOP5
              </TabsTrigger>
            </TabsList>

            <TabsContent value="d2" className="mt-4">
              <PortfolioResult
                result={calc.positions.d2}
                color="border-cyan-500/30"
                icon={<TrendingUp className="w-6 h-6 text-cyan-400" />}
              />
            </TabsContent>

            <TabsContent value="d3" className="mt-4">
              <PortfolioResult
                result={calc.positions.d3}
                color="border-emerald-500/30"
                icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
              />
            </TabsContent>

            <TabsContent value="defensiveTop3" className="mt-4">
              <PortfolioResult
                result={calc.positions.defensiveTop3}
                color="border-amber-500/30"
                icon={<Shield className="w-6 h-6 text-amber-400" />}
              />
            </TabsContent>

            <TabsContent value="defensiveTop5" className="mt-4">
              <PortfolioResult
                result={calc.positions.defensiveTop5}
                color="border-orange-500/30"
                icon={<Shield className="w-6 h-6 text-orange-400" />}
              />
            </TabsContent>
          </Tabs>

          <Disclaimer />
        </motion.div>
      )}
    </div>
  );
}
