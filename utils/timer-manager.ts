// Central manager for all timers and intervals in the application
// This helps us track, pause, and clean up timers properly

type TimerId = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>

class TimerManager {
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private intervals: Set<NodeJS.Timeout> = new Set()
  private paused = false

  // Create a timeout that we can track
  setTimeout(callback: Function, delay: number): NodeJS.Timeout {
    if (this.paused) return null as unknown as NodeJS.Timeout

    const timeoutId = setTimeout(() => {
      this.timeouts.delete(timeoutId)
      if (!this.paused) {
        callback()
      }
    }, delay)

    this.timeouts.add(timeoutId)
    return timeoutId
  }

  // Create an interval that we can track
  setInterval(callback: Function, delay: number): NodeJS.Timeout {
    if (this.paused) return null as unknown as NodeJS.Timeout

    const intervalId = setInterval(() => {
      if (!this.paused) {
        callback()
      }
    }, delay)

    this.intervals.add(intervalId)
    return intervalId
  }

  // Clear a specific timeout
  clearTimeout(timeoutId: NodeJS.Timeout): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(timeoutId)
    }
  }

  // Clear a specific interval
  clearInterval(intervalId: NodeJS.Timeout): void {
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(intervalId)
    }
  }

  // Pause all timers
  pause(): void {
    this.paused = true
  }

  // Resume all timers
  resume(): void {
    this.paused = false
  }

  // Clear all timeouts
  clearAllTimeouts(): void {
    this.timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.timeouts.clear()
  }

  // Clear all intervals
  clearAllIntervals(): void {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId)
    })
    this.intervals.clear()
  }

  // Clear all timers (both timeouts and intervals)
  clearAll(): void {
    this.clearAllTimeouts()
    this.clearAllIntervals()
  }

  // Get the count of active timers
  getActiveTimerCount(): number {
    return this.timeouts.size + this.intervals.size
  }

  // Check if any timers are active
  hasActiveTimers(): boolean {
    return this.timeouts.size > 0 || this.intervals.size > 0
  }

  // Get paused state
  isPaused(): boolean {
    return this.paused
  }
}

// Create a singleton instance
export const timerManager = new TimerManager()

// Export convenience methods
export const managedSetTimeout = timerManager.setTimeout.bind(timerManager)
export const managedSetInterval = timerManager.setInterval.bind(timerManager)
export const managedClearTimeout = timerManager.clearTimeout.bind(timerManager)
export const managedClearInterval = timerManager.clearInterval.bind(timerManager)
