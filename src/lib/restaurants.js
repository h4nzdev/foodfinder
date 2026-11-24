export const DEFAULT_LOCATION = { name: 'Cebu City, Philippines', lat: 10.3157, lng: 123.8854, default: true }
export const DEFAULT_RADIUS = 3000

export function validCoordinates(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export function distanceBetween(a, b) {
  const radians = Math.PI / 180
  const haversine = Math.sin((b.lat - a.lat) * radians / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin((b.lng - a.lng) * radians / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

export function webUrl(value) {
  try {
    const url = new URL(value)
    if (['https:', 'http:'].includes(url.protocol)) return url.href
  } catch { return undefined }
}
