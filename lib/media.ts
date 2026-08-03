import blobAssets from '@/data/blob-assets.json'

const assets = blobAssets as Record<string, string>

/** Resolve migrated repository image paths while leaving new Blob URLs untouched. */
export function mediaUrl(src: string): string {
  return assets[src] ?? src
}
