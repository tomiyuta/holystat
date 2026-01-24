import { motion } from 'framer-motion';
import { Settings, TrendingUp, Shield, Info, Star } from 'lucide-react';
import { integratedData } from '@/data/integratedData';
import { useState } from 'react';

// パラメータ感度分析データをintegratedDataから取得
const getParamSensitivityData = () => {
  const paramData = integratedData.param_sensitivity;
  if (!paramData?.results) return null;
  
  const results = paramData.results;
  const strategies = ['D2', 'D3', 'D2+防御型', 'D3+防御型', 'D3+防御型_VolScale'];
  
  // 各戦略の最適パラメータを特定
  const optimalParams: { [strategy: string]: { param: string; sharpe: number; cagr: number; maxDD: number } } = {};
  
  for (const strategy of strategies) {
    let bestSharpe = -999;
    let bestParam = '';
    let bestCagr = 0;
    let bestMaxDD = 0;
    
    for (const [param, stratResults] of Object.entries(results)) {
      const data = stratResults[strategy];
      if (data && data.sharpe > bestSharpe) {
        bestSharpe = data.sharpe;
        bestParam = param;
        bestCagr = data.cagr;
        bestMaxDD = data.max_dd;
      }
    }
    
    if (bestParam) {
      optimalParams[strategy] = {
        param: bestParam,
        sharpe: bestSharpe,
        cagr: bestCagr * 100,
        maxDD: bestMaxDD * 100,
      };
    }
  }
  
  // パラメータ別の詳細データ
  const paramDetails: { [param: string]: { [strategy: string]: { cagr: number; maxDD: number; sharpe: number } } } = {};
  
  for (const [param, stratResults] of Object.entries(results)) {
    paramDetails[param] = {};
    for (const strategy of strategies) {
      const data = stratResults[strategy];
      if (data) {
        paramDetails[param][strategy] = {
          cagr: data.cagr * 100,
          maxDD: data.max_dd * 100,
          sharpe: data.sharpe,
        };
      }
    }
  }
  
  return {
    metadata: paramData.metadata,
    optimalParams,
    paramDetails,
    strategies,
  };
};

export function ParamSensitivityCard() {
  const [selectedStrategy, setSelectedStrategy] = useState('D3+防御型_VolScale');
  const data = getParamSensitivityData();
  
  if (!data) {
    return (
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
        <p className="text-gray-400">パラメータ感度分析データを読み込み中...</p>
      </div>
    );
  }
  
  const { optimalParams, paramDetails, strategies, metadata } = data;
  
  // パラメータリスト
  const params = Object.keys(paramDetails).sort();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">パラメータ感度分析</h3>
          <p className="text-xs text-gray-400">
            モメンタム期間（{metadata?.momentum_periods?.join(', ') || '3m, 6m, 9m, 12m'}）× 
            銘柄数（{metadata?.top_n_values?.join(', ') || '3, 5, 7, 10'}）の{metadata?.total_patterns || 16}パターン
          </p>
        </div>
      </div>

      {/* 最適パラメータサマリー */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          各戦略の最適パラメータ（Sharpe Ratio基準）
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">戦略</th>
                <th className="text-left py-2 px-2">最適パラメータ</th>
                <th className="text-right py-2 px-2">Sharpe</th>
                <th className="text-right py-2 px-2">CAGR</th>
                <th className="text-right py-2 px-2">MaxDD</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => {
                const opt = optimalParams[strategy];
                if (!opt) return null;
                
                const isRecommended = strategy === 'D3+防御型_VolScale';
                
                return (
                  <tr 
                    key={strategy} 
                    className={`border-b border-gray-800 ${isRecommended ? 'bg-purple-500/10' : ''}`}
                  >
                    <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                      {strategy === 'D2' || strategy === 'D2+防御型' ? (
                        <Shield className="w-3 h-3 text-blue-400" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      )}
                      {strategy}
                      {isRecommended && <span className="text-xs text-purple-400 ml-1">★推奨</span>}
                    </td>
                    <td className="py-2 px-2 text-amber-400">{opt.param}</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{opt.sharpe.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">+{opt.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-red-400">{opt.maxDD.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 戦略選択 */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">詳細表示する戦略を選択:</label>
        <div className="flex flex-wrap gap-2">
          {strategies.map((strategy) => (
            <button
              key={strategy}
              onClick={() => setSelectedStrategy(strategy)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                selectedStrategy === strategy
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {strategy}
            </button>
          ))}
        </div>
      </div>

      {/* 選択した戦略の詳細 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-indigo-400 mb-3">
          {selectedStrategy} のパラメータ別パフォーマンス
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">パラメータ</th>
                <th className="text-right py-2 px-2">CAGR</th>
                <th className="text-right py-2 px-2">MaxDD</th>
                <th className="text-right py-2 px-2">Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param) => {
                const stratData = paramDetails[param]?.[selectedStrategy];
                if (!stratData) return null;
                
                const isOptimal = optimalParams[selectedStrategy]?.param === param;
                
                return (
                  <tr 
                    key={param} 
                    className={`border-b border-gray-800 ${isOptimal ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-2 px-2 text-gray-300 flex items-center gap-1">
                      {param}
                      {isOptimal && <span className="text-xs text-amber-400">★最適</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-400">+{stratData.cagr.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-red-400">{stratData.maxDD.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{stratData.sharpe.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分析サマリー */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-indigo-400 mb-2">パラメータ感度分析の結論</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>モメンタム6ヶ月</strong>が多くの戦略で最適（3ヶ月はノイズが多く、12ヶ月は反応が遅い）</li>
              <li>• <strong>銘柄数3-5</strong>が集中投資効果で高リターン、7-10は分散効果でリスク低減</li>
              <li>• D3+防御型_VolScale: モメンタム6m×TOP3でSharpe 1.34、CAGR 21.6%</li>
              <li>• <strong>推奨</strong>: 現行パラメータ（6ヶ月×TOP5）は最適に近く、変更不要</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* データソース表示 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Info className="w-3 h-3" />
        <span>データソース: param_sensitivity.json（{metadata?.generated_at?.split('T')[0] || '2026-01-24'}生成）</span>
      </div>
    </motion.div>
  );
}
