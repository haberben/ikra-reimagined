import { useState, useEffect, useRef, useMemo } from "react";
import { TURKISH_CITIES } from "@/data/cities";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useFavorites } from "@/hooks/useFavorites";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import { schedulePrayerNotifications, requestNotificationPermission } from "@/lib/notifications";

interface PrayerTimesPageProps {
  city: string;
  setCity: (c: string) => void;
  coords?: { lat: number; lng: number };
  setCoords: (c: { lat: number; lng: number } | undefined) => void;
  onNotifications: () => void;
  onMenuOpen: () => void;
}

const PRAYERS = [
  { key: "Fajr", name: "Sabah", icon: "dark_mode" },
  { key: "Dhuhr", name: "Öğle", icon: "wb_sunny" },
  { key: "Asr", name: "İkindi", icon: "wb_twilight" },
  { key: "Maghrib", name: "Akşam", icon: "nights_stay" },
  { key: "Isha", name: "Yatsı", icon: "bedtime" },
];

const TIME_OPTIONS = ["Vakitte", "5 dk önce", "10 dk önce", "15 dk önce", "30 dk önce"];

const HIJRI_MONTHS_TR: Record<string, string> = {
  "Muharram": "Muharrem",
  "Safar": "Safer",
  "Rabi' al-awwal": "Rebiülevvel",
  "Rabi' ath-thani": "Rebiülahir",
  "Jumada al-ula": "Cemaziyelevvel",
  "Jumada al-akhira": "Cemaziyelahir",
  "Rajab": "Recep",
  "Sha'ban": "Şaban",
  "Ramadan": "Ramazan",
  "Shawwal": "Şevval",
  "Dhu al-Qi'dah": "Zilkade",
  "Dhu al-Hijjah": "Zilhicce"
};

function getHijriDateTr(hj: any) {
  if (!hj) return "";
  const monthEn = hj.month.en;
  const monthTr = HIJRI_MONTHS_TR[monthEn] || monthEn;
  return `${hj.day} ${monthTr.toUpperCase()} ${hj.year}`;
}

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Calculate Qibla bearing from lat/lng
function calculateQiblaBearing(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const kaabaLngRad = (KAABA_LNG * Math.PI) / 180;
  const dLng = kaabaLngRad - lngRad;
  const x = Math.sin(dLng);
  const y = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return ((bearing % 360) + 360) % 360;
}

