// Plik: service-worker.js - Wersja z obsługą strony call.html

/**
 * Nasłuchuje na przychodzące powiadomienia push z serwera.
 */
self.addEventListener('push', event => {
    console.log('[Service Worker] Otrzymano powiadomienie push.');
    let notificationData = {};

    try {
        notificationData = event.data.json();
    } catch (e) {
        console.error('[Service Worker] Błąd parsowania danych powiadomienia:', e);
        // Jeśli dane są niepoprawne, nie rób nic
        return;
    }
    
    const title = notificationData.title;
    const options = {
        body: notificationData.body,
        icon: 'icon-192.png', // Ikona główna
        badge: 'badge-72.png', // Mała ikona na pasku statusu (Android)
        data: notificationData // Przekazujemy wszystkie dane (w tym URL, caller itp.) do obsługi kliknięcia
    };
    
    // Specjalna obsługa dla powiadomień o połączeniu
    if (notificationData.type === 'incoming_call') {
        // Tag sprawia, że nowe połączenie od tej samej osoby zastąpi poprzednie powiadomienie,
        // zamiast tworzyć wiele powiadomień.
        options.tag = `incoming-call-${notificationData.caller}`;
        
        // Wymusza, aby powiadomienie pozostało na ekranie, dopóki użytkownik nie wejdzie z nim w interakcję.
        options.requireInteraction = true;
        
        // Dodajemy przyciski "Odbierz" i "Odrzuć"
        options.actions = [
            { action: 'answer', title: 'Odbierz' },
            { action: 'decline', title: 'Odrzuć' }
        ];

        // Dodajemy wibracje, które są kluczowe na urządzeniach mobilnych.
        // Format: [wibracja, pauza, wibracja, pauza, ...] w milisekundach.
        options.vibrate = [200, 100, 200, 100, 200];
    }

    // Wyświetl powiadomienie z przygotowanymi opcjami
    event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Nasłuchuje na kliknięcia w powiadomienie lub w jego przyciski akcji.
 */
self.addEventListener('notificationclick', event => {
    // Zamknij powiadomienie po kliknięciu
    event.notification.close();

    const data = event.notification.data;

    // Sprawdź, w który przycisk kliknięto (jeśli w ogóle)
    switch (event.action) {
        case 'answer':
            // Użytkownik kliknął "Odbierz"
            console.log('[Service Worker] Akcja: Odbierz. Otwieram ekran połączenia...');
            // Tworzymy URL do naszej lekkiej strony `call.html`, przekazując nazwę dzwoniącego
            const callUrl = `/call.html?caller=${data.caller}`;
            event.waitUntil(clients.openWindow(callUrl));
            break;

        case 'decline':
            // Użytkownik kliknął "Odrzuć"
            console.log('[Service Worker] Akcja: Odrzuć.');
            // Nic więcej nie robimy. W przyszłości można by tu wysłać sygnał do serwera.
            break;

        default:
            // Użytkownik kliknął w treść powiadomienia (nie w przycisk)
            console.log('[Service Worker] Domyślne kliknięcie.');
            // Jeśli to było zwykłe powiadomienie o wiadomości, otworzy ono standardowy URL forum
            if (data.url) {
                event.waitUntil(clients.openWindow(data.url));
            }
            break;
    }
});
