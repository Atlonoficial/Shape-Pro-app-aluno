import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from './ErrorBoundary';

interface LazyComponentProps {
  factory: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  props?: any;
}

const DefaultFallback = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
);

export const LazyComponent: React.FC<LazyComponentProps> = ({
  factory,
  fallback = <DefaultFallback />,
  errorFallback,
  props = {}
}) => {
  const Component = lazy(factory);

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// HOC para criar componentes lazy facilmente
export const createLazyComponent = (
  factory: () => Promise<{ default: React.ComponentType<any> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
  } = {}
) => {
  return (props: any) => (
    <LazyComponent
      factory={factory}
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      props={props}
    />
  );
};

// Componentes lazy pré-configurados para componentes pesados
export const LazyDashboard = createLazyComponent(
  () => import('@/components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })),
  {
    fallback: (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }
);

export const LazyChat = createLazyComponent(
  () => import('@/components/chat/ChatInterface').then(module => ({ default: module.ChatInterface })),
  {
    fallback: (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
);

export const LazyWorkouts = createLazyComponent(
  () => import('@/components/workouts/Workouts').then(module => ({ default: module.Workouts })),
  {
    fallback: (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }
);

export const LazyNutrition = createLazyComponent(
  () => import('@/components/nutrition/Nutrition').then(module => ({ default: module.Nutrition })),
  {
    fallback: (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }
);

export const LazyProgress = createLazyComponent(
  () => import('@/components/progress/Progress').then(module => ({ default: module.Progress })),
  {
    fallback: (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }
);