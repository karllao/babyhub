self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "宝宝喂养助手", {
    body: data.body || "有一条新的提醒", tag: data.tag, data: { url: data.url || "/" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) if ("focus" in client) { client.navigate(url); return client.focus(); }
    return clients.openWindow(url);
  }));
});
