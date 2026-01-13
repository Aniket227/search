import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchInput } from '../components/SearchInput'
import { SearchItemContainer } from '../components/SearchItemContainer'
import { NewsArticles } from '../components/NewsArticles'
import { getNews, googleSearch } from '../api'
import type { NewsArticle } from '../api'
import { searchCache } from '../utils/cache'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function SearchPage() {
    const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
    const [currentPageNo, setCurrentPageNo] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [inputText, setInputText] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [hotwords, setHotwords] = useState<any[]>([])
    const observerTarget = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const debounceDelay = 100
    const inputRef = useRef<HTMLInputElement>(null)


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

    window.onNativeEvent = function (eventType: string, data?: { hotwords?: any[] }) {
        if (eventType === 'hotWords') {
            setHotwords(data?.hotwords || [])
        }
    }

    // Initial load
    useEffect(() => {
        fetchNews(1, false)
    }, [fetchNews])

    const fetchSearch = useCallback(async (trimmedQuery: string) => {
        if (!trimmedQuery) {
            setSearchResults([])
            return
        }
        // Fetch fresh data in background (cache will handle deduplication)
        try {
            const searchResult = await googleSearch(trimmedQuery)
            const maxResultsToShow = searchResult?.[1] || []
            setSearchResults(maxResultsToShow)
        } catch (error) {
                console.error('Error fetching search:', error)
        }
    }, [])

    useEffect(() => {
        // Show cached results immediately for instant feedback
        const trimmedQuery = inputText?.trim()?.toLowerCase() || ''
        if (trimmedQuery) {
            const cached = searchCache.get(trimmedQuery)
            console.log("cached", cached, "trimmedQuery.length", trimmedQuery.length)
            if (cached) {
                const maxResultsToShow = cached?.[1]?.slice(0, 5) || []
                setSearchResults(maxResultsToShow)
            } else if (trimmedQuery.length >= 2) {
                const prefixMatches = searchCache.getWithPrefix(trimmedQuery, 5)
                if (prefixMatches.length > 0) {
                    const matchData = prefixMatches[0].data
                    const maxResultsToShow = matchData?.[1]?.slice(0, 5) || []
                    setSearchResults(maxResultsToShow)
                }
            }
        } else {
            setSearchResults([])
        }

        // Debounce API call for fresh data
        const timer = setTimeout(() => {
            if (trimmedQuery) {
                fetchSearch(trimmedQuery)
            }
        }, debounceDelay)

        return () => {
            clearTimeout(timer)
        }
    }, [inputText, debounceDelay, fetchSearch])

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const setupObserver = () => {
            // Clean up existing observer if any
            if (observerRef.current) {
                observerRef.current.disconnect()
                observerRef.current = null
            }

            const currentTarget = observerTarget.current
            if (!currentTarget) {
                return
            }

            // Create new observer
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting && hasMore && !isLoading) {
                        const nextPage = currentPageNo + 1
                        setCurrentPageNo(nextPage)
                        fetchNews(nextPage, true)
                    }
                },
                { 
                    threshold: 0.1,
                    rootMargin: '50px' // Start loading slightly before reaching the element
                }
            )

            observer.observe(currentTarget)
            observerRef.current = observer
        }

        // Setup observer immediately if target exists
        // Use a small delay to ensure DOM is updated
        const timeoutId = setTimeout(() => {
            setupObserver()
        }, 100)

        // Also setup observer when visibility changes (for WebView restore)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Reattach observer when page becomes visible
                setTimeout(() => {
                    setupObserver()
                }, 100)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Also listen for focus events (when WebView regains focus)
        const handleFocus = () => {
            setTimeout(() => {
                setupObserver()
            }, 100)
        }

        window.addEventListener('focus', handleFocus)

        // Reattach when page becomes visible (for WebView lifecycle)
        const handlePageShow = () => {
            setTimeout(() => {
                setupObserver()
            }, 100)
        }

        window.addEventListener('pageshow', handlePageShow)

        return () => {
            clearTimeout(timeoutId)
            if (observerRef.current) {
                observerRef.current.disconnect()
                observerRef.current = null
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('pageshow', handlePageShow)
        }
    }, [hasMore, isLoading, currentPageNo, fetchNews, newsArticles.length])

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
            <SearchInput inputRef={inputRef} onChangeText={setInputText} inputText={inputText} />
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
                    <LoadingSpinner />
                )}
                {!hasMore && newsArticles?.length > 0 && (
                    <div className='w-full flex items-center justify-center p-4'>
                        <p className='text-gray-500'>No more news to load</p>
                    </div>
                )}
            </div>}
        </div>
    )
}
