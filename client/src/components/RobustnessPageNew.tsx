/**
 * RobustnessPageNew - ロバスト性評価ページ（新版）
 * 
 * 15種類の統計検定をMECEに表示し、13戦略の分析をリスト化
 * 
 * 検定カテゴリ:
 * 1. 統計的有意性検定 (Test 10-12, 17): モンテカルロ、Cohen's d、Bonferroni、FDR
 * 2. リスク分析 (Test 3, 5, 6): テールリスク、ブートストラップ、DSR/PSR
 * 3. 過剰最適化検定 (Test 13-15): PBO、WFA、OOS
 * 4. 安定性検定 (Test 7, 16): サバイバーシップ、Regime Change
 * 5. 感度分析 (Test 1, 2, 4, 8, 9): コスト、レジーム、パラメータ、レバレッジ、リバランス
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp,
  BarChart3, Shield, Target, Activity, Zap, Award, TrendingUp, Scale
} from 'lucide-react';
import {
  integratedData,
  strategyDisplayNames,
  RobustnessTests,
  Test3TailRiskResult,
  Test5BootstrapResult,
  Test6DsrPsrResult,
  Test7SurvivorshipResult,
  Test10MonteCarloResult,
  Test11CohensDResult,
  Test12BonferroniResult,
  Test13PBOResult,
  Test14WFAResult,
  Test15OOSResult,
  Test16RegimeChangeResult,
  Test17FDRResult,
} from '@/data/integratedData';

// 全13戦略
const ALL_STRATEGIES = [
  'D2', 'D3', 'D2_VolScale', 'D3_VolScale',
  '防御型TOP3', '防御型TOP5', '防御型TOP3_VolScale', '防御型TOP5_VolScale',
  'D2+防御型', 'D3+防御型', 'D2+防御型_VolScale', 'D3+防御型_VolScale',
  'SPY'
];

// 検定カテゴリ定義
const TEST_CATEGORIES = {
  statistical: {
    name: '統計的有意性',
    icon: Target,
    description: 'モンテカルロ順列検定、Cohen\'s d効果量、Bonferroni補正、FDR補正',
    tests: ['test10_monte_carlo', 'test11_cohens_d', 'test12_bonferroni', 'test17_fdr']
  },
  risk: {
    name: 'リスク分析',
    icon: AlertTriangle,
    description: 'テールリスク、ブートストラップ、DSR/PSR',
    tests: ['test3_tail_risk', 'test5_bootstrap', 'test6_dsr_psr']
  },
  overfitting: {
    name: '過剰最適化',
    icon: Shield,
    description: 'PBO、Walk-Forward Analysis、Out-of-Sample検証',
    tests: ['test13_pbo', 'test14_wfa', 'test15_oos']
  },
  stability: {
    name: '安定性',
    icon: Scale,
    description: 'サバイバーシップバイアス補正、Regime Change検定',
    tests: ['test7_survivorship_adjusted', 'test16_regime_change']
  },
  sensitivity: {
    name: '感度分析',
    icon: Activity,
    description: 'コスト感度、レジーム別、パラメータ感度、レバレッジ、リバランス',
    tests: ['test1_cost_sensitivity', 'test2_regime_breakdown', 'test4_param_sensitivity', 'test8_leverage', 'test9_rebalance_sensitivity']
  }
};

// 検定名の日本語表示
const TEST_NAMES: { [key: string]: string } = {
  test1_cost_sensitivity: 'コスト感度分析',
  test2_regime_breakdown: 'レジーム別パフォーマンス',
  test3_tail_risk: 'テールリスク分析',
  test4_param_sensitivity: 'パラメータ感度分析',
  test5_bootstrap: 'ブートストラップ分析',
  test6_dsr_psr: 'DSR/PSR分析',
  test7_survivorship_adjusted: 'サバイバーシップ補正',
  test8_leverage: 'レバレッジ分析',
  test9_rebalance_sensitivity: 'リバランス感度分析',
  test10_monte_carlo: 'モンテカルロ順列検定',
  test11_cohens_d: 'Cohen\'s d効果量',
  test12_bonferroni: 'Bonferroni補正',
  test13_pbo: 'PBO（過剰最適化リスク）',
  test14_wfa: 'Walk-Forward Analysis',
  test15_oos: 'Out-of-Sample検証',
  test16_regime_change: 'Regime Change検定',
  test17_fdr: 'FDR補正'
};

// 検定の説明
const TEST_DESCRIPTIONS: { [key: string]: string } = {
  test10_monte_carlo: 'ランダムなリターン順列と比較して戦略の有意性を検定',
  test11_cohens_d: 'SPYとの平均リターン差の効果量を測定',
  test12_bonferroni: '多重比較補正後の統計的有意性',
  test17_fdr: 'False Discovery Rate補正後の有意性',
  test3_tail_risk: '極端な損失リスクの評価（CVaR、最悪期間）',
  test5_bootstrap: 'リサンプリングによるシャープレシオの信頼区間推定',
  test6_dsr_psr: 'Deflated Sharpe Ratio / Probabilistic Sharpe Ratio',
  test13_pbo: 'Probability of Backtest Overfitting',
  test14_wfa: 'ウォークフォワード分析による一貫性評価',
  test15_oos: 'アウトオブサンプル期間でのパフォーマンス検証',
  test7_survivorship_adjusted: '上場廃止銘柄を考慮した補正後パフォーマンス',
  test16_regime_change: '前半・後半期間でのパフォーマンス安定性',
  test1_cost_sensitivity: '取引コスト変化に対するパフォーマンス感度',
  test2_regime_breakdown: '市場環境別のパフォーマンス分解',
  test4_param_sensitivity: 'モメンタム期間・銘柄数変化への感度',
  test8_leverage: 'ボラティリティスケーリングによるレバレッジ分布',
  test9_rebalance_sensitivity: 'リバランスタイミングへの感度'
};

// 戦略のロバスト性スコアを計算
function calculateRobustnessScore(strategy: string, tests: RobustnessTests): { score: number; maxScore: number; details: { [key: string]: boolean } } {
  const details: { [key: string]: boolean } = {};
  let score = 0;
  const maxScore = 10;

  // Test 10: モンテカルロ (p < 0.05)
  const mc = tests.test10_monte_carlo?.[strategy];
  if (mc) {
    details['monte_carlo'] = mc.significant_005;
    if (mc.significant_005) score += 1;
  }

  // Test 11: Cohen's d (|d| >= 0.2)
  const cd = tests.test11_cohens_d?.[strategy];
  if (cd) {
    details['cohens_d'] = Math.abs(cd.value) >= 0.2;
    if (Math.abs(cd.value) >= 0.2) score += 1;
  }

  // Test 12: Bonferroni
  const bf = tests.test12_bonferroni?.[strategy];
  if (bf) {
    details['bonferroni'] = bf.significant;
    if (bf.significant) score += 1;
  }

  // Test 17: FDR
  const fdr = tests.test17_fdr?.[strategy];
  if (fdr) {
    details['fdr'] = fdr.fdr_significant;
    if (fdr.fdr_significant) score += 1;
  }

  // Test 5: Bootstrap (P(Sharpe > 1) >= 0.5)
  const bs = tests.test5_bootstrap?.[strategy];
  if (bs) {
    details['bootstrap'] = bs.prob_sharpe_gt_1 >= 0.5;
    if (bs.prob_sharpe_gt_1 >= 0.5) score += 1;
  }

  // Test 6: DSR/PSR (DSR >= 0.95)
  const dsr = tests.test6_dsr_psr?.[strategy];
  if (dsr) {
    details['dsr_psr'] = dsr.dsr >= 0.95;
    if (dsr.dsr >= 0.95) score += 1;
  }

  // Test 13: PBO (< 0.5)
  const pbo = tests.test13_pbo?.[strategy];
  if (pbo) {
    details['pbo'] = pbo.pbo < 0.5;
    if (pbo.pbo < 0.5) score += 1;
  }

  // Test 14: WFA (consistency >= 0.6)
  const wfa = tests.test14_wfa?.[strategy];
  if (wfa) {
    details['wfa'] = wfa.consistency >= 0.6;
    if (wfa.consistency >= 0.6) score += 1;
  }

  // Test 15: OOS (is_robust)
  const oos = tests.test15_oos?.[strategy];
  if (oos) {
    details['oos'] = oos.is_robust;
    if (oos.is_robust) score += 1;
  }

  // Test 16: Regime Change (not changed)
  const rc = tests.test16_regime_change?.[strategy];
  if (rc) {
    details['regime_change'] = !rc.regime_changed;
    if (!rc.regime_changed) score += 1;
  }

  return { score, maxScore, details };
}

// 統計的有意性セクション
function StatisticalSignificanceSection({ tests }: { tests: RobustnessTests }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          統計的有意性検定
        </CardTitle>
        <CardDescription>
          モンテカルロ順列検定、Cohen's d効果量、Bonferroni補正、FDR補正
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">戦略</th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">モンテカルロ</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>ランダム順列と比較したp値。p &lt; 0.05で有意</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">Cohen's d</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>効果量。|d| ≥ 0.8: 大、0.5-0.8: 中、0.2-0.5: 小</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">Bonferroni</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>多重比較補正後の有意性</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">FDR</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>False Discovery Rate補正後の有意性</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {ALL_STRATEGIES.map(strategy => {
                const mc = tests.test10_monte_carlo?.[strategy];
                const cd = tests.test11_cohens_d?.[strategy];
                const bf = tests.test12_bonferroni?.[strategy];
                const fdr = tests.test17_fdr?.[strategy];

                return (
                  <tr key={strategy} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{strategyDisplayNames[strategy] || strategy}</td>
                    <td className="text-center p-2">
                      {mc ? (
                        <Badge className={mc.significant_005 ? 'bg-green-500' : 'bg-red-500'}>
                          p={mc.p_value.toFixed(4)}
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {cd ? (
                        <Badge className={Math.abs(cd.value) >= 0.5 ? 'bg-green-500' : Math.abs(cd.value) >= 0.2 ? 'bg-yellow-500' : 'bg-red-500'}>
                          d={cd.value.toFixed(2)} ({cd.interpretation})
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {bf ? (
                        bf.significant ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {fdr ? (
                        fdr.fdr_significant ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            検定の詳細説明
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p><strong>モンテカルロ順列検定:</strong> リターン系列をランダムにシャッフルした10,000回のシミュレーションと比較。p &lt; 0.05で戦略が偶然以上のパフォーマンスを示すことを検証。</p>
            <p><strong>Cohen's d:</strong> SPYとの平均リターン差を標準偏差で正規化した効果量。|d| ≥ 0.8で大きな効果、0.5-0.8で中程度、0.2-0.5で小さな効果。</p>
            <p><strong>Bonferroni補正:</strong> 12戦略の多重比較を考慮し、α = 0.05/12 ≈ 0.0042で有意性を判定。</p>
            <p><strong>FDR補正:</strong> Benjamini-Hochberg法による偽発見率の制御。Bonferroniより検出力が高い。</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// リスク分析セクション
function RiskAnalysisSection({ tests }: { tests: RobustnessTests }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          リスク分析
        </CardTitle>
        <CardDescription>
          テールリスク、ブートストラップ、DSR/PSR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">戦略</th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">CVaR(5%)</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>最悪5%ケースの平均損失</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">最悪12ヶ月</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>12ヶ月ローリングの最悪リターン</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">P(Sharpe&gt;1)</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>ブートストラップでSharpe&gt;1となる確率</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">DSR</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Deflated Sharpe Ratio（試行回数補正後）</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {ALL_STRATEGIES.map(strategy => {
                const tail = tests.test3_tail_risk?.[strategy];
                const bs = tests.test5_bootstrap?.[strategy];
                const dsr = tests.test6_dsr_psr?.[strategy];

                return (
                  <tr key={strategy} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{strategyDisplayNames[strategy] || strategy}</td>
                    <td className="text-center p-2 text-red-500">
                      {tail ? `${(tail.cvar_5 * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="text-center p-2 text-red-500">
                      {tail ? `${(tail.worst_12m * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="text-center p-2">
                      {bs ? (
                        <Badge className={bs.prob_sharpe_gt_1 >= 0.5 ? 'bg-green-500' : 'bg-yellow-500'}>
                          {(bs.prob_sharpe_gt_1 * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {dsr ? (
                        <Badge className={dsr.dsr >= 0.95 ? 'bg-green-500' : 'bg-yellow-500'}>
                          {(dsr.dsr * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            検定の詳細説明
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p><strong>CVaR (Conditional Value at Risk):</strong> 最悪5%のシナリオにおける平均損失。VaRより保守的なリスク指標。</p>
            <p><strong>ブートストラップ:</strong> 1,000回のリサンプリングによりシャープレシオの分布を推定。P(Sharpe&gt;1)が高いほど安定。</p>
            <p><strong>DSR (Deflated Sharpe Ratio):</strong> 試行回数（バックテスト回数）を考慮して補正したシャープレシオ。過剰最適化を検出。</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// 過剰最適化検定セクション
function OverfittingSection({ tests }: { tests: RobustnessTests }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" />
          過剰最適化検定
        </CardTitle>
        <CardDescription>
          PBO、Walk-Forward Analysis、Out-of-Sample検証
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">戦略</th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">PBO</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Probability of Backtest Overfitting。&lt;50%が望ましい</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">WFA一貫性</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Walk-Forward期間でプラスリターンの割合</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">OOS Sharpe劣化</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Out-of-Sample期間でのSharpe低下率</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">OOS判定</th>
              </tr>
            </thead>
            <tbody>
              {ALL_STRATEGIES.map(strategy => {
                const pbo = tests.test13_pbo?.[strategy];
                const wfa = tests.test14_wfa?.[strategy];
                const oos = tests.test15_oos?.[strategy];

                return (
                  <tr key={strategy} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{strategyDisplayNames[strategy] || strategy}</td>
                    <td className="text-center p-2">
                      {pbo ? (
                        <Badge className={pbo.pbo < 0.5 ? 'bg-green-500' : 'bg-red-500'}>
                          {(pbo.pbo * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {wfa ? (
                        <Badge className={wfa.consistency >= 0.6 ? 'bg-green-500' : 'bg-yellow-500'}>
                          {(wfa.consistency * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {oos ? (
                        <span className={oos.sharpe_degradation > -0.5 ? 'text-green-500' : 'text-red-500'}>
                          {(oos.sharpe_degradation * 100).toFixed(0)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {oos ? (
                        oos.is_robust ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            検定の詳細説明
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p><strong>PBO (Probability of Backtest Overfitting):</strong> CSCV法による過剰最適化確率。50%以上は過剰フィッティングの可能性が高い。</p>
            <p><strong>WFA (Walk-Forward Analysis):</strong> 16期間のウォークフォワードテストでプラスリターンとなった割合。60%以上が望ましい。</p>
            <p><strong>OOS検証:</strong> 最後の52ヶ月をOut-of-Sample期間として検証。Sharpe劣化が-50%以内かつ統計的に有意でない場合にロバストと判定。</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// 安定性検定セクション
function StabilitySection({ tests }: { tests: RobustnessTests }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-500" />
          安定性検定
        </CardTitle>
        <CardDescription>
          サバイバーシップバイアス補正、Regime Change検定
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">戦略</th>
                <th className="text-center p-2">補正後CAGR</th>
                <th className="text-center p-2">補正後Sharpe</th>
                <th className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help border-b border-dotted">KS検定p値</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>前半・後半のリターン分布の差異検定。p &gt; 0.05で安定</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center p-2">安定性判定</th>
              </tr>
            </thead>
            <tbody>
              {ALL_STRATEGIES.map(strategy => {
                const surv = tests.test7_survivorship_adjusted?.[strategy];
                const rc = tests.test16_regime_change?.[strategy];

                return (
                  <tr key={strategy} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{strategyDisplayNames[strategy] || strategy}</td>
                    <td className="text-center p-2 text-green-500">
                      {surv ? `${(surv.cagr * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="text-center p-2">
                      {surv ? surv.sharpe.toFixed(2) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {rc ? (
                        <span className={rc.ks_p_value > 0.05 ? 'text-green-500' : 'text-red-500'}>
                          {rc.ks_p_value.toFixed(3)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-center p-2">
                      {rc ? (
                        !rc.regime_changed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            検定の詳細説明
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p><strong>サバイバーシップ補正:</strong> 上場廃止銘柄を考慮し、年率2%のペナルティを適用した保守的なパフォーマンス推定。</p>
            <p><strong>Regime Change検定:</strong> Kolmogorov-Smirnov検定により前半・後半期間のリターン分布を比較。p &gt; 0.05で分布が同一（安定）と判定。</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// 感度分析セクション
function SensitivitySection({ tests }: { tests: RobustnessTests }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          感度分析
        </CardTitle>
        <CardDescription>
          コスト感度、レバレッジ分布、リバランスタイミング
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* レバレッジ分析（VolScale戦略のみ） */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">レバレッジ分布（VolScale戦略）</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">戦略</th>
                  <th className="text-center p-2">平均スケール</th>
                  <th className="text-center p-2">最大スケール</th>
                  <th className="text-center p-2">レバレッジ&gt;1の割合</th>
                </tr>
              </thead>
              <tbody>
                {ALL_STRATEGIES.filter(s => s.includes('VolScale')).map(strategy => {
                  const lev = tests.test8_leverage?.[strategy];
                  return (
                    <tr key={strategy} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{strategyDisplayNames[strategy] || strategy}</td>
                      <td className="text-center p-2">{lev ? lev.mean_scale.toFixed(2) : '-'}</td>
                      <td className="text-center p-2">{lev ? lev.max_scale.toFixed(2) : '-'}</td>
                      <td className="text-center p-2">
                        {lev ? (
                          <Badge className={lev.lev_gt_1_ratio < 0.5 ? 'bg-green-500' : 'bg-yellow-500'}>
                            {(lev.lev_gt_1_ratio * 100).toFixed(0)}%
                          </Badge>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            検定の詳細説明
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p><strong>レバレッジ分析:</strong> ボラティリティスケーリングによるポジションサイズの分布。最大1.5倍に制限。</p>
            <p><strong>コスト感度:</strong> 取引コスト0%〜0.5%での各戦略のパフォーマンス変化。</p>
            <p><strong>リバランス感度:</strong> 月初・月末・オフセット日でのパフォーマンス差異。</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// 戦略別総合評価セクション
function StrategyEvaluationSection({ tests }: { tests: RobustnessTests }) {
  const evaluations = useMemo(() => {
    return ALL_STRATEGIES.map(strategy => {
      const { score, maxScore, details } = calculateRobustnessScore(strategy, tests);
      return { strategy, score, maxScore, details };
    }).sort((a, b) => b.score - a.score);
  }, [tests]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          戦略別ロバスト性スコア
        </CardTitle>
        <CardDescription>
          10項目の統計検定に基づく総合評価（スコア順）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">順位</th>
                <th className="text-left p-2">戦略</th>
                <th className="text-center p-2">スコア</th>
                <th className="text-center p-2">MC</th>
                <th className="text-center p-2">d</th>
                <th className="text-center p-2">Bon</th>
                <th className="text-center p-2">FDR</th>
                <th className="text-center p-2">BS</th>
                <th className="text-center p-2">DSR</th>
                <th className="text-center p-2">PBO</th>
                <th className="text-center p-2">WFA</th>
                <th className="text-center p-2">OOS</th>
                <th className="text-center p-2">RC</th>
                <th className="text-center p-2">評価</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((eval_, idx) => (
                <tr key={eval_.strategy} className="border-b hover:bg-muted/50">
                  <td className="p-2 text-muted-foreground">{idx + 1}</td>
                  <td className="p-2 font-medium">{strategyDisplayNames[eval_.strategy] || eval_.strategy}</td>
                  <td className="text-center p-2">
                    <span className="font-bold text-lg">{eval_.score}/{eval_.maxScore}</span>
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.monte_carlo ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.cohens_d ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.bonferroni ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.fdr ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.bootstrap ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.dsr_psr ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.pbo ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.wfa ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.oos ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.details.regime_change ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="text-center p-2">
                    {eval_.score >= 8 ? (
                      <Badge className="bg-green-500">優良</Badge>
                    ) : eval_.score >= 6 ? (
                      <Badge className="bg-blue-500">良好</Badge>
                    ) : eval_.score >= 4 ? (
                      <Badge variant="secondary">普通</Badge>
                    ) : (
                      <Badge variant="outline">要注意</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 凡例 */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">評価項目の略称</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div><strong>MC:</strong> モンテカルロ</div>
            <div><strong>d:</strong> Cohen's d</div>
            <div><strong>Bon:</strong> Bonferroni</div>
            <div><strong>FDR:</strong> FDR補正</div>
            <div><strong>BS:</strong> ブートストラップ</div>
            <div><strong>DSR:</strong> Deflated SR</div>
            <div><strong>PBO:</strong> 過剰最適化</div>
            <div><strong>WFA:</strong> Walk-Forward</div>
            <div><strong>OOS:</strong> Out-of-Sample</div>
            <div><strong>RC:</strong> Regime Change</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// メインコンポーネント
export default function RobustnessPageNew() {
  const [activeTab, setActiveTab] = useState('overview');
  const tests = integratedData.robustness_tests as RobustnessTests;

  if (!tests) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground">ロバスト性テストデータが見つかりません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            ロバスト性評価ダッシュボード
          </CardTitle>
          <CardDescription>
            15種類の統計検定による13戦略の包括的評価。検定はMECEに5カテゴリに分類。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(TEST_CATEGORIES).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <div key={key} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{cat.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.tests.length}テスト</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">総合評価</TabsTrigger>
          <TabsTrigger value="statistical">統計的有意性</TabsTrigger>
          <TabsTrigger value="risk">リスク分析</TabsTrigger>
          <TabsTrigger value="overfitting">過剰最適化</TabsTrigger>
          <TabsTrigger value="stability">安定性</TabsTrigger>
          <TabsTrigger value="sensitivity">感度分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StrategyEvaluationSection tests={tests} />
        </TabsContent>

        <TabsContent value="statistical" className="space-y-6">
          <StatisticalSignificanceSection tests={tests} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskAnalysisSection tests={tests} />
        </TabsContent>

        <TabsContent value="overfitting" className="space-y-6">
          <OverfittingSection tests={tests} />
        </TabsContent>

        <TabsContent value="stability" className="space-y-6">
          <StabilitySection tests={tests} />
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          <SensitivitySection tests={tests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
