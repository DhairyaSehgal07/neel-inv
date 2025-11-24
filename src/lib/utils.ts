import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Round a number to 2 decimal places
 * Useful for preventing floating point precision issues
 */
export function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100
}
