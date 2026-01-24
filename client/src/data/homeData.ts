/**
 * ホームページ用データ - Holy Grail Edition
 * 
 * データソース: integrated_web_data.json (grail.json由来)
 * 期間: 2004-08 〜 2025-11（256ヶ月、21年）
 * 
 * ※ 全ての数値はintegratedDataから動的に取得
 */

import { integratedData } from './integratedData';

// シミュレーション条件（目立つ形で表示するための定数）
export const simulationConditions = {
  tradingCost: 0.2, // %
  survivorshipBiasCorrection: 2.0, // %/年
  period: {
    start: '2004-08',
    end: '2025-11',
    months: 256,
    years: 21,
  },
  description: {
    tradingCost: '取引コスト0.2%考慮',
    biasCorrection: 'サバイバーシップバイアス補正（年率-2%）',
    period: '期間: 2004年8月〜2025年11月（256ヶ月）',
  },
};

// ヘルパー関数: CAGRを%に変換
const toPercent = (value: number): number => value * 100;

// ヘルパー関数: 小数点以下2桁に丸める
const round2 = (value: number): number => Math.round(value * 100) / 100;

// ========== 戦略サマリー（ホームページ表示用） ==========
// integratedDataから動的に生成
export const homeStrategyData = {
  d2: {
    name: "D2戦略",
    subtitle: "S&P100・安定重視",
    description: "時価総額上位100社から6ヶ月モメンタム上位を選定",
    holdings: 5,
    cagr: round2(toPercent(integratedData.summary.D2.cagr)),
    cagrBeforeBiasCorrection: round2(toPercent(integratedData.summary.D2.cagr) + simulationConditions.survivorshipBiasCorrection),
    maxDrawdown: round2(toPercent(integratedData.summary.D2.max_dd)),
    sharpeRatio: round2(integratedData.summary.D2.sharpe),
    sortinoRatio: round2(integratedData.summary.D2.sortino),
    calmarRatio: round2(integratedData.summary.D2.calmar),
    volatility: round2(toPercent(integratedData.summary.D2.volatility)),
    cumulative: round2(integratedData.summary.D2.cumulative),
    backtestPeriod: {
      start: simulationConditions.period.start,
      end: simulationConditions.period.end,
      months: simulationConditions.period.months,
    },
  },
  d3: {
    name: "D3戦略",
    subtitle: "S&P500・リターン重視",
    description: "S&P500全銘柄から6ヶ月モメンタム上位を選定",
    holdings: 3,
    cagr: round2(toPercent(integratedData.summary.D3.cagr)),
    cagrBeforeBiasCorrection: round2(toPercent(integratedData.summary.D3.cagr) + simulationConditions.survivorshipBiasCorrection),
    maxDrawdown: round2(toPercent(integratedData.summary.D3.max_dd)),
    sharpeRatio: round2(integratedData.summary.D3.sharpe),
    sortinoRatio: round2(integratedData.summary.D3.sortino),
    calmarRatio: round2(integratedData.summary.D3.calmar),
    volatility: round2(toPercent(integratedData.summary.D3.volatility)),
    cumulative: round2(integratedData.summary.D3.cumulative),
    backtestPeriod: {
      start: simulationConditions.period.start,
      end: simulationConditions.period.end,
      months: simulationConditions.period.months,
    },
  },
  defensiveTop3: {
    name: "防御型TOP3",
    subtitle: "ETF・リスク分散",
    description: "防御型ETF（TLT, GLD, IEF, SHY, VNQ）から上位3銘柄を選定",
    holdings: 3,
    cagr: round2(toPercent(integratedData.summary['防御型TOP3'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['防御型TOP3'].max_dd)),
    sharpeRatio: round2(integratedData.summary['防御型TOP3'].sharpe),
    sortinoRatio: round2(integratedData.summary['防御型TOP3'].sortino),
    calmarRatio: round2(integratedData.summary['防御型TOP3'].calmar),
    volatility: round2(toPercent(integratedData.summary['防御型TOP3'].volatility)),
    cumulative: round2(integratedData.summary['防御型TOP3'].cumulative),
    backtestPeriod: {
      start: simulationConditions.period.start,
      end: simulationConditions.period.end,
      months: simulationConditions.period.months,
    },
  },
  defensiveTop5: {
    name: "防御型TOP5",
    subtitle: "ETF・リスク分散",
    description: "防御型ETF（TLT, GLD, IEF, SHY, VNQ）から上位5銘柄を選定",
    holdings: 5,
    cagr: round2(toPercent(integratedData.summary['防御型TOP5'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['防御型TOP5'].max_dd)),
    sharpeRatio: round2(integratedData.summary['防御型TOP5'].sharpe),
    sortinoRatio: round2(integratedData.summary['防御型TOP5'].sortino),
    calmarRatio: round2(integratedData.summary['防御型TOP5'].calmar),
    volatility: round2(toPercent(integratedData.summary['防御型TOP5'].volatility)),
    cumulative: round2(integratedData.summary['防御型TOP5'].cumulative),
    backtestPeriod: {
      start: simulationConditions.period.start,
      end: simulationConditions.period.end,
      months: simulationConditions.period.months,
    },
  },
  benchmark: {
    name: "SPY",
    subtitle: "S&P500 ETF",
    description: "ベンチマーク",
    cagr: round2(toPercent(integratedData.summary.SPY.cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary.SPY.max_dd)),
    sharpeRatio: round2(integratedData.summary.SPY.sharpe),
    sortinoRatio: round2(integratedData.summary.SPY.sortino),
    calmarRatio: round2(integratedData.summary.SPY.calmar),
    volatility: round2(toPercent(integratedData.summary.SPY.volatility)),
    cumulative: round2(integratedData.summary.SPY.cumulative),
  },
};

// ========== 統合戦略（レジーム+VolScale） ==========
export const integratedStrategyData = {
  d2Integrated: {
    name: "D2+防御型",
    subtitle: "D2+レジーム切替",
    description: "Bull→D2、Bear→防御型",
    cagr: round2(toPercent(integratedData.summary['D2+防御型'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['D2+防御型'].max_dd)),
    sharpeRatio: round2(integratedData.summary['D2+防御型'].sharpe),
    sortinoRatio: round2(integratedData.summary['D2+防御型'].sortino),
    calmarRatio: round2(integratedData.summary['D2+防御型'].calmar),
    volatility: round2(toPercent(integratedData.summary['D2+防御型'].volatility)),
    cumulative: round2(integratedData.summary['D2+防御型'].cumulative),
  },
  d3Integrated: {
    name: "D3+防御型",
    subtitle: "D3+レジーム切替",
    description: "Bull→D3、Bear→防御型",
    cagr: round2(toPercent(integratedData.summary['D3+防御型'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['D3+防御型'].max_dd)),
    sharpeRatio: round2(integratedData.summary['D3+防御型'].sharpe),
    sortinoRatio: round2(integratedData.summary['D3+防御型'].sortino),
    calmarRatio: round2(integratedData.summary['D3+防御型'].calmar),
    volatility: round2(toPercent(integratedData.summary['D3+防御型'].volatility)),
    cumulative: round2(integratedData.summary['D3+防御型'].cumulative),
  },
  d2IntegratedVolScale: {
    name: "D2+防御型_VolScale",
    subtitle: "D2+レジーム+ボラ調整",
    description: "Bull→D2+VolScale、Bear→防御型+VolScale",
    cagr: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].max_dd)),
    sharpeRatio: round2(integratedData.summary['D2+防御型_VolScale'].sharpe),
    sortinoRatio: round2(integratedData.summary['D2+防御型_VolScale'].sortino),
    calmarRatio: round2(integratedData.summary['D2+防御型_VolScale'].calmar),
    volatility: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].volatility)),
    cumulative: round2(integratedData.summary['D2+防御型_VolScale'].cumulative),
  },
  d3IntegratedVolScale: {
    name: "D3+防御型_VolScale",
    subtitle: "D3+レジーム+ボラ調整",
    description: "Bull→D3+VolScale、Bear→防御型+VolScale",
    cagr: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].max_dd)),
    sharpeRatio: round2(integratedData.summary['D3+防御型_VolScale'].sharpe),
    sortinoRatio: round2(integratedData.summary['D3+防御型_VolScale'].sortino),
    calmarRatio: round2(integratedData.summary['D3+防御型_VolScale'].calmar),
    volatility: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].volatility)),
    cumulative: round2(integratedData.summary['D3+防御型_VolScale'].cumulative),
  },
};

