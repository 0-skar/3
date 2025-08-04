// Plik: service-worker.js

self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');

    let notificationData = {
        title: 'Nowa wiadomość',
        body: 'Otrzymałeś nową wiadomość.',
        url: '/'
    };
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    const title = notificationData.title;
    const options = {
        body: notificationData.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
            // Upewniamy się, że URL jest zapisany w danych powiadomienia
            url: notificationData.url
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});


// <<< CAŁKOWICIE NOWA, POPRAWIONA LOGIKA KLIKNIĘCIA >>>
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Kliknięto w powiadomienie.');
    const urlToOpen = event.notification.data.url;
    event.notification.close();

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientList => {
        // Spróbuj znaleźć otwartą kartę z aplikacją, aby ją przeładować i uaktywnić
        for (const client of clientList) {
            // Sprawdzamy, czy klient (karta) może być nawigowany do nowego URL
            if ('navigate' in client) {
                // Przeładuj istniejącą kartę do nowego URL i ją uaktywnij
                return client.navigate(urlToOpen).then(c => c.focus());
            }
        }
        
        // Jeśli żadna karta nie jest otwarta, otwórz nową
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
