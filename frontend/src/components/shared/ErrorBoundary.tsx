import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional fallback UI. If omitted a default "Something went wrong" card is shown. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    
    // Harden: Automatically recover from Vite chunk load errors (deployments while user is on site)
    const isChunkLoadError = 
      error?.message?.match(/Failed to fetch dynamically imported module/i) ||
      error?.message?.match(/Importing a module script failed/i);
      
    if (isChunkLoadError) {
      window.location.reload();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isOffline = !navigator.onLine;

      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-5 p-8 text-center bg-card rounded-2xl border border-border/40 shadow-sm m-4">
          <div className="rounded-full bg-muted border border-border/60 p-4">
            {isOffline ? (
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-foreground/70" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-foreground tracking-tight">
              {isOffline ? 'Mất kết nối mạng' : 'Đã xảy ra lỗi'}
            </h2>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
              {isOffline 
                ? 'Vui lòng kiểm tra lại kết nối internet của bạn và thử lại.' 
                : 'Một lỗi không mong muốn đã xảy ra trong quá trình xử lý. Chúng tôi đã ghi nhận sự cố này.'}
            </p>
          </div>
          
          {import.meta.env.DEV && this.state.error && !isOffline && (
            <pre className="text-[10px] text-left bg-muted/50 p-4 rounded-xl max-w-lg overflow-auto border border-border/40 mt-2 text-muted-foreground">
              <code className="font-mono">{this.state.error.message}</code>
            </pre>
          )}
          
          <Button 
            className="mt-2 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl h-10 px-6 transition-transform active:scale-[0.98]" 
            onClick={this.handleRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
