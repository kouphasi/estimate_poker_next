// セッション関連の型定義

export interface Session {
  id: string
  shareToken: string
  isRevealed: boolean
  status: SessionStatus
  finalEstimate: number | null
}

export type SessionStatus = 'ACTIVE' | 'FINALIZED'

export interface Estimate {
  nickname: string
  value: number
  updatedAt: string | Date
}

export interface CreateSessionResponse {
  sessionId: string
  shareToken: string
  ownerToken: string
  shareUrl: string
}

export interface SessionDataResponse {
  session: Session
  estimates: Estimate[]
}
