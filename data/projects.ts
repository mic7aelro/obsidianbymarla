import { Project, ProjectImage } from '@/types/project'

function gallery(slug: string, dims: [number, number][]): ProjectImage[] {
  return dims.map(([width, height], i) => ({
    src: `/images/projects/${slug}/${i + 1}.jpg`,
    width,
    height,
  }))
}

export const projects: Project[] = [
  {
    slug: 'nyfw-23',
    title: 'NYFW 23',
    year: 2023,
    category: 'Runway',
    image: '/images/projects/nyfw-23/cover.jpg',
    coverAlt: 'NYFW 2023 runway styling by Marla McLeod',
    images: gallery('nyfw-23', Array(89).fill([1600, 2400])),
  },
  {
    slug: 'rylee-2023',
    title: 'RYLEE 2023',
    year: 2023,
    category: 'Editorial',
    image: '/images/projects/rylee-2023/cover.jpg',
    coverAlt: 'RYLEE 2023 editorial by Marla McLeod',
    images: gallery('rylee-2023', [
      [1600,2400],[1600,2400],[1600,2400],[1920,1280],[1920,1280],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1448,2172],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1920,1280],
      [1920,1280],[1920,1280],[1920,1280],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1600,2400],[1600,2400],
      [1600,2400],[1600,2400],[1600,2400],[1080,1920],[1080,1920],
      [1080,1920],[1080,1920],[1080,1920],[1080,1920],[1080,1920],
      [1080,1920],[1080,1920],[1080,1920],[1080,1920],[1080,1920],
      [1080,1920],[1080,1920],[1080,1920],[1080,1920],[1080,1920],
      [1080,1920],[1080,1920],[1080,1920],[1080,1920],[1080,1920],
      [1080,1920],
    ]),
  },
  {
    slug: 'cailin-2021',
    title: 'Cailin 2021',
    year: 2021,
    category: 'Portrait',
    image: '/images/projects/cailin-2021/cover.jpg',
    coverAlt: 'Cailin 2021 portrait series by Marla McLeod',
    images: gallery('cailin-2021', [
      [1280,1920],[1280,1920],[1280,1920],[1280,1920],[1280,1920],
      [1280,1920],[1280,1920],[1280,1920],[1280,1877],[1280,1920],
      [1280,1920],[1280,1920],[1280,1920],[1280,1920],[1280,1920],
      [1188,1782],[1188,1782],[1188,1782],[1188,1782],[1188,1782],
    ]),
  },
  {
    slug: 'rachel-halloween-2021',
    title: 'Rachel Halloween 2021',
    year: 2021,
    category: 'Styling',
    image: '/images/projects/rachel-halloween-2021/cover.jpg',
    coverAlt: 'Rachel Halloween 2021 styling by Marla McLeod',
    images: gallery('rachel-halloween-2021', Array(5).fill([1280, 1920])),
  },
  {
    slug: 'barbie-gets-dressed',
    title: 'Barbie Gets Dressed',
    year: 2021,
    category: 'Editorial — Strike Magazine',
    image: '/images/projects/barbie-gets-dressed/cover.jpg',
    coverAlt: 'Barbie Gets Dressed — Strike Magazine 2021 by Marla McLeod',
    images: gallery('barbie-gets-dressed', [
      [1280,1920],[1280,1769],[1280,1920],[1280,1819],[1114,1784],
    ]),
  },
  {
    slug: 'annia-2021',
    title: 'ANNIA 2021',
    year: 2021,
    category: 'Editorial',
    image: '/images/projects/annia-2021/cover.jpg',
    coverAlt: 'ANNIA 2021 editorial by Marla McLeod',
    images: gallery('annia-2021', [
      [1242,2208],[1242,2208],[1242,2208],[1280,1920],[1280,1920],
      [1280,1920],[1280,1920],[1280,1920],[1280,1920],[1280,1920],
      [1280,1920],[1280,1920],[1280,1920],[1280,1920],[1280,1920],
      [1280,1920],[1280,1920],[1280,1920],[1280,1920],[1280,1920],
      [1280,1920],[1280,1920],
    ]),
  },
]
