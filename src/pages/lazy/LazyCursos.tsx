import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Cursos = lazy(() => import('../Cursos'));

const LoadingFallback = () => (
    <div className="flex flex-col h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
        </div>
    </div>
);

export const LazyCursos = () => (
    <Suspense fallback={<LoadingFallback />}>
        <Cursos />
    </Suspense>
);
