/**
 * シミュレーション条件バッジコンポーネント
 * 
 * 数値表示部分に目立つ形でシミュレーション条件を表示
 * - 取引コスト0.2%考慮
 * - サバイバーシップバイアス補正（年率-2%）
 * - 期間: 2004年8月〜2025年11月（256ヶ月）
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Calendar, TrendingDown, DollarSign } from "lucide-react";
import { simulationConditions } from "@/data/homeData";

interface SimulationConditionsBadgeProps {
  variant?: "compact" | "full" | "inline";
  showTooltip?: boolean;
  className?: string;
}

export function SimulationConditionsBadge({
  variant = "compact",
  showTooltip = true,
  className = "",
}: SimulationConditionsBadgeProps) {
  const conditions = [
    {
      icon: DollarSign,
      label: `取引コスト${simulationConditions.tradingCost}%`,
      description: "各リバランス時に片道0.2%の取引コストを考慮",
      color: "text-blue-400",
    },
    {
      icon: TrendingDown,
      label: `バイアス補正-${simulationConditions.survivorshipBiasCorrection}%/年`,
      description: "サバイバーシップバイアス補正として年率2%を差し引き",
      color: "text-amber-400",
    },
    {
      icon: Calendar,
      label: `${simulationConditions.period.start}〜${simulationConditions.period.end}`,
      description: `${simulationConditions.period.months}ヶ月（${simulationConditions.period.years}年）のバックテスト期間`,
      color: "text-emerald-400",
    },
  ];

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {conditions.map((condition, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="bg-background/50 border-border/50 text-xs font-mono cursor-help"
              >
                <condition.icon className={`w-3 h-3 mr-1 ${condition.color}`} />
                {condition.label}
              </Badge>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{condition.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 cursor-help ${className}`}
          >
            <Info className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              シミュレーション条件
            </span>
          </div>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent side="bottom" className="max-w-sm p-3">
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-2">バックテスト条件</p>
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-2">
                  <condition.icon className={`w-4 h-4 mt-0.5 ${condition.color}`} />
                  <div>
                    <p className="text-sm font-medium">{condition.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {condition.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  // variant === "full"
  return (
    <div
      className={`rounded-lg border border-primary/30 bg-primary/5 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-sm text-primary">
          シミュレーション条件
        </h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {conditions.map((condition, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded-md bg-background/50"
          >
            <condition.icon className={`w-5 h-5 mt-0.5 ${condition.color}`} />
            <div>
              <p className="text-sm font-medium">{condition.label}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {condition.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * シンプルなインラインバッジ（数値の横に配置用）
 */
export function SimulationConditionsInline({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
        コスト{simulationConditions.tradingCost}%
      </Badge>
      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
        バイアス補正-{simulationConditions.survivorshipBiasCorrection}%
      </Badge>
      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
        {simulationConditions.period.months}ヶ月BT
      </Badge>
    </div>
  );
}

/**
 * ヘッダー用のコンパクトな条件表示
 */
export function SimulationConditionsHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-xs text-muted-foreground font-mono ${className}`}>
      <span className="flex items-center gap-1">
        <DollarSign className="w-3 h-3 text-blue-400" />
        {simulationConditions.tradingCost}%コスト
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3 text-amber-400" />
        -{simulationConditions.survivorshipBiasCorrection}%/年補正
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1">
        <Calendar className="w-3 h-3 text-emerald-400" />
        {simulationConditions.period.start}〜{simulationConditions.period.end}
      </span>
    </div>
  );
}

export default SimulationConditionsBadge;
