import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JoinRequestList from '@/app/components/JoinRequestList';
import * as ToastModule from '@/app/components/Toast';

// Toast context をモック
vi.mock('@/app/components/Toast', () => ({
  useToast: vi.fn(),
}));

// window.confirm をモック
global.confirm = vi.fn();

// global fetch をモック
global.fetch = vi.fn();

describe('JoinRequestList', () => {
  const mockShowToast = vi.fn();
  const mockOnUpdate = vi.fn();
  const projectId = 'test-project-id';

  const mockRequests = [
    {
      id: 'req-1',
      user: {
        id: 'user-1',
        nickname: 'テストユーザー1',
        email: 'test1@example.com',
      },
      status: 'PENDING',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'req-2',
      user: {
        id: 'user-2',
        nickname: 'テストユーザー2',
        email: null,
      },
      status: 'PENDING',
      createdAt: '2025-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ToastModule.useToast).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  describe('表示', () => {
    it('リクエストがない場合、メッセージを表示する', () => {
      render(
        <JoinRequestList
          projectId={projectId}
          requests={[]}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('保留中のリクエストはありません')).toBeInTheDocument();
    });

    it('リクエスト一覧を表示する', () => {
      render(
        <JoinRequestList
          projectId={projectId}
          requests={mockRequests}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('テストユーザー1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('テストユーザー2')).toBeInTheDocument();
    });

    it('メールアドレスがnullの場合は表示しない', () => {
      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[1]]}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('テストユーザー2')).toBeInTheDocument();
      expect(screen.queryByText(/test.*@example\.com/)).not.toBeInTheDocument();
    });

    it('申請日を日本語形式で表示する', () => {
      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/申請日: 2025\/1\/1/)).toBeInTheDocument();
    });

    it('承認と拒否ボタンを表示する', () => {
      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const approveButtons = screen.getAllByText('承認');
      const rejectButtons = screen.getAllByText('拒否');

      expect(approveButtons).toHaveLength(1);
      expect(rejectButtons).toHaveLength(1);
    });
  });

  describe('承認処理', () => {
    it('承認ボタンをクリックすると確認ダイアログが表示される', async () => {
      vi.mocked(global.confirm).mockReturnValue(false);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const approveButton = screen.getByText('承認');
      fireEvent.click(approveButton);

      expect(global.confirm).toHaveBeenCalledWith('この申請を承認しますか?');
    });

    it('確認ダイアログでキャンセルした場合、APIを呼ばない', async () => {
      vi.mocked(global.confirm).mockReturnValue(false);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const approveButton = screen.getByText('承認');
      fireEvent.click(approveButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('承認成功時、トーストを表示してonUpdateを呼ぶ', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const approveButton = screen.getByText('承認');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/${projectId}/join-requests/req-1`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve' }),
          }
        );
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('参加を承認しました', 'success');
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('承認失敗時、エラートーストを表示する', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const approveButton = screen.getByText('承認');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('承認に失敗しました', 'error');
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('拒否処理', () => {
    it('拒否ボタンをクリックすると確認ダイアログが表示される', async () => {
      vi.mocked(global.confirm).mockReturnValue(false);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByText('拒否');
      fireEvent.click(rejectButton);

      expect(global.confirm).toHaveBeenCalledWith('この申請を拒否しますか?');
    });

    it('拒否成功時、トーストを表示してonUpdateを呼ぶ', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as Response);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByText('拒否');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/${projectId}/join-requests/req-1`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject' }),
          }
        );
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('参加を拒否しました', 'success');
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('拒否失敗時、エラートーストを表示する', async () => {
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response);

      render(
        <JoinRequestList
          projectId={projectId}
          requests={[mockRequests[0]]}
          onUpdate={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByText('拒否');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('拒否に失敗しました', 'error');
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });
});
