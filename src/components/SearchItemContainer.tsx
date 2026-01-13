import React from 'react';
import SearchItem from './SearchItem'

interface SearchItemContainerProps {
    searchResults: string[];
    inputText: string;
    openUrl: (url: string) => void;
    hotwords: any[];
}
export const SearchItemContainer = React.memo(({ searchResults, inputText, openUrl, hotwords }: SearchItemContainerProps) =>{
    return (
        <div className='w-full flex flex-col gap-0.5 rounded-lg bg-white border border-[#e7e7e7] p-2 h-auto'>
            <p className='text-sm text-[#585858] py-2.5'>{inputText?.length > 0 ? "Search Suggestions" : "Sponsored Searches"}</p>
            <div className="grow h-full overflow-hidden">
                {searchResults?.map((item, index) => (
                    <SearchItem 
                        isLastItem={index === searchResults?.length - 1} 
                        key={item} 
                        item={item} 
                        openUrl={openUrl}
                        index={index}
                        shouldAnimate={false}
                    />
                ))}
                {(inputText?.length === 0 || searchResults?.length === 0) && hotwords?.map((item, index) => (
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
})
