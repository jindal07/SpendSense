import { Component } from 'react';

/**
 * Catches synchronous render errors from descendants (notably a known
 * Recharts 2.15.x race where the internal tooltip state reads `.payload`
 * on an undefined activeItem after data re-renders mid-hover). Without this,
 * a single chart crash unmounts the whole page; with it, the user sees
 * a friendly fallback and can keep using the app.
 */
export class ChartErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.warn('[ChartErrorBoundary]', error, info);
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Chart couldn&apos;t render.</span>
          <button
            type="button"
            onClick={this.reset}
            className="text-xs font-semibold underline underline-offset-2 hover:text-foreground"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