// City coordinates lookup for Qibla calculation
const CITY_COORDS: Record<string, [number, number]> = {
  "İstanbul": [41.0082, 28.9784],
  "Ankara": [39.9334, 32.8597],
  "İzmir": [38.4237, 27.1428],
  "Bursa": [40.1885, 29.0610],
  "Antalya": [36.8969, 30.7133],
  "Adana": [37.0, 35.3213],
  "Konya": [37.8746, 32.4932],
  "Gaziantep": [37.0662, 37.3833],
  "Şanlıurfa": [37.1591, 38.7969],
  "Diyarbakır": [37.9144, 40.2306],
  "Kayseri": [38.7312, 35.4787],
  "Trabzon": [41.0027, 39.7168],
  "Samsun": [41.2867, 36.33],
  "Erzurum": [39.9055, 41.2658],
  "Eskişehir": [39.7767, 30.5206],
  "Mersin": [36.8121, 34.6415],
  "Manisa": [38.6191, 27.4289],
  "Balıkesir": [39.6484, 27.8826],
  "Malatya": [38.3552, 38.3095],
  "Van": [38.4891, 43.3832],
  "Elazığ": [38.681, 39.2264],
  "Kocaeli": [40.8533, 29.8815],
  "Sakarya": [40.6940, 30.4358],
  "Tekirdağ": [41.2824, 27.5126],
  "Edirne": [41.6818, 26.5623],
  "Hatay": [36.4018, 36.3498],
  "Mardin": [37.3212, 40.7245],
  "Muğla": [37.2153, 28.3636],
  "Denizli": [37.7765, 29.0864],
  "Aydın": [37.8560, 27.8416],
  "Sivas": [39.7477, 37.0179],
  "Rize": [41.0201, 40.5234],
  "Ordu": [40.9839, 37.8764],
  "Afyonkarahisar": [38.7507, 30.5567],
  "Bolu": [40.7360, 31.6065],
  "Çanakkale": [40.1553, 26.4142],
  "Zonguldak": [41.4564, 31.7987],
  "Kırklareli": [41.7351, 27.2252],
  "Aksaray": [38.3687, 34.0370],
  "Nevşehir": [38.6244, 34.7239],
  "Çorum": [40.5506, 34.9556],
  "Amasya": [40.6499, 35.8353],
  "Tokat": [40.3167, 36.5544],
  "Kastamonu": [41.3887, 33.7827],
  "Sinop": [42.0231, 35.1531],
  "Giresun": [40.9128, 38.3895],
  "Artvin": [41.1828, 41.8183],
  "Bingöl": [38.8854, 40.4966],
  "Bitlis": [38.4004, 42.1095],
  "Muş": [38.7462, 41.4910],
  "Hakkari": [37.5833, 43.7408],
  "Siirt": [37.9273, 41.9459],
  "Tunceli": [39.1079, 39.5472],
  "Ağrı": [39.7191, 43.0503],
  "Kars": [40.6013, 43.0975],
  "Iğdır": [39.9237, 44.0450],
  "Ardahan": [41.1105, 42.7022],
  "Bayburt": [40.2552, 40.2249],
  "Gümüşhane": [40.4386, 39.5086],
  "Erzincan": [39.7500, 39.5000],
  "Adıyaman": [37.7648, 38.2786],
  "Kahramanmaraş": [37.5847, 36.9370],
  "Osmaniye": [37.0746, 36.2478],
  "Kilis": [36.7184, 37.1212],
  "Batman": [37.8812, 41.1351],
  "Şırnak": [37.4187, 42.4918],
  "Bartın": [41.6344, 32.3375],
  "Karabük": [41.2061, 32.6204],
  "Düzce": [40.8438, 31.1565],
  "Yalova": [40.6550, 29.2769],
  "Bilecik": [40.0567, 30.0153],
  "Burdur": [37.7203, 30.2903],
  "Isparta": [37.7648, 30.5566],
  "Karaman": [37.1759, 33.2287],
  "Kırıkkale": [39.8468, 33.5153],
  "Kırşehir": [39.1425, 34.1709],
  "Kütahya": [39.4167, 29.9833],
  "Niğde": [37.9667, 34.6833],
  "Uşak": [38.6823, 29.4082],
  "Yozgat": [39.8181, 34.8147],
};

const QIBLA_THRESHOLD = 5;

