import { EstimationSession } from './EstimationSession';
import { ShareToken } from './ShareToken';

/**
 * SessionRepository インターフェース
 * ドメイン層で定義されるセッションリポジトリの契約
 */
export interface SessionRepository {
  /**
   * ShareTokenでセッションを検索
   * @returns セッションが見つかった場合はEstimationSession、見つからない場合はnull
   */
  findByShareToken(token: ShareToken): Promise<EstimationSession | null>;

  /**
   * IDでセッションを検索
   * @returns セッションが見つかった場合はEstimationSession、見つからない場合はnull
   */
  findById(id: string): Promise<EstimationSession | null>;

  /**
   * オーナーIDでセッション一覧を取得
   * @returns セッションの配列
   */
  findByOwnerId(ownerId: string): Promise<EstimationSession[]>;

  /**
   * プロジェクトIDでセッション一覧を取得
   * @returns セッションの配列
   */
  findByProjectId(projectId: string): Promise<EstimationSession[]>;

  /**
   * セッションを永続化（作成または更新）
   * @returns 永続化されたEstimationSession
   */
  save(session: EstimationSession): Promise<EstimationSession>;

  /**
   * セッションを削除
   */
  delete(id: string): Promise<void>;

  /**
   * ShareToken文字列でセッションを検索
   * ShareToken値オブジェクトを作成せずに検索できる便利メソッド
   * @returns セッションが見つかった場合はEstimationSession、見つからない場合はnull
   */
  findByShareTokenString(shareToken: string): Promise<EstimationSession | null>;
}
