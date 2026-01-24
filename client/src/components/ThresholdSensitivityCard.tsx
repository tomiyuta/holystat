import { motion } from 'framer-motion';
import { Target, TrendingUp, Shield, AlertTriangle, Info } from 'lucide-react';
import { integratedData } from '@/data/integratedData';

// ストップロス感度分析データをintegratedDataから取得
const getStoplossData = () => {
  const slData = integratedData.stoploss_sensitivity;
  if (!slData?.results) return null;
  
  const thresholds = ['なし', '-5%', '-10%', '-15%', '-20%', '-25%'];
  
  // D2戦略のデータ
  const d2Baseline = slData.results['なし']?.['D2'];
  const d2Scenarios = thresholds.slice(1).map(threshold => {
    const data = slData.results[threshold]?.['D2'];
    return {
      threshold,
      cagr: data?.cagr ? data.cagr * 100 : 0,
      maxDD: data?.max_dd ? data.max_dd * 100 : 0,
      sharpe: data?.sharpe || 0,
      triggerRate: data?.stoploss_trigger_rate ? data.stoploss_trigger_rate * 100 : 0,
    };
  });
  
  // D3戦略のデータ
  const d3Baseline = slData.results['なし']?.['D3'];
  const d3Scenarios = thresholds.slice(1).map(threshold => {
    const data = slData.results[threshold]?.['D3'];
    return {
      threshold,
      cagr: data?.cagr ? data.cagr * 100 : 0,
      maxDD: data?.max_dd ? data.max_dd * 100 : 0,
      sharpe: data?.sharpe || 0,
      triggerRate: data?.stoploss_trigger_rate ? data.stoploss_trigger_rate * 100 : 0,
    };
  });
  
  // D3+防御型_VolScaleのデータ
  const integratedBaseline = slData.results['なし']?.['D3+防御型_VolScale'];
  const integratedScenarios = thresholds.slice(1).map(threshold => {
    const data = slData.results[threshold]?.['D3+防御型_VolScale'];
    return {
      threshold,
      cagr: data?.cagr ? data.cagr * 100 : 0,
      maxDD: data?.max_dd ? data.max_dd * 100 : 0,
      sharpe: data?.sharpe || 0,
      triggerRate: data?.stoploss_trigger_rate ? data.stoploss_trigger_rate * 100 : 0,
    };
  });
  
  return {
    d2: {
      baseline: {
        cagr: d2Baseline?.cagr ? d2Baseline.cagr * 100 : 0,
        maxDD: d2Baseline?.max_dd ? d2Baseline.max_dd * 100 : 0,
        sharpe: d2Baseline?.sharpe || 0,
      },
      scenarios: d2Scenarios,
    },
    d3: {
      baseline: {
        cagr: d3Baseline?.cagr ? d3Baseline.cagr * 100 : 0,
        maxDD: d3Baseline?.max_dd ? d3Baseline.max_dd * 100 : 0,
        sharpe: d3Baseline?.sharpe || 0,
      },
      scenarios: d3Scenarios,
    },
    integrated: {
      baseline: {
        cagr: integratedBaseline?.cagr ? integratedBaseline.cagr * 100 : 0,
        maxDD: integratedBaseline?.max_dd ? integratedBaseline.max_dd * 100 : 0,
        sharpe: integratedBaseline?.sharpe || 0,
      },
      scenarios: integratedScenarios,
    },
  };
};

// 最適閾値を特定（Sharpe Ratio基準）
const findOptimalThreshold = (scenarios: { threshold: string; sharpe: number }[], baselineSharpe: number) => {
  let best = { threshold: 'なし', sharpe: baselineSharpe };
  for (const s of scenarios) {
    if (s.sharpe > best.sharpe) {
      best = { threshold: s.threshold, sharpe: s.sharpe };
    }
  }
  return best.threshold;
};

