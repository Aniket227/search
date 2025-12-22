import SearchItem from './SearchItem'

interface SearchItemContainerProps {
    searchResults: string[];
    inputText: string;
    openUrl: (url: string) => void;
}
export default function SearchItemContainer({ searchResults, inputText, openUrl }: SearchItemContainerProps) {
    console.log("searchResults",searchResults)
    return (
        <div className='w-full flex flex-col gap-0.5 rounded-lg bg-white border border-[#e7e7e7] p-2'>
            <p className='text-sm text-[#585858] py-2.5'>{inputText?.length > 0 ? "Search Suggestions" : "Sponsored Searches"}</p>
            {searchResults?.map((item, index) => {
                return <SearchItem key={index} item={item} openUrl={openUrl} />
            })}
        </div>
    )
}
