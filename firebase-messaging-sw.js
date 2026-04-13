importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDhIdZvvWiBinhIYz5Z3E1fJn00eRlahTk",
    authDomain: "bus-system-notification.firebaseapp.com",
    projectId: "bus-system-notification",
    storageBucket: "bus-system-notification.firebasestorage.app",
    messagingSenderId: "335430946794",
    appId: "1:335430946794:web:c99c758511332d1ca8ac93",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});