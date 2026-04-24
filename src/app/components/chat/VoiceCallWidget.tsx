"use client";

import { useEffect, useRef, useState } from "react";
import { X, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { BASE_URL } from "@/app/services/api";

// ----------------------------------------------------------------------
// PCM Player: Plays 16kHz raw PCM (Int16) received from WebSocket
// ----------------------------------------------------------------------
class PCMPlayer {
  private audioCtx: AudioContext | null = null;
  private nextTime: number = 0;
  private isPlaying: boolean = false;

  start() {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.isPlaying = true;
    this.nextTime = 0;
  }

  play(pcm16Data: Int16Array) {
    if (!this.isPlaying || !this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const float32Data = new Float32Array(pcm16Data.length);
    for (let i = 0; i < pcm16Data.length; i++) {
      float32Data[i] = pcm16Data[i] / 32768.0;
    }

    const buffer = this.audioCtx.createBuffer(1, float32Data.length, 16000);
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);

    if (this.nextTime < this.audioCtx.currentTime) {
      this.nextTime = this.audioCtx.currentTime;
    }
    source.start(this.nextTime);
    this.nextTime += buffer.duration;
  }

  stop() {
    this.isPlaying = false;
    this.nextTime = 0;
    this.audioCtx?.close();
    this.audioCtx = null;
  }
}

// ----------------------------------------------------------------------
// PCM Recorder: Captures mic at 16kHz and returns Int16 PCM chunks
// ----------------------------------------------------------------------
class PCMRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onData: (pcm: Int16Array) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    
    // Use ScriptProcessor for max compatibility converting to raw PCM
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      onData(pcm16);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close();
    
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioCtx = null;
  }
}

// ----------------------------------------------------------------------
// Main Widget Component
// ----------------------------------------------------------------------
export function VoiceCallWidget({ onClose }: { onClose: () => void }) {
  const { user, isAuthReady, isLoggedIn } = useAuth();
  
  const [status, setStatus] = useState<"connecting" | "active" | "error" | "ended">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const token = user?.token;

  // Initialize Call
  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !token) {
      setStatus("error");
      setErrorMsg("Please log in to use the AI Voice Call feature.");
      return;
    }

    startCall(token);

    // Timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isLoggedIn, token]);

  const startCall = async (authToken: string) => {
    try {
      // 1. Initialize Player & Recorder
      playerRef.current = new PCMPlayer();
      playerRef.current.start();

      recorderRef.current = new PCMRecorder();

      const wsUrl = `wss://ndeefapp.runasp.net/api/voice/socket?access_token=${authToken}`;
      console.log("Connecting to WebSocket at:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = async () => {
        setStatus("active");
        
        // Start recording mic
        try {
          await recorderRef.current?.start((pcmData) => {
            if (ws.readyState === WebSocket.OPEN && !isMuted) {
              ws.send(pcmData.buffer);
            }
          });
        } catch (err) {
          console.error("Mic error:", err);
          setStatus("error");
          setErrorMsg("Microphone access denied or unavailable.");
          endCall();
        }
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Play received audio chunk
          const pcm16 = new Int16Array(event.data);
          playerRef.current?.play(pcm16);
        } else if (typeof event.data === "string") {
          // Handle JSON control messages (e.g., interrupted)
          try {
            const data = JSON.parse(event.data);
            if (data.type === "interrupted") {
              // Stop current audio playback to allow the AI to restart
              playerRef.current?.stop();
              playerRef.current?.start(); // Re-init for next audio chunks
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error details:", e);
        setStatus("error");
        setErrorMsg(`Connection refused to ${backendHost}. Is the backend running?`);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed: code=${event.code}, reason='${event.reason}', wasClean=${event.wasClean}`);
        if (status !== "error") {
          if (event.code === 1006) {
            setStatus("error");
            setErrorMsg(`Server disconnected (Error 1006). If using the remote server, it might be rejecting the token. If using local, make sure it's running on ${backendHost}.`);
          } else {
            setStatus("ended");
          }
        }
        cleanup();
      };
    } catch (err) {
      setStatus("error");
      setErrorMsg("Failed to start the call.");
      cleanup();
    }
  };

  const endCall = () => {
    setStatus("ended");
    cleanup();
    setTimeout(onClose, 1500); // Close widget after a brief delay
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    playerRef.current?.stop();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center transition-all">
      <div className="w-full max-w-sm flex flex-col items-center p-6 text-center">
        
        {/* Header / Avatar */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#1D6076] to-[#40A5C2] p-1 shadow-2xl relative z-10 overflow-hidden flex items-center justify-center">
            {/* You could put an image of the AI assistant here */}
            <span className="text-4xl font-bold text-white">Nody</span>
          </div>
          
          {/* Pulsing rings when active */}
          {status === "active" && !isMuted && (
            <>
              <div className="absolute inset-0 bg-[#40A5C2] rounded-full animate-ping opacity-30"></div>
              <div className="absolute -inset-4 bg-[#1D6076] rounded-full animate-pulse opacity-20"></div>
            </>
          )}
        </div>

        {/* Status Text */}
        <h2 className="text-2xl font-bold text-white tracking-wide mb-2">
          AI Assistant
        </h2>
        
        <div className="h-8 mb-12">
          {status === "connecting" && (
            <div className="flex items-center gap-2 text-[#40A5C2] font-medium">
              <Loader2 size={18} className="animate-spin" />
              <span>Connecting...</span>
            </div>
          )}
          {status === "active" && (
            <p className="text-white/80 font-mono text-lg">{formatTime(callDuration)}</p>
          )}
          {status === "ended" && (
            <p className="text-red-400 font-medium">Call Ended</p>
          )}
          {status === "error" && (
            <p className="text-red-500 font-medium text-sm px-4">{errorMsg}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            disabled={status !== "active"}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isMuted 
                ? "bg-white text-gray-900" 
                : "bg-gray-800/60 text-white hover:bg-gray-700/80"
            } ${status !== "active" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-transform active:scale-95 shadow-xl shadow-red-500/20"
          >
            <PhoneOff size={28} />
          </button>
        </div>

        {/* Close Button (Top right if error/ended) */}
        {(status === "error" || status === "ended") && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 p-2 rounded-full"
          >
            <X size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
