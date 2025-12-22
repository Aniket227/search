import axiosInstance from '../config/axios'
import { API_ENDPOINTS } from '../constants/endpoints'
import type { NewsApiResponse, NewsParams } from '../types'
import { getErrorDetails } from '../utils/errorHandler'

/**
 * News service for handling news-related API calls
 */
export const newsService = {
  /**
   * Get Fox News articles with pagination
   * @param params - News parameters (limit, pageno, sec, lang)
   * @returns News API response with articles
   */
  getFoxNews: async (params?: NewsParams): Promise<NewsApiResponse> => {
    try {
      const response = await axiosInstance.get<NewsApiResponse>(
        API_ENDPOINTS.FOX_NEWS,
        {
          params: {
            limit: params?.limit || 10,
            pageno: params?.pageno || 1,
            sec: params?.sec || 'topnews',
            lang: params?.lang || 'en',
          },
        }
      )
      return response.data
    } catch (error) {
      throw getErrorDetails(error)
    }
  },
}

