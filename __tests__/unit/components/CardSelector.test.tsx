import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CardSelector from '@/app/components/CardSelector';

describe('CardSelector', () => {
  const defaultProps = {
    selectedValue: 0,
    onSelect: vi.fn(),
  };

  it('すべてのカードオプションが表示される', () => {
    render(<CardSelector {...defaultProps} />);

    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
    expect(screen.getByText('1d')).toBeInTheDocument();
    expect(screen.getByText('1.5d')).toBeInTheDocument();
    expect(screen.getByText('2d')).toBeInTheDocument();
    expect(screen.getByText('3d')).toBeInTheDocument();
  });

  it('カードをクリックするとonSelectが呼ばれる', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('1d'));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('選択されたカードがハイライトされる', () => {
    render(<CardSelector selectedValue={1} onSelect={vi.fn()} />);

    const selectedCard = screen.getByText('1d').closest('button');
    expect(selectedCard).toHaveClass('border-blue-500');
  });

  it('自由記述ボタンが表示される', () => {
    render(<CardSelector {...defaultProps} />);

    expect(screen.getByText('自由記述')).toBeInTheDocument();
  });

  it('自由記述ボタンをクリックすると入力フォームが表示される', async () => {
    render(<CardSelector {...defaultProps} />);

    await userEvent.click(screen.getByText('自由記述'));

    expect(screen.getByPlaceholderText('日数を入力')).toBeInTheDocument();
    expect(screen.getByText('決定')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('カスタム値を入力して決定するとonSelectが呼ばれる', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('自由記述'));
    const input = screen.getByPlaceholderText('日数を入力');
    await userEvent.type(input, '5');
    await userEvent.click(screen.getByText('決定'));

    expect(onSelect).toHaveBeenCalledWith(5);
  });

  it('カスタム値入力後にフォームがクリアされる', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('自由記述'));
    const input = screen.getByPlaceholderText('日数を入力');
    await userEvent.type(input, '5');
    await userEvent.click(screen.getByText('決定'));

    expect(screen.getByText('自由記述')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('日数を入力')).not.toBeInTheDocument();
  });

  it('キャンセルボタンでフォームが閉じる', async () => {
    render(<CardSelector {...defaultProps} />);

    await userEvent.click(screen.getByText('自由記述'));
    await userEvent.click(screen.getByText('キャンセル'));

    expect(screen.getByText('自由記述')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('日数を入力')).not.toBeInTheDocument();
  });

  it('無効な値（0以下）は受け付けない', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('自由記述'));
    const input = screen.getByPlaceholderText('日数を入力');
    await userEvent.type(input, '0');
    await userEvent.click(screen.getByText('決定'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('無効な値（30超過）は受け付けない', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('自由記述'));
    const input = screen.getByPlaceholderText('日数を入力');
    await userEvent.type(input, '31');
    await userEvent.click(screen.getByText('決定'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled状態のときカードがクリックできない', async () => {
    const onSelect = vi.fn();
    render(<CardSelector selectedValue={0} onSelect={onSelect} disabled={true} />);

    await userEvent.click(screen.getByText('1d'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled状態のとき自由記述ボタンが無効化される', () => {
    render(<CardSelector {...defaultProps} disabled={true} />);

    const button = screen.getByText('自由記述');
    expect(button).toBeDisabled();
  });
});
