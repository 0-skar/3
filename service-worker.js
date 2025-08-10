self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');
    let notificationData = {};
    try {
        notificationData = event.data.json();
    } catch (e) {
        return; // Nie rób nic jeśli dane są niepoprawne
    }
    
    const title = notificationData.title;
    const options = {
        body: notificationData.body,
        icon: 'icon-192.png',
        badge: 'badge-72.png',
        data: notificationData // Przekazujemy wszystkie dane
    };
    
    if (notificationData.type === 'incoming_call') {
        options.tag = `incoming-call-${notificationData.caller}`;
        options.requireInteraction = true; // Wymaga interakcji
        options.actions = [
            { action: 'answer', title: 'Odbierz' },
            { action: 'decline', title: 'Odrzuć' }
        ];
    }
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const data = event.notification.data;

    // Zawsze otwieraj nową stronę połączenia, gdy kliknięto Odbierz
    if (event.action === 'answer') {
        const urlToOpen = `/call.html?caller=${data.caller}&callee=${data.callee}`;
        event.waitUntil(clients.openWindow(urlToOpen));
    } else if (event.action === 'decline') {
        // Można tu wysłać sygnał odrzucenia do serwera
    } else {
        // Domyślne kliknięcie (jeśli nie w przycisk)
        // otwiera czat na forum, jeśli to wiadomość
        if (data.url) {
            event.waitUntil(clients.openWindow(data.url));
        }
    }
});