// ========== VolScale戦略 ==========
export const volScaleStrategyData = {
  d2VolScale: {
    name: "D2_VolScale",
    subtitle: "D2+ボラティリティ調整",
    description: "D2戦略にボラティリティスケーリングを適用",
    cagr: round2(toPercent(integratedData.summary.D2_VolScale.cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary.D2_VolScale.max_dd)),
    sharpeRatio: round2(integratedData.summary.D2_VolScale.sharpe),
    sortinoRatio: round2(integratedData.summary.D2_VolScale.sortino),
    calmarRatio: round2(integratedData.summary.D2_VolScale.calmar),
    volatility: round2(toPercent(integratedData.summary.D2_VolScale.volatility)),
    cumulative: round2(integratedData.summary.D2_VolScale.cumulative),
  },
  d3VolScale: {
    name: "D3_VolScale",
    subtitle: "D3+ボラティリティ調整",
    description: "D3戦略にボラティリティスケーリングを適用",
    cagr: round2(toPercent(integratedData.summary.D3_VolScale.cagr)),
    maxDrawdown: round2(toPercent(integratedData.summary.D3_VolScale.max_dd)),
    sharpeRatio: round2(integratedData.summary.D3_VolScale.sharpe),
    sortinoRatio: round2(integratedData.summary.D3_VolScale.sortino),
    calmarRatio: round2(integratedData.summary.D3_VolScale.calmar),
    volatility: round2(toPercent(integratedData.summary.D3_VolScale.volatility)),
    cumulative: round2(integratedData.summary.D3_VolScale.cumulative),
  },
};

// ========== バイアス補正情報 ==========
export const biasCorrection = {
  survivorshipBias: {
    description: "現在のS&P500構成銘柄で過去をバックテストすると、倒産・除外銘柄が含まれないためリターンが過大評価されます。年率2%を差し引いて補正しています。",
    correctionRate: simulationConditions.survivorshipBiasCorrection,
  },
  tradingCost: {
    description: "各リバランス時に片道0.2%の取引コストを考慮しています。",
    costRate: simulationConditions.tradingCost,
  },
  lookaheadBias: {
    description: "現在の構成銘柄を過去に遡って適用しているため、将来情報を使用しています。",
    severity: "medium",
  },
};

// ========== 全戦略サマリー（13戦略） ==========
export const allStrategySummary = Object.entries(integratedData.summary).map(([key, data]) => ({
  id: key,
  name: key,
  cagr: round2(toPercent(data.cagr)),
  maxDrawdown: round2(toPercent(data.max_dd)),
  sharpe: round2(data.sharpe),
  sortino: round2(data.sortino),
  calmar: round2(data.calmar),
  volatility: round2(toPercent(data.volatility)),
  cumulative: round2(data.cumulative),
}));
