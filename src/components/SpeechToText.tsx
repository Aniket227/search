import { useEffect, useState, useRef, useCallback } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { IMAGES } from '../constants/images'

interface SpeechToTextProps {
  isOpen: boolean
  onClose: () => void
  onTranscript: (text: string) => void
}

export default function SpeechToText({
  isOpen,
  onClose,
  onTranscript
}: SpeechToTextProps) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  const [error, setError] = useState<string | null>(null)
  const submitTimerRef = useRef<number | null>(null)

  const isAndroid = /Android/i.test(navigator.userAgent)

  /* ----------------------------------
   * Permission check (once per open)
   * ---------------------------------- */
  useEffect(() => {
    if (!isOpen) return

    setError(null)
    resetTranscript()

    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition is not supported on this browser.')
      return
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => stream.getTracks().forEach(t => t.stop()))
      .catch(() => {
        setError('Microphone permission denied.')
      })
  }, [isOpen, browserSupportsSpeechRecognition, resetTranscript])

  /* ----------------------------------
   * Start listening (user gesture safe)
   * ---------------------------------- */
  useEffect(() => {
    if (!isOpen || error) return

    try {
      SpeechRecognition.startListening({
        continuous: false, // REQUIRED for Android & iOS
        language: 'en-US',
        interimResults: true
      })
    } catch (e) {
      setError('Failed to start microphone.')
    }

    return () => {
      SpeechRecognition.stopListening()
    }
  }, [isOpen, error])

  /* ----------------------------------
   * Auto-submit when speech ends
   * ---------------------------------- */
  useEffect(() => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current)
      submitTimerRef.current = null
    }

    // Speech finished
    if (!listening && transcript.trim().length > 0 && isOpen) {
      submitTimerRef.current = window.setTimeout(() => {
        onTranscript(transcript.trim())
        resetTranscript()
        onClose()
      }, 500)
    }

    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current)
      }
    }
  }, [listening, transcript, isOpen, onTranscript, resetTranscript, onClose])

  /* ----------------------------------
   * Retry
   * ---------------------------------- */
  const handleRetry = useCallback(() => {
    setError(null)
    resetTranscript()

    SpeechRecognition.startListening({
      continuous: false,
      language: 'en-US',
      interimResults: true
    })
  }, [resetTranscript])

  if (!isOpen) return null

  /* ----------------------------------
   * Error UI
   * ---------------------------------- */
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#2B2B2B] p-6 rounded-lg flex flex-col items-center gap-4">
          <div className="bg-red-500 p-5 rounded-full">
            <img src={IMAGES.mic} className="w-8 h-8" />
          </div>
          <p className="text-center text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 border rounded text-[#2F6FDD]"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  /* ----------------------------------
   * Main UI
   * ---------------------------------- */
  return (
    <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#2B2B2B] p-6 rounded-lg flex flex-col items-center gap-5 w-full max-w-md">
        <p className="text-xl">Google</p>

        <div
          className={`rounded-full p-5 transition ${
            listening ? 'bg-[#2F6FDD] animate-pulse scale-110' : 'bg-[#9aa0a6]'
          }`}
        >
          <img src={IMAGES.mic} className="w-8 h-8" />
        </div>

        <p className="text-sm text-[#5f6368]">
          {listening ? 'Listening…' : transcript ? 'Done' : 'Speak now'}
        </p>

        {transcript && (
          <p className="text-center text-lg px-4">{transcript}</p>
        )}
      </div>
    </div>
  )
}
