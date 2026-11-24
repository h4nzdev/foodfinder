import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { menuCategories } from '../lib/categories'
import { searchMenus } from '../services/menus'
import { Button } from './ui/button'
import { EmptyState, LoadingState } from './EmptyState'

const allMenus = {}
const allDemoMenus = { demo: true }
const uncategorized = { id: 'other', name: 'Other items' }

function formatPrice(entry) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: entry.currency }).format(entry.price)
}

function PriceCard({ entry }) {
  return <article className="price-card">
    {entry.image && <img className="dish-photo" src={entry.image} alt="" loading="lazy"/>}
    <h3>{entry.name}</h3><p>{entry.restaurantName}</p>
    {entry.description && <p>{entry.description}</p>}
    <strong>{Number.isFinite(entry.price) && entry.currency ? formatPrice(entry) : 'Price unavailable'}</strong>
    {entry.availability && <p>{entry.availability}</p>}
    {entry.source && <small>{entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.source}</a> : entry.source}</small>}
    {entry.updatedAt && <small>Last verified <time dateTime={entry.updatedAt}>{entry.updatedAt}</time></small>}
  </article>
}

function ComparisonTable({ entries }) {
  const minimums = new Map()
  const groups = new Map()
  for (const entry of entries) {
    const dish = entry.name.toLowerCase().trim()
    const key = JSON.stringify([dish, entry.currency])
    const group = groups.get(key) ?? new Set()
    group.add(entry.restaurantId)
    groups.set(key, group)
    minimums.set(key, Math.min(minimums.get(key) ?? Infinity, entry.price))
  }
  return <div className="table-scroll" role="region" aria-label="Menu price comparison" tabIndex={0}><table>
    <caption className="sr-only">Menu price comparison</caption>
    <thead><tr><th scope="col">Dish</th><th scope="col">Restaurant</th><th scope="col">Listed price</th><th scope="col">Menu updated</th></tr></thead>
    <tbody>{entries.map((entry) => {
      const key = JSON.stringify([entry.name.toLowerCase().trim(), entry.currency])
      const lowest = groups.get(key).size > 1 && entry.price === minimums.get(key)
      return <tr key={entry.id}><td>{entry.name}</td><td>{entry.restaurantName}</td>
        <td>{formatPrice(entry)} {lowest && <span className="pill">Lowest price</span>}</td>
        <td>{entry.updatedAt ? <time dateTime={entry.updatedAt}>{entry.updatedAt}</time> : 'Unavailable'}
          {entry.source && <small className="menu-source">{entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.source}</a> : entry.source}</small>}</td></tr>
    })}</tbody>
  </table></div>
}

export function MenuResults({ search, restaurantId, comparison }) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!search && !restaurantId) return
    const controller = new AbortController()
    const { signal } = controller
    const timer = setTimeout(async () => {
      try {
        const entries = await searchMenus({ ...search, restaurantId, signal })
        if (!signal.aborted) setResult({ search, restaurantId, attempt, entries })
      } catch {
        if (!signal.aborted) setResult({ search, restaurantId, attempt, error: true })
      }
    }, 180)
    return () => { clearTimeout(timer); controller.abort() }
  }, [search, restaurantId, attempt])

  const current = result?.search === search && result?.restaurantId === restaurantId && result?.attempt === attempt ? result : null
  if ((search || restaurantId) && !current) return <LoadingState label="Loading menu information"/>
  if (current?.error) return <EmptyState type="offline" title="Couldn’t load menu information"
    description="Try again in a moment." action="Try again" onAction={() => setAttempt((count) => count + 1)}/>
  const entries = current?.entries ?? []
  const visible = comparison ? entries.filter((entry) => Number.isFinite(entry.price) && entry.currency) : entries
  if (visible.length && restaurantId) return <div className="restaurant-menu-groups">
    {[...menuCategories, uncategorized].map(({ id, name }) => {
      const items = visible.filter((entry) => (menuCategories.some((category) => category.id === entry.category)
        ? entry.category : uncategorized.id) === id)
      return items.length > 0 && <section key={id}><h4>{name}</h4><div className="menu-grid">
        {items.map((entry) => <PriceCard key={entry.id} entry={entry}/>)}
      </div></section>
    })}
  </div>
  if (visible.length) return comparison ? <ComparisonTable entries={visible}/> :
    <div className="menu-grid">{visible.map((entry) => <PriceCard key={entry.id} entry={entry}/>)}</div>
  if (restaurantId) return <EmptyState type="menu" title="Menu unavailable" description="Menu information is currently unavailable for this restaurant."/>
  if (search?.demo) return <EmptyState type="search" title="No matching sample dishes" description="Try a different dish, category, or maximum price."/>
  return <EmptyState type={comparison ? 'comparison' : 'search'}
    title={comparison ? 'No verified prices available' : search !== allMenus ? 'No matching menu items' : 'No verified menus available'}
    description={comparison ? 'Price comparisons will appear here when verified menu prices are available.'
      : 'Search results will appear here when verified restaurant menus are available.'}/>
}

export function MenuSearch({ comparison = false }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [sort, setSort] = useState('')
  const [demo, setDemo] = useState(false)
  const [search, setSearch] = useState(null)
  return <>
    <form className="menu-search" role="search" onSubmit={(event) => {
      event.preventDefault()
      setSearch({ query: query.trim(), category, maxPrice: budget === '' ? null : Number(budget), sort, demo })
    }}>
      <label htmlFor="dish-input">Dish name</label>
      <div className="menu-search-controls">
        <div className="input-wrap"><Search size={18}/><input id="dish-input" type="search" maxLength={120}
          placeholder="Try chicken, ramen, or coffee" value={query} onChange={(event) => setQuery(event.target.value)}/></div>
        <select aria-label="Food category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {menuCategories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
        <input className="budget-input" type="number" aria-label="Maximum price in Philippine pesos" placeholder="Max price (₱)" min="0" step="0.01"
          value={budget} onChange={(event) => setBudget(event.target.value)}/>
        <select aria-label="Sort menu results" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="">Default order</option><option value="price">Lowest price</option>
        </select>
        <Button type="submit"><Search size={17}/> Search</Button>
        {(query || category || budget || sort || search) && <Button type="button" variant="ghost" onClick={() => {
          setQuery(''); setCategory(''); setBudget(''); setSort(''); setSearch(null)
        }}><X size={16}/> Clear</Button>}
      </div>
      <label className="demo-toggle"><input type="checkbox" checked={demo} onChange={(event) => {
        const enabled = event.target.checked
        setDemo(enabled)
        setSearch((previous) => previous && { ...previous, demo: enabled })
      }}/> Explore sample menus</label>
      {demo && <p className="demo-note" role="status">Demo menu. The restaurants, dishes, and prices below are fictional.</p>}
    </form>
    <section className="menu-results surface" aria-label={comparison ? 'Price comparison results' : 'Dish search results'}>
      <MenuResults search={search ?? (demo ? allDemoMenus : allMenus)} comparison={comparison}/>
    </section>
  </>
}
