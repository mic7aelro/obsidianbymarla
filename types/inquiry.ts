export type InquiryStatus =
  | 'pending'
  | 'reviewed'

export type EventStatus =
  | 'awaiting_deposit'
  | 'confirmed'
  | 'completed'

export interface Inquiry {
  _id?: string
  name: string
  email: string
  phone?: string
  location?: string
  service: string
  message: string
  status: InquiryStatus
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InquiryEvent {
  _id?: string
  inquiryId: string
  clientName: string
  clientEmail: string
  service: string
  location?: string
  date?: Date
  depositPaid: boolean
  invoiceSentAt?: Date
  status: EventStatus
  archived: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}
