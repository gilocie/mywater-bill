import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { WaterRateRange } from "@/app/lib/mock-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateWaterCharge(consumption: number, ranges: WaterRateRange[]): number {
  if (!ranges || ranges.length === 0) return consumption * 2.5;
  const sortedRanges = [...ranges].sort((a, b) => a.from - b.from);
  let totalCharge = 0;
  let remaining = consumption;

  for (let i = 0; i < sortedRanges.length; i++) {
    const range = sortedRanges[i];
    const from = range.from;
    const to = range.to === null || range.to === undefined ? Infinity : range.to;
    const price = range.price;

    if (remaining <= 0) break;

    const rangeSize = to - from;
    if (rangeSize <= 0) continue;

    const unitsInBracket = Math.min(remaining, rangeSize);
    totalCharge += unitsInBracket * price;
    remaining -= unitsInBracket;
  }

  if (remaining > 0 && sortedRanges.length > 0) {
    const lastRange = sortedRanges[sortedRanges.length - 1];
    totalCharge += remaining * lastRange.price;
  }

  return totalCharge;
}
