import { Storage } from '@capacitor/storage';

// User preferences storage
export const setUserPreference = async (key: string, value: any) => {
  try {
    await Storage.set({
      key: `user_pref_${key}`,
      value: JSON.stringify(value)
    });
  } catch (error) {
    console.error('Error setting user preference:', error);
  }
};

export const getUserPreference = async (key: string) => {
  try {
    const result = await Storage.get({ key: `user_pref_${key}` });
    return result.value ? JSON.parse(result.value) : null;
  } catch (error) {
    console.error('Error getting user preference:', error);
    return null;
  }
};

// Offline data storage
export const setOfflineData = async (key: string, data: any) => {
  try {
    await Storage.set({
      key: `offline_${key}`,
      value: JSON.stringify({
        data,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Error setting offline data:', error);
  }
};

export const getOfflineData = async (key: string, maxAge: number = 24 * 60 * 60 * 1000) => {
  try {
    const result = await Storage.get({ key: `offline_${key}` });
    if (result.value) {
      const { data, timestamp } = JSON.parse(result.value);
      
      // Check if data is still fresh
      if (Date.now() - timestamp < maxAge) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
};

// Clear all storage
export const clearStorage = async () => {
  try {
    await Storage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};