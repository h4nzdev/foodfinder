import { CACHE_TTL, cacheEntries, sharedRequests } from './cache'
import { findGeoapifyRestaurants, geoapifyConfigured } from './geoapify'
import { findOverpassRestaurants } from './overpass'
import { distanceBetween } from '../lib/restaurants'

const cache = cacheEntries(24, CACHE_TTL, 24 * 60 * 60 * 1000)
const shareRequest = sharedRequests()
const providers = geoapifyConfigured
  ? [findGeoapifyRestaurants, findOverpassRestaurants] : [findOverpassRestaurants]

export async function findRestaurants(place, radius, signal) {
  signal.throwIfAborted()
  const key = [place.lat.toFixed(5), place.lng.toFixed(5), radius].join(',')
  const cached = cache.get(key)
  if (cached) return cached

  return shareRequest(key, signal, async (requestSignal) => {
    for (const provider of providers) {
      try {
        const data = await provider(place, radius, requestSignal)
        requestSignal.throwIfAborted()
        const unique = new Map(data.map((restaurant) => [restaurant.id, restaurant]))
        const restaurants = [...unique.values()].map((item) => ({ ...item, distance: distanceBetween(place, item) }))
          .filter((restaurant) => restaurant.distance <= radius / 1000)
          .sort((a, b) => a.distance - b.distance)
        const result = { restaurants }
        cache.set(key, result)
        return result
      } catch {
        requestSignal.throwIfAborted()
      }
    }
    const previous = cache.get(key, true)
    if (previous) return { ...previous, cached: true }
    throw new Error('Unable to connect to restaurant services.')
  })
}
