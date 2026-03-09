import CurateShell from '@/components/admin/CurateShell'
import { projects as rawProjects } from '@/data/projects'
import clientPromise from '@/lib/mongodb'

async function getHidden(): Promise<string[]> {
  try {
    const client = await clientPromise
    const docs = await client.db('marla').collection<{ src: string }>('hidden_images').find({}).toArray()
    return docs.map(d => d.src)
  } catch { return [] }
}

async function getDynamicCollections() {
  try {
    const client = await clientPromise
    const docs = await client.db('marla').collection('collections').find({}).toArray()
    return docs.map(({ _id, ...rest }) => rest)
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
  const [hidden, dynamic, disabled] = await Promise.all([getHidden(), getDynamicCollections(), getDisabled()])
  const seen = new Set(rawProjects.map((p: { slug: string }) => p.slug))
  const allProjects = [...rawProjects, ...dynamic.filter((p: Record<string, unknown>) => !seen.has(p.slug as string))]

  const galleries = allProjects
    .filter(p => p.images && p.images.length > 0)
    .map(p => ({
      slug: p.slug,
      title: p.title,
      disabled: disabled.includes(p.slug),
      images: p.images!.map((img: { src: string; width: number; height: number }) => ({
        src: img.src,
        width: img.width,
        height: img.height,
        hidden: hidden.includes(img.src),
      })),
    }))

  return <CurateShell galleries={galleries} />
}
