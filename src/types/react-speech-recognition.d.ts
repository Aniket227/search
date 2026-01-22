declare module 'react-speech-recognition' {
    export interface SpeechRecognitionOptions {
      continuous?: boolean
      interimResults?: boolean
      language?: string
    }
  
    export interface UseSpeechRecognitionReturn {
      transcript: string
      listening: boolean
      resetTranscript: () => void
      browserSupportsSpeechRecognition: boolean
      isMicrophoneAvailable: boolean
    }
  
    export function useSpeechRecognition(): UseSpeechRecognitionReturn
  
    interface SpeechRecognitionDefault {
      startListening: (options?: SpeechRecognitionOptions) => void
      stopListening: () => void
      abortListening: () => void
      applyPolyfill: (SpeechRecognition: any) => void
    }
  
    const SpeechRecognition: SpeechRecognitionDefault
    export default SpeechRecognition
  }
  