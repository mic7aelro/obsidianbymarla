import { ServiceCategory } from '@/types/service'

export const services: ServiceCategory[] = [
  {
    title: 'Wedding Photography',
    packages: [
      {
        name: 'Engagement Session',
        price: '$350',
        details: '1 hour — 15 edited photos',
      },
      {
        name: 'Elopement Package',
        price: '$900',
        details: '2 hours — 40 edited photos',
      },
      {
        name: 'Wedding Package',
        price: 'From $2,500',
        details: 'Full-day coverage — 100+ edited photos — online gallery',
      },
    ],
  },
  {
    title: 'Styling',
    packages: [
      {
        name: 'Personal Styling',
        price: '$150 / hr',
        details: 'Wardrobe consultation, outfit curation, guided shopping, wardrobe building',
      },
      {
        name: 'Brand Styling',
        price: 'From $500',
        details: 'Visual identity consultation, wardrobe selection for branding shoots',
      },
    ],
  },
  {
    title: 'Photography',
    packages: [
      {
        name: 'Personal Portraits',
        price: '$250',
        details: '1 hour — 10 retouched photos',
      },
      {
        name: 'Headshots',
        price: '$150',
        details: '30 minutes — 5 edited photos',
      },
      {
        name: 'Commercial Photography',
        price: 'From $500',
        details: 'Product, event, or marketing shoots',
      },
    ],
  },
  {
    title: 'Personal Shopping',
    packages: [
      {
        name: 'Sourcing',
        price: '10% of item cost',
        details: 'Personalized concierge sourcing for hard-to-find items. Exclusive access available on request.',
      },
    ],
  },
]
