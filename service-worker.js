--- START OF FILE service-worker.js ---

// Plik: service-worker.js - Wersja ostateczna, z ujednoliconą obsługą kliknięć

self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');
    let notificationData = {};
    try {
        notificationData = event.data.json();
    } catch (e) {
        console.error('[Service Worker] Błąd parsowania danych powiadomienia:', e);
        return;
    }
    
    const title = notificationData.title;
    const options = {
        body: notificationData.body,
        icon: 'icon-192.png',
        badge: 'badge-72.png',
        data: notificationData
    };
    
    if (notificationData.type === 'incoming_call') {
        options.tag = `incoming-call-${notificationData.caller}`;
        options.requireInteraction = true;
        options.actions = [
            { action: 'answer', title: 'Odbierz' },
            { action: 'decline', title: 'Odrzuć' }
        ];
        options.vibrate = [200, 100, 200, 100, 200];
    }

    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', event => {
    event.notification.close();
    const data = event.notification.data;

    const swPath = self.location.pathname;
    const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
    
    // <<< POCZĄTEK KLUCZOWEJ POPRAWKI >>>
    // Sprawdzamy, czy to jest powiadomienie o połączeniu
    if (data.type === 'incoming_call') {
        // Jeśli tak, to niezależnie od tego, czy kliknięto 'Odbierz' czy samą notyfikację,
        // wykonujemy akcję odbierania (chyba że kliknięto 'Odrzuć').
        if (event.action !== 'decline') {
            console.log('[Service Worker] Akcja Odbierz (z przycisku lub treści). Otwieram ekran połączenia...');
            const callUrl = `${basePath}call.html?caller=${data.caller}`;
            event.waitUntil(clients.openWindow(callUrl));
        } else {
            console.log('[Service Worker] Akcja: Odrzuć.');
            // Nic nie rób
        }
    } else {
        // Jeśli to inne powiadomienie (np. o wiadomości tekstowej)
        console.log('[Service Worker] Domyślne kliknięcie dla wiadomości.');
        if (data.url) {
            event.waitUntil(clients.openWindow(data.url));
        }
    }
    // <<< KONIEC KLUCZOWEJ POPRAWKI >>>
});
