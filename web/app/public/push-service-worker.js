/**
 * The push kernel's service worker (docs/push.md). Registered by the Settings
 * "Notifications" preference when the user explicitly enables push — never on
 * page load — so the permission prompt is always a response to a user action.
 *
 * Payloads are the JSON the backend's PushWrapper sends: { title, body }.
 */

self.addEventListener("push", (event) => {
    let payload = { title: "Notification", body: "" }
    try {
        payload = { ...payload, ...event.data.json() }
    } catch {
        // A non-JSON (or empty) payload still surfaces as a notification —
        // Web Push requires user-visible handling of every push event.
    }
    event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body }))
})

self.addEventListener("notificationclick", (event) => {
    event.notification.close()
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ("focus" in client) {
                    return client.focus()
                }
            }
            return self.clients.openWindow("/")
        }),
    )
})
