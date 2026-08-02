import distance from "@turf/distance";
import { point } from "@turf/helpers";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function distanceInMeters(from: Coordinates, to: Coordinates) {
  return (
    distance(
      point([from.longitude, from.latitude]),
      point([to.longitude, to.latitude]),
      { units: "kilometers" },
    ) * 1000
  );
}

export function isWithinGeofence(
  location: Coordinates,
  center: Coordinates,
  radiusMeters: number,
) {
  return distanceInMeters(location, center) <= radiusMeters;
}
