'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';

interface Session {
  id: string;
  name?: string;
  shareToken: string;
  status: 'ACTIVE' | 'FINALIZED';
  createdAt: string;
  finalEstimate: number | null;
  isRevealed: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  sessionsCount: number;
}

interface MemberProject {
  id: string;
  name: string;
  description: string | null;
  role: 'OWNER' | 'MEMBER';
  owner: {
    id: string;
    nickname: string;
  };
  joinedAt: string;
  sessionCount: number;
}

export default function MyPage() {
  const { data: session } = useSession();
  const { user, logout, updateNickname, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberProjects, setMemberProjects] = useState<MemberProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  // 認証ユーザーかどうか
  const isAuthenticatedUser = session?.user?.id;

  // 未ログインならトップページへリダイレクト
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // プロジェクト一覧とセッション一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // セッション一覧を取得
        const sessionsResponse = await fetch(`/api/users/${user.userId}/sessions`);
        if (!sessionsResponse.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions);

        // 認証ユーザーの場合はプロジェクト一覧も取得
        if (isAuthenticatedUser) {
          const projectsResponse = await fetch('/api/projects');
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects);
          }

          // 参加中プロジェクト一覧を取得
          const memberProjectsResponse = await fetch('/api/users/me/projects');
          if (memberProjectsResponse.ok) {
            const memberProjectsData = await memberProjectsResponse.json();
            setMemberProjects(memberProjectsData.projects);
          }
        }
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticatedUser]);

  const handleDeleteSession = async (shareToken: string) => {
    if (!user) return;
    if (!confirm('このセッションを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/sessions/${shareToken}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // 削除成功したら一覧から除外
      setSessions(sessions.filter((s) => s.shareToken !== shareToken));
    } catch (err) {
      alert('セッションの削除に失敗しました');
      console.error(err);
    }
  };

  const handleLogout = () => {
    if (confirm('ログアウトしてもよろしいですか？')) {
      logout();
      router.push('/');
    }
  };

  const handleEditNickname = () => {
    setNewNickname(user?.nickname || '');
    setNicknameError('');
    setIsEditingNickname(true);
  };

  const handleCancelEdit = () => {
    setIsEditingNickname(false);
    setNewNickname('');
    setNicknameError('');
  };

  const handleSaveNickname = async () => {
    if (!newNickname.trim()) {
      setNicknameError('ニックネームを入力してください');
      return;
    }

    if (newNickname.trim().length > 50) {
      setNicknameError('ニックネームは50文字以内で入力してください');
      return;
    }

    try {
      await updateNickname(newNickname.trim());
      setIsEditingNickname(false);
      setNewNickname('');
      setNicknameError('');
    } catch (err) {
      setNicknameError(err instanceof Error ? err.message : 'ニックネームの更新に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900">マイページ</h1>
              {!isEditingNickname ? (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-zinc-600">
                    ようこそ、{user.nickname}さん
                  </p>
                  <button
                    onClick={handleEditNickname}
                    className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    編集
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="新しいニックネーム"
                      maxLength={50}
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      キャンセル
                    </button>
                  </div>
                  {nicknameError && (
                    <p className="text-xs text-red-600">{nicknameError}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-zinc-600">読み込み中...</div>
        ) : (
          <div className="space-y-8">
            {/* 参加中プロジェクト（認証ユーザーのみ） */}
            {isAuthenticatedUser && memberProjects.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    参加中のプロジェクト
                  </h2>
                  <button
                    onClick={() => router.push('/mypage')}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    すべて見る
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {memberProjects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 hover:border-green-300 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-zinc-900 line-clamp-1 flex-1">
                          {project.name}
                        </h3>
                        <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {project.role === 'OWNER' ? 'オーナー' : 'メンバー'}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="text-xs text-zinc-500 space-y-1">
                        <p>オーナー: {project.owner.nickname}</p>
                        <p>{project.sessionCount} セッション</p>
                        <p>参加日: {new Date(project.joinedAt).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* プロジェクト一覧（認証ユーザーのみ） */}
            {isAuthenticatedUser && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    プロジェクト
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push('/projects')}
                      className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      すべて見る
                    </button>
                    <button
                      onClick={() => router.push('/projects/new')}
                      className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      新規作成
                    </button>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
                    <p className="text-sm text-zinc-600">
                      まだプロジェクトがありません。
                      <br />
                      プロジェクトを作成して、見積もりセッションを整理しましょう。
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition"
                      >
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2 line-clamp-1">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{project.sessionsCount} セッション</span>
                          <span>
                            {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* セッション一覧 */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">
                  最近のセッション
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/sessions')}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    すべて見る
                  </button>
                  <button
                    onClick={() => router.push('/sessions/new')}
                    className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
                  >
                    新規作成
                  </button>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
                  <p className="text-sm text-zinc-600">
                    まだセッションを作成していません。
                    <br />
                    新しいセッションを作成してみましょう！
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-zinc-200 bg-white p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-zinc-900">
                              {session.name || `セッションID: ${session.shareToken}`}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                session.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-zinc-100 text-zinc-800'
                              }`}
                            >
                              {session.status === 'ACTIVE' ? 'アクティブ' : '確定済み'}
                            </span>
                          </div>
                          {session.name && (
                            <p className="text-sm text-zinc-500">
                              セッションID: {session.shareToken}
                            </p>
                          )}
                          <p className="text-sm text-zinc-600">
                            作成日時: {formatDate(session.createdAt)}
                          </p>
                          {session.finalEstimate && (
                            <p className="mt-1 text-sm text-zinc-600">
                              確定工数: {session.finalEstimate}日
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/estimate/${session.shareToken}`)}
                            className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          >
                            開く
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.shareToken)}
                            className="cursor-pointer rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
