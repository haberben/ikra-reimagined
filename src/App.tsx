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

const queryClient = new QueryClient();

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

  // Request permissions on first launch
  useEffect(() => {
    requestAllPermissions();

    // Register for Push Notifications (FCM)
    import("@capacitor/push-notifications").then(({ PushNotifications }) => {
      // Only runs on native
      if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
        PushNotifications.requestPermissions().then((result) => {
          if (result.receive === 'granted') {
            PushNotifications.register();
          }
        });

        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          // Subscribe to topic all_users for the cloud function to reach us
          import('@capacitor/core').then(({ Capacitor }) => {
            if (Capacitor.getPlatform() === 'android') {
              // Firebase messaging uses topics
              // We'll just rely on the fact that Appflow will handle the native dependency
            }
          });
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          toast.success(notification.title || 'Yeni Bildirim', {
            description: notification.body
          });
        });
      }
    }).catch(() => {
      // Ignore if not running in native Capacitor environment
    });

    const handleOpenProfile = () => setShowProfile(true);
    window.addEventListener("open-profile", handleOpenProfile);

    // Track authentication state to display in MenuDrawer
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthEmail(session?.user?.user_metadata?.full_name || session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.user_metadata?.full_name || session?.user?.email || null);
    });

    return () => {
      window.removeEventListener("open-profile", handleOpenProfile);
      subscription.unsubscribe();
    };
  }, []);

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
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={handleNotifications} onZikirmatik={handleZikirmatik} onMenuOpen={handleMenuOpen} onToggleDark={toggleDark} dark={dark} />;
      case "times":
        return <PrayerTimesPage city={city} setCity={setCity} onNotifications={handleNotifications} onMenuOpen={handleMenuOpen} />;
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
