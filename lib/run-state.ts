/**
 * Checks if the application is in a dormant state by examining both DOM attributes
 * and the current simulation state.
 *
 * @returns {boolean} True if the application is in dormant state
 */
export const isDormantState = (): boolean => {
  // Check DOM attribute first (most reliable source)
  if (typeof document !== "undefined") {
    const isRunningInDOM = document.documentElement.getAttribute("data-simulation-running") === "true"
    if (!isRunningInDOM) {
      return true
    }
  }

  return false
}

/**
 * Forces the application into a dormant state by removing DOM attributes
 * that might be causing continuous execution.
 */
export const forceDormantState = (): void => {
  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")
    console.log("Forced dormant state via DOM attribute removal")
  }
}
