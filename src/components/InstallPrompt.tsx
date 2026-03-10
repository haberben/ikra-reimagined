import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("ikra_install_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("ikra_install_dismissed", "true");
    setShow(false);
  };

  return (
    <div className="fixed left-4 right-4 top-4 z-[100] flex items-center justify-between rounded-xl border border-primary/10 bg-card p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[28px]">install_mobile</span>
        <div>
          <p className="text-sm font-bold">Ana Ekrana Ekle</p>
          <p className="text-xs text-muted-foreground">Hızlı erişim için yükleyin</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleDismiss} className="px-3 py-1.5 text-xs text-muted-foreground">
          Kapat
        </button>
        <button
          onClick={handleInstall}
          className="gold-gradient rounded-lg px-3 py-1.5 text-xs font-bold"
        >
          Yükle
        </button>
      </div>
    </div>
  );
}
