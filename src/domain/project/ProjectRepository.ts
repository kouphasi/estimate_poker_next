import { Project } from './Project';

/**
 * ProjectRepository インターフェース
 * ドメイン層で定義されるプロジェクトリポジトリの契約
 */
export interface ProjectRepository {
  /**
   * IDでプロジェクトを検索
   * @returns プロジェクトが見つかった場合はProject、見つからない場合はnull
   */
  findById(id: string): Promise<Project | null>;

  /**
   * オーナーIDでプロジェクト一覧を取得
   * @returns プロジェクトの配列
   */
  findByOwnerId(ownerId: string): Promise<Project[]>;

  /**
   * プロジェクトを永続化（作成または更新）
   * @returns 永続化されたProject
   */
  save(project: Project): Promise<Project>;

  /**
   * プロジェクトを削除
   */
  delete(id: string): Promise<void>;

  /**
   * プロジェクトに関連するセッション数を取得
   * @returns セッション数
   */
  countSessions(projectId: string): Promise<number>;

  /**
   * オーナーIDとプロジェクトIDでプロジェクトを検索
   * オーナー権限の確認と取得を同時に行う
   * @returns プロジェクトが見つかった場合はProject、見つからない場合はnull
   */
  findByIdAndOwnerId(projectId: string, ownerId: string): Promise<Project | null>;
}
