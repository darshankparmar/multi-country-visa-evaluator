import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Base URL for API requests, configured via environment variable
 * Falls back to localhost:3000 if not set
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * Custom API client interface that returns data directly instead of AxiosResponse
 * This simplifies API calls by unwrapping the response automatically
 */
interface ApiClient {
  /** GET request */
  get<T>(url: string, config?: Record<string, unknown>): Promise<T>
  /** POST request */
  post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>
  /** PUT request */
  put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T>
  /** DELETE request */
  delete<T>(url: string, config?: Record<string, unknown>): Promise<T>
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Map API errors to user-friendly messages
 * 
 * Handles various error scenarios:
 * - Network errors (no connection, timeout)
 * - HTTP status codes (400, 401, 403, 404, 500, etc.)
 * - Custom backend error messages
 * 
 * @param {AxiosError} error - Axios error object
 * @returns {string} User-friendly error message
 */
const getErrorMessage = (error: AxiosError): string => {
  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Request timeout. Please check your internet connection and try again.'
    }
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.'
    }
    return 'Network error occurred. Please try again.'
  }

  // HTTP status code errors
  const status = error.response.status
  const data = error.response.data as { message?: string }

  switch (status) {
    case 400:
      return data?.message || 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Authentication required. Please log in and try again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return data?.message || 'The requested resource was not found.'
    case 409:
      return data?.message || 'A conflict occurred. The resource may already exist.'
    case 422:
      return data?.message || 'Validation failed. Please check your input.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error occurred. Please try again later.'
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    case 504:
      return 'Gateway timeout. The server took too long to respond.'
    default:
      return data?.message || `An error occurred (${status}). Please try again.`
  }
}

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Backend wraps responses in { status: 'success', data: ... }
    // Extract the actual data from the wrapper
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    // Fallback to returning the entire response data if structure is different
    return response.data
  },
  (error: AxiosError) => {
    const message = getErrorMessage(error)
    
    // Log detailed error information in development
    if (import.meta.env.DEV) {
      console.error('API Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: message,
        originalError: error
      })
    }
    
    return Promise.reject(new Error(message))
  }
)

/**
 * Configured Axios client for API requests
 * 
 * Features:
 * - Automatic request/response logging
 * - Error handling with user-friendly messages
 * - 30-second timeout
 * - Automatic response unwrapping (returns data directly)
 * - Backend response format handling ({ status: 'success', data: ... })
 * 
 * @example
 * ```typescript
 * // GET request
 * const data = await apiClient.get<User[]>('/users')
 * 
 * // POST request
 * const result = await apiClient.post<CreateResponse>('/users', { name: 'John' })
 * 
 * // With custom headers
 * const data = await apiClient.get('/protected', {
 *   headers: { Authorization: 'Bearer token' }
 * })
 * ```
 */
export const apiClient = axiosInstance as unknown as ApiClient
