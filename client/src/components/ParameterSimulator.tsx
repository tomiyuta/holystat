/**
 * リアルタイムパラメータ変更シミュレーター
 * ユーザーがスライダーでモメンタム期間・銘柄数を変更し、
 * 即座にパフォーマンス予測を表示する機能
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, TrendingUp, Shield, AlertTriangle, Info, 
  Sliders, BarChart3, Target, Zap, RefreshCw
} from 'lucide-react';
import { integratedData } from '@/data/integratedData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// パラメータ設定
const MOMENTUM_PERIODS = [
  { value: 3, label: '3ヶ月', key: '3m' },
  { value: 6, label: '6ヶ月', key: '6m' },
  { value: 9, label: '9ヶ月', key: '9m' },
  { value: 12, label: '12ヶ月', key: '12m' },
];

const TOP_N_VALUES = [
  { value: 3, label: '3銘柄' },
  { value: 5, label: '5銘柄' },
  { value: 7, label: '7銘柄' },
  { value: 10, label: '10銘柄' },
];

const STRATEGIES = [
  { id: 'D2', name: 'D2（S&P100）', color: 'text-orange-400', category: '攻撃型' },
  { id: 'D3', name: 'D3（S&P500）', color: 'text-amber-400', category: '攻撃型' },
  { id: 'D2+防御型', name: 'D2+防御型', color: 'text-blue-400', category: '統合型' },
  { id: 'D3+防御型', name: 'D3+防御型', color: 'text-cyan-400', category: '統合型' },
  { id: 'D2_VolScale', name: 'D2 + VolScale', color: 'text-purple-400', category: 'VolScale' },
  { id: 'D3_VolScale', name: 'D3 + VolScale', color: 'text-violet-400', category: 'VolScale' },
  { id: 'D2+防御型_VolScale', name: 'D2+防御型 + VolScale', color: 'text-emerald-400', category: 'VolScale統合' },
  { id: 'D3+防御型_VolScale', name: 'D3+防御型 + VolScale', color: 'text-green-400', category: 'VolScale統合' },
];

// パラメータキーを生成
const getParamKey = (momentum: number, topN: number) => {
  const momKey = MOMENTUM_PERIODS.find(p => p.value === momentum)?.key || '6m';
  return `モメンタム${momKey}_TOP${topN}`;
};

// パフォーマンスデータを取得
const getPerformanceData = (paramKey: string, strategyId: string) => {
  const paramData = integratedData.param_sensitivity;
  if (!paramData?.results) return null;
  
  const results = paramData.results[paramKey];
  if (!results) return null;
  
  return results[strategyId] || null;
};

// 基準パラメータ（6ヶ月×5銘柄）との比較
const getBaselineComparison = (currentData: any, strategyId: string) => {
  const baselineKey = 'モメンタム6m_TOP5';
  const baselineData = getPerformanceData(baselineKey, strategyId);
  
  if (!baselineData || !currentData) return null;
  
  return {
    cagrDiff: ((currentData.cagr - baselineData.cagr) * 100).toFixed(2),
    sharpeDiff: (currentData.sharpe - baselineData.sharpe).toFixed(3),
    maxDDDiff: ((currentData.max_dd - baselineData.max_dd) * 100).toFixed(2),
  };
};

export function ParameterSimulator() {
  const [momentumPeriod, setMomentumPeriod] = useState(6);
  const [topN, setTopN] = useState(5);
  const [selectedStrategy, setSelectedStrategy] = useState('D3+防御型_VolScale');
  const [showAllStrategies, setShowAllStrategies] = useState(false);

  const paramKey = useMemo(() => getParamKey(momentumPeriod, topN), [momentumPeriod, topN]);
  
  const performanceData = useMemo(() => {
    return getPerformanceData(paramKey, selectedStrategy);
  }, [paramKey, selectedStrategy]);

  const comparison = useMemo(() => {
    return getBaselineComparison(performanceData, selectedStrategy);
  }, [performanceData, selectedStrategy]);

  const allStrategiesData = useMemo(() => {
    return STRATEGIES.map(s => ({
      ...s,
      data: getPerformanceData(paramKey, s.id),
    })).filter(s => s.data);
  }, [paramKey]);

  // 最適パラメータを検索
  const findOptimalParam = (strategyId: string) => {
    const paramData = integratedData.param_sensitivity;
    if (!paramData?.results) return null;
    
    let bestSharpe = -999;
    let bestParam = '';
    
    for (const [param, results] of Object.entries(paramData.results)) {
      const data = results[strategyId];
      if (data && data.sharpe > bestSharpe) {
        bestSharpe = data.sharpe;
        bestParam = param;
      }
    }
    
    return { param: bestParam, sharpe: bestSharpe };
  };

  const optimalParam = useMemo(() => findOptimalParam(selectedStrategy), [selectedStrategy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
            <Sliders className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">リアルタイムパラメータシミュレーター</h3>
            <p className="text-xs text-gray-400">スライダーでパラメータを変更し、即座にパフォーマンスを確認</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
          インタラクティブ
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: パラメータ設定 */}
        <div className="space-y-6">
          {/* 戦略選択 */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">戦略を選択</label>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`px-3 py-2 rounded-lg text-xs transition-all ${
                    selectedStrategy === strategy.id
                      ? 'bg-indigo-500 text-white ring-2 ring-indigo-400/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  <span className={strategy.color}>{strategy.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* モメンタム期間スライダー */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-300">モメンタム期間</label>
              <span className="text-lg font-bold text-indigo-400">
                {MOMENTUM_PERIODS.find(p => p.value === momentumPeriod)?.label}
              </span>
            </div>
            <Slider
              value={[MOMENTUM_PERIODS.findIndex(p => p.value === momentumPeriod)]}
              min={0}
              max={MOMENTUM_PERIODS.length - 1}
              step={1}
              onValueChange={(value) => setMomentumPeriod(MOMENTUM_PERIODS[value[0]].value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {MOMENTUM_PERIODS.map(p => (
                <span key={p.value}>{p.label}</span>
              ))}
            </div>
          </div>

          {/* 銘柄数スライダー */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-300">選択銘柄数</label>
              <span className="text-lg font-bold text-purple-400">
                {TOP_N_VALUES.find(t => t.value === topN)?.label}
              </span>
            </div>
            <Slider
              value={[TOP_N_VALUES.findIndex(t => t.value === topN)]}
              min={0}
              max={TOP_N_VALUES.length - 1}
              step={1}
              onValueChange={(value) => setTopN(TOP_N_VALUES[value[0]].value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {TOP_N_VALUES.map(t => (
                <span key={t.value}>{t.label}</span>
              ))}
            </div>
          </div>

          {/* 現在のパラメータ表示 */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">現在のパラメータ</span>
            </div>
            <div className="text-lg font-mono text-white">{paramKey}</div>
            {optimalParam && paramKey === optimalParam.param && (
              <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                ★ この戦略の最適パラメータ
              </Badge>
            )}
          </div>
        </div>

        {/* 右側: パフォーマンス表示 */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {performanceData ? (
              <motion.div
                key={paramKey + selectedStrategy}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* メイン指標 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400">CAGR</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      +{(performanceData.cagr * 100).toFixed(1)}%
                    </div>
                    {comparison && (
                      <div className={`text-xs mt-1 ${parseFloat(comparison.cagrDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        基準比: {parseFloat(comparison.cagrDiff) >= 0 ? '+' : ''}{comparison.cagrDiff}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-400">Sharpe Ratio</span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {performanceData.sharpe.toFixed(3)}
                    </div>
                    {comparison && (
                      <div className={`text-xs mt-1 ${parseFloat(comparison.sharpeDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        基準比: {parseFloat(comparison.sharpeDiff) >= 0 ? '+' : ''}{comparison.sharpeDiff}
                      </div>
                    )}
                  </div>
                </div>

                {/* サブ指標 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">最大DD</div>
                    <div className="text-lg font-semibold text-red-400">
                      {(performanceData.max_dd * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Sortino</div>
                    <div className="text-lg font-semibold text-purple-400">
                      {performanceData.sortino?.toFixed(2) || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Calmar</div>
                    <div className="text-lg font-semibold text-amber-400">
                      {performanceData.calmar?.toFixed(2) || '-'}
                    </div>
                  </div>
                </div>

                {/* 累積リターン */}
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">累積リターン（2004-2025）</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {(performanceData.cumulative * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    初期投資$10,000 → ${((performanceData.cumulative + 1) * 10000).toLocaleString()}
                  </div>
                </div>

                {/* 最適パラメータへのショートカット */}
                {optimalParam && paramKey !== optimalParam.param && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400">
                          最適パラメータ: {optimalParam.param} (Sharpe: {optimalParam.sharpe.toFixed(3)})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                        onClick={() => {
                          // パラメータを最適値に設定
                          const match = optimalParam.param.match(/モメンタム(\d+)m_TOP(\d+)/);
                          if (match) {
                            setMomentumPeriod(parseInt(match[1]));
                            setTopN(parseInt(match[2]));
                          }
                        }}
                      >
                        適用
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>このパラメータ組み合わせのデータがありません</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 全戦略比較表 */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-300">
            全戦略比較（{paramKey}）
          </h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAllStrategies(!showAllStrategies)}
            className="text-xs text-gray-400"
          >
            {showAllStrategies ? '折りたたむ' : '展開する'}
          </Button>
        </div>
        
        <AnimatePresence>
          {showAllStrategies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-2">戦略</th>
                      <th className="text-right py-2 px-2">CAGR</th>
                      <th className="text-right py-2 px-2">MaxDD</th>
                      <th className="text-right py-2 px-2">Sharpe</th>
                      <th className="text-right py-2 px-2">Sortino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStrategiesData
                      .sort((a, b) => (b.data?.sharpe || 0) - (a.data?.sharpe || 0))
                      .map((strategy) => (
                        <tr 
                          key={strategy.id} 
                          className={`border-b border-gray-800 cursor-pointer transition-colors ${
                            selectedStrategy === strategy.id 
                              ? 'bg-indigo-500/10' 
                              : 'hover:bg-gray-800/50'
                          }`}
                          onClick={() => setSelectedStrategy(strategy.id)}
                        >
                          <td className={`py-2 px-2 ${strategy.color}`}>
                            {strategy.name}
                            {selectedStrategy === strategy.id && (
                              <span className="ml-2 text-xs text-indigo-400">●</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400">
                            +{(strategy.data!.cagr * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-2 text-right text-red-400">
                            {(strategy.data!.max_dd * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-2 text-right text-cyan-400">
                            {strategy.data!.sharpe.toFixed(3)}
                          </td>
                          <td className="py-2 px-2 text-right text-purple-400">
                            {strategy.data!.sortino?.toFixed(2) || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* データソース表示 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Info className="w-3 h-3" />
        <span>データソース: param_sensitivity.json（16パターン×13戦略のバックテスト結果）</span>
      </div>
    </motion.div>
  );
}
