import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/dom';

describe('domQueries', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should query rendered DOM content with testing-library/dom', () => {
    document.body.innerHTML = `
      <section>
        <h1>Planning Poker</h1>
        <button type="button">Start Session</button>
        <p data-testid="status">Ready</p>
      </section>
    `;

    const heading = screen.getByRole('heading', { name: 'Planning Poker' });
    const button = screen.getByRole('button', { name: 'Start Session' });
    const status = screen.getByTestId('status');

    expect(heading).toBeInTheDocument();
    expect(button).toBeEnabled();
    expect(status).toHaveTextContent('Ready');
    expect(screen.queryByText('Missing')).not.toBeInTheDocument();
  });
});
