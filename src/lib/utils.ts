import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qd', 'Qn', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(n: number, decimals = 2): string {
  if (n === 0) return '0';
  const isNegative = n < 0;
  let abs = Math.abs(n);
  
  if (abs < 1000) {
    // Show decimals only if needed
    const str = abs % 1 === 0 ? abs.toString() : abs.toFixed(decimals);
    return (isNegative ? '-' : '') + str;
  }
  
  let tier = 0;
  while (abs >= 1000 && tier < SUFFIXES.length - 1) {
    abs /= 1000;
    tier++;
  }
  
  // Show 1 decimal for clean numbers, 2 otherwise
  const formatted = abs >= 100 ? abs.toFixed(0) : abs >= 10 ? abs.toFixed(1) : abs.toFixed(2);
  return (isNegative ? '-' : '') + formatted + SUFFIXES[tier];
}

export function formatCurrency(n: number): string {
  return '$' + formatNumber(n);
}
