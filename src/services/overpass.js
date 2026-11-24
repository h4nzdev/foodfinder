import { requestData } from './api'
import { distanceBetween, validCoordinates, webUrl } from '../lib/restaurants'

const endpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const asiaEndpoint = 'https://ovp.dresel.systems/api-as/interpreter'

function normalize(element) {
  const tags = element.tags ?? {}
  const { lat, lon: lng } = element.center ?? element
  if (!validCoordinates(lat, lng)) return
  if (!tags.name?.trim()) return
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:suburb'] || tags['addr:village']
  return {
    id: element.type + '/' + element.id, osmId: element.id, osmType: element.type,
    name: tags.name.trim(), lat, lng, street, city, address: tags['addr:full'] || [street, city].filter(Boolean).join(', '),
    cuisine: tags.cuisine?.split(';').map((item) => item.trim()).filter(Boolean) ?? [],
    amenity: tags.amenity || tags.shop, website: webUrl(tags.website || tags['contact:website']),
    phone: tags.phone || tags['contact:phone'], hours: tags.opening_hours,
    image: webUrl(tags.image), description: tags.description, menuUrl: webUrl(tags['website:menu'] || tags.menu),
    logo: webUrl(tags.logo) || webUrl(tags['brand:logo']),
    logoEntity: tags['brand:wikidata'] || tags.wikidata,
    source: 'OpenStreetMap',
  }
}

function normalizeRestaurants(elements) {
  const groups = new Map()
  const ids = new Set()
  const restaurants = []
  for (const element of elements) {
    const restaurant = normalize(element)
    if (!restaurant || ids.has(restaurant.id)) continue
    ids.add(restaurant.id)
    const name = restaurant.name.toLowerCase()
    const group = groups.get(name) ?? []
    if (group.some((other) => other.osmType !== restaurant.osmType && distanceBetween(other, restaurant) < 0.035)) continue
    group.push(restaurant)
    groups.set(name, group)
    restaurants.push(restaurant)
  }
  return restaurants
}

export async function findOverpassRestaurants(place, radius, signal) {
  const { lat, lng } = place
  const nearPhilippines = lat >= 4 && lat <= 22 && lng >= 116 && lng <= 128
  const candidates = nearPhilippines ? [asiaEndpoint, ...endpoints] : endpoints
  const angularRadius = radius / 6371000
  const latitudeOffset = angularRadius * 180 / Math.PI
  // The discovery service applies the exact distance limit after the bounding-box query.
  const longitudeOffset = nearPhilippines
    ? Math.asin(Math.sin(angularRadius) / Math.cos(lat * Math.PI / 180)) * 180 / Math.PI
    : 0
  const area = nearPhilippines
    ? `(${lat - latitudeOffset},${lng - longitudeOffset},${lat + latitudeOffset},${lng + longitudeOffset})`
    : `(around:${radius},${lat},${lng})`
  const query = '[out:json][timeout:12];(nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]'
    + area + ';nwr["shop"="bakery"]' + area + ';);out body center;'
  for (const endpoint of candidates) {
    try {
      const data = await requestData(endpoint, endpoint, { params: { data: query }, signal, timeout: 15000 })
      if (!data?.remark && Array.isArray(data?.elements)) return normalizeRestaurants(data.elements)
    } catch {
      signal.throwIfAborted()
    }
  }
  throw new Error('Overpass restaurant lookup failed on all endpoints')
}
