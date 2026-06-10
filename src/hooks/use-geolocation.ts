import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { storage } from "@/src/utils/storage";

const PERM_KEY = "geo_perm_asked";

export type Coords = { lat: number; lng: number };
export type GeoState = {
  coords: Coords | null;
  status: "idle" | "loading" | "granted" | "denied" | "unavailable";
  request: () => Promise<void>;
};

export function useGeolocation(): GeoState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoState["status"]>("idle");

  const request = useCallback(async () => {
    setStatus("loading");
    try {
      if (Platform.OS === "web") {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setStatus("unavailable");
          return;
        }
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              setStatus("granted");
              resolve();
            },
            () => {
              setStatus("denied");
              resolve();
            },
            { timeout: 8000, maximumAge: 300000 }
          );
        });
        return;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus("granted");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const asked = await storage.getItem<boolean>(PERM_KEY, false);
      if (asked) {
        // Re-request silently if already asked previously
        request().catch(() => {});
      }
    })();
  }, [request]);

  // Mark as asked once user explicitly requests
  useEffect(() => {
    if (status === "granted" || status === "denied") {
      storage.setItem(PERM_KEY, true).catch(() => {});
    }
  }, [status]);

  return { coords, status, request };
}
