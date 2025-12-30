import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ParticipantList from '@/app/components/ParticipantList';

describe('ParticipantList', () => {
  const mockEstimates = [
    {
      userId: 'user1',
      nickname: 'テストユーザー1',
      value: 3,
      updatedAt: '2025-12-30T00:00:00Z',
    },
    {
      userId: 'user2',
      nickname: 'テストユーザー2',
      value: -1, // 提出済み（未公開）
      updatedAt: '2025-12-30T00:00:00Z',
    },
    {
      userId: 'user3',
      nickname: 'テストユーザー3',
      value: 0, // 未提出
      updatedAt: '2025-12-30T00:00:00Z',
    },
  ];

  it('タイトルが表示される', () => {
    render(<ParticipantList estimates={[]} isRevealed={false} />);

    expect(screen.getByText('参加者一覧')).toBeInTheDocument();
  });

  it('参加者が表示される', () => {
    render(<ParticipantList estimates={mockEstimates} isRevealed={false} />);

    expect(screen.getByText('テストユーザー1')).toBeInTheDocument();
    expect(screen.getByText('テストユーザー2')).toBeInTheDocument();
    expect(screen.getByText('テストユーザー3')).toBeInTheDocument();
  });

  it('非公開状態では見積もり値が隠される', () => {
    render(<ParticipantList estimates={mockEstimates} isRevealed={false} />);

    // 値が3のユーザーは「提出済み」と表示
    const submittedLabels = screen.getAllByText('提出済み');
    expect(submittedLabels).toHaveLength(2); // value: 3 と value: -1
  });

  it('公開状態では見積もり値が表示される', () => {
    render(<ParticipantList estimates={mockEstimates} isRevealed={true} />);

    expect(screen.getByText('3日')).toBeInTheDocument();
    expect(screen.getByText('提出済み')).toBeInTheDocument(); // value: -1
    expect(screen.getByText('未提出')).toBeInTheDocument(); // value: 0
  });

  it('未提出状態が正しく表示される', () => {
    const estimates = [
      {
        userId: 'user1',
        nickname: 'テストユーザー',
        value: 0,
        updatedAt: '2025-12-30T00:00:00Z',
      },
    ];

    render(<ParticipantList estimates={estimates} isRevealed={false} />);

    expect(screen.getByText('未提出')).toBeInTheDocument();
  });

  it('参加者がいない場合は適切なメッセージが表示される', () => {
    render(<ParticipantList estimates={[]} isRevealed={false} />);

    expect(screen.getByText('参加者がいません')).toBeInTheDocument();
  });

  it('未提出（value: 0）は灰色のバッジで表示される', () => {
    const estimates = [
      {
        userId: 'user1',
        nickname: 'テストユーザー',
        value: 0,
        updatedAt: '2025-12-30T00:00:00Z',
      },
    ];

    render(<ParticipantList estimates={estimates} isRevealed={false} />);

    const badge = screen.getByText('未提出');
    expect(badge).toHaveClass('bg-gray-200');
    expect(badge).toHaveClass('text-gray-600');
  });

  it('提出済み（value: -1）は緑色のバッジで表示される', () => {
    const estimates = [
      {
        userId: 'user1',
        nickname: 'テストユーザー',
        value: -1,
        updatedAt: '2025-12-30T00:00:00Z',
      },
    ];

    render(<ParticipantList estimates={estimates} isRevealed={false} />);

    const badge = screen.getByText('提出済み');
    expect(badge).toHaveClass('bg-green-200');
    expect(badge).toHaveClass('text-green-800');
  });

  it('見積もり値がある場合は青色のバッジで表示される', () => {
    const estimates = [
      {
        userId: 'user1',
        nickname: 'テストユーザー',
        value: 3,
        updatedAt: '2025-12-30T00:00:00Z',
      },
    ];

    render(<ParticipantList estimates={estimates} isRevealed={false} />);

    const badge = screen.getByText('提出済み');
    expect(badge).toHaveClass('bg-blue-200');
    expect(badge).toHaveClass('text-blue-800');
  });
});
