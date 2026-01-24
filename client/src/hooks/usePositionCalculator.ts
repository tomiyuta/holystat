/**
 * ポジション計算カスタムフック
 * 
 * 日本円の資金量からD2/D3/防御型ポートフォリオの
 * 各銘柄に対する購入株数を計算するロジックを管理
 */

import { useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

// 戦略タイプの定義
export type StrategyType = 'd2' | 'd3' | 'defensiveTop3' | 'defensiveTop5' | 'd2+defensive' | 'd3+defensive';

// 戦略の表示名
export const STRATEGY_NAMES: Record<StrategyType, string> = {
  'd2': 'D2戦略（S&P100）',
  'd3': 'D3戦略（S&P500）',
  'defensiveTop3': '防御型TOP3（ETF）',
  'defensiveTop5': '防御型TOP5（ETF）',
  'd2+defensive': 'D2+防御型（統合）',
  'd3+defensive': 'D3+防御型（統合・推奨）',
};

// 戦略別のデフォルト目標ボラティリティ
export const DEFAULT_TARGET_VOLS: Record<StrategyType, number> = {
  'd2': 19,
  'd3': 19,
  'defensiveTop3': 8,
  'defensiveTop5': 8,
  'd2+defensive': 11,  // バックテスト整合
  'd3+defensive': 14,
};

// 戦略別の平均ボラティリティ（バックテスト結果から）
export const AVERAGE_VOLS: Record<StrategyType, number> = {
  'd2': 18.1,
  'd3': 19.4,
  'defensiveTop3': 9.4,
  'defensiveTop5': 8.5,
  'd2+defensive': 11.0,
  'd3+defensive': 12.5,
};

// プリセット金額
export const AMOUNT_PRESETS = [
  { label: '100万円', value: 1000000 },
  { label: '500万円', value: 5000000 },
  { label: '1000万円', value: 10000000 },
  { label: '5000万円', value: 50000000 },
];

// 金額フォーマット関数
export function formatJPY(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

// フック引数の型
interface UsePositionCalculatorOptions {
  defaultAmount?: number;
  defaultStrategy?: StrategyType;
}

/**
 * ポジション計算カスタムフック
 */
export function usePositionCalculator(options: UsePositionCalculatorOptions = {}) {
  const { 
    defaultAmount = 1000000,
    defaultStrategy = 'd3+defensive',
  } = options;

  // 入力状態
  const [amountInput, setAmountInput] = useState(defaultAmount.toString());
  const [submittedAmount, setSubmittedAmount] = useState<number | null>(null);
  
  // VolScale設定
  const [volScaleEnabled, setVolScaleEnabled] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(defaultStrategy);
  const [customTargetVol, setCustomTargetVol] = useState<number | null>(null);
  const [volScaleSettingsOpen, setVolScaleSettingsOpen] = useState(false);

  // 入力金額をパース
  const parsedAmount = useMemo(() => {
    const cleaned = amountInput.replace(/[,，]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }, [amountInput]);

  // 現在の目標ボラティリティ
  const currentTargetVol = customTargetVol ?? DEFAULT_TARGET_VOLS[selectedStrategy];
  const currentAvgVol = AVERAGE_VOLS[selectedStrategy];

  // 予想スケールファクター
  const expectedScaleFactor = currentTargetVol / currentAvgVol;

  // 為替レート取得
  const { 
    data: exchangeRate, 
    isLoading: isLoadingRate,
  } = trpc.batch.getExchangeRate.useQuery();

  // 通常のポジション計算
  const { 
    data: positions, 
    isLoading: isCalculating,
    refetch,
  } = trpc.batch.calculatePositions.useQuery(
    { amountJPY: submittedAmount || 0 },
    { enabled: submittedAmount !== null && submittedAmount >= 10000 && !volScaleEnabled }
  );

  // VolScale適用ポジション計算
  const {
    data: volScalePositions,
    isLoading: isCalculatingVolScale,
    refetch: refetchVolScale,
  } = trpc.batch.calculatePositionsWithVolScale.useQuery(
    {
      amountJPY: submittedAmount || 0,
      volScaleInput: {
        enabled: true,
        strategyType: selectedStrategy,
        customTargetVol: customTargetVol ?? undefined,
      },
    },
    { enabled: submittedAmount !== null && submittedAmount >= 10000 && volScaleEnabled }
  );

  // 計算実行
  const handleCalculate = useCallback(() => {
    if (parsedAmount >= 10000) {
      setSubmittedAmount(parsedAmount);
    }
  }, [parsedAmount]);

  // プリセット選択
  const handlePresetSelect = useCallback((value: number) => {
    setAmountInput(value.toString());
    setSubmittedAmount(value);
  }, []);

  // 戦略変更
  const handleStrategyChange = useCallback((strategy: StrategyType) => {
    setSelectedStrategy(strategy);
    setCustomTargetVol(null); // リセット
  }, []);

  // 再計算
  const handleRefresh = useCallback(() => {
    if (volScaleEnabled) {
      refetchVolScale();
    } else {
      refetch();
    }
  }, [volScaleEnabled, refetch, refetchVolScale]);

  // 計算中かどうか
  const isLoading = volScaleEnabled ? isCalculatingVolScale : isCalculating;
  
  // 結果データ
  const currentPositions = volScaleEnabled ? volScalePositions : positions;

  // バリデーション
  const isValidAmount = parsedAmount >= 10000;
  const canCalculate = isValidAmount && !isLoading;

  return {
    // 入力状態
    amountInput,
    setAmountInput,
    parsedAmount,
    submittedAmount,
    
    // VolScale設定
    volScaleEnabled,
    setVolScaleEnabled,
    selectedStrategy,
    customTargetVol,
    setCustomTargetVol,
    volScaleSettingsOpen,
    setVolScaleSettingsOpen,
    
    // 計算値
    currentTargetVol,
    currentAvgVol,
    expectedScaleFactor,
    
    // API結果
    exchangeRate,
    isLoadingRate,
    positions,
    volScalePositions,
    currentPositions,
    isLoading,
    isCalculating,
    isCalculatingVolScale,
    
    // アクション
    handleCalculate,
    handlePresetSelect,
    handleStrategyChange,
    handleRefresh,
    
    // バリデーション
    isValidAmount,
    canCalculate,
    
    // 定数
    presets: AMOUNT_PRESETS,
    strategyNames: STRATEGY_NAMES,
    defaultTargetVols: DEFAULT_TARGET_VOLS,
    averageVols: AVERAGE_VOLS,
  };
}
