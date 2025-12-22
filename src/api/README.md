# API Structure

This directory contains the API structure for the launcher-search application using Axios.

## Structure

```
api/
├── config/
│   └── axios.ts          # Axios instance configuration with interceptors
├── constants/
│   └── endpoints.ts      # API endpoint constants
├── services/
│   ├── searchService.ts  # Search-related API calls (example)
│   └── index.ts          # Service exports
├── types/
│   └── index.ts          # TypeScript types and interfaces
├── utils/
│   └── errorHandler.ts   # Error handling utilities
└── index.ts              # Main API entry point
```

## Usage Examples

### Basic Service Usage

```typescript
import { searchService, axiosInstance } from './api'

// Using the search service (when backend is ready)
try {
  const results = await searchService.search({
    query: 'react',
    limit: 10
  })
  console.log(results)
} catch (error) {
  console.error('Search error:', error)
}

// Or use axiosInstance directly for custom API calls
try {
  const response = await axiosInstance.get('/your-endpoint')
  console.log(response.data)
} catch (error) {
  console.error('API error:', error)
}
```

### Using in React Components

```typescript
import { useState, useEffect } from 'react'
import { searchService } from '@/api'
import { SearchResult } from '@/api/types'

function SearchComponent() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await searchService.search({ query, limit: 10 })
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Your component JSX
  )
}
```

### Error Handling

```typescript
import { getErrorDetails, isNetworkError, isTimeoutError } from '@/api'

try {
  await searchService.search({ query: 'test' })
} catch (error) {
  const errorDetails = getErrorDetails(error)
  
  if (isNetworkError(error)) {
    console.error('Network error - check your connection')
  } else if (isTimeoutError(error)) {
    console.error('Request timed out')
  } else {
    console.error('Error:', errorDetails.message)
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory and set your API base URL:

```env
VITE_API_BASE_URL=https://api.yourserver.com
```

If not set, the base URL defaults to an empty string (relative URLs).

### Authentication

The axios instance automatically adds the auth token from `localStorage.getItem('authToken')` to requests. Make sure to set this token when the user logs in.

## Adding New Services

1. Create a new service file in `services/` directory
2. Import axiosInstance from `../config/axios`
3. Import types and constants as needed
4. Export the service functions
5. Add the export to `services/index.ts`
6. The service will be available through the main `api/index.ts` export

Example:

```typescript
// services/userService.ts
import axiosInstance from '../config/axios'
import { API_ENDPOINTS } from '../constants/endpoints'
import { getErrorDetails } from '../utils/errorHandler'

export const userService = {
  getProfile: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.USER)
      return response.data
    } catch (error) {
      throw getErrorDetails(error)
    }
  }
}
```

