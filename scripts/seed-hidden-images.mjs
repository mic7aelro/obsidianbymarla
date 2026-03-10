import { MongoClient } from 'mongodb'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const hiddenImages = JSON.parse(readFileSync(join(__dirname, '../data/hidden-images.json'), 'utf8'))

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('MONGODB_URI not set')

const client = new MongoClient(uri)
await client.connect()

const col = client.db('marla').collection('hidden_images')

// Clear existing and re-seed
await col.deleteMany({})
await col.insertMany(hiddenImages.map(src => ({ src })))

console.log(`Seeded ${hiddenImages.length} hidden images.`)
await client.close()
