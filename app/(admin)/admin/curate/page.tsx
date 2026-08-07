import CurateShell from '@/components/admin/CurateShell'
import { getCuratableProjects } from '@/data/projects'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

async function getHidden(): Promise<string[]> {
  try {
    const client = await clientPromise
    const docs = await client.db('marla').collection<{ src: string }>('hidden_images').find({}).toArray()
    return docs.map(d => d.src)
  } catch { return [] }
}

async function getDisabled(): Promise<string[]> {
  try {
    const client = await clientPromise
    const docs = await client.db('marla').collection<{ slug: string }>('disabled_collections').find({}).toArray()
    return docs.map(d => d.slug)
  } catch { return [] }
}

export default async function CuratePage() {
  const [hidden, disabled, allProjects] = await Promise.all([getHidden(), getDisabled(), getCuratableProjects()])

  const galleries = allProjects
    .filter(p => p.images && p.images.length > 0)
    .map(p => ({
      slug: p.slug,
      title: p.title,
      disabled: disabled.includes(p.slug),
      coverImage: p.image,
      images: p.images!.map((img: { src: string; width: number; height: number }) => ({
        src: img.src,
        width: img.width,
        height: img.height,
        hidden: hidden.includes(img.src),
      })),
    }))

  return <CurateShell galleries={galleries} />
}
