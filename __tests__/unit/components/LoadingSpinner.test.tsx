import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '@/app/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('デフォルトでmediumサイズのスピナーが表示される', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-12');
    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('border-4');
  });

  it('smallサイズのスピナーが表示される', () => {
    const { container } = render(<LoadingSpinner size="small" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('h-6');
    expect(spinner).toHaveClass('border-2');
  });

  it('largeサイズのスピナーが表示される', () => {
    const { container } = render(<LoadingSpinner size="large" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-16');
    expect(spinner).toHaveClass('h-16');
    expect(spinner).toHaveClass('border-4');
  });

  it('スピナーがアニメーションする', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('スピナーが正しいスタイルを持つ', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-blue-500');
    expect(spinner).toHaveClass('border-t-transparent');
    expect(spinner).toHaveClass('rounded-full');
  });

  it('スピナーが中央に配置される', () => {
    const { container } = render(<LoadingSpinner />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
