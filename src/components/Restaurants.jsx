import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { BookOpen, Clock, ExternalLink, MapPin, Navigation, Phone, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDiscovery } from '../context/discovery'
import { humanize } from '../lib/categories'
import { Button } from './ui/button'
import { EmptyState, LoadingState } from './EmptyState'
import { MenuResults } from './Menus'
import { getMenuLink, hasVerifiedMenu } from '../services/menus'
import { findRestaurantLogo } from '../services/restaurant-logos'

function RestaurantImage({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}/>
}

function RestaurantMonogram({ name }) {
  const words = name.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? []
  const letters = words.length > 1
    ? words.slice(0, 2).map((word) => Array.from(word)[0])
    : Array.from(words[0] ?? name.trim()).slice(0, 2)
  const palette = (name.codePointAt(0) + name.length) % 4
  return <span className="restaurant-monogram" data-palette={palette} aria-hidden="true">{letters.join('').toLocaleUpperCase()}</span>
}

function RestaurantLogo({ restaurant }) {
  const { logo, logoEntity, name } = restaurant
  const badge = useRef(null)
  const [found, setFound] = useState(null)
  const [failed, setFailed] = useState('')
  const needsLookup = Boolean(logoEntity) && (!logo || failed === logo)
  useEffect(() => {
    if (!needsLookup) return
    let current = true
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      findRestaurantLogo(logoEntity)?.then((asset) => {
        if (current && asset) setFound({ ...asset, entity: logoEntity })
      })
    })
    observer.observe(badge.current)
    return () => {
      current = false
      observer.disconnect()
    }
  }, [needsLookup, logoEntity])

  const asset = logo && failed !== logo ? { url: logo } : found?.entity === logoEntity ? found : null
  const image = asset && failed !== asset.url && <img className="restaurant-logo" src={asset.url} alt="" loading="lazy"
    referrerPolicy="no-referrer" onError={() => setFailed(asset.url)}/>
  return <span ref={badge} className="restaurant-badge">
    {image ? (asset.source
      ? <a href={asset.source} target="_blank" rel="noreferrer" aria-label={name + ' logo source'}>{image}</a>
      : image) : <RestaurantMonogram name={name}/>}
  </span>
}

export function RestaurantCard({ restaurant, selected, onSelect, onDetails }) {
  const hasMenuItems = hasVerifiedMenu(restaurant.id)
  const menu = getMenuLink(restaurant)
  return (
    <article className={'restaurant-card' + (selected ? ' selected' : '')}>
      <RestaurantImage key={restaurant.image} src={restaurant.image}/>
      <div className="restaurant-card-body">
        <div className="restaurant-card-heading">
          <RestaurantLogo key={restaurant.logo || restaurant.logoEntity} restaurant={restaurant}/>
          <div><p className="tag">{humanize(restaurant.amenity)}</p><h3>{restaurant.name}</h3></div>
        </div>
        {restaurant.cuisine.length > 0 && <p>{restaurant.cuisine.map(humanize).join(' · ')}</p>}
        <p className="card-address"><MapPin size={15}/>{restaurant.address || 'Address unavailable'}<span> · {restaurant.distance.toFixed(1)} km straight-line</span></p>
        <div className="card-actions">
          <Button variant="outline" onClick={() => onDetails(restaurant)}>View details</Button>
          {menu && <Button asChild variant="ghost"><a href={menu.url} target="_blank" rel="noreferrer"><BookOpen size={16}/> Open menu <ExternalLink size={13}/></a></Button>}
          {!menu && hasMenuItems && <Button variant="ghost" onClick={() => onDetails(restaurant, 'menu')}><BookOpen size={16}/> View menu</Button>}
          {onSelect && <Button variant="ghost" aria-pressed={selected} onClick={() => onSelect(restaurant)}><MapPin size={16}/> Locate on map</Button>}
        </div>
      </div>
    </article>
  )
}

export function RestaurantList({ results, filtered, onClear, onDetails, onSelect, selected, compact }) {
  const { status, error, retry, cached, radius, setRadius } = useDiscovery()
  if (status === 'loading') return <LoadingState label="Loading nearby restaurants"/>
  if (status === 'error') return <EmptyState type="offline" title="Couldn’t load restaurants" description={error} action="Retry" onAction={retry}/>
  return <>
    {cached && <p className="location-notice" role="status">Showing previously cached restaurant results. <button type="button" className="locate-link" onClick={retry}>Retry</button></p>}
    {results.length ? <div className={compact ? 'restaurant-list compact' : 'restaurant-list'}>
      {results.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} selected={selected?.id === restaurant.id}
        onDetails={onDetails} onSelect={onSelect}/>)}
    </div> : <EmptyState type="restaurant" title={filtered ? 'No matching restaurants' : 'No restaurants found in this area'}
      description={filtered ? 'Try another cuisine or clear your filters.' : 'Try another neighborhood or expand your search radius.'}
      action={filtered ? 'Clear filters' : radius < 5000 ? 'Search within 5 km' : undefined} onAction={filtered ? onClear : () => setRadius(5000)}/>}
  </>
}

