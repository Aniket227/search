// Image constants
// For public folder assets, use paths starting with '/'
// For src/assets, import them as modules for proper Vite bundling
import arrowUp from '../assets/arrowUp.webp'
import magnifyingGlass from '../assets/magnifyingGlass.webp'
import magnifyingGlassGray from '../assets/magnifyingGlassGray.webp'
import reactLogo from '../assets/react.svg'
import clock from '../assets/clock.webp'
import mic from '../assets/mic.webp'

export const IMAGES = {
  logo: '/logo.png', // Assumes logo.png is in public folder
  arrowUp,
  magnifyingGlass,
  magnifyingGlassGray,
  reactLogo,
  clock,
  mic
} as const

