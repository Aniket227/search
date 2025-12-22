import { IMAGES } from '../constants/images'

interface SearchInputProps {
  inputText: string
  onChangeText: (value: string) => void
}

export default function SearchInput({ onChangeText, inputText }: SearchInputProps) {

  return (
    <div className='w-full flex flex-row p-2.5 gap-2 items-center border border-[#ebebeb] rounded-3xl bg-white'>
        <img src={IMAGES.magnifyingGlass} alt='logo' className='w-5 h-5' />
        <input 
          placeholder='Search' 
          className='flex-1 outline-none bg-white text-black' 
          value={inputText}
          onChange={(e) => onChangeText(e.target.value)}
        />
    </div>
  )
}
