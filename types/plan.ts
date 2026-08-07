export interface PlanDraft {
  id: string
  mediaUrl: string
  width: number
  height: number
  fileName: string
  caption: string
  createdAt: string
  updatedAt: string
}

export interface InstagramMedia {
  id: string
  caption: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  mediaUrl: string
  thumbnailUrl: string | null
  permalink: string
  timestamp: string
}

export interface PlanBoardResponse {
  drafts: PlanDraft[]
  gridOffset: number
}

export interface InstagramFeedResponse {
  connected: boolean
  username: string | null
  items: InstagramMedia[]
  message?: string
}
