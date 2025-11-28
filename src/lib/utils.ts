import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rounds a number to the nearest 5
 * @param value - The number to round
 * @returns The number rounded to the nearest 5
 */
export function roundToNearest5(value: number): number {
  return Math.round(value / 5) * 5;
}
