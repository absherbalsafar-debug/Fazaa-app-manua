import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type CustomerLocation = {
  latitude: number;
  longitude: number;
  country: string;
  governorate: string;
  city: string;
  district: string;
};

type LocationPickerProps = {
  value: CustomerLocation | null;
  onChange: (location: CustomerLocation) => void;
  error?: string;
};

const DEFAULT_CENTER: L.LatLngExpression = [15.3694, 44.191];

function pinIcon() {
  return L.divIcon({
    className: "fazaa-map-pin",
    html: '<div style="font-size:34px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3))">📍</div>',
    iconSize: [34, 34],
    iconAnchor: [17, 32],
  });
}

function parseAddress(address: Record<string, string> | undefined, latitude: number, longitude: number): CustomerLocation {
  const source = address ?? {};
  return {
    latitude,
    longitude,
    country: source.country ?? "",
    governorate: source.state ?? source.province ?? source.region ?? "",
    city: source.city ?? source.town ?? source.village ?? source.municipality ?? "",
    district: source.suburb ?? source.neighbourhood ?? source.quarter ?? source.city_district ?? "",
  };
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function resolveLocation(latitude: number, longitude: number) {
    setResolving(true);
    setLocationError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ar`);
      if (!response.ok) throw new Error("تعذر قراءة عنوان الموقع");
      const data = await response.json() as { address?: Record<string, string> };
      onChange(parseAddress(data.address, latitude, longitude));
    } catch {
      onChange(parseAddress(undefined, latitude, longitude));
      setLocationError("تم تحديد الإحداثيات، لكن تعذر قراءة اسم المنطقة. يمكنك المتابعة.");
    } finally {
      setResolving(false);
    }
  }

  function setMarker(latitude: number, longitude: number, shouldResolve = true) {
    const map = mapRef.current;
    if (!map) return;
    const point: L.LatLngExpression = [latitude, longitude];
    if (!markerRef.current) {
      markerRef.current = L.marker(point, { draggable: true, icon: pinIcon() }).addTo(map);
      markerRef.current.on("dragend", () => {
        const position = markerRef.current?.getLatLng();
        if (position) void resolveLocation(position.lat, position.lng);
      });
    } else {
      markerRef.current.setLatLng(point);
    }
    map.setView(point, Math.max(map.getZoom(), 15), { animate: true });
    if (shouldResolve) void resolveLocation(latitude, longitude);
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false);
        setMarker(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
        setLocationError("اسمح بالوصول إلى موقعك من إعدادات المتصفح ثم حاول مرة أخرى");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    const map = L.map(mapElement.current, { zoomControl: false }).setView(
      value ? [value.latitude, value.longitude] : DEFAULT_CENTER,
      value ? 15 : 6,
    );
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.on("click", event => setMarker(event.latlng.lat, event.latlng.lng));
    mapRef.current = map;
    if (value) setMarker(value.latitude, value.longitude, false);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (value && mapRef.current && !markerRef.current) setMarker(value.latitude, value.longitude, false);
  }, [value]);

  return (
    <section className="space-y-4 rounded-[28px] border border-primary/10 bg-white p-4 shadow-[0_16px_36px_rgba(14,47,98,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-[#a17b29]"><MapPin className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-primary">حدد موقعك</h2>
          <p className="mt-1 text-xs leading-6 text-[#77766f]">نحتاج موقعك لعرض أقرب المهنيين والخدمات المتاحة حولك.</p>
        </div>
      </div>
      <button type="button" onClick={locateMe} disabled={locating || resolving} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(14,47,98,0.16)] transition active:scale-[.98] disabled:opacity-60">
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        {locating ? "جاري تحديد موقعك..." : value ? "تحديث موقعي الحالي" : "تحديد موقعي الحالي"}
      </button>
      <div ref={mapElement} className="h-64 w-full overflow-hidden rounded-2xl border border-[#d9d5cd] bg-[#eef1ed]" aria-label="خريطة تحديد موقع العميل" />
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#77766f]">
        <span>{value ? `${value.city || "موقع محدد"}${value.district ? `، ${value.district}` : ""}` : "اضغط على الخريطة أو حرّك المؤشر لاختيار موقع أدق"}</span>
        {resolving && <span className="flex items-center gap-1 font-bold text-[#a17b29]"><RefreshCw className="h-3 w-3 animate-spin" /> قراءة العنوان</span>}
      </div>
      {(error || locationError) && <p className="text-xs font-bold leading-5 text-red-600" role="alert">{error || locationError}</p>}
    </section>
  );
}

export default LocationPicker;
