import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Module-level error boundary that catches rendering errors in children
 * without crashing the entire app. Other modules remain accessible via navigation.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ErrorBoundary] Error in ${this.props.moduleName ?? 'module'}:`,
      error,
      errorInfo.componentStack,
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
            {this.props.moduleName
              ? `The ${this.props.moduleName} module encountered an error.`
              : 'This module encountered an error.'}{' '}
            Other parts of the app are still accessible.
          </p>

          {this.state.error && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono max-w-xs truncate">
              {this.state.error.message}
            </p>
          )}

          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-[#007aff] text-white font-medium rounded-xl text-sm active:opacity-80 transition-opacity"
          >
            Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
