"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  features: Record<string, unknown>;
  checkAccess: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isLoading: true,
  features: {},
  checkAccess: () => false,
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: { isPremium: boolean; features: Record<string, unknown> };
}) {
  const [isPremium, setIsPremium] = useState(initialData?.isPremium || false);
  const [features, setFeatures] = useState(initialData?.features || {});
  const [isLoading, setIsLoading] = useState(initialData === undefined);

  useEffect(() => {
    if (initialData !== undefined) return;

    // Fallback client fetch only when initialData wasn't provided by SSR
    const fetchSub = async () => {
      try {
        const res = await fetch("/api/user/subscription");
        if (!res.ok) return;
        const data = await res.json();
        setIsPremium(Boolean(data.isPremium));
        setFeatures(data.features || {});
      } catch (e) {
        console.error("Failed to fetch subscription", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSub();
  }, [initialData]);

  const checkAccess = (_feature: string) => {
    if (isPremium) return true;
    // Basic fallback logic
    return false;
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, features, checkAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
