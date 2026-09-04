import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  /** Custom skeleton shown while loading (defaults to PageSkeleton) */
  skeleton?: ReactNode;
  /** Retry callback – shown on the error card */
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Wraps a React Query dependent section.
 *
 * Shows a skeleton while loading, a friendly error card on failure,
 * and renders `children` only when data is ready.
 *
 * ```tsx
 * <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
 *   <MyDataView data={data!} />
 * </QueryState>
 * ```
 */
export function QueryState({
  isLoading,
  isError,
  error,
  skeleton,
  onRetry,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <>{skeleton ?? <PageSkeleton />}</>;
  }

  if (isError) {
    const isOffline = !navigator.onLine;
    
    // Explicit network error handling
    const isNetworkError = 
      error instanceof Error && 
      (error.message.includes('Network Error') || error.message.includes('fetch') || isOffline);

    const message =
      isNetworkError || isOffline
        ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.'
        : error instanceof Error
        ? error.message
        : 'Không thể tải dữ liệu. Vui lòng thử lại.';

    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-5 p-8 text-center bg-card rounded-2xl border border-border/40 shadow-sm w-full my-2">
        <div className="rounded-full bg-muted border border-border/60 p-4 shadow-xs">
          {isNetworkError || isOffline ? (
            <RefreshCw className="h-6 w-6 text-muted-foreground" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-foreground/70" />
          )}
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold font-display text-foreground tracking-tight">
             {isNetworkError || isOffline ? 'Mất kết nối' : 'Đã xảy ra lỗi'}
          </h3>
          <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {message}
          </p>
        </div>
        
        {onRetry && (
          <Button 
            className="mt-2 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl h-9 px-5 transition-transform active:scale-[0.98]" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
