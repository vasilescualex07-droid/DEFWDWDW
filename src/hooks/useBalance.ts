import { useState, useEffect } from 'react';

const STORAGE_KEY = 'casino_balance';
const STARTING_BALANCE = 100;

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : STARTING_BALANCE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, balance.toString());
  }, [balance]);

  const addBalance = (amount: number) => {
    setBalance(prev => Math.round((prev + amount) * 100) / 100);
  };

  const subtractBalance = (amount: number) => {
    setBalance(prev => Math.max(0, Math.round((prev - amount) * 100) / 100));
  };

  const resetBalance = () => {
    setBalance(STARTING_BALANCE);
  };

  return {
    balance,
    addBalance,
    subtractBalance,
    resetBalance,
  };
};