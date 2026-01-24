import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  install: () => Promise<boolean>;
  dismiss: () => void;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
}

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7日間

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // iOS判定
  const isIOS = typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !(window as unknown as { MSStream?: unknown }).MSStream;
  
  // スタンドアロンモード判定（PWAとして起動されているか）
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
  
  // 却下済みかどうかをチェック
  const isDismissed = useCallback(() => {
    if (typeof localStorage === 'undefined') return false;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed, 10);
    if (Date.now() - dismissedTime > DISMISSED_DURATION) {
      localStorage.removeItem(DISMISSED_KEY);
      return false;
    }
    return true;
  }, []);
  
  // インストール可能かどうか
  const isInstallable = !isInstalled && !isStandalone && !isDismissed() && (
    deferredPrompt !== null || isIOS
  );
  
  useEffect(() => {
    // すでにインストール済みかチェック
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }
    
    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    // appinstalledイベントをリッスン
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);
  
  // インストール実行
  const install = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return false;
    }
    
    if (!deferredPrompt) {
      return false;
    }
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [deferredPrompt, isIOS]);
  
  // 却下
  const dismiss = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    }
    setDeferredPrompt(null);
    setShowIOSInstructions(false);
  }, []);
  
  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    install,
    dismiss,
    showIOSInstructions,
    setShowIOSInstructions,
  };
}
