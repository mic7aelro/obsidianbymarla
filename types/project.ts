export interface ProjectImage {
  src: string
  width: number
  height: number
}

export interface Project {
  slug: string
  title: string
  year: number
  category: string
  image: string
  imageVersion?: number
  coverAlt: string
  images?: ProjectImage[]
}
