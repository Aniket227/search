import axiosInstance from '../config/axios'
import { API_ENDPOINTS } from '../constants/endpoints'
import type { SearchParams, SearchResult, ApiResponse } from '../types'
import { getErrorDetails } from '../utils/errorHandler'

/**
 * Search service for handling search-related API calls
 */
export const searchService = {
  /**
   * Perform a search query
   */
  search: async (params: SearchParams): Promise<SearchResult[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<SearchResult[]>>(
        API_ENDPOINTS.SEARCH,
        {
          params: {
            q: params.query,
            limit: params.limit || 10,
            offset: params.offset || 0,
          },
        }
      )
      return response.data.data
    } catch (error) {
      throw getErrorDetails(error)
    }
  },

  /**
   * Get search suggestions/autocomplete
   */
  getSuggestions: async (query: string, limit: number = 5): Promise<string[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<string[]>>(
        API_ENDPOINTS.SEARCH_SUGGESTIONS,
        {
          params: {
            q: query,
            limit,
          },
        }
      )
      return response.data.data
    } catch (error) {
      throw getErrorDetails(error)
    }
  },
}

