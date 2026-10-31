"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons on dynamic bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  reportCount?: number;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  interactiveSelect?: boolean;
  onLocationSelect?: (lat: number, lon: number) => void;
  selectedLocation?: [number, number] | null;
  markers?: MapMarker[];
  height?: string;
  onMarkerClick?: (id: string) => void;
}

export default function LeafletMap({
  center = [23.2520, 77.4120], // Mayanagari Demo Center
  zoom = 14,
  interactive = true,
  interactiveSelect = false,
  onLocationSelect,
  selectedLocation,
  markers = [],
  height = "350px",
  onMarkerClick,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);

    // Click handler for location selection
    if (interactiveSelect) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update selected location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedLocation && selectedLocation[0] && selectedLocation[1]) {
      const [lat, lon] = selectedLocation;
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLatLng([lat, lon]);
      } else {
        selectedMarkerRef.current = L.marker([lat, lon], {
          draggable: interactiveSelect,
        }).addTo(mapInstanceRef.current);

        if (interactiveSelect && onLocationSelect) {
          selectedMarkerRef.current.on("dragend", (e: any) => {
            const pos = e.target.getLatLng();
            onLocationSelect(pos.lat, pos.lng);
          });
        }
      }
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
    } else if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  }, [selectedLocation, interactiveSelect, onLocationSelect]);

  // Update multi-marker list
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    markers.forEach((m) => {
      if (m.latitude && m.longitude) {
        const marker = L.marker([m.latitude, m.longitude]);
        const popupContent = `
          <div style="min-width: 160px; font-family: sans-serif;">
            <p style="font-weight: 700; margin: 0 0 4px 0; font-size: 13px; color: #1e293b;">${m.title}</p>
            ${m.description ? `<p style="font-size: 11px; color: #334155; margin: 0 0 4px 0;">${m.description}</p>` : ""}
            ${m.category ? `<p style="font-size: 11px; color: #475569; margin: 0 0 4px 0;"><strong>Category:</strong> ${m.category}</p>` : ""}
            ${m.reportCount !== undefined ? `<p style="font-size: 11px; color: #2563eb; font-weight: 600; margin: 0;">${m.reportCount} Citizens Reported</p>` : ""}
            <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">Generalized Location (Privacy Protected)</p>
          </div>
        `;
        marker.bindPopup(popupContent);
        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(m.id));
        }
        markersGroupRef.current?.addLayer(marker);
      }
    });
  }, [markers]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden border border-gray-300 shadow-sm z-0">
      <div ref={mapContainerRef} style={{ height, width: "100%" }} />
      {interactiveSelect && (
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded shadow text-xs font-medium text-gray-700 border border-gray-200 z-[1000] pointer-events-none">
          Click map or drag pin to choose location
        </div>
      )}
    </div>
  );
}
