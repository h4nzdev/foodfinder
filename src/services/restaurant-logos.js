import { cacheEntries } from './cache'

const logos = cacheEntries(100)

export function findRestaurantLogo(entity) {
  if (!/^Q[1-9]\d*$/.test(entity ?? '')) return
  const cached = logos.get(entity)
  if (cached) return cached

  const params = new URLSearchParams({ action: 'wbgetclaims', entity, property: 'P154', format: 'json', origin: '*' })
  const lookup = fetch('https://www.wikidata.org/w/api.php?' + params, {
    signal: AbortSignal.timeout(5000),
  }).then(async (response) => {
    if (!response.ok) return
    const data = await response.json()
    const filename = data.claims?.P154?.find((claim) =>
      claim.rank !== 'deprecated' && typeof claim.mainsnak?.datavalue?.value === 'string',
    )?.mainsnak.datavalue.value
    if (!filename) return
    const file = encodeURIComponent(filename.replaceAll(' ', '_'))
    return {
      url: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + file + '?width=120',
      source: 'https://commons.wikimedia.org/wiki/File:' + file,
    }
  }).catch(() => undefined)
  logos.set(entity, lookup)
  return lookup
}
