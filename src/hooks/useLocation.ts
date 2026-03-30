import { useState, useEffect } from "react";
import { Geolocation } from "@capacitor/geolocation";

export interface LocationData {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          setError("Konum izni verilmedi.");
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setLocation(coords);
      return coords;
    } catch (e: any) {
      console.error("Location error:", e);
      setError(e.message || "Konum alınamadı.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { location, error, loading, getCurrentLocation };
}
