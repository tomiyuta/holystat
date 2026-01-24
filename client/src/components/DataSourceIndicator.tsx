/**
 * データソース表示コンポーネント
 * 
 * データの出所（バッチ処理/リアルタイム/フォールバック）と
 * 鮮度を視覚的に表示する
 */

import { Database, Wifi, AlertTriangle, Clock, CheckCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export type DataSource = "batch" | "realtime" | "fallback" | "monthly";

interface DataSourceIndicatorProps {
  dataSource: DataSource;
  dataSourceLabel: string;
  dataAge: number; // 時間単位
  lastUpdated: Date | string;
  freshnessWarning?: {
    level: "none" | "info" | "warning" | "error";
    message: string;
  } | null;
  className?: string;
  compact?: boolean;
}

export function DataSourceIndicator({
  dataSource,
  dataSourceLabel,
  dataAge,
  lastUpdated,
  freshnessWarning,
  className,
  compact = false,
}: DataSourceIndicatorProps) {
  // データソースに応じたアイコンと色を決定
  const getSourceConfig = () => {
    switch (dataSource) {
      case "batch":
        return {
          icon: Database,
          color: "text-cyan-400",
          bgColor: "bg-cyan-500/10",
          borderColor: "border-cyan-500/30",
          label: "バッチ",
          description: "定期バッチ処理で取得したデータ",
        };
      case "realtime":
        return {
          icon: Wifi,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          label: "リアルタイム",
          description: "リアルタイムで取得したデータ",
        };
      case "fallback":
        return {
          icon: AlertTriangle,
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          label: "フォールバック",
          description: "バックアップデータを使用中",
        };
      default:
        return {
          icon: Database,
          color: "text-muted-foreground",
          bgColor: "bg-muted/10",
          borderColor: "border-muted/30",
          label: "不明",
          description: "データソース不明",
        };
    }
  };

  // 鮮度に応じたステータスアイコン
  const getFreshnessIcon = () => {
    if (freshnessWarning?.level === "error") {
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    }
    if (freshnessWarning?.level === "warning") {
      return <Clock className="h-3 w-3 text-amber-400" />;
    }
    return <CheckCircle className="h-3 w-3 text-green-400" />;
  };

  const config = getSourceConfig();
  const Icon = config.icon;

  // 最終更新時刻のフォーマット
  const lastUpdatedDate = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const lastUpdatedText = formatDistanceToNow(lastUpdatedDate, { addSuffix: true, locale: ja });
  const lastUpdatedFull = lastUpdatedDate.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border cursor-help",
              config.bgColor,
              config.borderColor,
              className
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
            <span className={cn("text-xs font-mono", config.color)}>{config.label}</span>
            {getFreshnessIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className="font-medium">{dataSourceLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <div className="text-xs space-y-1 pt-1 border-t border-border">
              <p>
                <span className="text-muted-foreground">最終更新:</span> {lastUpdatedFull}
              </p>
              <p>
                <span className="text-muted-foreground">経過時間:</span>{" "}
                {dataAge >= 0 ? `${dataAge.toFixed(1)}時間` : "不明"}
              </p>
            </div>
            {freshnessWarning && freshnessWarning.level !== "none" && (
              <p className={cn(
                "text-xs",
                freshnessWarning.level === "error" ? "text-destructive" : "text-amber-400"
              )}>
                {freshnessWarning.message}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", config.color)} />
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", config.color)}>{dataSourceLabel}</span>
            <span className="text-xs text-muted-foreground">• {lastUpdatedText}</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>
      {freshnessWarning && freshnessWarning.level !== "none" && (
        <div className={cn(
          "text-xs px-2 py-1 rounded",
          freshnessWarning.level === "error" 
            ? "bg-destructive/20 text-destructive" 
            : "bg-amber-500/20 text-amber-400"
        )}>
          {freshnessWarning.level === "error" ? "要更新" : "注意"}
        </div>
      )}
    </div>
  );
}

/**
 * ステータスバー用のコンパクトなデータソースインジケーター
 */
export function DataSourceBadge({
  dataSource,
  dataAge,
  lastUpdated,
  className,
}: {
  dataSource: DataSource;
  dataAge: number;
  lastUpdated: Date | string;
  className?: string;
}) {
  const getSourceConfig = () => {
    switch (dataSource) {
      case "batch":
        return {
          icon: Database,
          color: "text-cyan-400",
          bgColor: "bg-cyan-500/10",
          borderColor: "border-cyan-500/30",
          label: "BATCH",
        };
      case "monthly":
        return {
          icon: Calendar,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
          label: "月次更新",
        };
      case "realtime":
        return {
          icon: Wifi,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          label: "LIVE",
        };
      case "fallback":
        return {
          icon: AlertTriangle,
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          label: "FALLBACK",
        };
      default:
        return {
          icon: Database,
          color: "text-muted-foreground",
          bgColor: "bg-muted/10",
          borderColor: "border-muted/30",
          label: "UNKNOWN",
        };
    }
  };

  const config = getSourceConfig();
  const Icon = config.icon;
  const lastUpdatedDate = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded border cursor-help",
            config.bgColor,
            config.borderColor,
            className
          )}
        >
          <Icon className={cn("h-3 w-3", config.color)} />
          <span className={cn("text-[10px] font-mono font-semibold", config.color)}>
            {config.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p className="font-medium">
            {dataSource === "batch" && "バッチ処理データ"}
            {dataSource === "monthly" && "月次更新データ"}
            {dataSource === "realtime" && "リアルタイムデータ"}
            {dataSource === "fallback" && "フォールバックデータ"}
          </p>
          <p className="text-muted-foreground">
            更新: {lastUpdatedDate.toLocaleString("ja-JP", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {dataAge >= 0 && (
            <p className="text-muted-foreground">経過: {dataAge.toFixed(1)}時間</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
