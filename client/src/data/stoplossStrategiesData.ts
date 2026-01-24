/**
 * ストップロス戦略シミュレーション結果
 * 21年バックテスト（2004-08〜2025-11、256ヶ月）
 * 
 * データソース: integrated_web_data.json (grail.json由来)
 * ※ 全ての数値はintegratedDataから動的に取得
 */

import { integratedData } from './integratedData';
import { simulationConditions } from './homeData';

// ヘルパー関数
const toPercent = (value: number): number => value * 100;
const round2 = (value: number): number => Math.round(value * 100) / 100;

// ========== ストップロス戦略の仕様（参考情報） ==========
export const stoplossSpec = {
  name: "ストップロス感度分析",
  description: "異なるストップロス閾値でのパフォーマンス比較",
  thresholds: ["なし", "-5%", "-10%", "-15%", "-20%", "-25%"],
  frequency: "日次判定",
  period: simulationConditions.period,
};

// ========== 基本戦略比較（integratedDataから動的取得） ==========
export const stoplossComparison = {
  D2: {
    baseline: {
      strategyName: "D2単独",
      metrics: {
        cagr: round2(toPercent(integratedData.summary.D2.cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary.D2.max_dd)),
        sharpeRatio: round2(integratedData.summary.D2.sharpe),
        cumulativeReturn: round2(integratedData.summary.D2.cumulative),
        sortinoRatio: round2(integratedData.summary.D2.sortino),
        calmarRatio: round2(integratedData.summary.D2.calmar),
        volatility: round2(toPercent(integratedData.summary.D2.volatility)),
      },
    },
    volScale: {
      strategyName: "D2 + VolScale",
      metrics: {
        cagr: round2(toPercent(integratedData.summary.D2_VolScale.cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary.D2_VolScale.max_dd)),
        sharpeRatio: round2(integratedData.summary.D2_VolScale.sharpe),
        cumulativeReturn: round2(integratedData.summary.D2_VolScale.cumulative),
        sortinoRatio: round2(integratedData.summary.D2_VolScale.sortino),
        calmarRatio: round2(integratedData.summary.D2_VolScale.calmar),
        volatility: round2(toPercent(integratedData.summary.D2_VolScale.volatility)),
      },
    },
    integrated: {
      strategyName: "D2+防御型（レジーム切替）",
      metrics: {
        cagr: round2(toPercent(integratedData.summary['D2+防御型'].cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary['D2+防御型'].max_dd)),
        sharpeRatio: round2(integratedData.summary['D2+防御型'].sharpe),
        cumulativeReturn: round2(integratedData.summary['D2+防御型'].cumulative),
        sortinoRatio: round2(integratedData.summary['D2+防御型'].sortino),
        calmarRatio: round2(integratedData.summary['D2+防御型'].calmar),
        volatility: round2(toPercent(integratedData.summary['D2+防御型'].volatility)),
      },
    },
    integratedVolScale: {
      strategyName: "D2+防御型_VolScale",
      metrics: {
        cagr: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].max_dd)),
        sharpeRatio: round2(integratedData.summary['D2+防御型_VolScale'].sharpe),
        cumulativeReturn: round2(integratedData.summary['D2+防御型_VolScale'].cumulative),
        sortinoRatio: round2(integratedData.summary['D2+防御型_VolScale'].sortino),
        calmarRatio: round2(integratedData.summary['D2+防御型_VolScale'].calmar),
        volatility: round2(toPercent(integratedData.summary['D2+防御型_VolScale'].volatility)),
      },
    },
  },
  D3: {
    baseline: {
      strategyName: "D3単独",
      metrics: {
        cagr: round2(toPercent(integratedData.summary.D3.cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary.D3.max_dd)),
        sharpeRatio: round2(integratedData.summary.D3.sharpe),
        cumulativeReturn: round2(integratedData.summary.D3.cumulative),
        sortinoRatio: round2(integratedData.summary.D3.sortino),
        calmarRatio: round2(integratedData.summary.D3.calmar),
        volatility: round2(toPercent(integratedData.summary.D3.volatility)),
      },
    },
    volScale: {
      strategyName: "D3 + VolScale",
      metrics: {
        cagr: round2(toPercent(integratedData.summary.D3_VolScale.cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary.D3_VolScale.max_dd)),
        sharpeRatio: round2(integratedData.summary.D3_VolScale.sharpe),
        cumulativeReturn: round2(integratedData.summary.D3_VolScale.cumulative),
        sortinoRatio: round2(integratedData.summary.D3_VolScale.sortino),
        calmarRatio: round2(integratedData.summary.D3_VolScale.calmar),
        volatility: round2(toPercent(integratedData.summary.D3_VolScale.volatility)),
      },
    },
    integrated: {
      strategyName: "D3+防御型（レジーム切替）",
      metrics: {
        cagr: round2(toPercent(integratedData.summary['D3+防御型'].cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary['D3+防御型'].max_dd)),
        sharpeRatio: round2(integratedData.summary['D3+防御型'].sharpe),
        cumulativeReturn: round2(integratedData.summary['D3+防御型'].cumulative),
        sortinoRatio: round2(integratedData.summary['D3+防御型'].sortino),
        calmarRatio: round2(integratedData.summary['D3+防御型'].calmar),
        volatility: round2(toPercent(integratedData.summary['D3+防御型'].volatility)),
      },
    },
    integratedVolScale: {
      strategyName: "D3+防御型_VolScale",
      metrics: {
        cagr: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].cagr)),
        maxDrawdown: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].max_dd)),
        sharpeRatio: round2(integratedData.summary['D3+防御型_VolScale'].sharpe),
        cumulativeReturn: round2(integratedData.summary['D3+防御型_VolScale'].cumulative),
        sortinoRatio: round2(integratedData.summary['D3+防御型_VolScale'].sortino),
        calmarRatio: round2(integratedData.summary['D3+防御型_VolScale'].calmar),
        volatility: round2(toPercent(integratedData.summary['D3+防御型_VolScale'].volatility)),
      },
    },
  },
};

