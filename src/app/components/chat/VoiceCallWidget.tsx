"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, PhoneOff, Mic, MicOff, Loader2, Sparkles, Volume2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Monogram } from "@/app/components/brand/Monogram";

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
const CHUNK_SAMPLES = 2048;

function float32ToPcm16(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === INPUT_RATE) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  const ratio = inputRate / INPUT_RATE;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = Math.min(input.length - 1, Math.floor(i * ratio));
    const s = Math.max(-1, Math.min(1, input[idx]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

class PCMPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;

  async start() {
    this.ctx = new AudioContext({ sampleRate: OUTPUT_RATE });
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.nextTime = this.ctx.currentTime;
  }

  async play(pcm16: Int16Array) {
    if (!this.ctx || pcm16.length === 0) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    const floats = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) floats[i] = pcm16[i] / 32768;

    const buffer = this.ctx.createBuffer(1, floats.length, OUTPUT_RATE);
    buffer.getChannelData(0).set(floats);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (this.nextTime < now) this.nextTime = now + 0.02;
    source.start(this.nextTime);
    this.nextTime += buffer.duration;
  }

  flush() {
    if (this.ctx) this.nextTime = this.ctx.currentTime;
  }

  stop() {
    void this.ctx?.close();
    this.ctx = null;
    this.nextTime = 0;
  }
}

class PCMRecorder {
  private ctx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private inputRate = INPUT_RATE;

