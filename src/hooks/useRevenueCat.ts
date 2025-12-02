import { useRevenueCat as useContextRevenueCat } from '@/providers/RevenueCatProvider';

export const useRevenueCat = () => {
    return useContextRevenueCat();
};
