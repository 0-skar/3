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
            caller: notificationData.caller, 
        }
    };
    
    if (notificationData.type === 'incoming_call') {
        options.tag = `incoming-call-${notificationData.caller}`;
        options.requireInteraction = true;
        
        // <<< POCZĄTEK NOWEJ LOGIKI DŹWIĘKU I WIBRACJI >>>
        // UWAGA: Plik 'ringtone.mp3' musi znajdować się w głównym katalogu Twojej strony.
        options.sound = 'ringtone.mp3'; 
        // Wibracja: 200ms wibracji, 100ms pauzy, powtórzone
        options.vibrate = [200, 100, 200, 100, 200, 100, 200];
        // <<< KONIEC NOWEJ LOGIKI DŹWIĘKU I WIBRACJI >>>

        options.actions = [
            { action: 'answer', title: 'Odbierz' },
            { action: 'decline', title: 'Odrzuć' }
        ];
    }

    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Kliknięto w powiadomienie.');
    const urlToOpen = event.notification.data.url;
    event.notification.close();

    if (event.action === 'answer') {
        console.log('[Service Worker] Wybrano akcję "Odbierz".');
        const promiseChain = clients.openWindow(urlToOpen);
        event.waitUntil(promiseChain);
    } else if (event.action === 'decline') {
        console.log('[Service Worker] Wybrano akcję "Odrzuć".');
        // Tutaj można w przyszłości wysłać sygnał odrzucenia do serwera
    } else {
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
});
