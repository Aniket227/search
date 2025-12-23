import { useState, useEffect, useRef, useCallback } from 'react'
import SearchInput from '../components/SearchInput'
import SearchItemContainer from '../components/SearchItemContainer'
import NewsArticles from '../components/NewsArticles'
import { getNews, googleSearch } from '../api'
import type { NewsArticle } from '../api'
import { searchCache } from '../utils/cache'

export default function SearchPage() {
    const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
    const [currentPageNo, setCurrentPageNo] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [inputText, setInputText] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [hotwords, setHotwords] = useState<any[]>([])
    const observerTarget = useRef<HTMLDivElement>(null)
    const debounceDelay = 100

    const fetchNews = useCallback(async (page: number, append: boolean = false) => {
        setIsLoading(true)
        try {
            const response = await getNews(10, page, 'topnews', 'en')

            if (response.status === 'true' && response.resultSet) {
                if (append) {
                    setNewsArticles(prev => [...prev, ...response.resultSet])
                } else {
                    setNewsArticles(response.resultSet)
                }

                // Check if there are more articles to load
                if (response.resultSet.length < 10) {
                    setHasMore(false)
                }
            }
        } catch (error) {
            console.error('Error fetching news:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const getCurrentFlavour = useCallback(async () => {
        if (window?.AndroidBridge) {
            return window?.AndroidBridge?.getCurrentFlavour()
        }
        return null
    }, [])

    window.onNativeEvent = function (eventType, data) {

        if (eventType === 'hotWords') {
            setHotwords(data?.hotwords || [])
        }
    }

    // Initial load
    useEffect(() => {
        if(window?.AndroidBridge){
            window?.AndroidBridge?.getHotWordsToJs?.()
        }
        const currentFlavour = getCurrentFlavour()
        console.log("currentFlavour", currentFlavour)
        fetchNews(1, false)
    }, [fetchNews])

    const fetchSearch = useCallback(async (query: string) => {
        if (!query || !query.trim()) {
            setSearchResults([])
            return
        }

        const trimmedQuery = query.trim()

        // Check cache first for instant results (Chrome-like performance)
        const cached = searchCache.get(trimmedQuery)
        if (cached) {
            const maxResultsToShow = cached?.[1]?.slice(0, 5) || []
            setSearchResults(maxResultsToShow)
        }

        // Also check for prefix matches (for partial queries)
        if (trimmedQuery.length >= 2) {
            const prefixMatches = searchCache.getWithPrefix(trimmedQuery, 5)
            if (prefixMatches.length > 0 && !cached) {
                // Use the first match's data
                const matchData = prefixMatches?.[0].data
                const maxResultsToShow = matchData?.[1] || []
                setSearchResults(maxResultsToShow)
            }
        }

        // Fetch fresh data in background (cache will handle deduplication)
        try {
            const searchResult = await googleSearch(trimmedQuery)
            const maxResultsToShow = searchResult?.[1] || []
            setSearchResults(maxResultsToShow)
        } catch (error) {
            // If fetch fails and we have cached results, keep showing them
            if (!cached) {
                console.error('Error fetching search:', error)
            }
        }
    }, [])

    useEffect(() => {
        // Show cached results immediately for instant feedback
        if (inputText && inputText.trim()) {
            const trimmedQuery = inputText.trim()
            const cached = searchCache.get(trimmedQuery)
            if (cached) {
                const maxResultsToShow = cached?.[1]?.slice(0, 5) || []
                setSearchResults(maxResultsToShow)
            } else if (trimmedQuery.length >= 2) {
                // Try prefix matching for partial queries
                const prefixMatches = searchCache.getWithPrefix(trimmedQuery, 5)
                if (prefixMatches.length > 0) {
                    const matchData = prefixMatches[0].data
                    const maxResultsToShow = matchData?.[1]?.slice(0, 5) || []
                    setSearchResults(maxResultsToShow)
                } else {
                    setSearchResults([])
                }
            } else {
                setSearchResults([])
            }
        } else {
            setSearchResults([])
        }

        // Debounce API call for fresh data
        const timer = setTimeout(() => {
            if (inputText && inputText.trim()) {
                fetchSearch(inputText)
            }
        }, debounceDelay)

        return () => {
            clearTimeout(timer)
        }
    }, [inputText, debounceDelay, fetchSearch])

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    const nextPage = currentPageNo + 1
                    setCurrentPageNo(nextPage)
                    fetchNews(nextPage, true)
                }
            },
            { threshold: 0.1 }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget)
            }
        }
    }, [hasMore, isLoading, currentPageNo, fetchNews])

    const openUrl = useCallback((url: string) => {
        if (window?.AndroidBridge) {
            if (url.includes('http')) {
                window?.AndroidBridge?.openUrl(url)
                return
            } else {
                let baseUrl = "https://search.yahoo.com/search?q="
                let encodedUrl = encodeURIComponent(url)
                let finalUrl = baseUrl + encodedUrl
                window?.AndroidBridge?.openUrl(finalUrl)
                return
            }
        }
    }, [])

    return (
        <div className='w-full h-screen flex flex-col p-2 gap-3 bg-[#f4f4f4] overflow-y-auto'>
            <SearchInput onChangeText={setInputText} inputText={inputText} />
            <SearchItemContainer openUrl={openUrl} hotwords={hotwords} inputText={inputText} searchResults={searchResults} />
            {inputText?.length == 0 && <div className='w-full flex flex-col gap-3'>
                {newsArticles?.map((article, index) => (
                    <div
                        key={`${article.u}-${index}`}
                        ref={index === newsArticles.length - 2 ? observerTarget : null}
                    >
                        <NewsArticles openUrl={openUrl} article={article} />
                    </div>
                ))}
                {isLoading && (
                    <div className='w-full flex items-center justify-center p-4'>
                        <p className='text-gray-500'>Loading more news...</p>
                    </div>
                )}
                {!hasMore && newsArticles.length > 0 && (
                    <div className='w-full flex items-center justify-center p-4'>
                        <p className='text-gray-500'>No more news to load</p>
                    </div>
                )}
            </div>}
        </div>
    )
}
