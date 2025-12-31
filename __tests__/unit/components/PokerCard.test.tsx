import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PokerCard from '@/app/components/PokerCard';

describe('PokerCard', () => {
  it('ラベルを表示する', () => {
    render(<PokerCard label="3日" />);

    expect(screen.getByRole('button')).toHaveTextContent('3日');
  });

  it('クリック時にonClickハンドラーが呼ばれる', async () => {
    const handleClick = vi.fn();
    render(<PokerCard label="3日" onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('選択状態のときに選択スタイルが適用される', () => {
    render(<PokerCard label="3日" isSelected={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-blue-500');
    expect(button).toHaveClass('bg-gradient-to-br');
  });

  it('非選択状態のときに通常スタイルが適用される', () => {
    render(<PokerCard label="3日" isSelected={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-gray-300');
  });

  it('選択状態のときにチェックマークが表示される', () => {
    render(<PokerCard label="3日" isSelected={true} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('非選択状態のときにチェックマークが表示されない', () => {
    render(<PokerCard label="3日" isSelected={false} />);

    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('onClickが指定されていなくてもエラーが発生しない', () => {
    expect(() => {
      render(<PokerCard label="3日" />);
    }).not.toThrow();
  });

  it('value属性が渡されても正しく動作する', () => {
    render(<PokerCard label="3日" value={3} />);

    expect(screen.getByRole('button')).toHaveTextContent('3日');
  });
});
