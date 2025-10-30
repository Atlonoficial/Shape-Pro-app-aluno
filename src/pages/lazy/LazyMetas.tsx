import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Metas = lazy(() => import('../Metas').then(module => ({ default: module.Metas })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background p-6 space-y-6">
    <Skeleton className="h-12 w-48" />
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

export const LazyMetas = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Metas />
  </Suspense>
);
