import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export const createCapacitorStorage = () => {
  if (!Capacitor.isNativePlatform()) {
    return localStorage;
  }

  return {
    getItem: async (key: string) => {
      const { value } = await Preferences.get({ key });
      return value;
    },
    setItem: async (key: string, value: string) => {
      await Preferences.set({ key, value });
    },
    removeItem: async (key: string) => {
      await Preferences.remove({ key });
    },
  };
};
