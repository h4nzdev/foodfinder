import { useEffect, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, latLng } from 'leaflet'
import { LoaderCircle, Navigation } from 'lucide-react'
import { Button } from './ui/button'
import { humanize } from '../lib/categories'
import { DEFAULT_LOCATION } from '../lib/restaurants'
import 'leaflet/dist/leaflet.css'

const defaultCenter = [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const userIcon = divIcon({
  className: 'user-location-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  html: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></svg>',
})
const accuracyStyle = { color: '#1764c0', fillOpacity: 0.12, weight: 1, interactive: false }
const icons = [false, true].map((active) => divIcon({
  className: 'restaurant-marker' + (active ? ' active' : ''),
  iconSize: [30, 30], iconAnchor: [15, 24], popupAnchor: [0, -21],
  html: '<svg aria-hidden="true" viewBox="0 0 18 22"><path d="M9 21S2 14.6 2 9a7 7 0 1 1 14 0c0 5.6-7 12-7 12Z"/><circle cx="9" cy="9" r="2.25"/></svg>',
}))

function MapViewport({ place, selected, radius }) {
  const map = useMap()
  const { lat, lng, locationFix } = place
  useEffect(() => {
    const bounds = latLng(lat, lng).toBounds(radius * 2)
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16, animate: false })
  }, [map, lat, lng, locationFix, radius])
  useEffect(() => {
    if (selected) map.panTo([selected.lat, selected.lng], { animate: false })
  }, [map, selected])
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function RestaurantMarker({ restaurant, active, onSelect, onDetails }) {
  const marker = useRef(null)
  useEffect(() => {
    if (active) marker.current?.openPopup()
  }, [active])
  return <Marker ref={marker} icon={icons[active ? 1 : 0]} zIndexOffset={active ? 500 : 0} position={[restaurant.lat, restaurant.lng]} title={restaurant.name}
    eventHandlers={{ click: () => onSelect(restaurant) }}>
    <Popup><strong>{restaurant.name}</strong><br/>{humanize(restaurant.amenity)}
      {restaurant.address && <><br/>{restaurant.address}</>}
      <div className="popup-actions"><Button onClick={() => onDetails(restaurant)}>View details</Button></div>
    </Popup>
  </Marker>
}

export default function RestaurantMap({ place, radius, restaurants, selected, onSelect, onDetails, onLocate, locating }) {
  const [tileError, setTileError] = useState(false)
  return <div className="map-frame">
    <MapContainer className="restaurant-map" center={defaultCenter} zoom={13} scrollWheelZoom>
      <TileLayer url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }}/>
      <MapViewport place={place} radius={radius} selected={selected}/>
      {place.current ? <>
        <Circle center={[place.lat, place.lng]} radius={place.accuracy} pathOptions={accuracyStyle}/>
        <Marker position={[place.lat, place.lng]} icon={userIcon} title="Your location" alt="Your location" zIndexOffset={400}>
          <Popup><strong>Your location</strong><br/>{place.name !== 'Current location' && <>{place.name}<br/></>}
            Estimated accuracy ±{Math.ceil(place.accuracy).toLocaleString()} m
          </Popup>
        </Marker>
      </> : <CircleMarker center={[place.lat, place.lng]} radius={5} pathOptions={{ color: '#694690', fillColor: '#fff', fillOpacity: 1, weight: 2 }}>
        <Popup>{place.name}{place.default && ' (default location)'}</Popup>
      </CircleMarker>}
      {restaurants.map((restaurant) => <RestaurantMarker key={restaurant.id} restaurant={restaurant}
        active={selected?.id === restaurant.id} onSelect={onSelect} onDetails={onDetails}/>)}
    </MapContainer>
    {tileError && <span className="tile-error" role="status">Some map tiles are unavailable.</span>}
    <Button className="map-locate" variant="light" onClick={onLocate} disabled={locating}>
      {locating ? <><LoaderCircle className="spin" size={17}/> Finding location…</> : <><Navigation size={17}/> My location</>}
    </Button>
  </div>
}