export function RestaurantDetails({ restaurant, section, onClose }) {
  const { place } = useDiscovery()
  const hasMenuItems = restaurant && hasVerifiedMenu(restaurant.id)
  const menu = restaurant && getMenuLink(restaurant)
  const phone = restaurant?.phone?.split(';')[0].replace(/[^\d+]/g, '')
  const callNumber = /^\+?\d{3,15}$/.test(phone ?? '') ? phone : null
  const destination = restaurant && [restaurant.lat, restaurant.lng].join(',')
  const directions = place && !place.default
    ? new URLSearchParams({ engine: 'fossgis_osrm_car', route: [place.lat + ',' + place.lng, destination].join(';') })
    : new URLSearchParams({ to: destination })
  return <Dialog.Root open={Boolean(restaurant)} onOpenChange={(open) => { if (!open) onClose() }}>
    {restaurant && <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay"/>
      <Dialog.Content className="dialog-content" onOpenAutoFocus={(event) => {
        if (section === 'menu') {
          event.preventDefault()
          document.getElementById('restaurant-menu')?.focus()
        }
      }}>
        <Dialog.Close className="icon-button dialog-close" aria-label="Close details"><X size={21}/></Dialog.Close>
        <div className="restaurant-card-heading details-heading">
          <RestaurantLogo key={restaurant.id} restaurant={restaurant}/>
          <div><p className="tag">{humanize(restaurant.amenity)}</p><Dialog.Title>{restaurant.name}</Dialog.Title></div>
        </div>
        <Dialog.Description className="muted">{restaurant.cuisine.length ? restaurant.cuisine.map(humanize).join(' · ') : 'Restaurant information from ' + restaurant.source}</Dialog.Description>
        <RestaurantImage key={restaurant.image} src={restaurant.image}/>
        {restaurant.description && <p className="restaurant-description">{restaurant.description}</p>}
        <ul className="details-facts">
          <li><MapPin size={18}/><span>{restaurant.address || 'Address unavailable'}<small>{restaurant.lat.toFixed(5)}, {restaurant.lng.toFixed(5)}</small></span></li>
          {restaurant.phone && <li><Phone size={17}/><span>{restaurant.phone}</span></li>}
          {restaurant.hours && <li><Clock size={17}/><span>{restaurant.hours}<small>Listed opening hours</small></span></li>}
          {restaurant.website && <li><ExternalLink size={17}/><a href={restaurant.website} target="_blank" rel="noreferrer">Restaurant website</a></li>}
        </ul>
        <div className="details-actions">
          <Button asChild><a href={'https://www.openstreetmap.org/directions?' + directions} target="_blank" rel="noreferrer"><Navigation size={17}/> Get directions</a></Button>
          <Button asChild variant="outline"><Link to={'/explore?restaurant=' + encodeURIComponent(restaurant.id)} onClick={onClose}><MapPin size={17}/> View on map</Link></Button>
        </div>
        <section className="details-menu" id="restaurant-menu" tabIndex={-1}><h3>Menu</h3>
          {menu && <div className="menu-link-details">
            <p><a href={menu.url} target="_blank" rel="noreferrer">Open menu <ExternalLink size={14}/></a></p>
            {menu.source && <small>{menu.source} · Checked <time dateTime={menu.checkedDate}>{menu.checkedDate}</time></small>}
          </div>}
          {hasMenuItems && <MenuResults restaurantId={restaurant.id}/>}
          {!hasMenuItems && !menu && <>
            <p className="muted">Menu not available in FoodFinder.</p>
            {restaurant.website && <p><a href={restaurant.website} target="_blank" rel="noreferrer">Visit website <ExternalLink size={14}/></a></p>}
            {callNumber && <p><a href={'tel:' + callNumber}>Call restaurant <Phone size={14}/></a></p>}
          </>}
        </section>
      </Dialog.Content>
    </Dialog.Portal>}
  </Dialog.Root>
}
