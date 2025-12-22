// Main API entry point
export * from './services'
export * from './types'
export * from './constants/endpoints'
export * from './utils/errorHandler'
export { default as axiosInstance } from './config/axios'

// Example usage:
// import { axiosInstance } from './api'
// const response = await axiosInstance.get('/your-endpoint')

