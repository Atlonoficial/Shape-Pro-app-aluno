import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  gcTime?: number;
  staleTime?: number;
  background?: boolean;
  optimistic?: boolean;
}

/**
 * Hook otimizado para queries com cache inteligente e atualizações em tempo real
 */
// React Query v5 - gcTime substitui cacheTime
export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  gcTime = 5 * 60 * 1000, // 5 minutos default (era cacheTime)
  staleTime = 1 * 60 * 1000, // 1 minuto default
  background = true,
  optimistic = false,
  ...options
}: OptimizedQueryOptions<T>) => {
  const queryClient = useQueryClient();

  // Memoizar query key para evitar re-renders desnecessários
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);

  // Query otimizada
  const query = useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros 4xx
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    ...options
  });

  // Invalidar cache
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: memoizedQueryKey });
  }, [queryClient, memoizedQueryKey]);

  // Atualização otimista
  const updateOptimistic = useCallback((updater: (old: T | undefined) => T) => {
    if (optimistic) {
      queryClient.setQueryData(memoizedQueryKey, updater);
    }
  }, [queryClient, memoizedQueryKey, optimistic]);

  // Prefetch relacionado
  const prefetchRelated = useCallback((relatedQueryKey: string[], relatedQueryFn: () => Promise<any>) => {
    if (background) {
      queryClient.prefetchQuery({
        queryKey: relatedQueryKey,
        queryFn: relatedQueryFn,
        staleTime: staleTime * 2 // Cache mais longo para prefetch
      });
    }
  }, [queryClient, background, staleTime]);

  // Buscar dados do cache sem fazer nova requisição
  const getCachedData = useCallback(() => {
    return queryClient.getQueryData<T>(memoizedQueryKey);
  }, [queryClient, memoizedQueryKey]);

  return {
    ...query,
    invalidate,
    updateOptimistic,
    prefetchRelated,
    getCachedData,
    isStale: query.isStale,
    isFetched: query.isFetched
  };
};

/**
 * Hook para queries em lote - reduz requisições desnecessárias
 */
export const useBatchQuery = <T>(
  queries: Array<{
    queryKey: string[];
    queryFn: () => Promise<T>;
    enabled?: boolean;
  }>
) => {
  const enabledQueries = queries.filter(q => q.enabled !== false);
  
  return enabledQueries.map(query => 
    useOptimizedQuery({
      ...query,
      staleTime: 30 * 1000, // Cache menor para batch
      gcTime: 2 * 60 * 1000
    })
  );
};

/**
 * Hook para queries infinitas otimizadas
 */
export const useOptimizedInfiniteQuery = <T>({
  queryKey,
  queryFn,
  getNextPageParam,
  ...options
}: {
  queryKey: string[];
  queryFn: ({ pageParam }: { pageParam: any }) => Promise<T>;
  getNextPageParam: (lastPage: T, allPages: T[]) => any;
  [key: string]: any;
}) => {
  const queryClient = useQueryClient();

  return {
    query: useQuery({
      queryKey,
      queryFn: async () => {
        const firstPage = await queryFn({ pageParam: undefined });
        return { pages: [firstPage], pageParams: [undefined] };
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      ...options
    }),
    loadMore: useCallback(async (pageParam: any) => {
      const currentData = queryClient.getQueryData<{ pages: T[]; pageParams: any[] }>(queryKey);
      if (!currentData) return;

      const newPage = await queryFn({ pageParam });
      
      queryClient.setQueryData(queryKey, {
        pages: [...currentData.pages, newPage],
        pageParams: [...currentData.pageParams, pageParam]
      });
    }, [queryClient, queryKey, queryFn])
  };
};

/**
 * Cache manager para limpeza automática
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  const clearOldCache = useCallback(() => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remover queries antigas do cache
    queryClient.getQueryCache().getAll().forEach(query => {
      if (query.state.dataUpdatedAt < oneHourAgo) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });

    console.log('🧹 Cache cleanup completed');
  }, [queryClient]);

  const getMemoryUsage = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      staleQueries: queries.filter(q => q.isStale()).length
    };
  }, [queryClient]);

  return {
    clearOldCache,
    getMemoryUsage,
    clearAll: () => queryClient.clear()
  };
};