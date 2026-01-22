// import { useEffect, useRef, useState } from "react";
// import SpeechRecognition, {
//   useSpeechRecognition
// } from "react-speech-recognition";
// import { IMAGES } from "../constants/images";

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   onTranscript: (text: string) => void;
// }

// // const isAndroid = /Android/i.test(navigator.userAgent);

// export default function SpeechToText({
//   isOpen,
//   onClose,
//   onTranscript
// }: Props) {
//   const {
//     transcript,
//     listening,
//     resetTranscript,
//     browserSupportsSpeechRecognition
//   } = useSpeechRecognition();

//   const startedRef = useRef(false);
//   const [error, setError] = useState<string | null>(null);

//   /* ---------------------------------------------------
//      START LISTENING (ONLY ONCE)
//   --------------------------------------------------- */
//   useEffect(() => {
//     if (!isOpen) return;

//     if (!browserSupportsSpeechRecognition) {
//       setError("Speech recognition not supported on this browser");
//       return;
//     }

//     if (startedRef.current) return;
//     startedRef.current = true;

//     resetTranscript();
//     setError(null);

//     // Android needs a delay
//     const start = async () => {
//       await new Promise(r => setTimeout(r, 700));

//       try {
//         SpeechRecognition.startListening({
//           continuous: false,        // ✅ REQUIRED
//           interimResults: false,    // ✅ REQUIRED
//           language: "en-US"
//         });
//       } catch {
//         setError("Failed to start microphone");
//       }
//     };

//     start();

//     return () => {
//       SpeechRecognition.stopListening();
//       startedRef.current = false;
//     };
//   }, [isOpen, browserSupportsSpeechRecognition, resetTranscript]);

//   /* ---------------------------------------------------
//      ANDROID: WAIT FOR AUTO STOP → FINAL RESULT
//   --------------------------------------------------- */
//   useEffect(() => {
//     if (!isOpen) return;

//     // Android stops automatically after speech
//     if (!listening && transcript.trim()) {
//       onTranscript(transcript.trim());
//       resetTranscript();
//       onClose();
//     }
//   }, [listening, transcript, isOpen, onTranscript, resetTranscript, onClose]);

//   if (!isOpen) return null;

//   /* ---------------------------------------------------
//      UI
//   --------------------------------------------------- */
//   return (
//     <div className="fixed inset-0 bg-[#00000080] z-50 flex items-center justify-center px-2">
//       <div className="bg-white dark:bg-[#2B2B2B] w-full md:w-2/3 lg:w-1/2 p-6 rounded-lg flex flex-col items-center gap-5">
//         <p className="text-2xl text-black dark:text-white">Google</p>

//         <div
//           className={`rounded-full p-5 transition-all ${
//             listening ? "bg-[#2F6FDD] animate-pulse scale-110" : "bg-[#9aa0a6]"
//           }`}
//         >
//           <img src={IMAGES.mic} alt="mic" className="w-8 h-8" />
//         </div>

//         <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
//           {listening ? "Listening..." : "Speak now"}
//         </p>

//         {error && (
//           <p className="text-red-500 text-center text-sm px-4">{error}</p>
//         )}

//         {listening && (
//           <button
//             onClick={() => SpeechRecognition.stopListening()}
//             className="mt-4 px-6 py-2 bg-[#2F6FDD] text-white rounded-lg"
//           >
//             Stop
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

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

const isAndroid = /Android/i.test(navigator.userAgent);

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
  const listenStartTimeRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------
     CHECK MICROPHONE PERMISSION
  --------------------------------------------------- */
  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow access and try again.");
      } else {
        setError("Unable to access microphone.");
      }
      return false;
    }
  };

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
    listenStartTimeRef.current = null;

    const start = async () => {
      const hasPermission = await checkMicPermission();
      if (!hasPermission) return;

      // Android needs a warm-up delay
      await new Promise(r => setTimeout(r, isAndroid ? 700 : 300));

      try {
        SpeechRecognition.startListening({
          continuous: false,        // ✅ REQUIRED for Android
          interimResults: false,    // ✅ REQUIRED
          language: "en-US"
        });

        listenStartTimeRef.current = Date.now();
      } catch {
        setError("Failed to start microphone");
      }
    };

    start();

    return () => {
      SpeechRecognition.stopListening();
      startedRef.current = false;
      listenStartTimeRef.current = null;
    };
  }, [isOpen, browserSupportsSpeechRecognition, resetTranscript]);

  /* ---------------------------------------------------
     ANDROID AUTO STOP → RESULT / ERROR
  --------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    // ✅ Success case
    if (!listening && transcript.trim()) {
      onTranscript(transcript.trim());
      resetTranscript();
      onClose();
      return;
    }

    // ❌ No speech (time-gated to avoid first-open bug)
    if (
      !listening &&
      startedRef.current &&
      listenStartTimeRef.current &&
      Date.now() - listenStartTimeRef.current > 1200 &&
      !transcript.trim()
    ) {
      setError("No speech detected. Please try again.");
    }
  }, [listening, transcript, isOpen, onTranscript, resetTranscript, onClose]);

  /* ---------------------------------------------------
     RETRY
  --------------------------------------------------- */
  const handleRetry = async () => {
    setError(null);
    resetTranscript();
    startedRef.current = false;
    listenStartTimeRef.current = null;

    const hasPermission = await checkMicPermission();
    if (!hasPermission) return;

    await new Promise(r => setTimeout(r, 500));

    SpeechRecognition.startListening({
      continuous: false,
      interimResults: false,
      language: "en-US"
    });

    startedRef.current = true;
    listenStartTimeRef.current = Date.now();
  };

  if (!isOpen) return null;

  /* ---------------------------------------------------
     ERROR UI
  --------------------------------------------------- */
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#00000080] z-50 flex items-center justify-center px-2">
        <div className="bg-white dark:bg-[#2B2B2B] w-full md:w-2/3 lg:w-1/2 p-6 rounded-lg flex flex-col items-center gap-5">
          <p className="text-2xl text-black dark:text-white">Google</p>

          <div className="rounded-full bg-red-500 p-5">
            <img src={IMAGES.mic} alt="mic" className="w-8 h-8" />
          </div>

          <p className="text-sm text-center text-black dark:text-white px-4">
            {error}
          </p>

          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-white text-[#2F6FDD] border border-[#DEDEDE] rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------
     MAIN UI (UNCHANGED)
  --------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-[#00000080] z-50 flex items-center justify-center px-2">
      <div className="bg-white dark:bg-[#2B2B2B] w-full md:w-2/3 lg:w-1/2 p-6 rounded-lg flex flex-col items-center gap-5">
        <p className="text-2xl text-black dark:text-white">Google</p>

        <div
          className={`rounded-full p-5 transition-all ${
            listening
              ? "bg-[#2F6FDD] animate-pulse scale-110"
              : "bg-[#9aa0a6]"
          }`}
        >
          <img src={IMAGES.mic} alt="mic" className="w-8 h-8" />
        </div>

        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          {listening ? "Listening..." : "Speak now"}
        </p>
      </div>
    </div>
  );
}
