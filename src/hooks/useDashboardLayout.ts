import { useState, useEffect } from 'react';

export interface DashboardCard {
  id: string;
  type: string;
  row: number;
}

export const useDashboardLayout = (initialCards: DashboardCard[], storageKey: string) => {
  const [cards, setCards] = useState<DashboardCard[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : initialCards;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cards));
  }, [cards, storageKey]);

  const reorderCards = (startIndex: number, endIndex: number) => {
    const result = Array.from(cards);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setCards(result);
  };

  const resetLayout = () => {
    setCards(initialCards);
    localStorage.removeItem(storageKey);
  };

  return { cards, reorderCards, resetLayout };
};
