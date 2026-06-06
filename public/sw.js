// Minimal service worker — its only job is to make Rose installable to the
// home screen. It does NOT intercept requests, so it can never serve stale
// content or interfere with navigation/login.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Intentionally empty: let the browser handle every request normally.
});
