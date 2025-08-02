// Plik: service-worker.js

self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');

    let notificationData = {};
    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData.title = "Nowa wiadomość";
        notificationData.body = event.data.text();
        notificationData.url = '/';
    }
    
    const title = notificationData.title || 'Nowa wiadomość';
    const options = {
        body: notificationData.body || 'Otrzymałeś nową wiadomość.',
        icon: '/icon-192.png', // Opcjonalnie: umieść ikonę w głównym folderze
        badge: '/badge-72.png', // Opcjonalnie: umieść mniejszą ikonę
        data: {
            url: notificationData.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Kliknięto w powiadomienie.');

    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientList => {
        for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            // Próba znalezienia już otwartej karty.
            // Sprawdzamy tylko główny URL, bez parametrów, aby przełączyć się na już otwartą aplikację.
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen);
            if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
                return client.focus();
            }
        }
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
