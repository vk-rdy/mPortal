self.importScripts('data/mPortalData.js');

//  Files to cache
var cacheName = 'mPortalCache';
var appShellFiles = [
  '/mPortal/login.html'
];

// Installing Service Worker
self.addEventListener('install', function(e) {
  console.log('[Service Worker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(appShellFiles);
    })
  );
});

// Fetching content using Service Worker
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      console.log('[Service Worker] Fetching resource: '+e.request.url);
      return r || fetch(e.request).then(function(response) {
        return caches.open(cacheName).then(function(cache) {
          console.log('[Service Worker] Caching new resource: '+e.request.url);
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});

self.importScripts('push-notifications-controller.js');

const pushNotificationTitle = 'mPortal';

self.addEventListener('push', function (event) {
    event.waitUntil(self.registration.showNotification(pushNotificationTitle, {
        body: event.data.text(),
        icon: '/img/tu.png'
    }));
});

self.addEventListener('pushsubscriptionchange', function (event) {
    const handlePushSubscriptionChangePromise = Promise.resolve();

    if (event.oldSubscription) {
        handlePushSubscriptionChangePromise = handlePushSubscriptionChangePromise.then(function () {
            return PushNotificationsController.discardPushSubscription(event.oldSubscription);
        });
    }

    if (event.newSubscription) {
        handlePushSubscriptionChangePromise = handlePushSubscriptionChangePromise.then(function () {
            return PushNotificationsController.storePushSubscription(event.newSubscription);
        });
    }

    if (!event.newSubscription) {
        handlePushSubscriptionChangePromise = handlePushSubscriptionChangePromise.then(function () {
            return PushNotificationsController.retrievePublicKey().then(function (applicationServerPublicKey) {
                return pushServiceWorkerRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerPublicKey
                }).then(function (pushSubscription) {
                    return PushNotificationsController.storePushSubscription(pushSubscription);
                });
            });
        });
    }

    event.waitUntil(handlePushSubscriptionChangePromise);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
});
