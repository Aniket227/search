/**
 * High-performance caching utility for Chrome-like search performance
 * Supports in-memory cache, localStorage persistence, TTL, and prefix matching
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  key: string
}

interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  useLocalStorage?: boolean // Whether to persist to localStorage
  localStoragePrefix?: string // Prefix for localStorage keys
}

class CacheManager<T> {
  private memoryCache: Map<string, CacheEntry<T>> = new Map()
  private config: Required<CacheConfig>
  private pendingRequests: Map<string, Promise<T>> = new Map()

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize ?? 1000, // 1000 entries default
      useLocalStorage: config.useLocalStorage ?? true,
      localStoragePrefix: config.localStoragePrefix ?? 'search_cache_',
    }

    // Load from localStorage on initialization
    if (this.config.useLocalStorage) {
      this.loadFromLocalStorage()
    }
  }

  /**
   * Generate cache key from query and optional params
   */
  private generateKey(query: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${query.toLowerCase().trim()}_${paramsStr}`
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt
  }

  /**
   * Get cache entry (checks both memory and localStorage)
   */
  get(query: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(query, params)

    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data
    }

    // Remove expired entry
    if (memoryEntry && this.isExpired(memoryEntry)) {
      this.memoryCache.delete(key)
    }

    // Check localStorage if enabled
    if (this.config.useLocalStorage) {
      try {
        const stored = localStorage.getItem(this.config.localStoragePrefix + key)
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored)
          if (!this.isExpired(entry)) {
            // Restore to memory cache for faster access
            this.memoryCache.set(key, entry)
            return entry.data
          } else {
            // Remove expired entry
            localStorage.removeItem(this.config.localStoragePrefix + key)
          }
        }
      } catch (error) {
        console.warn('Error reading from localStorage:', error)
      }
    }

    return null
  }

  /**
   * Set cache entry (both memory and localStorage)
   */
  set(query: string, data: T, params?: Record<string, any>, customTTL?: number): void {
    const key = this.generateKey(query, params)
    const ttl = customTTL ?? this.config.ttl
    const now = Date.now()

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key,
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)

    // Enforce max size (LRU eviction)
    if (this.memoryCache.size > this.config.maxSize) {
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey || '')
    }

    // Store in localStorage if enabled
    if (this.config.useLocalStorage) {
      try {
        localStorage.setItem(
          this.config.localStoragePrefix + key,
          JSON.stringify(entry)
        )
        this.cleanupLocalStorage()
      } catch (error) {
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded, clearing old entries')
          this.clearOldLocalStorageEntries()
          try {
            localStorage.setItem(
              this.config.localStoragePrefix + key,
              JSON.stringify(entry)
            )
          } catch (e) {
            console.warn('Failed to store in localStorage after cleanup:', e)
          }
        }
      }
    }
  }

  /**
   * Get cached results with prefix matching (for autocomplete)
   */
  getWithPrefix(prefix: string, limit: number = 5): Array<{ query: string; data: T }> {
    const results: Array<{ query: string; data: T }> = []
    const lowerPrefix = prefix.toLowerCase().trim()

    // Check memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isExpired(entry) && key.toLowerCase().startsWith(lowerPrefix)) {
        // Extract original query from key (before the params part)
        const query = key.split('_')[0]
        results.push({ query, data: entry.data })
        if (results.length >= limit) break
      }
    }

    // Check localStorage if needed
    if (results.length < limit && this.config.useLocalStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)
          if (storageKey?.startsWith(this.config.localStoragePrefix)) {
            const cacheKey = storageKey.replace(this.config.localStoragePrefix, '')
            if (cacheKey.toLowerCase().startsWith(lowerPrefix)) {
              const stored = localStorage.getItem(storageKey)
              if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored)
                if (!this.isExpired(entry)) {
                  const query = cacheKey.split('_')[0]
                  results.push({ query, data: entry.data })
                  if (results.length >= limit) break
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error reading from localStorage for prefix search:', error)
      }
    }

    return results
  }

  /**
   * Check if there's a pending request for this query (request deduplication)
   */
  getPendingRequest(query: string, params?: Record<string, any>): Promise<T> | null {
    const key = this.generateKey(query, params)
    return this.pendingRequests.get(key) || null
  }

  /**
   * Set pending request (for deduplication)
   */
  setPendingRequest(query: string, promise: Promise<T>, params?: Record<string, any>): void {
    const key = this.generateKey(query, params)
    this.pendingRequests.set(key, promise)
    
    // Clean up after promise resolves/rejects
    promise
      .finally(() => {
        this.pendingRequests.delete(key)
      })
  }

  /**
   * Clear cache entry
   */
  delete(query: string, params?: Record<string, any>): void {
    const key = this.generateKey(query, params)
    this.memoryCache.delete(key)
    
    if (this.config.useLocalStorage) {
      localStorage.removeItem(this.config.localStoragePrefix + key)
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    this.pendingRequests.clear()
    
    if (this.config.useLocalStorage) {
      try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(this.config.localStoragePrefix)) {
            keys.push(key)
          }
        }
        keys.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.warn('Error clearing localStorage:', error)
      }
    }
  }

  /**
   * Load cache from localStorage on initialization
   */
  private loadFromLocalStorage(): void {
    try {
      const entries: Array<[string, CacheEntry<T>]> = []

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey?.startsWith(this.config.localStoragePrefix)) {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const entry: CacheEntry<T> = JSON.parse(stored)
            if (!this.isExpired(entry)) {
              const cacheKey = storageKey.replace(this.config.localStoragePrefix, '')
              entries.push([cacheKey, entry])
            } else {
              // Remove expired entry
              localStorage.removeItem(storageKey)
            }
          }
        }
      }

      // Load into memory cache (limit to maxSize)
      entries
        .sort((a, b) => b[1].timestamp - a[1].timestamp) // Most recent first
        .slice(0, this.config.maxSize)
        .forEach(([key, entry]) => {
          this.memoryCache.set(key, entry)
        })
    } catch (error) {
      console.warn('Error loading from localStorage:', error)
    }
  }

  /**
   * Cleanup expired entries from localStorage
   */
  private cleanupLocalStorage(): void {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey?.startsWith(this.config.localStoragePrefix)) {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const entry: CacheEntry<T> = JSON.parse(stored)
            if (this.isExpired(entry)) {
              keysToRemove.push(storageKey)
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Error cleaning up localStorage:', error)
    }
  }

  /**
   * Clear old entries from localStorage when quota is exceeded
   */
  private clearOldLocalStorageEntries(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = []

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey?.startsWith(this.config.localStoragePrefix)) {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const entry: CacheEntry<T> = JSON.parse(stored)
            entries.push({ key: storageKey, timestamp: entry.timestamp })
          }
        }
      }

      // Sort by timestamp (oldest first) and remove oldest 50%
      entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(entries.length / 2))
        .forEach(({ key }) => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Error clearing old localStorage entries:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      pendingRequests: this.pendingRequests.size,
    }
  }
}

// Create singleton instances for different cache types
export const searchCache = new CacheManager<any[]>({
  ttl: 10 * 60 * 1000, // 10 minutes for search results
  maxSize: 500,
  useLocalStorage: true,
  localStoragePrefix: 'search_cache_',
})

export const newsCache = new CacheManager<any>({
  ttl: 15 * 60 * 1000, // 15 minutes for news
  maxSize: 100,
  useLocalStorage: true,
  localStoragePrefix: 'news_cache_',
})

/**
 * Cached API call wrapper - provides Chrome-like instant results
 */
export async function cachedApiCall<T>(
  cache: CacheManager<T>,
  query: string,
  apiCall: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  // Check cache first (instant result)
  const cached = cache.get(query, params)
  if (cached !== null) {
    return cached
  }

  // Check for pending request (deduplication)
  const pending = cache.getPendingRequest(query, params)
  if (pending) {
    return pending
  }

  // Make API call
  const promise = apiCall()
  cache.setPendingRequest(query, promise, params)

  try {
    const result = await promise
    // Cache the result
    cache.set(query, result, params)
    return result
  } catch (error) {
    // Don't cache errors
    throw error
  }
}

