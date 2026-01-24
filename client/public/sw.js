const CACHE_NAME = 'holy-grail-v2';
const STATIC_CACHE = 'holy-grail-static-v2';
const DYNAMIC_CACHE = 'holy-grail-dynamic-v2';

// 静的アセット（必ずキャッシュ）
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.png'
];

// キャッシュ対象のパターン
const CACHEABLE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.ico$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Install event - 静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('holy-grail-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - ネットワーク優先、フォールバックでキャッシュ
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API requests (always fetch from network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 静的アセットはキャッシュ優先
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // キャッシュ可能なリソースはネットワーク優先
  if (isCacheable(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // HTMLページはネットワーク優先
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // その他はネットワーク優先
  event.respondWith(networkFirst(request));
});

// キャッシュ優先戦略
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// ネットワーク優先戦略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // 成功したらキャッシュに保存
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // ネットワークエラー時はキャッシュから取得
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    
    // HTMLリクエストの場合はオフラインページを返す
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineCache = await caches.match('/');
      if (offlineCache) {
        return offlineCache;
      }
    }
    
    console.log('[SW] Network first failed:', error);
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// キャッシュ可能かどうかを判定
function isCacheable(request) {
  const url = request.url;
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
}

// メッセージリスナー（キャッシュクリア用）
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW] All caches cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || '新しい通知があります',
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '聖杯ポートフォリオ', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 既存のウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
