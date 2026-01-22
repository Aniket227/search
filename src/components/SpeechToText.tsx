import { useEffect, useState, useRef, useCallback } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { IMAGES } from '../constants/images'

interface SpeechToTextProps {
    isOpen: boolean
    onClose: () => void
    onTranscript: (text: string) => void
}

export default function SpeechToText({ isOpen, onClose, onTranscript }: SpeechToTextProps) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition()

    const [isListening, setIsListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const silenceTimerRef = useRef<number | null>(null)
    const inactivityTimerRef = useRef<number | null>(null)
    const hasStartedListeningRef = useRef(false)
    const transcriptRef = useRef<string>('')
    const listeningRef = useRef<boolean>(false)

    // Check microphone permission
    const checkMicrophonePermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow microphone access and try again.')
                return false
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.')
                return false
            } else {
                setError('Failed to access microphone. Please check your settings.')
                return false
            }
        }
    }, [])

    useEffect(() => {
        if (isOpen) {
            if (browserSupportsSpeechRecognition) {
                resetTranscript()
                setError(null)
                hasStartedListeningRef.current = false

                // Check microphone permission first
                checkMicrophonePermission().then((hasPermission) => {
                    if (hasPermission) {
                        try {
                            SpeechRecognition.startListening({
                                continuous: true,
                                language: 'en-US',
                                interimResults: true
                            })
                            hasStartedListeningRef.current = true

                            // Set inactivity timer - show error if no speech after 6 seconds
                            inactivityTimerRef.current = setTimeout(() => {
                                // Check if we still have no transcript after timeout
                                if (transcriptRef.current.trim().length === 0) {
                                    setError('No speech detected. Please try speaking again.')
                                    SpeechRecognition.stopListening()
                                }
                            }, 5000)
                        } catch (err) {
                            setError('Failed to start microphone. Please check your permissions.')
                            console.error('Speech recognition error:', err)
                        }
                    }
                })
            } else {
                setError('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.')
            }
        } else {
            SpeechRecognition.stopListening()
            resetTranscript()
            hasStartedListeningRef.current = false
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
            }
        }

        return () => {
            if (isOpen) {
                SpeechRecognition.stopListening()
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
            }
        }
    }, [isOpen, browserSupportsSpeechRecognition, resetTranscript, checkMicrophonePermission])

    const handleDone = useCallback(() => {
        SpeechRecognition.stopListening()
        if (transcript.trim()) {
            onTranscript(transcript.trim())
        }
        resetTranscript()
        onClose()
    }, [transcript, onTranscript, resetTranscript, onClose])

    useEffect(() => {
        transcriptRef.current = transcript
    }, [transcript])

    useEffect(() => {
        listeningRef.current = listening
        setIsListening(listening)

        // Clear inactivity timer if user starts speaking
        if (listening && transcript && transcript.trim().length > 0) {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
                inactivityTimerRef.current = null
            }
        }
    }, [listening, transcript])

    // Auto-search after 2 seconds of silence (when transcript stops changing)
    useEffect(() => {
        if (listening && transcript && transcript.trim().length > 0) {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }

            silenceTimerRef.current = window.setTimeout(() => {
                if (transcriptRef.current.trim().length > 0 && listeningRef.current) {
                    handleDone()
                }
            }, 2000)
        } else if (!listening && transcript && transcript.trim().length > 0) {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }
            silenceTimerRef.current = window.setTimeout(() => {
                handleDone()
            }, 500) 
        }

        // Cleanup
        return () => {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }
        }
    }, [transcript, listening, handleDone])

    // const handleCancel = () => {
    //     SpeechRecognition.stopListening()
    //     resetTranscript()
    //     if (silenceTimerRef.current) {
    //         clearTimeout(silenceTimerRef.current)
    //     }
    //     if (inactivityTimerRef.current) {
    //         clearTimeout(inactivityTimerRef.current)
    //     }
    //     onClose()
    // }

    const handleRetry = async () => {
        setError(null)
        resetTranscript()
        hasStartedListeningRef.current = false

        const hasPermission = await checkMicrophonePermission()
        if (hasPermission) {
            try {
                SpeechRecognition.startListening({
                    continuous: false,
                    language: 'en-US',
                    interimResults: true
                })
                hasStartedListeningRef.current = true

                // Reset inactivity timer
                if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current)
                }
                transcriptRef.current = '' // Reset transcript ref
                inactivityTimerRef.current = window.setTimeout(() => {
                    if (transcriptRef.current.trim().length === 0) {
                        setError('No speech detected. Please try speaking again.')
                        SpeechRecognition.stopListening()
                    }
                }, 6000)
            } catch (err) {
                setError('Failed to start microphone. Please check your permissions.')
                console.error('Speech recognition error:', err)
            }
        }
    }

    if (!isOpen) return null

    // Show error state
    if (error || !browserSupportsSpeechRecognition) {
        const isPermissionError = error?.includes('permission') || error?.includes('Permission')
        const isNoSpeechError = error?.includes('No speech detected')

        return (
            <div className='w-full h-screen flex flex-col items-center justify-center bg-[#00000080] fixed inset-0 px-2 z-50'>
                <div className='bg-white dark:bg-[#2B2B2B] w-full lg:w-1/2 md:w-2/3 h-auto p-6 rounded-lg flex flex-col items-center justify-center gap-5'>
                    <p className='text-black dark:text-white text-2xl font-normal'>Google</p>
                    <div className='rounded-full bg-red-500 p-5'>
                        <img src={IMAGES.mic} alt='mic' className='w-8 h-8 object-contain' />
                    </div>
                    <p className='text-black dark:text-white text-center text-sm px-4'>{error || 'Speech recognition not supported'}</p>
                    {(isPermissionError || isNoSpeechError) && (
                        <button
                            onClick={handleRetry}
                            className='px-6 py-2 bg-white text-[#2F6FDD] rounded-lg border border-[#DEDEDE] text-sm'
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className='w-full h-screen flex flex-col items-center justify-center bg-[#00000080] fixed inset-0 px-2 z-50'>
            <div className='bg-white dark:bg-[#2B2B2B] w-full lg:w-1/2 md:w-2/3 h-auto p-6 rounded-lg flex flex-col items-center justify-center gap-5'>
                <p className='text-black dark:text-white text-2xl font-normal'>Google</p>

                {/* Animated microphone */}
                <div className={`rounded-full ${isListening ? 'bg-[#2F6FDD] animate-pulse' : 'bg-[#9aa0a6]'} p-5 transition-all duration-300 ${isListening ? 'scale-110' : 'scale-100'}`}>
                    <img
                        src={IMAGES.mic}
                        alt='mic'
                        className={`w-8 h-8 object-contain transition-transform duration-300 ${isListening ? 'scale-110' : 'scale-100'}`}
                    />
                </div>

                {/* Status text */}
                <div className='flex flex-col items-center gap-2 min-h-[60px]'>
                    {isListening ? (
                        <p className='text-[#5f6368] dark:text-[#9aa0a6] text-sm'>Listening...</p>
                    ) : transcript ? (
                        <p className='text-[#5f6368] dark:text-[#9aa0a6] text-sm'>Done</p>
                    ) : (
                        <p className='text-[#5f6368] dark:text-[#9aa0a6] text-sm'>Speak now</p>
                    )}

                    {/* Transcript display */}
                    {transcript && (
                        <p className='text-black dark:text-white text-lg text-center px-4 max-w-full wrap-break-word'>
                            {transcript}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
