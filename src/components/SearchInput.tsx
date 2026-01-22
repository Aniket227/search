import React, { useCallback } from 'react'
import { IMAGES } from '../constants/images'

interface SearchInputProps {
  inputText: string
  onChangeText: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onMicClick: () => void
}

export const SearchInput = React.memo(({ onChangeText, inputText, inputRef, onMicClick }: SearchInputProps) => {

  const handleMicClick = useCallback(() => {
    onMicClick()
    // window?.AndroidBridge?.onVoiceSearch()
  }, [onMicClick])

  return (
    <div className='w-full flex flex-row p-2.5 gap-2 items-center border border-[#ebebeb] rounded-3xl bg-white'>
        <img src={IMAGES.magnifyingGlass} alt='logo' className='w-5 h-5' />
        <input 
          ref={inputRef}
          placeholder='Search' 
          className='flex-1 outline-none bg-white text-black' 
          value={inputText}
          onChange={(e) => onChangeText(e.target.value)}
        />
        <img onClick={()=>handleMicClick()} src={IMAGES.mic} alt='logo' className='w-8 h-8' />
    </div>
  )
})
