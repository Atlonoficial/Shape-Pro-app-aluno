import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Configuracoes = lazy(() => import('../Configuracoes'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background p-6 space-y-6">
    <Skeleton className="h-12 w-48" />
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);

export const LazySettings = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Configuracoes />
  </Suspense>
);
