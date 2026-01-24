import { motion } from 'framer-motion';
import { Bell, BellOff, Loader2, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useState } from 'react';

export function AlertSettings() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();
  const [testSent, setTestSent] = useState(false);

  const { data: subscription, isLoading } = trpc.alerts.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = trpc.alerts.updateSubscription.useMutation({
    onSuccess: () => {
      utils.alerts.getSubscription.invalidate();
    },
  });

  const testMutation = trpc.alerts.testNotification.useMutation({
    onSuccess: () => {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    },
  });

  const isEnabled = subscription?.enabled === 1;

  const handleToggle = () => {
    updateMutation.mutate({ enabled: !isEnabled });
  };

  const handleTestNotification = () => {
    testMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">アラート設定</h3>
            <p className="text-xs text-muted-foreground">市場環境変化時の通知</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            アラート機能を利用するにはログインが必要です
          </p>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-card"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">アラート設定</h3>
          <p className="text-xs text-muted-foreground">市場環境変化時の通知</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">ログイン中:</span>
          <span className="text-sm font-medium text-foreground">
            {user?.name || user?.email || 'ユーザー'}
          </span>
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isEnabled ? '通知ON' : '通知OFF'}
            </p>
            <p className="text-xs text-muted-foreground">
              市場環境が変化した際に通知を受け取る
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={updateMutation.isPending}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted'
          } ${updateMutation.isPending ? 'opacity-50' : ''}`}
        >
          <motion.div
            animate={{ x: isEnabled ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      {/* Test Notification Button */}
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <button
            onClick={handleTestNotification}
            disabled={testMutation.isPending || testSent}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              testSent
                ? 'bg-[oklch(0.75_0.2_145)]/20 text-[oklch(0.75_0.2_145)] border border-[oklch(0.75_0.2_145)]/30'
                : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
            } disabled:opacity-50`}
          >
            {testMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                送信中...
              </span>
            ) : testSent ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                テスト通知を送信しました
              </span>
            ) : (
              'テスト通知を送信'
            )}
          </button>
        </motion.div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p>※ 市場環境が好況→不況、または不況→好況に変化した際に通知されます</p>
      </div>
    </motion.div>
  );
}
