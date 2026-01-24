import { motion } from 'framer-motion';
import { Database, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BatchStatus {
  batchId: string;
  status: 'running' | 'success' | 'failed';
  startedAt: Date | string;
  completedAt: Date | string | null;
  symbolsProcessed: number;
  symbolsFailed: number;
  fallbackUsed: number;
  errorMessage: string | null;
  durationMs: number | null;
}

export function BatchStatusIndicator() {
  const { data: batchStatus, isLoading } = trpc.batch.getStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分
    refetchInterval: 5 * 60 * 1000, // 5分ごとに更新
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  if (!batchStatus) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-mono text-yellow-500">バッチ未実行</span>
      </div>
    );
  }

  const status = batchStatus as BatchStatus;
  const isSuccess = status.status === 'success';
  const isFailed = status.status === 'failed';
  const isRunning = status.status === 'running';

  // 日時をフォーマット
  const formatDate = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 経過時間を計算
  const getAgeText = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}日前`;
    } else if (diffHours > 0) {
      return `${diffHours}時間${diffMinutes}分前`;
    } else {
      return `${diffMinutes}分前`;
    }
  };

  // ステータスに応じたスタイル
  const getStatusStyle = () => {
    if (isRunning) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    } else if (isSuccess) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    } else {
      return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    } else if (isSuccess) {
      return <CheckCircle className="w-4 h-4" />;
    } else {
      return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (isRunning) return '実行中';
    if (isSuccess) return '成功';
    return '失敗';
  };

  const completedDate = status.completedAt || status.startedAt;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-help ${getStatusStyle()}`}
        >
          <Database className="w-4 h-4" />
          {getStatusIcon()}
          <div className="flex flex-col">
            <span className="text-xs font-mono font-semibold">
              DB更新: {getStatusText()}
            </span>
            <span className="text-[10px] font-mono opacity-70">
              {getAgeText(completedDate)}
            </span>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2 text-xs">
          <div className="font-semibold border-b border-border pb-1">
            バッチ実行ステータス
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">ステータス:</span>
            <span className={isSuccess ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-blue-400'}>
              {getStatusText()}
            </span>
            
            <span className="text-muted-foreground">実行日時:</span>
            <span>{formatDate(status.startedAt)}</span>
            
            {status.completedAt && (
              <>
                <span className="text-muted-foreground">完了日時:</span>
                <span>{formatDate(status.completedAt)}</span>
              </>
            )}
            
            <span className="text-muted-foreground">処理銘柄:</span>
            <span>{status.symbolsProcessed}件</span>
            
            {status.symbolsFailed > 0 && (
              <>
                <span className="text-muted-foreground">失敗銘柄:</span>
                <span className="text-red-400">{status.symbolsFailed}件</span>
              </>
            )}
            
            {status.durationMs && (
              <>
                <span className="text-muted-foreground">処理時間:</span>
                <span>{(status.durationMs / 1000).toFixed(1)}秒</span>
              </>
            )}
          </div>
          
          {status.errorMessage && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-red-400 font-semibold">エラー:</span>
              <p className="text-red-300 mt-1 break-words">{status.errorMessage}</p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * コンパクト版バッチステータスバッジ（ヘッダー用）
 */
export function BatchStatusBadge() {
  const { data: batchStatus, isLoading } = trpc.batch.getStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading || !batchStatus) {
    return null;
  }

  const status = batchStatus as BatchStatus;
  const isSuccess = status.status === 'success';
  const completedDate = status.completedAt || status.startedAt;

  // 経過時間を計算
  const getAgeText = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-help ${
          isSuccess 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {isSuccess ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>DB {getAgeText(completedDate)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-xs">
          <div className="font-semibold">最終DB更新</div>
          <div className="text-muted-foreground">
            {new Date(completedDate).toLocaleString('ja-JP')}
          </div>
          <div className={isSuccess ? 'text-emerald-400' : 'text-red-400'}>
            {isSuccess ? '成功' : '失敗'} - {status.symbolsProcessed}銘柄
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
