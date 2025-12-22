import { IMAGES } from '../constants/images'
import type { NewsArticle } from '../api'

interface NewsArticlesProps {
    article: NewsArticle;
    openUrl: (url: string) => void;
}

export default function NewsArticles({ article, openUrl }: NewsArticlesProps) {
    // Format the date/time from dbtime
    const formatTime = (dbtime: string) => {
        try {
            const date = new Date(dbtime)
            const now = new Date()
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
            
            if (diffInHours < 1) {
                return `${Math.floor((now.getTime() - date.getTime()) / (1000 * 60))}m ago`
            } else if (diffInHours < 24) {
                return `${diffInHours}h ago`
            } else {
                const diffInDays = Math.floor(diffInHours / 24)
                return `${diffInDays}d ago`
            }
        } catch {
            return dbtime
        }
    }

    return (
        <div className='cursor-pointer hover:opacity-90 transition-opacity' onClick={()=>openUrl(article.u)}>
            <img 
                src={article.img} 
                alt={article.t} 
                className='w-full h-48 object-cover rounded-md' 
                onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=News'
                }}
            />
            <p className='text-lg text-black font-semibold mt-2 line-clamp-2'>{article.t}</p>
            <div className='flex gap-4 items-center mt-2'>
                <div className='flex items-center gap-1'>
                    <img 
                        src={article.favi} 
                        alt={article.site} 
                        className='w-3 h-3 rounded-sm' 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                    <p className='text-[10px] text-[#959598]'>{article.site}</p>
                </div>
                <div className='flex items-center gap-1'>
                    <img src={IMAGES.clock} alt='clock' className='w-3 h-3 rounded-sm' />
                    <p className='text-[10px] text-[#717175]'>{formatTime(article.dbtime)}</p>
                </div>
            </div>
        </div>
    )
}
