import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const TeacherStudentChat = lazy(() => import('../TeacherStudentChat'));

const LoadingFallback = () => (
  <div className="flex flex-col h-screen bg-background">
    <div className="p-4 border-b border-border">
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="flex-1 p-4 space-y-4">
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-16 w-2/3 ml-auto" />
      <Skeleton className="h-16 w-3/4" />
    </div>
  </div>
);

export const LazyTeacherStudentChat = () => (
  <Suspense fallback={<LoadingFallback />}>
    <TeacherStudentChat />
  </Suspense>
);
