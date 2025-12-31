import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CreditLoadingSkeletonProps {
  className?: string;
  variant?: 'inline' | 'card';
}

export const CreditLoadingSkeleton: React.FC<CreditLoadingSkeletonProps> = ({
  className,
  variant = 'inline'
}) => {
  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col gap-2 p-3 rounded-2xl bg-muted/30 border border-border/30",
        className
      )}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-2 w-20 rounded-full" />
    </div>
  );
};
