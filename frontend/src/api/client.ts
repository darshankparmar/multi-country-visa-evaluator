import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create a custom type that returns data directly instead of AxiosResponse
interface ApiClient {
  get<T>(url: string, config?: any): Promise<T>
  post<T>(url: string, data?: any, config?: any): Promise<T>
  put<T>(url: string, data?: any, config?: any): Promise<T>
  delete<T>(url: string, config?: any): Promise<T>
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

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Export with proper typing that reflects the interceptor behavior
export const apiClient = axiosInstance as unknown as ApiClient
