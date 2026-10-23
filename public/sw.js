// Tycoon service worker. Network first, so players always get the latest version;
// the cached copy is only used when there is no connection. Enemy portraits are
// fetched ahead on install, so a fight never opens on a missing face.
const CACHE = 'tycoon-v2'
const PORTRAITS = ['baron', 'blowout', 'briberyScandal', 'claimJumper', 'clawback', 'climateScience', 'combine', 'commission', 'deepwaterDisaster', 'diversified',
  'fracking', 'geneva', 'greenAlternatives', 'greenPoliticians', 'inspector', 'muckraker', 'patentHolder', 'proxyFight', 'railroad', 'rivals', 'saboteur',
  'speculator', 'spill', 'spilledTanker', 'strike', 'theTruth', 'war'].map(p => `./art/enemies/${p}.jpg`)
self.addEventListener('install', e => {
  self.skipWaiting()
  // best effort: one portrait failing doesn't stop the rest
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PORTRAITS.map(u => c.add(u).catch(() => {})))))
})
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
))
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  const page = req.mode === 'navigate'
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
        return res
      })
      // offline: the cached copy, ignoring any retry query; only a page falls back to the game itself
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit ?? (page ? caches.match('./') : Response.error()))),
  )
})
