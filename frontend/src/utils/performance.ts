/**
 * Performance monitoring utilities
 */

/**
 * Report Web Vitals metrics
 * Note: Requires 'web-vitals' package to be installed
 */
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamic import - will only work if web-vitals is installed
    // This is optional and won't break the build if not available
    try {
      // @ts-ignore - optional dependency
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry)
        getFID(onPerfEntry)
        getFCP(onPerfEntry)
        getLCP(onPerfEntry)
        getTTFB(onPerfEntry)
      }).catch(() => {
        // web-vitals not installed, skip reporting
      })
    } catch {
      // web-vitals not available
    }
  }
}

/**
 * Log performance metrics to console in development
 */
export const logPerformanceMetrics = () => {
  if (import.meta.env.DEV && window.performance) {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    const connectTime = perfData.responseEnd - perfData.requestStart
    const renderTime = perfData.domComplete - perfData.domLoading

    console.log('Performance Metrics:')
    console.log(`Page Load Time: ${pageLoadTime}ms`)
    console.log(`Connect Time: ${connectTime}ms`)
    console.log(`Render Time: ${renderTime}ms`)
  }
}

/**
 * Measure component render time
 */
export const measureRender = (componentName: string, callback: () => void) => {
  if (import.meta.env.DEV) {
    const start = performance.now()
    callback()
    const end = performance.now()
    console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`)
  } else {
    callback()
  }
}

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
