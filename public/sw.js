self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Aglir Propiedades', {
      body: data.body || 'Nueva solicitud de visita',
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      data: { url: data.url || '/gestion' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/gestion')
  );
});
