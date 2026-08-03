import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../data/blob-assets.json', import.meta.url), 'utf8'))
const assets = Object.entries(manifest)
const concurrency = 20
let cursor = 0
const failures = []

async function worker() {
  while (cursor < assets.length) {
    const [pathname, url] = assets[cursor++]
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
        failures.push({ pathname, status: response.status, contentType: response.headers.get('content-type') })
      }
    } catch (error) {
      failures.push({ pathname, error: error instanceof Error ? error.message : String(error) })
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))

if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
} else {
  console.log(`Verified ${assets.length} public image URLs.`)
}
