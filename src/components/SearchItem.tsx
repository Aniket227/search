import { IMAGES } from '../constants/images'

export default function SearchItem({ item, openUrl, isLastItem, index = 0, shouldAnimate = false, redirectUrl = '' }: { item: string, openUrl: (url: string) => void, isLastItem: boolean, index?: number, shouldAnimate?: boolean, redirectUrl?: string }) {
    return (
        <div 
            style={{
                borderBottom: isLastItem ? 'none' : '1px solid #f0f0f0',
                ...(shouldAnimate ? {
                    animationDelay: `${index * 0.04}s`,
                    opacity: 0
                } : {})
            }} 
            className={`w-full flex flex-row px-2.5 py-1.5 gap-2 items-center border-b border-[#f0f0f0] ${shouldAnimate ? 'animate-slide-up' : ''}`}
            onClick={()=>openUrl(redirectUrl ? redirectUrl : item)}
        >
            <img src={IMAGES.magnifyingGlassGray} alt='logo' className='w-4 h-4' />
            <p className='text-sm flex-1'>{item}</p>
            <img src={IMAGES.arrowUp} alt='logo' className='w-5 h-5' />
        </div>
    )
}
