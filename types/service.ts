export interface ServicePackage {
  name: string
  price: string
  details: string
  inquiryLabel: string
}

export interface ServiceCategory {
  title: string
  packages: ServicePackage[]
}
