import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AvaliacoesFisicas = lazy(() => import('../AvaliacoesFisicas').then(module => ({ default: module.AvaliacoesFisicas })));

const LoadingFallback = () => (
    <div className="flex flex-col h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
    </div>
);

export const LazyAvaliacoes = () => (
    <Suspense fallback={<LoadingFallback />}>
        <AvaliacoesFisicas />
    </Suspense>
);
