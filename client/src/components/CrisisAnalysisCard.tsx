/**
 * 金融危機時の詳細分析コンポーネント
 * 2008年金融危機と2020年コロナショック時の各戦略の挙動を分析
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingDown,
  Shield,
  Clock,
  BarChart3,
} from 'lucide-react';

interface CrisisData {
  period: string;
  name: string;
  description: string;
  spyDrawdown: number;
  d2: {
    maxDrawdown: number;
    recoveryMonths: number;
    periodReturn: number;
  };
  d3: {
    maxDrawdown: number;
    recoveryMonths: number;
    periodReturn: number;
  };
  defensive: {
    maxDrawdown: number;
    recoveryMonths: number;
    periodReturn: number;
  };
}

// 2008年金融危機と2020年コロナショックのデータ
const crisisData: CrisisData[] = [
  {
    period: '2008-09 ~ 2009-03',
    name: '2008年金融危機（リーマンショック）',
    description: 'リーマン・ブラザーズ破綻を契機とした世界的金融危機。S&P500は約57%下落。',
    spyDrawdown: -56.8,
    d2: {
      maxDrawdown: -50.5,
      recoveryMonths: 12,
      periodReturn: -40.1,
    },
    d3: {
      maxDrawdown: -69.8,
      recoveryMonths: 16,
      periodReturn: -60.5,
    },
    defensive: {
      maxDrawdown: -7.9,
      recoveryMonths: 4,
      periodReturn: 4.6,
    },
  },
  {
    period: '2020-02 ~ 2020-03',
    name: '2020年コロナショック',
    description: 'COVID-19パンデミックによる急激な市場下落。S&P500は約34%下落。',
    spyDrawdown: -33.9,
    d2: {
      maxDrawdown: -13.7,
      recoveryMonths: 4,
      periodReturn: -13.7,
    },
    d3: {
      maxDrawdown: -3.3,
      recoveryMonths: 2,
      periodReturn: -1.3,
    },
    defensive: {
      maxDrawdown: 0.0,
      recoveryMonths: 0,
      periodReturn: 5.5,
    },
  },
];

interface CrisisAnalysisCardProps {
  period?: '10year' | '20year';
}

export function CrisisAnalysisCard({ period = '20year' }: CrisisAnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedCrisis, setSelectedCrisis] = useState<number>(0);

  // 10年データの場合は2020年コロナショックのみ表示
  const availableCrises = period === '20year' ? crisisData : [crisisData[1]];

  if (period === '10year') {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            金融危機時の詳細分析
          </CardTitle>
          <CardDescription>
            20年データを選択すると、2008年金融危機と2020年コロナショックの詳細分析が表示されます
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const crisis = availableCrises[selectedCrisis];

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getDrawdownColor = (value: number) => {
    if (value > -20) return 'text-amber-400';
    if (value > -40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRecoveryColor = (months: number) => {
    if (months <= 6) return 'text-emerald-400';
    if (months <= 12) return 'text-amber-400';
    return 'text-red-400';
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
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  金融危機時の詳細分析
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                20年データ
              </Badge>
            </div>
            <CardDescription className="ml-7">
              2008年金融危機・2020年コロナショック時の各戦略の挙動を比較分析
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* 危機選択タブ */}
            <div className="flex gap-2">
              {availableCrises.map((c, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCrisis(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCrisis === index
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {c.name.split('（')[0]}
                </button>
              ))}
            </div>

            {/* 危機概要 */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-400 mb-1">{crisis.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{crisis.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">期間:</span>
                    <Badge variant="outline" className="font-mono">{crisis.period}</Badge>
                    <span className="text-muted-foreground">S&P500下落:</span>
                    <span className="text-red-400 font-bold">{formatPercent(crisis.spyDrawdown)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 戦略比較テーブル */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">戦略</TableHead>
                    <TableHead className="text-right font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingDown className="h-4 w-4" />
                        最大DD
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="h-4 w-4" />
                        回復期間
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <BarChart3 className="h-4 w-4" />
                        期間リターン
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <Shield className="h-4 w-4" />
                        DD軽減率
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* S&P500（ベンチマーク） */}
                  <TableRow className="bg-gray-500/5">
                    <TableCell className="font-medium text-muted-foreground">
                      S&P500（ベンチマーク）
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-400">
                      {formatPercent(crisis.spyDrawdown)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      -
                    </TableCell>
                  </TableRow>
                  
                  {/* D2戦略 */}
                  <TableRow>
                    <TableCell className="font-medium text-emerald-400">
                      D2（S&P100）
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getDrawdownColor(crisis.d2.maxDrawdown)}`}>
                      {formatPercent(crisis.d2.maxDrawdown)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getRecoveryColor(crisis.d2.recoveryMonths)}`}>
                      {crisis.d2.recoveryMonths}ヶ月
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-400">
                      {formatPercent(crisis.d2.periodReturn)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-400">
                      {((1 - crisis.d2.maxDrawdown / crisis.spyDrawdown) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                  
                  {/* D3戦略 */}
                  <TableRow>
                    <TableCell className="font-medium text-cyan-400">
                      D3（S&P500）
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getDrawdownColor(crisis.d3.maxDrawdown)}`}>
                      {formatPercent(crisis.d3.maxDrawdown)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getRecoveryColor(crisis.d3.recoveryMonths)}`}>
                      {crisis.d3.recoveryMonths}ヶ月
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-400">
                      {formatPercent(crisis.d3.periodReturn)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-400">
                      {((1 - crisis.d3.maxDrawdown / crisis.spyDrawdown) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                  
                  {/* 防御型 */}
                  <TableRow className="bg-blue-500/5">
                    <TableCell className="font-medium text-blue-400">
                      防御型（ETF）
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getDrawdownColor(crisis.defensive.maxDrawdown)}`}>
                      {formatPercent(crisis.defensive.maxDrawdown)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getRecoveryColor(crisis.defensive.recoveryMonths)}`}>
                      {crisis.defensive.recoveryMonths}ヶ月
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-400">
                      {formatPercent(crisis.defensive.periodReturn)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-400 font-bold">
                      {((1 - crisis.defensive.maxDrawdown / crisis.spyDrawdown) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* 重要な発見 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">防御型の優位性</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {((1 - crisis.defensive.maxDrawdown / crisis.spyDrawdown) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  S&P500比でDD軽減
                </p>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">回復期間短縮</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {crisis.d2.recoveryMonths - crisis.defensive.recoveryMonths}ヶ月
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  D2比で早期回復
                </p>
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">損失軽減額</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {(crisis.d2.periodReturn - crisis.defensive.periodReturn).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  D2比で損失軽減
                </p>
              </div>
            </div>

            {/* 教訓 */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-400 mb-2">教訓と推奨事項</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      防御型戦略は危機時に最大ドローダウンを大幅に軽減（{((1 - crisis.defensive.maxDrawdown / crisis.spyDrawdown) * 100).toFixed(0)}%軽減）
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      回復期間も短縮されるため、心理的負担も軽減
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      レジーム切り替え戦略（SPY vs MA200×0.95）により、危機前に防御型へ移行可能
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      ストップロス（-10%）との併用でさらなるリスク軽減が期待できる
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 注記 */}
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
              <p className="text-xs text-gray-500">
                ※ 上記データは20年バックテスト（2005-2025年）に基づくシミュレーション結果です。
                サバイバーシップバイアス軽減のため、22銘柄（リーマン・ブラザーズ、ベアスターンズ等）を除外しています。
                実際の運用成績を保証するものではありません。
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
