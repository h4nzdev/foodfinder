import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BookOpen, LayoutList, Map, MapPin, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { categories, filterRestaurants } from '../lib/categories'
import { useDiscovery } from '../context/discovery'
import { LocationSearch } from '../components/LocationSearch'
import { RestaurantList } from '../components/Restaurants'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { readPreference, savePreference } from '../services/cache'
import { getMenuLink, hasVerifiedMenu } from '../services/menus'

const RestaurantMap = lazy(() => import('../components/RestaurantMap'))
const pageSize = 30

export function Explore({ onDetails }) {
  const [params, setParams] = useSearchParams()
  const [preferredCategory, setPreferredCategory] = useState(() => readPreference('explore-category') || '')
  const category = params.get('category') ?? preferredCategory
  const sort = params.get('sort') === 'name' ? 'name' : 'distance'
  const restaurantId = params.get('restaurant')
  const mapView = params.get('view') !== 'list'
  const menusOnly = params.get('menus') === '1'
  const { place, restaurants, radius, setRadius, status, geolocation, locate } = useDiscovery()
  const query = params.get('q') || ''
  const resultPanel = useRef(null)
  const matching = filterRestaurants(restaurants, category, query)
  const results = menusOnly ? matching.filter((restaurant) => getMenuLink(restaurant) || hasVerifiedMenu(restaurant.id)) : matching
  if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name))
  const selected = restaurants.find(({ id }) => restaurantId === id)
  const pageKey = JSON.stringify([place?.lat, place?.lng, category, query, radius, sort, menusOnly])
  const [pagination, setPagination] = useState({ key: '', count: pageSize })
  const count = pagination.key === pageKey ? pagination.count : pageSize
  const visible = results.slice(0, count)
  if (selected && !visible.includes(selected)) visible.push(selected)
  const mapResults = selected && !results.includes(selected) ? [...results, selected] : results

  useEffect(() => {
    const panel = resultPanel.current
    const card = selected && panel?.querySelector('.selected')
    if (!card || panel.scrollHeight <= panel.clientHeight) return
    const top = card.getBoundingClientRect().top - panel.getBoundingClientRect().top
    if (top < 0 || top + card.offsetHeight > panel.clientHeight) {
      panel.scrollTop += top - 8
    }
  }, [selected, mapView])

  function update(values, replace = false) {
    const next = new URLSearchParams(params)
    if ('category' in values) {
      const selectedCategory = values.category || ''
      savePreference('explore-category', selectedCategory)
      setPreferredCategory(selectedCategory)
    }
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'category' || value) next.set(key, value || '')
      else next.delete(key)
    })
    setParams(next, { replace, preventScrollReset: true })
  }

  function choose(restaurant) {
    update({ restaurant: restaurant.id, view: null }, true)
  }

  return <div className="page-shell inner-page explore-page">
    <motion.header className="page-heading explore-heading" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
      <div><h1>Explore nearby</h1><p>Browse restaurants around a neighborhood or your current location.</p></div>
      <div className="explore-location"><LocationSearch/></div>
    </motion.header>
    <section aria-label="Restaurant explorer" className="explorer">
      <div className="explorer-toolbar">
        <div className="input-wrap"><Search size={17}/><input aria-label="Filter by restaurant name" type="search"
          placeholder="Filter by restaurant name" value={query} onChange={(event) => update({ q: event.target.value, restaurant: null }, true)}/></div>
        <select aria-label="Filter by cuisine" value={category} onChange={(event) => update({ category: event.target.value, restaurant: null }, true)}>
          <option value="">All cuisines</option>{categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Sort restaurants" value={sort} onChange={(event) => update({ sort: event.target.value === 'name' ? 'name' : null }, true)}>
          <option value="distance">Nearest first</option><option value="name">Name A–Z</option>
        </select>
        <select aria-label="Search radius" value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
          <option value={1000}>Within 1 km</option><option value={3000}>Within 3 km</option><option value={5000}>Within 5 km</option>
        </select>
        <Button variant={menusOnly ? 'default' : 'outline'} aria-pressed={menusOnly} onClick={() => update({ menus: menusOnly ? null : '1', restaurant: null }, true)}><BookOpen size={17}/> Has menu</Button>
        <div className="view-toggle" aria-label="Results view">
          <button type="button" aria-pressed={mapView} onClick={() => update({ view: null }, true)}><Map size={17}/> Map</button>
          <button type="button" aria-pressed={!mapView} onClick={() => update({ view: 'list' }, true)}><LayoutList size={17}/> List</button>
        </div>
      </div>
      <div className={'explorer-grid' + (mapView ? ' map-view' : ' list-view')}>
        {mapView && <Suspense fallback={<div className="map-frame map-loading" role="status">Loading map…</div>}>
          <RestaurantMap place={place} radius={radius} restaurants={mapResults} selected={selected}
            onSelect={choose} onDetails={onDetails} onLocate={locate} locating={geolocation.status === 'loading'}/>
        </Suspense>}
        <div className="explorer-results" ref={resultPanel}>
          {place && <div className="results-heading"><MapPin size={17}/><div><strong>{place.name}{place.default && ' (default location)'}</strong><p aria-live="polite">
            {status === 'ready' ? results.length + (results.length === 1 ? ' restaurant' : ' restaurants') : status === 'loading' ? 'Searching nearby…' : 'Results unavailable'}
          </p></div></div>}
          <RestaurantList results={visible} filtered={Boolean(category || query || menusOnly)} onClear={() => update({ q: null, category: null, menus: null, restaurant: null }, true)}
            onDetails={onDetails} onSelect={choose} selected={selected} compact={mapView}/>
          {count < results.length && <div className="more-results"><Button variant="outline" onClick={() => setPagination({ key: pageKey, count: count + pageSize })}>Show more restaurants</Button></div>}
        </div>
      </div>
    </section>
  </div>
}
