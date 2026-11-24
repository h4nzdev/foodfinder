export const CACHE_TTL = 30 * 60 * 1000

export function readPreference(key) {
  try {
    const entry = JSON.parse(sessionStorage.getItem('foodfinder:' + key))
    if (entry && Date.now() - entry.createdAt < CACHE_TTL) return entry.value
    sessionStorage.removeItem('foodfinder:' + key)
  } catch { return undefined }
}

export function savePreference(key, value) {
  try {
    sessionStorage.setItem('foodfinder:' + key, JSON.stringify({ value, createdAt: Date.now() }))
  } catch { /* Discovery still works when browser storage is unavailable. */ }
}

export function delay(ms, signal) {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    function abort() {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

export function cacheEntries(limit, lifetime = CACHE_TTL, staleLifetime = lifetime) {
  const entries = new Map()
  return {
    get(key, allowStale = false) {
      const entry = entries.get(key)
      if (!entry) return
      const age = Date.now() - entry.createdAt
      if (age >= staleLifetime) entries.delete(key)
      else if (age < lifetime || allowStale) return entry.value
    },
    set(key, value) {
      entries.delete(key)
      if (entries.size >= limit) entries.delete(entries.keys().next().value)
      entries.set(key, { value, createdAt: Date.now() })
    },
  }
}

// Share identical in-flight requests. Cancel the network request once its last caller leaves.
export function sharedRequests() {
  const pending = new Map()
  return (key, signal, load) => {
    signal.throwIfAborted()
    let entry = pending.get(key)
    if (!entry) {
      const controller = new AbortController()
      entry = { controller, callers: 0, done: false }
      pending.set(key, entry)
      entry.promise = Promise.resolve().then(() => load(controller.signal)).finally(() => {
        entry.done = true
        if (pending.get(key) === entry) pending.delete(key)
      })
    }
    entry.callers += 1
    return new Promise((resolve, reject) => {
      function release() {
        signal.removeEventListener('abort', abort)
        entry.callers -= 1
        if (!entry.done && entry.callers === 0) {
          pending.delete(key)
          entry.controller.abort()
        }
      }
      function abort() {
        release()
        reject(signal.reason)
      }
      signal.addEventListener('abort', abort, { once: true })
      entry.promise.then((value) => {
        if (signal.aborted) return
        release()
        resolve(value)
      }, (error) => {
        if (signal.aborted) return
        release()
        reject(error)
      })
    })
  }
}
