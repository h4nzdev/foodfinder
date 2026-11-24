import { demoEntries, menuLinks, verifiedEntries } from './menu-data.js'

export function getMenuLink(restaurant) {
  return menuLinks.get(restaurant.id) || (restaurant.menuUrl ? { url: restaurant.menuUrl } : null)
}

export function hasVerifiedMenu(restaurantId) {
  return verifiedEntries.some((entry) => entry.restaurantId === restaurantId)
}

export async function searchMenus({ query, category, restaurantId, maxPrice, demo, sort, signal }) {
  signal.throwIfAborted()
  const search = query?.trim().toLowerCase()
  const entries = demo && !restaurantId ? demoEntries : verifiedEntries
  const matches = entries.filter((entry) =>
    (!search || entry.name.toLowerCase().includes(search))
    && (!category || entry.category === category)
    && (!restaurantId || entry.restaurantId === restaurantId)
    && (maxPrice == null || (entry.currency === 'PHP' && Number.isFinite(entry.price) && entry.price <= maxPrice)),
  )
  if (sort === 'price') {
    matches.sort((a, b) => {
      const aPriced = Number.isFinite(a.price) && a.currency
      const bPriced = Number.isFinite(b.price) && b.currency
      if (!aPriced || !bPriced) return Number(Boolean(bPriced)) - Number(Boolean(aPriced))
      return a.currency.localeCompare(b.currency) || a.price - b.price
    })
  }
  return matches
}
