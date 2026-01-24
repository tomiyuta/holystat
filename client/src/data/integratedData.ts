/**
 * 統合シミュレーションデータ
 * データソース: integrated_web_data.json (holygrail_results_v4.json + comprehensive_web_data.json)
 * 生成日: 2026-01-23
 * 
 * 対象戦略（13戦略）:
 * - 攻撃型: D2, D3, D2_VolScale, D3_VolScale
 * - 防御型: 防御型TOP3, 防御型TOP5, 防御型TOP3_VolScale, 防御型TOP5_VolScale
 * - 統合型: D2+防御型, D3+防御型, D2+防御型_VolScale, D3+防御型_VolScale
 * - ベンチマーク: SPY
 */

import integratedWebData from './integrated_web_data.json';

// 型定義
export interface StrategyMetrics {
  cumulative: number;
  cagr: number;
  volatility: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

export interface YearlyReturns {
  [year: string]: number;
}

export interface MonthlyReturn {
  date: string;
  return: number;
  scale: number;
  regime: string;
}

export interface RegimePerformance {
  cagr: number;
  max_dd: number;
  cumulative: number;
  n_months: number;
}

export interface CostSensitivity {
  [cost: string]: {
    cagr: number;
    max_dd: number;
    sharpe: number;
  };
}

export interface BootstrapResult {
  sharpe_mean: number;
  sharpe_std: number;
  sharpe_95ci: number[];
  sharpe_above_1_pct: number;
  max_dd_mean: number;
  max_dd_95ci: number[];
}

export interface DsrPsrResult {
  sharpe: number;
  skewness: number;
  kurtosis: number;
  psr: number;
  dsr: number;
  n_trials: number;
}

export interface TailRiskResult {
  var_5: number;
  cvar_5: number;
  worst_12m: number;
  worst_3m?: number;
  max_dd_duration_months: number;
  avg_dd_duration_months: number;
}

export interface LeverageResult {
  leverage_above_1_pct: number;
  avg_scale: number;
  max_scale: number;
  min_scale: number;
}

export interface RobustnessData {
  cost_sensitivity: CostSensitivity;
  bootstrap: BootstrapResult;
  dsr_psr: DsrPsrResult;
  tail_risk: TailRiskResult;
  leverage: LeverageResult;
}

// 新しい型定義（追加テスト用）
export interface ParamSensitivityMetrics {
  cumulative: number;
  cagr: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

export interface ParamSensitivityData {
  metadata?: {
    generated_at: string;
    momentum_periods: string[];
    top_n_values: number[];
    total_patterns: number;
    strategies: string[];
  };
  results: {
    [param: string]: {
      [strategy: string]: ParamSensitivityMetrics;
    };
  };
}

// ストップロス感度分析の型定義
export interface StoplossSensitivityMetrics {
  cumulative: number;
  cagr: number;
  volatility: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  stoploss_trigger_count: number;
  stoploss_trigger_rate: number;
}

export interface StoplossSensitivityData {
  metadata?: {
    generated_at: string;
    stoploss_thresholds: string[];
    strategies: string[];
  };
  results: {
    [threshold: string]: {
      [strategy: string]: StoplossSensitivityMetrics;
    };
  };
}

export interface SurvivorshipAdjustedData {
  [strategy: string]: {
    cumulative: number;
    cagr: number;
    max_dd: number;
    sharpe: number;
    sortino: number;
    calmar: number;
  };
}

export interface RebalanceSensitivityData {
  [timing: string]: {
    [strategy: string]: {
      cumulative: number;
      cagr: number;
      max_dd: number;
      sharpe: number;
    };
  };
}

export interface RebalanceDetailData {
  offset_results: {
    [offset: string]: {
      sharpe: number;
      cagr?: number;
      max_dd?: number;
      spy_sharpe?: number;
    };
  };
  monthly_comparison: {
    n_months: number;
    end_better_months: number;
    start_better_months: number;
    avg_diff_monthly: number;
    cumulative_diff: number;
  };
  factor_decomposition: {
    market_effect_annual: number;
    strategy_effect_annual: number;
    total_effect_annual: number;
  };
  correlation_with_spy: number;
}

// リバランスタイミング追加検証結果
export interface RebalanceDeepAnalysis {
  title?: string;
  description?: string;
  key_findings?: string[];
  sections?: {
    lookahead_bias?: {
      title?: string;
      explanation?: string;
      conclusion?: string;
      details?: Record<string, unknown>;
    };
    slippage_sensitivity?: {
      title?: string;
      conclusion?: string;
      details?: Record<string, unknown> | Array<{
        slippage_bp: number;
        cagr: number;
        max_dd: number;
        sharpe: number;
      }>;
      recommendation?: string;
    };
    gap_return_analysis?: {
      title?: string;
      conclusion?: string;
      details?: {
        gap_mean_monthly?: number;
        gap_contribution_ratio?: number;
        gap_positive_ratio?: number;
        gap_contribution_pct?: number;
        positive_months?: number;
        negative_months?: number;
        positive_pct?: number;
      };
      explanation?: string;
    };
    strict_comparison?: {
      title?: string;
      conclusion?: string;
      details?: {
        strict_month_start?: { cagr: number; max_dd?: number; sharpe?: number; sortino?: number; calmar?: number };
        month_end_minus5?: { cagr: number; max_dd?: number; sharpe?: number; sortino?: number; calmar?: number };
        cagr_diff_pct?: number;
        strict_start?: { cagr: number; sharpe?: number };
        early_end?: { cagr: number; sharpe?: number };
        difference?: { cagr_diff: number };
      };
      explanation?: string;
    };
  };
  recommendations?: string[];
}

// 月中エントリー検証結果
export interface MidMonthEntryAnalysis {
  analysis_type: string;
  purpose: string;
  methodology: {
    description: string;
    months_analyzed: number;
    start_month: string;
    end_month: string;
  };
  entry_day_statistics: {
    [key: string]: {
      mean_monthly_return: number;
      std_monthly_return: number;
      cumulative_return: number;
      annualized_sharpe: number;
    };
  };
  pairwise_comparisons: Array<{
    pair: string;
    mean_diff_pct_pt: number;
    t_statistic: number;
    p_value: number;
    significant_at_5pct: boolean;
  }>;
  correlation_analysis: {
    average_correlation: number;
    interpretation: string;
  };
  conclusion: {
    best_entry_day: string;
    worst_entry_day: string;
    monthly_return_diff_pct_pt: number;
    annualized_diff_pct_pt: number;
    significant_pairs_count: number;
    total_pairs_count: number;
    summary: string;
    recommendation: string;
    timing_impact: string;
  };
  key_findings: string[];
}

// 15種類の統計検定結果の型定義

// Test 1: コスト感度分析
export interface Test1CostSensitivityResult {
  [cost: string]: {
    cagr: number;
    max_dd: number;
    sharpe: number;
  };
}

// Test 2: レジーム別パフォーマンス
// 実際のデータ構造: { [regime]: { [strategy]: metrics } }
export interface Test2RegimeBreakdownMetrics {
  cumulative: number;
  cagr: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

export interface Test2RegimeBreakdownResult {
  [strategy: string]: Test2RegimeBreakdownMetrics;
}

// Test 3: テールリスク分析
export interface Test3TailRiskResult {
  cvar_5: number;
  worst_12m: number;
  worst_3m?: number;
  avg_dd_duration: number;
  max_dd_duration: number;
  max_losing_streak: number;
}

// Test 4: パラメータ感度分析
export interface Test4ParamSensitivityResult {
  [param: string]: {
    cumulative: number;
    cagr: number;
    max_dd: number;
    sharpe: number;
    sortino: number;
    calmar: number;
  };
}

// Test 5: ブートストラップ分析
export interface Test5BootstrapResult {
  sharpe_mean: number;
  sharpe_std: number;
  sharpe_ci_lower: number;
  sharpe_ci_upper: number;
  max_dd_mean: number;
  max_dd_ci_lower: number;
  max_dd_ci_upper: number;
  prob_sharpe_gt_1: number;
}

// Test 6: DSR/PSR分析
export interface Test6DsrPsrResult {
  psr: number;
  dsr: number;
}

// Test 7: サバイバーシップ補正
export interface Test7SurvivorshipResult {
  cumulative: number;
  cagr: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

// Test 8: レバレッジ分析
export interface Test8LeverageResult {
  mean_scale: number;
  max_scale: number;
  lev_gt_1_ratio: number;
}

// Test 9: リバランス感度分析
export interface Test9RebalanceSensitivityMetrics {
  cumulative: number;
  cagr: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

export interface Test9RebalanceSensitivityResult {
  [strategy: string]: Test9RebalanceSensitivityMetrics;
}

// Test 10: モンテカルロ順列検定
export interface Test10MonteCarloResult {
  observed_mean: number;
  p_value: number;
  significant_005: boolean;
  significant_001: boolean;
}

// Test 11: Cohen's d効果量
export interface Test11CohensDResult {
  value: number;
  interpretation: string;
}

// Test 12: Bonferroni補正
export interface Test12BonferroniResult {
  p_value: number;
  bonferroni_alpha: number;
  significant: boolean;
}

// Test 13: PBO（過剰最適化リスク）
export interface Test13PBOResult {
  n_combinations: number;
  pbo: number;
  rank_correlation: number;
  median_test_sharpe: number;
}

// Test 14: WFA（Walk-Forward Analysis）
export interface Test14WFAResult {
  n_periods: number;
  avg_degradation: number;
  consistency: number;
}

// Test 15: OOS検証（Out-of-Sample）
export interface Test15OOSResult {
  train_months: number;
  test_months: number;
  train_sharpe: number;
  test_sharpe: number;
  sharpe_degradation: number;
  train_cagr: number;
  test_cagr: number;
  cagr_degradation: number;
  test_p_value: number;
  test_significant: boolean;
  is_robust: boolean;
}

// Test 16: Regime Change検定
export interface Test16RegimeChangeResult {
  ks_statistic: number;
  ks_p_value: number;
  regime_changed: boolean;
  first_half_mean: number;
  second_half_mean: number;
  mean_change_std: number;
  first_half_vol: number;
  second_half_vol: number;
  vol_change_pct: number;
}

// Test 17: FDR補正
export interface Test17FDRResult {
  original_p: number;
  adjusted_p: number;
  fdr_significant: boolean;
  bonferroni_significant: boolean;
}

// robustness_testsの型定義
export interface RobustnessTests {
  test1_cost_sensitivity?: { [strategy: string]: Test1CostSensitivityResult };
  test2_regime_breakdown?: { [strategy: string]: Test2RegimeBreakdownResult };
  test3_tail_risk?: { [strategy: string]: Test3TailRiskResult };
  test4_param_sensitivity?: { [strategy: string]: Test4ParamSensitivityResult };
  test5_bootstrap?: { [strategy: string]: Test5BootstrapResult };
  test6_dsr_psr?: { [strategy: string]: Test6DsrPsrResult };
  test7_survivorship_adjusted?: { [strategy: string]: Test7SurvivorshipResult };
  test8_leverage?: { [strategy: string]: Test8LeverageResult };
  test9_rebalance_sensitivity?: { [strategy: string]: Test9RebalanceSensitivityResult };
  test10_monte_carlo?: { [strategy: string]: Test10MonteCarloResult };
  test11_cohens_d?: { [strategy: string]: Test11CohensDResult };
  test12_bonferroni?: { [strategy: string]: Test12BonferroniResult };
  test13_pbo?: { [strategy: string]: Test13PBOResult };
  test14_wfa?: { [strategy: string]: Test14WFAResult };
  test15_oos?: { [strategy: string]: Test15OOSResult };
  test16_regime_change?: { [strategy: string]: Test16RegimeChangeResult };
  test17_fdr?: { [strategy: string]: Test17FDRResult };
  rebalance_deep_analysis?: RebalanceDeepAnalysis;
  mid_month_entry_analysis?: MidMonthEntryAnalysis;
}

// 総合評価結果
export interface MonteCarloResult {
  p_value: number;
  significant: boolean;
}

export interface CohensDResult {
  value: number;
  interpretation: string;
}

export interface BonferroniResult {
  p_value: number;
  bonferroni_alpha?: number;
  significant: boolean;
}

export interface PBOResult {
  pbo: number;
  risk: string;
}

export interface WFAResult {
  consistency: number;
  avg_degradation: number;
}

export interface StrategyEvaluationNew {
  monte_carlo: MonteCarloResult;
  cohens_d: CohensDResult;
  bonferroni: BonferroniResult;
  pbo: PBOResult;
  wfa: WFAResult;
  score: number;
  max_score: number;
}

// 後方互換性のための旧型定義
export interface StrategyEvaluation {
  name: string;
  basic_stats: Record<string, unknown>;
  monte_carlo: Record<string, unknown>;
  cohens_d: Record<string, unknown>;
  bonferroni: Record<string, unknown>;
  pbo: Record<string, unknown>;
  walk_forward: Record<string, unknown>;
  monte_carlo_pass: boolean;
  cohens_d_pass: boolean;
  cohens_d_interpretation: string;
  bonferroni_pass: boolean;
  cscv_pass: boolean;
  wfa_pass: boolean;
  score: number;
  total: number;
}

// 新しい総合評価型定義
export interface ComprehensiveEvaluation {
  [strategy: string]: StrategyEvaluationNew;
}

export interface IntegratedData {
  metadata: {
    generated_at: string;
    version?: string;
    source?: string;
    simulation_period?: string;
    trading_cost?: number;
    survivorship_bias_correction?: number;
    strategies?: string[];
    parameters?: {
      momentum_period: number;
      vol_short_period: number;
      vol_long_period: number;
      transaction_cost: number;
      target_vols: { [key: string]: number };
      regime_periods: { [key: string]: string[] };
    };
    data_sources?: {
      summary: string;
      yearly_returns: string;
      monthly_returns: string;
      regime_performance: string;
      robustness: string;
      param_sensitivity?: string;
      survivorship_adjusted?: string;
      rebalance_sensitivity?: string;
      rebalance_detail?: string;
    };
  };
  summary: { [strategy: string]: StrategyMetrics };
  yearly_returns: { [strategy: string]: YearlyReturns };
  monthly_returns?: { [strategy: string]: MonthlyReturn[] };
  regime_performance?: { [strategy: string]: { [regime: string]: RegimePerformance } };
  robustness?: { [strategy: string]: RobustnessData };
  // 新しいデータフィールド
  param_sensitivity?: ParamSensitivityData;
  survivorship_adjusted?: SurvivorshipAdjustedData;
  rebalance_sensitivity?: RebalanceSensitivityData;
  rebalance_detail?: RebalanceDetailData;
  rebalance_deep_analysis?: RebalanceDeepAnalysis;
  mid_month_entry_analysis?: MidMonthEntryAnalysis;
  robustness_tests?: RobustnessTests;
  comprehensive_evaluation?: ComprehensiveEvaluation;
  stoploss_sensitivity?: StoplossSensitivityData;
}

// データエクスポート
export const integratedData = integratedWebData as IntegratedData;

// 戦略カテゴリ定義
export const strategyCategories = {
  attack: ['D2', 'D3'],
  attackVolScale: ['D2_VolScale', 'D3_VolScale'],
  defense: ['防御型TOP3', '防御型TOP5'],
  defenseVolScale: ['防御型TOP3_VolScale', '防御型TOP5_VolScale'],
  integrated: ['D2+防御型', 'D3+防御型'],
  integratedVolScale: ['D2+防御型_VolScale', 'D3+防御型_VolScale'],
  benchmark: ['SPY'],
};

// 戦略表示名
export const strategyDisplayNames: { [key: string]: string } = {
  'D2': 'D2（S&P100）',
  'D3': 'D3（S&P500）',
  '防御型TOP3': '防御型TOP3',
  '防御型TOP5': '防御型TOP5',
  'D2+防御型': 'D2+防御型',
  'D3+防御型': 'D3+防御型',
  'D2_VolScale': 'D2 + VolScale',
  'D3_VolScale': 'D3 + VolScale',
  '防御型TOP3_VolScale': '防御型TOP3 + VolScale',
  '防御型TOP5_VolScale': '防御型TOP5 + VolScale',
  'D2+防御型_VolScale': 'D2+防御型 + VolScale',
  'D3+防御型_VolScale': 'D3+防御型 + VolScale',
  'SPY': 'SPY（ベンチマーク）',
};

// 戦略説明
export const strategyDescriptions: { [key: string]: string } = {
  'D2': 'S&P100からモメンタム上位5銘柄を選定',
  'D3': 'S&P500からモメンタム上位5銘柄を選定',
  '防御型TOP3': '13種ETFから低ボラティリティ上位3銘柄を選定',
  '防御型TOP5': '13種ETFから低ボラティリティ上位5銘柄を選定',
  'D2+防御型': 'D2とレジーム切替（Bear時は防御型TOP3）',
  'D3+防御型': 'D3とレジーム切替（Bear時は防御型TOP3）',
  'D2_VolScale': 'D2 + Volatility Scaling（目標Vol 19%）',
  'D3_VolScale': 'D3 + Volatility Scaling（目標Vol 19%）',
  '防御型TOP3_VolScale': '防御型TOP3 + Volatility Scaling（目標Vol 8%）',
  '防御型TOP5_VolScale': '防御型TOP5 + Volatility Scaling（目標Vol 8%）',
  'D2+防御型_VolScale': 'D2+防御型 + Volatility Scaling（目標Vol 11%）',
  'D3+防御型_VolScale': 'D3+防御型 + Volatility Scaling（目標Vol 14%）',
  'SPY': 'S&P500 ETF（ベンチマーク）',
};

// 目標ボラティリティ
export const targetVolatilities: { [key: string]: number } = {
  'D2_VolScale': 0.19,
  'D3_VolScale': 0.19,
  '防御型TOP3_VolScale': 0.08,
  '防御型TOP5_VolScale': 0.08,
  'D2+防御型_VolScale': 0.11,
  'D3+防御型_VolScale': 0.14,
};

// レジーム期間
export const regimePeriods = {
  'GFC (2007-2009)': { start: '2007-10', end: '2009-03', description: '金融危機' },
  '低金利期 (2010-2019)': { start: '2010-01', end: '2019-12', description: '量的緩和期' },
  'コロナ (2020)': { start: '2020-01', end: '2020-12', description: 'パンデミック' },
  'インフレ期 (2021-2022)': { start: '2021-01', end: '2022-12', description: '金利上昇' },
  '直近 (2023-2025)': { start: '2023-01', end: '2025-12', description: '現在' },
};

// ユーティリティ関数
export function getStrategyMetrics(strategyId: string): StrategyMetrics | undefined {
  return integratedData.summary[strategyId];
}

export function getYearlyReturns(strategyId: string): YearlyReturns | undefined {
  return integratedData.yearly_returns[strategyId];
}

export function getMonthlyReturns(strategyId: string): MonthlyReturn[] | undefined {
  return integratedData.monthly_returns?.[strategyId];
}

export function getRegimePerformance(strategyId: string): { [regime: string]: RegimePerformance } | undefined {
  return integratedData.regime_performance?.[strategyId];
}

export function getRobustnessData(strategyId: string): RobustnessData | undefined {
  return integratedData.robustness?.[strategyId];
}

// 新しいデータアクセス関数
export function getParamSensitivityData(): ParamSensitivityData | undefined {
  return integratedData.param_sensitivity;
}

export function getSurvivorshipAdjustedData(): SurvivorshipAdjustedData | undefined {
  return integratedData.survivorship_adjusted;
}

export function getRebalanceSensitivityData(): RebalanceSensitivityData | undefined {
  return integratedData.rebalance_sensitivity;
}

export function getRebalanceDetailData(): RebalanceDetailData | undefined {
  return integratedData.rebalance_detail;
}

// 累積リターン計算
export function calculateCumulativeReturns(strategies: string[]): Array<{ year: number; [key: string]: number }> {
  const allYears = new Set<number>();
  strategies.forEach(s => {
    const yearly = integratedData.yearly_returns[s];
    if (yearly) {
      Object.keys(yearly).forEach(y => allYears.add(parseInt(y)));
    }
  });
  
  const years = Array.from(allYears).sort((a, b) => a - b);
  const cumulative: { [key: string]: number } = {};
  strategies.forEach(s => cumulative[s] = 100);
  
  const data: Array<{ year: number; [key: string]: number }> = [];
  
  years.forEach(year => {
    const point: { year: number; [key: string]: number } = { year };
    strategies.forEach(strategy => {
      const yearlyReturn = integratedData.yearly_returns[strategy]?.[year.toString()] || 0;
      cumulative[strategy] = cumulative[strategy] * (1 + yearlyReturn);
      point[strategy] = Math.round(cumulative[strategy]);
    });
    data.push(point);
  });
  
  return data;
}

// 指標の説明
export const metricDescriptions = {
  cagr: '年平均成長率（Compound Annual Growth Rate）。複利ベースの年間平均リターン。',
  max_dd: '最大ドローダウン。ピークから谷底までの最大下落率。リスク指標として重要。',
  sharpe: 'シャープレシオ。リスク調整後リターン。1以上で良好、1.5以上で優秀。',
  sortino: 'ソルティノレシオ。下落リスクのみを考慮したリスク調整後リターン。',
  calmar: 'カルマーレシオ。CAGR÷最大ドローダウン。リターン/リスクの効率性。',
  volatility: '年率ボラティリティ。リターンの標準偏差を年率換算。',
};

// ロバスト性テストの説明
export const robustnessTestDescriptions: Record<string, { name: string; description: string }> = {
  cost_sensitivity: { name: '取引コスト感度分析', description: '異なるコスト水準（0.1%〜1.0%）でのパフォーマンス変化を検証' },
  bootstrap: { name: 'ブートストラップ', description: '500回のリサンプリングでSharpe比の信頼区間を推定' },
  dsr_psr: { name: 'DSR/PSR検定', description: '多重検定を考慮した統計的有意性の検証' },
  tail_risk: { name: 'テールリスク分析', description: 'CVaR(5%)、最悪12ヶ月リターン、DD滞在期間を評価' },
  leverage: { name: 'レバレッジ分析', description: 'VolScaleによるレバレッジ使用頻度と平均スケールを評価' },
  param_sensitivity: { name: 'パラメータ感度分析', description: 'モメンタム期間（3/6/12ヶ月）と銘柄数（3/5/10）の組み合わせでパフォーマンス変化を検証' },
  survivorship_adjusted: { name: '生存者バイアス調整', description: '上場廃止銘柄を考慮した保守的なパフォーマンス推定' },
  rebalance_sensitivity: { name: 'リバランスタイミング感度', description: '月初/月中/月末のリバランスタイミングによるパフォーマンス差を検証' },
  rebalance_detail: { name: 'リバランス詳細分析', description: 'オフセット別結果、月次比較、ファクター分解を含む詳細分析' },
};

// パラメータ感度分析のパラメータ名表示
export const paramSensitivityLabels: { [key: string]: string } = {
  // 旧形式（後方互換性）
  'mom3m_top3': 'モメンタム3ヶ月・TOP3',
  'mom3m_top5': 'モメンタム3ヶ月・TOP5',
  'mom3m_top10': 'モメンタム3ヶ月・TOP10',
  'mom6m_top3': 'モメンタム6ヶ月・TOP3',
  'mom6m_top5': 'モメンタム6ヶ月・TOP5（基準）',
  'mom6m_top10': 'モメンタム6ヶ月・TOP10',
  'mom12m_top3': 'モメンタム12ヶ月・TOP3',
  'mom12m_top5': 'モメンタム12ヶ月・TOP5',
  'mom12m_top10': 'モメンタム12ヶ月・TOP10',
  // 新形式（日本語キー）
  'モメンタム3m_TOP3': 'モメンタム3ヶ月・TOP3',
  'モメンタム3m_TOP5': 'モメンタム3ヶ月・TOP5',
  'モメンタム3m_TOP10': 'モメンタム3ヶ月・TOP10',
  'モメンタム6m_TOP3': 'モメンタム6ヶ月・TOP3',
  'モメンタム6m_TOP5': 'モメンタム6ヶ月・TOP5（基準）',
  'モメンタム6m_TOP10': 'モメンタム6ヶ月・TOP10',
  'モメンタム12m_TOP3': 'モメンタム12ヶ月・TOP3',
  'モメンタム12m_TOP5': 'モメンタム12ヶ月・TOP5',
  'モメンタム12m_TOP10': 'モメンタム12ヶ月・TOP10',
};

// リバランスタイミングの表示名
export const rebalanceTimingLabels: { [key: string]: string } = {
  '月初': '月初（営業日1日目）',
  '月中（+5日）': '月中（営業日+5日）',
  '月末（-5日）': '月末（営業日-5日）',
};


// スケーリングアイデアの型定義
export interface ScalingIdeaResult {
  cagr: number;
  max_dd: number;
  sharpe: number;
  sortino: number;
}

export interface ScalingIdea {
  name: string;
  category: string;
  description: string;
  status: 'implemented' | 'implemented_in_baseline' | 'tested' | 'estimated';
  source?: string;
  source_file?: string;
  parameters: Record<string, unknown>;
  result?: ScalingIdeaResult | Record<string, unknown>;
  improvement_vs_baseline?: Record<string, string>;
  notes?: string | string[];
}

export interface ScalingIdeasData {
  metadata: {
    generated_at: string;
    version: string;
    description: string;
    baseline_strategy: string;
    baseline_source: string;
  };
  baseline: ScalingIdeaResult;
  ideas: Record<string, ScalingIdea>;
  combined_ideas: {
    name: string;
    description: string;
    result: ScalingIdeaResult & { calmar: number };
    improvement_vs_baseline: Record<string, string>;
    notes: string[];
  };
  real_data_validation?: {
    description: string;
    data_period: string;
    strategies: Record<string, unknown>;
    summary: Record<string, string>;
  };
  robustness_tests?: {
    取引コスト感度?: Record<string, unknown>;
    レジーム別分解?: Record<string, unknown>;
    テールリスク?: Record<string, unknown>;
    ブートストラップ?: Record<string, unknown>;
    DSR_PSR?: Record<string, unknown>;
  };
  regime_analysis?: Record<string, unknown>;
  param_sensitivity?: Record<string, unknown>;
  interaction_effects?: Record<string, unknown>;
  summary_table: {
    headers: string[];
    rows: string[][];
  };
  recommendations: {
    immediate_implementation: { ideas: string[]; reason: string };
    short_term_implementation: { ideas: string[]; reason: string };
    validation_required: string[];
    cautions: string[];
  };
}

// スケーリングアイデアデータの取得
export function getScalingIdeasData(): ScalingIdeasData | undefined {
  return (integratedData as unknown as { scaling_ideas?: ScalingIdeasData }).scaling_ideas;
}

// スケーリングアイデアの表示名
export const scalingIdeaDisplayNames: Record<string, string> = {
  idea1: '1. ターゲットVolスケーリング',
  idea2: '2. リスク調整モメンタム',
  idea3: '3. ボラティリティレジーム',
  idea4: '4. 動的ストップロス',
  idea5: '5. リスクパリティ',
  idea6: '6. 複合Vol推定器',
  idea7: '7. 条件付きスケーリング',
  idea8: '8. 交差シグナル',
};

// スケーリングアイデアのカテゴリ
export const scalingIdeaCategories: Record<string, string> = {
  'A': 'ボラティリティ推定の改善',
  'B': '左裾リスクの軽減',
  'C': 'レジーム判定の改善',
  'D': 'スケーリング手法の改善',
  'E': 'ポートフォリオ構成の最適化',
};

// スケーリングアイデアのステータス表示
export const scalingIdeaStatusLabels: Record<string, { label: string; color: string }> = {
  implemented: { label: '実装済み', color: 'bg-green-500' },
  implemented_in_baseline: { label: '基準に組込', color: 'bg-blue-500' },
  tested: { label: 'テスト済み', color: 'bg-yellow-500' },
  estimated: { label: '推定値', color: 'bg-purple-500' },
};
