self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event.data?.json() ?? {}));
});

async function handlePush(data) {
  const { title = 'IPL Predictor', body = '', icon = '/favicon.ico', tag, data: notifData = {} } = data;

  const options = {
    body,
    icon,
    badge: '/favicon.ico',
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
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
