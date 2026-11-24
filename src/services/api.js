import axios from 'axios'

export const api = axios.create({ timeout: 9000 })

const cooldowns = new Map()

export async function requestData(provider, url, { signal, ...options }) {
  signal.throwIfAborted()
  if ((cooldowns.get(provider) ?? 0) > Date.now()) throw new Error(provider + ' is temporarily unavailable')
  try {
    return (await api.get(url, { ...options, signal })).data
  } catch (error) {
    signal.throwIfAborted()
    const status = error.response?.status
    const wait = [401, 403].includes(status) ? 300000 : status === 429 ? 60000 : 12000
    const retryAfter = error.response?.headers?.['retry-after']
    const retryTime = Number.isFinite(Number(retryAfter))
      ? Date.now() + Number(retryAfter) * 1000 : Date.parse(retryAfter)
    cooldowns.set(provider, Math.max(Date.now() + wait, retryTime || 0))
    throw error
  }
}
