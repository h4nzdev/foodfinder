import { DEFAULT_LOCATION, validCoordinates, webUrl } from '../lib/restaurants'
import { requestData } from './api'

const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
const baseUrl = 'https://api.geoapify.com'
const osmTypes = { n: 'node', w: 'way', r: 'relation', node: 'node', way: 'way', relation: 'relation' }
const categories = ['catering.restaurant', 'catering.cafe', 'catering.fast_food', 'catering.food_court',
  'catering.ice_cream', 'commercial.food_and_drink.bakery', 'commercial.food_and_drink.ice_cream']
const amenities = {
  'catering.restaurant': 'restaurant', 'catering.cafe': 'cafe', 'catering.fast_food': 'fast_food',
  'catering.food_court': 'food_court', 'catering.ice_cream': 'ice_cream',
  'commercial.food_and_drink.bakery': 'bakery', 'commercial.food_and_drink.ice_cream': 'ice_cream',
}

export const geoapifyConfigured = Boolean(apiKey)

async function geoapify(path, params, signal) {
  const data = await requestData('Geoapify', baseUrl + path, { params: { ...params, apiKey }, signal })
  if (!Array.isArray(data?.features)) throw new Error('Unexpected Geoapify response')
  return data.features
}

function normalizeRestaurant({ properties: p, geometry }) {
  if (!p) return
  const lng = p.lon ?? geometry?.coordinates?.[0]
  const lat = p.lat ?? geometry?.coordinates?.[1]
  const raw = p.datasource?.raw ?? {}
  const name = p.name?.trim() || raw.name?.trim()
  const osmType = Object.hasOwn(osmTypes, raw.osm_type) ? osmTypes[raw.osm_type] : undefined
  const osmId = raw.osm_id
  const id = osmType && /^\d+$/.test(String(osmId)) ? osmType + '/' + osmId
    : p.place_id ? 'geoapify/' + p.place_id : null
  if (!name || !id || !validCoordinates(lat, lng)) return
  const tags = p.categories ?? []
  const amenity = Object.keys(amenities).find((category) => tags.some((tag) => tag === category || tag.startsWith(category + '.')))
  const cuisine = (raw.cuisine ?? p.catering?.cuisine ?? '')
  const cuisineTags = tags.filter((tag) => tag.startsWith('catering.restaurant.') || tag.startsWith('catering.fast_food.'))
    .map((tag) => tag.split('.').at(-1))
  const hours = [p.opening_hours, raw.opening_hours].find((value) => typeof value === 'string' && value.trim())
  return {
    id, osmId, osmType, name, lat, lng, source: 'Geoapify',
    address: p.formatted || p.address_line2, city: p.city, street: p.street,
    amenity: raw.amenity || raw.shop || amenities[amenity] || 'catering',
    cuisine: [...new Set([...String(cuisine).split(';'), ...cuisineTags].map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    website: webUrl(p.website || raw.website || raw['contact:website']),
    phone: p.contact?.phone || raw.phone || raw['contact:phone'],
    hours, image: webUrl(raw.image),
    logo: webUrl(raw.logo) || webUrl(raw['brand:logo']),
    logoEntity: raw['brand:wikidata'] || raw.wikidata,
    description: raw.description, menuUrl: webUrl(raw['website:menu'] || raw.menu),
  }
}

export async function findGeoapifyRestaurants(place, radius, signal) {
  const center = place.lng + ',' + place.lat
  const features = await geoapify('/v2/places', {
    categories: categories.join(','), filter: 'circle:' + center + ',' + radius,
    bias: 'proximity:' + center, limit: 80,
  }, signal)
  return features.map(normalizeRestaurant).filter(Boolean)
}

export async function findGeoapifyLocations(query, signal) {
  const features = await geoapify('/v1/geocode/search', {
    text: query, limit: 6, lang: 'en',
    bias: 'proximity:' + DEFAULT_LOCATION.lng + ',' + DEFAULT_LOCATION.lat + '|countrycode:ph',
  }, signal)
  return features.flatMap(({ properties: p }) => {
    if (!p?.formatted || !validCoordinates(p.lat, p.lon)) return []
    return [{ id: p.place_id ?? p.lat + ',' + p.lon, label: p.formatted, name: p.name || p.address_line1 || p.formatted, lat: p.lat, lng: p.lon }]
  })
}

export async function reverseGeocode(place, signal) {
  if (!geoapifyConfigured) return
  const features = await geoapify('/v1/geocode/reverse', { lat: place.lat, lon: place.lng, lang: 'en', limit: 1 }, signal)
  const p = features[0]?.properties
  if (p) return [...new Set([p.suburb || p.district, p.city || p.town || p.municipality].filter(Boolean))].join(', ')
    || p.address_line2 || p.formatted
}
