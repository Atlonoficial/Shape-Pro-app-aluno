import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ExamesMedicos = lazy(() => import('../ExamesMedicos').then(module => ({ default: module.ExamesMedicos })));

const LoadingFallback = () => (
    <div className="flex flex-col h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
    </div>
);

export const LazyExames = () => (
    <Suspense fallback={<LoadingFallback />}>
        <ExamesMedicos />
    </Suspense>
);
