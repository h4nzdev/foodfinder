import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DiscoveryContext } from './discovery'
import { DEFAULT_LOCATION, DEFAULT_RADIUS, validCoordinates } from '../lib/restaurants'
import { findRestaurants } from '../services/restaurant-service'
import { reverseGeocode } from '../services/geoapify'
import { readPreference, savePreference } from '../services/cache'

const locationTimeout = 10000
const targetAccuracy = 25

function initialPlace() {
  const previous = readPreference('manual-location')
  return previous?.name && validCoordinates(previous.lat, previous.lng) ? previous : DEFAULT_LOCATION
}

export function DiscoveryProvider({ children }) {
  const [place, setPlace] = useState(initialPlace)
  const [radius, changeRadius] = useState(() => {
    const previous = readPreference('radius')
    return [1000, 3000, 5000].includes(previous) ? previous : DEFAULT_RADIUS
  })
  const [retryCount, setRetryCount] = useState(0)
  const [result, setResult] = useState(null)
  const [geolocation, setGeolocation] = useState({ status: 'idle' })
  const locationRequest = useRef(0)
  const stopLocating = useRef(null)
  const reverseRequest = useRef(null)
  const { lat, lng } = place
  const requestKey = [lat, lng, radius, retryCount].join(',')

  useEffect(() => () => {
    locationRequest.current += 1
    stopLocating.current?.()
    reverseRequest.current?.abort()
  }, [])

  function setRadius(value) {
    changeRadius(value)
    savePreference('radius', value)
  }

  function selectPlace(nextPlace) {
    locationRequest.current += 1
    stopLocating.current?.()
    reverseRequest.current?.abort()
    toast.dismiss('geolocation')
    setGeolocation({ status: 'idle' })
    setPlace(nextPlace)
    savePreference('manual-location', nextPlace)
  }

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const timer = setTimeout(async () => {
      try {
        const data = await findRestaurants({ lat, lng }, radius, signal)
        if (!signal.aborted) {
          setResult({ key: requestKey, ...data })
        }
      } catch {
        if (!signal.aborted) {
          setResult({ key: requestKey, error: navigator.onLine
            ? 'Unable to connect to restaurant services. Try again in a moment.'
            : 'You appear to be offline. Reconnect to load restaurant results.' })
        }
      }
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [lat, lng, radius, requestKey])

  function locate() {
    if (stopLocating.current) return
    const id = 'geolocation'
    const request = ++locationRequest.current
    reverseRequest.current?.abort()
    const fail = (message) => {
      if (request !== locationRequest.current) return
      setGeolocation({ status: 'error', message })
      toast.error(message, { id })
    }
    if (!navigator.geolocation) {
      fail('This browser cannot share your location. Search for a city or neighborhood instead.')
      return
    }
    setGeolocation({ status: 'loading' })
    toast.loading('Finding your location…', { id })
    const messages = {
      1: 'Location permission was denied. Allow access in your browser or search for an area.',
      2: 'Your location is unavailable. Try searching for an area.',
      3: 'Finding your location timed out. Try again or search for an area.',
    }
    let bestFix
    let timer
    let watchId
    stopLocating.current = () => {
      clearTimeout(timer)
      navigator.geolocation.clearWatch(watchId)
      stopLocating.current = null
    }

    async function finish(errorCode = 2) {
      if (request !== locationRequest.current || !stopLocating.current) return
      stopLocating.current()
      if (errorCode === 1 || !bestFix) {
        fail(messages[errorCode] || messages[2])
        return
      }
      const gpsPlace = { name: 'Current location', current: true, locationFix: request, ...bestFix }
      setPlace(gpsPlace)
      setGeolocation({ status: 'success' })
      toast.success(bestFix.accuracy <= targetAccuracy ? 'Current location found' : 'Approximate location found', { id })
      const controller = new AbortController()
      reverseRequest.current = controller
      try {
        const name = await reverseGeocode(gpsPlace, controller.signal)
        if (name && !controller.signal.aborted && request === locationRequest.current) setPlace({ ...gpsPlace, name })
      } catch { /* Keep using the GPS coordinates when a readable name is unavailable. */ }
    }

    watchId = navigator.geolocation.watchPosition(({ coords }) => {
      if (request !== locationRequest.current || !stopLocating.current) return
      const { latitude: lat, longitude: lng, accuracy } = coords
      if (!validCoordinates(lat, lng) || !Number.isFinite(accuracy) || accuracy < 0) {
        finish()
        return
      }
      if (!bestFix) timer = setTimeout(finish, locationTimeout)
      if (!bestFix || accuracy <= bestFix.accuracy) bestFix = { lat, lng, accuracy }
      if (accuracy <= targetAccuracy) finish()
    }, ({ code }) => {
      finish(code)
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: locationTimeout })
  }

  const current = result?.key === requestKey ? result : null
  const status = !current ? 'loading' : current.error ? 'error' : 'ready'
  return (
    <DiscoveryContext.Provider value={{
      place, selectPlace, radius, setRadius, status, error: current?.error, cached: current?.cached,
      restaurants: current?.restaurants ?? [], retry: () => setRetryCount((count) => count + 1),
      geolocation, locate,
    }}>
      {children}
    </DiscoveryContext.Provider>
  )
}
