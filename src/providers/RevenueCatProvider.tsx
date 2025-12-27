import React, { createContext, useContext, useEffect, useState } from 'react';
import { Purchases, PurchasesPackage, PurchasesOffering, CustomerInfo, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';

// CONFIGURAR: Substitua com suas API Keys do RevenueCat
// Obter em: https://app.revenuecat.com/apps > API Keys
const API_KEYS = {
    ios: import.meta.env.VITE_REVENUECAT_IOS_KEY || "appl_YOUR_IOS_KEY_HERE",
    android: import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "goog_YOUR_ANDROID_KEY_HERE",
};

interface RevenueCatContextType {
    isPremium: boolean;
    currentOffering: PurchasesOffering | null;
    customerInfo: CustomerInfo | null;
    purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
    restorePurchases: () => Promise<void>;
    isLoading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                if (Capacitor.isNativePlatform()) {
                    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

                    const apiKey = Capacitor.getPlatform() === 'ios' ? API_KEYS.ios : API_KEYS.android;
                    await Purchases.configure({ apiKey });

                    if (user?.id) {
                        await Purchases.logIn({ appUserID: user.id });
                    }

                    const { customerInfo } = await Purchases.getCustomerInfo();
                    setCustomerInfo(customerInfo);
                    checkEntitlements(customerInfo);

                    const offerings = await Purchases.getOfferings();
                    console.log("📦 [RevenueCat] Offerings fetched:", JSON.stringify(offerings, null, 2));

                    if (offerings.current) {
                        console.log("✅ [RevenueCat] Current offering found:", offerings.current.identifier);
                        setCurrentOffering(offerings.current);
                    } else if (Object.keys(offerings.all).length > 0) {
                        // Fallback: Use the first available offering if 'current' is not set
                        const firstOfferingId = Object.keys(offerings.all)[0];
                        console.log(`⚠️ [RevenueCat] No 'current' offering. Fallback to first available: ${firstOfferingId}`);
                        setCurrentOffering(offerings.all[firstOfferingId]);
                    } else {
                        console.warn("⚠️ [RevenueCat] No offerings found at all. Check RevenueCat Dashboard.");
                    }
                } else {
                    console.log("RevenueCat not initialized: Web platform detected");
                    // Mock for web development if needed
                }
            } catch (error) {
                console.error("Error initializing RevenueCat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [user?.id]);

    const checkEntitlements = (info: CustomerInfo) => {
        console.log("👑 [RevenueCat] Checking Entitlements:", JSON.stringify(info.entitlements.active, null, 2));

        // CONFIGURAR: Substitua com seu Entitlement ID do RevenueCat
        const entitlementId = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'premium_access';
        if (info.entitlements.active[entitlementId] || info.entitlements.active['premium_ai'] || info.entitlements.active['premium_access']) {
            console.log("✅ [RevenueCat] Premium Access GRANTED");
            setIsPremium(true);
        } else {
            console.log("❌ [RevenueCat] Premium Access DENIED");
            setIsPremium(false);
        }
    };

    const purchasePackage = async (pkg: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
            setCustomerInfo(customerInfo);
            checkEntitlements(customerInfo);
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error("Error purchasing package:", error);
                throw error;
            }
        }
    };

    const restorePurchases = async () => {
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            setCustomerInfo(customerInfo);
            checkEntitlements(customerInfo);
        } catch (error) {
            console.error("Error restoring purchases:", error);
            throw error;
        }
    };

    return (
        <RevenueCatContext.Provider
            value={{
                isPremium,
                currentOffering,
                customerInfo,
                purchasePackage,
                restorePurchases,
                isLoading,
            }}
        >
            {children}
        </RevenueCatContext.Provider>
    );
};

export const useRevenueCat = () => {
    const context = useContext(RevenueCatContext);
    if (context === undefined) {
        throw new Error('useRevenueCat must be used within a RevenueCatProvider');
    }
    return context;
};
