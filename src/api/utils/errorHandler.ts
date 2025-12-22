import { AxiosError } from 'axios'
import { ApiError } from '../types'

/**
 * Extract error message from axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}

/**
 * Extract error details from axios error
 */
export const getErrorDetails = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return {
      message: getErrorMessage(error),
      code: error.code,
      status: error.response?.status,
    }
  }
  
  return {
    message: getErrorMessage(error),
  }
}

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !error.response
  }
  return false
}

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED'
  }
  return false
}

