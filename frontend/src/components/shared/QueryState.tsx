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
    const message =
      error instanceof Error
        ? error.message
        : 'Không thể tải dữ liệu. Vui lòng thử lại.';

    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-4 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-muted-foreground max-w-md">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
