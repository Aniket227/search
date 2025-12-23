import SearchItem from './SearchItem'

interface SearchItemContainerProps {
    searchResults: string[];
    inputText: string;
    openUrl: (url: string) => void;
    hotwords: any[];
}
export default function SearchItemContainer({ searchResults, inputText, openUrl, hotwords }: SearchItemContainerProps) {
    return (
        <div className='w-full flex flex-col gap-0.5 min-h-[34vh] rounded-lg bg-white border border-[#e7e7e7] p-2'>
            <p className='text-sm text-[#585858] py-2.5'>{inputText?.length > 0 ? "Search Suggestions" : "Sponsored Searches"}</p>
            {searchResults?.map((item, index) => {
                return <SearchItem isLastItem={index == searchResults?.length - 1} key={index} item={item} openUrl={openUrl} />
            })}
            {inputText?.length == 0 && (hotwords?.map((item, index) => {
                return <SearchItem isLastItem={index == hotwords?.length - 1} key={index} item={item?.keyword} openUrl={openUrl} />
            }))}
        </div>
    )
}
