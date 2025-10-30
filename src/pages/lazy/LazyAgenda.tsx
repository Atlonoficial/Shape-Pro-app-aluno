import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Agenda = lazy(() => import('../Agenda'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background p-6 space-y-6">
    <Skeleton className="h-12 w-48" />
    <div className="grid gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

export const LazyAgenda = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Agenda />
  </Suspense>
);
