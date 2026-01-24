/**
 * Monthly Rebalance Cost Analysis Card Component
 * 
 * 月次リバランスに伴う取引コストを可視化するカード
 * - 月次リバランスを前提とした計算
 * - 取引コストの累積影響
 * - ターンオーバー率の表示
 */

import { RefreshCw, DollarSign, Info, TrendingDown, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RebalanceCostData {
  buyAndHoldReturn: number;      // 参考値（月次リバランス後のリターン）
  rebalancedReturn: number;      // 取引コスト控除後のリターン
  volatilityPumpingEffect: number; // 取引コストによる影響（負の値）
  totalTransactionCost: number;  // 累積取引コスト
  effectAnnualized: number;      // 年率換算の取引コスト影響
  monthsAnalyzed: number;        // 分析期間（月数）
}

interface RebalanceCostCardProps {
  data: RebalanceCostData | null | undefined;
  strategyName: string;
  colorClass?: string;
}

export function VolatilityPumpingCard({ 
  data, 
  strategyName,
  colorClass = "emerald"
}: RebalanceCostCardProps) {
  if (!data) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-gray-500 text-center py-4">
          リバランスコストデータがありません
        </div>
      </div>
    );
  }

  // 色のマッピング
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  };
  
  const colors = colorMap[colorClass] || colorMap.emerald;
  
  // 年数を計算
  const years = data.monthsAnalyzed / 12;
  
  // 年率取引コスト
  const annualCost = data.totalTransactionCost / years;

  return (
    <div className={`bg-gray-900 rounded-xl p-5 border ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <RefreshCw className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">月次リバランスコスト</h3>
            <p className="text-xs text-gray-500">{strategyName} · {data.monthsAnalyzed}ヶ月分析</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-gray-500 hover:text-gray-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              <strong>月次リバランス前提</strong>: 毎月1日に前月までのデータを元に
              ポートフォリオを再構築します。リバランス時の売買に伴う取引コスト
              （往復0.1%）を考慮した実質リターンを表示しています。
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main Metrics */}
      <div className="space-y-3 mb-4">
        {/* グロスリターン */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">グロスリターン</span>
            </div>
            <p className={`text-lg font-bold ${data.buyAndHoldReturn >= 0 ? colors.text : 'text-red-400'}`}>
              {data.buyAndHoldReturn >= 0 ? '+' : ''}{data.buyAndHoldReturn.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">取引コスト控除前</p>
        </div>

        {/* 取引コスト */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-400">累積取引コスト</span>
            </div>
            <p className="text-lg font-bold text-amber-400">
              -{data.totalTransactionCost.toFixed(2)}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            年率約 {annualCost.toFixed(2)}%（往復0.1%想定）
          </p>
        </div>

        {/* ネットリターン */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">ネットリターン</span>
            </div>
            <p className={`text-xl font-bold ${data.rebalancedReturn >= 0 ? colors.text : 'text-red-400'}`}>
              {data.rebalancedReturn >= 0 ? '+' : ''}{data.rebalancedReturn.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">取引コスト控除後の実質リターン</p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-800/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-gray-300 font-medium">計算前提:</span> 毎月1日にリバランスを実行。
          ウェイト変動に応じた売買金額に対して往復0.1%の取引コストを適用。
          実際のコストは証券会社や取引量により異なります。
        </p>
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          ※ 本システムは月次リバランスを前提としています。リバランス頻度を下げると
          取引コストは減少しますが、ポートフォリオが目標配分から乖離します。
        </p>
      </div>
    </div>
  );
}

export default VolatilityPumpingCard;
