// Plik: service-worker.js

self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');

    let notificationData = {};
    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData = {
            type: 'message',
            title: 'Nowa wiadomość',
            body: event.data.text(),
            url: '/'
        };
    }
    
    const title = notificationData.title;
    const options = {
        body: notificationData.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
            url: notificationData.url,
            // Przekazujemy dodatkowe dane
            caller: notificationData.caller, 
        }
    };
    
    // <<< POCZĄTEK NOWEJ LOGIKI DLA TYPÓW POWIADOMIEŃ >>>
    if (notificationData.type === 'incoming_call') {
        options.tag = `incoming-call-${notificationData.caller}`; // Tag, by zastępować powiadomienia
        options.requireInteraction = true; // Wymaga interakcji użytkownika
        options.actions = [
            { action: 'answer', title: 'Odbierz' },
            { action: 'decline', title: 'Odrzuć' }
        ];
    }
    // <<< KONIEC NOWEJ LOGIKI DLA TYPÓW POWIADOMIEŃ >>>

    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Kliknięto w powiadomienie.');
    const urlToOpen = event.notification.data.url;
    event.notification.close();

    // <<< POCZĄTEK NOWEJ LOGIKI OBSŁUGI AKCJI >>>
    if (event.action === 'answer') {
        console.log('[Service Worker] Wybrano akcję "Odbierz".');
        // Otwórz okno z URL, który zawiera akcję do wykonania
        const promiseChain = clients.openWindow(urlToOpen);
        event.waitUntil(promiseChain);
    } else if (event.action === 'decline') {
        console.log('[Service Worker] Wybrano akcję "Odrzuć".');
        // Nic więcej nie rób, powiadomienie jest już zamknięte.
        // Opcjonalnie: można by wysłać sygnał odrzucenia do serwera
        // fetch('/api/decline-call', { method: 'POST', body: JSON.stringify({ caller: event.notification.data.caller }) });
    } else {
        // Domyślne zachowanie (kliknięcie w samo powiadomienie)
        const promiseChain = clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            for (const client of clientList) {
                if ('navigate' in client) {
                    return client.navigate(urlToOpen).then(c => c.focus());
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        });
        event.waitUntil(promiseChain);
    }
    // <<< KONIEC NOWEJ LOGIKI OBSŁUGI AKCJI >>>
});
