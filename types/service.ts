export interface ServicePackage {
  name: string
  price: string
  details: string
}

export interface ServiceCategory {
  title: string
  packages: ServicePackage[]
}
