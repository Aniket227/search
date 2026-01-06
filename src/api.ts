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

export const googleSearch = async (query: string, maxResults: number = 5) => {
    if (!query) {
        return []
    }

    return cachedApiCall(
        searchCache,
        query?.toLowerCase() || '',
        async () => {
            try {
                const responseString = await window?.AndroidBridge?.search(query)
                if(responseString){
                    const response = JSON.parse(responseString)
                    return [response?.query || query, response?.suggestions || []]
                }else{
                    return [query, []]
                }
            } catch (error) {
                console.error('Error fetching search:', error)
                throw error
            }
        },
        { maxResults }
    )
}

