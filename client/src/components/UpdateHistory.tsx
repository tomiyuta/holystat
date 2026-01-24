import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface UpdateHistoryProps {
  className?: string;
}

export function UpdateHistory({ className = "" }: UpdateHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [limit, setLimit] = useState(10);
  
  const { data: history, isLoading, error } = trpc.refresh.getHistory.useQuery(
    { limit },
    { 
      refetchInterval: 60000, // 1分ごとに更新
      staleTime: 30000,
    }
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}秒`;
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case "signals":
        return "シグナル";
      case "portfolio":
        return "ポートフォリオ";
      case "all":
        return "全データ";
      default:
        return type;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "manual":
        return "手動";
      case "scheduled":
        return "自動";
      case "system":
        return "システム";
      default:
        return source;
    }
  };

  const getRegimeColor = (regime: string | null) => {
    switch (regime) {
      case "bull":
        return "text-green-400";
      case "bear":
        return "text-red-400";
      case "neutral":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>更新履歴を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="w-4 h-4" />
          <span>更新履歴の取得に失敗しました</span>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>更新履歴がありません</span>
        </div>
      </div>
    );
  }

  const displayHistory = isExpanded ? history : history.slice(0, 5);

  return (
    <div className={`bg-gray-800/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white">データ更新履歴</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-gray-700 text-gray-300 text-sm rounded px-2 py-1 border border-gray-600"
          >
            <option value={10}>最新10件</option>
            <option value={20}>最新20件</option>
            <option value={50}>最新50件</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="divide-y divide-gray-700/50">
        {displayHistory.map((item) => (
          <div
            key={item.id}
            className={`px-4 py-3 hover:bg-gray-700/30 transition-colors ${
              item.success ? "" : "bg-red-900/10"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Status and Type */}
              <div className="flex items-start gap-3">
                {item.success ? (
                  item.usedFallback ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  )
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">
                      {getUpdateTypeLabel(item.updateType)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.source === "manual" 
                        ? "bg-blue-500/20 text-blue-300" 
                        : item.source === "scheduled"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}>
                      {getSourceLabel(item.source)}
                    </span>
                    {item.regime && (
                      <span className={`text-sm ${getRegimeColor(item.regime)}`}>
                        {item.regimeJapanese || item.regime}
                      </span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="mt-1 text-sm text-gray-400 space-y-0.5">
                    {item.holdingsCount !== null && (
                      <div>銘柄数: {item.holdingsCount}</div>
                    )}
                    {item.usedFallback === 1 && (
                      <div className="text-amber-400">
                        フォールバック使用: {item.fallbackCount || 0}件
                        {item.fallbackReason && (
                          <span className="text-gray-500 ml-1">
                            ({item.fallbackReason})
                          </span>
                        )}
                      </div>
                    )}
                    {!item.success && item.errorMessage && (
                      <div className="text-red-400">
                        エラー: {item.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Time and Duration */}
              <div className="text-right text-sm flex-shrink-0">
                <div className="text-gray-300">{formatDate(item.createdAt)}</div>
                <div className="text-gray-500">
                  処理時間: {formatDuration(item.durationMs)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      {history.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              折りたたむ
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              さらに表示 ({history.length - 5}件)
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default UpdateHistory;
