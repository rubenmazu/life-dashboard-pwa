import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomTabBar from '../../components/shared/BottomTabBar';

function renderWithRouter(initialPath = '/finance') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomTabBar />
    </MemoryRouter>
  );
}

describe('BottomTabBar', () => {
  it('renders all three tabs with correct labels', () => {
    renderWithRouter();

    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Habits')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('has a navigation landmark with accessible label', () => {
    renderWithRouter();

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    renderWithRouter('/finance');

    const financeButton = screen.getByRole('button', { name: /finance/i });
    expect(financeButton).toHaveAttribute('aria-current', 'page');

    const habitsButton = screen.getByRole('button', { name: /habits/i });
    expect(habitsButton).not.toHaveAttribute('aria-current');
  });

  it('marks Habits tab as active when on /habits path', () => {
    renderWithRouter('/habits');

    const habitsButton = screen.getByRole('button', { name: /habits/i });
    expect(habitsButton).toHaveAttribute('aria-current', 'page');

    const financeButton = screen.getByRole('button', { name: /finance/i });
    expect(financeButton).not.toHaveAttribute('aria-current');
  });

  it('marks Settings tab as active when on /settings path', () => {
    renderWithRouter('/settings');

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveAttribute('aria-current', 'page');
  });

  it('recognizes sub-paths as active (e.g., /finance/expenses)', () => {
    renderWithRouter('/finance/expenses');

    const financeButton = screen.getByRole('button', { name: /finance/i });
    expect(financeButton).toHaveAttribute('aria-current', 'page');
  });

  it('all tab buttons meet 44x44px minimum tap target size', () => {
    renderWithRouter();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => {
      const style = window.getComputedStyle(button);
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });

  it('renders three SVG icons with aria-hidden', () => {
    renderWithRouter();

    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs).toHaveLength(3);
  });

  it('navigates when a tab button is clicked', () => {
    renderWithRouter('/finance');

    const habitsButton = screen.getByRole('button', { name: /habits/i });
    fireEvent.click(habitsButton);

    // After clicking Habits, it should become active
    expect(habitsButton).toHaveAttribute('aria-current', 'page');
  });
});
