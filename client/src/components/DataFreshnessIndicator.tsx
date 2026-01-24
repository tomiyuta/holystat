/**
 * データ鮮度表示コンポーネント
 * 
 * 最終更新時刻と鮮度状態を表示し、
 * 段階的な警告（24h/48h/72h）を提供
 */

import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface DataFreshnessIndicatorProps {
  className?: string;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export function DataFreshnessIndicator({
  className,
  showRefreshButton = false,
  compact = false,
}: DataFreshnessIndicatorProps) {
  const { data: freshness, isLoading, refetch } = trpc.batch.getFreshness.useQuery(undefined, {
    refetchInterval: 60000, // 1分ごとに更新
  });

  const refreshMutation = trpc.refresh.all.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  if (!freshness) {
    return null;
  }

  // 鮮度に応じたスタイルとアイコンを決定
  const getStatusConfig = () => {
    if (freshness.isCritical) {
      return {
        icon: AlertCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        borderColor: "border-destructive/30",
        label: "重大",
        description: "データが72時間以上更新されていません",
      };
    }
    if (freshness.isVeryStale) {
      return {
        icon: AlertTriangle,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        label: "警告",
        description: "データが48時間以上更新されていません",
      };
    }
    if (freshness.isStale) {
      return {
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        label: "注意",
        description: "データが24時間以上更新されていません",
      };
    }
    return {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      label: "正常",
      description: "データは最新です",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // 最終更新時刻のフォーマット
  const lastUpdatedText = freshness.lastUpdated
    ? formatDistanceToNow(new Date(freshness.lastUpdated), { addSuffix: true, locale: ja })
    : "不明";

  const lastUpdatedFull = freshness.lastUpdated
    ? new Date(freshness.lastUpdated).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "不明";

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 cursor-help", className)}>
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-xs", config.color)}>{lastUpdatedText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            <p className="text-xs text-muted-foreground">最終更新: {lastUpdatedFull}</p>
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
            <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
            <span className="text-xs text-muted-foreground">• {lastUpdatedText}</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {showRefreshButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate({})}
          disabled={refreshMutation.isPending}
          className="shrink-0"
        >
          {refreshMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">更新</span>
        </Button>
      )}
    </div>
  );
}

/**
 * ステータスバー用のコンパクトな鮮度インジケーター
 */
export function DataFreshnessStatus({ className }: { className?: string }) {
  const { data: freshness } = trpc.batch.getFreshness.useQuery(undefined, {
    refetchInterval: 60000,
  });

  if (!freshness?.lastUpdated) {
    return null;
  }

  const getStatusColor = () => {
    if (freshness.isCritical) return "bg-destructive";
    if (freshness.isVeryStale) return "bg-orange-500";
    if (freshness.isStale) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-2 cursor-help", className)}>
          <div className={cn("h-2 w-2 rounded-full", getStatusColor())} />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(freshness.lastUpdated), { addSuffix: true, locale: ja })}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          最終更新:{" "}
          {new Date(freshness.lastUpdated).toLocaleString("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
