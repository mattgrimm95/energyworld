import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200 p-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-4">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
