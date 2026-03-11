import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import MenuDrawer from "@/components/layout/MenuDrawer";

import Onboarding from "@/pages/Onboarding";
import HomePage from "@/pages/HomePage";
import PrayerTimesPage from "@/pages/PrayerTimesPage";
import QuranPage from "@/pages/QuranPage";
import GalleryPage from "@/pages/GalleryPage";
import FavoritesPage from "@/pages/FavoritesPage";
import HatimPage from "@/pages/HatimPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ZikirmatikPage from "@/pages/ZikirmatikPage";
import SuggestionsPage from "@/pages/SuggestionsPage";
import AdminPanel from "@/components/AdminPanel";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

const App = () => {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("ikra_onboarded") === "true");
  const [activeTab, setActiveTab] = useState("home");
  const [city, setCity] = useState(() => localStorage.getItem("ikra_city") || "İstanbul");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showZikirmatik, setShowZikirmatik] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("ikra_theme") === "dark");

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

  const handleNotificationsBack = () => {
    setPageTransition(false);
    setTimeout(() => setShowNotifications(false), 300);
  };

  const handleZikirmatik = () => {
    setPageTransition(true);
    setTimeout(() => setShowZikirmatik(true), 50);
  };

  const handleZikirmatikBack = () => {
    setPageTransition(false);
    setTimeout(() => setShowZikirmatik(false), 300);
  };

  const handleSuggestions = () => {
    setPageTransition(true);
    setTimeout(() => setShowSuggestions(true), 50);
  };

  const handleSuggestionsBack = () => {
    setPageTransition(false);
    setTimeout(() => setShowSuggestions(false), 300);
  };

  const handleMenuNavigate = (target: string) => {
    setShowMenu(false);
    if (target === "notifications") handleNotifications();
    else if (target === "zikirmatik") handleZikirmatik();
    else if (target === "suggestions") handleSuggestions();
    else if (target === "admin") setShowAdmin(true);
    else setActiveTab(target);
  };

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
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={handleNotifications} onZikirmatik={handleZikirmatik} onMenuOpen={handleMenuOpen} />;
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
      default:
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={handleNotifications} onZikirmatik={handleZikirmatik} onMenuOpen={handleMenuOpen} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Sonner />
      <InstallPrompt />
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <div className="min-h-screen bg-background">
        {renderTab()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <MenuDrawer
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={handleMenuNavigate}
        city={city}
        userName={localStorage.getItem("ikra_name") || ""}
        dark={dark}
        onToggleDark={toggleDark}
      />
    </QueryClientProvider>
  );
};

export default App;
