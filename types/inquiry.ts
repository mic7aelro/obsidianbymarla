export type InquiryStatus =
  | 'pending'
  | 'reviewed'
  | 'awaiting_deposit'
  | 'confirmed'
  | 'completed'

export interface Inquiry {
  _id?: string
  name: string
  email: string
  phone?: string
  service: string
  message: string
  status: InquiryStatus
  createdAt: Date
  updatedAt: Date
}

export interface InquiryEvent {
  _id?: string
  inquiryId: string
  clientName: string
  clientEmail: string
  service: string
  date?: Date
  depositPaid: boolean
  invoiceSentAt?: Date
  createdAt: Date
  updatedAt: Date
}
