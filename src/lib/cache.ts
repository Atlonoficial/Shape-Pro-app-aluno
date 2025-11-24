export const globalCache = new Map<string, { data: any; timestamp: number }>();

export const CACHE_TTL = 30000; // 30 seconds

export const getCache = (key: string) => {
    const cached = globalCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
};

export const setCache = (key: string, data: any) => {
    globalCache.set(key, { data, timestamp: Date.now() });
};

export const clearCache = () => {
    globalCache.clear();
};
