import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthSelector } from '../../components/shared/MonthSelector';

/**
 * Component tests for MonthSelector
 * Validates: Requirement 5.5 - Navigate between months
 * (any past month, up to 12 months in the future)
 */
describe('MonthSelector Component', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the month label for the selected month', () => {
    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 6 }} onChange={onChange} />);

    expect(screen.getByText('June 2025')).toBeInTheDocument();
  });

  it('renders Previous and Next month buttons', () => {
    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 6 }} onChange={onChange} />);

    expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
  });

  it('calls onChange with previous month when prev button is clicked', () => {
    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 6 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(onChange).toHaveBeenCalledWith({ year: 2025, month: 5 });
  });

  it('calls onChange with next month when next button is clicked (within range)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 2025

    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 6 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(onChange).toHaveBeenCalledWith({ year: 2025, month: 7 });
  });

  it('disables next button when at 12 months in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 2025

    const onChange = vi.fn();
    // 12 months from June 2025 = June 2026 (allowed, but next = July 2026 = NOT allowed)
    render(<MonthSelector selectedMonth={{ year: 2026, month: 6 }} onChange={onChange} />);

    const nextButton = screen.getByRole('button', { name: /next month/i });
    expect(nextButton).toBeDisabled();
  });

  it('does not call onChange when next button is disabled and clicked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 2025

    const onChange = vi.fn();
    // At the max future month
    render(<MonthSelector selectedMonth={{ year: 2026, month: 6 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows navigating to past months without restriction', () => {
    const onChange = vi.fn();
    // Even very old months should allow going further back
    render(<MonthSelector selectedMonth={{ year: 2020, month: 1 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(onChange).toHaveBeenCalledWith({ year: 2019, month: 12 });
  });

  it('wraps month navigation from January to previous December', () => {
    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 1 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(onChange).toHaveBeenCalledWith({ year: 2024, month: 12 });
  });

  it('wraps month navigation from December to next January (if within range)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 2025

    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 12 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(onChange).toHaveBeenCalledWith({ year: 2026, month: 1 });
  });

  it('buttons have minimum 44x44px tap target size', () => {
    const onChange = vi.fn();
    render(<MonthSelector selectedMonth={{ year: 2025, month: 6 }} onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.style.width).toBe('44px');
      expect(button.style.height).toBe('44px');
      expect(button.style.minWidth).toBe('44px');
      expect(button.style.minHeight).toBe('44px');
    });
  });
});
