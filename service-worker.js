--- START OF FILE service-worker.js ---

// Plik: service-worker.js - Wersja ostateczna, świadoma podfolderu

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

    // <<< POCZĄTEK KLUCZOWEJ POPRAWKI: Inteligentne budowanie ścieżki >>>
    // Pobieramy pełną ścieżkę do samego pliku service-workera, np. "/3/service-worker.js"
    const swPath = self.location.pathname; 
    // Wycinamy z niej ścieżkę do folderu nadrzędnego, np. "/3/"
    const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
    // <<< KONIEC KLUCZOWEJ POPRAWKI >>>

    switch (event.action) {
        case 'answer':
            console.log('[Service Worker] Akcja: Odbierz. Otwieram ekran połączenia...');
            
            // Budujemy pełny, poprawny URL używając ścieżki bazowej
            const callUrl = `${basePath}call.html?caller=${data.caller}`;
            console.log(`[Service Worker] Otwieram URL: ${callUrl}`);
            
            event.waitUntil(clients.openWindow(callUrl));
            break;

        case 'decline':
            console.log('[Service Worker] Akcja: Odrzuć.');
            break;

        default:
            console.log('[Service Worker] Domyślne kliknięcie.');
            // Ta logika pozostaje bez zmian, ponieważ URL przychodzący od serwera
            // dla wiadomości tekstowych powinien być już poprawny.
            if (data.url) {
                event.waitUntil(clients.openWindow(data.url));
            }
            break;
    }
});
