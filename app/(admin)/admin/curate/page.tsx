import CurateShell from '@/components/admin/CurateShell'
import { projects } from '@/data/projects'
import { promises as fs } from 'fs'
import path from 'path'

async function getHidden(): Promise<string[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'data', 'hidden-images.json'),
      'utf-8'
    )
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default async function CuratePage() {
  const hidden = await getHidden()

  const galleries = projects
    .filter(p => p.images && p.images.length > 0)
    .map(p => ({
      slug: p.slug,
      title: p.title,
      images: p.images!.map(img => ({
        src: img.src,
        width: img.width,
        height: img.height,
        hidden: hidden.includes(img.src),
      })),
    }))

  return <CurateShell galleries={galleries} />
}
