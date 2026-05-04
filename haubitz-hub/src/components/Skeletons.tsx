import { Skeleton } from '@/components/ui/skeleton';

export const MetricCardSkeleton = () => (
  <div className="glass-card p-5 space-y-3">
    <Skeleton className="h-4 w-24 bg-muted" />
    <Skeleton className="h-8 w-16 bg-muted" />
    <Skeleton className="h-3 w-20 bg-muted" />
  </div>
);

export const TableRowSkeleton = ({ cols = 6 }: { cols?: number }) => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1 bg-muted" />
    ))}
  </div>
);

export const ListSkeleton = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} cols={cols} />
    ))}
  </div>
);
