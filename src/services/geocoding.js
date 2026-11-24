import { CACHE_TTL, cacheEntries, delay, sharedRequests } from './cache'
import { findGeoapifyLocations, geoapifyConfigured } from './geoapify'
import { findNominatimLocations } from './nominatim'

const cache = cacheEntries(40, CACHE_TTL, 24 * 60 * 60 * 1000)
const shareRequest = sharedRequests()

// Called only on explicit form submission. Nominatim never receives keystrokes.
export async function findLocations(query, signal) {
  signal.throwIfAborted()
  const text = query.trim().replace(/\s+/g, ' ')
  const key = text.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  return shareRequest(key, signal, async (requestSignal) => {
    if (geoapifyConfigured) {
      await delay(300, requestSignal)
      try {
        const result = { locations: await findGeoapifyLocations(text, requestSignal) }
        requestSignal.throwIfAborted()
        cache.set(key, result)
        return result
      } catch {
        requestSignal.throwIfAborted()
      }
    }
    try {
      const result = { locations: await findNominatimLocations(text, requestSignal) }
      requestSignal.throwIfAborted()
      cache.set(key, result)
      return result
    } catch (error) {
      requestSignal.throwIfAborted()
      const previous = cache.get(key, true)
      if (previous) return { ...previous, cached: true }
      throw error
    }
  })
}
