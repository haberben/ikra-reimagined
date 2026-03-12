// Request all necessary permissions on first app launch

const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

export async function requestAllPermissions() {
  const asked = localStorage.getItem("ikra_permissions_asked");
  if (asked) return;

  if (isNative()) {
    // Request notification permission
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.requestPermissions();
    } catch {
      // Not available
    }

    // Request filesystem/storage permission  
    try {
      const { Filesystem } = await import("@capacitor/filesystem");
      await Filesystem.requestPermissions();
    } catch {
      // Not available or not needed on newer Android
    }
  } else {
    // Web: request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // Denied or not supported
      }
    }
  }

  localStorage.setItem("ikra_permissions_asked", "true");
}
