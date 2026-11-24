import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Map, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDiscovery } from '../context/discovery'
import { categories, filterRestaurants } from '../lib/categories'
import { LocationSearch } from '../components/LocationSearch'
import { RestaurantList } from '../components/Restaurants'
import { Button } from '../components/ui/button'
import { readPreference, savePreference } from '../services/cache'

export function Home({ onDetails }) {
  const [category, changeCategory] = useState(() => readPreference('home-category') || '')
  const [query, setQuery] = useState('')
  const { place, restaurants, status, radius, setRadius } = useDiscovery()
  const results = filterRestaurants(restaurants, category, query)
  const params = new URLSearchParams()
  params.set('category', category)
  if (query) params.set('q', query)
  const explore = '/explore?' + params
  function setCategory(value) {
    changeCategory(value)
    savePreference('home-category', value)
  }
  return <div className="page-shell home">
    <section className="discover-hero" aria-labelledby="hero-title">
      <motion.div className="discover-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48 }}>
          <h1 id="hero-title">Good food.<br/><em>Closer than you think.</em></h1>
          <p>Find local restaurants, browse menus, and decide what to eat nearby.</p>
      </motion.div>
      <motion.div className="discover-photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.72 }} aria-hidden="true"><div/></motion.div>
      <motion.div className="discover-search" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.42 }}>
        <LocationSearch/>
        <div className="discover-actions">
          <Button asChild variant="outline"><Link to={explore}><Map size={17}/> Explore the map</Link></Button>
          <Button asChild variant="ghost"><Link to="/food-search"><BookOpen size={17}/> Find a dish</Link></Button>
        </div>
      </motion.div>
    </section>

    <section className="home-section" aria-labelledby="categories">
      <div className="section-heading">
        <div><h2 id="categories">Explore by cuisine</h2></div>
        {category && <Button variant="ghost" onClick={() => setCategory('')}>Clear filter</Button>}
      </div>
      <div className="category-grid">
        {categories.map(({ id, name, icon: Icon, color }, index) => <motion.button type="button" className="category-card"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: Math.min(index, 7) * 0.035 }}
          aria-pressed={category === id} key={id} onClick={() => setCategory(category === id ? '' : id)}>
          <span className={'category-icon ' + color}><Icon size={25} strokeWidth={1.65}/></span>{name}
        </motion.button>)}
      </div>
    </section>

    <section className="home-section nearby-section" aria-labelledby="nearby">
      <div className="section-heading">
        <div><h2 id="nearby">Nearby restaurants</h2>
          <p aria-live="polite">{status === 'ready' ? results.length + ' places near ' : 'Near '}{place.name}{place.default && ' (default location)'}</p></div>
        <Button asChild variant="outline"><Link to={explore + '&menus=1'}><BookOpen size={17}/> Places with menus</Link></Button>
      </div>
      <div className="nearby-layout">
        <div className="home-filters">
          <label htmlFor="nearby-name">Restaurant name</label>
          <div className="input-wrap"><Search size={17}/><input id="nearby-name" type="search"
            placeholder="Filter by name" value={query} onChange={(event) => setQuery(event.target.value)}/></div>
          <label htmlFor="nearby-radius">Distance</label>
          <select id="nearby-radius" value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
            <option value={1000}>Within 1 km</option><option value={3000}>Within 3 km</option><option value={5000}>Within 5 km</option>
          </select>
        </div>
        <div className="nearby-results">
          <RestaurantList results={results.slice(0, 6)} filtered={Boolean(category || query)} onClear={() => { setCategory(''); setQuery('') }} onDetails={onDetails}/>
          {results.length > 6 && <div className="more-results"><Button asChild variant="outline"><Link to={explore + '&view=list'}>See all {results.length} restaurants</Link></Button></div>}
        </div>
      </div>
    </section>
  </div>
}