export function ThresholdSensitivityCard() {
  const sensitivityData = getStoplossData();
  
  if (!sensitivityData) {
    return (
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
        <p className="text-gray-400">ストップロス感度分析データを読み込み中...</p>
      </div>
    );
  }
  
  const d2Optimal = findOptimalThreshold(sensitivityData.d2.scenarios, sensitivityData.d2.baseline.sharpe);
  const d3Optimal = findOptimalThreshold(sensitivityData.d3.scenarios, sensitivityData.d3.baseline.sharpe);
  const integratedOptimal = findOptimalThreshold(sensitivityData.integrated.scenarios, sensitivityData.integrated.baseline.sharpe);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Target className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">ストップロス閾値の感度分析</h3>
          <p className="text-xs text-gray-400">-5%〜-25%の5つの閾値でパフォーマンス比較（2004-2025年、264ヶ月）</p>
        </div>
      </div>

      {/* D3+防御型_VolScale（推奨戦略）の結果 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          D3+防御型_VolScale（推奨戦略）
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">閾値</th>
                <th className="text-right py-2 px-2">CAGR</th>
                <th className="text-right py-2 px-2">最大DD</th>
                <th className="text-right py-2 px-2">シャープ</th>
                <th className="text-right py-2 px-2">発動率</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                  ベースライン
                  {integratedOptimal === 'なし' && <span className="text-xs text-amber-400">★最適</span>}
                </td>
                <td className="py-2 px-2 text-right text-emerald-400">+{sensitivityData.integrated.baseline.cagr.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-red-400">{sensitivityData.integrated.baseline.maxDD.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-cyan-400">{sensitivityData.integrated.baseline.sharpe.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-gray-500">-</td>
              </tr>
              {sensitivityData.integrated.scenarios.map((scenario) => {
                const isOptimal = scenario.threshold === integratedOptimal;
                return (
                  <tr 
                    key={scenario.threshold} 
                    className={`border-b border-gray-800 ${isOptimal ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                      {scenario.threshold}
                      {isOptimal && <span className="text-xs text-amber-400">★最適</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-400">+{scenario.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-red-400">{scenario.maxDD.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{scenario.sharpe.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-400">{scenario.triggerRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* D3戦略の結果 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          D3戦略（S&P500・リターン重視）
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">閾値</th>
                <th className="text-right py-2 px-2">CAGR</th>
                <th className="text-right py-2 px-2">最大DD</th>
                <th className="text-right py-2 px-2">シャープ</th>
                <th className="text-right py-2 px-2">発動率</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                  ベースライン
                  {d3Optimal === 'なし' && <span className="text-xs text-amber-400">★最適</span>}
                </td>
                <td className="py-2 px-2 text-right text-emerald-400">+{sensitivityData.d3.baseline.cagr.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-red-400">{sensitivityData.d3.baseline.maxDD.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-cyan-400">{sensitivityData.d3.baseline.sharpe.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-gray-500">-</td>
              </tr>
              {sensitivityData.d3.scenarios.map((scenario) => {
                const isOptimal = scenario.threshold === d3Optimal;
                return (
                  <tr 
                    key={scenario.threshold} 
                    className={`border-b border-gray-800 ${isOptimal ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                      {scenario.threshold}
                      {isOptimal && <span className="text-xs text-amber-400">★最適</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-400">+{scenario.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-red-400">{scenario.maxDD.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{scenario.sharpe.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-400">{scenario.triggerRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* D2戦略の結果 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          D2戦略（S&P100・安定重視）
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">閾値</th>
                <th className="text-right py-2 px-2">CAGR</th>
                <th className="text-right py-2 px-2">最大DD</th>
                <th className="text-right py-2 px-2">シャープ</th>
                <th className="text-right py-2 px-2">発動率</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                  ベースライン
                  {d2Optimal === 'なし' && <span className="text-xs text-amber-400">★最適</span>}
                </td>
                <td className="py-2 px-2 text-right text-emerald-400">+{sensitivityData.d2.baseline.cagr.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-red-400">{sensitivityData.d2.baseline.maxDD.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-cyan-400">{sensitivityData.d2.baseline.sharpe.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-gray-500">-</td>
              </tr>
              {sensitivityData.d2.scenarios.map((scenario) => {
                const isOptimal = scenario.threshold === d2Optimal;
                return (
                  <tr 
                    key={scenario.threshold} 
                    className={`border-b border-gray-800 ${isOptimal ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                      {scenario.threshold}
                      {isOptimal && <span className="text-xs text-amber-400">★最適</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-400">+{scenario.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-red-400">{scenario.maxDD.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{scenario.sharpe.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-400">{scenario.triggerRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分析サマリー */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-400 mb-2">感度分析の結論</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>ストップロスなし</strong>が全戦略で最もシャープレシオが高い</li>
              <li>• 厳しい閾値（-5%）は発動率が高く（30%超）、取引コストで損失</li>
              <li>• レジームスイッチング自体がリスク管理として機能している</li>
              <li>• <strong>推奨</strong>: 追加のストップロスは不要、レジーム判定で十分</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* データソース表示 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Info className="w-3 h-3" />
        <span>データソース: stoploss_sensitivity.json（{integratedData.stoploss_sensitivity?.metadata?.generated_at?.split('T')[0] || '2026-01-24'}生成）</span>
      </div>
    </motion.div>
  );
}
