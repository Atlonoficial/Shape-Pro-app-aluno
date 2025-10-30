import { useState, useEffect, useCallback } from 'react';

interface ViewedItem {
  itemId: string;
  viewedAt: string;
  category: 'profile' | 'anamnese' | 'exams' | 'photos' | 'assessments';
}

export const useViewedItems = (userId?: string) => {
  const [viewedItems, setViewedItems] = useState<ViewedItem[]>([]);
  
  const storageKey = `viewedItems_${userId}`;

  useEffect(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setViewedItems(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing viewed items:', error);
        setViewedItems([]);
      }
    }
  }, [userId, storageKey]);

  const markAsViewed = useCallback((itemId: string, category: ViewedItem['category']) => {
    if (!userId) return;
    
    const newItem: ViewedItem = {
      itemId,
      viewedAt: new Date().toISOString(),
      category
    };
    
    const updatedItems = [
      ...viewedItems.filter(item => item.itemId !== itemId),
      newItem
    ];
    
    setViewedItems(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  }, [userId, viewedItems, storageKey]);

  const isViewed = useCallback((itemId: string, category: ViewedItem['category']) => {
    return viewedItems.some(item => 
      item.itemId === itemId && 
      item.category === category
    );
  }, [viewedItems]);

  const getLastViewed = useCallback((category: ViewedItem['category']) => {
    const categoryItems = viewedItems.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;
    
    return categoryItems.reduce((latest, current) => 
      new Date(current.viewedAt) > new Date(latest.viewedAt) ? current : latest
    );
  }, [viewedItems]);

  return {
    markAsViewed,
    isViewed,
    getLastViewed,
    viewedItems
  };
};