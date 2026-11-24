import { Soup, Sandwich, CookingPot, Fish, Coffee, Pizza, Hamburger, IceCreamCone, Utensils, Croissant } from 'lucide-react'

export const categories = [
  { id: 'restaurant', name: 'Restaurants', icon: Utensils, color: 'mint', tags: ['restaurant'] },
  { id: 'filipino', name: 'Filipino', icon: Soup, color: 'peach', tags: ['filipino'] },
  { id: 'fast_food', name: 'Fast Food', icon: Sandwich, color: 'yellow', tags: ['fast_food'] },
  { id: 'korean', name: 'Korean', icon: CookingPot, color: 'rose', tags: ['korean'] },
  { id: 'japanese', name: 'Japanese', icon: Fish, color: 'mint', tags: ['japanese', 'sushi', 'ramen'] },
  { id: 'chinese', name: 'Chinese', icon: Soup, color: 'rose', tags: ['chinese'] },
  { id: 'italian', name: 'Italian', icon: Pizza, color: 'sand', tags: ['italian'] },
  { id: 'bakery', name: 'Bakeries', icon: Croissant, color: 'peach', tags: ['bakery'] },
  { id: 'cafe', name: 'Café', icon: Coffee, color: 'sand', tags: ['cafe', 'coffee_shop'] },
  { id: 'pizza', name: 'Pizza', icon: Pizza, color: 'yellow', tags: ['pizza'] },
  { id: 'burger', name: 'Burgers', icon: Hamburger, color: 'peach', tags: ['burger'] },
  { id: 'dessert', name: 'Desserts', icon: IceCreamCone, color: 'rose', tags: ['dessert', 'ice_cream', 'cake'] },
  { id: 'street_food', name: 'Street Food', icon: Utensils, color: 'mint', tags: ['street_food'] },
]

export const menuCategories = [
  { id: 'meals', name: 'Meals' }, { id: 'snacks', name: 'Snacks' },
  { id: 'drinks', name: 'Drinks' }, { id: 'desserts', name: 'Desserts' },
]

export function filterRestaurants(restaurants, category, query = '') {
  const tags = categories.find(({ id }) => id === category)?.tags
  const name = query.trim().toLowerCase()
  return restaurants.filter((restaurant) =>
    (!tags || [restaurant.amenity, ...restaurant.cuisine].some((value) => tags.includes(value?.toLowerCase())))
    && restaurant.name.toLowerCase().includes(name),
  )
}

export function humanize(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
