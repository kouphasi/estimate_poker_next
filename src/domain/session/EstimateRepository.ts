import { Estimate } from './Estimate';

/**
 * EstimateRepository インターフェース
 * ドメイン層で定義される見積もりリポジトリの契約
 */
export interface EstimateRepository {
  /**
   * セッションIDで見積もり一覧を取得
   * @returns 見積もりの配列
   */
  findBySessionId(sessionId: string): Promise<Estimate[]>;

  /**
   * セッションIDとユーザーIDで見積もりを検索
   * @returns 見積もりが見つかった場合はEstimate、見つからない場合はnull
   */
  findBySessionAndUser(sessionId: string, userId: string): Promise<Estimate | null>;

  /**
   * 見積もりを永続化（作成または更新）
   * @returns 永続化されたEstimate
   */
  save(estimate: Estimate): Promise<Estimate>;

  /**
   * 見積もりを削除
   */
  delete(id: string): Promise<void>;

  /**
   * セッションに関連するすべての見積もりを削除（カスケード）
   */
  deleteBySessionId(sessionId: string): Promise<void>;

  /**
   * 見積もりを作成または更新（upsert）
   * セッションIDとユーザーIDで一意に特定し、存在すれば更新、なければ作成
   * @returns 永続化されたEstimate
   */
  upsert(
    sessionId: string,
    userId: string,
    nickname: string,
    value: number
  ): Promise<Estimate>;
}
