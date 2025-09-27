import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

import { getWells } from "../../wells/lib/storage.js";

// Fix default marker icons for Vite
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

function isNum(n) {
  return typeof n === "number" && isFinite(n);
}

function toPoints(wells) {
  return (wells || [])
    .filter((w) => isNum(w?.coords?.lat) && isNum(w?.coords?.lng))
    .map((w) => ({
      id: w.id,
      name: w.name || w.id,
      lat: w.coords.lat,
      lng: w.coords.lng,
      location: w.location || "",
    }));
}

function Bounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(b, { padding: [24, 24] });
  }, [points, map]);
  return null;
}

function mapsLink(lat, lng, label = "Well") {
  const q = encodeURIComponent(label);
  const g = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const a = `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
  return { google: g, apple: a };
}

export default function MapWidget() {
  const wells = getWells();
  const points = useMemo(() => toPoints(wells), [wells]);

  // Fallback center (Texas-ish)
  const center = points.length ? [points[0].lat, points[0].lng] : [31.9686, -99.9018];
  const zoom = points.length ? 8 : 6;

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: 340, width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OSM</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Bounds points={points} />

          {points.map((p) => {
            const m = mapsLink(p.lat, p.lng, p.name);
            return (
              <Marker key={p.id} position={[p.lat, p.lng]}>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{p.name}</div>
                    {p.location && <div className="text-xs opacity-75">{p.location}</div>}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link to={`/well/${p.id}`} className="btn btn-outline btn-xs">Open Details</Link>
                      <a className="btn btn-outline btn-xs" href={m.google} target="_blank" rel="noreferrer">Google Maps</a>
                      <a className="btn btn-outline btn-xs" href={m.apple} target="_blank" rel="noreferrer">Apple Maps</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="text-xs opacity-60">
        Tip: add <code>coords</code> to wells (e.g. <code>{`{ coords: { lat: 31.5, lng: -100.2 } }`}</code>) and they’ll appear here automatically.
      </div>
    </div>
  );
}
