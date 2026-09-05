/**
 * Calculate the distance between two geographic coordinates using the
 * Haversine formula. Returns the distance in METERS.
 *
 * The Haversine formula determines the great-circle distance between
 * two points on a sphere given their latitudes and longitudes:
 *
 *   a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
 *   c = 2 · atan2(√a, √(1−a))
 *   d = R · c
 *
 * Where:
 *   - Δlat = lat2 − lat1, Δlon = lon2 − lon1  (in radians)
 *   - R = Earth's mean radius ≈ 6,371,000 meters
 *   - d = distance between the two points along the surface
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const EARTH_RADIUS_METERS = 6_371_000;

  // Convert degrees to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

module.exports = { calculateDistance };
