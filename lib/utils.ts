import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isDormant = () => {
  return typeof document !== "undefined" && document.documentElement.getAttribute("data-simulation-running") === null
}
