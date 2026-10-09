importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBys2mIwb6lmTV_Vvl0Mo_-A1X5McinfY8",
  authDomain: "arrows-push-notification.firebaseapp.com",
  projectId: "arrows-push-notification",
  storageBucket: "arrows-push-notification.firebasestorage.app",
  messagingSenderId: "358002349295",
  appId: "1:358002349295:web:3082cf57a02c207bb6371a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
});
