import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-8 max-w-lg mx-auto bg-surface-card rounded-2xl border border-red-500/20 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-text-muted mb-6">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <Button
            onClick={this.handleReset}
            variant="primary"
            size="md"
            leftIcon={<RefreshCw size={16} />}
          >
            Reload View
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
