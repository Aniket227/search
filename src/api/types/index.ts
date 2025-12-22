// Common API response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Search types
export interface SearchParams {
  query: string
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  title: string
  description?: string
  url?: string
  type?: string
}

// News types - matching homepagenews.co API response
export interface NewsArticle {
  t: string  // title
  u: string  // url
  site: string  // source site
  img: string  // image URL
  dbtime: string  // date/time
  favi: string  // favicon URL
}

export interface NewsApiResponse {
  status: string
  size: number
  resultSet: NewsArticle[]
}

export interface NewsParams {
  limit?: number
  pageno?: number
  sec?: string  // section (e.g., 'topnews')
  lang?: string  // language (e.g., 'en')
}

