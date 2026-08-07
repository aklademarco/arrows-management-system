"use client";

import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";
import type { Coordinates } from "../../../../lib/geofence";

type GeofenceMapProps = {
  center: Coordinates;
  radiusMeters: number;
  reading: (Coordinates & { accuracyMeters: number }) | null;
  testPoint: Coordinates | null;
  onMapClick: (coordinates: Coordinates) => void;
};

function RecenterMap({ center }: Pick<GeofenceMapProps, "center">) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.latitude, center.longitude], 18, { duration: 0.8 });
  }, [center, map]);

  return null;
}

function CenterSelector({
  onMapClick,
}: Pick<GeofenceMapProps, "onMapClick">) {
  useMapEvents({
    click(event) {
      onMapClick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function GeofenceMap({
  center,
  radiusMeters,
  reading,
  testPoint,
  onMapClick,
}: GeofenceMapProps) {
  const position: [number, number] = [center.latitude, center.longitude];
  const readingPosition: [number, number] | null = reading
    ? [reading.latitude, reading.longitude]
    : null;

  return (
    <MapContainer
      center={position}
      className="h-full w-full"
      scrollWheelZoom
      zoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={position}
        pathOptions={{ color: "#166534", fillColor: "#22c55e", fillOpacity: 0.14 }}
        radius={radiusMeters}
      />
      {reading && readingPosition ? (
        <>
          <Circle
            center={readingPosition}
            pathOptions={{ color: "#0369a1", fillColor: "#38bdf8", fillOpacity: 0.18 }}
            radius={reading.accuracyMeters}
          />
          <CircleMarker
            center={readingPosition}
            pathOptions={{ color: "white", fillColor: "#0369a1", fillOpacity: 1, weight: 3 }}
            radius={7}
          />
        </>
      ) : null}
      <CircleMarker
        center={position}
        pathOptions={{ color: "white", fillColor: "#166534", fillOpacity: 1, weight: 3 }}
        radius={8}
      />
      {testPoint ? (
        <CircleMarker
          center={[testPoint.latitude, testPoint.longitude]}
          pathOptions={{ color: "white", fillColor: "#c2410c", fillOpacity: 1, weight: 3 }}
          radius={7}
        />
      ) : null}
      <RecenterMap center={center} />
      <CenterSelector onMapClick={onMapClick} />
    </MapContainer>
  );
}
