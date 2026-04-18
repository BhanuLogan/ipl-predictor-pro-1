const CACHE_NAME = 'ipl-polls-v1';
const OFFLINE_URLS = ['/', '/index.html'];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Let non-GET and API requests pass through untouched
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML/asset responses
        if (response.ok && (event.request.mode === 'navigate' || event.request.destination === 'image' || event.request.destination === 'style' || event.request.destination === 'script')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event.data?.json() ?? {}));
});

async function handlePush(data) {
  const { title = 'IPL Predictor', body = '', icon = '/ipl-icon.png', tag, data: notifData = {} } = data;

  const options = {
    body,
    icon,
    badge: '/ipl-icon.png',
    data: notifData,
    vibrate: [200, 100, 200],
  };

  if (!tag) {
    return self.registration.showNotification(title, options);
  }

  // Try to group same-tag notifications; fall back to simple show on any error
  try {
    const existing = await self.registration.getNotifications({ tag });
    const prevData = existing[0]?.data ?? {};
    const count = (prevData.count ?? 0) + 1;

    const prevSenders = prevData.senders ?? [];
    const sender = notifData.sender;
    const senders = sender && !prevSenders.includes(sender)
      ? [...prevSenders, sender]
      : prevSenders;

    const roomName = notifData.roomName ?? prevData.roomName ?? '';

    const finalTitle = count > 1
      ? (roomName ? `${roomName} · ${count} new messages` : `${count} new messages`)
      : title;
    const finalBody = count > 1 && senders.length > 0 ? senders.join(', ') : body;

    existing.forEach(n => n.close());

    return self.registration.showNotification(finalTitle, {
      ...options,
      tag,
      renotify: true,
      data: { ...notifData, senders, count },
    });
  } catch {
    // getNotifications not supported or failed — show without grouping
    return self.registration.showNotification(title, { ...options, tag, renotify: true });
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
