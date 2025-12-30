import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EstimateResult from '@/app/components/EstimateResult';

describe('EstimateResult', () => {
  const mockEstimates = [
    {
      userId: 'user1',
      nickname: 'ユーザー1',
      value: 1,
      updatedAt: '2025-12-30T00:00:00Z',
    },
    {
      userId: 'user2',
      nickname: 'ユーザー2',
      value: 3,
      updatedAt: '2025-12-30T00:00:00Z',
    },
    {
      userId: 'user3',
      nickname: 'ユーザー3',
      value: 5,
      updatedAt: '2025-12-30T00:00:00Z',
    },
  ];

  it('タイトルが表示される', () => {
    render(<EstimateResult estimates={[]} isRevealed={false} finalEstimate={null} />);

    expect(screen.getByText('見積もり結果')).toBeInTheDocument();
  });

  it('非公開状態では「カードが公開されていません」と表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={false} finalEstimate={null} />);

    expect(screen.getByText('カードが公開されていません')).toBeInTheDocument();
  });

  it('公開状態で見積もりがない場合は「見積もりが提出されていません」と表示される', () => {
    render(<EstimateResult estimates={[]} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('見積もりが提出されていません')).toBeInTheDocument();
  });

  it('公開状態では統計情報が表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('平均値')).toBeInTheDocument();
    expect(screen.getByText('中央値')).toBeInTheDocument();
    expect(screen.getByText('最大値')).toBeInTheDocument();
    expect(screen.getByText('最小値')).toBeInTheDocument();
  });

  it('平均値が正しく計算される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    // (1 + 3 + 5) / 3 = 3.00
    const avgSection = screen.getByText('平均値').closest('div');
    expect(avgSection).toHaveTextContent('3.00日');
  });

  it('中央値が正しく計算される（奇数個）', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    // 中央値は3
    const medianSection = screen.getByText('中央値').closest('div');
    expect(medianSection).toHaveTextContent('3.00日');
  });

  it('中央値が正しく計算される（偶数個）', () => {
    const evenEstimates = [
      { userId: 'user1', nickname: 'ユーザー1', value: 2, updatedAt: '2025-12-30T00:00:00Z' },
      { userId: 'user2', nickname: 'ユーザー2', value: 4, updatedAt: '2025-12-30T00:00:00Z' },
    ];

    render(<EstimateResult estimates={evenEstimates} isRevealed={true} finalEstimate={null} />);

    // (2 + 4) / 2 = 3.00
    const medianSection = screen.getByText('中央値').closest('div');
    expect(medianSection).toHaveTextContent('3.00日');
  });

  it('最大値が正しく表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('5.00日')).toBeInTheDocument();
  });

  it('最小値が正しく表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('1.00日')).toBeInTheDocument();
  });

  it('全員の見積もりが一覧表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('全員の見積もり')).toBeInTheDocument();
    expect(screen.getByText('ユーザー1')).toBeInTheDocument();
    expect(screen.getByText('ユーザー2')).toBeInTheDocument();
    expect(screen.getByText('ユーザー3')).toBeInTheDocument();
  });

  it('確定工数が表示される', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={2.5} />);

    expect(screen.getByText('確定工数')).toBeInTheDocument();
    expect(screen.getByText('2.5日')).toBeInTheDocument();
  });

  it('確定工数がnullの場合は表示されない', () => {
    render(<EstimateResult estimates={mockEstimates} isRevealed={true} finalEstimate={null} />);

    expect(screen.queryByText('確定工数')).not.toBeInTheDocument();
  });

  it('value <= 0 の見積もりは統計から除外される', () => {
    const estimatesWithInvalid = [
      { userId: 'user1', nickname: 'ユーザー1', value: 3, updatedAt: '2025-12-30T00:00:00Z' },
      { userId: 'user2', nickname: 'ユーザー2', value: 0, updatedAt: '2025-12-30T00:00:00Z' },
      { userId: 'user3', nickname: 'ユーザー3', value: -1, updatedAt: '2025-12-30T00:00:00Z' },
    ];

    render(<EstimateResult estimates={estimatesWithInvalid} isRevealed={true} finalEstimate={null} />);

    // 平均値は3のみから計算される
    const avgSection = screen.getByText('平均値').closest('div');
    expect(avgSection).toHaveTextContent('3.00日');
  });

  it('全員の見積もり一覧には有効な見積もりのみ表示される', () => {
    const estimatesWithInvalid = [
      { userId: 'user1', nickname: 'ユーザー1', value: 3, updatedAt: '2025-12-30T00:00:00Z' },
      { userId: 'user2', nickname: 'ユーザー2', value: 0, updatedAt: '2025-12-30T00:00:00Z' },
    ];

    render(<EstimateResult estimates={estimatesWithInvalid} isRevealed={true} finalEstimate={null} />);

    expect(screen.getByText('ユーザー1')).toBeInTheDocument();
    expect(screen.queryByText('ユーザー2')).not.toBeInTheDocument();
  });
});