// ========== 防御型・ベンチマーク ==========
export const defensiveAndBenchmark = {
  defensiveTop3: {
    strategyName: "防御型TOP3",
    metrics: {
      cagr: round2(toPercent(integratedData.summary['防御型TOP3'].cagr)),
      maxDrawdown: round2(toPercent(integratedData.summary['防御型TOP3'].max_dd)),
      sharpeRatio: round2(integratedData.summary['防御型TOP3'].sharpe),
      cumulativeReturn: round2(integratedData.summary['防御型TOP3'].cumulative),
      sortinoRatio: round2(integratedData.summary['防御型TOP3'].sortino),
      calmarRatio: round2(integratedData.summary['防御型TOP3'].calmar),
      volatility: round2(toPercent(integratedData.summary['防御型TOP3'].volatility)),
    },
  },
  defensiveTop5: {
    strategyName: "防御型TOP5",
    metrics: {
      cagr: round2(toPercent(integratedData.summary['防御型TOP5'].cagr)),
      maxDrawdown: round2(toPercent(integratedData.summary['防御型TOP5'].max_dd)),
      sharpeRatio: round2(integratedData.summary['防御型TOP5'].sharpe),
      cumulativeReturn: round2(integratedData.summary['防御型TOP5'].cumulative),
      sortinoRatio: round2(integratedData.summary['防御型TOP5'].sortino),
      calmarRatio: round2(integratedData.summary['防御型TOP5'].calmar),
      volatility: round2(toPercent(integratedData.summary['防御型TOP5'].volatility)),
    },
  },
  benchmark: {
    strategyName: "SPY（ベンチマーク）",
    metrics: {
      cagr: round2(toPercent(integratedData.summary.SPY.cagr)),
      maxDrawdown: round2(toPercent(integratedData.summary.SPY.max_dd)),
      sharpeRatio: round2(integratedData.summary.SPY.sharpe),
      cumulativeReturn: round2(integratedData.summary.SPY.cumulative),
      sortinoRatio: round2(integratedData.summary.SPY.sortino),
      calmarRatio: round2(integratedData.summary.SPY.calmar),
      volatility: round2(toPercent(integratedData.summary.SPY.volatility)),
    },
  },
};

// ========== シミュレーション仕様 ==========
export const simulationSpec = {
  period: simulationConditions.period,
  tradingCost: simulationConditions.tradingCost,
  biasCorrection: simulationConditions.survivorshipBiasCorrection,
  dataSource: "grail.json (integrated_web_data.json)",
  universes: {
    D2: { name: "S&P 100", description: "時価総額上位100社" },
    D3: { name: "S&P 500", description: "S&P500全銘柄" },
  },
  parameters: {
    momentumLookback: "6ヶ月",
    riskLookback: "60日",
    rebalance: "月初",
  },
};

// ========== 互換性のためのエクスポート ==========
export const stoplossStrategiesData = stoplossComparison;
