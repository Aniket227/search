import { useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition
} from "react-speech-recognition";
import { IMAGES } from "../constants/images";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

// const isAndroid = /Android/i.test(navigator.userAgent);

export default function SpeechToText({
  isOpen,
  onClose,
  onTranscript
}: Props) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------
     START LISTENING (ONLY ONCE)
  --------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    if (!browserSupportsSpeechRecognition) {
      setError("Speech recognition not supported on this browser");
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    resetTranscript();
    setError(null);

    // Android needs a delay
    const start = async () => {
      await new Promise(r => setTimeout(r, 700));

      try {
        SpeechRecognition.startListening({
          continuous: false,        // ✅ REQUIRED
          interimResults: false,    // ✅ REQUIRED
          language: "en-US"
        });
      } catch {
        setError("Failed to start microphone");
      }
    };

    start();

    return () => {
      SpeechRecognition.stopListening();
      startedRef.current = false;
    };
  }, [isOpen, browserSupportsSpeechRecognition, resetTranscript]);

  /* ---------------------------------------------------
     ANDROID: WAIT FOR AUTO STOP → FINAL RESULT
  --------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    // Android stops automatically after speech
    if (!listening && transcript.trim()) {
      onTranscript(transcript.trim());
      resetTranscript();
      onClose();
    }
  }, [listening, transcript, isOpen, onTranscript, resetTranscript, onClose]);

  if (!isOpen) return null;

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-[#00000080] z-50 flex items-center justify-center px-2">
      <div className="bg-white dark:bg-[#2B2B2B] w-full md:w-2/3 lg:w-1/2 p-6 rounded-lg flex flex-col items-center gap-5">
        <p className="text-2xl text-black dark:text-white">Google</p>

        <div
          className={`rounded-full p-5 transition-all ${
            listening ? "bg-[#2F6FDD] animate-pulse scale-110" : "bg-[#9aa0a6]"
          }`}
        >
          <img src={IMAGES.mic} alt="mic" className="w-8 h-8" />
        </div>

        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          {listening ? "Listening..." : "Speak now"}
        </p>

        {error && (
          <p className="text-red-500 text-center text-sm px-4">{error}</p>
        )}

        {listening && (
          <button
            onClick={() => SpeechRecognition.stopListening()}
            className="mt-4 px-6 py-2 bg-[#2F6FDD] text-white rounded-lg"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
