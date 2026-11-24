import { requestData } from './api'
import { DEFAULT_LOCATION, validCoordinates } from '../lib/restaurants'
import { delay } from './cache'

let nextRequest = 0

export async function findNominatimLocations(query, signal) {
  // Public Nominatim permits explicit searches only. Space request starts.
  const now = Date.now()
  const start = Math.max(nextRequest, now)
  nextRequest = start + 1100
  if (start > now) await delay(start - now, signal)

  const base = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search'
  const { lng, lat } = DEFAULT_LOCATION
  const data = await requestData('Nominatim', base, {
    params: { q: query, format: 'jsonv2', limit: 6, viewbox: [lng - .45, lat + .35, lng + .35, lat - .35].join(',') }, signal,
  })
  if (!Array.isArray(data)) throw new Error('Unexpected Nominatim response')
  return data.filter((place) => place.display_name && place.lat && place.lon).map((place) => ({
    id: place.place_id, label: place.display_name, name: place.name || place.display_name.split(',')[0],
    lat: Number(place.lat), lng: Number(place.lon),
  })).filter(({ lat, lng }) => validCoordinates(lat, lng))
}