  async start(stream: MediaStream, onPcm: (pcm: Int16Array) => void) {
    this.ctx = new AudioContext();
    this.inputRate = this.ctx.sampleRate;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    this.source = this.ctx.createMediaStreamSource(stream);
    this.processor = this.ctx.createScriptProcessor(CHUNK_SAMPLES, 1, 1);
    this.silentGain = this.ctx.createGain();
    this.silentGain.gain.value = 0;

    this.processor.onaudioprocess = (e) => {
      const channel = e.inputBuffer.getChannelData(0);
      onPcm(float32ToPcm16(channel, this.inputRate));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.ctx.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.silentGain?.disconnect();
    void this.ctx?.close();
    this.processor = null;
    this.source = null;
    this.silentGain = null;
    this.ctx = null;
  }
}

function buildVoiceWebSocketUrl(token: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/$/, "")}/api/voice/socket?access_token=${encodeURIComponent(token)}`;
  }
  const httpBase =
    process.env.NEXT_PUBLIC_NDEEF_BACKEND_URL?.trim() ??
    process.env.NDEEF_BACKEND_URL?.trim() ??
    "https://ndeefapp-api.icydune-2fcf3dd1.germanywestcentral.azurecontainerapps.io";
  const wsBase = httpBase.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  return `${wsBase.replace(/\/$/, "")}/api/voice/socket?access_token=${encodeURIComponent(token)}`;
}

type VoiceMsg = {
  type: string;
  text?: string;
  message?: string;
  role?: "user" | "assistant";
  bytesReceived?: number;
  outputSampleRate?: number;
};

export function VoiceCallWidget({ onClose }: { onClose: () => void }) {
  const { user, isAuthReady, isLoggedIn } = useAuth();

  const [status, setStatus] = useState<"connecting" | "active" | "error" | "ended">("connecting");
  const statusRef = useRef(status);
  statusRef.current = status;

  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [callDuration, setCallDuration] = useState(0);
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [micBytesReceived, setMicBytesReceived] = useState(0);
  const [heardYou, setHeardYou] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const micStartedRef = useRef(false);

  const token = user?.token;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userTranscript, assistantTranscript]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    playerRef.current?.stop();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    micStartedRef.current = false;
  }, []);

  const startMicStreaming = useCallback((ws: WebSocket, stream: MediaStream) => {
    if (micStartedRef.current) return;
    micStartedRef.current = true;
    recorderRef.current = new PCMRecorder();
    void recorderRef.current.start(stream, (pcm) => {
      if (ws.readyState !== WebSocket.OPEN || isMutedRef.current) return;
      ws.send(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
    });
  }, []);

  const handleServerMessage = useCallback(
    (data: VoiceMsg, ws: WebSocket) => {
      switch (data.type) {
        case "ready":
          if (data.outputSampleRate && data.outputSampleRate !== OUTPUT_RATE) {
            console.warn("Unexpected output sample rate:", data.outputSampleRate);
          }
          statusRef.current = "active";
          setStatus("active");
          setIsListening(true);
          if (micStreamRef.current) startMicStreaming(ws, micStreamRef.current);
          break;
        case "listening":
          setIsListening(true);
          setIsAssistantSpeaking(false);
          if (typeof data.bytesReceived === "number") setMicBytesReceived(data.bytesReceived);
          break;
        case "speaking":
          setIsAssistantSpeaking(true);
          setIsListening(false);
          break;
        case "caption":
          if (data.role === "user" && data.text) {
            setUserTranscript(data.text);
            setHeardYou(true);
          } else if (data.role === "assistant" && data.text) {
            setAssistantTranscript(data.text);
          }
          break;
        case "inputTranscript":
          if (data.text) {
            setUserTranscript(data.text);
            setHeardYou(true);
          }
          break;
        case "outputTranscript":
          if (data.text) {
            setAssistantTranscript((prev) => {
              if (!prev) return data.text!;
              if (data.text!.startsWith(prev)) return data.text!;
              return `${prev}${data.text}`;
            });
          }
          break;
        case "turnComplete":
          setIsAssistantSpeaking(false);
          setIsListening(true);
          playerRef.current?.flush();
          break;
        case "interrupted":
          playerRef.current?.stop();
          playerRef.current = new PCMPlayer();
          void playerRef.current.start();
          setIsAssistantSpeaking(false);
          setIsListening(true);
          break;
        case "error":
          statusRef.current = "error";
          setStatus("error");
          setErrorMsg(data.message || "Server error");
          cleanup();
          break;
      }
    },
    [cleanup, startMicStreaming],
  );

  const startCall = useCallback(
    async (authToken: string) => {
      try {
        playerRef.current = new PCMPlayer();
        await playerRef.current.start();

        const [micStream, ws] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          }),
          new Promise<WebSocket>((resolve, reject) => {
            const socket = new WebSocket(buildVoiceWebSocketUrl(authToken));
            socket.binaryType = "arraybuffer";
            const timeout = setTimeout(() => reject(new Error("WebSocket timeout")), 20000);
            socket.onopen = () => {
              clearTimeout(timeout);
              resolve(socket);
            };
            socket.onerror = () => {
              clearTimeout(timeout);
              reject(new Error("WebSocket failed"));
            };
          }),
        ]);

        micStreamRef.current = micStream;
        wsRef.current = ws;

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            playerRef.current?.play(new Int16Array(event.data));
            return;
          }
          if (typeof event.data !== "string") return;
          try {
            handleServerMessage(JSON.parse(event.data) as VoiceMsg, ws);
          } catch {
            // ignore malformed message
          }
        };

        ws.onerror = () => {
          setStatus("error");
          setErrorMsg("Unable to connect to the voice server right now.");
          cleanup();
        };

        ws.onclose = (event) => {
          if (statusRef.current === "error") return;
          if (event.code !== 1000) {
            statusRef.current = "error";
            setStatus("error");
            setErrorMsg(
              event.code === 1006
                ? "The connection dropped. Please try again."
                : `Call ended unexpectedly (code ${event.code}).`,
            );
          } else {
            statusRef.current = "ended";
            setStatus("ended");
            setTimeout(onClose, 1200);
          }
          cleanup();
        };
      } catch (error) {
        statusRef.current = "error";
        setStatus("error");
        const message = error instanceof Error ? error.message : "";
        setErrorMsg(
          message.includes("Permission") || message.includes("NotAllowed")
            ? "Please allow microphone access in your browser settings."
            : "We could not start the voice assistant. Please try again.",
        );
        cleanup();
      }
    },
    [cleanup, handleServerMessage, onClose],
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn || !token) {
      setStatus("error");
      setErrorMsg("Please sign in first to use the Nazeef voice assistant.");
      return;
    }

    void startCall(token);
    timerRef.current = setInterval(() => setCallDuration((previous) => previous + 1), 1000);
    return () => cleanup();
  }, [isAuthReady, isLoggedIn, token, startCall, cleanup]);

  const endCall = () => {
    statusRef.current = "ended";
    setStatus("ended");
    wsRef.current?.close(1000, "User ended");
    cleanup();
    setTimeout(onClose, 800);
  };

  const toggleMute = () => {
    setIsMuted((muted) => {
      isMutedRef.current = !muted;
      return !muted;
    });
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="ndeef-voice-widget fixed inset-0 z-[70] flex items-center justify-center bg-white/82 p-4 backdrop-blur-md">
      <div className="ndeef-voice-card relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
        <div className="ndeef-voice-glow pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(64,165,194,0.16),transparent_70%)]" />

        <div className="relative mb-4 mt-1">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-[#1D6076] via-[#2d89a3] to-[#40A5C2] p-1.5 shadow-[0_0_42px_rgba(64,165,194,0.30)]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-slate-200 bg-white">
              <Monogram variant="orange" size={56} className="mb-2" useImage={true} />
              {status === "active" && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-[0.24em] text-emerald-300">
                  LIVE
                </span>
              )}
            </div>
          </div>
          {status === "active" && isListening && !isMuted && (
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin" />
          )}
        </div>

        <div className="mb-1 flex items-center gap-2">
          <h2
            className="text-2xl font-black tracking-[0.08em] text-slate-950"
            style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
          >
            NAZEEF
          </h2>
          <Sparkles className="h-4 w-4 text-cyan-400" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#1D6076]/70">
          AI Voice Assistant
        </p>

        <div className="mb-4 min-h-9 text-sm">
          {status === "connecting" && (
            <span className="flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
            </span>
          )}
          {status === "active" && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono text-slate-500">{formatTime(callDuration)}</span>
              {isAssistantSpeaking && <span className="text-xs text-cyan-400">Nazeef is responding...</span>}
              {isListening && !isMuted && <span className="text-xs text-emerald-400">Listening now...</span>}
              {isMuted && <span className="text-xs text-yellow-400">Microphone muted</span>}
            </div>
          )}
          {status === "error" && <p className="px-2 text-xs text-red-400">{errorMsg}</p>}
        </div>

        <div className="mb-5 w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">Live Transcript</span>
            {status === "active" && !isMuted && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  heardYou
                    ? "bg-emerald-500/25 text-emerald-300"
                    : micBytesReceived > 500
                      ? "bg-cyan-500/25 text-cyan-300"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {heardYou ? "Heard you" : micBytesReceived > 500 ? "Mic active" : "Start talking"}
              </span>
            )}
          </div>

          <div className="ndeef-voice-transcript h-48 space-y-3 overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbfd,#ffffff)] p-4 text-right shadow-inner shadow-slate-200/70">
            <div className="ndeef-voice-transcript-user rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3">
              <p className="mb-1 flex items-center justify-end gap-1 text-[10px] font-bold text-cyan-400">
                <Mic className="h-3 w-3" /> You
              </p>
              <p className="text-sm leading-relaxed text-slate-700" dir="auto">
                {userTranscript || (
                  <span className="italic text-slate-400">
                    {micBytesReceived > 500 ? "Speak now..." : "Waiting for your voice..."}
                  </span>
                )}
              </p>
            </div>

            <div className="ndeef-voice-transcript-assistant rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
              <p className="mb-1 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-400">
                <Volume2 className="h-3 w-3" /> Nazeef
              </p>
              <p className="text-sm leading-relaxed text-[#1D6076]" dir="auto">
                {assistantTranscript || (
                  <span className="italic text-slate-400">
                    {isAssistantSpeaking ? "Preparing response..." : "Nazeef will reply here"}
                  </span>
                )}
              </p>
            </div>
            <div ref={transcriptEndRef} />
          </div>
        </div>

        <div className="flex gap-5">
          <button
            type="button"
            onClick={toggleMute}
            disabled={status !== "active"}
            className={`ndeef-voice-mute-button flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-all ${
              isMuted
                ? "bg-yellow-500 text-black shadow-yellow-500/20"
                : "border-slate-200 bg-white text-slate-700 shadow-slate-200/80"
            } disabled:opacity-40`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button
            type="button"
            onClick={endCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_14px_32px_rgba(220,38,38,0.45)] transition-transform hover:scale-[1.03]"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        {(status === "error" || status === "ended") && (
          <button type="button" onClick={onClose} className="absolute left-4 top-4 p-2 text-slate-400 transition hover:text-slate-700">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
