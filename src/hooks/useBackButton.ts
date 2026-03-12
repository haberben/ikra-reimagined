import { useEffect } from "react";

const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

/**
 * Hook to handle Android hardware back button via Capacitor App plugin.
 * Call with a callback that returns true if it handled the back action,
 * or false to let the default behavior (exit app) proceed.
 */
export function useBackButton(handler: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active || !isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          handler();
        });
        cleanup = () => {
          listener.remove();
        };
      } catch {
        // @capacitor/app not available
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [handler, active]);
}