export default function PrayerTimesPage({ city, setCity, onNotifications, onMenuOpen }: PrayerTimesPageProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(() => {
    try {
      const saved = localStorage.getItem("ikra_coords");
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  });
  
  const { times, hijri, weekly, loading } = usePrayerTimes(city, coords);
  const { ayet, hadis } = useDailyContent();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_notif_toggles") || "{}"); } catch { return {}; }
  });
  const [notifTimes, setNotifTimes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_notif_times") || "{}"); } catch { return {}; }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassActive, setCompassActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const absHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const filteredCities = TURKISH_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate qibla bearing for current location or city
  const qiblaBearing = useMemo(() => {
    const lat = coords?.lat || CITY_COORDS[city]?.[0] || CITY_COORDS["İstanbul"][0];
    const lng = coords?.lng || CITY_COORDS[city]?.[1] || CITY_COORDS["İstanbul"][1];
    return calculateQiblaBearing(lat, lng);
  }, [city, coords]);

  // Calculate direction to Qibla
  const getQiblaDirection = () => {
    if (compassHeading === null) return null;
    const diff = ((qiblaBearing - compassHeading) % 360 + 360) % 360;
    if (diff <= QIBLA_THRESHOLD || diff >= 360 - QIBLA_THRESHOLD) return "correct";
    if (diff > 180) return "right";
    return "left";
  };

  const qiblaDir = getQiblaDirection();
  const isOnQibla = qiblaDir === "correct";

  // Schedule notifications when toggles or times change
  useEffect(() => {
    if (!times) return;
    const hasAnyEnabled = Object.values(notifications).some(Boolean);
    if (!hasAnyEnabled) return;

    localStorage.setItem("ikra_notif_toggles", JSON.stringify(notifications));
    localStorage.setItem("ikra_notif_times", JSON.stringify(notifTimes));

    schedulePrayerNotifications(times as unknown as Record<string, string>, notifications, notifTimes);
  }, [notifications, notifTimes, times]);

  const handleToggleNotif = async (key: string) => {
    const newVal = !notifications[key];
    if (newVal) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    const updated = { ...notifications, [key]: newVal };
    setNotifications(updated);
    localStorage.setItem("ikra_notif_toggles", JSON.stringify(updated));
  };

  const cleanupCompass = () => {
    if (handlerRef.current) {
      window.removeEventListener("deviceorientation", handlerRef.current);
      handlerRef.current = null;
    }
    if (absHandlerRef.current) {
      window.removeEventListener("deviceorientationabsolute" as any, absHandlerRef.current);
      absHandlerRef.current = null;
    }
  };

  const startCompass = async () => {
    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm !== "granted") { setPermissionDenied(true); return; }
      } catch { setPermissionDenied(true); return; }
    }

    cleanupCompass();

    let hasAbsolute = false;

    // Try absolute orientation first (Android Chrome)
    const absHandler = (e: any) => {
      hasAbsolute = true;
      const heading = e.alpha !== null ? (360 - e.alpha) % 360 : null;
      if (heading !== null) setCompassHeading(heading);
    };
    absHandlerRef.current = absHandler;
    window.addEventListener("deviceorientationabsolute" as any, absHandler);

    // Fallback: regular deviceorientation (iOS webkitCompassHeading)
    const handler = (e: DeviceOrientationEvent) => {
      if (hasAbsolute) return; // prefer absolute
      const heading = (e as any).webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (heading !== null) setCompassHeading(heading);
    };
    handlerRef.current = handler;
    window.addEventListener("deviceorientation", handler);

    setCompassActive(true);
  };

  useEffect(() => {
    return () => cleanupCompass();
  }, []);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
       const { Geolocation } = await import("@capacitor/geolocation");
       // Request permissions
       const perm = await Geolocation.requestPermissions();
       if (perm.location !== 'granted') {
          setLocationError("Konum izni verilmedi.");
          setLocationLoading(false);
          return;
       }

       // Fetch location
       const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
       });

       const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
       setCoords(newCoords);
       
       // Reverse geocoding to find approximate city/district
       try {
           const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newCoords.lat}&lon=${newCoords.lng}&zoom=10&addressdetails=1`);
           const data = await res.json();
           const foundCity = data.address.city || data.address.town || data.address.province || data.address.state || "Mevcut Konum";
           // Map the found city back to our known list if possible, or just use "Mevcut Konum"
           const matchedCity = TURKISH_CITIES.find(c => foundCity.includes(c)) || "Mevcut Konum";
           setCity(matchedCity);
           localStorage.setItem("ikra_city", matchedCity);
           localStorage.setItem("ikra_coords", JSON.stringify(newCoords));
       } catch (geoError) {
           console.log("Reverse geocode failed, using coordinates only.", geoError);
           setCity("Mevcut Konum");
           localStorage.setItem("ikra_city", "Mevcut Konum");
           localStorage.setItem("ikra_coords", JSON.stringify(newCoords));
       }
    } catch (e: any) {
       console.error("Geolocation error:", e);
       setLocationError("Konum alınamadı. Lütfen GPS ayarlarınızı kontrol edin.");
    } finally {
       setLocationLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <StickyHeader
        title="İKRA"
        subtitle={hijri ? `BUGÜN - ${getHijriDateTr(hijri)}` : "NAMAZ VAKİTLERİ"}
        onLeftClick={onMenuOpen}
        onRightClick={onNotifications}
      />

      <div className="px-4 pt-4">
        {/* City selector */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex flex-1 items-center gap-3 rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              <span className="font-medium">{city}</span>
              <span className="material-symbols-outlined ml-auto text-muted-foreground">expand_more</span>
            </button>
            <button
              onClick={handleGetLocation}
              disabled={locationLoading}
              title="Konumdan Hassas Vakit Al"
              className="flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50"
            >
              {locationLoading ? (
                 <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                 <span className="material-symbols-outlined text-[20px]">my_location</span>
              )}
            </button>
          </div>
          {locationError && <p className="text-xs text-destructive mt-1">{locationError}</p>}
          {coords && <p className="text-[10px] text-primary mt-1">✓ Yüksek hassasiyetli konum aktif</p>}

          {searchOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-primary/10 bg-card shadow-lg">
              <div className="sticky top-0 bg-card p-2">
                <input
                  type="text"
                  placeholder="Şehir ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-secondary px-3 py-2 text-sm focus:outline-none"
                  autoFocus
                />
              </div>
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => { 
                    setCity(c); 
                    setCoords(undefined);
                    setSearchOpen(false); 
                    setSearch(""); 
                    localStorage.setItem("ikra_city", c); 
                    localStorage.removeItem("ikra_coords");
                  }}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm hover:bg-primary/5",
                    c === city && "bg-primary/5 font-bold text-primary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prayer cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          </div>
        ) : times ? (
          <div className="space-y-4">
            {/* Current Day Cards */}
            <div className="space-y-3">
              {PRAYERS.map((p) => (
                <div key={p.key} className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="material-symbols-outlined text-primary">{p.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-lg font-extrabold text-primary">
                          {(times as any)[p.key]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notification toggle */}
                  <div className="mt-3 flex items-center justify-between border-t border-primary/5 pt-3">
                    <span className="text-xs text-muted-foreground">Bildirim</span>
                    <div className="flex items-center gap-2">
                      {notifications[p.key] && (
                        <select
                          value={notifTimes[p.key] || "Vakitte"}
                          onChange={(e) => {
                            const updated = { ...notifTimes, [p.key]: e.target.value };
                            setNotifTimes(updated);
                            localStorage.setItem("ikra_notif_times", JSON.stringify(updated));
                          }}
                          className="rounded-lg bg-secondary px-2 py-1 text-xs"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => handleToggleNotif(p.key)}
                        className={cn(
                          "h-[31px] w-[51px] rounded-full transition-colors",
                          notifications[p.key] ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <div className={cn(
                          "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                          notifications[p.key] ? "translate-x-[22px]" : "translate-x-[2px]"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Future Days Section */}
            {weekly.length > 1 && (
              <div className="mt-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Gelecek Günler
                </h3>
                <div className="space-y-3">
                  {weekly.slice(1).map((day, idx) => {
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
                    const isExtra = idx === 0 ? "Yarın" : dayName;
                    
                    return (
                      <div key={idx} className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm overflow-hidden">
                        <div className="mb-2 flex items-center justify-between border-b border-primary/5 pb-2">
                          <span className="text-xs font-bold text-primary">{isExtra}</span>
                          <span className="text-[10px] text-muted-foreground">{getHijriDateTr(day.hijri)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {PRAYERS.map((p) => (
                            <div key={p.key} className="text-center">
                              <p className="text-[10px] text-muted-foreground">{p.name}</p>
                              <p className="text-xs font-bold">{(day.times as any)[p.key]}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Günün Mesajları */}
        <div className="mt-6">
          <div className="islamic-pattern mb-3 rounded-t-xl bg-primary px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground">
              Günün Mesajları
            </h3>
          </div>

          {/* Ayet */}
          <div className="rounded-b-xl border border-t-0 border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Günün Ayeti</h4>
            <p className="font-arabic text-2xl leading-loose text-foreground" dir="rtl">
              {ayet?.arabic_text || "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ"}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "{ayet?.turkish_text || "Kim Allah'a tevekkül ederse, O ona yeter."}"
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-primary/60">{ayet?.source || "Talak Suresi, 3"}</p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                  Paylaş
                </button>
                {ayet && (
                  <button
                    onClick={() => toggleFavorite(ayet.id, "ayet")}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <span
                      className={cn("material-symbols-outlined text-[18px]", isFavorite(ayet.id) && "text-destructive")}
                      style={isFavorite(ayet.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >favorite</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hadis */}
          <div className="mt-3 rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Hadis-i Şerif</h4>
            <p className="font-arabic text-xl leading-loose text-foreground" dir="rtl">
              {hadis?.arabic_text || "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "{hadis?.turkish_text || "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir."}"
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-primary/60">{hadis?.source || "Buhârî"}</p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                  Paylaş
                </button>
                {hadis && (
                  <button
                    onClick={() => toggleFavorite(hadis.id, "hadis")}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <span
                      className={cn("material-symbols-outlined text-[18px]", isFavorite(hadis.id) && "text-destructive")}
                      style={isFavorite(hadis.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >favorite</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kıble Compass */}
        <div className="mt-6 mb-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Kıble Bulucu</h3>
          <div className={cn(
            "flex flex-col items-center rounded-xl border bg-card p-6 shadow-sm transition-all duration-500",
            isOnQibla ? "border-accent shadow-[0_0_30px_-5px_hsl(var(--accent)/0.5)]" : "border-primary/10"
          )}>
            <div className="relative h-52 w-52">
              {/* Outer ring */}
              <div className={cn(
                "absolute inset-0 rounded-full border-2 transition-colors duration-500",
                isOnQibla ? "border-accent" : "border-primary/20"
              )} />
              <div className="absolute inset-2 rounded-full border border-primary/10" />

              {/* N/S/E/W labels */}
              <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-bold text-primary">K</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">G</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">D</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">B</span>

              {/* Qibla needle */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${compassHeading !== null ? qiblaBearing - compassHeading : qiblaBearing}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-14 w-1.5 rounded-full transition-colors duration-500",
                    isOnQibla ? "bg-accent" : "bg-primary"
                  )} />
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500",
                    isOnQibla ? "bg-accent scale-110" : "bg-primary/10"
                  )}>
                    <span className={cn(
                      "material-symbols-outlined text-[24px] transition-colors duration-500",
                      isOnQibla ? "text-primary-foreground" : "text-primary"
                    )}>mosque</span>
                  </div>
                  <div className="h-14 w-1 rounded-full bg-muted" />
                </div>
              </div>

              {/* Glow effect when on Qibla */}
              {isOnQibla && (
                <div className="absolute inset-0 rounded-full animate-pulse bg-accent/10" />
              )}
            </div>

            {/* Direction guidance */}
            <div className="mt-4 text-center">
              {!compassActive ? (
                <button
                  onClick={startCompass}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">explore</span>
                  Pusulayı Başlat
                </button>
              ) : permissionDenied ? (
                <p className="text-sm text-destructive">Pusula izni reddedildi. Ayarlardan izin verin.</p>
              ) : isOnQibla ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
                    <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                    <span className="text-sm font-bold text-accent">Kıble Yönündesiniz!</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Cihazınızı bu yönde tutun</p>
                </div>
              ) : qiblaDir === "left" ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2">
                  <span className="material-symbols-outlined text-primary text-[20px] animate-bounce">arrow_back</span>
                  <span className="text-sm font-medium text-primary">Sola çevirin</span>
                </div>
              ) : qiblaDir === "right" ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2">
                  <span className="material-symbols-outlined text-primary text-[20px] animate-bounce">arrow_forward</span>
                  <span className="text-sm font-medium text-primary">Sağa çevirin</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pusula yükleniyor...</p>
              )}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Kıble açısı: {Math.round(qiblaBearing)}° ({city})
              {compassHeading !== null && ` • Pusula: ${Math.round(compassHeading)}°`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
