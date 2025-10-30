import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  variant?: 'default' | 'horizontal' | 'stats';
  count?: number;
}

export const SkeletonCard = ({ variant = 'default', count = 1 }: SkeletonCardProps) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'horizontal') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (variant === 'stats') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
              <Skeleton className="h-6 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      {skeletons.map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};
