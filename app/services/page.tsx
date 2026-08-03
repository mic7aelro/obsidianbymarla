import Link from 'next/link'
import { services } from '@/data/services'

export const metadata = {
  title: 'Services',
  description: 'Photography, styling, wedding, and personal shopping services by Marla McLeod.',
}

export default function ServicesPage() {
  return (
    <div className="split-page service-split">
      <header className="split-page__intro">
        <h1 className="display-title">Services</h1>
        <p className="prose">
          Every project is different. Marla brings the same unhurried attention to intimate
          portraits, full wedding days, commercial sets, and personal wardrobes.
        </p>
        <p className="split-page__note">Custom packages available on request</p>
      </header>

      <div className="split-page__content services-panel">
        <p className="services-scroll-cue" aria-hidden="true">
          More services <span>↓</span>
        </p>
        {services.map(category => (
          <section className="service-category" key={category.title}>
            <h2 className="service-category__title">{category.title}</h2>
            <div className="service-packages">
              {category.packages.map(pkg => (
                <div className="service-package" key={pkg.name}>
                  <div>
                    <h3 className="service-package__name">{pkg.name}</h3>
                    <p className="service-package__details">{pkg.details}</p>
                  </div>
                  <p className="service-package__price">{pkg.price}</p>
                </div>
              ))}
            </div>
            <div className="service-category__cta">
              <Link className="text-link" href={`/contact?service=${encodeURIComponent(category.title)}`}>
                Send an inquiry
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
