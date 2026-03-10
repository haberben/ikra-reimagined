import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import Onboarding from "@/pages/Onboarding";
import HomePage from "@/pages/HomePage";
import PrayerTimesPage from "@/pages/PrayerTimesPage";
import QuranPage from "@/pages/QuranPage";
import GalleryPage from "@/pages/GalleryPage";
import HatimPage from "@/pages/HatimPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ZikirmatikPage from "@/pages/ZikirmatikPage";

const queryClient = new QueryClient();

const App = () => {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("ikra_onboarded") === "true");
  const [activeTab, setActiveTab] = useState("home");
  const [city, setCity] = useState(() => localStorage.getItem("ikra_city") || "İstanbul");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showZikirmatik, setShowZikirmatik] = useState(false);

  if (!onboarded) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <Onboarding onComplete={() => {
            setOnboarded(true);
            setCity(localStorage.getItem("ikra_city") || "İstanbul");
          }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (showNotifications) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <NotificationsPage onBack={() => setShowNotifications(false)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (showZikirmatik) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <ZikirmatikPage onBack={() => setShowZikirmatik(false)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={() => setShowNotifications(true)} onZikirmatik={() => setShowZikirmatik(true)} />;
      case "times":
        return <PrayerTimesPage city={city} setCity={setCity} onNotifications={() => setShowNotifications(true)} />;
      case "quran":
        return <QuranPage />;
      case "gallery":
        return <GalleryPage onNotifications={() => setShowNotifications(true)} />;
      case "hatim":
        return <HatimPage />;
      default:
        return <HomePage city={city} onNavigate={setActiveTab} onNotifications={() => setShowNotifications(true)} onZikirmatik={() => setShowZikirmatik(true)} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <InstallPrompt />
        <div className="min-h-screen bg-background">
          {renderTab()}
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
