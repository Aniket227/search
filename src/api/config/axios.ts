import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'

// API Base URL - set via environment variable or use default news API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://homepagenews.co'

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken')
          // window.location.href = '/login'
          break
        case 403:
          console.error('Forbidden: You do not have permission to access this resource')
          break
        case 404:
          console.error('Not Found: The requested resource was not found')
          break
        case 500:
          console.error('Server Error: Internal server error occurred')
          break
        default:
          console.error('An error occurred:', error.message)
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server')
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance

