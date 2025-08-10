// Plik: service-worker.js - Wersja z poprawną, relatywną ścieżką

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

    switch (event.action) {
        case 'answer':
            console.log('[Service Worker] Akcja: Odbierz. Otwieram ekran połączenia...');
            
            // <<< KLUCZOWA POPRAWKA: Usunięto ukośnik na początku ścieżki >>>
            const callUrl = `call.html?caller=${data.caller}`;
            
            event.waitUntil(clients.openWindow(callUrl));
            break;

        case 'decline':
            console.log('[Service Worker] Akcja: Odrzuć.');
            break;

        default:
            console.log('[Service Worker] Domyślne kliknięcie.');
            if (data.url) {
                // Tutaj również usuwamy ukośnik, jeśli istnieje, dla spójności
                const targetUrl = data.url.startsWith('/') ? data.url.substring(1) : data.url;
                event.waitUntil(clients.openWindow(targetUrl));
            }
            break;
    }
});
