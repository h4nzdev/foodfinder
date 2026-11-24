import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, MapPin, Navigation, Search, X } from 'lucide-react'
import { useDiscovery } from '../context/discovery'
import { findLocations } from '../services/geocoding'
import { Button } from './ui/button'

export function LocationSearch() {
  const { selectPlace, locate, geolocation } = useDiscovery()
  const [query, setQuery] = useState('')
  const [state, setState] = useState({ status: 'idle' })
  const request = useRef(null)
  const input = useRef(null)
  useEffect(() => () => request.current?.abort(), [])

  async function submit(event) {
    event.preventDefault()
    if (state.status === 'loading') return
    const term = query.trim()
    if (term.length < 2) {
      setState({ status: 'error', message: 'Enter a city, neighborhood, or address.' })
      input.current?.focus()
      return
    }
    request.current?.abort()
    const { signal } = (request.current = new AbortController())
    setState({ status: 'loading' })
    try {
      const { locations, cached } = await findLocations(term, signal)
      if (!signal.aborted) setState({ status: 'ready', results: locations, cached })
    } catch {
      if (!signal.aborted) setState({ status: 'error', message: navigator.onLine
        ? 'Location search is temporarily unavailable. Please try again.'
        : 'You appear to be offline. Reconnect and try searching again.' })
    }
  }

  function update(value) {
    request.current?.abort()
    setQuery(value)
    setState({ status: 'idle' })
  }

  return (
    <div className="location-search">
      <form className="location-form" onSubmit={submit} role="search"
        onKeyDown={(event) => { if (event.key === 'Escape') update(query) }}>
        <MapPin size={20} aria-hidden="true"/>
        <input ref={input} type="search" name="location" autoComplete="off" aria-label="City, neighborhood, or address"
          placeholder="Enter a city or neighborhood" maxLength={150} value={query} onChange={(event) => update(event.target.value)}/>
        {query && <button className="clear-input" type="button" aria-label="Clear location" onClick={() => { update(''); input.current?.focus() }}><X size={16}/></button>}
        <Button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? <><LoaderCircle className="spin" size={17}/> Searching…</> : <><Search size={17}/> Search</>}
        </Button>
      </form>
      {state.status === 'loading' && <span className="sr-only" role="status">Searching location…</span>}
      {state.status === 'ready' && <div className="location-results">
        {state.cached && <p role="status">Showing previously cached locations.</p>}
        {state.results.length ? <>
          <p>Choose a matching location</p>
          <ul>{state.results.map((place) => <li key={place.id}>
            <button type="button" onClick={() => { selectPlace(place); update(place.name); input.current?.focus() }}>
              <MapPin size={17}/><span><strong>{place.name}</strong><small>{place.label}</small></span>
            </button>
          </li>)}</ul>
        </> : <p role="status">No matching locations. Try adding a city or country.</p>}
      </div>}
      {state.status === 'error' && <p className="location-error" role="alert">{state.message}</p>}
      <button className="locate-link" type="button" disabled={geolocation.status === 'loading'} onClick={locate}>
        {geolocation.status === 'loading' ? <LoaderCircle className="spin" size={16}/> : <Navigation size={16}/>} Use my current location
      </button>
      {geolocation.status === 'error' && <p className="location-error" role="alert">{geolocation.message}</p>}
    </div>
  )
}
