import { useEffect, useState, useRef } from 'react'
import SearchItem from './SearchItem'

interface SearchItemContainerProps {
    searchResults: string[];
    inputText: string;
    openUrl: (url: string) => void;
    hotwords: any[];
}
export default function SearchItemContainer({ searchResults, inputText, openUrl, hotwords }: SearchItemContainerProps) {
    const [displayResults, setDisplayResults] = useState<string[]>([])
    const [shouldAnimate, setShouldAnimate] = useState(false)
    const previousResultsRef = useRef<string[]>([])

    useEffect(() => {
    console.log("shouldAnimate",shouldAnimate)
        const resultsChanged = JSON.stringify(searchResults) !== JSON.stringify(previousResultsRef.current)
        
        if (!resultsChanged && searchResults.length > 0) {
            return
        }

        if (searchResults.length === 0) {
            setDisplayResults([])
            previousResultsRef.current = []
            setShouldAnimate(false)
            return
        }

        const wasEmpty = previousResultsRef.current.length === 0
        const hasResults = searchResults.length > 0
        
        if (wasEmpty && hasResults) {
            setShouldAnimate(true)
            setTimeout(() => {
                setShouldAnimate(false)
            }, 400)
        } else {
            setShouldAnimate(false)
        }

        setDisplayResults(searchResults)
        previousResultsRef.current = searchResults
    }, [searchResults])

    return (
        <div className='w-full flex flex-col gap-0.5 rounded-lg bg-white border border-[#e7e7e7] p-2 h-full'>
            <p className='text-sm text-[#585858] py-2.5'>{inputText?.length > 0 ? "Search Suggestions" : "Sponsored Searches"}</p>
            <div className="grow h-full overflow-hidden">
                {displayResults?.map((item, index) => (
                    <SearchItem 
                        isLastItem={index === displayResults?.length - 1} 
                        key={item} 
                        item={item} 
                        openUrl={openUrl}
                        index={index}
                        shouldAnimate={false}
                    />
                ))}
                {inputText?.length === 0 && hotwords?.map((item, index) => (
                    <SearchItem 
                        isLastItem={index === hotwords?.length - 1} 
                        key={`hotword-${item?.keyword}-${index}`} 
                        item={item?.keyword}
                        redirectUrl={item?.redirectUrl} 
                        openUrl={openUrl}
                        index={index}
                    />
                ))}
            </div>
        </div>
    )
}
