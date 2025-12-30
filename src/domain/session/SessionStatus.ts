/**
 * SessionStatus 列挙型
 * セッションの状態を表す
 */
export enum SessionStatus {
  /** アクティブな状態（見積もり受付中） */
  ACTIVE = 'ACTIVE',
  /** 確定済み（見積もり確定、変更不可） */
  FINALIZED = 'FINALIZED',
}
