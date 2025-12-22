import axios from 'axios'
import { cachedApiCall, searchCache, newsCache } from './utils/cache'

// API Base URL
const API_BASE_URL = 'https://homepagenews.co'

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// News API response types
export interface NewsArticle {
    t: string  // title
    u: string  // url
    site: string  // source site
    img: string  // image URL
    dbtime: string  // date/time
    favi: string  // favicon URL
}

export interface NewsResponse {
    status: string
    size: number
    resultSet: NewsArticle[]
}

// Get news articles (with caching for instant performance)
export const getNews = async (
    limit: number = 10,
    pageno: number = 1,
    sec: string = 'topnews',
    lang: string = 'en'
): Promise<NewsResponse> => {
    const cacheKey = `news_${sec}_${lang}_${pageno}_${limit}`
    
    return cachedApiCall(
        newsCache,
        cacheKey,
        async () => {
            try {
                const response = await api.get<NewsResponse>('/hapi/categoryNews', {
                    params: {
                        limit,
                        pageno,
                        sec,
                        lang,
                    },
                })
                return response.data
            } catch (error) {
                console.error('Error fetching news:', error)
                throw error
            }
        },
        { limit, pageno, sec, lang }
    )
}

// Google search with caching for Chrome-like instant results
export const googleSearch = async (query: string, maxResults: number = 5) => {
    if (!query || !query.trim()) {
        return []
    }

    return cachedApiCall(
        searchCache,
        query.trim(),
        async () => {
            try {
                const response = await axios.get(`/api/google/complete/search?client=chrome&q=${encodeURIComponent(query)}&hl=en`)
                console.log("googleSearch", response.data)
                return response.data
            } catch (error) {
                console.error('Error fetching search:', error)
                throw error
            }
        },
        { maxResults }
    )
}

// Bing search with caching
export const bingSearch = async (query: string, maxResults: number = 5) => {
    if (!query || !query.trim()) {
        return []
    }

    return cachedApiCall(
        searchCache,
        `bing_${query.trim()}`,
        async () => {
            try {
                const response = await axios.get(`/api/bing/osjson.aspx?query=${encodeURIComponent(query)}`)
                console.log("bingSearch", response.data)
                return response.data
            } catch (error) {
                console.error('Error fetching search:', error)
                throw error
            }
        },
        { maxResults }
    )
}

