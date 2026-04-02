import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner, toast } from "sonner";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import MenuDrawer from "@/components/layout/MenuDrawer";
import { useBackButton } from "@/hooks/useBackButton";
import { requestAllPermissions } from "@/lib/permissions";

import Onboarding from "@/pages/Onboarding";
import HomePage from "@/pages/HomePage";
import PrayerTimesPage from "@/pages/PrayerTimesPage";
import QuranPage from "@/pages/QuranPage";
import GalleryPage from "@/pages/GalleryPage";
import FavoritesPage from "@/pages/FavoritesPage";
import HatimPage from "@/pages/HatimPage";
import DualarPage from "@/pages/DualarPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ZikirmatikPage from "@/pages/ZikirmatikPage";
import SuggestionsPage from "@/pages/SuggestionsPage";
import ProfilePanel from "@/components/ProfilePanel";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";

const queryClient = new QueryClient();

import { getStableUserId, syncUserProfile } from "@/lib/user";

const APP_VERSION = "1.4.0"; // Current v1.4

const App = () => {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("ikra_onboarded") === "true");
  const [activeTab, setActiveTab] = useState("home");
  const [city, setCity] = useState(() => localStorage.getItem("ikra_city") || "İstanbul");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showZikirmatik, setShowZikirmatik] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("ikra_theme") === "dark");
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [stableId, setStableId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | undefined>(() => {
    try {
      const saved = localStorage.getItem("ikra_coords");
      return saved ? JSON.parse(saved) : undefined;
    } catch { return undefined; }
  });
  
  const { getCurrentLocation } = useLocation();

  // Version check and reload logic for cache issues
  useEffect(() => {
    const lastVer = localStorage.getItem("ikra_app_version");
    if (lastVer && lastVer !== APP_VERSION) {
      // Clear cache and reload
      console.log("New version detected, clearing caches.");
      localStorage.setItem("ikra_app_version", APP_VERSION);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (const reg of regs) reg.unregister();
        });
      }
      window.location.reload();
    } else {
      localStorage.setItem("ikra_app_version", APP_VERSION);
    }
  }, []);

  // Request permissions and identity on first launch
  useEffect(() => {
    requestAllPermissions();
    
    getStableUserId().then(id => {
      setStableId(id);
      const name = localStorage.getItem("ikra_name") || "Misafir";
      syncUserProfile(name, city);
    });

    const handleOpenProfile = () => setShowProfile(true);
    window.addEventListener("open-profile", handleOpenProfile);

    // Initial location check if auto-location is on
    const autoLoc = localStorage.getItem("ikra_auto_location") === "true";
    if (autoLoc) {
      getCurrentLocation().then(newCoords => {
        if (newCoords) {
          setCoords(newCoords);
          localStorage.setItem("ikra_coords", JSON.stringify(newCoords));
        }
      });
    }

    // Track authentication state to display in MenuDrawer
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthEmail(session?.user?.user_metadata?.full_name || session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.user_metadata?.full_name || session?.user?.email || null);
    });

    // Background Zikir Action Listener
    import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        if (notification.actionId === 'increment_zikir') {
          import("@/lib/zikir").then(({ logZikir, getPinnedZikir }) => {
            const pinned = getPinnedZikir();
            logZikir(pinned.name, 1);
            
            // Re-trigger the persistent notification update immediately
            const zikirEnabled = localStorage.getItem("ikra_persistent_zikir") === "true";
            if (zikirEnabled) {
              import("@/lib/notifications").then(({ managePersistentZikirNotification }) => {
                const logs = JSON.parse(localStorage.getItem("ikra_zikir_logs") || "{}");
                const today = new Date().toISOString().split('T')[0];
                const currentCount = (logs[today] && logs[today][pinned.name]) || 0;
                managePersistentZikirNotification(true, pinned.target, currentCount, pinned.name);
              });
            }
          });
        }
      });
    }).catch(() => {});

    return () => {
      window.removeEventListener("open-profile", handleOpenProfile);
      subscription.unsubscribe();
    };
  }, [city]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ikra_theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDark = () => setDark((d) => !d);

  const handleMenuOpen = () => setShowMenu(true);

  const handleNotifications = () => {
    setPageTransition(true);
    setTimeout(() => setShowNotifications(true), 50);
  };

  const handleNotificationsBack = useCallback(() => {
    setPageTransition(false);
    setTimeout(() => setShowNotifications(false), 300);
  }, []);

  const handleZikirmatik = () => {
    setPageTransition(true);
    setTimeout(() => setShowZikirmatik(true), 50);
  };

  const handleZikirmatikBack = useCallback(() => {
    setPageTransition(false);
    setTimeout(() => setShowZikirmatik(false), 300);
  }, []);

  const handleSuggestions = () => {
    setPageTransition(true);
    setTimeout(() => setShowSuggestions(true), 50);
  };

  const handleSuggestionsBack = useCallback(() => {
    setPageTransition(false);
    setTimeout(() => setShowSuggestions(false), 300);
  }, []);

  const handleMenuNavigate = (target: string) => {
    setShowMenu(false);
    if (target === "notifications") handleNotifications();
    else if (target === "zikirmatik") handleZikirmatik();
    else if (target === "suggestions") handleSuggestions();
    else if (target === "profile") setShowProfile(true);
    else setActiveTab(target);
  };

  // Android hardware back button handling
  const handleBackButton = useCallback(() => {
    if (showProfile) {
      setShowProfile(false);
    } else if (showMenu) {
      setShowMenu(false);
    } else if (showNotifications) {
      handleNotificationsBack();
    } else if (showZikirmatik) {
      handleZikirmatikBack();
    } else if (showSuggestions) {
      handleSuggestionsBack();
    } else if (activeTab !== "home") {
      setActiveTab("home");
    } else {
      // On home tab, minimize app
      import("@capacitor/app").then(({ App }) => App.minimizeApp()).catch(() => {});
    }
  }, [showProfile, showMenu, showNotifications, showZikirmatik, showSuggestions, activeTab, handleNotificationsBack, handleZikirmatikBack, handleSuggestionsBack]);

  useBackButton(handleBackButton, onboarded);

  if (!onboarded) {
    return (
      <QueryClientProvider client={queryClient}>
        <Sonner />
        <Onboarding onComplete={() => {
          setOnboarded(true);
          setCity(localStorage.getItem("ikra_city") || "İstanbul");
        }} />
      </QueryClientProvider>
    );
  }

  if (showNotifications) {
    return (
      <QueryClientProvider client={queryClient}>
        <Sonner />
        <div className={cn(
          "transition-all duration-300 ease-out",
          pageTransition ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}>
          <NotificationsPage onBack={handleNotificationsBack} />
        </div>
      </QueryClientProvider>
    );
  }

  if (showZikirmatik) {
    return (
      <QueryClientProvider client={queryClient}>
        <Sonner />
        <div className={cn(
          "transition-all duration-300 ease-out",
          pageTransition ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}>
          <ZikirmatikPage onBack={handleZikirmatikBack} />
        </div>
      </QueryClientProvider>
    );
  }

  if (showSuggestions) {
    return (
      <QueryClientProvider client={queryClient}>
        <Sonner />
        <div className={cn(
          "transition-all duration-300 ease-out",
          pageTransition ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}>
          <SuggestionsPage onBack={handleSuggestionsBack} />
        </div>
      </QueryClientProvider>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomePage city={city} coords={coords} onNavigate={setActiveTab} onNotifications={handleNotifications} onZikirmatik={handleZikirmatik} onMenuOpen={handleMenuOpen} onToggleDark={toggleDark} dark={dark} />;
      case "times":
        return <PrayerTimesPage city={city} setCity={setCity} coords={coords} setCoords={setCoords} onNotifications={handleNotifications} onMenuOpen={handleMenuOpen} />;
      case "quran":
        return <QuranPage onMenuOpen={handleMenuOpen} onNotifications={handleNotifications} />;
      case "gallery":
        return <GalleryPage onNotifications={handleNotifications} onMenuOpen={handleMenuOpen} />;
      case "favorites":
        return <FavoritesPage onNotifications={handleNotifications} onMenuOpen={handleMenuOpen} />;
      case "hatim":
        return <HatimPage onMenuOpen={handleMenuOpen} onNotifications={handleNotifications} />;
      case "dualar":
        return <DualarPage onMenuOpen={handleMenuOpen} onNotifications={handleNotifications} />;
      default:
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={handleNotifications} onZikirmatik={handleZikirmatik} onMenuOpen={handleMenuOpen} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Sonner />
      <InstallPrompt />
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
      <div className="min-h-screen bg-background">
        {renderTab()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <MenuDrawer
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={handleMenuNavigate}
        city={city}
        userName={authEmail || localStorage.getItem("ikra_name") || ""}
        isLoggedIn={!!authEmail}
        dark={dark}
        onToggleDark={toggleDark}
      />
    </QueryClientProvider>
  );
};

export default App;
